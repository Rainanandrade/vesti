// Lista canônica de features do Vesti Pro.
// Usada no PremiumLockModal e na landing ProSubscribeScreen.

export type ProFeature = {
  icon: string;      // Ionicons name
  title: string;
  description: string;
  status: 'live' | 'soon';  // live = já funciona no trial; soon = em breve
};

export const PRO_FEATURES: ProFeature[] = [
  {
    icon: 'calculator',
    title: 'IR & DARF automatizado',
    description: 'Calcula seu imposto mês a mês, gera guia DARF e alerta sobre vendas que geram imposto.',
    status: 'live',
  },
  {
    icon: 'sparkles',
    title: 'IA consultora da carteira',
    description: 'Análise personalizada, sugestão de aporte e chat que conhece seus ativos (Llama 3.3).',
    status: 'live',
  },
  {
    icon: 'notifications',
    title: 'Alertas inteligentes',
    description: 'Preço alvo, data-com de dividendo, concentração de setor, dividendo caiu.',
    status: 'live',
  },
  {
    icon: 'analytics',
    title: 'Simulador Monte Carlo',
    description: '1.000 cenários com seus aportes futuros. P10 (pessimista), P50, P90 (otimista).',
    status: 'live',
  },
  {
    icon: 'document-text',
    title: 'Relatórios PDF',
    description: 'Extrato mensal e informe anual pra declaração de IR. Envie ao contador em 1 clique.',
    status: 'live',
  },
  {
    icon: 'people',
    title: 'Carteiras compartilhadas',
    description: 'Convide cônjuge, filhos ou planejador. Múltiplas carteiras, sem limite.',
    status: 'live',
  },
  {
    icon: 'trophy',
    title: 'Compare com gestores famosos',
    description: 'Sua carteira × Verde, Dahlia, Trígono, IFIX, CDI. Veja quem você está batendo.',
    status: 'live',
  },
  {
    icon: 'stats-chart',
    title: 'Métricas profissionais',
    description: 'Sharpe, volatilidade anualizada, max drawdown, retorno anualizado. As mesmas dos gestores.',
    status: 'live',
  },
  {
    icon: 'sync-circle',
    title: 'Sincronização B3 & corretoras',
    description: 'XP, Rico, Clear, BTG, Nubank e outras via Open Finance. Ativos aparecem sozinhos.',
    status: 'soon',
  },
];
