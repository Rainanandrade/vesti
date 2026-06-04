// Frases motivacionais e educativas pra rotacionar diariamente.
// Pega a data do dia → escolhe uma frase determinística (mesma o dia inteiro).

export type Quote = {
  text: string;
  author?: string;
};

export const QUOTES: Quote[] = [
  { text: 'Não é sobre o quanto você ganha, é sobre o quanto você guarda.', author: 'Robert Kiyosaki' },
  { text: 'O preço é o que você paga. O valor é o que você recebe.', author: 'Warren Buffett' },
  { text: 'O mercado é um mecanismo de transferir dinheiro do impaciente pro paciente.', author: 'Warren Buffett' },
  { text: 'Investir é simples, mas não é fácil.', author: 'Warren Buffett' },
  { text: 'Tempo no mercado bate tentar acertar o tempo do mercado.', author: 'Ditado de investidor' },
  { text: 'Quanto mais cedo você começa, menos esforço o futuro vai exigir.' },
  { text: 'Diversificação é a única refeição grátis no mundo dos investimentos.', author: 'Harry Markowitz' },
  { text: 'Cada R$ 100 investidos hoje pode virar R$ 1.000 daqui a 30 anos. Comece agora.' },
  { text: 'Quem entende dos juros compostos, ganha. Quem não entende, paga.' },
  { text: 'A bolsa é o lugar onde dinheiro impaciente vai pra dinheiro paciente.' },
  { text: 'Disciplina é fazer o que você sabe que precisa ser feito, mesmo quando não está animado.' },
  { text: 'Compre quando os outros estão com medo. Venda quando os outros estão eufóricos.', author: 'Warren Buffett' },
  { text: 'O segredo da liberdade financeira é gastar menos do que ganha, e investir a diferença com inteligência.' },
  { text: 'Risco vem de não saber o que você está fazendo.', author: 'Warren Buffett' },
  { text: 'Pequenos aportes consistentes vencem grandes aportes esporádicos.' },
  { text: 'A mais poderosa força no universo são os juros compostos.', author: 'Albert Einstein' },
  { text: 'Quem investe planta. Quem espera, colhe.' },
  { text: 'O melhor momento pra começar a investir foi 10 anos atrás. O segundo melhor é agora.' },
  { text: 'Aporte mensal é como ir à academia: o resultado vem da repetição, não da intensidade.' },
  { text: 'Volatilidade é o preço que pagamos por retornos acima da inflação.' },
  { text: 'Quem não se planeja, planeja fracassar.' },
  { text: 'Você se torna rico devagar. Quem ficou rico rápido, geralmente fica pobre rápido.' },
  { text: 'Investir é o oposto de consumir: você está se pagando primeiro.' },
  { text: 'O patrimônio é construído nos momentos de paciência, não nos de empolgação.' },
  { text: 'Faça o seu dinheiro trabalhar pra você, em vez de você trabalhar pelo dinheiro.', author: 'Robert Kiyosaki' },
  { text: 'A bolsa transfere dinheiro do ativo pro paciente, do ansioso pro disciplinado.' },
  { text: 'Não tente prever o mercado. Tente estar no mercado.' },
  { text: 'O maior inimigo do investidor é ele mesmo.', author: 'Benjamin Graham' },
  { text: 'Dividendo recebido é colheita. Reinvestido, é multiplicação.' },
  { text: 'A persistência transforma centavos em milhões.' },
  { text: 'Quem corre atrás de ganhos rápidos, geralmente alcança perdas rápidas.' },
  { text: 'Investir é como plantar uma árvore: você só vê a sombra anos depois.' },
  { text: 'O segredo é ser regular, não ser herói.' },
  { text: 'Olhe pra carteira no longo prazo, não no curto. Quem olha demais, decide errado.' },
  { text: 'A liberdade financeira começa com 1 real bem investido. O resto é repetição.' },
];

export function getQuoteOfDay(now: Date = new Date()): Quote {
  // Determinístico por dia: mesmo dia = mesma frase pra todo mundo
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
