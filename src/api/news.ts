import { Platform } from 'react-native';

const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
};

export const NEWS_TOPICS = [
  { key: 'mercado', label: '📊 Mercado' },
  { key: 'acoes', label: '📈 Ações' },
  { key: 'fiis', label: '🏢 FIIs' },
  { key: 'dividendos', label: '💸 Dividendos' },
  { key: 'economia', label: '🏦 Economia' },
];

export async function fetchNews(topic: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${API_BASE}/news?topic=${encodeURIComponent(topic)}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.items || [];
  } catch {
    return [];
  }
}
