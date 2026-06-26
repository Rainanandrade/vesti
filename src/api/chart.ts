import { Platform } from 'react-native';

const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

export type ChartRange = '1mo' | '6mo' | '1y' | '5y';

export type ChartPoint = { t: number; c: number };

export type ChartData = {
  symbol: string;
  range: ChartRange;
  interval: string;
  points: ChartPoint[];
  currency: string;
  first: number;
  last: number;
  changePct: number;
};

const cache: Record<string, { data: ChartData | null; ts: number }> = {};
const TTL_OK = 1000 * 60 * 10;   // 10 min pra dados válidos
const TTL_FAIL = 1000 * 30;      // 30s pra falhas (retry rápido)

async function doFetch(symbol: string, range: ChartRange, force: boolean): Promise<ChartData | null> {
  try {
    const buster = force ? `&_=${Date.now()}` : '';
    const res = await fetch(
      `${API_BASE}/chart?symbol=${encodeURIComponent(symbol)}&range=${range}${buster}`,
      { cache: force ? 'no-store' : 'default' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error || !Array.isArray(json.points) || json.points.length < 2) return null;
    return json;
  } catch {
    return null;
  }
}

export async function fetchChart(symbol: string, range: ChartRange = '1y', opts?: { force?: boolean }): Promise<ChartData | null> {
  const key = `${symbol.toUpperCase()}_${range}`;
  const cached = cache[key];
  if (!opts?.force && cached) {
    const ttl = cached.data ? TTL_OK : TTL_FAIL;
    if (Date.now() - cached.ts < ttl) return cached.data;
  }
  let data = await doFetch(symbol, range, !!opts?.force);
  // Se falhou e não tinha force, tenta de novo com cache-bust automático.
  // Cobre o caso do navegador/CDN ter cacheado um 404 antigo.
  if (!data && !opts?.force) {
    data = await doFetch(symbol, range, true);
  }
  cache[key] = { data, ts: Date.now() };
  return data;
}

export function clearChartCache(symbol?: string) {
  if (!symbol) {
    Object.keys(cache).forEach((k) => delete cache[k]);
    return;
  }
  const prefix = symbol.toUpperCase() + '_';
  Object.keys(cache).forEach((k) => { if (k.startsWith(prefix)) delete cache[k]; });
}

export const RANGE_LABELS: Record<ChartRange, string> = {
  '1mo': '1M',
  '6mo': '6M',
  '1y': '1A',
  '5y': '5A',
};
