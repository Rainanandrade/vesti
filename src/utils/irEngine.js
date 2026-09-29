const STOCK_EXEMPTION = 20_000;
const MINIMUM_DARF = 10;

const CATEGORY_BY_ASSET = {
  acao: 'stock',
  etf: 'etf',
  fii: 'fii',
  daytrade: 'dayTrade',
};

const RATE_BY_CATEGORY = {
  stock: 0.15,
  etf: 0.15,
  fii: 0.2,
  dayTrade: 0.2,
};

const CATEGORIES = Object.keys(RATE_BY_CATEGORY);

function money(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function emptyCategoryRecord() {
  return { stock: 0, etf: 0, fii: 0, dayTrade: 0 };
}

function monthState(monthKey) {
  return {
    monthKey,
    profitLoss: emptyCategoryRecord(),
    salesVolume: emptyCategoryRecord(),
    withholdingTax: 0,
    incompleteCostBasis: false,
  };
}

function previousWeekdayDueDate(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const due = new Date(Date.UTC(year, month + 1, 0));
  while (due.getUTCDay() === 0 || due.getUTCDay() === 6) {
    due.setUTCDate(due.getUTCDate() - 1);
  }
  return due.toISOString().slice(0, 10);
}

function calculateTaxLedger(operations) {
  const sorted = operations
    .map((operation, index) => ({ ...operation, __index: index }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.__index - b.__index);

  const months = new Map();
  const positions = new Map();

  for (const operation of sorted) {
    const monthKey = operation.date.slice(0, 7);
    if (!months.has(monthKey)) months.set(monthKey, monthState(monthKey));

    const category = CATEGORY_BY_ASSET[operation.assetType];
    if (!category) continue;

    const key = `${operation.assetType}:${String(operation.symbol).toUpperCase()}`;
    const current = positions.get(key) || { quantity: 0, totalCost: 0 };
    const quantity = Number(operation.quantity);
    const price = Number(operation.price);
    const fees = Math.max(0, Number(operation.fees) || 0);

    if (!(quantity > 0) || !(price >= 0) || !Number.isFinite(quantity) || !Number.isFinite(price)) {
      continue;
    }

    if (operation.type === 'buy') {
      current.quantity += quantity;
      current.totalCost += quantity * price + fees;
      positions.set(key, current);
      continue;
    }

    if (operation.type !== 'sell') continue;

    const month = months.get(monthKey);
    const revenue = quantity * price;
    month.salesVolume[category] += revenue;
    month.withholdingTax += Math.max(0, Number(operation.withholdingTax) || 0);

    if (current.quantity <= 0 || quantity > current.quantity) {
      month.incompleteCostBasis = true;
      continue;
    }

    const averageCost = current.totalCost / current.quantity;
    const costBasis = averageCost * quantity;
    const gain = revenue - fees - costBasis;
    month.profitLoss[category] += gain;

    current.quantity -= quantity;
    current.totalCost -= costBasis;
    if (current.quantity <= 0.00000001) {
      current.quantity = 0;
      current.totalCost = 0;
    }
    positions.set(key, current);
  }

  const carriedLosses = emptyCategoryRecord();
  let carriedDarf = 0;
  let withholdingCredit = 0;
  const summaries = [];

  for (const month of [...months.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey))) {
    const taxByCategory = emptyCategoryRecord();
    const stockIsExempt = month.salesVolume.stock <= STOCK_EXEMPTION;

    for (const category of CATEGORIES) {
      const result = money(month.profitLoss[category]);
      month.profitLoss[category] = result;

      if (category === 'stock' && stockIsExempt && result > 0) {
        continue;
      }

      if (result < 0) {
        carriedLosses[category] = money(carriedLosses[category] + Math.abs(result));
        continue;
      }

      const taxableProfit = Math.max(0, result - carriedLosses[category]);
      carriedLosses[category] = money(Math.max(0, carriedLosses[category] - result));
      taxByCategory[category] = money(taxableProfit * RATE_BY_CATEGORY[category]);
    }

    const grossTax = money(CATEGORIES.reduce((sum, category) => sum + taxByCategory[category], 0));
    const availableWithholding = money(withholdingCredit + month.withholdingTax);
    const withholdingUsed = money(Math.min(grossTax, availableWithholding));
    withholdingCredit = money(availableWithholding - withholdingUsed);
    const currentTaxAfterWithholding = money(grossTax - withholdingUsed);
    const carriedDarfIn = carriedDarf;
    const payable = money(carriedDarfIn + currentTaxAfterWithholding);
    const taxDue = payable >= MINIMUM_DARF ? payable : 0;
    carriedDarf = taxDue > 0 ? 0 : payable;

    summaries.push({
      monthKey: month.monthKey,
      stockProfitLoss: month.profitLoss.stock,
      stockSalesVolume: money(month.salesVolume.stock),
      stockIsExempt,
      etfProfitLoss: month.profitLoss.etf,
      etfSalesVolume: money(month.salesVolume.etf),
      fiiProfitLoss: month.profitLoss.fii,
      fiiSalesVolume: money(month.salesVolume.fii),
      dayTradeProfitLoss: month.profitLoss.dayTrade,
      dayTradeSalesVolume: money(month.salesVolume.dayTrade),
      taxByCategory,
      grossTax,
      withholdingTax: money(month.withholdingTax),
      withholdingUsed,
      withholdingCredit,
      currentTaxAfterWithholding,
      carriedDarfIn,
      carriedDarfOut: carriedDarf,
      taxDue,
      carriedLosses: { ...carriedLosses },
      incompleteCostBasis: month.incompleteCostBasis,
      darfCode: '6015',
      dueDate: previousWeekdayDueDate(month.monthKey),
    });
  }

  return summaries;
}

module.exports = {
  MINIMUM_DARF,
  STOCK_EXEMPTION,
  calculateTaxLedger,
  previousWeekdayDueDate,
};
