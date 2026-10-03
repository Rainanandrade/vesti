const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('operation mutation is atomic and idempotent in the database', () => {
  const sql = fs.readFileSync(path.join(root, 'supabase/migrations/007_atomic_operations.sql'), 'utf8');
  assert.match(sql, /client_request_id uuid/i);
  assert.match(sql, /unique index/i);
  assert.match(sql, /record_operation_and_update_position/i);
  assert.match(sql, /on conflict/i);
  assert.match(sql, /client_payload_hash/i);
  assert.match(sql, /vesti-operation:/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /grant execute.*authenticated/is);
});

test('operation UI uses the atomic RPC rather than two independent writes', () => {
  const modal = fs.readFileSync(path.join(root, 'src/components/NewOperationModal.tsx'), 'utf8');
  assert.match(modal, /recordOperationAndUpdatePosition/);
  assert.doesNotMatch(modal, /Promise\.all\(\[ledgerTask, positionTask\]\)/);
  assert.match(modal, /assetKind !== 'daytrade'/);
  assert.match(modal, /requestLocked/);
});
