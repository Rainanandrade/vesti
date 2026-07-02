// Backtesting simples e Monte Carlo pra projeção futura.
// Backtesting: usa histórico da brapi pra simular quanto o user teria hoje.
// Monte Carlo: N simulações de retorno anual com aportes recorrentes.

export type BacktestResult = {
  invested: number;
  finalValue: number;
  totalReturn: number;
  totalReturnPct: number;
  annualizedReturnPct: number;
};

/**
 * Backtest simples: compra X reais no ativo em data T e mantém até hoje.
 * Retorna quanto valeria hoje baseado em preços históricos.
 */
export function simpleBacktest(
  historicalPrices: Array<{ date: string; close: number }>,
  investAmount: number,
  buyDate: string,
): BacktestResult | null {
  if (historicalPrices.length < 2) return null;
  const sorted = [...historicalPrices].sort((a, b) => a.date.localeCompare(b.date));

  const buyPoint = sorted.find((p) => p.date >= buyDate);
  const lastPoint = sorted[sorted.length - 1];
  if (!buyPoint || !lastPoint) return null;

  const shares = investAmount / buyPoint.close;
  const finalValue = shares * lastPoint.close;
  const totalReturn = finalValue - investAmount;
  const totalReturnPct = (totalReturn / investAmount) * 100;

  const days = (new Date(lastPoint.date).getTime() - new Date(buyPoint.date).getTime()) / (24 * 60 * 60 * 1000);
  const years = days / 365;
  const annualizedReturnPct = years > 0 ? (Math.pow(finalValue / investAmount, 1 / years) - 1) * 100 : 0;

  return { invested: investAmount, finalValue, totalReturn, totalReturnPct, annualizedReturnPct };
}

export type MonteCarloParams = {
  currentValue: number;
  monthlyContribution: number;
  years: number;
  expectedAnnualReturnPct: number;  // média esperada (%)
  annualVolatilityPct: number;      // volatilidade anual (%)
  simulations?: number;             // default 1000
};

export type MonteCarloResult = {
  years: number;
  P10: number;              // pessimista
  P50: number;              // mediana
  P90: number;              // otimista
  totalContributed: number;
  histogram: number[];      // opcional: valores finais das simulações (subamostrado)
};

/**
 * Random normal (Box-Muller) — usado nas simulações.
 */
function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Monte Carlo: N simulações de crescimento composto mensal com retorno
 * mensal normal-distribuído (mean, std) + aportes mensais fixos.
 */
export function monteCarloProjection(params: MonteCarloParams): MonteCarloResult {
  const {
    currentValue,
    monthlyContribution,
    years,
    expectedAnnualReturnPct,
    annualVolatilityPct,
    simulations = 1000,
  } = params;

  const months = years * 12;
  const meanMonthly = expectedAnnualReturnPct / 100 / 12;
  const stdMonthly = annualVolatilityPct / 100 / Math.sqrt(12);

  const finals: number[] = [];
  for (let sim = 0; sim < simulations; sim++) {
    let value = currentValue;
    for (let m = 0; m < months; m++) {
      const monthReturn = meanMonthly + stdMonthly * randomNormal();
      value = value * (1 + monthReturn) + monthlyContribution;
      if (value < 0) value = 0;
    }
    finals.push(value);
  }

  finals.sort((a, b) => a - b);
  const P10 = finals[Math.floor(finals.length * 0.1)];
  const P50 = finals[Math.floor(finals.length * 0.5)];
  const P90 = finals[Math.floor(finals.length * 0.9)];

  return {
    years,
    P10,
    P50,
    P90,
    totalContributed: currentValue + monthlyContribution * months,
    histogram: finals.filter((_, i) => i % 10 === 0), // subamostragem
  };
}
