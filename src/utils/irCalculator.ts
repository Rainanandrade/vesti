import { Operation } from '../context/AppContext';
import { calculateTaxLedger } from './irEngine';

export type LossState = {
  swing: number;
  etf: number;
  dayTrade: number;
  fii: number;
};

export type IrSummary = {
  monthKey: string;
  swingProfitLoss: number;
  swingSalesVolume: number;
  swingIsExempt: boolean;
  etfProfitLoss: number;
  etfSalesVolume: number;
  dayTradeProfitLoss: number;
  fiiProfitLoss: number;
  taxDue: number;
  grossTax: number;
  withholdingTax: number;
  carriedDarfIn: number;
  carriedDarfOut: number;
  incompleteCostBasis: boolean;
  taxByCategory: { swing: number; etf: number; dayTrade: number; fii: number };
  compensablePrejuizo: LossState;
  darfCode: string;
  dueDate: string;
};

type EngineSummary = {
  monthKey: string;
  stockProfitLoss: number;
  stockSalesVolume: number;
  stockIsExempt: boolean;
  etfProfitLoss: number;
  etfSalesVolume: number;
  dayTradeProfitLoss: number;
  fiiProfitLoss: number;
  taxDue: number;
  grossTax: number;
  withholdingTax: number;
  carriedDarfIn: number;
  carriedDarfOut: number;
  incompleteCostBasis: boolean;
  taxByCategory: { stock: number; etf: number; dayTrade: number; fii: number };
  carriedLosses: { stock: number; etf: number; dayTrade: number; fii: number };
  darfCode: string;
  dueDate: string;
};

function fromEngine(summary: EngineSummary): IrSummary {
  return {
    monthKey: summary.monthKey,
    swingProfitLoss: summary.stockProfitLoss,
    swingSalesVolume: summary.stockSalesVolume,
    swingIsExempt: summary.stockIsExempt,
    etfProfitLoss: summary.etfProfitLoss,
    etfSalesVolume: summary.etfSalesVolume,
    dayTradeProfitLoss: summary.dayTradeProfitLoss,
    fiiProfitLoss: summary.fiiProfitLoss,
    taxDue: summary.taxDue,
    grossTax: summary.grossTax,
    withholdingTax: summary.withholdingTax,
    carriedDarfIn: summary.carriedDarfIn,
    carriedDarfOut: summary.carriedDarfOut,
    incompleteCostBasis: summary.incompleteCostBasis,
    taxByCategory: {
      swing: summary.taxByCategory.stock,
      etf: summary.taxByCategory.etf,
      dayTrade: summary.taxByCategory.dayTrade,
      fii: summary.taxByCategory.fii,
    },
    compensablePrejuizo: {
      swing: summary.carriedLosses.stock,
      etf: summary.carriedLosses.etf,
      dayTrade: summary.carriedLosses.dayTrade,
      fii: summary.carriedLosses.fii,
    },
    darfCode: summary.darfCode,
    dueDate: summary.dueDate,
  };
}

export function computeMonthlyIr(operations: Operation[], monthKey: string): IrSummary {
  const result = computeAllMonthlyIr(operations).find((month) => month.monthKey === monthKey);
  if (result) return result;
  throw new Error(`Não há operações registradas em ${monthKey}.`);
}

export function computeAllMonthlyIr(operations: Operation[]): IrSummary[] {
  return (calculateTaxLedger(operations) as EngineSummary[]).map(fromEngine);
}

export function fmtBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
