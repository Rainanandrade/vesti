const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migrationPath = path.resolve(
  __dirname,
  '../supabase/migrations/006_production_hardening.sql',
);

test('migration hardens shared-wallet authorization', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'migration 006 must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.match(sql, /create policy "wallets_owner_delete"/);
  assert.match(sql, /create policy "wallets_shared_select"/);
  assert.match(sql, /create policy "assets_owner_delete"/);
  assert.match(sql, /create policy "assets_shared_select"/);
  assert.match(sql, /public\.owns_wallet\(wallet_shares\.wallet_id\)/);
  assert.match(sql, /wallets\.user_id\s*=\s*auth\.uid\(\)/);
  assert.doesNotMatch(sql, /create policy "wallets_own"[\s\S]*?for all/);
  assert.doesNotMatch(sql, /create policy "assets_own"[\s\S]*?for all/);
});

test('migration exposes safe invitation RPCs', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'migration 006 must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.match(sql, /function public\.list_my_wallet_invitations\(\)/);
  assert.match(sql, /function public\.accept_wallet_invitation\(share_id uuid\)/);
  assert.match(sql, /security definer/);
  assert.match(sql, /set search_path = ''/);
  assert.match(sql, /auth\.jwt\(\).*email/);
  assert.match(sql, /revoke all on function public\.accept_wallet_invitation/);
});

test('account deletion removes the auth user and identifying audit records', () => {
  assert.equal(fs.existsSync(migrationPath), true, 'migration 006 must exist');
  const sql = fs.readFileSync(migrationPath, 'utf8').toLowerCase();

  assert.match(sql, /delete from public\.audit_log where user_id = uid/);
  assert.match(sql, /delete from public\.wallet_shares[\s\S]*invited_user_id = uid/);
  assert.match(sql, /delete from auth\.users where id = uid/);
  assert.match(sql, /drop function if exists public\.delete_my_account\(\)/);
  assert.match(sql, /revoke all on function public\.delete_my_account/);
  assert.match(sql, /grant execute on function public\.delete_my_account\(\) to authenticated/);
});
