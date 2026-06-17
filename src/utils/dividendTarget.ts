import { DividendTarget } from '../data/profileQuiz';

export type TargetProgress = {
  // alvo final em R$/mês (sempre normalizamos pra esse formato)
  targetMonthlyAmount: number;
  // valor atual em R$/mês (média dos últimos 12 meses recebidos OU forecast)
  currentMonthlyAmount: number;
  // progresso 0..1
  progress: number;
  // patrimônio investido pra atingir o alvo (assumindo DY média da carteira)
  capitalNeeded: number;
  // capital atual
  currentCapital: number;
  // quanto falta investir
  capitalGap: number;
};

export function computeTargetProgress(
  target: DividendTarget | undefined,
  totalCurrent: number,
  weightedDY: number,            // DY anual ponderada da carteira (%, ex: 8.5)
  ytdReceived: number,           // R$ recebidos no ano até agora
  monthsElapsed: number,         // meses passados no ano (1-12)
): TargetProgress | null {
  if (!target || target.value <= 0) return null;

  // Normaliza pra R$/mês
  let targetMonthlyAmount: number;
  if (target.mode === 'monthly_amount') {
    targetMonthlyAmount = target.value;
  } else {
    // annual_dy: precisa de capital pra render esse % ao ano
    // Se quer X% a.a sobre o capital atual, R$/mês = capital × X/100 / 12
    targetMonthlyAmount = (totalCurrent * target.value) / 100 / 12;
  }

  const currentMonthlyAmount = monthsElapsed > 0 ? ytdReceived / monthsElapsed : 0;
  const progress = targetMonthlyAmount > 0
    ? Math.min(1, currentMonthlyAmount / targetMonthlyAmount)
    : 0;

  // Capital necessário pra atingir target com DY atual
  // R$/mês × 12 = capital × DY/100 → capital = R$/mês × 12 / (DY/100)
  const dy = weightedDY > 0 ? weightedDY : 8; // fallback 8% se ainda não calculou
  const capitalNeeded = (targetMonthlyAmount * 12) / (dy / 100);
  const capitalGap = Math.max(0, capitalNeeded - totalCurrent);

  return {
    targetMonthlyAmount,
    currentMonthlyAmount,
    progress,
    capitalNeeded,
    currentCapital: totalCurrent,
    capitalGap,
  };
}

export function targetDescription(t: DividendTarget): string {
  if (t.mode === 'monthly_amount') {
    return `Receber R$ ${t.value.toFixed(0)}/mês em dividendos`;
  }
  return `DY de no mínimo ${t.value.toFixed(1)}% ao ano`;
}
