import { Asset } from '../context/AppContext';
import { AssetDetails } from '../api/yahooDetails';
import { DividendCalendar, getCalendarFor } from '../data/dividends';
import { DividendInfo } from '../api/dividends';

export type DividendForecast = {
  thisMonth: number;
  thisMonthBySymbol: Record<string, number>;
  ytdReceived: number;
  remainingThisYear: number;
  totalThisYear: number;
  weightedDY: number;
  monthlyDistribution: number[];
  currentYear: number;
};

const FII_PATTERN = /^[A-Z]{4}11$/;
const INTL_ETFS = ['IVVB11', 'NASD11', 'WRLD11', 'SPXI11', 'BITH11', 'ETHE11'];
const ETF_BR = ['BOVA11', 'BOVV11', 'SMAL11', 'DIVO11', 'GOLD11', 'FIXA11'];

function estimateDY(asset: Asset, details: AssetDetails | null): number {
  if (details?.dividendYield != null && isFinite(details.dividendYield) && details.dividendYield > 0) {
    if (details.dividendYield <= 30) return details.dividendYield;
  }
  const s = asset.symbol.toUpperCase();
  const name = asset.name?.toUpperCase() || '';
  if (asset.type === 'tesouro') {
    if (/IPCA/.test(name) || /IPCA/.test(s)) return 11;
    if (/PREFIXAD/.test(name) || /PREFIXAD/.test(s)) return 12;
    return 11;
  }
  if (asset.type === 'cdb') {
    if (/LCI|LCA/.test(name)) return 10;
    return 11;
  }
  if (FII_PATTERN.test(s) && !INTL_ETFS.includes(s) && !ETF_BR.includes(s)) return 9;
  if (INTL_ETFS.includes(s)) return 1.5;
  if (ETF_BR.includes(s)) return 5;
  return 4;
}

function getCalendarForAsset(asset: Asset): DividendCalendar {
  if (asset.type === 'tesouro' || asset.type === 'cdb') {
    return { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
  }
  return getCalendarFor(asset.symbol);
}

// Heurística mais permissiva: se o ativo estava na carteira antes da data
// do pagamento, conta. A "data com" da B3 costuma ser apenas 1 dia antes.
const MIN_HOLD_DAYS = 0;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeDividendForecast(
  assets: Asset[],
  prices: Record<string, number>,
  details: Record<string, AssetDetails | null>,
  dividendsInfo: Record<string, DividendInfo | null> = {},
  now: Date = new Date(),
): DividendForecast {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const todayIso = now.toISOString().slice(0, 10);
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;
  const monthlyDist = new Array(12).fill(0);
  const thisMonthBySymbol: Record<string, number> = {};
  let ytdReceived = 0;
  let remainingThisYear = 0;
  let totalAnnualPotential = 0;
  let totalValue = 0;

  for (const asset of assets) {
    const price = prices[asset.symbol] ?? asset.avgPrice;
    const value = price * asset.quantity;
    if (value <= 0) continue;
    totalValue += value;

    const addedAtMs = asset.addedAt;
    const addedIsoDate = new Date(addedAtMs).toISOString().slice(0, 10);
    const addedDate = new Date(addedAtMs);
    if (addedDate.getFullYear() > currentYear) continue;

    const realInfo = dividendsInfo[asset.symbol];

    // =========== Coleta entradas elegíveis do ano corrente ===========
    // Uma entrada por mês (somando se houver múltiplos proventos no mesmo mês)
    type Entry = { dateIso: string; perCota: number };
    const entriesByMonth = new Map<number, Entry>();

    const addEntry = (dateIso: string, perCota: number) => {
      if (dateIso < yearStart || dateIso > yearEnd) return;
      if (perCota <= 0) return;
      // Regra de posse: pra entradas passadas, precisa ter 5+ dias antes
      if (dateIso <= todayIso) {
        const entryMs = new Date(dateIso).getTime();
        if (entryMs - addedAtMs < MIN_HOLD_DAYS * MS_PER_DAY) return;
      } else {
        // Futura: precisa ter sido holder antes da data
        if (dateIso < addedIsoDate) return;
      }
      const m = parseInt(dateIso.slice(5, 7), 10);
      const existing = entriesByMonth.get(m);
      if (existing) {
        existing.perCota += perCota;
        if (dateIso < existing.dateIso) existing.dateIso = dateIso;
      } else {
        entriesByMonth.set(m, { dateIso, perCota });
      }
    };

    // 1) Tem dados reais → usa eles
    let usedRealData = false;
    if (realInfo && realInfo.history && realInfo.history.length > 0) {
      usedRealData = true;
      for (const h of realInfo.history) {
        addEntry(h.date, h.amount);
      }
      // 2) Projeta APENAS meses FUTUROS (não-corrente) não cobertos pelo histórico
      //    Nunca projeta no mês corrente — esse só reflete o que REALMENTE veio
      //    no histórico. Isso evita inflar valores quando o pagamento mensal já
      //    aconteceu e o app somava outra estimativa em cima.
      if (realInfo.averageInterval > 0 && realInfo.averageAmount > 0) {
        const cal = getCalendarFor(asset.symbol);
        const projectedAmount = realInfo.averageAmount;
        for (const m of cal.months) {
          if (m === currentMonth) continue;       // mês atual = só real
          if (m < currentMonth) continue;          // não projeta passado
          if (entriesByMonth.has(m)) continue;
          const day = realInfo.lastDate ? realInfo.lastDate.slice(8, 10) : '15';
          const projectedIso = `${currentYear}-${String(m).padStart(2, '0')}-${day}`;
          if (projectedIso > todayIso) addEntry(projectedIso, projectedAmount);
        }
      }
    }

    // 3) Sem dados reais → estima por DY + calendário estático
    //    Mesma regra: nunca projetar no mês corrente.
    if (!usedRealData) {
      const dy = estimateDY(asset, details[asset.symbol] || null);
      if (dy <= 0) continue;
      const annualIncome = value * (dy / 100);
      if (annualIncome <= 0) continue;
      const cal = getCalendarForAsset(asset);
      if (cal.months.length === 0) continue;
      const perPayment = annualIncome / cal.months.length / asset.quantity;
      for (const m of cal.months) {
        if (m === currentMonth) continue;
        if (m < currentMonth) continue;
        const iso = `${currentYear}-${String(m).padStart(2, '0')}-15`;
        addEntry(iso, perPayment);
      }
    }

    // =========== Aplica aos totais ===========
    let assetAnnual = 0;
    entriesByMonth.forEach((entry, m) => {
      const total = entry.perCota * asset.quantity;
      monthlyDist[m - 1] += total;
      assetAnnual += total;
      if (entry.dateIso <= todayIso) {
        ytdReceived += total;
      } else {
        remainingThisYear += total;
      }
      if (m === currentMonth) {
        thisMonthBySymbol[asset.symbol] = (thisMonthBySymbol[asset.symbol] || 0) + total;
      }
    });

    totalAnnualPotential += assetAnnual;
  }

  const weightedDY = totalValue > 0 ? (totalAnnualPotential / totalValue) * 100 : 0;
  const totalThisYear = ytdReceived + remainingThisYear;

  return {
    thisMonth: monthlyDist[currentMonth - 1],
    thisMonthBySymbol,
    ytdReceived,
    remainingThisYear,
    totalThisYear,
    weightedDY,
    monthlyDistribution: monthlyDist,
    currentYear,
  };
}
