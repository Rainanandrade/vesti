// /api/rankings?category=maior_dy_acao
// Ranqueia ativos por categoria usando dados da brapi.dev.
// Cache pesado de 6h pra economizar quota.

import { setCors } from './_lib/cors.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';
import { fetchWithTimeout } from './_lib/fetch.js';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

const ACOES_UNIVERSO = [
  'PETR4', 'PETR3', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 'ITSA4', 'B3SA3',
  'WEGE3', 'EMBR3', 'SUZB3', 'KLBN11', 'ABEV3', 'BBSE3', 'PSSA3',
  'RADL3', 'RDOR3', 'HAPV3', 'FLRY3', 'ODPV3',
  'TAEE11', 'TRPL4', 'EGIE3', 'CPLE6', 'CPFE3', 'EQTL3', 'NEOE3',
  'CMIG4', 'ELET3', 'ELET6', 'TIMS3', 'VIVT3',
  'GGBR4', 'CSNA3', 'USIM5', 'CMIN3',
  'PRIO3', 'RECV3', 'CSAN3', 'UGPA3',
  'RAIL3', 'CCRO3', 'ECOR3', 'STBP3',
  'LREN3', 'MGLU3', 'GMAT3', 'ASAI3', 'PCAR3',
  'JBSS3', 'MRFG3', 'BEEF3', 'BRFS3',
  'TOTS3', 'POSI3', 'LWSA3', 'CSED3', 'YDUQ3',
  'RENT3', 'MOVI3', 'SIMH3', 'VAMO3', 'JSLG3',
  'PETZ3', 'GRND3', 'ALPA4', 'ARZZ3',
];

const FIIS_UNIVERSO = [
  'MXRF11', 'KNCR11', 'KNIP11', 'KNHY11', 'IRDM11', 'RBRR11', 'VGIR11',
  'HGLG11', 'XPLG11', 'VILG11', 'BTLG11', 'GGRC11', 'KNRI11',
  'BCFF11', 'BRCR11', 'HGRE11', 'JSRE11',
  'XPML11', 'HSML11', 'VISC11', 'MALL11',
  'HGRU11', 'HGCR11', 'HGBS11', 'HCTR11', 'DEVA11',
];

async function fetchQuoteData(symbol) {
  try {
    const url = `https://brapi.dev/api/quote/${symbol}`;
    const headers = { Accept: 'application/json' };
    if (BRAPI_TOKEN) headers.Authorization = `Bearer ${BRAPI_TOKEN}`;
    const r = await fetchWithTimeout(url, { headers }, 6000);
    if (!r.ok) return null;
    const json = await r.json();
    const q = json?.results?.[0];
    if (!q) return null;
    return {
      symbol,
      name: q.longName || q.shortName || symbol,
      price: q.regularMarketPrice,
      dy: q.dividendYield != null ? Number((q.dividendYield * 100).toFixed(2)) : null,
      pl: q.priceEarnings,
      pvp: q.priceToBook,
      change: q.regularMarketChangePercent,
      volume: q.regularMarketVolume,
    };
  } catch {
    return null;
  }
}

const CATEGORIES = {
  maior_dy_acao: {
    label: 'Maior DY · Ações',
    universe: ACOES_UNIVERSO,
    sort: (a, b) => (b.dy || 0) - (a.dy || 0),
    metric: 'dy',
  },
  maior_dy_fii: {
    label: 'Maior DY · FIIs',
    universe: FIIS_UNIVERSO,
    sort: (a, b) => (b.dy || 0) - (a.dy || 0),
    metric: 'dy',
  },
  menor_pl: {
    label: 'Menor P/L · Ações',
    universe: ACOES_UNIVERSO,
    sort: (a, b) => {
      const pa = a.pl > 0 ? a.pl : Infinity;
      const pb = b.pl > 0 ? b.pl : Infinity;
      return pa - pb;
    },
    metric: 'pl',
  },
  menor_pvp_fii: {
    label: 'FII abaixo do VP',
    universe: FIIS_UNIVERSO,
    sort: (a, b) => {
      const pa = a.pvp > 0 ? a.pvp : Infinity;
      const pb = b.pvp > 0 ? b.pvp : Infinity;
      return pa - pb;
    },
    metric: 'pvp',
  },
  maior_alta: {
    label: 'Maiores altas do dia',
    universe: ACOES_UNIVERSO,
    sort: (a, b) => (b.change || 0) - (a.change || 0),
    metric: 'change',
  },
  maior_queda: {
    label: 'Maiores quedas do dia',
    universe: ACOES_UNIVERSO,
    sort: (a, b) => (a.change || 0) - (b.change || 0),
    metric: 'change',
  },
  mais_negociadas: {
    label: 'Mais negociadas',
    universe: [...ACOES_UNIVERSO, ...FIIS_UNIVERSO],
    sort: (a, b) => (b.volume || 0) - (a.volume || 0),
    metric: 'volume',
  },
};

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  if (!(await rateLimitOrReject(req, res, { limit: 30, windowMs: 60_000, prefix: 'rank' }))) return;

  const category = String(req.query?.category || 'maior_dy_acao');
  const cat = CATEGORIES[category];
  if (!cat) return res.status(400).json({ error: 'categoria inválida' });

  const results = await Promise.all(cat.universe.map(fetchQuoteData));
  const filtered = results.filter((r) => r && r.price > 0);
  filtered.sort(cat.sort);
  const top = filtered.slice(0, 20);

  return res.status(200).json({
    category,
    label: cat.label,
    metric: cat.metric,
    items: top,
  });
}
