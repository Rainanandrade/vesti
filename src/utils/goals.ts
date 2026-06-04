// Metas progressivas infinitas baseadas no patrimônio.
const BASE_GOALS = [
  500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000,
  250_000, 500_000, 1_000_000,
];

export type Goal = {
  value: number;
  label: string;
  reached: boolean;
};

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

  return {
    current: {
      value: currentValue,
      label: labelFor(currentValue),
      reached: reachedCount > 0,
    },
    next: {
      value: nextValue,
      label: labelFor(nextValue),
      reached: false,
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
