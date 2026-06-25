// Cotações via nosso próprio endpoint na Vercel (/api/quote).
// Cache em memória + AsyncStorage pra render imediato em reaberturas (5 min TTL).

import { Platform } from 'react-native';
import { Storage } from '../storage/storage';

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

const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

const CACHE_KEY = 'quotes_cache_v1';
const CACHE_TTL_MS = 60 * 1000; // 1 min — equilíbrio entre frescor e quota

// brapi.dev plano gratuito tem ~15min de delay em relação ao tempo real da B3.
// Pra real-time precisaria do plano PRO (~R$ 30/mês).
export const QUOTE_DELAY_MIN = 15;

type CacheEntry = { ts: number; quote: Quote };
const memCache: Record<string, CacheEntry> = {};
let diskHydrated = false;

async function hydrate(): Promise<void> {
  if (diskHydrated) return;
  diskHydrated = true;
  try {
    const stored = await Storage.get<Record<string, CacheEntry>>(CACHE_KEY);
    if (stored && typeof stored === 'object') {
      const now = Date.now();
      for (const k of Object.keys(stored)) {
        if (stored[k] && now - stored[k].ts < CACHE_TTL_MS * 6) {
          memCache[k] = stored[k];
        }
      }
    }
  } catch {}
}

async function persist(): Promise<void> {
  try {
    await Storage.set(CACHE_KEY, memCache);
  } catch {}
}

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

/**
 * Estratégia: devolve cache imediatamente se válido + faz refresh em background.
 * Para aceleração de boot, chame `getCachedQuotes` antes de await em `fetchQuotes`.
 */
export async function getCachedQuotes(symbols: string[]): Promise<Quote[]> {
  await hydrate();
  const out: Quote[] = [];
  for (const s of symbols.map((x) => x.toUpperCase())) {
    const e = memCache[s];
    if (e) out.push(e.quote);
  }
  return out;
}

export async function fetchQuotes(symbols: string[], opts?: { force?: boolean }): Promise<Quote[]> {
  if (symbols.length === 0) return [];
  await hydrate();
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const now = Date.now();
  const stale: string[] = [];
  const fresh: Quote[] = [];
  for (const s of unique) {
    const e = memCache[s];
    if (!opts?.force && e && now - e.ts < CACHE_TTL_MS) {
      fresh.push(e.quote);
    } else {
      stale.push(s);
    }
  }
  if (stale.length === 0) return fresh;
  const results = await Promise.all(stale.map(fetchOne));
  results.forEach((q, i) => {
    if (q) {
      memCache[stale[i]] = { ts: now, quote: q };
      fresh.push(q);
    }
  });
  persist();
  return fresh;
}

export const IPCA_12M = 4.5;
