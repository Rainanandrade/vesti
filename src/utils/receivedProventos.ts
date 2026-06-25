import { Asset } from '../context/AppContext';
import { DividendInfo } from '../api/dividends';

// Antes era 5 dias — heurística conservadora que barrava pagamentos legítimos.
// O Status Invest já retorna a data oficial de pagamento, e a B3 só precisa
// que o investidor esteja na posição até o "data com" (geralmente 1 dia antes).
// Mudamos pra 0: se o ativo estava na carteira ANTES da data do pagamento, conta.
const MIN_HOLD_DAYS = 0;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type ReceivedProvento = {
  symbol: string;
  date: string;            // YYYY-MM-DD
  perShare: number;
  amount: number;          // perShare × quantity
  kind: 'dividendo' | 'jcp' | 'rendimento';
  isConfirmed: boolean;    // true = data oficial; false = estimada futura
};

function classifyKind(symbol: string, type?: string): 'dividendo' | 'jcp' | 'rendimento' {
  if (type) {
    const t = type.toLowerCase();
    if (t.includes('jcp') || t.includes('juros')) return 'jcp';
    if (t.includes('rend') || t.includes('rendimento')) return 'rendimento';
  }
  // FIIs (XXXX11) distribuem "rendimento"
  if (/^[A-Z]{4}11$/.test(symbol.toUpperCase())) return 'rendimento';
  return 'dividendo';
}

/**
 * Lê os históricos de dividendos das APIs e calcula quanto o usuário
 * recebeu automaticamente — sem precisar registrar nada manualmente.
 *
 * Regra: pra o usuário ter recebido um pagamento, ele precisava ter o
 * ativo na carteira pelo menos 5 dias antes da data do pagamento.
 */
export function computeReceivedProventos(
  assets: Asset[],
  dividendInfoMap: Record<string, DividendInfo | null>,
): ReceivedProvento[] {
  const todayIso = new Date().toISOString().slice(0, 10);
  const out: ReceivedProvento[] = [];

  for (const asset of assets) {
    const info = dividendInfoMap[asset.symbol];
    if (!info?.history) continue;
    const addedAtMs = asset.addedAt;

    for (const entry of info.history) {
      // Só consideramos pagamentos PASSADOS (até hoje) ou no futuro próximo confirmado
      const entryMs = new Date(entry.date).getTime();
      // Holder mínimo de 5 dias antes
      if (entryMs - addedAtMs < MIN_HOLD_DAYS * MS_PER_DAY) continue;
      if (entry.date > todayIso) continue; // só recebidos por enquanto

      const perShare = entry.amount;
      const amount = perShare * asset.quantity;
      if (amount <= 0) continue;

      out.push({
        symbol: asset.symbol,
        date: entry.date,
        perShare,
        amount,
        kind: classifyKind(asset.symbol, entry.type),
        isConfirmed: true,
      });
    }
  }

  // Ordena do mais recente pro mais antigo
  out.sort((a, b) => b.date.localeCompare(a.date));
  return out;
}

export type MonthlyProventoSummary = {
  monthKey: string;        // YYYY-MM
  total: number;
  items: ReceivedProvento[];
};

export function groupProventosByMonth(items: ReceivedProvento[]): MonthlyProventoSummary[] {
  const map: Record<string, ReceivedProvento[]> = {};
  for (const it of items) {
    const k = it.date.slice(0, 7);
    (map[k] = map[k] || []).push(it);
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([monthKey, list]) => ({
      monthKey,
      total: list.reduce((s, p) => s + p.amount, 0),
      items: list,
    }));
}
