function assertFiniteNumber(name, value) {
  if (!Number.isFinite(value)) throw new RangeError(`${name} deve ser um número finito.`);
}

function assertNonNegative(name, value) {
  assertFiniteNumber(name, value);
  if (value < 0) throw new RangeError(`${name} não pode ser negativo.`);
}

function validateProjection({ initial, years, annualRate }) {
  assertNonNegative('Valor inicial', initial);
  assertFiniteNumber('Prazo', years);
  assertFiniteNumber('Taxa anual', annualRate);
  if (years <= 0) throw new RangeError('O prazo deve ser maior que zero.');
  if (annualRate <= -100) throw new RangeError('A taxa anual deve ser maior que -100%.');
}

function projectionPeriod(years, annualRate) {
  const months = Math.round(years * 12);
  if (months <= 0) throw new RangeError('O prazo deve equivaler a pelo menos um mês.');
  return {
    months,
    monthlyRate: Math.pow(1 + annualRate / 100, 1 / 12) - 1,
  };
}

function normalize(value) {
  if (!Number.isFinite(value)) throw new RangeError('A simulação gerou um resultado inválido.');
  return Math.round(value * 100) / 100;
}

function futureValue({ initial, monthly, years, annualRate }) {
  validateProjection({ initial, years, annualRate });
  assertNonNegative('Aporte mensal', monthly);
  const { months, monthlyRate } = projectionPeriod(years, annualRate);
  const growth = Math.pow(1 + monthlyRate, months);
  const finalValue = monthlyRate === 0
    ? initial + monthly * months
    : initial * growth + monthly * ((growth - 1) / monthlyRate);
  const invested = initial + monthly * months;

  return {
    finalValue: normalize(finalValue),
    invested: normalize(invested),
    interest: normalize(finalValue - invested),
  };
}

function requiredMonthlyContribution({ goal, initial, years, annualRate }) {
  validateProjection({ initial, years, annualRate });
  assertNonNegative('Meta', goal);
  const { months, monthlyRate } = projectionPeriod(years, annualRate);
  const growth = Math.pow(1 + monthlyRate, months);
  const remaining = Math.max(0, goal - initial * growth);
  if (remaining === 0) return 0;
  const annuityFactor = monthlyRate === 0 ? months : (growth - 1) / monthlyRate;
  return normalize(remaining / annuityFactor);
}

function buildFutureScenarios({ initial, monthly, years, annualRate }) {
  validateProjection({ initial, years, annualRate });
  assertNonNegative('Aporte mensal', monthly);
  const inputs = [
    { key: 'conservative', label: 'Conservador', annualRate: Math.max(0, annualRate - 2) },
    { key: 'base', label: 'Base', annualRate },
    { key: 'optimistic', label: 'Otimista', annualRate: annualRate + 2 },
  ];
  return inputs.map((scenario) => ({
    ...scenario,
    ...futureValue({ initial, monthly, years, annualRate: scenario.annualRate }),
  }));
}

function calculateEmergencyReserve({ monthlyExpenses, months, current, monthlySaving }) {
  assertNonNegative('Despesas mensais', monthlyExpenses);
  assertFiniteNumber('Meses de proteção', months);
  assertNonNegative('Reserva atual', current);
  assertNonNegative('Economia mensal', monthlySaving);
  if (months <= 0) throw new RangeError('Os meses de proteção devem ser maiores que zero.');

  const target = monthlyExpenses * months;
  const missing = Math.max(0, target - current);
  const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const coveredMonths = monthlyExpenses > 0 ? current / monthlyExpenses : 0;
  const estimatedMonths = missing === 0 ? 0 : monthlySaving > 0 ? Math.ceil(missing / monthlySaving) : null;

  return {
    target: normalize(target),
    coveredMonths: normalize(coveredMonths),
    missing: normalize(missing),
    progress: normalize(progress),
    estimatedMonths,
  };
}

module.exports = {
  buildFutureScenarios,
  calculateEmergencyReserve,
  futureValue,
  requiredMonthlyContribution,
};
