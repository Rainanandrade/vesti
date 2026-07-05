// Taxas anualizadas de benchmarks BR (média dos últimos ~5 anos).
// Atualizar 1x/ano ou plugar API pra dados em tempo real.

export type Benchmark = {
  id: string;
  name: string;
  fullName: string;
  yearlyRatePct: number;
  color: string;
  category: 'renda_fixa' | 'inflacao' | 'acoes' | 'fii' | 'internacional';
};

export const BENCHMARKS: Benchmark[] = [
  {
    id: 'cdi',
    name: 'CDI',
    fullName: 'CDI · referência renda fixa',
    yearlyRatePct: 11.75,
    color: '#F1C40F',
    category: 'renda_fixa',
  },
  {
    id: 'ipca',
    name: 'IPCA',
    fullName: 'IPCA · inflação oficial',
    yearlyRatePct: 4.5,
    color: '#E67E22',
    category: 'inflacao',
  },
  {
    id: 'ibov',
    name: 'IBOV',
    fullName: 'Ibovespa · principais ações',
    yearlyRatePct: 5.8,
    color: '#666666',
    category: 'acoes',
  },
  {
    id: 'ifix',
    name: 'IFIX',
    fullName: 'IFIX · fundos imobiliários',
    yearlyRatePct: 2.1,
    color: '#8E44AD',
    category: 'fii',
  },
  {
    id: 'smll',
    name: 'SMLL',
    fullName: 'Small Caps · ações pequenas',
    yearlyRatePct: 8.3,
    color: '#16A085',
    category: 'acoes',
  },
  {
    id: 'idiv',
    name: 'IDIV',
    fullName: 'IDIV · ações pagadoras de dividendos',
    yearlyRatePct: 7.4,
    color: '#0B5345',
    category: 'acoes',
  },
  {
    id: 'ivvb11',
    name: 'IVVB11',
    fullName: 'IVVB11 · S&P 500 em BRL',
    yearlyRatePct: 12.5,
    color: '#3498DB',
    category: 'internacional',
  },
];

export function getBenchmark(id: string): Benchmark | undefined {
  return BENCHMARKS.find((b) => b.id === id);
}

/**
 * Acumula rentabilidade do benchmark pra N dias.
 * @param yearlyRatePct taxa anual em %
 * @param days dias decorridos
 * @returns retorno acumulado em % (ex: 1.16 = 1,16%)
 */
export function accumulateBenchmark(yearlyRatePct: number, days: number): number {
  if (days <= 0) return 0;
  const dailyRate = Math.pow(1 + yearlyRatePct / 100, 1 / 365) - 1;
  return (Math.pow(1 + dailyRate, days) - 1) * 100;
}
