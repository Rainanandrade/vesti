const test = require('node:test');
const assert = require('node:assert/strict');

test('validates bounded text responses', async () => {
  const { validateAiText } = await import('../api/_lib/aiResponse.js');
  assert.equal(validateAiText('  resposta segura  '), 'resposta segura');
  assert.throws(() => validateAiText(''), /inválida/i);
  assert.throws(() => validateAiText('x'.repeat(8_001)), /limite/i);
  assert.throws(() => validateAiText({ text: 'não' }), /inválida/i);
});

test('rejects malformed, zero-sum, negative and non-finite allocations', async () => {
  const { normalizeAllocationResponse } = await import('../api/_lib/aiResponse.js');
  const allowed = new Set(['BOVA11', 'Tesouro Selic']);

  assert.throws(() => normalizeAllocationResponse({}, 100, allowed), /picks/i);
  assert.throws(
    () => normalizeAllocationResponse({ summary: 'x', picks: [{ symbol: 'BOVA11', amount: 0 }] }, 100, allowed),
    /zero/i,
  );
  assert.throws(
    () => normalizeAllocationResponse({ summary: 'x', picks: [{ symbol: 'BOVA11', amount: -1 }] }, 100, allowed),
    /positivo/i,
  );
  assert.throws(
    () => normalizeAllocationResponse({ summary: 'x', picks: [{ symbol: 'BOVA11', amount: Infinity }] }, 100, allowed),
    /finito/i,
  );
});

test('normalizes a valid allocation to the requested total without NaN', async () => {
  const { normalizeAllocationResponse } = await import('../api/_lib/aiResponse.js');
  const result = normalizeAllocationResponse(
    {
      summary: 'Estratégia equilibrada',
      picks: [
        { classKey: 'renda_variavel', classLabel: 'Renda Variável', role: 'ETF', symbol: 'BOVA11', name: 'Bova', amount: 60, reasoning: 'Diversificação.' },
        { classKey: 'renda_fixa', classLabel: 'Renda Fixa', role: 'Reserva', symbol: 'Tesouro Selic', name: 'Tesouro Selic', amount: 30, reasoning: 'Liquidez.' },
      ],
    },
    100,
    new Set(['BOVA11', 'Tesouro Selic']),
  );

  assert.equal(result.picks.reduce((sum, pick) => sum + pick.amount, 0), 100);
  assert.equal(result.picks.every((pick) => Number.isFinite(pick.amount)), true);
});
