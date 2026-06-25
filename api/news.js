// /api/news?query=mercado+brasil
// Manchetes do mercado financeiro BR via Google News RSS.
// Cache pesado (1h) pra evitar abuso.

import { setCors } from './_lib/cors.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';
import { fetchWithTimeout } from './_lib/fetch.js';

const DEFAULT_QUERIES = {
  mercado: 'bovespa+ibovespa+selic+ações+brasil',
  acoes: 'ações+brasil+B3+bolsa',
  fiis: 'fundos+imobiliários+FII+brasil',
  economia: 'inflação+IPCA+banco+central+brasil',
  dividendos: 'dividendos+JCP+ações+brasil',
};

function parseRss(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < 25) {
    const item = m[1];
    const title = (item.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1] || '';
    const link = (item.match(/<link>(.*?)<\/link>/) || [])[1] || '';
    const pubDate = (item.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    const source = (item.match(/<source[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/source>/) || [])[1] || '';
    if (title && link) items.push({ title: decodeEntities(title), link, pubDate, source: decodeEntities(source) });
  }
  return items;
}

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido' });
  if (!(await rateLimitOrReject(req, res, { limit: 30, windowMs: 60_000, prefix: 'news' }))) return;

  const topic = String(req.query?.topic || 'mercado');
  const query = DEFAULT_QUERIES[topic] || DEFAULT_QUERIES.mercado;
  const url = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

  try {
    const r = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 Vesti/2.0' },
    });
    if (!r.ok) return res.status(502).json({ error: 'Não foi possível buscar notícias' });
    const xml = await r.text();
    const items = parseRss(xml);
    return res.status(200).json({ topic, items });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
}
