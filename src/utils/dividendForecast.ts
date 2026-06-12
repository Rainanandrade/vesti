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
  const todayIso = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const monthlyDist = new Array(12).fill(0);
  const thisMonthBySymbol: Record<string, number> = {};
  // Separamos por data exata: ytd = entradas com data <= hoje (já recebido)
  // remaining = entradas com data > hoje (a receber neste ano)
  let ytdReceivedSum = 0;
  let remainingThisYearSum = 0;
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
      // Regra de elegibilidade: usuário precisa ter sido holder antes do ex-dividendo
      // (usamos 5 dias como margem segura)
      const MIN_HOLD_DAYS = 5;
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      const addedAtMs = asset.addedAt;
      const addedIsoDate = new Date(addedAtMs).toISOString().slice(0, 10);

      // Cada entrada tratada por data exata (não por mês)
      type Entry = { date: string; amount: number };
      const entries: Entry[] = [];
      const knownByDate = new Set<string>();
      const sumByMonth = new Map<number, number>(); // pra agregar mesmo dia

      for (const e of realInfo.history) {
        if (e.date < yearStart || e.date > yearEnd) continue;
        const eMs = new Date(e.date).getTime();
        if (e.date <= todayIso) {
          // Pagamento passado/atual: precisa ter sido holder por MIN_HOLD_DAYS antes
          if (eMs - addedAtMs < MIN_HOLD_DAYS * 24 * 60 * 60 * 1000) continue;
        } else {
          // Futuro: precisa ter sido holder antes dessa data
          if (e.date < addedIsoDate) continue;
        }
        entries.push({ date: e.date, amount: e.amount });
        knownByDate.add(e.date);
      }

      // Projeta meses futuros do ano (não cobertos pelo histórico)
      const avgPerPayment = realInfo.averageAmount > 0 ? realInfo.averageAmount : realInfo.lastAmount;
      const freq = realInfo.frequency;
      if (realInfo.averageInterval > 0) {
        const sortedDates = realInfo.history.map((h) => h.date).sort();
        const lastKnown = sortedDates[sortedDates.length - 1];
        if (lastKnown) {
          const cursor = new Date(lastKnown);
          while (cursor.getFullYear() <= currentYear) {
            cursor.setDate(cursor.getDate() + realInfo.averageInterval);
            const cursorIso = cursor.toISOString().slice(0, 10);
            if (cursor.getFullYear() > currentYear) break;
            if (cursorIso < addedIsoDate) continue;
            if (cursorIso <= todayIso) continue; // só projeta no futuro
            // Evita duplicar com data conhecida no mesmo mês
            const cMonth = cursor.getMonth() + 1;
            const hasKnownInMonth = Array.from(knownByDate).some(
              (d) => parseInt(d.slice(5, 7), 10) === cMonth,
            );
            if (hasKnownInMonth) continue;
            if (cMonth < startMonth) continue;
            entries.push({ date: cursorIso, amount: avgPerPayment });
            knownByDate.add(cursorIso);
          }
        }
      }

      // Classifica cada entrada por data
      for (const e of entries) {
        const total = e.amount * asset.quantity;
        const m = parseInt(e.date.slice(5, 7), 10);
        monthlyDist[m - 1] += total;
        sumByMonth.set(m, (sumByMonth.get(m) || 0) + total);

        if (e.date <= todayIso) {
          ytdReceivedSum += total; // já recebido
        } else {
          remainingThisYearSum += total; // ainda vai receber
        }

        // ThisMonth: mostra TUDO do mês corrente (recebido + a receber)
        if (m === currentMonth) {
          thisMonthBySymbol[asset.symbol] = (thisMonthBySymbol[asset.symbol] || 0) + total;
        }
      }

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
      // Fallback distribui por mês — meses < currentMonth são "recebido", >= são "a receber"
      if (m < currentMonth) ytdReceivedSum += perPayment;
      else if (m === currentMonth) {
        thisMonthBySymbol[asset.symbol] = (thisMonthBySymbol[asset.symbol] || 0) + perPayment;
        remainingThisYearSum += perPayment;
      } else {
        remainingThisYearSum += perPayment;
      }
    }
  }

  const weightedDY = totalValue > 0 ? (totalAnnualPotential / totalValue) * 100 : 0;

  // YTD e remaining vêm direto do tracking por data exata
  const ytdReceived = ytdReceivedSum;
  const remainingThisYear = remainingThisYearSum;
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
