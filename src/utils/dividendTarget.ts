import { DividendTarget } from '../data/profileQuiz';

export type TargetProgress = {
  mode: 'monthly_amount' | 'annual_dy';
  targetMonthlyAmount: number;
  currentMonthlyAmount: number;
  progress: number;                     // 0..1
  currentCapital: number;
  // Só usados no modo 'monthly_amount':
  capitalNeeded: number;
  capitalGap: number;
  // Só usados no modo 'annual_dy':
  currentDyPct?: number;                // DY atual da carteira (%)
  targetDyPct?: number;                 // DY meta (%)
  dyGapPp?: number;                     // diferença em pontos percentuais (target - current)
};

export function computeTargetProgress(
  target: DividendTarget | undefined,
  totalCurrent: number,
  weightedDY: number,            // DY anual ponderada da carteira (%, ex: 8.5)
  ytdReceived: number,           // R$ recebidos no ano até agora
  monthsElapsed: number,         // meses passados no ano (1-12)
): TargetProgress | null {
  if (!target || target.value <= 0) return null;

  const currentMonthlyAmount = monthsElapsed > 0 ? ytdReceived / monthsElapsed : 0;

  if (target.mode === 'annual_dy') {
    // Meta é uma TAXA (DY %). Compara taxa com taxa.
    // Investir mais não muda o DY — só rebalanceamento resolve.
    const currentDyPct = weightedDY;
    const targetDyPct = target.value;
    const dyGapPp = targetDyPct - currentDyPct;
    const progress = targetDyPct > 0 ? Math.min(1, Math.max(0, currentDyPct / targetDyPct)) : 0;
    // targetMonthlyAmount informativo: quanto o user RECEBERIA se atingisse a meta
    const targetMonthlyAmount = (totalCurrent * targetDyPct) / 100 / 12;
    return {
      mode: 'annual_dy',
      targetMonthlyAmount,
      currentMonthlyAmount,
      progress,
      currentCapital: totalCurrent,
      capitalNeeded: 0,
      capitalGap: 0,
      currentDyPct,
      targetDyPct,
      dyGapPp,
    };
  }

  // Modo monthly_amount: meta é um VALOR fixo em R$/mês.
  // Aí sim faz sentido calcular quanto capital seria necessário.
  const targetMonthlyAmount = target.value;
  const progress = targetMonthlyAmount > 0
    ? Math.min(1, currentMonthlyAmount / targetMonthlyAmount)
    : 0;
  const dy = weightedDY > 0 ? weightedDY : 8; // fallback pra estimativa
  const capitalNeeded = (targetMonthlyAmount * 12) / (dy / 100);
  const capitalGap = Math.max(0, capitalNeeded - totalCurrent);

  return {
    mode: 'monthly_amount',
    targetMonthlyAmount,
    currentMonthlyAmount,
    progress,
    currentCapital: totalCurrent,
    capitalNeeded,
    capitalGap,
  };
}

export function targetDescription(t: DividendTarget): string {
  if (t.mode === 'monthly_amount') {
    return `Receber R$ ${t.value.toFixed(0)}/mês em dividendos`;
  }
  return `DY de no mínimo ${t.value.toFixed(1)}% ao ano`;
}
