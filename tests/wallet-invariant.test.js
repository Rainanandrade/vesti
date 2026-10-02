const test = require('node:test');
const assert = require('node:assert/strict');

test('wallet recovery never selects a shared read-only wallet', () => {
  const { selectOwnedWallet } = require('../src/utils/walletInvariant');
  const wallets = [
    { id: 'shared', ownerId: 'someone-else', readOnly: true },
    { id: 'owned', ownerId: 'user-1', readOnly: false },
  ];
  assert.equal(selectOwnedWallet(wallets, 'user-1', 'shared').id, 'owned');
});

test('wallet recovery prefers the active owned wallet', () => {
  const { selectOwnedWallet } = require('../src/utils/walletInvariant');
  const wallets = [
    { id: 'first', ownerId: 'user-1', readOnly: false },
    { id: 'active', ownerId: 'user-1', readOnly: false },
  ];
  assert.equal(selectOwnedWallet(wallets, 'user-1', 'active').id, 'active');
});

test('canonical recovery wallet is writable and active', () => {
  const { mapRecoveryWallet } = require('../src/utils/walletInvariant');
  const wallet = mapRecoveryWallet({ id: 'new-wallet', name: 'Carteira principal', created_at: '2026-10-02T10:00:00Z' }, 'user-1');
  assert.deepEqual(wallet, {
    id: 'new-wallet',
    name: 'Carteira principal',
    assets: [],
    createdAt: Date.parse('2026-10-02T10:00:00Z'),
    ownerId: 'user-1',
    readOnly: false,
  });
});
