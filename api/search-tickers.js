// /api/search-tickers?q=trxf
// Busca dinâmica de tickers da B3 via brapi.dev — cobre TODOS os ativos
// listados, não só a lista local.

import { setCors } from './_lib/cors.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';
import { fetchWithTimeout } from './_lib/fetch.js';

const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

function guessType(symbol) {
  const s = symbol.toUpperCase();
  // FIIs e Fiagros geralmente terminam em 11
  if (/^[A-Z]{4}11$/.test(s)) {
    // ETFs também terminam em 11 (BOVA11, SMAL11, etc.)
    const ETFS = ['BOVA11', 'BOVV11', 'SMAL11', 'DIVO11', 'GOLD11', 'FIXA11', 'IVVB11', 'NASD11', 'WRLD11', 'SPXI11', 'BITH11', 'ETHE11', 'SAPR11', 'TAEE11', 'KLBN11', 'ENGI11', 'BPAC11', 'ALUP11', 'BPAC11', 'IGTI11'];
    if (ETFS.includes(s)) {
      // Units (TAEE11, SAPR11, KLBN11) tratamos como ação
      return s.startsWith('BOVA') || s.startsWith('SMAL') || s.startsWith('DIVO') || s.startsWith('IVVB') ? 'etf' : 'acao';
    }
    return 'fii';
  }
  return 'acao';
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  if (!(await rateLimitOrReject(req, res, { limit: 60, windowMs: 60_000, prefix: 'search' }))) return;

  const q = String(req.query.q || '').trim().toUpperCase();
  if (!q) return res.status(200).json({ results: [] });
  if (q.length < 2) return res.status(200).json({ results: [] });

  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');

  try {
    const url = `https://brapi.dev/api/available?search=${encodeURIComponent(q)}`;
    const headers = { Accept: 'application/json' };
    if (BRAPI_TOKEN) headers.Authorization = `Bearer ${BRAPI_TOKEN}`;
    const r = await fetchWithTimeout(url, { headers }, 5000);
    if (!r.ok) return res.status(200).json({ results: [] });
    const json = await r.json();
    const stocks = Array.isArray(json?.stocks) ? json.stocks : [];

    // Limita a 20 resultados, ordena por relevância (começam com q primeiro)
    const filtered = stocks
      .filter((s) => typeof s === 'string' && /^[A-Z][A-Z0-9]{1,9}$/.test(s))
      .sort((a, b) => {
        const aStart = a.startsWith(q) ? 0 : 1;
        const bStart = b.startsWith(q) ? 0 : 1;
        if (aStart !== bStart) return aStart - bStart;
        return a.localeCompare(b);
      })
      .slice(0, 20)
      .map((symbol) => ({ symbol, name: symbol, type: guessType(symbol) }));

    return res.status(200).json({ results: filtered });
  } catch {
    return res.status(200).json({ results: [] });
  }
}
