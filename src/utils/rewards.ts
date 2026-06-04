export type Reward = {
  badge: string;
  title: string;
  message: string;
  curiosity: string;
  phrase: string;          // frase motivacional curta no rodapé
  rewardLabel: string;     // nome do "selo" conquistado
};

export function rewardForGoal(value: number): Reward {
  if (value >= 1_000_000) {
    return {
      badge: '👑',
      title: 'Você é milionário',
      rewardLabel: 'Selo Coroa de Ouro',
      message: 'Bem-vindo ao clube dos 7 dígitos. Menos de 1% da população brasileira chega aqui. Você é a exceção.',
      curiosity: 'Rendendo só 0,5% ao mês, R$ 1 milhão gera R$ 5.000 todo mês sem você fazer nada.',
      phrase: '"Quem chega ao primeiro milhão chega ao décimo." — Warren Buffett',
    };
  }
  if (value >= 500_000) {
    return {
      badge: '💎',
      title: 'Meio milhão!',
      rewardLabel: 'Selo Diamante',
      message: 'Você está em uma faixa que poucos atingem. Patrimônio nesse nível abre portas: imóveis, negócios, oportunidades exclusivas.',
      curiosity: 'A 10% ao ano, em 7 anos esse patrimônio dobra. Você está a uma geração de R$ 1M.',
      phrase: '"O sucesso é a soma de pequenos esforços repetidos todos os dias." — Robert Collier',
    };
  }
  if (value >= 250_000) {
    return {
      badge: '🏆',
      title: 'Quarto de milhão',
      rewardLabel: 'Selo Troféu',
      message: 'R$ 250 mil. Aqui você já tem reserva real, capacidade de investir em ativos maiores e proteção contra imprevistos sérios.',
      curiosity: 'Esse valor cobre o FGC inteiro de uma instituição financeira. Você está protegido até aqui.',
      phrase: '"Disciplina é a ponte entre objetivos e conquistas." — Jim Rohn',
    };
  }
  if (value >= 100_000) {
    return {
      badge: '🥇',
      title: 'Seis dígitos',
      rewardLabel: 'Selo Ouro',
      message: 'Você bateu os R$ 100 mil. É um marco psicológico enorme — o primeiro patamar onde o dinheiro começa a "trabalhar de verdade" pra você.',
      curiosity: 'A 10% ao ano, R$ 100 mil rendem R$ 10 mil por ano. Você já gera quase um salário só com a carteira.',
      phrase: '"O primeiro 100.000 é uma droga, mas você precisa fazer isso." — Charlie Munger',
    };
  }
  if (value >= 50_000) {
    return {
      badge: '🌟',
      title: 'Cinquenta mil',
      rewardLabel: 'Selo Estrela',
      message: 'Você está na metade do caminho pros 6 dígitos. Isso prova que sua disciplina funciona — agora é manter o ritmo.',
      curiosity: 'A maioria dos brasileiros tem menos de R$ 10 mil guardados. Você está em outro patamar.',
      phrase: '"Não confunda movimento com progresso. Mas você tem AS DUAS coisas." — Denzel Washington',
    };
  }
  if (value >= 25_000) {
    return {
      badge: '🚀',
      title: 'Vinte e cinco mil',
      rewardLabel: 'Selo Foguete',
      message: 'Marco importante. Seu patrimônio já gera rendimentos visíveis a cada mês. A bola de neve começou a rolar.',
      curiosity: 'R$ 25.000 a 100% do CDI rende cerca de R$ 200 por mês sem você mexer em nada.',
      phrase: '"A bola de neve agora rola sozinha. Continue empurrando." — Princípio de Buffett',
    };
  }
  if (value >= 10_000) {
    return {
      badge: '🎯',
      title: 'Dez mil',
      rewardLabel: 'Selo Alvo',
      message: 'Cinco dígitos! Você passou de "guardando" pra "investindo de verdade". Daqui pra frente os juros compostos começam a aparecer.',
      curiosity: 'Investindo só R$ 300 por mês a 10% ao ano, você dobra esse valor em 3 anos.',
      phrase: '"Os juros compostos são a oitava maravilha do mundo." — Albert Einstein',
    };
  }
  if (value >= 5_000) {
    return {
      badge: '⭐',
      title: 'Cinco mil',
      rewardLabel: 'Selo Estrela Bronze',
      message: 'Você acumulou o equivalente a um carro popular. É reserva de emergência pra muita gente. Bom trabalho.',
      curiosity: 'Em renda fixa, R$ 5 mil já garante diversificação em 2-3 títulos diferentes.',
      phrase: '"Pequenas coisas, feitas com consistência, geram grandes resultados." — James Clear',
    };
  }
  if (value >= 2_500) {
    return {
      badge: '💪',
      title: 'Dois mil e meio',
      rewardLabel: 'Selo Força',
      message: 'Você está formando o alicerce. Esse valor já dá pra começar a diversificar entre renda fixa e variável.',
      curiosity: 'R$ 2.500 dá pra comprar 25 cotas de um FII de R$ 100. Já começa o aluguel mensal.',
      phrase: '"Quem é constante derrota quem é talentoso." — provérbio',
    };
  }
  if (value >= 1_000) {
    return {
      badge: '🌱',
      title: 'Primeiro milhar',
      rewardLabel: 'Selo Broto',
      message: 'Mil reais! Pequeno em valor, gigante em hábito. Quem chega aqui geralmente chega ao primeiro milhão.',
      curiosity: 'A diferença entre quem tem R$ 1 mil e quem tem R$ 0 é maior que a diferença entre R$ 100 mil e R$ 1 milhão — é o hábito.',
      phrase: '"A jornada de mil milhas começa com um único passo." — Lao Tzu',
    };
  }
  if (value >= 500) {
    return {
      badge: '✨',
      title: 'Primeiros R$ 500',
      rewardLabel: 'Selo Faísca',
      message: 'O começo de tudo. Esse R$ 500 vai significar muito mais daqui a 10 anos do que parece hoje.',
      curiosity: 'R$ 500 investidos por 30 anos a 10% ao ano viram R$ 8.700. Os juros compostos são generosos com paciência.',
      phrase: '"O melhor momento pra plantar uma árvore foi 20 anos atrás. O segundo melhor é agora."',
    };
  }
  return {
    badge: '🌟',
    title: `Meta de R$ ${value} batida`,
    rewardLabel: 'Selo Conquista',
    message: 'Mais um passo na sua jornada.',
    curiosity: 'Constância é o segredo.',
    phrase: '"Aporte é hábito. Hábito é destino."',
  };
}
