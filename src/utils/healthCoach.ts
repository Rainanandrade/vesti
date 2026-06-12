import { Asset } from '../context/AppContext';
import { Profile } from '../data/profileQuiz';
import { AssetDetails } from '../api/yahooDetails';
import { classify } from './allocation';

export type CoachAction = {
  icon: string;
  title: string;
  description: string;
  impact: 'alto' | 'médio' | 'baixo';
};

// Recalcula score considerando perfil + estrutura. Score 0-10.
export function computeHealthScoreDetailed(
  assets: Asset[],
  profitPct: number,
  profile: Profile | null,
  details: Record<string, AssetDetails | null> = {},
): { score: number; actions: CoachAction[] } {
  if (assets.length === 0) {
    return {
      score: 0,
      actions: [
        {
          icon: '🌱',
          title: 'Adicione seu primeiro ativo',
          description: 'Comece com algo simples: Tesouro Selic é o investimento mais seguro do país e aceita qualquer valor.',
          impact: 'alto',
        },
      ],
    };
  }

  let score = 4; // base mínima por ter algo
  const actions: CoachAction[] = [];

  // ============ DIVERSIFICAÇÃO POR QUANTIDADE ============
  if (assets.length >= 10) score += 1.5;
  else if (assets.length >= 6) score += 1;
  else if (assets.length >= 3) score += 0.5;
  else {
    actions.push({
      icon: '🧩',
      title: `Você tem ${assets.length} ativo${assets.length === 1 ? '' : 's'} — diversifique mais`,
      description: 'Carteiras com 5-10 ativos diferentes reduzem muito o risco. Considere adicionar pelo menos mais 2-3 ativos.',
      impact: 'alto',
    });
  }

  // ============ DIVERSIFICAÇÃO POR CLASSE ============
  const byClass = {
    renda_fixa: 0,
    renda_variavel: 0,
    internacional: 0,
  };
  for (const a of assets) {
    byClass[classify(a)]++;
  }
  const classesCount = Object.values(byClass).filter((v) => v > 0).length;

  if (classesCount === 3) score += 1.5;
  else if (classesCount === 2) score += 0.8;
  else score += 0.3;

  // ============ TIPOS DE ATIVO ============
  const types = new Set(assets.map((a) => a.type));
  if (types.size >= 4) score += 1;
  else if (types.size >= 2) score += 0.5;

  // ============ SUGESTÕES POR CLASSE FALTANTE ============
  if (byClass.renda_fixa === 0) {
    actions.push({
      icon: '🛟',
      title: 'Sua carteira não tem renda fixa',
      description: 'Toda carteira saudável precisa de uma reserva segura. Comece com Tesouro Selic — liquidez diária e zero risco.',
      impact: 'alto',
    });
  }

  if (byClass.renda_variavel === 0 && profile && profile.strategy.renda_variavel >= 30) {
    actions.push({
      icon: '📈',
      title: 'Sua carteira não tem renda variável',
      description: `Seu perfil ${profile.type} prevê ${profile.strategy.renda_variavel}% em RV. Comece com BOVA11 (ETF do Ibovespa) pra diversificar de uma vez.`,
      impact: 'alto',
    });
  }

  if (byClass.internacional === 0 && profile && profile.strategy.internacional >= 10) {
    actions.push({
      icon: '🌍',
      title: 'Falta exposição internacional',
      description: `Seu perfil ${profile.type} prevê ${profile.strategy.internacional}% em ativos globais. Considere IVVB11 (S&P 500) ou WRLD11 (mundo).`,
      impact: 'médio',
    });
  }

  // ============ TIPOS RECOMENDADOS POR PERFIL ============
  const hasFII = assets.some((a) => a.type === 'fii');
  const hasETF = assets.some((a) => a.type === 'etf');

  if (!hasFII && profile && (profile.type === 'conservador' || profile.type === 'moderado')) {
    actions.push({
      icon: '🏢',
      title: 'Considere adicionar FIIs',
      description: 'FIIs pagam rendimento mensal isento de IR — combina com seu perfil. MXRF11 ou KNCR11 são bons começos.',
      impact: 'médio',
    });
  }

  if (!hasETF && assets.length < 8) {
    actions.push({
      icon: '📊',
      title: 'Adicione um ETF na carteira',
      description: 'ETFs diversificam em dezenas de ativos com uma única cota. BOVA11 cobre o Ibovespa todo.',
      impact: 'médio',
    });
  }

  // ============ RENTABILIDADE ============
  if (profitPct > 10) score += 1.5;
  else if (profitPct > 5) score += 1;
  else if (profitPct > 0) score += 0.5;
  else if (profitPct < -10) {
    score -= 0.5;
    actions.push({
      icon: '📉',
      title: 'Patrimônio em queda — não venda no susto',
      description: 'Quedas fazem parte. Se sua tese segue válida, é hora de aportar mais barato, não de vender.',
      impact: 'baixo',
    });
  }

  // ============ ALINHAMENTO COM PREFERÊNCIA ============
  const pref = profile?.preference;
  if (pref && pref !== 'sem_preferencia' && assets.length > 0) {
    // Calcula DY ponderado da carteira (em ativos com detalhes disponíveis)
    let totalValueWithDY = 0;
    let totalDYWeighted = 0;
    for (const a of assets) {
      const d = details[a.symbol];
      if (d?.dividendYield != null && d.dividendYield > 0) {
        const value = a.avgPrice * a.quantity;
        totalValueWithDY += value;
        totalDYWeighted += d.dividendYield * value;
      }
    }
    const portfolioDY = totalValueWithDY > 0 ? totalDYWeighted / totalValueWithDY : 0;

    if (pref === 'dividendos') {
      // Foco em dividendos: deveria ter DY alto + FIIs
      if (!hasFII) {
        actions.push({
          icon: '🏢',
          title: 'Você tem foco em dividendos mas zero FIIs',
          description: 'FIIs pagam mensalmente e são isentos de IR. Considere MXRF11, HGLG11 ou KNRI11 pra aproveitar seu foco.',
          impact: 'alto',
        });
      }
      if (portfolioDY > 0 && portfolioDY < 4) {
        actions.push({
          icon: '📉',
          title: `DY da carteira é ${portfolioDY.toFixed(1)}% — abaixo do seu foco`,
          description: 'Pra foco em dividendos, mire DY ponderado acima de 6%. Considere ITUB4, BBSE3, ITSA4 (dividendos altos).',
          impact: 'médio',
        });
      }
      // Verifica se tem ativos de growth puro na carteira (contraproducente)
      const growthStocks = assets.filter((a) => /^(WEGE|TOTS|RAIL|RDOR|EQTL|LREN)/.test(a.symbol.toUpperCase()));
      if (growthStocks.length > 0) {
        actions.push({
          icon: '🤔',
          title: `${growthStocks[0].symbol} não combina com foco em dividendos`,
          description: `${growthStocks.map((a) => a.symbol).join(', ')} são empresas de crescimento (DY baixo). Não é errado, mas avalie se faz sentido.`,
          impact: 'baixo',
        });
      }
    } else if (pref === 'crescimento') {
      // Foco em crescimento: muitos FIIs não combinam
      const fiisInPortfolio = assets.filter((a) => a.type === 'fii');
      const fiiValue = fiisInPortfolio.reduce((s, a) => s + a.avgPrice * a.quantity, 0);
      const totalAssetValue = assets.reduce((s, a) => s + a.avgPrice * a.quantity, 0);
      if (totalAssetValue > 0 && fiiValue / totalAssetValue > 0.4) {
        actions.push({
          icon: '📊',
          title: 'Muitos FIIs pro seu foco em crescimento',
          description: 'Mais de 40% da carteira em FIIs. FIIs dão renda, mas valorizam pouco. Considere realocar parte pra ações growth como WEGE3, TOTS3, RDOR3.',
          impact: 'médio',
        });
      }
      // Sem ETFs amplos? sugere
      if (!hasETF) {
        actions.push({
          icon: '📈',
          title: 'Foco em crescimento sem ETF amplo',
          description: 'BOVA11 ou SMAL11 (small caps) trazem exposição diversificada a setores de crescimento.',
          impact: 'médio',
        });
      }
    }
  }

  // ============ CONCENTRAÇÃO ============
  // Verifica se algum ativo concentra >40% do total (informação simples por contagem)
  // Idealmente usaria valor atual, mas como simplificação usamos quantidade x preço médio
  const totalInvested = assets.reduce((s, a) => s + a.quantity * a.avgPrice, 0);
  const concentrated = assets.find((a) => (a.quantity * a.avgPrice) / totalInvested > 0.4);
  if (concentrated && assets.length > 1) {
    actions.push({
      icon: '⚖️',
      title: `${concentrated.symbol} concentra muito da sua carteira`,
      description: `Mais de 40% do seu patrimônio está em um único ativo. Considere rebalancear pra reduzir risco.`,
      impact: 'médio',
    });
  }

  // ============ APORTE REGULAR ============
  // Olhamos pra última adição
  if (assets.length > 0) {
    const mostRecent = Math.max(...assets.map((a) => a.addedAt));
    const daysAgo = (Date.now() - mostRecent) / (1000 * 60 * 60 * 24);
    if (daysAgo > 60) {
      actions.push({
        icon: '🔁',
        title: 'Faz mais de 2 meses desde seu último aporte',
        description: 'A consistência é o segredo dos juros compostos. Mesmo que pequeno, um aporte mensal regular acelera muito sua carteira.',
        impact: 'médio',
      });
    }
  }

  // ============ SCORE FINAL ============
  score = Math.max(0, Math.min(10, score));

  // Se score já é 10, não tem o que sugerir — celebra
  if (score >= 9.5 && actions.length === 0) {
    actions.push({
      icon: '👑',
      title: 'Sua carteira está saudável!',
      description: 'Diversificação, classes, rentabilidade — está tudo no lugar. Continue aportando regularmente.',
      impact: 'baixo',
    });
  }

  // Ordena: alto impacto primeiro
  const order = { alto: 0, médio: 1, baixo: 2 };
  actions.sort((a, b) => order[a.impact] - order[b.impact]);

  return { score, actions: actions.slice(0, 4) };
}

export function healthLevelLabel(score: number): string {
  if (score >= 9) return 'Excelente';
  if (score >= 7) return 'Saudável';
  if (score >= 5) return 'Razoável';
  if (score >= 3) return 'Precisa atenção';
  return 'Comece agora';
}
