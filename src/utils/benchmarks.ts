// Constrói séries pra comparar carteira × benchmark (IPCA/Ibovespa)
// usando os snapshots diários de patrimônio e uma taxa anual estimada.

export type PatrimonySnap = { date: string; total: number; invested: number };

export type ComparisonSeries = {
  labels: string[];
  portfolio: number[];   // rentabilidade % da carteira em cada ponto (L/P/investido)
  benchmark: number[];   // rentabilidade % do benchmark capitalizado
  portfolioReturnPct: number;
  benchmarkReturnPct: number;
};

/**
 * Constrói série comparativa em % de rentabilidade (não em R$).
 * Assim, quando o user aporta, a linha da carteira NÃO sobe enganosamente —
 * o aporte só reduz o retorno % (dilui a base) ou mantém igual.
 *
 * Portfolio series: (total - invested) / invested × 100 em cada snapshot
 * Benchmark series: taxa acumulada capitalizada dia a dia
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
    const portfolioReturn = s.invested > 0 ? ((s.total - s.invested) / s.invested) * 100 : 0;
    const benchmarkReturn = (Math.pow(1 + rateDaily, daysSinceStart) - 1) * 100;
    portfolio.push(portfolioReturn);
    benchmark.push(benchmarkReturn);
    const [, mm, dd] = s.date.split('-');
    labels.push(`${dd}/${mm}`);
  }

  const last = sorted[sorted.length - 1];
  const portfolioReturnPct = last.invested > 0 ? ((last.total - last.invested) / last.invested) * 100 : 0;
  const daysTotal = (new Date(last.date).getTime() - startMs) / (24 * 60 * 60 * 1000);
  const benchmarkReturnPct = (Math.pow(1 + rateDaily, daysTotal) - 1) * 100;

  return { labels, portfolio, benchmark, portfolioReturnPct, benchmarkReturnPct };
}

/**
 * Filtra outliers extremos da série (ex: snapshot antigo com carteira quase vazia
 * distorce gráfico e métricas). Remove pontos com valor < mediana / 4.
 */
function filterOutliers(snaps: PatrimonySnap[]): PatrimonySnap[] {
  if (snaps.length < 3) return snaps;
  const totals = snaps.map((s) => s.total).sort((a, b) => a - b);
  const median = totals[Math.floor(totals.length / 2)];
  const cutoff = median / 4;
  return snaps.filter((s) => s.total >= cutoff);
}

export { filterOutliers };

/**
 * Métricas de performance sobre a série da carteira.
 * Recebe snapshots (com datas) pra calcular retorno pelos DIAS REAIS, não n de pontos.
 * Retorna null se não há histórico suficiente (mínimo 30 dias).
 */
export function computeReturnMetrics(snapshots: PatrimonySnap[], riskFreeAnnualPct = 10.5) {
  if (!snapshots || snapshots.length < 3) return null;
  const clean = filterOutliers(snapshots).sort((a, b) => a.date.localeCompare(b.date));
  if (clean.length < 3) return null;

  const firstDate = new Date(clean[0].date).getTime();
  const lastDate = new Date(clean[clean.length - 1].date).getTime();
  const daysSpan = (lastDate - firstDate) / (24 * 60 * 60 * 1000);
  if (daysSpan < 30) return null; // pouco tempo pra métricas confiáveis

  // Usa RETORNO ACUMULADO em cada ponto (L/P/investido) — não o valor absoluto.
  // Assim aportes não são contabilizados como retorno.
  const returnsPct = clean.map((s) => s.invested > 0 ? ((s.total - s.invested) / s.invested) : 0);

  // Variação diária do retorno acumulado (delta % entre dias consecutivos).
  const dailyReturns: number[] = [];
  for (let i = 1; i < returnsPct.length; i++) {
    dailyReturns.push(returnsPct[i] - returnsPct[i - 1]);
  }
  if (dailyReturns.length < 2) return null;

  const mean = dailyReturns.reduce((s, x) => s + x, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((s, x) => s + (x - mean) ** 2, 0) / dailyReturns.length;
  const stdDaily = Math.sqrt(variance);
  const volAnnual = stdDaily * Math.sqrt(252) * 100;

  // Max drawdown sobre a série de retornos acumulados (%)
  let peak = returnsPct[0];
  let maxDD = 0;
  for (const r of returnsPct) {
    if (r > peak) peak = r;
    const dd = peak - r; // em pontos %
    if (dd > maxDD) maxDD = dd;
  }

  const totalReturn = returnsPct[returnsPct.length - 1]; // já em fração
  // Anualização por dias REAIS, e cap em 90 dias mínimo pra evitar extrapolação absurda
  const daysForAnnualization = Math.max(90, daysSpan);
  const annualizedReturn = (Math.pow(1 + totalReturn, 365 / daysForAnnualization) - 1) * 100;
  const sharpe = volAnnual > 0 ? (annualizedReturn - riskFreeAnnualPct) / volAnnual : 0;

  // Clampa sanamente
  return {
    volAnnualPct: Math.min(500, volAnnual),
    maxDrawdownPct: maxDD * 100,
    annualizedReturnPct: Math.max(-99, Math.min(500, annualizedReturn)),
    sharpe: Math.max(-10, Math.min(10, sharpe)),
    daysSpan,
  };
}
