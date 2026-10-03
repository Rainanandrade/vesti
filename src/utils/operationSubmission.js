const { withTimeout } = require('./async');

function submitOperationWithDeadline(mutation, timeoutMs = 18000) {
  return withTimeout(
    Promise.resolve().then(mutation),
    timeoutMs,
    'Salvar a operação',
  );
}

module.exports = { submitOperationWithDeadline };
