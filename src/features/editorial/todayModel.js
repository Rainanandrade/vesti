function buildTodayNarrative({ profitPct = 0, cashFlow = 0, concentration = 0 }) {
  if (concentration >= 25) {
    return {
      headline: 'Sua carteira pede equilíbrio.',
      tone: 'attention',
      reason: 'Um ativo ocupa uma parcela relevante do patrimônio.',
    };
  }
  if (profitPct > 2 && cashFlow >= 0) {
    return {
      headline: 'Seu patrimônio ganhou ritmo.',
      tone: 'positive',
      reason: 'Aportes e desempenho caminharam na mesma direção.',
    };
  }
  if (profitPct < -2 || cashFlow < 0) {
    return {
      headline: 'Este mês merece atenção.',
      tone: 'attention',
      reason: 'Uma mudança de curto prazo pede contexto antes de qualquer decisão.',
    };
  }
  return {
    headline: 'Seu mês está em construção.',
    tone: 'neutral',
    reason: 'A consistência dos próximos movimentos será mais importante que uma oscilação isolada.',
  };
}

module.exports = { buildTodayNarrative };
