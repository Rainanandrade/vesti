// Universo de ativos com tags pra scoring por perfil.
// Cada perfil "puxa" assets diferentes naturalmente — sem listas fixas.

import { ProfileType } from './profileQuiz';

export type AssetTag =
  | 'safe'           // muito seguro
  | 'low_vol'        // baixa volatilidade
  | 'mid_vol'        // volatilidade média
  | 'high_vol'       // alta volatilidade
  | 'dividends'      // foco em dividendos
  | 'growth'         // foco em crescimento
  | 'large_cap'      // grande capitalização
  | 'mid_cap'
  | 'small_cap'
  | 'tech'
  | 'commodity'
  | 'financial'
  | 'consumer'
  | 'industrial'
  | 'energy'
  | 'health'
  | 'real_estate'
  | 'logistics'
  | 'paper_fii'      // FII de papel
  | 'brick_fii'      // FII de tijolo
  | 'broad_market'   // ETF amplo
  | 'international'
  | 'fixed_income';

export type UniverseAsset = {
  symbol: string;
  name: string;
  class: 'renda_fixa' | 'renda_variavel' | 'internacional';
  tags: AssetTag[];
  isTradeable: boolean;
  baseNote: string;
};

export const UNIVERSE: UniverseAsset[] = [
  // ============ RENDA FIXA (não-tradeables) ============
  { symbol: 'Tesouro Selic', name: 'Tesouro Selic', class: 'renda_fixa', tags: ['safe', 'fixed_income'], isTradeable: false, baseNote: 'Mais seguro do país. Liquidez diária. Rende 100% da Selic.' },
  { symbol: 'Tesouro IPCA+ 2029', name: 'Tesouro IPCA+ 2029', class: 'renda_fixa', tags: ['safe', 'fixed_income', 'low_vol'], isTradeable: false, baseNote: 'Proteção contra inflação no médio prazo (vencimento 2029).' },
  { symbol: 'Tesouro IPCA+ 2035', name: 'Tesouro IPCA+ 2035', class: 'renda_fixa', tags: ['safe', 'fixed_income', 'mid_vol'], isTradeable: false, baseNote: 'IPCA + taxa fixa. Longo prazo, proteção real do poder de compra.' },
  { symbol: 'Tesouro IPCA+ 2045', name: 'Tesouro IPCA+ 2045', class: 'renda_fixa', tags: ['fixed_income', 'mid_vol'], isTradeable: false, baseNote: 'Longuíssimo prazo. IPCA + maior taxa fixa do mercado — ideal pra aposentadoria.' },
  { symbol: 'Tesouro Prefixado 2027', name: 'Tesouro Prefixado 2027', class: 'renda_fixa', tags: ['fixed_income'], isTradeable: false, baseNote: 'Taxa fixa contratada. Bom em ciclo de queda dos juros.' },
  { symbol: 'CDB 100% CDI', name: 'CDB liquidez diária', class: 'renda_fixa', tags: ['safe', 'fixed_income', 'low_vol'], isTradeable: false, baseNote: 'Banco grande com FGC. Resgate a qualquer momento. Rende perto da Selic.' },
  { symbol: 'CDB 110% CDI', name: 'CDB 110% CDI', class: 'renda_fixa', tags: ['fixed_income', 'low_vol'], isTradeable: false, baseNote: 'Rendimento acima do CDI em troca de prazo de carência. FGC garante.' },
  { symbol: 'LCI 95% CDI', name: 'LCI imobiliária', class: 'renda_fixa', tags: ['safe', 'fixed_income', 'low_vol'], isTradeable: false, baseNote: 'Isenta de IR. Liquidez no vencimento. Pode render mais que CDB no líquido.' },
  { symbol: 'LCA 95% CDI', name: 'LCA do agronegócio', class: 'renda_fixa', tags: ['safe', 'fixed_income', 'low_vol'], isTradeable: false, baseNote: 'Isenta de IR. Lastro no agro. Carência mínima geralmente 90 dias.' },

  // ============ FIIs (renda variável BR) ============
  { symbol: 'MXRF11', name: 'Maxi Renda (FII de papel)', class: 'renda_variavel', tags: ['paper_fii', 'dividends', 'low_vol', 'real_estate'], isTradeable: true, baseNote: 'FII de papel diversificado. Paga rendimento mensal isento de IR.' },
  { symbol: 'KNCR11', name: 'Kinea Rendimentos (FII de papel)', class: 'renda_variavel', tags: ['paper_fii', 'dividends', 'low_vol', 'real_estate'], isTradeable: true, baseNote: 'FII de papel pós-fixado. Baixa volatilidade, distribuição mensal.' },
  { symbol: 'KNIP11', name: 'Kinea Índices de Preços (FII)', class: 'renda_variavel', tags: ['paper_fii', 'dividends', 'low_vol', 'real_estate'], isTradeable: true, baseNote: 'FII de papel atrelado a inflação. Proteção real + renda.' },
  { symbol: 'HGLG11', name: 'CSHG Logística (FII)', class: 'renda_variavel', tags: ['brick_fii', 'dividends', 'mid_vol', 'real_estate', 'logistics'], isTradeable: true, baseNote: 'FII de galpões logísticos. Setor em expansão pelo e-commerce.' },
  { symbol: 'BTLG11', name: 'BTG Pactual Logística (FII)', class: 'renda_variavel', tags: ['brick_fii', 'dividends', 'real_estate', 'logistics'], isTradeable: true, baseNote: 'Galpões logísticos premium. Inquilinos de qualidade.' },
  { symbol: 'XPLG11', name: 'XP Log (FII)', class: 'renda_variavel', tags: ['brick_fii', 'dividends', 'real_estate', 'logistics'], isTradeable: true, baseNote: 'FII de logística diversificado geograficamente.' },
  { symbol: 'KNRI11', name: 'Kinea Renda Imobiliária (FII)', class: 'renda_variavel', tags: ['brick_fii', 'dividends', 'mid_vol', 'real_estate'], isTradeable: true, baseNote: 'FII híbrido de qualidade — lajes corporativas + logística.' },
  { symbol: 'XPML11', name: 'XP Malls (FII)', class: 'renda_variavel', tags: ['brick_fii', 'dividends', 'real_estate', 'mid_vol'], isTradeable: true, baseNote: 'Shoppings premium em capitais. Recuperação pós-pandemia.' },
  { symbol: 'VISC11', name: 'Vinci Shopping (FII)', class: 'renda_variavel', tags: ['brick_fii', 'dividends', 'real_estate', 'mid_vol'], isTradeable: true, baseNote: 'Shoppings em cidades médias. Diversificação geográfica.' },
  { symbol: 'BCFF11', name: 'BTG Fundo de Fundos (FII)', class: 'renda_variavel', tags: ['paper_fii', 'dividends', 'low_vol', 'real_estate'], isTradeable: true, baseNote: 'Fundo de FIIs — diversifica em dezenas de outros fundos em 1 cota.' },

  // ============ ETFs BR ============
  { symbol: 'BOVA11', name: 'iShares Ibovespa (ETF)', class: 'renda_variavel', tags: ['broad_market', 'large_cap', 'mid_vol'], isTradeable: true, baseNote: 'ETF do Ibovespa — 80+ maiores empresas brasileiras em 1 cota.' },
  { symbol: 'BOVV11', name: 'It Now Ibovespa (ETF)', class: 'renda_variavel', tags: ['broad_market', 'large_cap', 'mid_vol'], isTradeable: true, baseNote: 'Alternativa ao BOVA11 com taxa menor.' },
  { symbol: 'SMAL11', name: 'iShares Small Caps (ETF)', class: 'renda_variavel', tags: ['broad_market', 'small_cap', 'high_vol', 'growth'], isTradeable: true, baseNote: 'ETF de small caps brasileiras. Potencial de crescimento maior.' },
  { symbol: 'DIVO11', name: 'It Now IDIV (ETF)', class: 'renda_variavel', tags: ['broad_market', 'dividends', 'large_cap', 'low_vol'], isTradeable: true, baseNote: 'ETF de empresas pagadoras de dividendos. Foco em renda.' },
  { symbol: 'GOLD11', name: 'Trend Ouro (ETF)', class: 'renda_variavel', tags: ['commodity', 'low_vol'], isTradeable: true, baseNote: 'ETF de ouro físico. Proteção contra crises.' },

  // ============ AÇÕES — Dividend payers (perfis conservador/moderado) ============
  { symbol: 'ITSA4', name: 'Itaúsa', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'low_vol', 'financial'], isTradeable: true, baseNote: 'Holding com participação no Itaú. Boa pagadora de dividendos consistentes.' },
  { symbol: 'BBSE3', name: 'BB Seguridade', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'low_vol', 'financial'], isTradeable: true, baseNote: 'Seguradora muito rentável. Alta distribuição de lucros.' },
  { symbol: 'ITUB4', name: 'Itaú Unibanco', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'low_vol', 'financial'], isTradeable: true, baseNote: 'Maior banco privado. Lucro consistente, dividendos sólidos.' },
  { symbol: 'BBAS3', name: 'Banco do Brasil', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'mid_vol', 'financial'], isTradeable: true, baseNote: 'Banco estatal pagador de dividendos. Exposição a ciclo BR.' },
  { symbol: 'TAEE11', name: 'Taesa', class: 'renda_variavel', tags: ['dividends', 'mid_cap', 'low_vol', 'energy'], isTradeable: true, baseNote: 'Transmissão de energia. Receita previsível, dividendos altos.' },
  { symbol: 'TRPL4', name: 'Transmissão Paulista', class: 'renda_variavel', tags: ['dividends', 'mid_cap', 'low_vol', 'energy'], isTradeable: true, baseNote: 'Transmissão estável. Forte pagadora de dividendos.' },
  { symbol: 'EGIE3', name: 'Engie Brasil', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'low_vol', 'energy'], isTradeable: true, baseNote: 'Geração de energia renovável. Dividendos consistentes.' },
  { symbol: 'CPLE6', name: 'Copel', class: 'renda_variavel', tags: ['dividends', 'mid_cap', 'low_vol', 'energy'], isTradeable: true, baseNote: 'Energia + saneamento. Reestruturação recente trouxe valor.' },
  { symbol: 'VIVT3', name: 'Telefônica Vivo', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'low_vol'], isTradeable: true, baseNote: 'Telecom líder. Negócio maduro, foco em dividendos.' },

  // ============ AÇÕES — Crescimento (moderado/arrojado) ============
  { symbol: 'WEGE3', name: 'WEG', class: 'renda_variavel', tags: ['growth', 'large_cap', 'mid_vol', 'industrial'], isTradeable: true, baseNote: 'Multinacional brasileira de motores. Liderança global em eficiência.' },
  { symbol: 'TOTS3', name: 'Totvs', class: 'renda_variavel', tags: ['growth', 'mid_cap', 'mid_vol', 'tech'], isTradeable: true, baseNote: 'Líder em software empresarial no Brasil. Tese de digitalização.' },
  { symbol: 'RDOR3', name: "Rede D'Or", class: 'renda_variavel', tags: ['growth', 'large_cap', 'mid_vol', 'health'], isTradeable: true, baseNote: 'Maior rede hospitalar privada. Crescimento + envelhecimento populacional.' },
  { symbol: 'RAIL3', name: 'Rumo', class: 'renda_variavel', tags: ['growth', 'large_cap', 'mid_vol', 'logistics'], isTradeable: true, baseNote: 'Maior operadora ferroviária. Crescimento estrutural com expansão do agro.' },
  { symbol: 'B3SA3', name: 'B3', class: 'renda_variavel', tags: ['growth', 'large_cap', 'mid_vol', 'financial'], isTradeable: true, baseNote: 'Bolsa de valores brasileira. Receita atrelada ao crescimento do mercado.' },
  { symbol: 'EQTL3', name: 'Equatorial Energia', class: 'renda_variavel', tags: ['growth', 'large_cap', 'mid_vol', 'energy'], isTradeable: true, baseNote: 'Distribuição de energia em expansão. Aquisições estratégicas.' },
  { symbol: 'LREN3', name: 'Lojas Renner', class: 'renda_variavel', tags: ['growth', 'large_cap', 'mid_vol', 'consumer'], isTradeable: true, baseNote: 'Varejo de moda. Marca forte, recuperação pós-pandemia.' },
  { symbol: 'EMBR3', name: 'Embraer', class: 'renda_variavel', tags: ['growth', 'mid_cap', 'high_vol', 'industrial'], isTradeable: true, baseNote: 'Aeroespacial brasileira. Ciclo de defesa global em alta.' },
  { symbol: 'POSI3', name: 'Positivo', class: 'renda_variavel', tags: ['growth', 'small_cap', 'high_vol', 'tech'], isTradeable: true, baseNote: 'Tecnologia + serviços. Small cap com potencial.' },

  // ============ AÇÕES — Cíclicas (arrojado/agressivo) ============
  { symbol: 'PETR4', name: 'Petrobras', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'high_vol', 'commodity', 'energy'], isTradeable: true, baseNote: 'Maior empresa BR. Cíclica de óleo, dividendos polpudos quando bem gerida.' },
  { symbol: 'VALE3', name: 'Vale', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'high_vol', 'commodity'], isTradeable: true, baseNote: 'Líder global em minério. Dividendos altos em ciclos favoráveis.' },
  { symbol: 'PRIO3', name: 'PetroRio', class: 'renda_variavel', tags: ['growth', 'mid_cap', 'high_vol', 'commodity', 'energy'], isTradeable: true, baseNote: 'Petroleira independente. Alta margem operacional.' },
  { symbol: 'SUZB3', name: 'Suzano', class: 'renda_variavel', tags: ['large_cap', 'mid_vol', 'commodity'], isTradeable: true, baseNote: 'Líder global em celulose. Ciclo de commodity florestal.' },
  { symbol: 'GGBR4', name: 'Gerdau', class: 'renda_variavel', tags: ['dividends', 'large_cap', 'high_vol', 'commodity'], isTradeable: true, baseNote: 'Siderurgia. Ciclo de aço, exposição a obras de infra.' },
  { symbol: 'JBSS3', name: 'JBS', class: 'renda_variavel', tags: ['large_cap', 'mid_vol', 'consumer'], isTradeable: true, baseNote: 'Líder global em proteína animal. Diversificação geográfica.' },

  // ============ INTERNACIONAL ============
  { symbol: 'IVVB11', name: 'iShares S&P 500 (ETF)', class: 'internacional', tags: ['broad_market', 'international', 'large_cap', 'mid_vol'], isTradeable: true, baseNote: 'Exposição às 500 maiores empresas dos EUA, em reais.' },
  { symbol: 'NASD11', name: 'Trend Nasdaq 100 (ETF)', class: 'internacional', tags: ['international', 'tech', 'growth', 'high_vol'], isTradeable: true, baseNote: '100 maiores empresas de tech dos EUA. Crescimento agressivo.' },
  { symbol: 'WRLD11', name: 'Trend ETF Mundo', class: 'internacional', tags: ['broad_market', 'international', 'mid_vol'], isTradeable: true, baseNote: 'Diversificação global em um único ETF.' },
  { symbol: 'SPXI11', name: 'It Now S&P 500 (ETF)', class: 'internacional', tags: ['broad_market', 'international', 'large_cap', 'mid_vol'], isTradeable: true, baseNote: 'Alternativa ao IVVB11 com taxa diferente.' },
  { symbol: 'BITH11', name: 'Hashdex Bitcoin (ETF)', class: 'internacional', tags: ['international', 'high_vol', 'growth'], isTradeable: true, baseNote: 'Exposição a Bitcoin via ETF brasileiro. Volatilidade muito alta.' },
];

// ============ SCORING POR PERFIL ============

// Pesos: positivos = atrai, negativos = repele. Por tag.
const PROFILE_WEIGHTS: Record<ProfileType, Partial<Record<AssetTag, number>>> = {
  conservador: {
    safe: 25,
    low_vol: 20,
    dividends: 15,
    paper_fii: 12,
    broad_market: 10,
    fixed_income: 20,
    large_cap: 8,
    high_vol: -25,
    small_cap: -20,
    tech: -10,
    commodity: -15,
  },
  moderado: {
    dividends: 12,
    large_cap: 10,
    mid_vol: 8,
    broad_market: 10,
    brick_fii: 10,
    paper_fii: 8,
    low_vol: 6,
    growth: 5,
    international: 8,
    fixed_income: 8,
    safe: 5,
    high_vol: -10,
    small_cap: -5,
  },
  arrojado: {
    growth: 15,
    large_cap: 8,
    mid_cap: 10,
    mid_vol: 8,
    high_vol: 2,
    broad_market: 8,
    international: 12,
    tech: 10,
    brick_fii: 6,
    dividends: 6,
    commodity: 5,
    safe: -5,
    fixed_income: -10,
  },
  agressivo: {
    growth: 20,
    high_vol: 12,
    small_cap: 15,
    mid_cap: 8,
    tech: 15,
    international: 12,
    commodity: 8,
    broad_market: 5,
    fixed_income: -15,
    safe: -15,
    low_vol: -10,
    dividends: -2,
  },
};

export function scoreAsset(asset: UniverseAsset, profileType: ProfileType): number {
  const weights = PROFILE_WEIGHTS[profileType];
  let score = 50; // base
  for (const tag of asset.tags) {
    score += weights[tag] ?? 0;
  }
  return Math.max(0, Math.min(100, score));
}

export function getCandidatesForProfile(
  profileType: ProfileType,
  cls: UniverseAsset['class'],
  minScore = 50,
): { asset: UniverseAsset; score: number }[] {
  return UNIVERSE.filter((a) => a.class === cls)
    .map((a) => ({ asset: a, score: scoreAsset(a, profileType) }))
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

// ============ COMPOSIÇÃO INTRACLASSE ============
// Cada perfil tem uma "receita" do que misturar dentro de cada classe.
// Pesos são proporcionais (não precisam somar 100).

export type ClassMix = {
  tags: AssetTag[];        // tags procuradas (ativo precisa ter pelo menos 1)
  weight: number;          // peso relativo dentro da classe
  label: string;           // descrição do papel desse pick (ex: "Reserva", "Crescimento")
};

export const RF_MIX: Record<ProfileType, ClassMix[]> = {
  conservador: [
    { tags: ['safe', 'fixed_income'], weight: 70, label: 'Reserva / liquidez' },
    { tags: ['low_vol', 'fixed_income'], weight: 30, label: 'Médio prazo' },
  ],
  moderado: [
    { tags: ['safe', 'fixed_income'], weight: 40, label: 'Reserva / liquidez' },
    { tags: ['mid_vol', 'fixed_income'], weight: 60, label: 'Proteção contra inflação' },
  ],
  arrojado: [
    { tags: ['mid_vol', 'fixed_income'], weight: 100, label: 'Proteção real longo prazo' },
  ],
  agressivo: [
    { tags: ['safe', 'fixed_income'], weight: 100, label: 'Reserva mínima' },
  ],
};

export const RV_MIX: Record<ProfileType, ClassMix[]> = {
  conservador: [
    { tags: ['paper_fii', 'dividends'], weight: 55, label: 'FII de papel (renda mensal isenta)' },
    { tags: ['broad_market', 'dividends'], weight: 30, label: 'ETF de dividendos' },
    { tags: ['broad_market', 'low_vol'], weight: 15, label: 'ETF do Ibovespa' },
  ],
  moderado: [
    { tags: ['broad_market'], weight: 30, label: 'ETF amplo (diversificação)' },
    { tags: ['brick_fii', 'dividends'], weight: 25, label: 'FII de tijolo (renda real)' },
    { tags: ['dividends', 'large_cap'], weight: 25, label: 'Ação pagadora de dividendos' },
    { tags: ['paper_fii'], weight: 20, label: 'FII de papel (estabilidade)' },
  ],
  arrojado: [
    { tags: ['broad_market'], weight: 25, label: 'ETF base diversificada' },
    { tags: ['growth', 'large_cap'], weight: 30, label: 'Ação de crescimento' },
    { tags: ['brick_fii'], weight: 20, label: 'FII de tijolo' },
    { tags: ['dividends', 'large_cap'], weight: 15, label: 'Ação pagadora de dividendos' },
    { tags: ['small_cap'], weight: 10, label: 'Small cap (potencial)' },
  ],
  agressivo: [
    { tags: ['growth', 'large_cap'], weight: 25, label: 'Ação de crescimento (líder)' },
    { tags: ['small_cap', 'growth'], weight: 20, label: 'Small cap (alto potencial)' },
    { tags: ['tech'], weight: 15, label: 'Tecnologia' },
    { tags: ['commodity'], weight: 15, label: 'Commodity (ciclo)' },
    { tags: ['brick_fii'], weight: 15, label: 'FII (renda complementar)' },
    { tags: ['broad_market', 'small_cap'], weight: 10, label: 'ETF small caps' },
  ],
};

export const INTL_MIX: Record<ProfileType, ClassMix[]> = {
  conservador: [
    { tags: ['broad_market', 'international'], weight: 100, label: 'ETF S&P 500 (núcleo internacional)' },
  ],
  moderado: [
    { tags: ['broad_market', 'international'], weight: 100, label: 'ETF amplo internacional' },
  ],
  arrojado: [
    { tags: ['broad_market', 'international'], weight: 60, label: 'ETF S&P 500' },
    { tags: ['tech', 'international'], weight: 40, label: 'ETF Nasdaq (tech)' },
  ],
  agressivo: [
    { tags: ['tech', 'international'], weight: 45, label: 'ETF Nasdaq (tech)' },
    { tags: ['broad_market', 'international'], weight: 35, label: 'ETF S&P 500' },
    { tags: ['high_vol', 'international'], weight: 20, label: 'Cripto (pequena exposição)' },
  ],
};

// Acha o melhor ativo (maior score) que tenha pelo menos uma das tags procuradas
export function findBestByTags(
  tags: AssetTag[],
  cls: UniverseAsset['class'],
  profileType: ProfileType,
  exclude: Set<string>,
): UniverseAsset | null {
  const candidates = UNIVERSE.filter(
    (a) => a.class === cls && tags.some((t) => a.tags.includes(t)) && !exclude.has(a.symbol),
  );
  if (candidates.length === 0) return null;
  const scored = candidates.map((a) => ({ a, s: scoreAsset(a, profileType) }));
  scored.sort((x, y) => y.s - x.s);
  return scored[0].a;
}
