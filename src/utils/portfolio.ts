import { Asset } from '../context/AppContext';

export type PortfolioStats = {
  totalInvested: number;
  totalCurrent: number;
  profit: number;
  profitPct: number;
  annualizedPct: number;
  weightedDays: number;
};

const DAY_MS = 1000 * 60 * 60 * 24;

export function computePortfolioStats(assets: Asset[], prices: Record<string, number>): PortfolioStats {
  if (assets.length === 0) {
    return { totalInvested: 0, totalCurrent: 0, profit: 0, profitPct: 0, annualizedPct: 0, weightedDays: 0 };
  }
  let totalInvested = 0;
  let totalCurrent = 0;
  let weightedDaysNum = 0;

  const now = Date.now();
  for (const a of assets) {
    const price = prices[a.symbol] ?? a.avgPrice;
    const invested = a.avgPrice * a.quantity;
    const current = price * a.quantity;
    const days = Math.max(1, (now - a.addedAt) / DAY_MS);
    totalInvested += invested;
    totalCurrent += current;
    weightedDaysNum += invested * days;
  }
  const profit = totalCurrent - totalInvested;
  const profitPct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
  const weightedDays = totalInvested > 0 ? weightedDaysNum / totalInvested : 0;

  // Anualização: (1 + r)^(365/dias) - 1
  let annualizedPct = 0;
  if (weightedDays > 0 && totalInvested > 0) {
    const r = profit / totalInvested;
    annualizedPct = (Math.pow(1 + r, 365 / weightedDays) - 1) * 100;
  }

  return { totalInvested, totalCurrent, profit, profitPct, annualizedPct, weightedDays };
}
