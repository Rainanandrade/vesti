const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('paid entitlement requires both a payment id and a future expiry', async () => {
  const { hasActivePaidEntitlement } = await import('../api/_lib/entitlement.js');
  const now = Date.parse('2026-09-29T12:00:00Z');

  assert.equal(hasActivePaidEntitlement(null, now), false);
  assert.equal(hasActivePaidEntitlement({}, now), false);
  assert.equal(
    hasActivePaidEntitlement(
      { mercadopago_subscription_id: 'sub_1', pro_expires_at: '2026-09-29T11:59:59Z' },
      now,
    ),
    false,
  );
  assert.equal(
    hasActivePaidEntitlement(
      { mercadopago_subscription_id: null, pro_expires_at: '2026-10-29T12:00:00Z' },
      now,
    ),
    false,
  );
  assert.equal(
    hasActivePaidEntitlement(
      { mercadopago_subscription_id: 'sub_1', pro_expires_at: '2026-10-29T12:00:00Z' },
      now,
    ),
    true,
  );
});

test('all paid API surfaces enforce the server-side entitlement', () => {
  for (const file of ['ai-consultor.js', 'ai-diagnostic.js', 'ai-suggest.js', 'pluggy.js']) {
    const source = fs.readFileSync(path.resolve(__dirname, `../api/${file}`), 'utf8');
    assert.match(source, /paidEntitlementOrReject\(req, res, user\)/, file);
  }
});
