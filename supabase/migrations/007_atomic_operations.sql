-- Atomic and idempotent operation recording.
-- The ledger and the current position must never diverge, even after a retry.

begin;

alter table public.operations
  add column if not exists wallet_id uuid references public.wallets(id) on delete set null,
  add column if not exists client_request_id uuid,
  add column if not exists client_payload_hash text;

create unique index if not exists operations_user_client_request_uidx
  on public.operations(user_id, client_request_id)
  where client_request_id is not null;

create or replace function public.record_operation_and_update_position(
  p_client_request_id uuid,
  p_payload_hash text,
  p_wallet_id uuid,
  p_type text,
  p_symbol text,
  p_asset_type text,
  p_quantity numeric,
  p_price numeric,
  p_fees numeric,
  p_withholding_tax numeric,
  p_date date,
  p_name text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  operation_id uuid;
  stored_payload_hash text;
  stored_notes text;
  legacy_payload jsonb;
  legacy_target jsonb;
  current_asset public.assets%rowtype;
  normalized_symbol text := upper(btrim(p_symbol));
  position_type text := case when p_asset_type = 'daytrade' then 'acao' else p_asset_type end;
  next_quantity numeric;
  next_average numeric;
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_client_request_id is null or coalesce(p_payload_hash, '') = '' then
    raise exception 'client request id and payload hash are required' using errcode = '22023';
  end if;
  if p_type not in ('buy', 'sell') or p_asset_type not in ('acao', 'fii', 'etf', 'daytrade') then
    raise exception 'invalid operation type' using errcode = '22023';
  end if;
  if normalized_symbol = '' or p_quantity <= 0 or p_price <= 0 or coalesce(p_fees, 0) < 0 or coalesce(p_withholding_tax, 0) < 0 then
    raise exception 'invalid operation values' using errcode = '22023';
  end if;

  -- Lock the owned wallet so concurrent operations serialize safely.
  perform 1
    from public.wallets
    where id = p_wallet_id and user_id = uid
    for update;
  if not found then
    raise exception 'wallet not found or read only' using errcode = '42501';
  end if;

  insert into public.operations (
    id, user_id, wallet_id, client_request_id, client_payload_hash, type, symbol, asset_type,
    quantity, price, fees, withholding_tax, date
  ) values (
    p_client_request_id, uid, p_wallet_id, p_client_request_id, p_payload_hash, p_type, normalized_symbol, p_asset_type,
    p_quantity, p_price, coalesce(p_fees, 0), coalesce(p_withholding_tax, 0), p_date
  )
  on conflict (id)
  do nothing
  returning id into operation_id;

  -- The same request may be safely retried after a client timeout.
  if operation_id is null then
    select id, client_payload_hash, notes into operation_id, stored_payload_hash, stored_notes
      from public.operations
      where user_id = uid and id = p_client_request_id;
    if stored_payload_hash is null and stored_notes like 'vesti-operation:%' then
      begin
        legacy_payload := substring(stored_notes from length('vesti-operation:') + 1)::jsonb;
        stored_payload_hash := legacy_payload ->> 'fingerprint';
      exception when others then
        stored_payload_hash := null;
      end;
    end if;
    if operation_id is null or stored_payload_hash is distinct from p_payload_hash then
      raise exception 'request id was already used with different operation data' using errcode = '22023';
    end if;
    if legacy_payload is not null then
      update public.operations
        set wallet_id = p_wallet_id, client_request_id = p_client_request_id, client_payload_hash = p_payload_hash
        where id = operation_id;
      legacy_target := legacy_payload -> 'target';
      if legacy_target is not null and legacy_target <> 'null'::jsonb then
        select * into current_asset
          from public.assets
          where wallet_id = p_wallet_id and user_id = uid and upper(symbol) = normalized_symbol
          order by added_at asc, id asc limit 1 for update;
        next_quantity := (legacy_target ->> 'quantity')::numeric;
        next_average := (legacy_target ->> 'avgPrice')::numeric;
        if next_quantity <= 0 and current_asset.id is not null then
          delete from public.assets where id = current_asset.id;
        elsif next_quantity > 0 and current_asset.id is not null then
          update public.assets set quantity = next_quantity, avg_price = next_average where id = current_asset.id;
        elsif next_quantity > 0 then
          insert into public.assets (wallet_id, user_id, symbol, name, type, quantity, avg_price)
          values (p_wallet_id, uid, normalized_symbol, coalesce(legacy_target ->> 'name', normalized_symbol), legacy_target ->> 'type', next_quantity, next_average);
        end if;
      end if;
    end if;
    return jsonb_build_object('ok', true, 'operation_id', operation_id, 'replayed', true);
  end if;

  -- Day trades belong to the tax ledger and must not alter a swing position.
  if p_asset_type = 'daytrade' then
    return jsonb_build_object('ok', true, 'operation_id', operation_id, 'replayed', false);
  end if;

  select * into current_asset
    from public.assets
    where wallet_id = p_wallet_id
      and user_id = uid
      and upper(symbol) = normalized_symbol
    order by added_at asc, id asc
    limit 1
    for update;

  if p_type = 'buy' then
    if current_asset.id is null then
      insert into public.assets (wallet_id, user_id, symbol, name, type, quantity, avg_price)
      values (p_wallet_id, uid, normalized_symbol, coalesce(nullif(btrim(p_name), ''), normalized_symbol), position_type, p_quantity, ((p_price * p_quantity) + coalesce(p_fees, 0)) / p_quantity);
    else
      next_quantity := current_asset.quantity + p_quantity;
      next_average := ((current_asset.avg_price * current_asset.quantity) + (p_price * p_quantity) + coalesce(p_fees, 0)) / next_quantity;
      update public.assets
        set quantity = next_quantity, avg_price = next_average
        where id = current_asset.id;
    end if;
  else
    if current_asset.id is null then
      raise exception 'asset not held in this wallet' using errcode = 'P0001';
    end if;
    if p_quantity > current_asset.quantity then
      raise exception 'sale exceeds the current position' using errcode = 'P0001';
    end if;
    next_quantity := current_asset.quantity - p_quantity;
    if next_quantity = 0 then
      delete from public.assets where id = current_asset.id;
    else
      update public.assets set quantity = next_quantity where id = current_asset.id;
    end if;
  end if;

  return jsonb_build_object('ok', true, 'operation_id', operation_id, 'replayed', false);
end;
$$;

revoke all on function public.record_operation_and_update_position(uuid, text, uuid, text, text, text, numeric, numeric, numeric, numeric, date, text) from public, anon;
grant execute on function public.record_operation_and_update_position(uuid, text, uuid, text, text, text, numeric, numeric, numeric, numeric, date, text) to authenticated;

commit;
