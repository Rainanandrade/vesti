const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isPinLocked,
  normalizePinLockout,
  registerPinFailure,
} = require('../src/utils/pinLockout');

test('five failures create a one-minute lock', () => {
  const now = 1_800_000_000_000;
  let state = normalizePinLockout(null, now);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    state = registerPinFailure(state, now + attempt);
  }

  assert.equal(state.attempts, 5);
  assert.equal(state.lockedUntil, now + 4 + 60_000);
  assert.equal(isPinLocked(state, now + 30_000), true);
});

test('serializing and restarting cannot clear an active lock', () => {
  const now = 1_800_000_000_000;
  let state = normalizePinLockout(null, now);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    state = registerPinFailure(state, now);
  }

  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(isPinLocked(normalizePinLockout(restored, now + 20_000), now + 20_000), true);
  assert.deepEqual(normalizePinLockout(restored, state.lockedUntil + 1), {
    attempts: 0,
    lockedUntil: null,
  });
});
