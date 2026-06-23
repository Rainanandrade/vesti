// /api/quote?symbol=PETR4
// Tenta brapi.dev (oficial BR) primeiro, Yahoo Finance como fallback.

import { setCors } from './_lib/cors.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!rateLimitOrReject(req, res, { limit: 120, windowMs: 60_000, prefix: 'quote' })) return;

  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'symbol é obrigatório' });
  }

  const raw = symbol.toUpperCase();
  const clean = raw.replace(/[^A-Z0-9]/g, '');
  // brapi free não libera ^BVSP/IBOV; usamos BOVA11 (ETF) como proxy.
  const isIbovIndex = raw === '^BVSP' || raw === 'IBOV' || clean === 'BVSP';
  const brapiTicker = isIbovIndex ? 'BOVA11' : clean;

  // 1) brapi.dev (preferred)
  if (BRAPI_TOKEN) {
    try {
      const url = `https://brapi.dev/api/quote/${brapiTicker}?token=${BRAPI_TOKEN}`;
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (r.ok) {
        const json = await r.json();
        const q = json?.results?.[0];
        if (q && typeof q.regularMarketPrice === 'number') {
          return res.status(200).json({
            symbol: isIbovIndex ? 'IBOV' : clean,
            shortName: isIbovIndex ? 'Ibovespa' : (q.shortName || q.symbol),
            longName: isIbovIndex ? 'Ibovespa (via BOVA11)' : (q.longName || q.shortName),
            regularMarketPrice: q.regularMarketPrice,
            regularMarketChange: q.regularMarketChange ?? 0,
            regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
            previousClose: q.regularMarketPreviousClose,
            currency: q.currency || 'BRL',
            source: 'brapi',
          });
        }
      }
    } catch {
      // segue pro Yahoo
    }
  }

  // 2) Yahoo Finance (fallback)
  try {
    const yahooSymbol = `${clean}.SA`;
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`;
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!r.ok) {
      return res.status(503).json({ error: 'Cotações temporariamente indisponíveis. Tente em alguns minutos.' });
    }
    const json = await r.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return res.status(404).json({ error: 'Ativo não encontrado' });
    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - prev;
    const changePct = prev > 0 ? (change / prev) * 100 : 0;
    return res.status(200).json({
      symbol: clean,
      shortName: meta.shortName,
      longName: meta.longName,
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: changePct,
      previousClose: prev,
      currency: meta.currency,
      source: 'yahoo',
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
