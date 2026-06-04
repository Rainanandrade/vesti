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

// Estimativa de DY anual (%) — prioriza dado REAL da API, fallback apenas se ausente
function estimateDY(asset: Asset, details: AssetDetails | null): number {
  // 1. Se a API retornou um DY válido e razoável, usa (dado real)
  if (details?.dividendYield != null && isFinite(details.dividendYield) && details.dividendYield > 0) {
    // Cap defensivo: se vier acima de 30%, pode ser bug → ignora e usa estimativa
    if (details.dividendYield <= 30) return details.dividendYield;
  }

  // 2. Fallback por tipo de ativo (taxas médias do mercado brasileiro)
  const s = asset.symbol.toUpperCase();
  const name = asset.name?.toUpperCase() || '';

  if (asset.type === 'tesouro') {
    if (/IPCA/.test(name) || /IPCA/.test(s)) return 11;       // IPCA + ~6%
    if (/PREFIXAD/.test(name) || /PREFIXAD/.test(s)) return 12;
    return 11; // Selic
  }
  if (asset.type === 'cdb') {
    if (/LCI|LCA/.test(name)) return 10; // isentos costumam render +ou-
    return 11;
  }

  // FII padrão (não-ETF, não-internacional)
  if (FII_PATTERN.test(s) && !INTL_ETFS.includes(s) && !ETF_BR.includes(s)) {
    return 9; // FIIs típicos pagam 8-11%
  }

  // ETFs internacionais (baixo DY)
  if (INTL_ETFS.includes(s)) return 1.5;

  // ETFs brasileiros
  if (ETF_BR.includes(s)) return 5;

  // Ações default
  return 4;
}

// Calendário levando em conta tipo de ativo
function getCalendarForAsset(asset: Asset): DividendCalendar {
  // Renda fixa: tratar como mensal (juros são acruídos continuamente)
  if (asset.type === 'tesouro' || asset.type === 'cdb') {
    return { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
  }
  return getCalendarFor(asset.symbol);
}

export function computeDividendForecast(
  assets: Asset[],
  prices: Record<string, number>,
  details: Record<string, AssetDetails | null>,
  dividendsInfo: Record<string, DividendInfo | null> = {},
  now: Date = new Date(),
): DividendForecast {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthlyDist = new Array(12).fill(0);
  const thisMonthBySymbol: Record<string, number> = {};
  let totalAnnualPotential = 0;
  let totalValue = 0;

  for (const asset of assets) {
    const price = prices[asset.symbol] ?? asset.avgPrice;
    const value = price * asset.quantity;
    if (value <= 0) continue;
    totalValue += value;

    const addedDate = new Date(asset.addedAt);
    const addedYear = addedDate.getFullYear();
    const addedMonth = addedDate.getMonth() + 1;
    if (addedYear > currentYear) continue;
    const startMonth = addedYear < currentYear ? 1 : addedMonth;

    const realInfo = dividendsInfo[asset.symbol];

    // ============ PREFERE DADO REAL DO STATUS INVEST ============
    if (realInfo && realInfo.history && realInfo.history.length > 0) {
      // Regra de elegibilidade: o usuário precisa ter comprado pelo menos 5 dias
      // antes da data do pagamento pra ser considerado holder (cobre o ex-dividendo)
      const MIN_HOLD_DAYS = 5;
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      const todayIso = now.toISOString().slice(0, 10);
      const addedAtMs = asset.addedAt;
      const addedIsoDate = new Date(addedAtMs).toISOString().slice(0, 10);

      // Soma POR MÊS (evita duplicação de JCP + dividendo na mesma data)
      const sumByMonth = new Map<number, number>();
      const knownMonths = new Set<number>();

      for (const entry of realInfo.history) {
        if (entry.date < yearStart || entry.date > yearEnd) continue;
        const entryMs = new Date(entry.date).getTime();
        // Pagamento passado/atual: precisa ter sido holder por X dias antes
        if (entry.date <= todayIso) {
          if (entryMs - addedAtMs < MIN_HOLD_DAYS * 24 * 60 * 60 * 1000) continue;
        } else {
          // Futuro: precisa ter sido adicionado antes dessa data
          if (entry.date < addedIsoDate) continue;
        }
        const m = parseInt(entry.date.slice(5, 7), 10);
        sumByMonth.set(m, (sumByMonth.get(m) || 0) + entry.amount);
        knownMonths.add(m);
      }

      // Projeta meses futuros do ano (não cobertos pelo histórico)
      const avgPerPayment = realInfo.averageAmount > 0 ? realInfo.averageAmount : realInfo.lastAmount;
      const freq = realInfo.frequency;
      if (freq === 'monthly') {
        for (let m = startMonth; m <= 12; m++) {
          if (knownMonths.has(m)) continue;
          // Só projeta se for mês futuro
          if (m >= currentMonth) sumByMonth.set(m, (sumByMonth.get(m) || 0) + avgPerPayment);
        }
      } else if (realInfo.averageInterval > 0) {
        const sortedDates = realInfo.history.map((h) => h.date).sort();
        const lastKnown = sortedDates[sortedDates.length - 1];
        if (lastKnown) {
          const cursor = new Date(lastKnown);
          while (cursor.getFullYear() <= currentYear) {
            cursor.setDate(cursor.getDate() + realInfo.averageInterval);
            const cy = cursor.getFullYear();
            const cm = cursor.getMonth() + 1;
            const cursorIso = cursor.toISOString().slice(0, 10);
            if (cy > currentYear) break;
            if (cursorIso < addedIsoDate) continue;
            if (cursorIso <= todayIso) continue; // só projeta no futuro
            if (knownMonths.has(cm)) continue;
            if (cm < startMonth) continue;
            sumByMonth.set(cm, (sumByMonth.get(cm) || 0) + avgPerPayment);
          }
        }
      }

      // Aplica ao monthlyDist e thisMonth
      sumByMonth.forEach((sumPerCota, m) => {
        const total = sumPerCota * asset.quantity;
        monthlyDist[m - 1] += total;
        if (m === currentMonth) {
          thisMonthBySymbol[asset.symbol] = (thisMonthBySymbol[asset.symbol] || 0) + total;
        }
      });

      // Soma anual potencial pra DY
      const monthsPerYear = freq === 'monthly' ? 12 : freq === 'quarterly' ? 4 : freq === 'semestral' ? 2 : 1;
      totalAnnualPotential += avgPerPayment * asset.quantity * monthsPerYear;
      continue;
    }

    // ============ FALLBACK: ESTIMATIVA POR DY + CALENDÁRIO ============
    const dy = estimateDY(asset, details[asset.symbol] || null);
    if (dy <= 0) continue;

    const annualIncome = value * (dy / 100);
    if (annualIncome <= 0) continue;
    totalAnnualPotential += annualIncome;

    const cal = getCalendarForAsset(asset);
    if (cal.months.length === 0) continue;
    const perPayment = annualIncome / cal.months.length;
    const eligibleMonths = cal.months.filter((m) => m >= startMonth);

    for (const m of eligibleMonths) {
      monthlyDist[m - 1] += perPayment;
    }
    if (eligibleMonths.includes(currentMonth)) {
      thisMonthBySymbol[asset.symbol] = (thisMonthBySymbol[asset.symbol] || 0) + perPayment;
    }
  }

  const weightedDY = totalValue > 0 ? (totalAnnualPotential / totalValue) * 100 : 0;

  // YTD: meses já passados deste ano (jan até mês_atual - 1)
  let ytdReceived = 0;
  for (let m = 0; m < currentMonth - 1; m++) ytdReceived += monthlyDist[m];

  // A receber: mês atual + futuros até dezembro
  let remainingThisYear = 0;
  for (let m = currentMonth - 1; m < 12; m++) remainingThisYear += monthlyDist[m];

  // Total esperado neste ano = só o que realmente caberá receber (pós-compra)
  const totalThisYear = monthlyDist.reduce((s, v) => s + v, 0);

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
