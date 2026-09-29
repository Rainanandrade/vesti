-- Vesti · Migration 006 · Production hardening
-- Authorization, invitation lifecycle, and complete account deletion.
-- Idempotent: safe to run more than once.

-- ---------------------------------------------------------------------------
-- Wallet and asset authorization
-- ---------------------------------------------------------------------------

drop policy if exists "wallets_own" on public.wallets;
drop policy if exists "wallets_owner_select" on public.wallets;
drop policy if exists "wallets_shared_select" on public.wallets;
drop policy if exists "wallets_owner_insert" on public.wallets;
drop policy if exists "wallets_owner_update" on public.wallets;
drop policy if exists "wallets_owner_delete" on public.wallets;

create policy "wallets_owner_select" on public.wallets
  for select using (auth.uid() = user_id);

create policy "wallets_shared_select" on public.wallets
  for select using (
    exists (
      select 1
      from public.wallet_shares
      where wallet_id = wallets.id
        and public.wallet_shares.invited_user_id = auth.uid()
        and public.wallet_shares.status = 'accepted'
    )
  );

create policy "wallets_owner_insert" on public.wallets
  for insert with check (auth.uid() = user_id);

create policy "wallets_owner_update" on public.wallets
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "wallets_owner_delete" on public.wallets
  for delete using (auth.uid() = user_id);

drop policy if exists "assets_own" on public.assets;
drop policy if exists "assets_owner_select" on public.assets;
drop policy if exists "assets_shared_select" on public.assets;
drop policy if exists "assets_owner_insert" on public.assets;
drop policy if exists "assets_owner_update" on public.assets;
drop policy if exists "assets_owner_delete" on public.assets;

create policy "assets_owner_select" on public.assets
  for select using (auth.uid() = user_id);

create policy "assets_shared_select" on public.assets
  for select using (
    exists (
      select 1
      from public.wallet_shares
      where wallet_id = assets.wallet_id
        and public.wallet_shares.invited_user_id = auth.uid()
        and public.wallet_shares.status = 'accepted'
    )
  );

create policy "assets_owner_insert" on public.assets
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.wallets
      where wallets.id = assets.wallet_id
        and wallets.user_id = auth.uid()
    )
  );

create policy "assets_owner_update" on public.assets
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.wallets
      where wallets.id = assets.wallet_id
        and wallets.user_id = auth.uid()
    )
  );

create policy "assets_owner_delete" on public.assets
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Share ownership and invitation RPCs
-- ---------------------------------------------------------------------------

drop policy if exists "wallet_shares_owner" on public.wallet_shares;
drop policy if exists "wallet_shares_invited_read" on public.wallet_shares;
drop policy if exists "wallet_shares_invited_accept" on public.wallet_shares;
drop policy if exists "wallet_shares_owner_select" on public.wallet_shares;
drop policy if exists "wallet_shares_invited_select" on public.wallet_shares;
drop policy if exists "wallet_shares_owner_insert" on public.wallet_shares;
drop policy if exists "wallet_shares_owner_update" on public.wallet_shares;
drop policy if exists "wallet_shares_owner_delete" on public.wallet_shares;

create or replace function public.owns_wallet(target_wallet_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.wallets
    where wallets.id = target_wallet_id
      and wallets.user_id = auth.uid()
  );
$$;

revoke all on function public.owns_wallet(uuid) from public, anon;
grant execute on function public.owns_wallet(uuid) to authenticated;

create policy "wallet_shares_owner_select" on public.wallet_shares
  for select using (auth.uid() = owner_id);

create policy "wallet_shares_invited_select" on public.wallet_shares
  for select using (
    auth.uid() = invited_user_id
    and status = 'accepted'
  );

create policy "wallet_shares_owner_insert" on public.wallet_shares
  for insert with check (
    auth.uid() = owner_id
    and public.owns_wallet(wallet_shares.wallet_id)
  );

create policy "wallet_shares_owner_update" on public.wallet_shares
  for update using (auth.uid() = owner_id)
  with check (
    auth.uid() = owner_id
    and public.owns_wallet(wallet_shares.wallet_id)
  );

create policy "wallet_shares_owner_delete" on public.wallet_shares
  for delete using (auth.uid() = owner_id);

create index if not exists wallet_shares_invited_email_lower_idx
  on public.wallet_shares (lower(invited_email));

create or replace function public.list_my_wallet_invitations()
returns setof public.wallet_shares
language sql
stable
security definer
set search_path = ''
as $$
  select ws.*
  from public.wallet_shares as ws
  where lower(ws.invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    and ws.status in ('pending', 'accepted')
  order by ws.created_at desc;
$$;

revoke all on function public.list_my_wallet_invitations() from public, anon;
grant execute on function public.list_my_wallet_invitations() to authenticated;

create or replace function public.accept_wallet_invitation(share_id uuid)
returns public.wallet_shares
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  accepted public.wallet_shares;
begin
  if uid is null or caller_email = '' then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  update public.wallet_shares
  set invited_user_id = uid,
      status = 'accepted',
      accepted_at = now()
  where id = share_id
    and status = 'pending'
    and lower(invited_email) = caller_email
  returning * into accepted;

  if accepted.id is null then
    raise exception 'invitation not found' using errcode = 'P0001';
  end if;

  return accepted;
end;
$$;

revoke all on function public.accept_wallet_invitation(uuid) from public, anon;
grant execute on function public.accept_wallet_invitation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Complete, transactional account deletion
-- ---------------------------------------------------------------------------

create or replace function public.delete_my_account()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return jsonb_build_object('ok', false, 'error', 'not authenticated');
  end if;

  -- Remove explicit dependants first so delete-audit triggers finish before the
  -- identifying audit rows are removed.
  delete from public.wallet_shares
    where owner_id = uid or invited_user_id = uid;
  delete from public.alerts where user_id = uid;
  delete from public.assets where user_id = uid;
  delete from public.wallets where user_id = uid;
  delete from public.operations where user_id = uid;
  delete from public.proventos where user_id = uid;
  delete from public.patrimony_snapshots where user_id = uid;
  delete from public.watchlist where user_id = uid;
  delete from public.goals_reached where user_id = uid;
  delete from public.lessons_completed where user_id = uid;
  delete from public.asset_comments where user_id = uid;
  delete from public.pluggy_items where user_id = uid;
  delete from public.profiles where id = uid;

  delete from public.audit_log where user_id = uid;
  delete from public.audit_log
    where details ->> 'user_id' = uid::text;

  delete from auth.users where id = uid;

  if not found then
    raise exception 'account not found' using errcode = 'P0001';
  end if;

  return jsonb_build_object('ok', true, 'deleted_at', now());
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
