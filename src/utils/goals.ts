// 12 metas progressivas com emoji + título + descrição + celebração.
// Após 1M, segue dobrando.

export type GoalMeta = {
  value: number;
  emoji: string;
  title: string;
  desc: string;
  celebrate: string;
  suggestion: string;
};

export const GOAL_METAS: GoalMeta[] = [
  { value: 100,     emoji: '🌱', title: 'Primeira semente',       desc: 'R$ 100 investidos',         celebrate: 'Plantou a primeira semente. A jornada de mil quilômetros começa com um passo.',                                   suggestion: 'Tira um print desse momento. Daqui a 5 anos vai sorrir vendo onde começou 📸' },
  { value: 500,     emoji: '⚡', title: 'Impulso inicial',         desc: 'R$ 500 no portfólio',       celebrate: 'Meio salário mínimo a gerar renda por você. Isso é real e é seu.',                                                 suggestion: 'Conta pra alguém de confiança. Celebrações compartilhadas valem mais 🥂' },
  { value: 1_000,   emoji: '🏆', title: 'Primeiro milhar',         desc: 'R$ 1.000 conquistados',     celebrate: 'R$ 1.000 gerando ~R$ 7/mês em dividendos. O dinheiro já trabalha por você.',                                          suggestion: 'Um jantar especial em casa hoje 🍝 — este é um marco real.' },
  { value: 2_500,   emoji: '🎯', title: 'Disciplina comprovada',   desc: 'R$ 2.500 acumulados',       celebrate: 'Provou a si mesmo que consegue manter o hábito. Isso vale mais que qualquer rendimento.',                              suggestion: 'Um fim de semana diferente — museu, natureza, algo que você adia 🎨' },
  { value: 5_000,   emoji: '🔥', title: 'A bola de neve começou',  desc: 'R$ 5.000 no portfólio',     celebrate: 'R$ 5.000 gerando ~R$ 35/mês. Os dividendos já pagam uma conta.',                                                    suggestion: 'Algo que você usa todo dia mas adia comprar 🎧' },
  { value: 10_000,  emoji: '💎', title: 'Cinco dígitos',           desc: 'R$ 10.000 investidos',      celebrate: 'Dez mil reais a trabalhar enquanto você dorme. Liberdade em construção.',                                              suggestion: 'Um passeio especial — show, restaurante, museu 🎭' },
  { value: 25_000,  emoji: '🌟', title: 'Investidor sério',        desc: 'R$ 25.000 acumulados',      celebrate: 'R$ 25.000 gerando ~R$ 175/mês. Quase um salário mínimo em renda passiva.',                                            suggestion: 'Renove algo que você usa todo dia 🛍️' },
  { value: 50_000,  emoji: '🚀', title: 'Rumo à liberdade',        desc: 'R$ 50.000 no portfólio',    celebrate: 'Cinquenta mil. R$ 350/mês em dividendos. Um salário em construção.',                                                  suggestion: 'Viagem especial — uma memória que dura ✈️' },
  { value: 100_000, emoji: '👑', title: 'Centena de ouro',         desc: 'R$ 100.000 conquistados',   celebrate: 'Cem mil reais. R$ 700/mês em renda passiva. A maioria nunca chega aqui.',                                              suggestion: 'Esse marco merece algo verdadeiramente especial 🍾' },
  { value: 250_000, emoji: '🏰', title: 'Soberania em construção', desc: 'R$ 250.000 acumulados',     celebrate: 'R$ 250k gerando ~R$ 1.750/mês. A liberdade financeira está no horizonte.',                                              suggestion: 'Uma viagem dos sonhos — não a próxima, A viagem 🌍' },
  { value: 500_000, emoji: '🌈', title: 'Meio milhão',             desc: 'R$ 500.000 no portfólio',   celebrate: 'Meio milhão. ~R$ 3.500/mês em dividendos. Liberdade financeira parcial.',                                              suggestion: 'Algo que muda a vida — pra você, família, alguém que ama 💫' },
  { value: 1_000_000, emoji: '🌙', title: 'Clube do milhão',       desc: 'R$ 1.000.000 — meta máxima', celebrate: 'Um milhão de reais gerando ~R$ 7.000/mês. Você chegou.',                                                                suggestion: 'Escreva uma carta pro "você" do começo. Ele merece saber que valeu 📜' },
];

const BASE_GOALS = GOAL_METAS.map((g) => g.value);

export type Goal = {
  value: number;
  label: string;
  reached: boolean;
  emoji?: string;
  title?: string;
  desc?: string;
};

export function getGoalMeta(value: number): GoalMeta | undefined {
  return GOAL_METAS.find((g) => g.value === value);
}

function generateMilestone(index: number): number {
  if (index < BASE_GOALS.length) return BASE_GOALS[index];
  // Após 1M, dobra a cada meta.
  const beyond = index - BASE_GOALS.length + 1;
  return 1_000_000 * Math.pow(2, beyond);
}

export function getGoals(patrimony: number): {
  current: Goal;
  next: Goal;
  reachedCount: number;
} {
  let reachedCount = 0;
  while (patrimony >= generateMilestone(reachedCount)) {
    reachedCount++;
  }

  const currentValue = reachedCount === 0 ? 0 : generateMilestone(reachedCount - 1);
  const nextValue = generateMilestone(reachedCount);
  const currentMeta = getGoalMeta(currentValue);
  const nextMeta = getGoalMeta(nextValue);

  return {
    current: {
      value: currentValue,
      label: labelFor(currentValue),
      reached: reachedCount > 0,
      emoji: currentMeta?.emoji,
      title: currentMeta?.title,
      desc: currentMeta?.desc,
    },
    next: {
      value: nextValue,
      label: labelFor(nextValue),
      reached: false,
      emoji: nextMeta?.emoji,
      title: nextMeta?.title,
      desc: nextMeta?.desc,
    },
    reachedCount,
  };
}

export function getAllReachedGoals(patrimony: number): Goal[] {
  const all: Goal[] = [];
  let i = 0;
  while (patrimony >= generateMilestone(i)) {
    const v = generateMilestone(i);
    all.push({ value: v, label: labelFor(v), reached: true });
    i++;
  }
  return all;
}

function labelFor(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return `R$ ${v}`;
}
