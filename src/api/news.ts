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

/**
 * Notícias específicas de um ativo. Monta query "TICKER + nome empresa"
 * pra trazer só conteúdo relacionado àquela companhia.
 */
export async function fetchAssetNews(symbol: string, companyName?: string): Promise<NewsItem[]> {
  // Limpa nome da empresa: tira sufixos genéricos que poluem a busca
  const cleanName = (companyName || '')
    .replace(/\b(S\.?A\.?|ON|PN|PNA|PNB|UNIT|UNITS|HOLDING|HOLDINGS|PARTICIPACOES|PARTICIPAÇÕES|FUNDO|DE|INVESTIMENTO|IMOBILIARIO|IMOBILIÁRIO)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Query principal: "TICKER" "empresa"  — aspas força match exato
  const q = cleanName
    ? `"${symbol}" OR "${cleanName.split(' ').slice(0, 3).join(' ')}"`
    : `"${symbol}"`;

  try {
    const res = await fetch(`${API_BASE}/news?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.items || [];
  } catch {
    return [];
  }
}
