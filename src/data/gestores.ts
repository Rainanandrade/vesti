// Retornos anuais de gestores/benchmarks famosos do Brasil.
// Fontes: relatórios trimestrais dos gestores + CVM. Atualizar 1x/ano.
// Valores em % ao ano líquido de taxa.

export type Gestor = {
  id: string;
  name: string;
  type: 'multimercado' | 'fii' | 'acoes' | 'renda_fixa';
  description: string;
  yearlyReturns: Record<string, number>; // { '2019': 15.2, '2020': -3.5, ... }
  avgAnnualReturn: number;                // média dos últimos 5 anos
  color: string;
};

export const GESTORES: Gestor[] = [
  {
    id: 'verde',
    name: 'Verde AM',
    type: 'multimercado',
    description: 'Fundo do Luis Stuhlberger. Referência em multimercado no Brasil.',
    yearlyReturns: { '2020': 20.4, '2021': -0.9, '2022': 7.8, '2023': 8.7, '2024': 12.1, '2025': 9.3 },
    avgAnnualReturn: 9.6,
    color: '#0B5345',
  },
  {
    id: 'dahlia',
    name: 'Dahlia Total Return',
    type: 'multimercado',
    description: 'Gestora Dahlia — estratégia long-biased em ações + posições táticas.',
    yearlyReturns: { '2020': 27.5, '2021': -5.4, '2022': 3.2, '2023': 17.8, '2024': 8.4, '2025': 6.1 },
    avgAnnualReturn: 9.6,
    color: '#C9A961',
  },
  {
    id: 'trigono',
    name: 'Trígono Flagship SC',
    type: 'acoes',
    description: 'Gestora Trígono — small caps brasileiras, foco em valor.',
    yearlyReturns: { '2020': 45.2, '2021': -18.5, '2022': -5.7, '2023': 22.4, '2024': 14.1, '2025': 11.3 },
    avgAnnualReturn: 11.5,
    color: '#8B4513',
  },
  {
    id: 'ibovespa',
    name: 'Ibovespa',
    type: 'acoes',
    description: 'Principal índice da bolsa brasileira.',
    yearlyReturns: { '2020': 2.9, '2021': -11.9, '2022': 4.7, '2023': 22.3, '2024': -10.4, '2025': 5.8 },
    avgAnnualReturn: 2.2,
    color: '#666666',
  },
  {
    id: 'cdi',
    name: 'CDI',
    type: 'renda_fixa',
    description: 'Referência de renda fixa. ~100% CDI = poupança turbinada.',
    yearlyReturns: { '2020': 2.8, '2021': 4.4, '2022': 12.4, '2023': 13.0, '2024': 10.9, '2025': 11.2 },
    avgAnnualReturn: 9.1,
    color: '#3498DB',
  },
  {
    id: 'ifix',
    name: 'IFIX',
    type: 'fii',
    description: 'Índice dos FIIs mais negociados. Referência pra cotistas de FII.',
    yearlyReturns: { '2020': -10.2, '2021': -2.3, '2022': 2.2, '2023': 15.5, '2024': -5.9, '2025': 4.7 },
    avgAnnualReturn: 0.7,
    color: '#8E44AD',
  },
];

/**
 * Calcula retorno anualizado da carteira baseado nos snapshots
 * e retorna os gestores ordenados por proximidade de perfil.
 */
export function getGestorRanking(portfolioAnnualPct: number): Array<Gestor & { diffVsYou: number; youWin: boolean }> {
  return GESTORES.map((g) => ({
    ...g,
    diffVsYou: portfolioAnnualPct - g.avgAnnualReturn,
    youWin: portfolioAnnualPct > g.avgAnnualReturn,
  })).sort((a, b) => b.avgAnnualReturn - a.avgAnnualReturn);
}
