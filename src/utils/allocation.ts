import { Asset } from '../context/AppContext';
import { Profile } from '../data/profileQuiz';
import {
  RF_MIX,
  RV_MIX,
  INTL_MIX,
  findBestByTags,
  UniverseAsset,
  scoreAsset,
} from '../data/universe';

export type Class = 'renda_fixa' | 'renda_variavel' | 'internacional';

export type AllocationBreakdown = {
  current: Record<Class, number>;
  currentPct: Record<Class, number>;
  total: number;
};

const INTERNATIONAL_TICKERS = ['IVVB11', 'BIT11', 'NASD11', 'SPXI11', 'WRLD11', 'BITH11', 'ETHE11'];
const MIN_AMOUNT_PER_PICK = 30; // R$ — sub-pick abaixo disso é mesclado

export function classify(asset: Asset): Class {
  if (asset.type === 'tesouro' || asset.type === 'cdb') return 'renda_fixa';
  if (INTERNATIONAL_TICKERS.includes(asset.symbol.toUpperCase())) return 'internacional';
  if (/^[A-Z]{4}3[2-5]$/.test(asset.symbol.toUpperCase())) return 'internacional';
  return 'renda_variavel';
}

export function computeAllocation(
  assets: Asset[],
  prices: Record<string, number>,
): AllocationBreakdown {
  const current: Record<Class, number> = { renda_fixa: 0, renda_variavel: 0, internacional: 0 };
  for (const a of assets) {
    const price = prices[a.symbol] ?? a.avgPrice;
    current[classify(a)] += price * a.quantity;
  }
  const total = current.renda_fixa + current.renda_variavel + current.internacional;
  const currentPct: Record<Class, number> = {
    renda_fixa: total > 0 ? (current.renda_fixa / total) * 100 : 0,
    renda_variavel: total > 0 ? (current.renda_variavel / total) * 100 : 0,
    internacional: total > 0 ? (current.internacional / total) * 100 : 0,
  };
  return { current, currentPct, total };
}

export type Pick = {
  symbol: string;
  name: string;
  amount: number;
  reason: string;
  roleLabel: string; // ex: "FII de papel", "ETF amplo"
  isTradeable: boolean;
  isExisting: boolean;
};

export type Suggestion = {
  class: Class;
  classLabel: string;
  totalAmount: number;
  picks: Pick[];
};

function getMix(cls: Class, profile: Profile) {
  if (cls === 'renda_fixa') return RF_MIX[profile.type];
  if (cls === 'renda_variavel') return RV_MIX[profile.type];
  return INTL_MIX[profile.type];
}

function generatePicksForClass(
  cls: Class,
  amount: number,
  profile: Profile,
  walletSymbols: Set<string>,
  existingAssetsByClass: Map<Class, Asset[]>,
): Pick[] {
  const mix = getMix(cls, profile);
  const totalWeight = mix.reduce((s, m) => s + m.weight, 0);
  const usedSymbols = new Set<string>(walletSymbols);
  const picks: Pick[] = [];

  // 1) Se já tem ativos dessa classe, reforça posição existente primeiro com 30% do aporte (ou menos)
  const existing = existingAssetsByClass.get(cls) || [];
  let remaining = amount;
  if (existing.length > 0) {
    const reinforce = Math.min(amount * 0.35, amount);
    if (reinforce >= MIN_AMOUNT_PER_PICK) {
      const target = existing[0]; // o primeiro (poderia escolher melhor)
      picks.push({
        symbol: target.symbol,
        name: target.name,
        amount: reinforce,
        reason: `Reforço de posição em ${target.symbol} — mantém a estratégia já em execução`,
        roleLabel: 'Reforço',
        isTradeable: target.type !== 'tesouro' && target.type !== 'cdb',
        isExisting: true,
      });
      usedSymbols.add(target.symbol);
      remaining -= reinforce;
    }
  }

  // 2) Distribui o restante seguindo o mix do perfil
  for (const m of mix) {
    const subAmount = remaining * (m.weight / totalWeight);
    if (subAmount < MIN_AMOUNT_PER_PICK) continue;

    const best = findBestByTags(m.tags, cls, profile.type, usedSymbols);
    if (!best) continue;

    picks.push({
      symbol: best.symbol,
      name: best.name,
      amount: subAmount,
      reason: `${m.label} — ${best.baseNote}`,
      roleLabel: m.label,
      isTradeable: best.isTradeable,
      isExisting: false,
    });
    usedSymbols.add(best.symbol);
  }

  // 3) Se nada foi gerado (amount muito pequeno), gera 1 pick consolidado
  if (picks.length === 0 && amount >= 1) {
    const fallback = findBestByTags(mix[0].tags, cls, profile.type, walletSymbols);
    if (fallback) {
      picks.push({
        symbol: fallback.symbol,
        name: fallback.name,
        amount,
        reason: `${mix[0].label} — ${fallback.baseNote}`,
        roleLabel: mix[0].label,
        isTradeable: fallback.isTradeable,
        isExisting: false,
      });
    }
  }

  return picks;
}

export function suggestAporte(
  value: number,
  assets: Asset[],
  prices: Record<string, number>,
  profile: Profile,
): { suggestions: Suggestion[]; targetPct: Record<Class, number>; afterPct: Record<Class, number> } {
  const breakdown = computeAllocation(assets, prices);
  const target = {
    renda_fixa: profile.strategy.renda_fixa,
    renda_variavel: profile.strategy.renda_variavel,
    internacional: profile.strategy.internacional,
  };

  const newTotal = breakdown.total + value;
  const idealAfter: Record<Class, number> = {
    renda_fixa: (newTotal * target.renda_fixa) / 100,
    renda_variavel: (newTotal * target.renda_variavel) / 100,
    internacional: (newTotal * target.internacional) / 100,
  };
  const gaps: Record<Class, number> = {
    renda_fixa: Math.max(0, idealAfter.renda_fixa - breakdown.current.renda_fixa),
    renda_variavel: Math.max(0, idealAfter.renda_variavel - breakdown.current.renda_variavel),
    internacional: Math.max(0, idealAfter.internacional - breakdown.current.internacional),
  };
  const totalGap = gaps.renda_fixa + gaps.renda_variavel + gaps.internacional;

  // Mistura híbrida: 70% segue os gaps (rebalanceia) + 30% segue o target puro (mantém alinhado)
  const allocations: Record<Class, number> = { renda_fixa: 0, renda_variavel: 0, internacional: 0 };
  if (totalGap === 0) {
    allocations.renda_fixa = (value * target.renda_fixa) / 100;
    allocations.renda_variavel = (value * target.renda_variavel) / 100;
    allocations.internacional = (value * target.internacional) / 100;
  } else {
    const gapPortion = value * 0.7;
    const targetPortion = value * 0.3;
    (['renda_fixa', 'renda_variavel', 'internacional'] as Class[]).forEach((c) => {
      const gapPart = totalGap > 0 ? (gapPortion * gaps[c]) / totalGap : 0;
      const targetPart = (targetPortion * target[c]) / 100;
      allocations[c] = gapPart + targetPart;
    });
  }

  // Garante valores mínimos pra que todas as 3 classes apareçam (se possível)
  const MINIMUM_CLASS_AMOUNT = Math.min(50, value * 0.1);
  (['renda_fixa', 'renda_variavel', 'internacional'] as Class[]).forEach((c) => {
    if (allocations[c] < MINIMUM_CLASS_AMOUNT && target[c] > 0) {
      // Toma dos outros proporcionalmente
      const deficit = MINIMUM_CLASS_AMOUNT - allocations[c];
      const others = (['renda_fixa', 'renda_variavel', 'internacional'] as Class[]).filter((x) => x !== c);
      const othersTotal = others.reduce((s, x) => s + allocations[x], 0);
      if (othersTotal > deficit) {
        others.forEach((x) => {
          allocations[x] -= (deficit * allocations[x]) / othersTotal;
        });
        allocations[c] = MINIMUM_CLASS_AMOUNT;
      }
    }
  });

  const labels: Record<Class, string> = {
    renda_fixa: 'Renda Fixa',
    renda_variavel: 'Renda Variável',
    internacional: 'Internacional',
  };

  const walletSymbols = new Set(assets.map((a) => a.symbol.toUpperCase()));
  const existingByClass = new Map<Class, Asset[]>();
  for (const a of assets) {
    const c = classify(a);
    if (!existingByClass.has(c)) existingByClass.set(c, []);
    existingByClass.get(c)!.push(a);
  }

  const suggestions: Suggestion[] = (['renda_fixa', 'renda_variavel', 'internacional'] as Class[])
    .filter((c) => allocations[c] >= 1 && target[c] > 0)
    .map((c) => ({
      class: c,
      classLabel: labels[c],
      totalAmount: allocations[c],
      picks: generatePicksForClass(c, allocations[c], profile, walletSymbols, existingByClass),
    }))
    .filter((s) => s.picks.length > 0);

  const afterTotal = newTotal;
  const afterPct: Record<Class, number> = {
    renda_fixa: afterTotal > 0 ? ((breakdown.current.renda_fixa + allocations.renda_fixa) / afterTotal) * 100 : 0,
    renda_variavel: afterTotal > 0 ? ((breakdown.current.renda_variavel + allocations.renda_variavel) / afterTotal) * 100 : 0,
    internacional: afterTotal > 0 ? ((breakdown.current.internacional + allocations.internacional) / afterTotal) * 100 : 0,
  };

  return { suggestions, targetPct: target, afterPct };
}
