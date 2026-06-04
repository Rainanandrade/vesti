export type GlossaryTerm = {
  term: string;
  short: string;
  full: string;
  example: string;
};

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'P/L',
    short: 'Preço sobre Lucro',
    full: 'Mostra quantos anos de lucro a empresa precisa pra "pagar" o preço atual da ação. Quanto menor, mais barata tende a estar — mas P/L baixo às vezes indica problema no setor.',
    example: 'Uma padaria custa R$ 100.000 e dá R$ 20.000 de lucro por ano. P/L = 5. Em 5 anos o lucro paga o preço.',
  },
  {
    term: 'DY',
    short: 'Dividend Yield',
    full: 'Quanto a empresa pagou em dividendos no último ano, em porcentagem do preço atual. É o "aluguel" que a ação te paga.',
    example: 'Ação custa R$ 100 e pagou R$ 6 em dividendos. DY = 6%. Em FII, esse rendimento é isento de imposto.',
  },
  {
    term: 'ROE',
    short: 'Retorno sobre Patrimônio',
    full: 'O quanto a empresa gera de lucro em cima do dinheiro dos sócios. É a medida de eficiência. Acima de 15% é considerado bom.',
    example: 'Empresa tem patrimônio de R$ 1 bilhão e lucrou R$ 200 milhões. ROE = 20%. Excelente.',
  },
  {
    term: 'P/VP',
    short: 'Preço sobre Valor Patrimonial',
    full: 'Compara o preço da cota com o valor real dos ativos. Usado principalmente em FIIs.',
    example: 'P/VP = 0,9 significa que você paga R$ 0,90 por R$ 1,00 de patrimônio (10% de desconto).',
  },
  {
    term: 'Volatilidade',
    short: 'Oscilação do preço',
    full: 'O quanto o preço de um ativo sobe e desce. Alta volatilidade = preço muda muito (mais risco). Baixa = preço estável.',
    example: 'Bitcoin tem volatilidade alta — pode subir ou cair 10% num dia. Tesouro Selic tem volatilidade baixíssima.',
  },
  {
    term: 'Beta',
    short: 'Sensibilidade ao mercado',
    full: 'Mede o quanto uma ação se move em relação ao Ibovespa. Beta = 1 segue o índice. Beta = 1.5 oscila 50% mais.',
    example: 'Banco Bradesco tem Beta perto de 1 (segue o Ibovespa). Empresa de tecnologia volátil pode ter Beta 1.8.',
  },
  {
    term: 'FII',
    short: 'Fundo Imobiliário',
    full: 'Você compra "pedacinhos" de imóveis (shoppings, galpões, lajes) e recebe parte do aluguel todo mês, isento de imposto.',
    example: 'Em vez de comprar um apartamento de R$ 300.000 pra alugar, compra R$ 100 de um FII e já começa a receber aluguel.',
  },
  {
    term: 'ETF',
    short: 'Fundo de Índice',
    full: 'Um único ativo que junta várias ações. Comprando 1 cota, você "compra" várias empresas de uma vez.',
    example: 'BOVA11 = ETF que segue o Ibovespa. Compra 1 cota e já tem as 80+ maiores empresas da bolsa.',
  },
  {
    term: 'BDR',
    short: 'Recibo de ação estrangeira',
    full: 'Permite investir em ações de empresas de fora (Apple, Microsoft, Tesla) negociando na B3, em reais.',
    example: 'AAPL34 é o BDR da Apple. Você compra na bolsa brasileira sem precisar abrir conta no exterior.',
  },
  {
    term: 'IPCA',
    short: 'Inflação oficial',
    full: 'Mede o quanto os preços subiram. Se seu dinheiro rende menos que o IPCA, você está perdendo poder de compra.',
    example: 'IPCA = 5% no ano. Seu investimento rendeu 3%. Você ficou "mais pobre" em 2%.',
  },
  {
    term: 'Selic',
    short: 'Taxa básica de juros',
    full: 'A taxa base de juros do Brasil. Define quanto rende a renda fixa mais segura (Tesouro Selic, CDBs).',
    example: 'Selic em 11% → CDB que paga "100% do CDI" rende perto disso ao ano.',
  },
  {
    term: 'CDI',
    short: 'Referência de renda fixa',
    full: 'Taxa muito próxima da Selic, usada como referência. "100% do CDI" significa que rende quase igual à Selic.',
    example: 'CDB de "110% do CDI" com Selic em 11% rende cerca de 12% ao ano.',
  },
  {
    term: 'Renda Fixa',
    short: 'Rende um valor previsível',
    full: 'Investimentos onde você sabe (ou tem boa ideia) de quanto vai render. Geralmente mais seguros.',
    example: 'Tesouro Direto, CDBs, LCIs, LCAs.',
  },
  {
    term: 'Renda Variável',
    short: 'Rende sem garantia',
    full: 'Pode render muito ou cair. O preço varia o tempo todo conforme o mercado.',
    example: 'Ações, FIIs, ETFs, criptomoedas.',
  },
  {
    term: 'Diversificação',
    short: 'Não pôr tudo no mesmo lugar',
    full: 'Espalhar o dinheiro em vários ativos diferentes pra reduzir risco. Se um vai mal, os outros amortecem.',
    example: 'Em vez de comprar só Petrobras, comprar um pouco de cada setor: bancos, energia, varejo, FII.',
  },
  {
    term: 'Aporte',
    short: 'Quanto você investe',
    full: 'Valor adicionado à carteira. Quanto maior e mais consistente, mais rápido você atinge metas.',
    example: 'Aportar R$ 500 todo mês por 10 anos a 10% ao ano = R$ 102.000.',
  },
  {
    term: 'Liquidez',
    short: 'Facilidade de transformar em dinheiro',
    full: 'Quanto mais rápido e sem perda você consegue vender o ativo, maior a liquidez.',
    example: 'Tesouro Selic = liquidez diária (D+1). Imóvel físico = baixa liquidez (meses pra vender).',
  },
  {
    term: 'FGC',
    short: 'Fundo Garantidor de Créditos',
    full: 'Seguro que garante até R$ 250.000 por CPF por banco em CDBs, LCIs e LCAs. Se o banco quebra, você recebe.',
    example: 'Tem R$ 200.000 em um CDB do banco X que quebrou. O FGC te devolve em até alguns meses.',
  },
  {
    term: 'IR',
    short: 'Imposto de Renda',
    full: 'Sobre ganhos de capital. Em ações 15%, em day-trade 20%, em renda fixa de 22,5% a 15% (regressivo).',
    example: 'Lucrou R$ 1.000 vendendo ações? Paga R$ 150 de IR (se vendeu mais de R$ 20 mil no mês).',
  },
  {
    term: 'Swing Trade',
    short: 'Compra hoje, vende em dias/semanas',
    full: 'Operação que dura mais de um dia, com objetivo de capturar movimentos de curto a médio prazo.',
    example: 'Comprou PETR4 segunda, vendeu sexta com lucro. Pagou 15% sobre o ganho (se passou de R$ 20 mil vendidos no mês).',
  },
  {
    term: 'Day Trade',
    short: 'Compra e vende no mesmo dia',
    full: 'Operação de curto prazo, alta complexidade e alto risco. Cobra IR de 20% sem isenção, e geralmente perde dinheiro.',
    example: 'Estudos da CVM mostram que 95% dos day-traders perdem dinheiro no longo prazo. Fuja se for iniciante.',
  },
  {
    term: 'Vacância',
    short: 'Imóveis sem inquilino (em FII)',
    full: 'Percentual dos imóveis do FII que estão desocupados. Maior vacância = menor rendimento.',
    example: 'FII com 20% de vacância significa que 20% dos imóveis não estão gerando aluguel.',
  },
  {
    term: 'Tesouro Selic',
    short: 'Título público pós-fixado',
    full: 'Empresta dinheiro pro governo e recebe a taxa Selic. Mais seguro do país, ideal pra reserva de emergência.',
    example: 'Selic em 11%? Seu Tesouro Selic rende ~11% ao ano, com liquidez diária.',
  },
  {
    term: 'Tesouro IPCA+',
    short: 'Inflação + taxa fixa',
    full: 'Te garante render a inflação + uma taxa contratada (ex: IPCA + 6%). Ideal pra longo prazo.',
    example: 'Comprou Tesouro IPCA+ 2035 com taxa de 6%. Se IPCA acumular 50%, você ganha 50% + 6% ao ano de juros.',
  },
];
