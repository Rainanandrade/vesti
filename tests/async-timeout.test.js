const test = require('node:test');
const assert = require('node:assert/strict');

test('withTimeout rejects stalled operations with an actionable message', async () => {
  const { withTimeout } = require('../src/utils/async');
  await assert.rejects(withTimeout(new Promise(() => {}), 5, 'Salvar ativo'), /Salvar ativo demorou mais que o esperado/);
});

test('withTimeout preserves successful results', async () => {
  const { withTimeout } = require('../src/utils/async');
  assert.equal(await withTimeout(Promise.resolve(42), 50, 'Teste'), 42);
});
