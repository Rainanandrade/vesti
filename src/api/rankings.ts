import { Platform } from 'react-native';

const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

export type RankingItem = {
  symbol: string;
  name: string;
  price: number;
  dy: number | null;
  pl: number | null;
  pvp: number | null;
  change: number;
  volume: number;
};

export type RankingResponse = {
  category: string;
  label: string;
  metric: 'dy' | 'pl' | 'pvp' | 'change' | 'volume';
  items: RankingItem[];
};

export const RANKING_CATEGORIES: Array<{ key: string; label: string; emoji: string }> = [
  { key: 'maior_dy_acao', label: 'Maior DY · Ações', emoji: '💸' },
  { key: 'maior_dy_fii', label: 'Maior DY · FIIs', emoji: '🏢' },
  { key: 'menor_pl', label: 'Menor P/L · Ações', emoji: '💎' },
  { key: 'menor_pvp_fii', label: 'FII abaixo do VP', emoji: '🎯' },
  { key: 'maior_alta', label: 'Maiores altas hoje', emoji: '📈' },
  { key: 'maior_queda', label: 'Maiores quedas hoje', emoji: '📉' },
  { key: 'mais_negociadas', label: 'Mais negociadas', emoji: '🔥' },
];

const cache: Record<string, { data: RankingResponse; ts: number }> = {};
const TTL = 60 * 60 * 1000; // 1h client-side

export async function fetchRanking(category: string): Promise<RankingResponse | null> {
  const c = cache[category];
  if (c && Date.now() - c.ts < TTL) return c.data;
  try {
    const res = await fetch(`${API_BASE}/rankings?category=${encodeURIComponent(category)}`);
    if (!res.ok) return null;
    const json = (await res.json()) as RankingResponse;
    cache[category] = { data: json, ts: Date.now() };
    return json;
  } catch {
    return null;
  }
}
