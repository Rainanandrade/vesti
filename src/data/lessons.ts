export type LessonSection = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
  example?: { title: string; text: string };
  warning?: string;
};

export type QuizQuestion = {
  question: string;
  options: { text: string; correct: boolean; explanation: string }[];
};

export type Lesson = {
  id: string;
  trail: 'iniciante' | 'rendaFixa' | 'rendaVariavel' | 'fiis' | 'estrategia';
  emoji: string;
  title: string;
  summary: string;
  readMinutes: number;
  sections: LessonSection[];
  quiz?: QuizQuestion[]; // 3 perguntas por lição
};

export const TRAILS: Record<Lesson['trail'], { label: string; description: string; color: string }> = {
  iniciante: {
    label: 'Começando do zero',
    description: 'Conceitos básicos pra quem nunca investiu antes',
    color: '#820AD1',
  },
  rendaFixa: {
    label: 'Renda Fixa',
    description: 'Tesouro Direto, CDBs, LCIs e LCAs',
    color: '#1FAE5A',
  },
  rendaVariavel: {
    label: 'Renda Variável',
    description: 'Ações, análise e estratégias',
    color: '#E2483A',
  },
  fiis: {
    label: 'Fundos Imobiliários',
    description: 'Como receber aluguel sem ter imóvel',
    color: '#F7B500',
  },
  estrategia: {
    label: 'Estratégia',
    description: 'Diversificação, alocação e disciplina',
    color: '#5F0A9E',
  },
};

export const LESSONS: Lesson[] = [
  // ============ INICIANTE ============
  {
    id: 'por-que-investir',
    trail: 'iniciante',
    emoji: '🌱',
    title: 'Por que investir importa',
    summary: 'Dinheiro parado na conta perde valor todo mês. Aqui está o porquê e o que fazer.',
    readMinutes: 4,
    sections: [
      {
        paragraphs: [
          'Todo mês os preços sobem. Café, gasolina, aluguel, padaria. Isso se chama inflação. No Brasil, ela costuma ficar entre 4% e 6% ao ano.',
          'Se você deixa R$ 10.000 parados na conta corrente, no fim do ano eles ainda são R$ 10.000 — mas compram menos café, menos gasolina, menos tudo. Você ficou mais pobre sem fazer nada.',
        ],
        example: {
          title: 'Comparação real',
          text: 'R$ 10.000 parado na conta por 10 anos com inflação de 5% ao ano = poder de compra de R$ 6.139 hoje. R$ 10.000 rendendo 10% ao ano por 10 anos = R$ 25.937.',
        },
      },
      {
        heading: 'Investir não é coisa de rico',
        paragraphs: [
          'Hoje você pode começar com R$ 30. Sério. Tesouro Selic aceita qualquer valor a partir de uma fração e é a renda fixa mais segura do país, garantida pelo governo.',
          'A regra não é "quanto" você investe no começo. É a consistência. Quem investe R$ 100 todo mês por 30 anos a 10% ao ano termina com R$ 226.000 — começou com pouco e terminou com seis dígitos.',
        ],
      },
      {
        heading: 'A mágica dos juros compostos',
        paragraphs: [
          'No primeiro mês, seu dinheiro rende. No segundo, ele rende sobre o que rendeu. No terceiro, rende sobre o que rendeu do que rendeu. É como uma bola de neve que cresce sozinha.',
          'Einstein supostamente chamou os juros compostos de "a oitava maravilha do mundo". Quem entende, ganha. Quem não entende, paga.',
        ],
      },
    ],
    quiz: [
      {
        question: 'O que acontece com R$ 10.000 parados na conta corrente por 1 ano com 5% de inflação?',
        options: [
          { text: 'Continuam valendo R$ 10.000', correct: false, explanation: 'Numericamente sim, mas o poder de compra diminuiu.' },
          { text: 'Viram R$ 10.500 automaticamente', correct: false, explanation: 'Conta corrente não rende — pra render precisa investir.' },
          { text: 'Continuam R$ 10.000 mas compram menos coisas', correct: true, explanation: 'Exato. O número não muda, mas a inflação reduz o que esse dinheiro consegue comprar.' },
        ],
      },
      {
        question: 'Quem disse "juros compostos são a oitava maravilha do mundo"?',
        options: [
          { text: 'Warren Buffett', correct: false, explanation: 'Buffett é fã, mas a frase é atribuída a outro nome.' },
          { text: 'Albert Einstein', correct: true, explanation: 'Atribuída a Einstein. Quem entende, ganha. Quem não entende, paga.' },
          { text: 'Robert Kiyosaki', correct: false, explanation: 'Kiyosaki escreveu Pai Rico, Pai Pobre — não a frase dos juros.' },
        ],
      },
      {
        question: 'Qual é o valor mínimo pra começar a investir em Tesouro Selic?',
        options: [
          { text: 'R$ 1.000', correct: false, explanation: 'Muito alto. Você pode começar com bem menos.' },
          { text: 'A partir de uma fração de título (~R$ 30)', correct: true, explanation: 'Exato. O Tesouro Direto aceita comprar frações, começando em ~R$ 30.' },
          { text: 'R$ 5.000', correct: false, explanation: 'Não. Tesouro é acessível pra qualquer um.' },
        ],
      },
    ],
  },
  {
    id: 'reserva-emergencia',
    trail: 'iniciante',
    emoji: '🛟',
    title: 'Reserva de emergência: o primeiro passo',
    summary: 'Antes de qualquer ação ou FII, você precisa de um colchão pra dormir tranquilo.',
    readMinutes: 5,
    sections: [
      {
        paragraphs: [
          'Reserva de emergência é dinheiro guardado pra imprevistos: perder o emprego, problema de saúde, geladeira que queimou, carro que quebrou.',
          'Antes de investir em qualquer coisa de risco, monte essa reserva. Sem ela, qualquer susto te força a vender ativos no pior momento (geralmente quando estão em queda).',
        ],
      },
      {
        heading: 'Quanto guardar',
        paragraphs: [
          'A regra mais usada: de 3 a 12 vezes os seus gastos mensais. Não a renda — os gastos.',
        ],
        bullets: [
          'CLT estável, sem dependentes: 3 a 6 meses',
          'Autônomo, freelancer, dependentes: 6 a 12 meses',
          'Aposentado ou renda variável: 12 meses ou mais',
        ],
      },
      {
        heading: 'Onde guardar',
        paragraphs: [
          'A reserva precisa de três coisas: segurança total, liquidez imediata (sacar a qualquer momento), e render pelo menos a inflação.',
        ],
        bullets: [
          'Tesouro Selic — opção mais segura do país, resgate em 1 dia útil.',
          'CDB com liquidez diária de banco grande (com FGC).',
          'Conta digital que rende 100% do CDI automaticamente.',
        ],
        warning: 'Jamais coloque reserva em ações, FIIs ou cripto. Quando você precisar, o preço pode estar baixo.',
      },
    ],
  },
  {
    id: 'tipos-investimento',
    trail: 'iniciante',
    emoji: '🧩',
    title: 'Os 4 grandes tipos de investimento',
    summary: 'Renda fixa, ações, fundos imobiliários e internacional. Entenda cada um.',
    readMinutes: 6,
    sections: [
      {
        heading: '1. Renda Fixa',
        paragraphs: [
          'Você empresta dinheiro pra alguém (governo, banco, empresa) e recebe com juros. Sabe quanto vai render ou tem uma boa ideia.',
        ],
        bullets: [
          'Risco: baixo (especialmente Tesouro).',
          'Retorno esperado: 100% a 120% do CDI.',
          'Exemplos: Tesouro Direto, CDBs, LCIs, LCAs.',
        ],
      },
      {
        heading: '2. Ações',
        paragraphs: [
          'Você compra um pedacinho de uma empresa. Se ela vai bem, o preço sobe e ela pode te pagar dividendos.',
        ],
        bullets: [
          'Risco: médio a alto.',
          'Retorno esperado: longo prazo, histórico de ~12% ao ano.',
          'Exemplos: PETR4 (Petrobras), VALE3 (Vale), ITUB4 (Itaú).',
        ],
      },
      {
        heading: '3. Fundos Imobiliários (FIIs)',
        paragraphs: [
          'Você compra cotas de fundos que possuem imóveis (shoppings, lajes, galpões) ou financiam imóveis. Recebe rendimentos mensais isentos de IR.',
        ],
        bullets: [
          'Risco: médio.',
          'Retorno esperado: 7% a 11% ao ano em dividendos + valorização.',
          'Exemplos: MXRF11, HGLG11, KNRI11.',
        ],
      },
      {
        heading: '4. Internacional',
        paragraphs: [
          'Investir fora do Brasil reduz risco país. Pode ser via ETFs de empresas globais ou BDRs (recibos de ações estrangeiras negociados aqui).',
        ],
        bullets: [
          'Risco: médio.',
          'Retorno esperado: depende do mercado escolhido.',
          'Exemplos: IVVB11 (S&P 500), BIT11 (Bitcoin), BDRs como AAPL34.',
        ],
      },
    ],
  },

  // ============ RENDA FIXA ============
  {
    id: 'tesouro-direto',
    trail: 'rendaFixa',
    emoji: '🏛️',
    title: 'Tesouro Direto na prática',
    summary: 'Os 3 tipos de Tesouro, quando usar cada um, e os custos reais.',
    readMinutes: 7,
    sections: [
      {
        paragraphs: [
          'Tesouro Direto é você emprestando dinheiro pro governo brasileiro. É o investimento mais seguro do país — só quebra se o Brasil quebrar.',
          'Existem 3 famílias principais. Cada uma serve pra um objetivo diferente.',
        ],
      },
      {
        heading: 'Tesouro Selic',
        paragraphs: [
          'Rende a taxa Selic do dia. Como a Selic não cai do nada, o preço é estável e você pode sacar a qualquer momento sem perda.',
        ],
        bullets: [
          'Ideal pra: reserva de emergência e dinheiro de curto prazo.',
          'Rendimento: ~100% do CDI.',
          'Liquidez: D+1.',
        ],
      },
      {
        heading: 'Tesouro IPCA+',
        paragraphs: [
          'Te paga a inflação (IPCA) + uma taxa fixa (ex: IPCA + 6%). Garante que seu poder de compra cresce, independente do que acontecer com a inflação.',
        ],
        bullets: [
          'Ideal pra: longo prazo, aposentadoria, objetivos de 5+ anos.',
          'Rendimento: IPCA + taxa contratada.',
          'Liquidez: tem, mas se vender antes do vencimento pode dar prejuízo (preço varia).',
        ],
        warning: 'Se vender Tesouro IPCA+ antes do vencimento e os juros tiverem subido, você toma prejuízo. Compre só se puder levar até o final.',
      },
      {
        heading: 'Tesouro Prefixado',
        paragraphs: [
          'Você trava uma taxa fixa no momento da compra (ex: 11% ao ano). Independente do que acontecer com a Selic, vai receber isso.',
        ],
        bullets: [
          'Ideal pra: quem acredita que os juros vão CAIR (trava na taxa alta antes).',
          'Rendimento: a taxa contratada.',
          'Liquidez: similar ao IPCA+, prejuízo se vender antes em cenário de alta de juros.',
        ],
      },
      {
        heading: 'Custos reais',
        paragraphs: [
          'Tesouro Direto NÃO é "100% de graça". Tem custos que reduzem seu rendimento.',
        ],
        bullets: [
          'Taxa da B3: 0,2% ao ano (sobre o valor investido).',
          'IR regressivo: começa em 22,5% e cai até 15% após 2 anos.',
          'Sem taxa de corretagem na maioria das corretoras.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Você quer guardar dinheiro pra usar daqui a 6 meses. Qual Tesouro escolher?',
        options: [
          { text: 'Tesouro Selic', correct: true, explanation: 'Liquidez diária e zero risco de prejuízo na venda antecipada.' },
          { text: 'Tesouro IPCA+', correct: false, explanation: 'Vender em 6 meses pode dar prejuízo se os juros subirem. Use só pra longo prazo.' },
          { text: 'Tesouro Prefixado', correct: false, explanation: 'Mesma armadilha do IPCA+. Curto prazo = Selic.' },
        ],
      },
      {
        question: 'O que o Tesouro IPCA+ 2035 te garante?',
        options: [
          { text: 'Apenas a taxa fixa contratada', correct: false, explanation: 'Não. Ele paga IPCA + taxa fixa.' },
          { text: 'Inflação + uma taxa fixa contratada', correct: true, explanation: 'Exato. Por isso protege o poder de compra independente do que a inflação fizer.' },
          { text: 'Sempre 100% do CDI', correct: false, explanation: 'Isso é Tesouro Selic, não IPCA+.' },
        ],
      },
      {
        question: 'Qual o IR mínimo que você pode pagar em Tesouro Direto?',
        options: [
          { text: '22,5% sempre', correct: false, explanation: 'Essa é a alíquota máxima, pra resgates em menos de 6 meses.' },
          { text: '15% após 2 anos de aplicação', correct: true, explanation: 'IR regressivo: começa em 22,5% e cai até 15% após 2 anos.' },
          { text: '0% — Tesouro é isento', correct: false, explanation: 'Não. LCI e LCA são isentas. Tesouro tem IR.' },
        ],
      },
    ],
  },
  {
    id: 'cdb-lci-lca',
    trail: 'rendaFixa',
    emoji: '🏦',
    title: 'CDB, LCI e LCA: as opções dos bancos',
    summary: 'Como escolher entre títulos privados e o que é FGC.',
    readMinutes: 6,
    sections: [
      {
        heading: 'O que é CDB',
        paragraphs: [
          'CDB = Certificado de Depósito Bancário. Você empresta dinheiro pro banco e recebe juros. O banco usa esse dinheiro pra emprestar a outros clientes.',
          'Geralmente cotado em % do CDI. Ex: "120% do CDI" = rende 1,2x o CDI.',
        ],
      },
      {
        heading: 'LCI e LCA: o pulo do gato',
        paragraphs: [
          'LCI (Letra de Crédito Imobiliário) e LCA (Letra de Crédito do Agronegócio) são parecidas com CDB, mas com uma diferença enorme: SÃO ISENTAS DE IMPOSTO DE RENDA.',
          'Por isso, uma LCI a 90% do CDI pode render mais que um CDB a 100% do CDI, dependendo do prazo.',
        ],
        example: {
          title: 'Comparação líquida (12 meses)',
          text: 'CDB 100% CDI: rende 100% do CDI - 17,5% de IR = 82,5% do CDI líquido. LCI 90% CDI: rende 90% líquido (sem IR). LCI ganha.',
        },
      },
      {
        heading: 'FGC: o seu seguro',
        paragraphs: [
          'CDBs, LCIs e LCAs são garantidos pelo FGC (Fundo Garantidor de Créditos) até R$ 250.000 por CPF por instituição. Se o banco quebrar, você recebe de volta até esse limite.',
          'Por isso, dividir entre 2-3 bancos diferentes te dá segurança total mesmo em valores maiores.',
        ],
        warning: 'O FGC tem limite global de R$ 1 milhão a cada 4 anos por CPF. Pra patrimônio muito alto, considere também Tesouro Direto.',
      },
    ],
  },

  // ============ RENDA VARIÁVEL ============
  {
    id: 'como-comprar-acoes',
    trail: 'rendaVariavel',
    emoji: '📈',
    title: 'Como funcionam as ações',
    summary: 'Lote, ticker, mercado fracionário e o que muda entre ON e PN.',
    readMinutes: 7,
    sections: [
      {
        heading: 'O que você está comprando',
        paragraphs: [
          'Quando você compra uma ação, vira sócio da empresa. Se ela tem 1 bilhão de ações e você tem 100, você é dono de 0,00001% dela.',
          'Como sócio, você tem dois caminhos de ganho: o preço da ação subir (valorização) e a empresa distribuir parte do lucro (dividendos).',
        ],
      },
      {
        heading: 'Ticker: o código de cada ação',
        paragraphs: [
          'Toda ação tem um código de 4 letras + 1 número. As letras identificam a empresa, o número diz o tipo.',
        ],
        bullets: [
          'Final 3 (ex: VALE3) = ON (Ordinária) — dá direito a voto em assembleia.',
          'Final 4 (ex: PETR4) = PN (Preferencial) — sem voto, mas prioridade em dividendos.',
          'Final 11 (ex: BBAS11) = unit, ETF, FII ou BDR.',
        ],
      },
      {
        heading: 'Lote padrão vs fracionário',
        paragraphs: [
          'Historicamente, ações eram negociadas em lotes de 100. Hoje o "fracionário" permite comprar de 1 em 1.',
        ],
        bullets: [
          'PETR4 no lote padrão = comprar de 100 em 100.',
          'PETR4F no fracionário = comprar 1, 2, 7, qualquer quantidade.',
          'No fracionário, o preço pode ser ligeiramente diferente (spread um pouco maior).',
        ],
      },
      {
        heading: 'Horários da B3',
        paragraphs: [
          'A bolsa brasileira tem horários específicos. Fora disso, ordens entram mas só executam quando abrir.',
        ],
        bullets: [
          'Pré-abertura: 9h45 - 10h.',
          'Negociação: 10h - 16h55.',
          'Call de fechamento: 16h55 - 17h.',
          'After-market: 17h30 - 18h (limitado).',
        ],
      },
    ],
  },
  {
    id: 'indicadores-fundamentalistas',
    trail: 'rendaVariavel',
    emoji: '🔬',
    title: 'P/L, DY, ROE: lendo uma empresa',
    summary: 'Os 4 indicadores que você precisa olhar antes de comprar uma ação.',
    readMinutes: 8,
    sections: [
      {
        heading: 'P/L — Preço sobre Lucro',
        paragraphs: [
          'Mostra quantos anos a empresa precisa pra gerar, em lucro, o equivalente ao seu próprio valor de mercado.',
        ],
        example: {
          title: 'Padaria do bairro',
          text: 'Padaria custa R$ 500.000 e dá R$ 100.000 de lucro por ano. P/L = 5. Em 5 anos o lucro paga o preço.',
        },
        bullets: [
          'P/L baixo (< 10): empresa pode estar barata, OU em setor problemático.',
          'P/L médio (10-20): comum em empresas estáveis.',
          'P/L alto (> 25): empresa em forte crescimento, OU sobrevalorizada.',
        ],
        warning: 'P/L baixo nem sempre é barganha. Pode ser empresa com lucro decadente. Sempre compare com o setor.',
      },
      {
        heading: 'DY — Dividend Yield',
        paragraphs: [
          'Quanto a empresa pagou em dividendos no último ano, em % do preço atual da ação. É o "aluguel" que a ação te paga.',
        ],
        example: {
          title: 'Cálculo simples',
          text: 'Ação custa R$ 50, pagou R$ 4 em dividendos no ano. DY = 4 / 50 = 8%.',
        },
        bullets: [
          'DY alto (> 8%): boa pra renda passiva, mas verifique se é sustentável.',
          'DY muito alto (> 15%): suspeite. Pode ser que o preço caiu muito por algum problema.',
          'DY baixo ou zero: empresa reinveste o lucro em crescimento (ex: empresas de tecnologia).',
        ],
      },
      {
        heading: 'ROE — Retorno sobre Patrimônio',
        paragraphs: [
          'Mostra o quanto a empresa gera de lucro em cima do dinheiro dos sócios. É a "eficiência" da empresa.',
        ],
        bullets: [
          'ROE > 15%: empresa eficiente, gera bom retorno.',
          'ROE > 20% consistente: excelente.',
          'ROE negativo: empresa dando prejuízo.',
        ],
      },
      {
        heading: 'Dívida / EBITDA',
        paragraphs: [
          'Quantos anos a empresa demoraria pra pagar toda a dívida usando o lucro operacional.',
        ],
        bullets: [
          'Abaixo de 1: empresa pouco endividada.',
          'De 1 a 3: endividamento saudável.',
          'Acima de 4: risco. Empresa pode ter dificuldade em crise.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Uma empresa tem DY de 18%. O que pensar primeiro?',
        options: [
          { text: 'Comprar logo, é uma máquina de dividendos!', correct: false, explanation: 'DY altíssimo é frequentemente sinal de que o preço caiu por algum problema sério. Investigue antes.' },
          { text: 'Investigar por que o DY está tão alto', correct: true, explanation: 'Exato. Pode ser dividendo não recorrente, problema no setor, ou queda forte do preço. Análise sempre.' },
          { text: 'Significa que vai dar 18% de retorno garantido', correct: false, explanation: 'DY é histórico, não promessa. A empresa pode reduzir ou parar de pagar dividendos.' },
        ],
      },
      {
        question: 'P/L de 5 significa o quê?',
        options: [
          { text: 'A empresa lucra R$ 5 a cada R$ 1 investido', correct: false, explanation: 'É o inverso. P/L é PREÇO sobre LUCRO.' },
          { text: 'Em 5 anos o lucro paga o preço da ação', correct: true, explanation: 'Exato. Você está pagando 5 vezes o lucro anual da empresa.' },
          { text: 'A ação vale 5% do valor real', correct: false, explanation: 'Não tem essa relação. P/L é múltiplo de lucro.' },
        ],
      },
      {
        question: 'ROE de 25% é:',
        options: [
          { text: 'Ruim — empresa pouco eficiente', correct: false, explanation: 'Pelo contrário, 25% é excelente.' },
          { text: 'Excelente — empresa muito rentável', correct: true, explanation: 'ROE acima de 20% indica empresa altamente eficiente em gerar lucro com o patrimônio.' },
          { text: 'Indica que vai pagar 25% de dividendos', correct: false, explanation: 'ROE é eficiência, não distribuição. São métricas diferentes.' },
        ],
      },
    ],
  },
  {
    id: 'tributacao-acoes',
    trail: 'rendaVariavel',
    emoji: '💸',
    title: 'Imposto de Renda em ações',
    summary: 'Quando você paga IR, quanto, e a regra dos R$ 20 mil.',
    readMinutes: 5,
    sections: [
      {
        heading: 'Regra geral',
        paragraphs: [
          'Vendeu ação com lucro? Pode ter que pagar IR. Mas só "ter que pagar" depende de duas coisas: quanto vendeu no mês e qual o tipo de operação.',
        ],
      },
      {
        heading: 'A regra dos R$ 20.000',
        paragraphs: [
          'Se você vendeu ATÉ R$ 20.000 em ações no mês (somando todas as vendas) e teve lucro, esse lucro é ISENTO de IR.',
          'Atenção: é o total vendido, não o lucro. Se vendeu R$ 25 mil de uma ação só, mesmo com R$ 100 de lucro, o lucro inteiro é tributado.',
        ],
        warning: 'Isenção só vale pra ações comuns. NÃO vale pra day-trade, ETFs, FIIs e BDRs.',
      },
      {
        heading: 'Alíquotas',
        paragraphs: [
          'Quando você precisa pagar, as alíquotas são:',
        ],
        bullets: [
          'Operação normal (swing trade): 15% sobre o lucro.',
          'Day-trade: 20% sobre o lucro, sem isenção dos R$ 20 mil.',
          'FIIs: 20% sobre o lucro na venda (mas os rendimentos mensais são isentos).',
        ],
      },
      {
        heading: 'Como pagar',
        paragraphs: [
          'O IR sobre ações NÃO é descontado pela corretora. Você mesmo apura e paga via DARF até o último dia útil do mês seguinte.',
          'Existem apps que calculam pra você. A mais conhecida é a calculadora da B3 (gratuita).',
        ],
      },
    ],
  },

  // ============ FIIs ============
  {
    id: 'o-que-sao-fiis',
    trail: 'fiis',
    emoji: '🏢',
    title: 'O que são FIIs',
    summary: 'Receba aluguel todo mês sem ter que comprar imóvel, sem inquilino, sem dor de cabeça.',
    readMinutes: 6,
    sections: [
      {
        paragraphs: [
          'FII = Fundo de Investimento Imobiliário. Imagine que você e mil pessoas se juntam pra comprar um shopping de R$ 500 milhões. Cada pessoa entra com um pedaço, vira "cotista", e recebe parte do aluguel dos lojistas.',
          'É exatamente isso. Mas em vez de você juntar amigos, o fundo já existe — você só compra cotas dele na bolsa, como se fosse uma ação.',
        ],
      },
      {
        heading: 'Vantagens',
        bullets: [
          'Rendimento MENSAL isento de Imposto de Renda.',
          'Liquidez: vende a cota na bolsa em segundos.',
          'Diversificação: 1 fundo pode ter dezenas de imóveis.',
          'Acessibilidade: entra com R$ 100 (1 cota), não R$ 500 mil.',
          'Sem dor de cabeça de inquilino, manutenção, IPTU.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Os 3 tipos principais',
        paragraphs: [
          'Não existe "FII genérico". Cada um investe em coisas diferentes.',
        ],
        bullets: [
          'Tijolo: dono de imóveis físicos (shoppings, galpões, lajes corporativas, hospitais).',
          'Papel: investe em títulos de dívida imobiliária (CRIs, LCIs). Rendimentos atrelados a CDI ou IPCA.',
          'Híbridos: misturam tijolo e papel.',
          'Fundo de Fundos (FoF): investem em outros FIIs.',
        ],
      },
    ],
  },
  {
    id: 'como-escolher-fii',
    trail: 'fiis',
    emoji: '🎯',
    title: 'Como escolher um bom FII',
    summary: 'Os indicadores específicos de FII e as armadilhas mais comuns.',
    readMinutes: 8,
    sections: [
      {
        heading: 'P/VP — Preço sobre Valor Patrimonial',
        paragraphs: [
          'Mostra se o FII está caro ou barato em relação ao valor dos imóveis que ele possui.',
        ],
        bullets: [
          'P/VP < 1: cotas estão mais baratas que o valor dos imóveis (possível desconto).',
          'P/VP = 1: preço justo.',
          'P/VP > 1: cotas mais caras que o patrimônio (mercado pagando premium pela gestão).',
        ],
      },
      {
        heading: 'DY — Dividend Yield',
        paragraphs: [
          'No FII, é mais relevante que em ações, porque o fundo é OBRIGADO a distribuir 95% do lucro semestral.',
        ],
        example: {
          title: 'Exemplo prático',
          text: 'Cota custa R$ 100. Pagou R$ 0,80 por mês = R$ 9,60 no ano. DY = 9,60 / 100 = 9,6% ao ano. E ISENTO de IR.',
        },
      },
      {
        heading: 'Vacância',
        paragraphs: [
          'É o % dos imóveis que estão SEM inquilino. Quanto maior, menor o rendimento.',
        ],
        bullets: [
          'Vacância 0%: ideal — tudo alugado.',
          'Vacância < 10%: saudável.',
          'Vacância > 20%: bandeira amarela. Pode reduzir distribuição.',
        ],
      },
      {
        heading: 'Diversificação dos inquilinos',
        paragraphs: [
          'Um fundo de 1 galpão com 1 inquilino é arriscado: se ele sair, o fundo fica sem renda. Prefira fundos com vários imóveis e vários inquilinos.',
        ],
        warning: 'Cuidado com fundo "mono-ativo" (1 imóvel). Pesquise a saúde do inquilino e o contrato (longo ou curto).',
      },
      {
        heading: 'Liquidez',
        paragraphs: [
          'Quanto é negociado por dia. Pra valores pequenos qualquer FII serve. Pra patrimônio maior, prefira fundos que negociam acima de R$ 1 milhão por dia.',
        ],
      },
    ],
  },

  // ============ ESTRATÉGIA ============
  {
    id: 'diversificacao',
    trail: 'estrategia',
    emoji: '🌍',
    title: 'Diversificação na prática',
    summary: 'Quantos ativos ter, em quais setores, e por que não basta "muitas ações".',
    readMinutes: 7,
    sections: [
      {
        heading: 'O conceito básico',
        paragraphs: [
          'Diversificar é distribuir o dinheiro em ativos que se comportam de forma DIFERENTE. Quando um vai mal, o outro pode ir bem — e o conjunto fica mais estável.',
          'Comprar 20 ações de bancos NÃO é diversificar de verdade. Se o setor bancário sofrer, todas caem juntas.',
        ],
      },
      {
        heading: 'Os níveis de diversificação',
        bullets: [
          'Por classe: renda fixa + ações + FIIs + internacional.',
          'Por setor: bancos + energia + varejo + tecnologia + saúde.',
          'Por geografia: Brasil + EUA + emergentes.',
          'Por moeda: real + dólar.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Quantos ativos ter?',
        paragraphs: [
          'Estudos clássicos mostram que diversificação tem retorno DECRESCENTE: passar de 1 pra 10 ativos reduz muito o risco; passar de 30 pra 100 reduz quase nada.',
        ],
        bullets: [
          'Iniciante: 5 a 10 ativos.',
          'Intermediário: 10 a 20.',
          'Avançado: 15 a 30 (ou ETFs amplos pra cobrir centenas de uma vez).',
        ],
        warning: 'Ter ativos demais vira "di-pioração". Você não consegue acompanhar todos e a carteira começa a se parecer com um ETF, mas com mais custos.',
      },
    ],
  },
  {
    id: 'aporte-mensal',
    trail: 'estrategia',
    emoji: '🔁',
    title: 'A força do aporte mensal',
    summary: 'Por que aportar todo mês bate quase sempre quem tenta acertar o "momento certo".',
    readMinutes: 6,
    sections: [
      {
        heading: 'Dollar Cost Averaging',
        paragraphs: [
          'É o nome bonito pra "investir um valor fixo todo mês, faça chuva ou faça sol". A ideia é que com o tempo, você compra mais cotas quando o preço cai e menos quando o preço sobe — equilibrando o preço médio.',
        ],
        example: {
          title: '12 meses aportando R$ 500 em uma ação volátil',
          text: 'Em meses de preço R$ 10 você compra 50 cotas. Em meses de R$ 5, compra 100. Seu preço médio fica naturalmente menor que se tivesse comprado tudo no topo.',
        },
      },
      {
        heading: 'Por que funciona',
        paragraphs: [
          'Ninguém — nenhum profissional, nenhum analista — consegue prever o curto prazo do mercado de forma consistente. Quem tenta acertar o "fundo" ou o "topo" geralmente erra e perde oportunidades.',
          'O aporte mensal te tira dessa armadilha. Você simplesmente investe, sempre, no piloto automático. Constância > timing.',
        ],
      },
      {
        heading: 'A regra dos 10% mínimos',
        paragraphs: [
          'Uma meta razoável é investir pelo menos 10% da sua renda líquida todo mês. Se conseguir 20-30%, melhor. Se só conseguir 5%, ainda vale — o hábito é mais importante que o valor.',
        ],
      },
    ],
  },
  {
    id: 'rebalanceamento',
    trail: 'estrategia',
    emoji: '⚖️',
    title: 'Quando e como rebalancear',
    summary: 'Como manter a estratégia no rumo sem reagir a cada notícia.',
    readMinutes: 6,
    sections: [
      {
        paragraphs: [
          'Você definiu: 50% renda fixa, 40% ações, 10% FIIs. Seis meses depois, ações subiram muito e agora são 55% da carteira. A carteira está mais arriscada do que você planejou. É hora de rebalancear.',
        ],
      },
      {
        heading: 'Duas formas de rebalancear',
        bullets: [
          'Por aporte: novos aportes vão pra classe sub-alocada até voltar ao alvo. NÃO vende nada. Mais eficiente em impostos.',
          'Por venda: vende o que subiu demais e compra o que ficou pra trás. Tem custo de IR mas é mais rápido.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Periodicidade',
        paragraphs: [
          'Não precisa fazer toda semana. Quanto mais mexe, mais erro emocional entra.',
        ],
        bullets: [
          'Semestral ou anual: o ideal pra maioria.',
          'Quando uma classe se desviar mais que 5-10% do alvo.',
          'Depois de grandes eventos (crise, alta forte).',
        ],
        warning: 'Rebalancear NÃO é "vender porque caiu". É voltar à alocação planejada. Se o plano original já considerou volatilidade, mantenha a disciplina.',
      },
    ],
  },
];

// ============ NOVAS AULAS (segundo lote) ============
LESSONS.push(
  {
    id: 'inflacao-real',
    trail: 'iniciante',
    emoji: '🔥',
    title: 'A inflação no seu bolso',
    summary: 'Por que IPCA, IGPM e sua inflação pessoal são coisas diferentes.',
    readMinutes: 5,
    sections: [
      {
        paragraphs: [
          'IPCA é o índice oficial. Mede preços de uma cesta padrão da população. Mas a SUA inflação pode ser bem diferente.',
          'Se você gasta muito em saúde, ela sobe mais que IPCA (saúde sempre sobe acima da média). Se gasta em tecnologia, sua inflação pode ser menor.',
        ],
        example: { title: 'Exemplo real', text: 'IPCA 2024 ficou em ~4.5%. Mas convênio médico subiu 12%, escola 8%, gasolina 6%. Sua inflação pessoal pode ser 8-10% facilmente.' },
      },
      {
        heading: 'Como se proteger',
        bullets: [
          'Tesouro IPCA+ paga "IPCA + taxa fixa". Garante render acima da inflação oficial.',
          'Ações de empresas com poder de precificação (Ambev, Itaú, Vale) tendem a repassar inflação.',
          'FIIs de tijolo geralmente reajustam aluguel pela inflação.',
        ],
        paragraphs: [],
      },
    ],
    quiz: [
      {
        question: 'IPCA mede:',
        options: [
          { text: 'A sua inflação pessoal exata', correct: false, explanation: 'É uma média ponderada de uma cesta padrão. Sua inflação pessoal pode ser diferente.' },
          { text: 'A inflação oficial baseada em uma cesta média', correct: true, explanation: 'Exato. É o índice oficial divulgado pelo IBGE.' },
          { text: 'O aumento dos juros da Selic', correct: false, explanation: 'Selic é taxa de juros, não inflação.' },
        ],
      },
      {
        question: 'Qual investimento melhor protege da inflação?',
        options: [
          { text: 'Poupança', correct: false, explanation: 'Poupança costuma render abaixo da inflação na maior parte do tempo.' },
          { text: 'Tesouro IPCA+', correct: true, explanation: 'Garante IPCA + taxa fixa, sempre acima da inflação oficial.' },
          { text: 'Dólar em espécie no cofre', correct: false, explanation: 'Dólar oscila, e em casa não rende. Não protege automaticamente.' },
        ],
      },
      {
        question: 'Sua inflação pessoal é maior se você gasta mais em:',
        options: [
          { text: 'Tecnologia (eletrônicos baratos)', correct: false, explanation: 'Tecnologia tende a baratear com o tempo.' },
          { text: 'Saúde e educação', correct: true, explanation: 'Esses setores sobem sistematicamente acima da inflação média.' },
          { text: 'Tudo igual', correct: false, explanation: 'Não. Cada categoria tem dinâmica diferente.' },
        ],
      },
    ],
  },
  {
    id: 'liquidez-explicada',
    trail: 'iniciante',
    emoji: '💧',
    title: 'O que é liquidez (e por que importa)',
    summary: 'Liquidez = facilidade de virar dinheiro. Define quando você pode usar cada investimento.',
    readMinutes: 4,
    sections: [
      {
        paragraphs: [
          'Liquidez é o quão rápido (e sem perda) você consegue transformar um investimento em dinheiro na conta.',
          'Tesouro Selic = D+1 (cai no dia seguinte). Imóvel físico = meses pra vender. Bitcoin = instantâneo. Ação = D+2.',
        ],
      },
      {
        heading: 'Liquidez vs prazo',
        bullets: [
          'Curto prazo (até 1 ano): use só investimentos de alta liquidez (Selic, CDB liquidez diária).',
          'Médio prazo (1-5 anos): pode incluir CDBs com prazo, IPCA+ com vencimento.',
          'Longo prazo (5+ anos): pode usar ações, FIIs, IPCA+ longo.',
        ],
        paragraphs: [],
        warning: 'Nunca coloque dinheiro de emergência em algo de baixa liquidez. Quando precisar, pode estar caindo.',
      },
    ],
    quiz: [
      {
        question: 'Qual investimento tem MAIOR liquidez?',
        options: [
          { text: 'Imóvel pra alugar', correct: false, explanation: 'Imóvel demora meses pra vender.' },
          { text: 'Tesouro Selic', correct: true, explanation: 'Liquidez D+1 — resgate fica disponível no dia útil seguinte.' },
          { text: 'CDB de 5 anos sem liquidez', correct: false, explanation: 'Liquidez só no vencimento.' },
        ],
      },
      {
        question: 'Pra reserva de emergência, qual atributo é MAIS importante?',
        options: [
          { text: 'Maior rentabilidade possível', correct: false, explanation: 'Não. Em emergência, você precisa sacar QUANDO precisar, não no melhor momento.' },
          { text: 'Alta liquidez e segurança', correct: true, explanation: 'Sempre. Reserva de emergência precisa estar disponível agora, sem risco.' },
          { text: 'Pagamento de dividendos', correct: false, explanation: 'Não é o foco. Reserva é segurança, não renda.' },
        ],
      },
      {
        question: 'Bitcoin tem alta liquidez. Isso significa que é seguro?',
        options: [
          { text: 'Sim, é seguro porque é líquido', correct: false, explanation: 'Liquidez e segurança são coisas diferentes. Bitcoin tem alta liquidez mas alta volatilidade.' },
          { text: 'Não — liquidez e segurança são independentes', correct: true, explanation: 'Exato. Bitcoin pode cair 20% em um dia, mas você consegue vender rápido.' },
          { text: 'Sempre é seguro, mas só pra investidores grandes', correct: false, explanation: 'Tamanho do investidor não muda volatilidade do ativo.' },
        ],
      },
    ],
  },
  {
    id: 'fgc-protecao',
    trail: 'rendaFixa',
    emoji: '🛡️',
    title: 'FGC: seu seguro contra quebra de banco',
    summary: 'Garantia de R$ 250 mil por CPF por instituição. Como aproveitar inteligente.',
    readMinutes: 5,
    sections: [
      {
        paragraphs: [
          'FGC = Fundo Garantidor de Créditos. Se o banco quebra e você tem CDB/LCI/LCA lá, o FGC te devolve até R$ 250.000 (por CPF, por instituição).',
        ],
      },
      {
        heading: 'Como maximizar a proteção',
        bullets: [
          'Limite por banco: R$ 250 mil. Pra mais que isso, divida entre instituições.',
          'Limite global: R$ 1 milhão a cada 4 anos. Acima disso, considere Tesouro Direto (garantido pelo governo).',
          'Vale pra CDB, LCI, LCA, LC, RDB e poupança. NÃO vale pra fundos, ações ou debêntures.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Bancos pequenos pagam mais',
        paragraphs: [
          'Por isso bancos pequenos pagam taxas maiores: precisam atrair clientes. Com o FGC, esse risco extra é coberto até R$ 250 mil. Estratégia clássica.',
        ],
        example: { title: 'Exemplo', text: 'Banco grande paga CDB 95% CDI. Banco médio paga 115% CDI. Se você tem R$ 200k, vale a pena ir no banco médio com a proteção do FGC.' },
      },
    ],
    quiz: [
      {
        question: 'Você tem R$ 400 mil em CDB de um banco que quebrou. O FGC cobre:',
        options: [
          { text: 'Tudo, sem limite', correct: false, explanation: 'O limite é R$ 250 mil por CPF por instituição.' },
          { text: 'Apenas R$ 250 mil', correct: true, explanation: 'Você perde os R$ 150 mil acima do limite. Por isso divida entre bancos.' },
          { text: 'Nada — CDB não tem garantia', correct: false, explanation: 'CDB TEM garantia do FGC. Por isso é popular.' },
        ],
      },
      {
        question: 'Qual investimento NÃO é coberto pelo FGC?',
        options: [
          { text: 'LCI', correct: false, explanation: 'LCI é coberta.' },
          { text: 'CDB', correct: false, explanation: 'CDB é coberto.' },
          { text: 'Ações de bancos', correct: true, explanation: 'Ações são renda variável e não têm garantia do FGC.' },
        ],
      },
      {
        question: 'Pra patrimônios acima de R$ 1 milhão, o que considerar?',
        options: [
          { text: 'Tesouro Direto (garantido pelo governo)', correct: true, explanation: 'O Tesouro é a garantia mais forte do país, sem limite efetivo.' },
          { text: 'Concentrar tudo num único banco grande', correct: false, explanation: 'Mesmo banco grande tem limite de R$ 250k pra FGC.' },
          { text: 'Cripto sempre', correct: false, explanation: 'Cripto não tem garantia e é altíssimo risco.' },
        ],
      },
    ],
  },
  {
    id: 'previdencia-privada',
    trail: 'rendaFixa',
    emoji: '👴',
    title: 'Previdência privada: PGBL vs VGBL',
    summary: 'Quando faz sentido contratar previdência e como escolher entre as duas modalidades.',
    readMinutes: 7,
    sections: [
      {
        paragraphs: [
          'PGBL: dedutível do IR (até 12% da renda bruta). Tributação na hora de sacar incide sobre o TOTAL (aportes + rendimento).',
          'VGBL: sem dedução. Tributação só sobre o RENDIMENTO na hora do saque. Pra quem usa declaração simplificada de IR.',
        ],
      },
      {
        heading: 'Regimes de tributação',
        bullets: [
          'Progressivo: igual ao IR normal (de 0% a 27.5%). Bom pra quem vai sacar pouco por mês.',
          'Regressivo: começa em 35% e cai pra 10% após 10 anos. Bom pra longo prazo.',
        ],
        paragraphs: [],
        warning: 'Cuidado com taxas. Muitas previdências de banco têm taxas absurdas (2-3% ao ano), que destroem o rendimento.',
      },
      {
        heading: 'Quando vale a pena',
        bullets: [
          'Você faz declaração completa de IR e quer deduzir aportes (PGBL).',
          'Quer benefícios sucessórios — previdência não entra no inventário, transmite direto pros beneficiários.',
          'Quer disciplina forçada — desconto automático mensal.',
        ],
        paragraphs: [],
      },
    ],
    quiz: [
      {
        question: 'PGBL é vantajoso pra quem:',
        options: [
          { text: 'Usa declaração simplificada de IR', correct: false, explanation: 'Pra simplificada, o VGBL é melhor — sem dedução, mas tributação só no rendimento.' },
          { text: 'Faz declaração completa e quer deduzir', correct: true, explanation: 'Exato. PGBL deduz até 12% da renda bruta na declaração.' },
          { text: 'Não declara IR', correct: false, explanation: 'Sem declaração, não tem como deduzir.' },
        ],
      },
      {
        question: 'No regime regressivo, após 10 anos a alíquota fica:',
        options: [
          { text: '0%', correct: false, explanation: 'Não chega a zero. O mínimo é 10%.' },
          { text: '10%', correct: true, explanation: 'Exato. Por isso a previdência regressiva é boa pra LONGO prazo.' },
          { text: '15%', correct: false, explanation: 'Não. O mínimo é 10% após 10 anos.' },
        ],
      },
      {
        question: 'Cuidado principal ao contratar previdência:',
        options: [
          { text: 'Verificar a taxa de administração', correct: true, explanation: 'Taxas altas (2%+) destroem o rendimento ao longo de décadas.' },
          { text: 'Procurar a maior rentabilidade prometida', correct: false, explanation: 'Promessa não é realidade. Foque em custos baixos e fundos de qualidade.' },
          { text: 'Contratar logo, sem comparar', correct: false, explanation: 'Sempre compare. Bancos cobram taxas absurdas que corretoras não cobram.' },
        ],
      },
    ],
  },
  {
    id: 'analise-grafica',
    trail: 'rendaVariavel',
    emoji: '📉',
    title: 'Análise gráfica vs fundamentalista',
    summary: 'As duas escolas de análise — quando usar cada uma.',
    readMinutes: 6,
    sections: [
      {
        heading: 'Análise fundamentalista (o que você é dono)',
        paragraphs: [
          'Olha o "interior" da empresa: lucro, dívida, crescimento, vantagens competitivas. Tenta achar o valor real.',
          'Foco em LONGO prazo. Buffett, Lynch, Graham — todos fundamentalistas.',
        ],
      },
      {
        heading: 'Análise gráfica/técnica (o que o mercado faz)',
        paragraphs: [
          'Olha gráficos de preço pra prever movimentos. Suportes, resistências, tendências.',
          'Foco em CURTO prazo, especulação.',
        ],
        warning: 'Análise técnica funciona menos do que se vende. Estudos mostram que ela não bate o mercado consistentemente no longo prazo.',
      },
      {
        heading: 'Pra começar',
        paragraphs: [
          'Pra investidor iniciante e médio prazo, foque em FUNDAMENTOS. Empresa boa, comprada num preço razoável, segurada por anos = receita comprovada.',
          'Análise gráfica pode complementar pra decidir o "quando" comprar — mas não substitui análise da empresa.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Análise fundamentalista foca em:',
        options: [
          { text: 'Padrões de preço no gráfico', correct: false, explanation: 'Isso é análise técnica/gráfica.' },
          { text: 'Lucro, dívida, qualidade da empresa', correct: true, explanation: 'Exato. Fundamentos = "interior" da empresa.' },
          { text: 'Notícias do dia', correct: false, explanation: 'Notícias importam, mas o foco é o fundamento de longo prazo.' },
        ],
      },
      {
        question: 'Pra investidor de LONGO prazo, o que importa mais?',
        options: [
          { text: 'Acertar timing de entrada via gráfico', correct: false, explanation: 'Timing perfeito é quase impossível e importa pouco no longo prazo.' },
          { text: 'Qualidade da empresa e preço razoável', correct: true, explanation: 'No longo prazo, a empresa boa carrega o resultado, não o ponto de entrada.' },
          { text: 'Seguir dicas de YouTuber', correct: false, explanation: 'Cuidado com dicas — muitas vezes têm conflito de interesse.' },
        ],
      },
      {
        question: 'O que estudos acadêmicos dizem sobre análise técnica?',
        options: [
          { text: 'Bate o mercado consistentemente', correct: false, explanation: 'Pelo contrário, estudos não comprovam vantagem consistente.' },
          { text: 'Não bate o mercado no longo prazo de forma consistente', correct: true, explanation: 'Exato. Por isso a maioria dos grandes investidores são fundamentalistas.' },
          { text: 'É infalível se feita corretamente', correct: false, explanation: 'Nenhuma análise é infalível.' },
        ],
      },
    ],
  },
  {
    id: 'dividendos-vs-crescimento',
    trail: 'rendaVariavel',
    emoji: '⚖️',
    title: 'Dividendos vs Crescimento',
    summary: 'Empresas pagadoras vs empresas em crescimento — qual escolher.',
    readMinutes: 6,
    sections: [
      {
        paragraphs: [
          'Empresas maduras distribuem lucro como dividendo (Itaúsa, BBSE3, energia). Empresas em crescimento reinvestem (WEG, Magalu nas alta).',
        ],
      },
      {
        heading: 'Dividendos: pros e contras',
        bullets: [
          '✅ Renda passiva mensal/trimestral, isenta de IR em FII.',
          '✅ Disciplina — empresa madura, gestão menos arriscada.',
          '❌ Crescimento limitado — empresa não está reinvestindo no negócio.',
          '❌ No Brasil, dividendos são isentos. Em ações há tributação proposta em discussão.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Crescimento: pros e contras',
        bullets: [
          '✅ Potencial de multiplicação maior (WEG saiu de R$ 5 pra R$ 50 em 10 anos).',
          '✅ Reinveste lucros — capitaliza pra você.',
          '❌ Sem dividendo mensal — só ganha quando vende.',
          '❌ Mais volatilidade, depende da execução.',
        ],
        paragraphs: [],
      },
      {
        heading: 'A síntese: divida sua carteira',
        paragraphs: [
          'Boa carteira tem AS DUAS. Dividendos pra renda + crescimento pra patrimônio. Proporção depende do perfil — mais crescimento pra jovem, mais dividendos pra próximo da aposentadoria.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Empresas em forte crescimento tendem a:',
        options: [
          { text: 'Pagar dividendos altos', correct: false, explanation: 'Pelo contrário — preferem reinvestir tudo no negócio.' },
          { text: 'Reinvestir o lucro no próprio negócio', correct: true, explanation: 'Exato. Por isso WEG paga pouco — está crescendo.' },
          { text: 'Distribuir 100% do lucro', correct: false, explanation: 'Só empresas maduras fazem isso.' },
        ],
      },
      {
        question: 'Pra quem quer renda passiva mensal, o que olhar?',
        options: [
          { text: 'Ações de crescimento como Magalu', correct: false, explanation: 'Crescimento não gera renda mensal — gera lucro na venda futura.' },
          { text: 'FIIs e ações pagadoras de dividendos', correct: true, explanation: 'FIIs pagam mensal isento de IR. Ações dividend payer também trazem renda recorrente.' },
          { text: 'Tesouro Prefixado', correct: false, explanation: 'Tesouro Prefixado paga só no vencimento, não mensalmente.' },
        ],
      },
      {
        question: 'Investidor jovem (25 anos) deveria focar mais em:',
        options: [
          { text: 'Só dividendos pra ter renda agora', correct: false, explanation: 'Jovem tem TEMPO. Crescimento é melhor uso desse tempo.' },
          { text: 'Crescimento, complementando com dividendos', correct: true, explanation: 'Exato. Tempo permite capturar grandes valorizações + reinvestir tudo.' },
          { text: 'Só renda fixa', correct: false, explanation: 'Renda fixa rende pouco no longo prazo. Jovem aguenta volatilidade.' },
        ],
      },
    ],
  },
  {
    id: 'fii-papel-vs-tijolo',
    trail: 'fiis',
    emoji: '🧱',
    title: 'FII de papel vs tijolo — qual escolher',
    summary: 'Como balancear os dois tipos na sua carteira.',
    readMinutes: 6,
    sections: [
      {
        heading: 'FII de papel',
        paragraphs: [
          'Investe em CRIs e LCIs — títulos de dívida imobiliária. Recebe juros desses títulos como rendimento.',
        ],
        bullets: [
          'Menor volatilidade — preço se move com taxa de juros.',
          'Rendimento mais previsível (atrelado a CDI ou IPCA).',
          'Não tem "vacância" (não tem imóvel físico).',
          'Exemplos: MXRF11, KNCR11, KNIP11, IRDM11.',
        ],
      },
      {
        heading: 'FII de tijolo',
        paragraphs: [
          'Dono de imóveis físicos: galpões, shoppings, lajes corporativas. Recebe aluguel.',
        ],
        bullets: [
          'Maior volatilidade — preço varia com mercado imobiliário.',
          'Pode ter vacância (imóvel sem inquilino = sem aluguel).',
          'Cresce com valorização do imóvel + reajuste de aluguel pela inflação.',
          'Exemplos: HGLG11, KNRI11, BTLG11, XPML11.',
        ],
      },
      {
        heading: 'Estratégia equilibrada',
        paragraphs: [
          'Carteira de FII saudável tem AS DUAS. Papel pra estabilidade + tijolo pra crescimento de longo prazo.',
        ],
        example: { title: 'Sugestão clássica', text: '50% papel + 40% tijolo + 10% FoF (fundo de fundos pra diversificação extra).' },
      },
    ],
    quiz: [
      {
        question: 'FII de papel investe em:',
        options: [
          { text: 'Imóveis físicos', correct: false, explanation: 'Isso é FII de tijolo.' },
          { text: 'CRIs e LCIs (títulos de dívida imobiliária)', correct: true, explanation: 'Exato. Recebe juros dessas dívidas.' },
          { text: 'Ações de construtoras', correct: false, explanation: 'Ações de construtoras são outra coisa, não FII.' },
        ],
      },
      {
        question: 'Qual FII tem MAIOR volatilidade?',
        options: [
          { text: 'FII de papel (CRIs)', correct: false, explanation: 'Papel é mais estável, varia menos.' },
          { text: 'FII de tijolo (imóveis)', correct: true, explanation: 'Tijolo varia mais — depende do mercado imobiliário e vacância.' },
          { text: 'São iguais', correct: false, explanation: 'Não. Tijolo é mais volátil.' },
        ],
      },
      {
        question: 'FII de tijolo tem risco de vacância. O que é?',
        options: [
          { text: 'Imóveis sem inquilino, sem gerar aluguel', correct: true, explanation: 'Exato. Vacância de 20% = 20% dos imóveis vazios = renda menor.' },
          { text: 'Demora pra vender o FII', correct: false, explanation: 'Isso é liquidez, não vacância.' },
          { text: 'Quando o preço da cota cai', correct: false, explanation: 'Isso é volatilidade. Vacância é específico de tijolo.' },
        ],
      },
    ],
  },
  {
    id: 'fii-tributacao',
    trail: 'fiis',
    emoji: '📋',
    title: 'Tributação em FIIs',
    summary: 'Rendimento isento, ganho de capital tributado. Como funciona.',
    readMinutes: 5,
    sections: [
      {
        paragraphs: [
          'A grande vantagem dos FIIs: o RENDIMENTO mensal distribuído é ISENTO de Imposto de Renda pra pessoa física.',
        ],
      },
      {
        heading: 'Requisitos da isenção',
        bullets: [
          'O FII precisa ter pelo menos 50 cotistas.',
          'Você precisa ter menos de 10% das cotas do fundo.',
          'O FII deve ser listado em bolsa.',
          '99% dos FIIs negociados na B3 atendem todos esses requisitos.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Ganho de capital na venda',
        paragraphs: [
          'Quando você VENDE cotas com lucro, paga 20% de IR sobre o ganho.',
        ],
        warning: 'Diferente de ações, NÃO existe isenção de R$ 20 mil pra venda de FII. Qualquer lucro na venda é tributado em 20%.',
      },
      {
        heading: 'Apuração e pagamento',
        paragraphs: [
          'Vendeu com lucro? Apura, gera o DARF, paga até o último dia útil do mês seguinte. Pode compensar prejuízos de meses anteriores com lucros do mês atual.',
        ],
      },
    ],
    quiz: [
      {
        question: 'O rendimento mensal de FII é:',
        options: [
          { text: 'Tributado em 15%', correct: false, explanation: 'É ISENTO de IR pra pessoa física.' },
          { text: 'Isento de Imposto de Renda', correct: true, explanation: 'Exato. Por isso FIIs são populares — renda mensal limpa.' },
          { text: 'Tributado em 20%', correct: false, explanation: '20% é a alíquota da venda com lucro, não do rendimento mensal.' },
        ],
      },
      {
        question: 'Vendeu uma cota de FII com lucro. Paga:',
        options: [
          { text: 'Nada — venda é isenta', correct: false, explanation: 'Não. Venda com lucro é tributada em 20%.' },
          { text: '20% sobre o lucro', correct: true, explanation: 'Exato. E não tem isenção dos R$ 20 mil que existe em ações.' },
          { text: '15% sobre o lucro', correct: false, explanation: 'Isso é em ações comuns. FII é 20%.' },
        ],
      },
      {
        question: 'FII com poucos cotistas pode perder isenção?',
        options: [
          { text: 'Sim — precisa ter pelo menos 50 cotistas', correct: true, explanation: 'Exato. É um dos requisitos pra manter a isenção.' },
          { text: 'Não — isenção é sempre garantida', correct: false, explanation: 'Existem requisitos. Felizmente quase todos os FIIs da B3 atendem.' },
          { text: 'Só se for FII de tijolo', correct: false, explanation: 'O tipo (papel/tijolo) não afeta a isenção.' },
        ],
      },
    ],
  },
  {
    id: 'fofo-vs-fii',
    trail: 'fiis',
    emoji: '🎁',
    title: 'Fundo de Fundos (FoF) de FIIs',
    summary: 'FII que investe em outros FIIs — diversificação automática.',
    readMinutes: 5,
    sections: [
      {
        paragraphs: [
          'Um FoF (Fundo de Fundos) é um FII cuja carteira é composta por OUTROS FIIs. Você compra 1 cota e indiretamente vira "sócio" de dezenas de fundos.',
        ],
        example: { title: 'BCFF11 (BTG)', text: 'Tem 30+ FIIs diferentes na carteira. Você diversifica em 1 movimento.' },
      },
      {
        heading: 'Vantagens',
        bullets: [
          'Diversificação extrema com pouco dinheiro.',
          'Gestão profissional escolhe os FIIs.',
          'Bom pra começar — não precisa estudar cada FII.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Desvantagens',
        bullets: [
          'Taxa dupla (do FoF + dos FIIs subjacentes).',
          'Pode comprar FIIs "ok" pra evitar concentração.',
          'Rentabilidade tende a ser mais média.',
        ],
        paragraphs: [],
        warning: 'À medida que sua carteira de FII cresce, vale a pena escolher fundos individuais. FoFs são ótimos pra começar, mas perdem vantagem em carteiras maiores.',
      },
    ],
    quiz: [
      {
        question: 'FoF de FII é um fundo que:',
        options: [
          { text: 'Investe só em imóveis físicos', correct: false, explanation: 'Isso é FII de tijolo.' },
          { text: 'Investe em outros FIIs', correct: true, explanation: 'Exato. Diversificação automática.' },
          { text: 'Não paga rendimentos', correct: false, explanation: 'Paga sim, isento de IR também.' },
        ],
      },
      {
        question: 'Principal vantagem do FoF:',
        options: [
          { text: 'Diversificação fácil em 1 movimento', correct: true, explanation: 'Compra 1 cota e tem exposição a 30+ FIIs.' },
          { text: 'Taxa zero', correct: false, explanation: 'Tem taxas — inclusive sobrepostas (do FoF + dos FIIs subjacentes).' },
          { text: 'Garantia de retorno alto', correct: false, explanation: 'Nenhum FII garante retorno.' },
        ],
      },
      {
        question: 'Quando o FoF começa a perder vantagem?',
        options: [
          { text: 'Sempre — nunca vale a pena', correct: false, explanation: 'Vale a pena pra começar.' },
          { text: 'Em carteiras grandes, onde dá pra escolher individuais', correct: true, explanation: 'Exato. Em carteira pequena diversifica. Em grande, taxa dupla pesa.' },
          { text: 'Apenas em fim de ano', correct: false, explanation: 'Não tem essa sazonalidade.' },
        ],
      },
    ],
  },
  {
    id: 'rebalanceamento-prática',
    trail: 'estrategia',
    emoji: '🎚️',
    title: 'Rebalanceamento na prática',
    summary: 'Quando ajustar a carteira e como fazer sem pagar muito IR.',
    readMinutes: 7,
    sections: [
      {
        paragraphs: [
          'Você definiu 50% RF / 40% RV / 10% Internacional. 6 meses depois, RV subiu muito e virou 55% da carteira. Hora de rebalancear.',
        ],
      },
      {
        heading: 'Duas formas de rebalancear',
        bullets: [
          '1) Por aporte (preferida): novos aportes vão pra classe sub-alocada até reequilibrar. Não vende nada, não paga IR.',
          '2) Por venda: vende o que subiu demais e compra o que ficou pra trás. Reequilibra rápido mas paga IR.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Periodicidade',
        bullets: [
          'Anual ou semestral pra maioria.',
          'Quando alguma classe se desviar mais que 5-10% do alvo.',
          'Depois de grandes eventos de mercado (crises, altas fortes).',
        ],
        paragraphs: [],
        warning: 'Rebalancear NÃO é vender por medo. É manter a disciplina da estratégia original.',
      },
    ],
    quiz: [
      {
        question: 'Forma mais eficiente em impostos pra rebalancear:',
        options: [
          { text: 'Vender o que subiu e comprar o que caiu', correct: false, explanation: 'Eficaz mas paga IR. Há jeito melhor.' },
          { text: 'Direcionar novos aportes pra classe sub-alocada', correct: true, explanation: 'Não vende nada, não paga IR. Mais eficiente fiscalmente.' },
          { text: 'Nunca rebalancear', correct: false, explanation: 'Sem rebalanceamento, a carteira sai do perfil.' },
        ],
      },
      {
        question: 'Periodicidade ideal pra rebalanceamento da maioria:',
        options: [
          { text: 'Diária', correct: false, explanation: 'Diário gera ansiedade e custos. Não funciona.' },
          { text: 'Anual ou semestral', correct: true, explanation: 'O ideal pra maioria. Disciplina sem excesso de mexida.' },
          { text: 'Só quando perder dinheiro', correct: false, explanation: 'Rebalanceamento é estratégia, não reação ao prejuízo.' },
        ],
      },
      {
        question: 'Rebalancear faz sentido porque:',
        options: [
          { text: 'Você sempre vende ganhando', correct: false, explanation: 'Não é o objetivo.' },
          { text: 'Mantém a carteira alinhada com seu perfil de risco', correct: true, explanation: 'Exato. Sem isso, a carteira deriva pra um perfil diferente do seu.' },
          { text: 'Garante retorno maior', correct: false, explanation: 'Não garante retorno, mas controla o risco.' },
        ],
      },
    ],
  },
  {
    id: 'erros-comuns',
    trail: 'estrategia',
    emoji: '🚫',
    title: 'Os 10 erros mais comuns de investidor',
    summary: 'Os tropeços que custam dinheiro — e como evitar todos.',
    readMinutes: 8,
    sections: [
      {
        heading: 'Os erros mais caros',
        bullets: [
          '1. Vender no pânico — quedas são parte do jogo.',
          '2. Comprar na euforia — quando todo mundo fala, geralmente já está caro.',
          '3. Não ter reserva de emergência — força venda em mau momento.',
          '4. Concentrar tudo num ativo — 1 quebra leva tudo junto.',
          '5. Tentar day-trade sem preparo — 95% perdem dinheiro.',
          '6. Seguir dicas de YouTuber sem pensar — pode ter conflito de interesse.',
          '7. Pular reserva pra "ganhar mais rápido" — receita pra desastre.',
          '8. Não diversificar entre classes — perde proteção em crises.',
          '9. Não acompanhar — investe e esquece de revisar.',
          '10. Pular renda fixa achando que é "perda de tempo" — sem ela, qualquer queda vira pânico.',
        ],
        paragraphs: [],
      },
      {
        heading: 'O antídoto',
        paragraphs: [
          'Estratégia simples, escrita, com regras claras. Aporte mensal, automatizado se possível. Rebalanceamento periódico. Mínimo de mexida emocional.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Qual é o erro MAIS caro?',
        options: [
          { text: 'Vender no pânico das quedas', correct: true, explanation: 'O erro #1. Materializa perdas que poderiam ser temporárias.' },
          { text: 'Manter dinheiro parado', correct: false, explanation: 'É ruim, mas vender no pânico é pior — você perde DE VERDADE.' },
          { text: 'Investir só em renda fixa', correct: false, explanation: 'Conservador demais talvez, mas não é o erro mais caro.' },
        ],
      },
      {
        question: 'Estatísticas mostram que dos day-traders:',
        options: [
          { text: '50% ganham dinheiro', correct: false, explanation: 'A realidade é bem pior.' },
          { text: 'Cerca de 95% perdem dinheiro', correct: true, explanation: 'Estudos da CVM mostram que a grande maioria perde.' },
          { text: 'Todos ganham se estudarem', correct: false, explanation: 'Estudo ajuda, mas o mercado é hostil pra day-trade amador.' },
        ],
      },
      {
        question: 'O que separa investidor de sucesso?',
        options: [
          { text: 'Acertar o "momento certo"', correct: false, explanation: 'Quase ninguém acerta consistentemente.' },
          { text: 'Disciplina, estratégia escrita e consistência', correct: true, explanation: 'Exato. Mediocre que persiste bate gênio que abandona.' },
          { text: 'Sorte', correct: false, explanation: 'Sorte ajuda no curto, mas no longo prazo perde pra disciplina.' },
        ],
      },
    ],
  },
  {
    id: 'metas-financeiras',
    trail: 'estrategia',
    emoji: '🎯',
    title: 'Como definir metas financeiras',
    summary: 'Sem metas, dinheiro vira commodity. Como fazer metas que funcionam.',
    readMinutes: 6,
    sections: [
      {
        paragraphs: [
          'Investir "pra ficar rico" não funciona. Precisa de metas específicas, com prazo e valor.',
        ],
      },
      {
        heading: 'Estrutura SMART',
        bullets: [
          'Specific (específica): "comprar casa de R$ 400 mil em 2030", não "ter mais dinheiro".',
          'Measurable (mensurável): números claros.',
          'Achievable (atingível): proporcional à sua renda.',
          'Relevant (relevante): conectada com sua vida.',
          'Time-bound (com prazo): data definida.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Categorize por prazo',
        bullets: [
          'Curto (até 2 anos): viagem, troca de carro, reserva. Use renda fixa de liquidez.',
          'Médio (2-5 anos): entrada de imóvel, MBA. CDB + IPCA+ médio.',
          'Longo (5+ anos): aposentadoria, casa própria. Aceita renda variável.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Aporte alvo',
        paragraphs: [
          'Calcule: quanto preciso por mês pra chegar lá considerando o rendimento esperado? Use uma calculadora de juros compostos.',
        ],
        example: { title: 'Exemplo', text: 'Quero R$ 1M em 30 anos a 10% ao ano. Preciso aportar ~R$ 442/mês. Possível? Sim.' },
      },
    ],
    quiz: [
      {
        question: 'Meta SMART precisa ser:',
        options: [
          { text: 'Geral, tipo "ficar rico"', correct: false, explanation: 'Sem especificidade não funciona.' },
          { text: 'Específica, mensurável e com prazo', correct: true, explanation: 'Exato. SMART = Specific, Measurable, Achievable, Relevant, Time-bound.' },
          { text: 'Inatingível pra forçar esforço', correct: false, explanation: 'Não. Tem que ser desafiadora MAS atingível.' },
        ],
      },
      {
        question: 'Pra meta de 1 ano, qual investimento usar?',
        options: [
          { text: 'Ações brasileiras', correct: false, explanation: 'Ações podem cair quando você precisar. Curto prazo = renda fixa segura.' },
          { text: 'Renda fixa com liquidez (Selic, CDB liquidez)', correct: true, explanation: 'Exato. Liquidez e segurança em primeiro lugar.' },
          { text: 'Bitcoin', correct: false, explanation: 'Volatilidade altíssima. Pode estar caindo quando você precisar.' },
        ],
      },
      {
        question: 'Pra aposentadoria daqui a 30 anos, pode usar:',
        options: [
          { text: 'Renda variável com boa proporção', correct: true, explanation: 'Tempo permite. Ações historicamente rendem mais no longuíssimo prazo.' },
          { text: 'Apenas Tesouro Selic', correct: false, explanation: 'Conservador demais — você perderá retorno significativo em 30 anos.' },
          { text: 'Conta poupança', correct: false, explanation: 'Pior alternativa. Poupança não acompanha inflação no longo prazo.' },
        ],
      },
    ],
  },
  {
    id: 'bdrs-internacional',
    trail: 'rendaVariavel',
    emoji: '🌎',
    title: 'BDRs: ações estrangeiras na B3',
    summary: 'Como investir em Apple, Microsoft e Tesla sem abrir conta nos EUA.',
    readMinutes: 6,
    sections: [
      {
        paragraphs: [
          'BDR = Brazilian Depositary Receipt. É um "recibo" emitido aqui que representa uma ação ou cesta de ações estrangeiras.',
          'Você compra na B3, em reais, sem precisar de conta no exterior. Cada BDR equivale a uma fração ou múltiplo da ação original.',
        ],
        example: { title: 'AAPL34', text: 'BDR da Apple. Cada cota representa 1/12 de uma ação real da Apple. Você compra na B3 normalmente.' },
      },
      {
        heading: 'Vantagens',
        bullets: [
          'Acesso a empresas globais sem trâmites internacionais.',
          'Em reais, sem necessidade de remessa de dinheiro.',
          'Negociado na B3, regulamentado pela CVM.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Desvantagens',
        bullets: [
          'Dividendos sofrem retenção nos EUA (30% padrão).',
          'Spread maior — preço pode descolar da ação original.',
          'Nem toda corretora oferece (Nubank ainda não).',
        ],
        paragraphs: [],
        warning: 'BDRs não têm direito a voto em assembleias da empresa. É apenas direito econômico.',
      },
    ],
    quiz: [
      {
        question: 'BDR é:',
        options: [
          { text: 'Uma ação brasileira fora do índice', correct: false, explanation: 'Não. BDR representa ações estrangeiras.' },
          { text: 'Recibo de ações estrangeiras negociado na B3', correct: true, explanation: 'Exato. Permite comprar Apple, Microsoft, etc. em reais.' },
          { text: 'Título de dívida pública', correct: false, explanation: 'Isso é Tesouro. BDR é renda variável.' },
        ],
      },
      {
        question: 'Vantagem de comprar BDR vs ação americana direta:',
        options: [
          { text: 'Não precisa de conta no exterior', correct: true, explanation: 'Compra na B3 em reais, sem trâmites internacionais.' },
          { text: 'Tem direito a voto na assembleia', correct: false, explanation: 'BDR NÃO dá direito a voto.' },
          { text: 'Tem isenção de IR sempre', correct: false, explanation: 'Não. Dividendos sofrem retenção e venda com lucro é tributada.' },
        ],
      },
      {
        question: 'Qual corretora NÃO oferece BDRs?',
        options: [
          { text: 'Nubank', correct: true, explanation: 'Correto. Nubank ainda não oferece BDRs.' },
          { text: 'XP', correct: false, explanation: 'XP tem BDRs.' },
          { text: 'BTG Pactual', correct: false, explanation: 'BTG também oferece.' },
        ],
      },
    ],
  },
  {
    id: 'cripto-iniciante',
    trail: 'estrategia',
    emoji: '₿',
    title: 'Cripto: vale a pena? Como começar com cuidado',
    summary: 'Visão honesta sobre criptomoedas — o que evitar e como (se quiser) entrar.',
    readMinutes: 7,
    sections: [
      {
        paragraphs: [
          'Cripto é altíssima volatilidade. Pode multiplicar por 10 ou cair 80% num ano. Não é "investimento" no sentido tradicional — é mais especulação tecnológica.',
        ],
      },
      {
        heading: 'O que evitar',
        bullets: [
          '❌ Colocar dinheiro de reserva ou de prazo curto.',
          '❌ "Investir" em altcoins desconhecidas que você viu em grupo de WhatsApp.',
          '❌ Usar alavancagem (você pode perder MAIS do que colocou).',
          '❌ Cair em "fazendas de rendimento" obscuras prometendo 50% ao mês.',
        ],
        paragraphs: [],
        warning: 'Se sua tia te ofereceu uma cripto nova, corra. Maioria absoluta dessas é golpe.',
      },
      {
        heading: 'Se você quer entrar',
        bullets: [
          '✅ Foque em Bitcoin (BTC) e Ethereum (ETH) — as mais consolidadas.',
          '✅ Não passa de 5-10% do patrimônio total.',
          '✅ Use ETF brasileiro (BITH11 pra Bitcoin) ou corretora cripto confiável (Mercado Bitcoin, Binance).',
          '✅ Acumule por meses, não compre tudo de uma vez.',
        ],
        paragraphs: [],
      },
      {
        heading: 'Tributação',
        paragraphs: [
          'Vendas até R$ 35.000 por mês são isentas. Acima disso, 15% de IR sobre o lucro. Diferente de ações que tem isenção de R$ 20k — em cripto é R$ 35k.',
        ],
      },
    ],
    quiz: [
      {
        question: 'Qual percentual MÁXIMO do patrimônio em cripto pra iniciante?',
        options: [
          { text: '50%', correct: false, explanation: 'Demais. Volatilidade é altíssima.' },
          { text: '5-10%', correct: true, explanation: 'Razoável. Pequena exposição pra aprender, sem destruir patrimônio em queda.' },
          { text: '100% — vai dar 100x', correct: false, explanation: 'Receita de catástrofe.' },
        ],
      },
      {
        question: 'Isenção de IR pra cripto é até:',
        options: [
          { text: 'R$ 20.000 por mês', correct: false, explanation: 'Isso é em ações comuns. Em cripto é diferente.' },
          { text: 'R$ 35.000 por mês', correct: true, explanation: 'Exato. Até R$ 35k vendidos no mês, lucro é isento.' },
          { text: 'Sempre tributado', correct: false, explanation: 'Existe isenção pra vendas pequenas.' },
        ],
      },
      {
        question: 'Sinal de golpe em cripto:',
        options: [
          { text: 'Promessa de rendimento garantido alto', correct: true, explanation: 'Qualquer coisa "garantida" em cripto é golpe.' },
          { text: 'ETF de Bitcoin negociado em bolsa', correct: false, explanation: 'ETF regulado é seguro.' },
          { text: 'Corretora regulada como Mercado Bitcoin', correct: false, explanation: 'Corretora regulada é OK.' },
        ],
      },
    ],
  },
);

export const WEEKLY_TIPS = [
  { emoji: '💡', text: 'Investir todo mês, mesmo pouco, vence quase sempre quem espera "o momento certo".' },
  { emoji: '🌳', text: 'Diversificar é como não plantar tudo na mesma horta. Se uma seca, as outras te seguram.' },
  { emoji: '⏳', text: 'Tempo no mercado bate tentar acertar o tempo do mercado.' },
  { emoji: '📉', text: 'Quedas fazem parte. Se você não vendeu, você não perdeu — apenas viu o preço temporariamente diferente.' },
  { emoji: '🧮', text: 'Reinvestir dividendos é o segredo dos juros compostos. Cada R$ 1 reinvestido vira muito mais com o tempo.' },
  { emoji: '🎯', text: 'Antes de comprar qualquer ativo, pergunte: qual problema esse investimento resolve pra mim?' },
  { emoji: '📚', text: 'A melhor pesquisa antes de comprar uma ação: ler o release de resultados da empresa (está no site dela, gratuito).' },
  { emoji: '🛡️', text: 'Reserva de emergência primeiro, sempre. Sem ela, qualquer susto te força a vender no pior momento.' },
  { emoji: '👀', text: 'Cuidado com promessas de "100% ao mês". Renda fixa decente rende ~1% ao mês. Acima disso, desconfie.' },
  { emoji: '🧠', text: 'A maior parte do seu retorno virá de DECISÕES SIMPLES feitas de forma consistente, não de estratégias complexas.' },
];

export function getTipOfWeek(): { emoji: string; text: string } {
  const week = Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 7));
  return WEEKLY_TIPS[week % WEEKLY_TIPS.length];
}
