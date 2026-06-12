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
const TTL = 1000 * 60 * 30; // 30 min

export async function fetchChart(symbol: string, range: ChartRange = '1y'): Promise<ChartData | null> {
  const key = `${symbol.toUpperCase()}_${range}`;
  const cached = cache[key];
  if (cached && Date.now() - cached.ts < TTL) return cached.data;
  try {
    const res = await fetch(`${API_BASE}/chart?symbol=${encodeURIComponent(symbol)}&range=${range}`);
    if (!res.ok) {
      cache[key] = { data: null, ts: Date.now() };
      return null;
    }
    const json = await res.json();
    if (json.error) {
      cache[key] = { data: null, ts: Date.now() };
      return null;
    }
    cache[key] = { data: json, ts: Date.now() };
    return json;
  } catch {
    cache[key] = { data: null, ts: Date.now() };
    return null;
  }
}

export const RANGE_LABELS: Record<ChartRange, string> = {
  '1mo': '1M',
  '6mo': '6M',
  '1y': '1A',
  '5y': '5A',
};
