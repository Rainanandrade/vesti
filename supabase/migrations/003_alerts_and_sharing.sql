-- Vesti · Migration 003 · Alertas + Compartilhamento de carteira
-- Rodar no SQL Editor do Supabase. Idempotente.

-- 1) Alertas inteligentes
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('price_above','price_below','datacom','concentration','dividend_drop')),
  symbol text,                  -- pra alertas por ativo (price_above/below, datacom, dividend_drop)
  threshold numeric,            -- pra price alerts (valor) OU concentration (pct)
  active boolean default true,
  triggered_at timestamptz,
  message text,
  created_at timestamptz default now()
);

create index if not exists alerts_user_active_idx on public.alerts(user_id, active);

alter table public.alerts enable row level security;
drop policy if exists "alerts_own" on public.alerts;
create policy "alerts_own" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Compartilhamento de carteira
create table if not exists public.wallet_shares (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invited_email text not null,
  invited_user_id uuid references auth.users(id) on delete cascade,
  role text default 'viewer' check (role in ('viewer','editor')),
  status text default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz default now(),
  accepted_at timestamptz,
  unique(wallet_id, invited_email)
);

create index if not exists wallet_shares_wallet_idx on public.wallet_shares(wallet_id);
create index if not exists wallet_shares_invited_email_idx on public.wallet_shares(invited_email);
create index if not exists wallet_shares_invited_user_idx on public.wallet_shares(invited_user_id);

alter table public.wallet_shares enable row level security;

-- Owner pode ler/escrever seus compartilhamentos
drop policy if exists "wallet_shares_owner" on public.wallet_shares;
create policy "wallet_shares_owner" on public.wallet_shares
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Convidado pode ler o próprio compartilhamento
drop policy if exists "wallet_shares_invited_read" on public.wallet_shares;
create policy "wallet_shares_invited_read" on public.wallet_shares
  for select using (auth.uid() = invited_user_id);

-- Convidado pode aceitar (marcar como accepted + preencher invited_user_id)
drop policy if exists "wallet_shares_invited_accept" on public.wallet_shares;
create policy "wallet_shares_invited_accept" on public.wallet_shares
  for update using (
    invited_email = (select email from auth.users where id = auth.uid())
    and status = 'pending'
  ) with check (
    invited_user_id = auth.uid()
    and status = 'accepted'
  );

-- 3) Estender RLS de wallets pra permitir leitura de wallets compartilhadas
drop policy if exists "wallets_own" on public.wallets;
create policy "wallets_own" on public.wallets
  for all using (
    auth.uid() = user_id
    or exists (
      select 1 from public.wallet_shares s
      where s.wallet_id = wallets.id
        and s.invited_user_id = auth.uid()
        and s.status = 'accepted'
    )
  ) with check (auth.uid() = user_id);

-- 4) Estender RLS de assets pra permitir leitura em wallets compartilhadas
drop policy if exists "assets_own" on public.assets;
create policy "assets_own" on public.assets
  for all using (
    auth.uid() = user_id
    or exists (
      select 1 from public.wallet_shares s
      where s.wallet_id = assets.wallet_id
        and s.invited_user_id = auth.uid()
        and s.status = 'accepted'
    )
  ) with check (auth.uid() = user_id);
