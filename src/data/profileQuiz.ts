export type QuizOption = {
  label: string;
  score: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  helper?: string;
  options: QuizOption[];
};

export const QUIZ: QuizQuestion[] = [
  {
    id: 'age',
    question: 'Qual a sua idade?',
    options: [
      { label: 'Até 25 anos', score: 4 },
      { label: '26 a 40 anos', score: 3 },
      { label: '41 a 55 anos', score: 2 },
      { label: 'Mais de 55 anos', score: 1 },
    ],
  },
  {
    id: 'income',
    question: 'Quanto da sua renda mensal você consegue investir?',
    options: [
      { label: 'Menos de 5%', score: 1 },
      { label: 'Entre 5% e 15%', score: 2 },
      { label: 'Entre 15% e 30%', score: 3 },
      { label: 'Mais de 30%', score: 4 },
    ],
  },
  {
    id: 'experience',
    question: 'Qual é a sua experiência com investimentos?',
    options: [
      { label: 'Nunca investi nada', score: 1 },
      { label: 'Só poupança ou Tesouro', score: 2 },
      { label: 'Já comprei ações ou FIIs', score: 3 },
      { label: 'Invisto há anos em vários tipos', score: 4 },
    ],
  },
  {
    id: 'goal',
    question: 'Pra que você está investindo?',
    helper: 'Escolha o objetivo principal',
    options: [
      { label: 'Reserva de emergência', score: 1 },
      { label: 'Comprar algo nos próximos 2 anos', score: 2 },
      { label: 'Aposentadoria / longo prazo', score: 3 },
      { label: 'Multiplicar patrimônio rápido', score: 4 },
    ],
  },
  {
    id: 'reaction',
    question: 'Se sua carteira caísse 20% em uma semana, o que você faria?',
    options: [
      { label: 'Venderia tudo, isso me deixa mal', score: 1 },
      { label: 'Venderia parte pra reduzir o estrago', score: 2 },
      { label: 'Não faria nada, faz parte', score: 3 },
      { label: 'Compraria mais, está barato!', score: 4 },
    ],
  },
  {
    id: 'horizon',
    question: 'Por quanto tempo você consegue deixar o dinheiro investido?',
    options: [
      { label: 'Menos de 1 ano', score: 1 },
      { label: '1 a 3 anos', score: 2 },
      { label: '3 a 10 anos', score: 3 },
      { label: 'Mais de 10 anos', score: 4 },
    ],
  },
];

export type ProfileType = 'conservador' | 'moderado' | 'arrojado' | 'agressivo';

export type Preference = 'dividendos' | 'crescimento' | 'equilibrado' | 'sem_preferencia';

export const PREFERENCE_INFO: Record<
  Preference,
  { emoji: string; label: string; description: string; tagline: string }
> = {
  dividendos: {
    emoji: '💸',
    label: 'Foco em dividendos',
    description: 'Quero renda mensal/trimestral pra reinvestir ou complementar minha renda. Prefiro FIIs e empresas pagadoras de dividendos.',
    tagline: 'Foco em dividendos',
  },
  crescimento: {
    emoji: '📈',
    label: 'Foco em crescimento',
    description: 'Quero valorização do patrimônio no longo prazo. Não preciso de renda agora — prefiro empresas em expansão.',
    tagline: 'Foco em crescimento',
  },
  equilibrado: {
    emoji: '⚖️',
    label: 'Equilibrado',
    description: 'Quero um pouco dos dois — algum fluxo de renda combinado com crescimento de patrimônio.',
    tagline: 'Equilibrado',
  },
  sem_preferencia: {
    emoji: '🤔',
    label: 'Sem preferência',
    description: 'Deixa o app decidir pelo meu perfil de risco — não tenho preferência específica.',
    tagline: '',
  },
};

export function preferenceLabel(p?: Preference): string {
  if (!p || p === 'sem_preferencia') return '';
  return PREFERENCE_INFO[p].tagline;
}

export type Profile = {
  type: ProfileType;
  score: number;
  answers: Record<string, number>;
  description: string;
  strategy: { renda_fixa: number; renda_variavel: number; internacional: number };
  recommendations: string[];
  brokerId?: string;        // legado (será migrado pra brokerIds)
  brokerIds?: string[];     // múltiplas corretoras
  preference?: Preference;  // estilo de investimento — null pra usuários antigos
};

export function computeProfile(answers: Record<string, number>): Profile {
  const score = Object.values(answers).reduce((a, b) => a + b, 0);
  // Min 6, Max 24
  let type: ProfileType;
  let description: string;
  let strategy: Profile['strategy'];
  let recommendations: string[];

  if (score <= 10) {
    type = 'conservador';
    description =
      'Você prioriza segurança e previsibilidade. Vamos focar em renda fixa, que rende um pouco menos, mas dorme tranquilo.';
    strategy = { renda_fixa: 80, renda_variavel: 15, internacional: 5 };
    recommendations = [
      'Tesouro Selic — segurança máxima, rende a taxa básica.',
      'CDBs de bancos grandes com liquidez diária.',
      'Uma pequena parte em FIIs de tijolo (galpões, shoppings).',
    ];
  } else if (score <= 15) {
    type = 'moderado';
    description =
      'Você aceita um pouco de oscilação em troca de retorno maior. Vamos balancear segurança e crescimento.';
    strategy = { renda_fixa: 50, renda_variavel: 40, internacional: 10 };
    recommendations = [
      'Metade em renda fixa (Tesouro IPCA+, CDBs).',
      'Ações de empresas sólidas pagadoras de dividendos.',
      'FIIs diversificados para renda mensal.',
      'Pequena exposição internacional via ETF (IVVB11).',
    ];
  } else if (score <= 20) {
    type = 'arrojado';
    description =
      'Você tem perfil de crescimento. Aceita volatilidade pra capturar retornos maiores no longo prazo.';
    strategy = { renda_fixa: 25, renda_variavel: 60, internacional: 15 };
    recommendations = [
      'Carteira diversificada de ações brasileiras (10 a 15 empresas).',
      'FIIs de papel e tijolo combinados.',
      'ETFs globais para diversificação geográfica.',
      'Reserva de emergência em renda fixa de liquidez.',
    ];
  } else {
    type = 'agressivo';
    description =
      'Você busca máximo crescimento e topa volatilidade alta. Foco em renda variável e ativos de maior potencial.';
    strategy = { renda_fixa: 10, renda_variavel: 70, internacional: 20 };
    recommendations = [
      'Carteira concentrada em ações de crescimento.',
      'Exposição internacional relevante (ETFs e BDRs).',
      'Pequena parcela em ativos alternativos.',
      'Mínimo em renda fixa, só pra emergência.',
    ];
  }

  return { type, score, answers, description, strategy, recommendations };
}
