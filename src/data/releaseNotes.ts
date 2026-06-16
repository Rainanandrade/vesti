// Notas de versão — exibidas como popup interativo quando há novidades.
//
// 🤖 WORKFLOW AUTOMÁTICO
// A cada novo recurso, eu (Claude) atualizo este arquivo automaticamente:
//   1. Crio uma nova entrada no topo do array RELEASE_NOTES
//   2. Bumpo CURRENT_VERSION abaixo (sempre +0.1.0 pra novidade notável)
//   3. Adiciono botão de ação (navigateTo) quando faz sentido
// O usuário não precisa editar este arquivo manualmente.

export type ReleaseHighlight = {
  emoji: string;
  title: string;
  description: string;
  action?: {
    label: string;
    navigateTo: string;
    params?: Record<string, any>;
  };
};

export type ReleaseNote = {
  version: string;
  date: string;
  title: string;
  subtitle?: string;
  highlights: ReleaseHighlight[];
};

// ATUAL versão do app — bumpa a cada release.
export const CURRENT_VERSION = '1.9.0';

// Notas em ordem cronológica DESCENDENTE (mais recente primeiro)
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.9.0',
    date: '2026-06-04',
    title: 'Operações, Isentômetro e mais',
    subtitle: 'Inspirado em apps líderes, mas com a cara do Vesti',
    highlights: [
      {
        emoji: '📒',
        title: 'Registro de operações (ledger)',
        description:
          'Nova tela "Operações" pra registrar suas compras e vendas com data e tipo. Filtra por mês, mostra resumo e detalhe operação a operação.',
        action: { label: 'Abrir operações', navigateTo: 'Operacoes' },
      },
      {
        emoji: '🛡️',
        title: 'Isentômetro visual',
        description:
          'Barra de progresso de R$ 0 a R$ 20k mostra quanto você vendeu de ações no mês. Verde se isento, vermelho se ultrapassar. Aparece na calculadora IR e na tela de operações.',
      },
      {
        emoji: '🧮',
        title: 'IR baseado nas suas operações',
        description:
          'A calculadora agora usa as suas vendas registradas pra calcular o isentômetro automaticamente. Sem precisar lembrar quanto vendeu.',
      },
      {
        emoji: '📊',
        title: 'Resumo do mês por categoria',
        description:
          'Veja num só relance quanto vendeu em swing-trade, day-trade e FII/ETF. FII e ETF aparecem marcados como "isento de IR" automaticamente.',
      },
    ],
  },
  {
    version: '1.8.0',
    date: '2026-06-04',
    title: 'IR sobre dividendos & inputs inteligentes',
    subtitle: 'Mais clareza no IR + formatação automática + análises em tudo',
    highlights: [
      {
        emoji: '💸',
        title: 'IR sobre dividendos e JCP',
        description:
          'Calculadora IR agora tem aba "Dividendos / JCP": mostra que dividendos são isentos, JCP tem 15% retido na fonte, e explica como declarar no IRPF anual.',
        action: { label: 'Abrir calculadora', navigateTo: 'IRCalculator' },
      },
      {
        emoji: '📋',
        title: 'Indicador "Precisa emitir DARF?"',
        description:
          'Cada resultado agora mostra claramente SIM ou NÃO (em verde/laranja). Sem dúvida sobre se você precisa pagar guia ou não.',
      },
      {
        emoji: '🔢',
        title: 'Formatação automática de valores',
        description:
          'Em todos os campos de moeda: digite "12345" e vira "123,45" automaticamente. Com pontos de milhar (R$ 12.345,67) sem você fazer nada.',
      },
      {
        emoji: '📈',
        title: 'Análise em TODOS os ativos',
        description:
          'Antes: só ações da nossa lista curada tinham análise/gráfico. Agora: qualquer ativo da sua carteira (ação/FII/ETF) tem fit score, indicadores e gráfico — mesmo se for um ticker pouco comum.',
      },
    ],
  },
  {
    version: '1.7.0',
    date: '2026-06-04',
    title: 'Sua carteira mais detalhada',
    subtitle: 'Análise completa por ativo + correções importantes',
    highlights: [
      {
        emoji: '🔍',
        title: 'Análise exclusiva ao clicar no ativo',
        description:
          'Toca em qualquer ativo da sua carteira e vê: cotação ao vivo, sua posição com lucro/prejuízo, gráfico histórico, próximo dividendo, análise fundamentalista (P/L, DY, ROE) e fit score com seu perfil.',
      },
      {
        emoji: '📈',
        title: 'Gráficos consertados',
        description:
          'Histórico de preços agora usa brapi.dev como fonte primária com 3 fallbacks. Ibovespa e ativos voltaram a aparecer com 1M/6M/1A/5A.',
      },
      {
        emoji: '🎯',
        title: 'Gráfico no preço-alvo',
        description:
          'Quando você define alvo na Watchlist, agora vê o gráfico do ativo ao lado pra decidir um valor que faça sentido.',
      },
      {
        emoji: '🧮',
        title: 'Dividendos calculados certo',
        description:
          'Reescrevi o forecast: agora cada mês tem só uma entrada por ativo (sem duplicar JCP + dividendo), projeção respeita o calendário real, e a regra dos 5 dias de posse funciona corretamente.',
      },
      {
        emoji: '⬅️',
        title: 'Botão voltar na Watchlist',
        description:
          'Adicionei botão de voltar no canto superior esquerdo da tela de acompanho. Sem precisar arrastar pra baixo.',
      },
    ],
  },
  {
    version: '1.6.0',
    date: '2026-06-04',
    title: 'Calculadoras, comparador e alertas',
    subtitle: 'Pacote grande de ferramentas práticas',
    highlights: [
      {
        emoji: '🔔',
        title: 'Alertas push da watchlist',
        description:
          'Quando você define preço-alvo num ativo da watchlist, agora recebe notificação push assim que ele bater (no celular nativo).',
        action: { label: 'Configurar alertas', navigateTo: 'Watchlist' },
      },
      {
        emoji: '⚖️',
        title: 'Comparador de ativos',
        description:
          'Compare até 3 ativos lado a lado: cotação, DY, P/L, ROE, P/VP, Margem, Beta, setor. Decida com fundamentos na mão.',
        action: { label: 'Comparar agora', navigateTo: 'Compare' },
      },
      {
        emoji: '🧮',
        title: 'Calculadora de aporte',
        description:
          'Dois modos: "Quanto aportar pra atingir minha meta?" (PMT) e "Quanto vou ter aportando X/mês?" (FV). Inclui rendimento composto.',
        action: { label: 'Abrir calculadora', navigateTo: 'AporteCalc' },
      },
      {
        emoji: '📋',
        title: 'Calculadora de IR/DARF',
        description:
          'Apure o IR sobre vendas de ações (com isenção dos R$20k), FIIs e day-trade. Mostra a alíquota, o valor a pagar e o código DARF.',
        action: { label: 'Calcular IR', navigateTo: 'IRCalculator' },
      },
      {
        emoji: '📚',
        title: 'Aulas adaptativas',
        description:
          'A aba "Aprender" agora reorganiza os trilhos por sua preferência. Foco em dividendos? FIIs aparecem primeiro. Foco em crescimento? Renda Variável no topo.',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-06-04',
    title: 'Bata o Ibovespa & saiba de tudo',
    subtitle: 'Compare sua performance com o mercado e veja novidades direto no app',
    highlights: [
      {
        emoji: '🏆',
        title: 'Comparação com Ibovespa',
        description:
          'Dashboard agora mostra sua carteira vs Ibovespa no mesmo período. Está superando o mercado? Quanto? Visualização clara com barras coloridas.',
      },
      {
        emoji: '✨',
        title: 'Popup de novidades',
        description:
          'Sempre que tiver atualização nova, você vê este popup interativo com detalhes do que mudou. Sem precisar caçar no changelog.',
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-06-04',
    title: 'Watchlist e Gráficos',
    subtitle: 'Acompanhe sem comprar + visualize a evolução de preço',
    highlights: [
      {
        emoji: '👀',
        title: 'Lista "Acompanho"',
        description:
          'Adicione ativos que você quer monitorar sem precisar comprar. Defina preço-alvo e veja quando bater (alerta visual).',
        action: { label: 'Abrir Watchlist', navigateTo: 'Watchlist' },
      },
      {
        emoji: '📈',
        title: 'Gráfico histórico de preço',
        description:
          'Quando você adiciona ou edita um ativo, vê o gráfico de 1M, 6M, 1A e 5A com linha colorida (verde se subiu, vermelho se caiu).',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-06-04',
    title: 'Aporte inteligente de verdade',
    subtitle: 'IA + heurística respeitam orçamento, perfil, foco e corretora',
    highlights: [
      {
        emoji: '💰',
        title: 'Filtro de orçamento real',
        description:
          'Aportou R$ 15? O app não sugere mais ações de R$ 300 que não cabem. Mostra MXRF11 (R$ 10) e similares. Pra corretoras com fracionário (Avenue/Nomad), mostra "Compre R$ X de AAPL".',
      },
      {
        emoji: '🏦',
        title: 'Corretora certa pra cada ativo',
        description:
          'Nunca mais "compre BDR no Nubank" (Nubank não tem BDRs). O app checa de verdade e, se nenhuma sua serve, sugere XP/BTG/Inter.',
      },
      {
        emoji: '🎯',
        title: 'Sugestões fiéis ao seu foco',
        description:
          'Foco em dividendos? Aparece ITUB4/BBSE3/HGLG11 — não mais WEGE3 (growth). Foco em crescimento? Aparece WEGE3/TOTS3 — não mais FII puro.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-06-03',
    title: 'Coach alinhado ao seu foco',
    subtitle: 'Risco + preferência tratados como dimensões independentes',
    highlights: [
      {
        emoji: '🎯',
        title: 'Pergunta de preferência no quiz',
        description:
          'Nova etapa: você pode ser arrojado E foco em dividendos ao mesmo tempo. Risco e estilo são coisas diferentes. O quiz agora trata os dois.',
      },
      {
        emoji: '🧠',
        title: 'Coach com diagnóstico específico',
        description:
          'O coach detecta "DY da carteira 2.1% — abaixo do seu foco em dividendos" ou "Muitos FIIs pro seu foco em crescimento". Sugestões diretas, não genéricas.',
      },
      {
        emoji: '🔄',
        title: 'Refazer perfil',
        description:
          'Ajustes agora tem botão pra refazer o quiz inteiro. Carteira, metas e conquistas são preservadas.',
        action: { label: 'Ir pra Ajustes', navigateTo: 'Settings' },
      },
      {
        emoji: '🏪',
        title: 'Multi-corretora',
        description:
          'Selecione todas as corretoras que você usa (Nubank + Nomad, por exemplo). Sugestões consideram o que cada uma oferece.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-06-03',
    title: 'Dividendos reais sincronizados',
    subtitle: 'Datas confirmadas pelo Status Invest',
    highlights: [
      {
        emoji: '📅',
        title: 'Próximos pagamentos confirmados',
        description:
          'Integramos com Status Invest. MXRF11 vai pagar dia 15/06 R$ 0,10/cota — é dado oficial, não chute. Aparece com selo ✓.',
      },
      {
        emoji: '💸',
        title: 'Recebido em 2026 + A receber até dez',
        description:
          'Painel mostra o que você já recebeu este ano (considera data exata + regra dos 5 dias de posse) e o que ainda vai entrar até 31/12.',
      },
      {
        emoji: '🔁',
        title: 'Botão de sincronizar',
        description:
          'Header do Dashboard ganhou botão de refresh pra atualizar cotações + dividendos quando quiser.',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-06-01',
    title: 'Bem-vindo ao Vesti',
    subtitle: 'Seu app de acompanhamento de carteira completo',
    highlights: [
      {
        emoji: '🎯',
        title: 'Perfil financeiro personalizado',
        description:
          'Quiz de 6 perguntas define seu perfil (conservador/moderado/arrojado/agressivo) e estratégia de alocação.',
      },
      {
        emoji: '💼',
        title: 'Carteira com cotações ao vivo',
        description:
          'Acompanhe ações, FIIs, ETFs, Tesouro e CDBs em tempo real direto da B3.',
      },
      {
        emoji: '🏆',
        title: 'Metas progressivas infinitas',
        description:
          'Sem limite. Bata R$ 1k, R$ 5k, R$ 10k... cada conquista vira recompensa com badge e frase motivacional.',
      },
      {
        emoji: '📚',
        title: '27 aulas + glossário',
        description:
          '5 trilhas de aprendizado com quizzes interativos. Glossário com 24 termos explicados de forma simples.',
      },
    ],
  },
];

// Decide se há versões novas vs a última vista pelo usuário
export function getUnseenNotes(lastSeenVersion: string | null): ReleaseNote[] {
  if (!lastSeenVersion) {
    // Usuário novo: mostra apenas a versão mais recente (não bombardeia)
    return [RELEASE_NOTES[0]];
  }
  return RELEASE_NOTES.filter((n) => compareVersions(n.version, lastSeenVersion) > 0);
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] || 0;
    const y = pb[i] || 0;
    if (x !== y) return x - y;
  }
  return 0;
}
