const test = require('node:test');
const assert = require('node:assert/strict');

const { submitOperationWithDeadline } = require('../src/utils/operationSubmission');

test('operation submission cannot remain pending forever', async () => {
  const never = new Promise(() => {});
  await assert.rejects(
    submitOperationWithDeadline(() => never, 10),
    /demorou mais que o esperado/i,
  );
});

test('operation submission returns the mutation result', async () => {
  const result = await submitOperationWithDeadline(async () => ({ id: 'op-1' }), 50);
  assert.deepEqual(result, { id: 'op-1' });
});
