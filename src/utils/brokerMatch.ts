// Decide qual das corretoras do usuário é melhor pra cada ativo.

import { Broker, BROKERS, getBrokerById } from '../data/brokers';

export type AssetCategory =
  | 'tesouro'
  | 'cdb'
  | 'lci_lca'
  | 'fii'
  | 'acao_br'
  | 'etf_br'
  | 'etf_intl'
  | 'bdr'
  | 'acao_us'
  | 'cripto'
  | 'fundo';

const FII_PATTERN = /^[A-Z]{4}11$/;
const BDR_PATTERN = /^[A-Z]{4}3[2-5]$/;
const INTL_ETFS = ['IVVB11', 'NASD11', 'WRLD11', 'SPXI11', 'BITH11', 'ETHE11'];
const ETF_BR = ['BOVA11', 'BOVV11', 'SMAL11', 'DIVO11', 'GOLD11', 'FIXA11'];

export function categorizeAsset(symbol: string, type?: string): AssetCategory {
  if (type === 'tesouro' || /tesouro/i.test(symbol)) return 'tesouro';
  if (type === 'cdb' || /CDB/i.test(symbol)) return 'cdb';
  if (/LCI|LCA/i.test(symbol)) return 'lci_lca';

  const s = symbol.toUpperCase();
  if (INTL_ETFS.includes(s)) return 'etf_intl';
  if (ETF_BR.includes(s)) return 'etf_br';
  if (type === 'etf') return s.match(/^(IV|NASD|SPXI|WRLD|BIT|ETHE)/) ? 'etf_intl' : 'etf_br';
  if (FII_PATTERN.test(s)) return 'fii';
  if (BDR_PATTERN.test(s)) return 'bdr';
  return 'acao_br';
}

function supports(broker: Broker, cat: AssetCategory): boolean {
  switch (cat) {
    case 'tesouro': return broker.features.tesouro;
    case 'cdb': return broker.features.cdb;
    case 'lci_lca': return broker.features.lci_lca;
    case 'fii': return broker.features.fiis;
    case 'acao_br': return broker.features.acoes;
    case 'etf_br': return broker.features.etfs;
    case 'etf_intl': return broker.features.etfs;
    case 'bdr': return broker.features.bdrs;
    case 'acao_us': return broker.features.internacional_direto;
    case 'cripto': return broker.features.cripto;
    case 'fundo': return broker.features.fundos;
    default: return true;
  }
}

// Sugestões externas recomendadas por categoria de ativo (quando nenhuma das
// corretoras do usuário oferece)
const EXTERNAL_RECOMMENDATIONS: Record<AssetCategory, string[]> = {
  acao_us: ['avenue', 'nomad', 'inter_us'],
  bdr: ['xp', 'btg', 'inter', 'rico'],
  fii: ['nubank', 'xp', 'inter', 'rico'],
  acao_br: ['nubank', 'xp', 'inter', 'rico'],
  etf_br: ['nubank', 'xp', 'inter', 'rico'],
  etf_intl: ['nubank', 'xp', 'inter', 'rico'],
  cripto: ['xp', 'btg'],
  tesouro: ['nubank', 'xp', 'inter', 'rico'],
  cdb: ['nubank', 'xp', 'inter', 'rico'],
  lci_lca: ['xp', 'inter', 'rico'],
  fundo: ['xp', 'btg', 'orama'],
};

export type BrokerHint = {
  broker: Broker | null;
  reason: string;
  // Sugestão externa quando nenhuma das corretoras do usuário serve
  externalSuggestion?: Broker[];
};

export function bestBrokerForAsset(
  symbol: string,
  type: string | undefined,
  userBrokerIds: string[],
): BrokerHint {
  const cat = categorizeAsset(symbol, type);
  const brokers = userBrokerIds.map(getBrokerById).filter((b): b is Broker => !!b);
  if (brokers.length === 0) {
    return { broker: null, reason: 'sem corretora cadastrada' };
  }
  const candidates = brokers.filter((b) => supports(b, cat));

  // ============ Nenhuma das suas corretoras serve ============
  if (candidates.length === 0) {
    const recommendedIds = EXTERNAL_RECOMMENDATIONS[cat] || [];
    const externalCandidates = recommendedIds
      .map((id) => BROKERS.find((b) => b.id === id))
      .filter((b): b is Broker => !!b && supports(b, cat))
      .slice(0, 3);
    return {
      broker: null,
      reason: `Nenhuma das suas corretoras oferece ${categoryLabel(cat)}`,
      externalSuggestion: externalCandidates,
    };
  }

  // ============ Especialização ============
  // Ações americanas diretas → corretora internacional
  if (cat === 'acao_us') {
    const intl = candidates.find((b) => b.category === 'internacional');
    if (intl) return { broker: intl, reason: 'acesso direto ao mercado dos EUA' };
  }
  // Ativos BR → corretora brasileira
  if (cat === 'fii' || cat === 'acao_br' || cat === 'tesouro' || cat === 'cdb' || cat === 'lci_lca') {
    const br = candidates.find((b) => b.category !== 'internacional');
    if (br) return { broker: br, reason: 'oferece esse ativo' };
  }
  // ETFs intl → preferência por corretora BR (ETF brasileiro)
  if (cat === 'etf_intl' || cat === 'etf_br') {
    const br = candidates.find((b) => b.category !== 'internacional');
    if (br) return { broker: br, reason: 'tem esse ETF na plataforma' };
  }
  return { broker: candidates[0], reason: 'corretora compatível' };
}

function categoryLabel(cat: AssetCategory): string {
  return (
    {
      tesouro: 'Tesouro Direto',
      cdb: 'CDB',
      lci_lca: 'LCI/LCA',
      fii: 'FIIs',
      acao_br: 'ações da B3',
      etf_br: 'ETFs',
      etf_intl: 'ETFs internacionais',
      bdr: 'BDRs',
      acao_us: 'ações americanas diretas',
      cripto: 'cripto',
      fundo: 'fundos',
    }[cat] || cat
  );
}
