import { Platform } from 'react-native';
import { Profile } from '../data/profileQuiz';

const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

export type AiPick = {
  classKey: 'renda_fixa' | 'renda_variavel' | 'internacional';
  classLabel: string;
  role: string;
  symbol: string;
  name: string;
  amount: number;
  reasoning: string;
};

export type AiSuggestion = {
  summary: string;
  picks: AiPick[];
};

export type AiInput = {
  amount: number;
  profile: Profile;
  currentAssets: {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    type: string;
  }[];
  brokers?: {
    id: string;
    name: string;
    limitations: string;
  }[];
};

export async function fetchAiSuggestion(input: AiInput): Promise<AiSuggestion> {
  const res = await fetch(`${API_BASE}/ai-suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error || `Erro ${res.status}`);
  }
  return (await res.json()) as AiSuggestion;
}

export type AiDiagnosticInput = {
  profile: Profile;
  assets: Array<{
    symbol: string;
    type: string;
    quantity: number;
    currentValue: number;
    profitPct: number;
  }>;
  totals: {
    totalCurrent: number;
    totalInvested: number;
    profitPct: number;
  };
  dividendos?: {
    ytdReceived: number;
    weightedDY: number;
  };
  question?: string;
};

export async function fetchAiDiagnostic(input: AiDiagnosticInput): Promise<string> {
  const res = await fetch(`${API_BASE}/ai-diagnostic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error || `Erro ${res.status}`);
  }
  const json = await res.json();
  return json.diagnostic as string;
}
