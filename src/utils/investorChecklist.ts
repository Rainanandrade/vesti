import { AssetDetails } from '../api/yahooDetails';
import { TickerInfo } from '../data/tickers';
import { DividendInfo } from '../api/dividends';

export type ChecklistItem = {
  label: string;
  passed: boolean;
  reason?: string;
};

/**
 * Calcula o DY anual real usando os pagamentos dos últimos 12 meses.
 * Cai aqui quando a brapi free não retorna o campo dividendYield (FIIs/Units).
 */
export function computeDyFromHistory(history: { date: string; amount: number }[] | undefined, currentPrice: number | null | undefined): number | null {
  if (!history || history.length === 0 || !currentPrice || currentPrice <= 0) return null;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const iso = cutoff.toISOString().slice(0, 10);
  const sum = history.filter((h) => h.date >= iso).reduce((s, h) => s + h.amount, 0);
  if (sum <= 0) return null;
  return (sum / currentPrice) * 100;
}

/**
 * Checklist do investidor estilo Suno/Status Invest.
 * Avalia indicadores básicos pra dar uma rápida visão de qualidade.
 */
export function buildChecklist(ticker: TickerInfo, d: AssetDetails | null, dividends?: DividendInfo | null): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const isFII = ticker.type === 'fii';
  const isETF = ticker.type === 'etf';
  const dyEffective = d?.dividendYield ?? computeDyFromHistory(dividends?.history, d?.currentPrice);

  // ===== DY (sempre que possível, usa dyEffective que considera histórico) =====
  const dyTarget = isFII ? 7 : isETF ? 3 : 4;
  if (dyEffective != null) {
    items.push({
      label: `DY atrativo (≥ ${dyTarget}%)`,
      passed: dyEffective >= dyTarget,
      reason: `Atual: ${dyEffective.toFixed(2)}% a.a.${d?.dividendYield == null ? ' (calc. histórico)' : ''}`,
    });
  } else {
    items.push({ label: 'Paga dividendos', passed: false, reason: 'Sem histórico recente' });
  }

  // ===== Histórico de pagamento (vem do dividendInfo) =====
  if (dividends?.history && dividends.history.length > 0) {
    const months12 = (() => {
      const c = new Date(); c.setMonth(c.getMonth() - 12);
      return c.toISOString().slice(0, 10);
    })();
    const recent = dividends.history.filter((h) => h.date >= months12);
    items.push({
      label: 'Pagou dividendos nos últimos 12 meses',
      passed: recent.length > 0,
      reason: `${recent.length} pagamentos no período`,
    });
    if (isFII || ticker.symbol.endsWith('11')) {
      items.push({
        label: 'Frequência mensal de distribuição',
        passed: dividends.frequency === 'monthly',
        reason: `Frequência: ${frequencyLabel(dividends.frequency)}`,
      });
    }
  }

  // ===== P/L =====
  if (!isFII && !isETF) {
    if (d?.trailingPE != null && d.trailingPE > 0) {
      items.push({
        label: 'P/L razoável (< 15)',
        passed: d.trailingPE < 15,
        reason: `Atual: ${d.trailingPE.toFixed(1)}`,
      });
    }
  }

  // ===== P/VP =====
  if (d?.priceToBook != null && d.priceToBook > 0) {
    const limit = isFII ? 1.05 : 2;
    items.push({
      label: isFII ? 'Negocia abaixo do VP (< 1,05)' : 'P/VP saudável (< 2)',
      passed: d.priceToBook < limit,
      reason: `Atual: ${d.priceToBook.toFixed(2)}`,
    });
  }

  // ===== ROE/Margem/Dívida/Receita (só pra ação, quando disponível) =====
  if (!isFII && !isETF && d?.returnOnEquity != null) {
    items.push({
      label: 'ROE consistente (> 15%)',
      passed: d.returnOnEquity > 15,
      reason: `Atual: ${d.returnOnEquity.toFixed(1)}%`,
    });
  }
  if (!isFII && !isETF && d?.profitMargins != null) {
    items.push({
      label: 'Margem líquida boa (> 10%)',
      passed: d.profitMargins > 10,
      reason: `Atual: ${d.profitMargins.toFixed(1)}%`,
    });
  }
  if (!isFII && !isETF && d?.debtToEquity != null) {
    items.push({
      label: 'Endividamento controlado (D/PL < 80%)',
      passed: d.debtToEquity < 80,
      reason: `Atual: ${d.debtToEquity.toFixed(1)}%`,
    });
  }
  if (!isFII && !isETF && d?.revenueGrowth != null) {
    items.push({
      label: 'Receita crescendo (> 5%)',
      passed: d.revenueGrowth > 5,
      reason: `Atual: ${d.revenueGrowth.toFixed(1)}%`,
    });
  }
  if (!isFII && !isETF && d?.payoutRatio != null && d.payoutRatio > 0) {
    items.push({
      label: 'Payout sustentável (< 80%)',
      passed: d.payoutRatio < 80,
      reason: `Atual: ${d.payoutRatio.toFixed(1)}%`,
    });
  }

  // ===== Posição no range 52sem (sempre dá pra avaliar) =====
  if (d?.currentPrice != null && d.fiftyTwoWeekLow != null && d.fiftyTwoWeekHigh != null) {
    const range = d.fiftyTwoWeekHigh - d.fiftyTwoWeekLow;
    if (range > 0) {
      const pos = ((d.currentPrice - d.fiftyTwoWeekLow) / range) * 100;
      items.push({
        label: 'Próximo da mínima 52 semanas (oportunidade)',
        passed: pos < 35,
        reason: `${pos.toFixed(0)}% do range entre mín e máx`,
      });
    }
  }

  // ===== Volatilidade (Beta) =====
  if (d?.beta != null && d.beta > 0) {
    items.push({
      label: 'Baixa volatilidade vs mercado (Beta < 1,1)',
      passed: d.beta < 1.1,
      reason: `Beta: ${d.beta.toFixed(2)}`,
    });
  }

  return items;
}

function frequencyLabel(f: string): string {
  return { monthly: 'mensal', quarterly: 'trimestral', semestral: 'semestral', annual: 'anual' }[f] || f;
}

export function checklistScore(items: ChecklistItem[]): { passed: number; total: number; pct: number } {
  const total = items.length;
  const passed = items.filter((i) => i.passed).length;
  return { passed, total, pct: total > 0 ? (passed / total) * 100 : 0 };
}
