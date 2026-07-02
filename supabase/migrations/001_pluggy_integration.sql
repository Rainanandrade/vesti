-- Vesti · Migration 001 · Integração Pluggy
-- Rodar no SQL Editor do Supabase.
-- Idempotente: pode rodar mais de uma vez sem erro.

-- 1) Tabela de conexões Pluggy por usuário
create table if not exists public.pluggy_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null unique,                 -- id retornado pela Pluggy
  connector_id integer,                          -- ex: 201 = XP
  connector_name text,                           -- ex: "XP Investimentos"
  status text default 'CONNECTING',              -- CONNECTING | UPDATED | LOGIN_ERROR | OUTDATED | WAITING_USER_INPUT
  error_message text,
  last_sync_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists pluggy_items_user_idx on public.pluggy_items(user_id);

alter table public.pluggy_items enable row level security;

drop policy if exists "pluggy_items_own" on public.pluggy_items;
create policy "pluggy_items_own" on public.pluggy_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 2) Colunas novas em assets pra distinguir manual × sincronizado
alter table public.assets add column if not exists source text default 'manual'
  check (source in ('manual','pluggy'));

alter table public.assets add column if not exists pluggy_item_id text
  references public.pluggy_items(item_id) on delete set null;

alter table public.assets add column if not exists last_sync_at timestamptz;

-- Índice pra buscar assets de um item rápido (usado no sync)
create index if not exists assets_pluggy_item_idx
  on public.assets(pluggy_item_id) where pluggy_item_id is not null;

-- 3) Constraint: um mesmo symbol dentro de um wallet só pode existir 1x por source
--    (evita duplicar quando sync roda 2x seguidas)
create unique index if not exists assets_wallet_symbol_source_uidx
  on public.assets(wallet_id, symbol, source);
