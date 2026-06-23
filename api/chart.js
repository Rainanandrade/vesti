// /api/chart?symbol=PETR4&range=1y
// Histórico de preços com cascata de fontes (brapi.dev primeiro, Yahoo fallback).

import { setCors } from './_lib/cors.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';
import { isValidSymbol, isValidRange } from './_lib/validate.js';
import { fetchWithTimeout } from './_lib/fetch.js';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

const VALID_RANGES = ['1mo', '6mo', '1y', '5y'];

// Mapeamento de range pra params brapi
const BRAPI_RANGE = {
  '1mo': { range: '1mo', interval: '1d' },
  '6mo': { range: '6mo', interval: '1d' },
  '1y': { range: '1y', interval: '1wk' },
  '5y': { range: '5y', interval: '1mo' },
};

const YAHOO_INTERVAL = {
  '1mo': '1d',
  '6mo': '1d',
  '1y': '1wk',
  '5y': '1mo',
};

async function fromBrapi(symbol, range, indexProxy = false) {
  if (!BRAPI_TOKEN) return null;
  try {
    const { range: r, interval } = BRAPI_RANGE[range] || BRAPI_RANGE['1y'];
    // brapi free não libera ^BVSP/IBOV. Usamos BOVA11 (ETF iShares Ibovespa)
    // como proxy: segue o índice com erro insignificante no horizonte do app.
    let ticker = symbol;
    if (symbol === '^BVSP' || symbol === 'IBOV') {
      ticker = 'BOVA11';
    } else if (indexProxy && symbol.startsWith('^')) {
      ticker = 'BOVA11';
    }
    const url = `https://brapi.dev/api/quote/${ticker}?range=${r}&interval=${interval}&token=${BRAPI_TOKEN}`;
    const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    const result = json?.results?.[0];
    if (!result?.historicalDataPrice || !Array.isArray(result.historicalDataPrice)) return null;
    const arr = result.historicalDataPrice;
    if (arr.length === 0) return null;
    const points = arr
      .map((p) => ({
        t: (p.date || 0) * 1000,
        c: Number((p.close ?? p.adjustedClose ?? 0).toFixed(2)),
      }))
      .filter((p) => p.t > 0 && p.c > 0)
      .sort((a, b) => a.t - b.t);
    if (points.length < 2) return null;
    return buildResult(symbol, range, interval, points, result.currency || 'BRL');
  } catch {
    return null;
  }
}

async function fromYahoo(symbol, range, viaProxy = false) {
  // Yahoo usa ^BVSP pra IBOV (não aceita "IBOV.SA")
  const sym = symbol.startsWith('^')
    ? symbol
    : symbol === 'IBOV'
    ? '^BVSP'
    : `${symbol.toUpperCase()}.SA`;
  const interval = YAHOO_INTERVAL[range] || '1d';
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}`;
  const url = viaProxy ? `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}` : yahooUrl;
  try {
    const r = await fetchWithTimeout(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!r.ok) return null;
    const json = await r.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;
    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];
    if (timestamps.length === 0 || closes.length === 0) return null;
    const points = [];
    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      const c = closes[i];
      if (t != null && c != null && isFinite(c)) {
        points.push({ t: t * 1000, c: Number(c.toFixed(2)) });
      }
    }
    if (points.length < 2) return null;
    return buildResult(symbol, range, interval, points, result.meta?.currency || 'BRL');
  } catch {
    return null;
  }
}

function buildResult(symbol, range, interval, points, currency) {
  return {
    symbol,
    range,
    interval,
    points,
    currency,
    first: points[0].c,
    last: points[points.length - 1].c,
    changePct: ((points[points.length - 1].c - points[0].c) / points[0].c) * 100,
  };
}

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!(await rateLimitOrReject(req, res, { limit: 60, windowMs: 60_000, prefix: 'chart' }))) return;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  const { symbol, range, debug } = req.query;
  if (!isValidSymbol(typeof symbol === 'string' ? symbol.toUpperCase() : '')) {
    return res.status(400).json({ error: 'symbol inválido' });
  }
  const r = isValidRange(range) ? range : '1y';
  const isIndex = symbol.startsWith('^');
  const cleanCore = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const clean = isIndex ? `^${cleanCore}` : cleanCore;

  const attempts = [];

  // 1) brapi (primário, mais confiável pra B3)
  let data = await fromBrapi(clean, r);
  attempts.push({ source: 'brapi', ok: !!data });

  // 2) Yahoo direto
  if (!data) {
    data = await fromYahoo(clean, r, false);
    attempts.push({ source: 'yahoo-direct', ok: !!data });
  }

  // 3) Yahoo via proxy
  if (!data) {
    data = await fromYahoo(clean, r, true);
    attempts.push({ source: 'yahoo-proxy', ok: !!data });
  }

  if (!data) {
    const payload = { error: 'Histórico indisponível' };
    if (debug === '1') payload.attempts = attempts;
    return res.status(404).json(payload);
  }

  return res.status(200).json(debug === '1' ? { ...data, attempts } : data);
}
