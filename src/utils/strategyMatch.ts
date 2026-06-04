import { Profile, ProfileType } from '../data/profileQuiz';
import { AssetDetails } from '../api/yahooDetails';
import { TickerInfo } from '../data/tickers';

export type StrategyMatch = {
  fitScore: number; // 0-100
  fitLabel: 'Combina muito com seu perfil' | 'Combina com seu perfil' | 'Cuidado, foge do seu perfil';
  reasons: string[];
  positives: string[];
  warnings: string[];
};

export function evaluateAssetForProfile(
  ticker: TickerInfo,
  details: AssetDetails | null,
  profile: Profile,
): StrategyMatch {
  const positives: string[] = [];
  const warnings: string[] = [];
  const reasons: string[] = [];
  let score = 50;

  const isConservative = profile.type === 'conservador';
  const isModerate = profile.type === 'moderado';
  const isAggressive = profile.type === 'arrojado' || profile.type === 'agressivo';

  // ============ ANÁLISE POR TIPO ============
  if (ticker.type === 'fii') {
    reasons.push(
      isConservative
        ? 'FIIs são bons pra perfil conservador porque pagam renda mensal isenta de IR.'
        : isModerate
          ? 'FIIs entram bem na sua carteira moderada — geram renda mensal e diversificam.'
          : 'FIIs equilibram a parcela de renda variável da sua carteira agressiva.',
    );
    score += isConservative ? 15 : 10;
  } else if (ticker.type === 'etf') {
    if (ticker.symbol.includes('IVVB') || ticker.symbol.includes('NASD') || ticker.symbol.includes('WRLD')) {
      reasons.push(
        `${ticker.symbol} é um ETF internacional. Sua estratégia ${profile.type} prevê ${profile.strategy.internacional}% em exposição internacional.`,
      );
      score += 10;
    } else {
      reasons.push(
        `ETFs são excelentes pra diversificar de uma vez só — perfeito pra qualquer perfil. ${ticker.symbol} representa um conjunto amplo de ativos.`,
      );
      score += 8;
    }
  } else if (ticker.type === 'acao') {
    if (isConservative) {
      reasons.push(
        'Ações individuais carregam volatilidade que não combina muito com perfil conservador. Considere ETFs ou FIIs como alternativa.',
      );
      score -= 10;
    } else if (isModerate) {
      reasons.push(
        'Ações são a base da renda variável do seu perfil moderado (~40%). Foque em empresas sólidas e pagadoras de dividendos.',
      );
      score += 5;
    } else {
      reasons.push(
        `Seu perfil ${profile.type} permite uma alocação maior em ações (${profile.strategy.renda_variavel}%). Foque em diversificação setorial.`,
      );
      score += 10;
    }
  }

  // ============ ANÁLISE FUNDAMENTALISTA (se disponível) ============
  if (details) {
    // P/L
    if (details.trailingPE != null && details.trailingPE > 0) {
      if (details.trailingPE < 8) {
        positives.push(`P/L de ${details.trailingPE.toFixed(1)} é considerado baixo — empresa pode estar barata`);
        score += 5;
      } else if (details.trailingPE > 25) {
        warnings.push(`P/L de ${details.trailingPE.toFixed(1)} é alto — preço pode estar caro vs. lucro`);
        score -= 5;
      } else {
        positives.push(`P/L de ${details.trailingPE.toFixed(1)} está em faixa razoável`);
      }
    }

    // Dividend Yield
    if (details.dividendYield != null && details.dividendYield > 0) {
      if (details.dividendYield > 12) {
        warnings.push(
          `DY de ${details.dividendYield.toFixed(1)}% é muito alto — pode indicar problema na empresa ou dividendo não recorrente`,
        );
      } else if (details.dividendYield > 6) {
        positives.push(
          `Boa pagadora de dividendos (DY ${details.dividendYield.toFixed(1)}%) — ${isConservative || isModerate ? 'ótimo pro seu perfil' : 'complementa retorno via fluxo de caixa'}`,
        );
        score += 8;
      } else if (details.dividendYield > 3) {
        positives.push(`Paga dividendos consistentes (DY ${details.dividendYield.toFixed(1)}%)`);
        score += 3;
      }
    }

    // ROE
    if (details.returnOnEquity != null && details.returnOnEquity > 0) {
      if (details.returnOnEquity > 20) {
        positives.push(`ROE de ${details.returnOnEquity.toFixed(1)}% indica empresa muito eficiente`);
        score += 8;
      } else if (details.returnOnEquity > 12) {
        positives.push(`ROE de ${details.returnOnEquity.toFixed(1)}% mostra boa eficiência`);
        score += 4;
      } else if (details.returnOnEquity < 5) {
        warnings.push(`ROE de ${details.returnOnEquity.toFixed(1)}% baixo — empresa gera pouco retorno`);
        score -= 5;
      }
    }

    // P/VP (importante pra FIIs)
    if (ticker.type === 'fii' && details.priceToBook != null) {
      if (details.priceToBook < 1) {
        positives.push(`P/VP ${details.priceToBook.toFixed(2)} — cotas estão descontadas vs. valor patrimonial`);
        score += 5;
      } else if (details.priceToBook > 1.15) {
        warnings.push(`P/VP ${details.priceToBook.toFixed(2)} — mercado pagando prêmio`);
      }
    }

    // Dívida
    if (details.debtToEquity != null) {
      const d = details.debtToEquity;
      if (d > 200) {
        warnings.push(`Dívida/Patrimônio de ${d.toFixed(0)}% é alta — risco em cenário de juros altos`);
        score -= 5;
      } else if (d < 50) {
        positives.push(`Pouco endividada (Dívida/PL ${d.toFixed(0)}%)`);
        score += 3;
      }
    }

    // Margem de lucro
    if (details.profitMargins != null && details.profitMargins > 15) {
      positives.push(`Margem de lucro de ${details.profitMargins.toFixed(1)}% — negócio rentável`);
      score += 3;
    } else if (details.profitMargins != null && details.profitMargins < 0) {
      warnings.push(`Margem negativa de ${details.profitMargins.toFixed(1)}% — empresa em prejuízo`);
      score -= 10;
    }

    // Beta (volatilidade)
    if (details.beta != null) {
      if (isConservative && details.beta > 1.3) {
        warnings.push(`Beta ${details.beta.toFixed(2)} indica alta volatilidade — desconfortável pro seu perfil conservador`);
        score -= 5;
      } else if (isAggressive && details.beta > 1.3) {
        positives.push(`Beta ${details.beta.toFixed(2)} — volatilidade alta, ok pro seu perfil`);
      } else if (details.beta < 0.8) {
        positives.push(`Beta ${details.beta.toFixed(2)} — ação menos volátil que o mercado`);
        if (isConservative || isModerate) score += 3;
      }
    }

    // Setor
    if (details.sector) {
      reasons.push(`Setor: ${details.sector}${details.industry ? ` (${details.industry})` : ''}`);
    }
  }

  score = Math.max(0, Math.min(100, score));

  let fitLabel: StrategyMatch['fitLabel'];
  if (score >= 70) fitLabel = 'Combina muito com seu perfil';
  else if (score >= 50) fitLabel = 'Combina com seu perfil';
  else fitLabel = 'Cuidado, foge do seu perfil';

  return { fitScore: score, fitLabel, reasons, positives, warnings };
}
