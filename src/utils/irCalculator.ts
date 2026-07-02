// Cálculo simplificado de IR sobre operações de bolsa (BR):
// - Swing trade (ações): 15% sobre lucro, isenção se vendas do mês <= R$ 20.000
// - Day trade: 20% sobre lucro (sem isenção)
// - FII: 20% sobre lucro (sem isenção)
// - Prejuízos podem ser compensados no mesmo tipo em meses seguintes
// - Código DARF: 6015

import { Operation } from '../context/AppContext';

export type IrSummary = {
  monthKey: string;                    // YYYY-MM
  swingProfitLoss: number;             // lucro/prejuízo swing ações
  swingSalesVolume: number;            // volume total de vendas swing
  swingIsExempt: boolean;              // vendas ≤ R$ 20k → isento
  dayTradeProfitLoss: number;
  fiiProfitLoss: number;
  taxDue: number;                      // IR total a pagar
  taxByCategory: { swing: number; dayTrade: number; fii: number };
  compensablePrejuizo: {               // prejuízos que passam adiante
    swing: number;
    dayTrade: number;
    fii: number;
  };
  darfCode: string;
  dueDate: string;                     // último dia útil do mês seguinte
};

const SWING_EXEMPTION = 20000;         // R$ 20k
const SWING_RATE = 0.15;
const DAYTRADE_RATE = 0.20;
const FII_RATE = 0.20;

/**
 * Estado acumulado de prejuízos (usado pra compensação entre meses).
 * Mutável — usa fora ou passa como parâmetro.
 */
export type LossState = {
  swing: number;
  dayTrade: number;
  fii: number;
};

/**
 * Calcula IR pro mês informado, com opção de compensar prejuízos acumulados.
 */
export function computeMonthlyIr(
  operations: Operation[],
  monthKey: string,             // YYYY-MM
  carriedLosses: LossState = { swing: 0, dayTrade: 0, fii: 0 },
): IrSummary {
  const monthOps = operations.filter((op) => op.date.startsWith(monthKey));

  // Agrupamos venda-a-venda pra calcular lucro/prejuízo por venda:
  // pra simplificar, assumimos preço médio ponderado histórico das compras.
  // Uma implementação completa exigiria FIFO real; aqui usamos avg.

  // 1) Calcula preço médio até o mês, por símbolo e tipo
  const upToMonthOps = operations.filter((op) => op.date <= `${monthKey}-31`);
  const avgByKey = new Map<string, { qty: number; totalCost: number }>();

  for (const op of upToMonthOps) {
    const key = `${op.symbol}-${op.assetType}`;
    if (op.type === 'buy') {
      const cur = avgByKey.get(key) || { qty: 0, totalCost: 0 };
      cur.qty += op.quantity;
      cur.totalCost += op.quantity * op.price;
      avgByKey.set(key, cur);
    } else {
      // venda diminui qty mas mantém preço médio proporcional
      const cur = avgByKey.get(key);
      if (cur && cur.qty > 0) {
        const avg = cur.totalCost / cur.qty;
        cur.totalCost -= avg * op.quantity;
        cur.qty -= op.quantity;
        if (cur.qty <= 0) { cur.qty = 0; cur.totalCost = 0; }
      }
    }
  }

  // 2) Somamos lucro/prejuízo das VENDAS do mês
  let swingProfitLoss = 0;
  let swingSalesVolume = 0;
  let dayTradeProfitLoss = 0;
  let fiiProfitLoss = 0;

  for (const op of monthOps) {
    if (op.type !== 'sell') continue;
    // Recompõe preço médio até ANTES da venda pra estimar o custo
    const key = `${op.symbol}-${op.assetType}`;
    // Calculamos avg considerando compras até essa data
    const opsBeforeSale = operations.filter((x) => x.symbol === op.symbol && x.assetType === op.assetType && x.date < op.date && x.type === 'buy');
    const totQty = opsBeforeSale.reduce((s, x) => s + x.quantity, 0);
    const totCost = opsBeforeSale.reduce((s, x) => s + x.quantity * x.price, 0);
    const avg = totQty > 0 ? totCost / totQty : op.price;
    const cost = avg * op.quantity;
    const revenue = op.price * op.quantity;
    const gain = revenue - cost;

    if (op.assetType === 'daytrade') {
      dayTradeProfitLoss += gain;
    } else if (op.assetType === 'fii') {
      fiiProfitLoss += gain;
    } else {
      // ações e etf tratamos como swing
      swingProfitLoss += gain;
      swingSalesVolume += revenue;
    }
  }

  // 3) Compensação de prejuízos anteriores
  let swingAfter = swingProfitLoss + carriedLosses.swing; // carriedLosses é negativo
  let dayAfter = dayTradeProfitLoss + carriedLosses.dayTrade;
  let fiiAfter = fiiProfitLoss + carriedLosses.fii;

  // 4) Cálculo do imposto
  const swingIsExempt = swingSalesVolume <= SWING_EXEMPTION;
  const swingTax = swingIsExempt || swingAfter <= 0 ? 0 : swingAfter * SWING_RATE;
  const dayTax = dayAfter <= 0 ? 0 : dayAfter * DAYTRADE_RATE;
  const fiiTax = fiiAfter <= 0 ? 0 : fiiAfter * FII_RATE;
  const taxDue = swingTax + dayTax + fiiTax;

  // Prejuízos que vão pra próximos meses
  const nextSwingLoss = swingAfter < 0 ? swingAfter : 0;
  const nextDayLoss = dayAfter < 0 ? dayAfter : 0;
  const nextFiiLoss = fiiAfter < 0 ? fiiAfter : 0;

  // Data de vencimento: último dia útil do mês seguinte
  const [y, m] = monthKey.split('-').map(Number);
  const nextMonth = new Date(y, m, 0); // 0 = último dia do mês m (já é próximo mês)
  const nextMonthLastDay = new Date(y, m + 1, 0);
  const dueDate = nextMonthLastDay.toISOString().slice(0, 10);

  return {
    monthKey,
    swingProfitLoss,
    swingSalesVolume,
    swingIsExempt,
    dayTradeProfitLoss,
    fiiProfitLoss,
    taxDue,
    taxByCategory: { swing: swingTax, dayTrade: dayTax, fii: fiiTax },
    compensablePrejuizo: {
      swing: nextSwingLoss,
      dayTrade: nextDayLoss,
      fii: nextFiiLoss,
    },
    darfCode: '6015',
    dueDate,
  };
}

/**
 * Calcula IR de todos os meses com operações.
 * Faz compensação em cascata: prejuízo mês X compensa lucro mês Y.
 */
export function computeAllMonthlyIr(operations: Operation[]): IrSummary[] {
  const monthsWithOps = Array.from(new Set(operations.map((op) => op.date.slice(0, 7)))).sort();
  const results: IrSummary[] = [];
  const losses: LossState = { swing: 0, dayTrade: 0, fii: 0 };

  for (const m of monthsWithOps) {
    const summary = computeMonthlyIr(operations, m, losses);
    results.push(summary);
    losses.swing = summary.compensablePrejuizo.swing;
    losses.dayTrade = summary.compensablePrejuizo.dayTrade;
    losses.fii = summary.compensablePrejuizo.fii;
  }
  return results;
}

export function fmtBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
