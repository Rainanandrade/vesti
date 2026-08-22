-- Vesti · Migration 005 · Remover trial gratuito
-- Pro passa a ser EXCLUSIVAMENTE pra quem tem assinatura paga ativa.
-- Rodar no SQL Editor do Supabase. Idempotente.

-- 1) Remove o trigger que dava 7 dias de trial no cadastro
drop trigger if exists profiles_grant_trial on public.profiles;
drop function if exists public.grant_pro_trial();

-- 2) Revoga trials ativos (quem tem pro_expires_at mas nunca pagou)
--    Quem tem mercadopago_subscription_id preenchido mantém o acesso.
update public.profiles
set pro_expires_at = null,
    trial_started_at = null
where mercadopago_subscription_id is null;

-- 3) Colunas de controle de assinatura paga
alter table public.profiles add column if not exists subscription_status text
  check (subscription_status in ('active','past_due','canceled','paused') or subscription_status is null);
alter table public.profiles add column if not exists subscription_plan text
  check (subscription_plan in ('monthly','yearly') or subscription_plan is null);
alter table public.profiles add column if not exists subscription_started_at timestamptz;
alter table public.profiles add column if not exists last_payment_at timestamptz;

-- 4) Blindagem: usuário NUNCA pode editar seu próprio status Pro.
--    Só o backend (service role, via webhook do gateway) escreve nessas colunas.
create or replace function public.protect_pro_columns()
returns trigger as $$
begin
  -- Se a sessão é de um usuário autenticado comum (não service_role),
  -- mantém os valores antigos das colunas de assinatura.
  if auth.uid() is not null then
    new.pro_expires_at := old.pro_expires_at;
    new.trial_started_at := old.trial_started_at;
    new.mercadopago_subscription_id := old.mercadopago_subscription_id;
    new.subscription_status := old.subscription_status;
    new.subscription_plan := old.subscription_plan;
    new.subscription_started_at := old.subscription_started_at;
    new.last_payment_at := old.last_payment_at;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists profiles_protect_pro on public.profiles;
create trigger profiles_protect_pro
  before update on public.profiles
  for each row execute function public.protect_pro_columns();

-- 5) Atualiza a view de estatísticas (sem trial)
drop view if exists public.pro_stats;
create or replace view public.pro_stats as
select
  count(*) filter (where pro_expires_at > now() and mercadopago_subscription_id is not null) as active_paid,
  count(*) filter (where subscription_status = 'past_due') as past_due,
  count(*) filter (where subscription_status = 'canceled') as canceled,
  count(*) filter (where pro_expires_at is null or pro_expires_at <= now()) as free_users,
  count(*) as total_users
from public.profiles;
