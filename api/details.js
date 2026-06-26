// /api/details?symbol=PETR4
// Tenta brapi.dev (com modules de fundamentals) primeiro, Yahoo como fallback.

const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

const YAHOO_MODULES = [
  'summaryDetail',
  'defaultKeyStatistics',
  'assetProfile',
  'financialData',
  'price',
].join(',');

function pickRaw(obj) {
  if (obj == null) return undefined;
  if (typeof obj === 'number') return obj;
  if (typeof obj === 'object' && 'raw' in obj) return obj.raw;
  return undefined;
}

// Normaliza percentual: aceita tanto decimal (0.085) quanto pct (8.5)
function pct(raw) {
  if (raw == null || !isFinite(raw)) return undefined;
  if (raw < 0) return 0;
  // Se <= 0.5, é decimal (0.085 → 8.5%). Se > 0.5, já é pct (8.5 → 8.5%).
  return raw <= 0.5 ? raw * 100 : raw;
}

async function fromBrapi(symbol) {
  if (!BRAPI_TOKEN) return null;
  try {
    const url = `https://brapi.dev/api/quote/${symbol}?modules=summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory`;
    const headers = { Accept: 'application/json' };
    if (BRAPI_TOKEN) headers.Authorization = `Bearer ${BRAPI_TOKEN}`;
    const r = await fetchWithTimeout(url, { headers });
    if (!r.ok) return null;
    const json = await r.json();
    const q = json?.results?.[0];
    if (!q) return null;

    const profile = q.summaryProfile || {};
    const stats = q.defaultKeyStatistics || {};
    const fin = q.financialData || {};

    return {
      symbol,
      shortName: q.shortName,
      longName: q.longName,
      sector: profile.sector,
      industry: profile.industry,
      businessSummary: profile.longBusinessSummary,
      currentPrice: q.regularMarketPrice,
      dividendYield: pct(q.dividendYield),
      trailingPE: q.priceEarnings ?? stats.forwardPE,
      priceToBook: stats.priceToBook,
      returnOnEquity: pct(fin.returnOnEquity),
      returnOnAssets: pct(fin.returnOnAssets),
      profitMargins: pct(fin.profitMargins),
      totalCash: fin.totalCash,
      totalDebt: fin.totalDebt,
      debtToEquity: fin.debtToEquity,
      revenueGrowth: pct(fin.revenueGrowth),
      earningsGrowth: pct(fin.earningsGrowth),
      marketCap: q.marketCap,
      beta: stats.beta,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow,
      payoutRatio: pct(q.payoutRatio),
      dividendRate: q.dividendRate,
      fiveYearAvgDividendYield: pct(q.fiveYearAvgDividendYield),
      source: 'brapi',
    };
  } catch {
    return null;
  }
}

async function fromYahoo(symbol) {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}.SA?modules=${YAHOO_MODULES}`;
    const r = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!r.ok) return null;
    const json = await r.json();
    const r0 = json?.quoteSummary?.result?.[0];
    if (!r0) return null;

    const summary = r0.summaryDetail || {};
    const stats = r0.defaultKeyStatistics || {};
    const profile = r0.assetProfile || {};
    const fin = r0.financialData || {};
    const price = r0.price || {};

    return {
      symbol,
      shortName: price.shortName,
      longName: price.longName,
      sector: profile.sector,
      industry: profile.industry,
      businessSummary: profile.longBusinessSummary,
      currentPrice: pickRaw(fin.currentPrice) ?? pickRaw(price.regularMarketPrice),
      dividendYield: pct(pickRaw(summary.dividendYield)),
      trailingPE: pickRaw(summary.trailingPE),
      priceToBook: pickRaw(stats.priceToBook),
      returnOnEquity: pct(pickRaw(fin.returnOnEquity)),
      returnOnAssets: pct(pickRaw(fin.returnOnAssets)),
      profitMargins: pct(pickRaw(fin.profitMargins)),
      totalCash: pickRaw(fin.totalCash),
      totalDebt: pickRaw(fin.totalDebt),
      debtToEquity: pickRaw(fin.debtToEquity),
      revenueGrowth: pct(pickRaw(fin.revenueGrowth)),
      earningsGrowth: pct(pickRaw(fin.earningsGrowth)),
      marketCap: pickRaw(summary.marketCap),
      beta: pickRaw(summary.beta),
      fiftyTwoWeekHigh: pickRaw(summary.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: pickRaw(summary.fiftyTwoWeekLow),
      payoutRatio: pct(pickRaw(summary.payoutRatio)),
      dividendRate: pickRaw(summary.dividendRate),
      fiveYearAvgDividendYield: pct(pickRaw(summary.fiveYearAvgDividendYield)),
      source: 'yahoo',
    };
  } catch {
    return null;
  }
}

import { setCors as _setCors } from './_lib/cors.js';
import { rateLimitOrReject as _rl } from './_lib/rateLimit.js';
import { isValidSymbol } from './_lib/validate.js';
import { fetchWithTimeout } from './_lib/fetch.js';

export default async function handler(req, res) {
  _setCors(req, res);
  res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  if (!(await _rl(req, res, { limit: 60, windowMs: 60_000, prefix: 'det' }))) return;

  const { symbol } = req.query;
  if (!isValidSymbol(typeof symbol === 'string' ? symbol.toUpperCase() : '')) {
    return res.status(400).json({ error: 'symbol inválido' });
  }

  const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const brapi = await fromBrapi(clean);
  if (brapi && hasMeaningfulData(brapi)) return res.status(200).json(brapi);

  const yahoo = await fromYahoo(clean);
  if (yahoo && hasMeaningfulData(yahoo)) return res.status(200).json(yahoo);

  // Fallback: pega cotação básica (FIIs/Units no plano free não têm modules,
  // mas a cotação simples sempre vem). Retornamos algo pra UI conseguir renderizar.
  const basic = await fromBrapiQuote(clean);
  if (basic) return res.status(200).json(basic);

  return res.status(503).json({
    error: 'Análise fundamentalista temporariamente indisponível pra este ativo.',
  });
}

function hasMeaningfulData(d) {
  if (!d) return false;
  // Considera "significativo" se tem pelo menos preço + alguma métrica
  return d.currentPrice != null && (
    d.dividendYield != null ||
    d.trailingPE != null ||
    d.priceToBook != null ||
    d.sector ||
    d.businessSummary
  );
}

async function fromBrapiQuote(symbol) {
  if (!BRAPI_TOKEN) return null;
  try {
    const url = `https://brapi.dev/api/quote/${symbol}`;
    const headers = { Accept: 'application/json' };
    if (BRAPI_TOKEN) headers.Authorization = `Bearer ${BRAPI_TOKEN}`;
    const r = await fetchWithTimeout(url, { headers });
    if (!r.ok) return null;
    const json = await r.json();
    const q = json?.results?.[0];
    if (!q) return null;
    return {
      symbol,
      shortName: q.shortName,
      longName: q.longName,
      currentPrice: q.regularMarketPrice,
      dividendYield: q.dividendYield != null ? Number((q.dividendYield * 100).toFixed(2)) : undefined,
      trailingPE: q.priceEarnings,
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow,
      marketCap: q.marketCap,
      source: 'brapi-basic',
      // Aviso pra UI mostrar que veio só básico
      partial: true,
    };
  } catch {
    return null;
  }
}
