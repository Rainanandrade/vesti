const test = require('node:test');
const assert = require('node:assert/strict');

const { reconcilePositionMutation, rebuildPositionFromOperations } = require('../src/utils/operationPosition');

test('deleting a buy reverses quantity and cost basis', () => {
  const current = { quantity: 15, avgPrice: 12 };
  const previous = { type: 'buy', quantity: 5, price: 20, fees: 0 };
  const result = reconcilePositionMutation(current, previous, null);
  assert.equal(result.quantity, 10);
  assert.equal(result.avgPrice, 8);
});

test('editing a buy reverses the old movement before applying the new one', () => {
  const current = { quantity: 15, avgPrice: 12 };
  const previous = { type: 'buy', quantity: 5, price: 20, fees: 0 };
  const next = { type: 'buy', quantity: 2, price: 10, fees: 0 };
  const result = reconcilePositionMutation(current, previous, next);
  assert.equal(result.quantity, 12);
  assert.equal(Number(result.avgPrice.toFixed(4)), 8.3333);
});

test('deleting a sale restores the sold quantity', () => {
  const result = reconcilePositionMutation(
    { quantity: 8, avgPrice: 25 },
    { type: 'sell', quantity: 2, price: 30, fees: 0 },
    null,
  );
  assert.deepEqual(result, { quantity: 10, avgPrice: 25 });
});

test('refuses to reverse a buy that is no longer present in the position', () => {
  assert.throws(
    () => reconcilePositionMutation(
      { quantity: 1, avgPrice: 10 },
      { type: 'buy', quantity: 2, price: 10, fees: 0 },
      null,
    ),
    /posição atual/i,
  );
});

test('rebuilds chronologically after deleting an interleaved sale', () => {
  const operations = [
    { id: 'buy-1', type: 'buy', quantity: 10, price: 10, fees: 0, date: '2026-01-01', createdAt: 1 },
    { id: 'buy-2', type: 'buy', quantity: 5, price: 20, fees: 0, date: '2026-03-01', createdAt: 3 },
  ];
  const result = rebuildPositionFromOperations(
    { quantity: 10, avgPrice: 15 },
    [
      operations[0],
      { id: 'sell-1', type: 'sell', quantity: 5, price: 15, fees: 0, date: '2026-02-01', createdAt: 2 },
      operations[1],
    ],
    operations,
  );
  assert.equal(result.quantity, 15);
  assert.equal(Number(result.avgPrice.toFixed(4)), 13.3333);
});

test('rebuild respects a changed date and rejects a sale before the first buy', () => {
  const original = [
    { id: 'buy', type: 'buy', quantity: 10, price: 10, fees: 0, date: '2026-01-01', createdAt: 1 },
    { id: 'sell', type: 'sell', quantity: 5, price: 12, fees: 0, date: '2026-02-01', createdAt: 2 },
  ];
  const edited = [original[0], { ...original[1], date: '2025-12-01' }];
  assert.throws(
    () => rebuildPositionFromOperations({ quantity: 5, avgPrice: 10 }, original, edited),
    /venda.*posição/i,
  );
});
