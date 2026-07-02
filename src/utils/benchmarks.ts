// Constrói séries pra comparar carteira × benchmark (IPCA/Ibovespa)
// usando os snapshots diários de patrimônio e uma taxa anual estimada.

export type PatrimonySnap = { date: string; total: number; invested: number };

export type ComparisonSeries = {
  labels: string[];      // datas no formato "dd/mm"
  portfolio: number[];   // valores absolutos R$
  benchmark: number[];   // projeção do que a carteira valeria se seguisse o benchmark
  portfolioReturnPct: number;
  benchmarkReturnPct: number;
};

/**
 * Constrói série comparativa contra um benchmark de taxa anual.
 * benchmarkYearlyRatePct = 4 pra IPCA ~4%, 10 pra Ibov 10% etc.
 *
 * A projeção do benchmark parte do MESMO valor inicial da carteira e capitaliza
 * pela taxa anual pro-rata pelos dias decorridos. Assim comparação é justa.
 */
export function buildComparisonSeries(
  snapshots: PatrimonySnap[],
  benchmarkYearlyRatePct: number,
): ComparisonSeries | null {
  if (!snapshots || snapshots.length < 2) return null;

  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0];
  const startMs = new Date(first.date).getTime();
  const rateDaily = Math.pow(1 + benchmarkYearlyRatePct / 100, 1 / 365) - 1;

  const labels: string[] = [];
  const portfolio: number[] = [];
  const benchmark: number[] = [];

  for (const s of sorted) {
    const daysSinceStart = (new Date(s.date).getTime() - startMs) / (24 * 60 * 60 * 1000);
    const projected = first.total * Math.pow(1 + rateDaily, daysSinceStart);
    portfolio.push(s.total);
    benchmark.push(projected);
    const [, mm, dd] = s.date.split('-');
    labels.push(`${dd}/${mm}`);
  }

  const last = sorted[sorted.length - 1];
  const portfolioReturnPct = first.total > 0 ? ((last.total - first.total) / first.total) * 100 : 0;
  const daysTotal = (new Date(last.date).getTime() - startMs) / (24 * 60 * 60 * 1000);
  const benchmarkReturnPct = (Math.pow(1 + rateDaily, daysTotal) - 1) * 100;

  return { labels, portfolio, benchmark, portfolioReturnPct, benchmarkReturnPct };
}

/**
 * Métricas de performance sobre a série da carteira.
 * Retornos diários -> volatilidade anualizada, max drawdown, sharpe (usa Selic anual como risk-free)
 */
export function computeReturnMetrics(portfolioValues: number[], riskFreeAnnualPct = 10.5) {
  if (!portfolioValues || portfolioValues.length < 3) return null;

  const dailyReturns: number[] = [];
  for (let i = 1; i < portfolioValues.length; i++) {
    const prev = portfolioValues[i - 1];
    if (prev > 0) dailyReturns.push((portfolioValues[i] - prev) / prev);
  }
  if (dailyReturns.length < 2) return null;

  const mean = dailyReturns.reduce((s, x) => s + x, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, x) => s + (x - mean) ** 2, 0) / dailyReturns.length;
  const stdDaily = Math.sqrt(variance);
  const volAnnual = stdDaily * Math.sqrt(252) * 100;

  // Max drawdown
  let peak = portfolioValues[0];
  let maxDD = 0;
  for (const v of portfolioValues) {
    if (v > peak) peak = v;
    const dd = peak > 0 ? (peak - v) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  }

  // Sharpe simplificado: (retorno anualizado - risk-free) / vol anual
  const totalReturn = (portfolioValues[portfolioValues.length - 1] - portfolioValues[0]) / portfolioValues[0];
  const daysSpan = portfolioValues.length; // 1 snapshot = 1 dia, aproximado
  const annualizedReturn = (Math.pow(1 + totalReturn, 365 / Math.max(1, daysSpan)) - 1) * 100;
  const sharpe = volAnnual > 0 ? (annualizedReturn - riskFreeAnnualPct) / volAnnual : 0;

  return {
    volAnnualPct: volAnnual,
    maxDrawdownPct: maxDD * 100,
    annualizedReturnPct: annualizedReturn,
    sharpe,
  };
}
