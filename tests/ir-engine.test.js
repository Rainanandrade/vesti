const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateTaxLedger } = require('../src/utils/irEngine');

function op(type, assetType, symbol, quantity, price, date, extra = {}) {
  return { type, assetType, symbol, quantity, price, date, ...extra };
}

test('uses chronological weighted cost after partial sales', () => {
  const result = calculateTaxLedger([
    op('buy', 'acao', 'ABCD3', 100, 10, '2026-01-02'),
    op('sell', 'acao', 'ABCD3', 40, 15, '2026-01-10'),
    op('sell', 'acao', 'ABCD3', 10, 15, '2026-01-15'),
    op('sell', 'acao', 'ABCD3', 50, 12, '2026-02-10'),
  ]);

  assert.equal(result[0].stockProfitLoss, 250);
  assert.equal(result[1].stockProfitLoss, 100);
});

test('stock exemption stops at R$ 20,000 and never applies to ETFs, FIIs or day trades', () => {
  const exact = calculateTaxLedger([
    op('buy', 'acao', 'EXAT3', 100, 100, '2026-01-02'),
    op('sell', 'acao', 'EXAT3', 100, 200, '2026-01-10'),
  ])[0];
  assert.equal(exact.stockSalesVolume, 20_000);
  assert.equal(exact.stockIsExempt, true);
  assert.equal(exact.taxByCategory.stock, 0);

  const above = calculateTaxLedger([
    op('buy', 'acao', 'ABOV3', 100, 100, '2026-01-02'),
    op('sell', 'acao', 'ABOV3', 100, 200.0001, '2026-01-10'),
  ])[0];
  assert.equal(above.stockIsExempt, false);
  assert.ok(above.taxByCategory.stock > 0);

  const other = calculateTaxLedger([
    op('buy', 'etf', 'BOVA11', 10, 100, '2026-01-02'),
    op('sell', 'etf', 'BOVA11', 10, 110, '2026-01-10'),
    op('buy', 'fii', 'HGLG11', 10, 100, '2026-01-02'),
    op('sell', 'fii', 'HGLG11', 10, 110, '2026-01-10'),
    op('buy', 'daytrade', 'WIN', 10, 100, '2026-01-02'),
    op('sell', 'daytrade', 'WIN', 10, 110, '2026-01-02'),
  ])[0];
  assert.equal(other.taxByCategory.etf, 15);
  assert.equal(other.taxByCategory.fii, 20);
  assert.equal(other.taxByCategory.dayTrade, 20);
});

test('carries losses only within the same tax category', () => {
  const result = calculateTaxLedger([
    op('buy', 'etf', 'BOVA11', 2, 100, '2026-01-02'),
    op('sell', 'etf', 'BOVA11', 1, 50, '2026-01-10'),
    op('buy', 'acao', 'TAXA3', 200, 100, '2026-02-02'),
    op('sell', 'acao', 'TAXA3', 200, 110, '2026-02-10'),
    op('sell', 'etf', 'BOVA11', 1, 200, '2026-02-11'),
  ]);

  assert.equal(result[0].carriedLosses.etf, 50);
  assert.equal(result[1].taxByCategory.stock, 300);
  assert.equal(result[1].taxByCategory.etf, 7.5);
  assert.equal(result[1].carriedLosses.etf, 0);
});

test('deducts fees from gains and withholding from payable tax', () => {
  const month = calculateTaxLedger([
    op('buy', 'etf', 'BOVA11', 10, 10, '2026-01-02', { fees: 10 }),
    op('sell', 'etf', 'BOVA11', 10, 20, '2026-01-10', {
      fees: 5,
      withholdingTax: 2,
    }),
  ])[0];

  assert.equal(month.etfProfitLoss, 85);
  assert.equal(month.grossTax, 12.75);
  assert.equal(month.withholdingTax, 2);
  assert.equal(month.taxDue, 10.75);
});

test('carries DARF below R$ 10 into a later month', () => {
  const result = calculateTaxLedger([
    op('buy', 'etf', 'BOVA11', 2, 100, '2026-01-02'),
    op('sell', 'etf', 'BOVA11', 1, 160, '2026-01-10'),
    op('sell', 'etf', 'BOVA11', 1, 120, '2026-02-10'),
  ]);

  assert.equal(result[0].grossTax, 9);
  assert.equal(result[0].taxDue, 0);
  assert.equal(result[0].carriedDarfOut, 9);
  assert.equal(result[1].carriedDarfIn, 9);
  assert.equal(result[1].taxDue, 12);
  assert.equal(result[1].carriedDarfOut, 0);
});

test('moves a weekend DARF deadline to the previous weekday', () => {
  const january = calculateTaxLedger([
    op('buy', 'etf', 'BOVA11', 1, 100, '2026-01-02'),
    op('sell', 'etf', 'BOVA11', 1, 200, '2026-01-10'),
  ])[0];

  assert.equal(january.dueDate, '2026-02-27');
});
