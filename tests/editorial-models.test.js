const test = require('node:test');
const assert = require('node:assert/strict');

test('today headline explains the strongest verified movement', () => {
  const { buildTodayNarrative } = require('../src/features/editorial/todayModel');
  assert.equal(buildTodayNarrative({ profitPct: 4.8, cashFlow: 928, concentration: 18 }).headline, 'Seu patrimônio ganhou ritmo.');
  assert.equal(buildTodayNarrative({ profitPct: -3, cashFlow: -500, concentration: 31 }).tone, 'attention');
});

test('today headline prioritizes concentration over short-term gains', () => {
  const { buildTodayNarrative } = require('../src/features/editorial/todayModel');
  const result = buildTodayNarrative({ profitPct: 8, cashFlow: 1200, concentration: 29 });
  assert.equal(result.headline, 'Sua carteira pede equilíbrio.');
  assert.match(result.reason, /parcela relevante/i);
});

test('investment presentation identifies concentration without changing portfolio math', () => {
  const { buildInvestmentView } = require('../src/features/editorial/investModel');
  const view = buildInvestmentView([{ symbol: 'WEGE3', current: 28000, type: 'acao' }, { symbol: 'HGLG11', current: 72000, type: 'fii' }]);
  assert.equal(view.total, 100000);
  assert.equal(view.topHolding.symbol, 'HGLG11');
  assert.equal(view.topHolding.share, 72);
  assert.equal(view.needsAttention, true);
});
