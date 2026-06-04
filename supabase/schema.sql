-- Vesti — Schema do banco no Supabase
-- Rode TUDO isso no SQL Editor do Supabase Dashboard (uma vez só)

-- =========================
-- TABELAS
-- =========================

-- Perfil do usuário (1 por user)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  financial_profile jsonb,            -- resultado do quiz (type, score, strategy, ...)
  privacy_mode boolean default false,
  onboarding_done boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Carteiras (1 user → N carteiras)
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Ativos (1 carteira → N ativos)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  name text not null,
  type text not null check (type in ('acao','fii','etf','tesouro','cdb','outro')),
  quantity numeric not null,
  avg_price numeric not null,
  added_at timestamptz default now()
);

-- Metas batidas
create table if not exists public.goals_reached (
  user_id uuid not null references auth.users(id) on delete cascade,
  value numeric not null,
  reached_at timestamptz default now(),
  primary key (user_id, value)
);

-- Aulas concluídas (com pontuação do quiz)
create table if not exists public.lessons_completed (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null,
  quiz_score integer default 0,        -- 0 a 3
  completed_at timestamptz default now(),
  primary key (user_id, lesson_id)
);

alter table public.lessons_completed enable row level security;
drop policy if exists "lessons_own" on public.lessons_completed;
create policy "lessons_own" on public.lessons_completed
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- ROW LEVEL SECURITY (cada user só vê seus próprios dados)
-- =========================

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.assets enable row level security;
alter table public.goals_reached enable row level security;

drop policy if exists "profiles_own" on public.profiles;
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "wallets_own" on public.wallets;
create policy "wallets_own" on public.wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "assets_own" on public.assets;
create policy "assets_own" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals_own" on public.goals_reached;
create policy "goals_own" on public.goals_reached
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================
-- TRIGGER: cria profile automaticamente quando user se cadastra
-- =========================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
