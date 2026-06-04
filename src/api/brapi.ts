// Cotações via nosso próprio endpoint na Vercel (/api/quote).
// Funciona em qualquer plataforma (web/iOS/Android), sem CORS, sem proxy externo.

import { Platform } from 'react-native';

export type Quote = {
  symbol: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice: number;
  regularMarketChangePercent: number;
  regularMarketChange: number;
  previousClose?: number;
  currency?: string;
};

// Em web usa caminho relativo (mesmo domínio Vercel). Em app nativo, hardcode o domínio.
const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

async function fetchOne(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(`${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    return json as Quote;
  } catch (err) {
    console.warn(`Quote fetch failed for ${symbol}`, err);
    return null;
  }
}

export async function fetchQuotes(symbols: string[]): Promise<Quote[]> {
  if (symbols.length === 0) return [];
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const results = await Promise.all(unique.map(fetchOne));
  return results.filter((q): q is Quote => q !== null);
}

export const IPCA_12M = 4.5;
