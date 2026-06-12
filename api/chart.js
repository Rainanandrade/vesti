// /api/chart?symbol=PETR4&range=1y
// Retorna histórico de preços via Yahoo Finance (com fallback de proxy).
// Ranges: 1mo, 6mo, 1y, 5y

const VALID_RANGES = ['1mo', '6mo', '1y', '5y'];
const RANGE_INTERVAL = {
  '1mo': '1d',
  '6mo': '1d',
  '1y': '1wk',
  '5y': '1mo',
};

async function fetchYahoo(symbol, range, viaProxy = false) {
  // Símbolos que começam com ^ são índices (^BVSP = Ibovespa) — não levam .SA
  const sym = symbol.startsWith('^') ? symbol : `${symbol.toUpperCase()}.SA`;
  const interval = RANGE_INTERVAL[range] || '1d';
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=${range}&interval=${interval}`;
  const url = viaProxy ? `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}` : yahooUrl;
  try {
    const r = await fetch(url, {
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
    return {
      symbol,
      range,
      interval,
      points,
      currency: result.meta?.currency || 'BRL',
      first: points[0].c,
      last: points[points.length - 1].c,
      changePct: ((points[points.length - 1].c - points[0].c) / points[0].c) * 100,
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const { symbol, range } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'symbol é obrigatório' });
  }
  const r = VALID_RANGES.includes(range) ? range : '1y';
  // Preserva ^ pra índices, mas remove caracteres estranhos
  const isIndex = symbol.startsWith('^');
  const cleanCore = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const clean = isIndex ? `^${cleanCore}` : cleanCore;

  let data = await fetchYahoo(clean, r, false);
  if (!data) data = await fetchYahoo(clean, r, true);
  if (!data) return res.status(404).json({ error: 'Histórico indisponível' });

  return res.status(200).json(data);
}
