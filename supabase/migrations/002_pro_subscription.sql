-- Vesti · Migration 002 · Assinatura Pro
-- Rodar no SQL Editor do Supabase. Idempotente.

-- 1) Colunas Pro em profiles
alter table public.profiles add column if not exists pro_expires_at timestamptz;
alter table public.profiles add column if not exists trial_started_at timestamptz;
alter table public.profiles add column if not exists mercadopago_subscription_id text;

-- 2) Índice pra buscar assinantes ativos rápido
create index if not exists profiles_pro_expires_idx
  on public.profiles(pro_expires_at)
  where pro_expires_at is not null;

-- 3) Trigger: novo profile ganha trial de 7 dias automático
create or replace function public.grant_pro_trial()
returns trigger as $$
begin
  if new.trial_started_at is null then
    new.trial_started_at := now();
    new.pro_expires_at := now() + interval '7 days';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_grant_trial on public.profiles;
create trigger profiles_grant_trial
  before insert on public.profiles
  for each row execute function public.grant_pro_trial();

-- 4) View auxiliar (opcional) — usa no dashboard admin depois
create or replace view public.pro_stats as
select
  count(*) filter (where pro_expires_at > now()) as active_pro,
  count(*) filter (where pro_expires_at > now() and mercadopago_subscription_id is null) as active_trial,
  count(*) filter (where pro_expires_at > now() and mercadopago_subscription_id is not null) as active_paid,
  count(*) filter (where pro_expires_at is null or pro_expires_at <= now()) as free_users
from public.profiles;
