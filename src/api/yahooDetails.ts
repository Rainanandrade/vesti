// Detalhes fundamentalistas via nosso /api/details na Vercel.

import { Platform } from 'react-native';

export type AssetDetails = {
  symbol: string;
  shortName?: string;
  longName?: string;
  sector?: string;
  industry?: string;
  businessSummary?: string;
  currentPrice?: number;
  dividendYield?: number;
  trailingPE?: number;
  priceToBook?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  profitMargins?: number;
  totalCash?: number;
  totalDebt?: number;
  debtToEquity?: number;
  revenueGrowth?: number;
  earningsGrowth?: number;
  marketCap?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  payoutRatio?: number;
  dividendRate?: number;
  fiveYearAvgDividendYield?: number;
};

const API_BASE =
  Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';

export async function fetchAssetDetails(symbol: string): Promise<AssetDetails | null> {
  try {
    const res = await fetch(`${API_BASE}/details?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;
    return json as AssetDetails;
  } catch (err) {
    console.warn('fetchAssetDetails error', err);
    return null;
  }
}
