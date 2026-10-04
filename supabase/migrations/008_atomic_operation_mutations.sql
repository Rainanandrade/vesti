-- Edit/delete ledger entries and rebuild the affected position in one transaction.
-- Historical operations without wallet_id are only adopted after the client has
-- resolved a single unambiguous wallet for the symbol.

begin;

create or replace function public.mutate_operation_and_rebuild_position(
  p_operation_id uuid,
  p_action text,
  p_wallet_id uuid,
  p_quantity numeric default null,
  p_price numeric default null,
  p_fees numeric default 0,
  p_withholding_tax numeric default 0,
  p_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  target_operation public.operations%rowtype;
  current_asset public.assets%rowtype;
  movement public.operations%rowtype;
  normalized_symbol text;
  base_quantity numeric := 0;
  base_average numeric := 0;
  next_quantity numeric := 0;
  next_average numeric := 0;
  remaining_cost numeric := 0;
  position_type text;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_action not in ('update', 'delete') then
    raise exception 'invalid mutation action' using errcode = '22023';
  end if;

  perform 1 from public.wallets
    where id = p_wallet_id and user_id = uid
    for update;
  if not found then
    raise exception 'wallet not found or read only' using errcode = '42501';
  end if;

  select * into target_operation
    from public.operations
    where id = p_operation_id and user_id = uid
    for update;
  if target_operation.id is null then
    raise exception 'operation not found' using errcode = 'P0002';
  end if;
  if target_operation.wallet_id is not null and target_operation.wallet_id <> p_wallet_id then
    raise exception 'operation belongs to another wallet' using errcode = '42501';
  end if;
  if p_action = 'update' and (
    coalesce(p_quantity, 0) <= 0 or coalesce(p_price, 0) <= 0 or
    coalesce(p_fees, 0) < 0 or coalesce(p_withholding_tax, 0) < 0 or p_date is null
  ) then
    raise exception 'invalid operation values' using errcode = '22023';
  end if;

  normalized_symbol := upper(btrim(target_operation.symbol));
  position_type := case when target_operation.asset_type = 'daytrade' then 'acao' else target_operation.asset_type end;

  -- Day trades do not touch swing positions, but their ledger mutation is still atomic.
  if target_operation.asset_type = 'daytrade' then
    if p_action = 'delete' then
      delete from public.operations where id = p_operation_id and user_id = uid;
    else
      update public.operations set
        quantity = p_quantity, price = p_price, fees = coalesce(p_fees, 0),
        withholding_tax = coalesce(p_withholding_tax, 0), date = p_date,
        wallet_id = p_wallet_id
      where id = p_operation_id and user_id = uid;
    end if;
    return jsonb_build_object('ok', true, 'operation_id', p_operation_id);
  end if;

  select * into current_asset
    from public.assets
    where wallet_id = p_wallet_id and user_id = uid and upper(symbol) = normalized_symbol
    order by added_at asc, id asc
    limit 1
    for update;

  base_quantity := coalesce(current_asset.quantity, 0);
  base_average := coalesce(current_asset.avg_price, 0);

  -- Reverse the existing ledger newest-first to recover any manual position that
  -- existed before the recorded operations.
  for movement in
    select * from public.operations
    where user_id = uid
      and upper(symbol) = normalized_symbol
      and asset_type <> 'daytrade'
      and (wallet_id = p_wallet_id or wallet_id is null)
    order by date desc, created_at desc, id desc
    for update
  loop
    if movement.type = 'sell' then
      base_quantity := base_quantity + movement.quantity;
      if base_average = 0 then base_average := movement.price; end if;
    else
      if movement.quantity > base_quantity + 0.000000001 then
        raise exception 'historical ledger is inconsistent with the current position' using errcode = 'P0001';
      end if;
      next_quantity := base_quantity - movement.quantity;
      if next_quantity <= 0.000000001 then
        base_quantity := 0;
        base_average := 0;
      else
        remaining_cost := (base_quantity * base_average) - (movement.quantity * movement.price) - coalesce(movement.fees, 0);
        base_quantity := next_quantity;
        base_average := greatest(0, remaining_cost / next_quantity);
      end if;
    end if;
  end loop;

  if p_action = 'delete' then
    delete from public.operations where id = p_operation_id and user_id = uid;
  else
    update public.operations set
      quantity = p_quantity, price = p_price, fees = coalesce(p_fees, 0),
      withholding_tax = coalesce(p_withholding_tax, 0), date = p_date,
      wallet_id = p_wallet_id
    where id = p_operation_id and user_id = uid;
  end if;

  -- Once the app resolved this as the only possible wallet, bind the remaining
  -- legacy entries for this ticker so future rebuilds are fully deterministic.
  update public.operations
    set wallet_id = p_wallet_id
    where user_id = uid and wallet_id is null and upper(symbol) = normalized_symbol;

  next_quantity := base_quantity;
  next_average := base_average;
  for movement in
    select * from public.operations
    where user_id = uid and wallet_id = p_wallet_id
      and upper(symbol) = normalized_symbol and asset_type <> 'daytrade'
    order by date asc, created_at asc, id asc
  loop
    if movement.type = 'sell' then
      if movement.quantity > next_quantity + 0.000000001 then
        raise exception 'sale exceeds the available position on its date' using errcode = 'P0001';
      end if;
      next_quantity := next_quantity - movement.quantity;
      if next_quantity <= 0.000000001 then
        next_quantity := 0;
        next_average := 0;
      end if;
    else
      remaining_cost := (next_quantity * next_average) + (movement.quantity * movement.price) + coalesce(movement.fees, 0);
      next_quantity := next_quantity + movement.quantity;
      next_average := remaining_cost / next_quantity;
    end if;
  end loop;

  if next_quantity <= 0 then
    if current_asset.id is not null then delete from public.assets where id = current_asset.id; end if;
  elsif current_asset.id is null then
    insert into public.assets (wallet_id, user_id, symbol, name, type, quantity, avg_price)
    values (p_wallet_id, uid, normalized_symbol, normalized_symbol, position_type, next_quantity, next_average);
  else
    update public.assets set quantity = next_quantity, avg_price = next_average
      where id = current_asset.id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'operation_id', p_operation_id,
    'quantity', next_quantity,
    'avg_price', next_average
  );
end;
$$;

revoke all on function public.mutate_operation_and_rebuild_position(uuid, text, uuid, numeric, numeric, numeric, numeric, date) from public, anon;
grant execute on function public.mutate_operation_and_rebuild_position(uuid, text, uuid, numeric, numeric, numeric, numeric, date) to authenticated;

commit;
