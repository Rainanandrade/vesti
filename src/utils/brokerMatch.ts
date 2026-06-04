// Decide qual das corretoras do usuário é melhor pra cada ativo.

import { Broker, getBrokerById } from '../data/brokers';

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

export function bestBrokerForAsset(
  symbol: string,
  type: string | undefined,
  userBrokerIds: string[],
): { broker: Broker | null; reason: string } {
  const cat = categorizeAsset(symbol, type);
  const brokers = userBrokerIds.map(getBrokerById).filter((b): b is Broker => !!b);
  if (brokers.length === 0) {
    return { broker: null, reason: 'sem corretora cadastrada' };
  }
  const candidates = brokers.filter((b) => supports(b, cat));
  if (candidates.length === 0) {
    return {
      broker: null,
      reason: `nenhuma das suas corretoras oferece ${categoryLabel(cat)}`,
    };
  }

  // Especialização: pra ativos internacionais diretos, preferir corretora internacional
  if (cat === 'acao_us') {
    const intl = candidates.find((b) => b.category === 'internacional');
    if (intl) return { broker: intl, reason: 'acesso direto ao mercado dos EUA' };
  }
  // Pra ativos BR, preferir banco digital / corretora BR
  if (cat === 'fii' || cat === 'acao_br' || cat === 'tesouro' || cat === 'cdb' || cat === 'lci_lca') {
    const br = candidates.find((b) => b.category !== 'internacional');
    if (br) return { broker: br, reason: 'corretora brasileira' };
  }
  // ETFs intl podem usar BR (via ETF BR como IVVB11)
  if (cat === 'etf_intl') {
    const br = candidates.find((b) => b.category !== 'internacional');
    if (br) return { broker: br, reason: 'ETF internacional disponível na B3' };
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
