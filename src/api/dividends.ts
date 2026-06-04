// Cliente do /api/dividends — dividendos históricos + próximo pagamento estimado.

import { Platform } from 'react-native';

export type DividendEvent = {
  date: string;      // ISO YYYY-MM-DD
  amount: number;
  type?: string;
};

export type DividendInfo = {
  symbol: string;
  lastDate: string;
  lastAmount: number;
  averageAmount: number;
  averageInterval: number;
  nextEstimatedDate: string;
  nextEstimatedAmount: number;
  confidence: 'low' | 'medium' | 'high';
  frequency: 'monthly' | 'quarterly' | 'semestral' | 'annual';
  isConfirmed?: boolean; // true = data oficial anunciada, false = estimada
  history: DividendEvent[];
  source: string;
};

const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

const cache: Record<string, { data: DividendInfo | null; ts: number }> = {};
const CACHE_MS_OK = 1000 * 60 * 60;        // 1h pra dados válidos
const CACHE_MS_FAIL = 1000 * 60 * 2;       // 2 min pra falhas (retry rápido)

export async function fetchDividendInfo(symbol: string, force = false): Promise<DividendInfo | null> {
  const upper = symbol.toUpperCase();
  const cached = cache[upper];
  if (!force && cached) {
    const ttl = cached.data ? CACHE_MS_OK : CACHE_MS_FAIL;
    if (Date.now() - cached.ts < ttl) return cached.data;
  }

  try {
    // Bust também o cache HTTP da Vercel quando é refresh manual
    const url = `${API_BASE}/dividends?symbol=${encodeURIComponent(upper)}${force ? `&_=${Date.now()}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      cache[upper] = { data: null, ts: Date.now() };
      return null;
    }
    const json = await res.json();
    if (json.error) {
      cache[upper] = { data: null, ts: Date.now() };
      return null;
    }
    cache[upper] = { data: json, ts: Date.now() };
    return json;
  } catch {
    cache[upper] = { data: null, ts: Date.now() };
    return null;
  }
}

export async function fetchDividendInfoBatch(
  symbols: string[],
  force = false,
): Promise<Record<string, DividendInfo | null>> {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const results = await Promise.all(unique.map((s) => fetchDividendInfo(s, force)));
  const map: Record<string, DividendInfo | null> = {};
  unique.forEach((s, i) => (map[s] = results[i]));
  return map;
}

// Limpa cache manualmente — usado pelo botão de refresh
export function clearDividendCache(): void {
  for (const key of Object.keys(cache)) delete cache[key];
}

export function formatDateBR(iso: string): string {
  // ISO YYYY-MM-DD → DD/MM
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function formatNextPayment(info: DividendInfo): {
  whenLabel: string;
  daysAhead: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(info.nextEstimatedDate);
  next.setHours(0, 0, 0, 0);
  const daysAhead = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  let whenLabel: string;
  if (daysAhead < 0) whenLabel = `${formatDateBR(info.nextEstimatedDate)} (atrasado)`;
  else if (daysAhead === 0) whenLabel = 'hoje';
  else if (daysAhead === 1) whenLabel = 'amanhã';
  else if (daysAhead <= 30) whenLabel = `em ${daysAhead} dias`;
  else if (daysAhead <= 60) whenLabel = `em ~1 mês`;
  else if (daysAhead <= 90) whenLabel = `em ~2 meses`;
  else if (daysAhead <= 180) whenLabel = `em ~${Math.round(daysAhead / 30)} meses`;
  else whenLabel = `em ~${Math.round(daysAhead / 30)} meses`;
  return { whenLabel, daysAhead };
}

export function frequencyLabel(freq: DividendInfo['frequency']): string {
  return {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semestral: 'Semestral',
    annual: 'Anual',
  }[freq];
}
