const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildFutureScenarios,
  calculateEmergencyReserve,
  futureValue,
  requiredMonthlyContribution,
} = require('../src/utils/planningCalculators');

const closeTo = (actual, expected, tolerance = 0.01) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be within ${tolerance} of ${expected}`);
};

test('future value handles zero and positive compound rates', () => {
  assert.deepEqual(
    futureValue({ initial: 1000, monthly: 100, years: 1, annualRate: 0 }),
    { finalValue: 2200, invested: 2200, interest: 0 },
  );

  const result = futureValue({ initial: 1000, monthly: 100, years: 2, annualRate: 12 });
  closeTo(result.invested, 3400);
  assert.ok(result.finalValue > result.invested);
  closeTo(result.interest, result.finalValue - result.invested);
});

test('required contribution handles zero rate, growth and an already funded target', () => {
  closeTo(requiredMonthlyContribution({ goal: 1200, initial: 0, years: 1, annualRate: 0 }), 100);
  assert.ok(requiredMonthlyContribution({ goal: 1200, initial: 0, years: 1, annualRate: 12 }) < 100);
  assert.equal(requiredMonthlyContribution({ goal: 1000, initial: 1000, years: 1, annualRate: 0 }), 0);
});

test('planning formulas reject invalid and non-finite input', () => {
  const invalidCases = [
    { initial: -1, monthly: 10, years: 1, annualRate: 5 },
    { initial: 0, monthly: 10, years: 0, annualRate: 5 },
    { initial: 0, monthly: 10, years: 1, annualRate: -100 },
    { initial: 0, monthly: Number.POSITIVE_INFINITY, years: 1, annualRate: 5 },
  ];
  invalidCases.forEach((input) => assert.throws(() => futureValue(input), RangeError));
  assert.throws(
    () => requiredMonthlyContribution({ goal: -1, initial: 0, years: 1, annualRate: 5 }),
    RangeError,
  );
});

test('future scenarios surround the user rate and floor the conservative rate at zero', () => {
  const scenarios = buildFutureScenarios({ initial: 0, monthly: 100, years: 1, annualRate: 1 });
  assert.deepEqual(scenarios.map(({ key, label, annualRate }) => ({ key, label, annualRate })), [
    { key: 'conservative', label: 'Conservador', annualRate: 0 },
    { key: 'base', label: 'Base', annualRate: 1 },
    { key: 'optimistic', label: 'Otimista', annualRate: 3 },
  ]);
  assert.ok(scenarios[0].finalValue <= scenarios[1].finalValue);
  assert.ok(scenarios[1].finalValue <= scenarios[2].finalValue);
});

test('emergency reserve reports target, coverage, progress, missing amount and ETA', () => {
  assert.deepEqual(
    calculateEmergencyReserve({ monthlyExpenses: 2000, months: 6, current: 3000, monthlySaving: 1500 }),
    {
      target: 12000,
      coveredMonths: 1.5,
      missing: 9000,
      progress: 25,
      estimatedMonths: 6,
    },
  );

  const complete = calculateEmergencyReserve({ monthlyExpenses: 2000, months: 6, current: 15000, monthlySaving: 0 });
  assert.equal(complete.progress, 100);
  assert.equal(complete.missing, 0);
  assert.equal(complete.estimatedMonths, 0);

  const withoutSaving = calculateEmergencyReserve({ monthlyExpenses: 1000, months: 3, current: 0, monthlySaving: 0 });
  assert.equal(withoutSaving.estimatedMonths, null);
});
