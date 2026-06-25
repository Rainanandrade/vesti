import { AssetDetails } from '../api/yahooDetails';
import { TickerInfo } from '../data/tickers';

export type ChecklistItem = {
  label: string;
  passed: boolean;
  reason?: string;
};

/**
 * Checklist do investidor estilo Suno/Status Invest.
 * Avalia indicadores básicos pra dar uma rápida visão de qualidade.
 */
export function buildChecklist(ticker: TickerInfo, d: AssetDetails | null): ChecklistItem[] {
  if (!d) {
    return [
      { label: 'Dados fundamentais disponíveis', passed: false, reason: 'Não conseguimos carregar agora' },
    ];
  }

  const items: ChecklistItem[] = [];
  const isFII = ticker.type === 'fii';
  const isETF = ticker.type === 'etf';

  // Dividend Yield (>= 4% pra ação, >= 7% pra FII)
  const dyTarget = isFII ? 7 : 4;
  if (d.dividendYield != null) {
    items.push({
      label: `DY atrativo (≥ ${dyTarget}%)`,
      passed: d.dividendYield >= dyTarget,
      reason: `Atual: ${d.dividendYield.toFixed(2)}%`,
    });
  }

  // P/L < 15 (não aplica pra FII/ETF)
  if (!isFII && !isETF && d.trailingPE != null) {
    items.push({
      label: 'P/L razoável (< 15)',
      passed: d.trailingPE > 0 && d.trailingPE < 15,
      reason: `Atual: ${d.trailingPE.toFixed(1)}`,
    });
  }

  // P/VP < 2 (FII: < 1.05 é considerado descontado)
  if (d.priceToBook != null) {
    const limit = isFII ? 1.05 : 2;
    items.push({
      label: isFII ? 'Negocia abaixo do VP (< 1,05)' : 'P/VP saudável (< 2)',
      passed: d.priceToBook > 0 && d.priceToBook < limit,
      reason: `Atual: ${d.priceToBook.toFixed(2)}`,
    });
  }

  // ROE > 15%
  if (!isFII && !isETF && d.returnOnEquity != null) {
    items.push({
      label: 'ROE consistente (> 15%)',
      passed: d.returnOnEquity > 15,
      reason: `Atual: ${d.returnOnEquity.toFixed(1)}%`,
    });
  }

  // Margem líquida > 10%
  if (!isFII && !isETF && d.profitMargins != null) {
    items.push({
      label: 'Margem líquida boa (> 10%)',
      passed: d.profitMargins > 10,
      reason: `Atual: ${d.profitMargins.toFixed(1)}%`,
    });
  }

  // Dívida/Patrimônio < 80%
  if (!isFII && !isETF && d.debtToEquity != null) {
    items.push({
      label: 'Endividamento controlado (D/PL < 80%)',
      passed: d.debtToEquity < 80,
      reason: `Atual: ${d.debtToEquity.toFixed(1)}%`,
    });
  }

  // Crescimento de receita > 5%
  if (!isFII && !isETF && d.revenueGrowth != null) {
    items.push({
      label: 'Receita crescendo (> 5%)',
      passed: d.revenueGrowth > 5,
      reason: `Atual: ${d.revenueGrowth.toFixed(1)}%`,
    });
  }

  // Payout < 80% (pra ação) — empresa retém pra crescer
  if (!isFII && !isETF && d.payoutRatio != null && d.payoutRatio > 0) {
    items.push({
      label: 'Payout sustentável (< 80%)',
      passed: d.payoutRatio < 80,
      reason: `Atual: ${d.payoutRatio.toFixed(1)}%`,
    });
  }

  // Próximo do mínimo de 52 sem (10% de margem) — oportunidade
  if (d.currentPrice != null && d.fiftyTwoWeekLow != null) {
    const distFromLow = ((d.currentPrice - d.fiftyTwoWeekLow) / d.fiftyTwoWeekLow) * 100;
    items.push({
      label: 'Próximo da mínima 52 semanas (oportunidade)',
      passed: distFromLow < 20,
      reason: `${distFromLow.toFixed(0)}% acima da mínima`,
    });
  }

  return items;
}

export function checklistScore(items: ChecklistItem[]): { passed: number; total: number; pct: number } {
  const total = items.length;
  const passed = items.filter((i) => i.passed).length;
  return { passed, total, pct: total > 0 ? (passed / total) * 100 : 0 };
}
