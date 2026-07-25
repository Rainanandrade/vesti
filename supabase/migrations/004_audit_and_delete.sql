-- Vesti · Migration 004 · Auditoria + Suporte a exclusão de conta
-- Rode no SQL Editor do Supabase. Idempotente.

-- 1) Tabela de auditoria de ações sensíveis
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,               -- 'wallet.delete', 'asset.delete', 'account.delete', etc.
  entity_type text,                   -- 'wallet', 'asset', 'operation', 'auth'
  entity_id text,
  details jsonb,                      -- dados adicionais (ex: nome do ativo apagado)
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists audit_log_user_idx on public.audit_log(user_id, created_at desc);
create index if not exists audit_log_action_idx on public.audit_log(action, created_at desc);

alter table public.audit_log enable row level security;

-- User só lê seu próprio histórico
drop policy if exists "audit_log_read_own" on public.audit_log;
create policy "audit_log_read_own" on public.audit_log
  for select using (auth.uid() = user_id);

-- Só service role insere (via backend)
drop policy if exists "audit_log_insert_none" on public.audit_log;
create policy "audit_log_insert_none" on public.audit_log
  for insert with check (false);

-- 2) Trigger genérico pra auditar deletes em tabelas sensíveis
create or replace function public.log_delete()
returns trigger as $$
begin
  insert into public.audit_log (user_id, action, entity_type, entity_id, details)
  values (
    coalesce(OLD.user_id, auth.uid()),
    TG_TABLE_NAME || '.delete',
    TG_TABLE_NAME,
    coalesce(OLD.id::text, ''),
    row_to_json(OLD)::jsonb
  );
  return OLD;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_audit_wallets_delete on public.wallets;
create trigger trg_audit_wallets_delete
  before delete on public.wallets
  for each row execute function public.log_delete();

drop trigger if exists trg_audit_assets_delete on public.assets;
create trigger trg_audit_assets_delete
  before delete on public.assets
  for each row execute function public.log_delete();

drop trigger if exists trg_audit_operations_delete on public.operations;
create trigger trg_audit_operations_delete
  before delete on public.operations
  for each row execute function public.log_delete();

-- 3) Função RPC pra deletar a própria conta
-- User chama via supabase.rpc('delete_my_account').
-- Deleta tudo em cascata (RLS cuida). auth.users é apagado por trigger separado.
create or replace function public.delete_my_account()
returns json as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    return json_build_object('ok', false, 'error', 'not authenticated');
  end if;

  -- Log da exclusão antes de perder o user_id
  insert into public.audit_log (user_id, action, entity_type, entity_id, details)
  values (uid, 'account.delete', 'auth', uid::text, json_build_object('at', now())::jsonb);

  -- Apaga dados do user em cascata (RLS + on delete cascade fazem o trabalho)
  delete from public.wallets where user_id = uid;
  delete from public.goals_reached where user_id = uid;
  delete from public.lessons_completed where user_id = uid;
  delete from public.watchlist where user_id = uid;
  delete from public.operations where user_id = uid;
  delete from public.proventos where user_id = uid;
  delete from public.patrimony_snapshots where user_id = uid;
  delete from public.profiles where id = uid;
  delete from public.pluggy_items where user_id = uid;
  delete from public.alerts where user_id = uid;
  delete from public.wallet_shares where owner_id = uid;

  return json_build_object('ok', true, 'deleted_at', now());
end;
$$ language plpgsql security definer;

grant execute on function public.delete_my_account() to authenticated;
