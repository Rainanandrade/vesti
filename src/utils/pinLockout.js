const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 60_000;

function normalizePinLockout(state, now = Date.now()) {
  if (!state || !Number.isFinite(state.attempts)) {
    return { attempts: 0, lockedUntil: null };
  }
  if (state.lockedUntil != null && state.lockedUntil <= now) {
    return { attempts: 0, lockedUntil: null };
  }
  return {
    attempts: Math.max(0, Math.floor(state.attempts)),
    lockedUntil: Number.isFinite(state.lockedUntil) ? state.lockedUntil : null,
  };
}

function isPinLocked(state, now = Date.now()) {
  return state?.lockedUntil != null && state.lockedUntil > now;
}

function registerPinFailure(state, now = Date.now()) {
  const current = normalizePinLockout(state, now);
  if (isPinLocked(current, now)) return current;

  const attempts = current.attempts + 1;
  return {
    attempts,
    lockedUntil: attempts >= MAX_PIN_ATTEMPTS ? now + PIN_LOCKOUT_MS : null,
  };
}

module.exports = {
  MAX_PIN_ATTEMPTS,
  PIN_LOCKOUT_MS,
  isPinLocked,
  normalizePinLockout,
  registerPinFailure,
};
