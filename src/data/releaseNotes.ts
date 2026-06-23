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
export const CURRENT_VERSION = '2.8.0';

// Notas em ordem cronológica DESCENDENTE (mais recente primeiro)
export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '2.8.0',
    date: '2026-06-17',
    title: 'Endurecimento máximo de segurança',
    subtitle: 'Headers HTTP, sanitização rigorosa, timeouts e lockout de PIN',
    highlights: [
      {
        emoji: '🛡️',
        title: 'Security headers HTTP',
        description:
          'HSTS (2 anos), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy estrita, Permissions-Policy bloqueando câmera/microfone/geolocalização e CSP completo. Bloqueia clickjacking, MIME sniffing e XSS de origem externa.',
      },
      {
        emoji: '🧹',
        title: 'Sanitização rigorosa de input',
        description:
          'Cada endpoint valida tipo, tamanho e formato dos dados recebidos. Símbolos só A-Z + dígitos (anti SSRF), body máximo 50KB, números clampeados, strings cortadas. Bloqueia injeção via campos extras.',
      },
      {
        emoji: '⏱️',
        title: 'Timeouts em todas as chamadas externas',
        description:
          'Requisições pra brapi/Yahoo/Status Invest/Groq agora têm timeout de 8s. Antes, uma fonte travada deixava o handler pendurado consumindo execução.',
      },
      {
        emoji: '🔐',
        title: 'Lockout de PIN após 5 tentativas',
        description:
          'Errou 5 vezes? PIN bloqueia por 60 segundos. Quem perdeu o celular não consegue tentar brute force.',
      },
    ],
  },
  {
    version: '2.7.0',
    date: '2026-06-17',
    title: 'Segurança reforçada',
    subtitle: 'Auth nos endpoints, rate limit, CORS travado e política atualizada',
    highlights: [
      {
        emoji: '🔒',
        title: 'JWT obrigatório nas chamadas de IA',
        description:
          'Diagnóstico e sugestão de aporte agora exigem login válido. Sem JWT, retorna 401. Impossível abusar da quota Groq.',
      },
      {
        emoji: '🚧',
        title: 'Rate limit por IP',
        description:
          'Cada endpoint tem um limite de chamadas por minuto. IA: 10/min · Cotações: 120/min · Histórico: 60/min. Bloqueia força bruta.',
      },
      {
        emoji: '🌐',
        title: 'CORS restrito',
        description:
          'Antes qualquer site podia chamar a API. Agora só vesti-nine.vercel.app + apps nativos. Sem mais consumo invisível.',
      },
      {
        emoji: '📜',
        title: 'Política de Privacidade atualizada',
        description:
          'Nova seção "Segurança técnica" lista todas as camadas: RLS, JWT, rate limit, CORS, bcrypt, SecureStore. Tudo transparente.',
      },
    ],
  },
  {
    version: '2.6.0',
    date: '2026-06-17',
    title: 'Visual repensado, IA flutuante consertada',
    subtitle: 'Hero card com gradiente, Carteira limpa e tela "Relatório pronto"',
    highlights: [
      {
        emoji: '✨',
        title: 'Hero card com gradiente',
        description:
          'Patrimônio agora aparece num card com gradiente roxo, badge de variação e sombra suave. Bem mais bonito.',
      },
      {
        emoji: '🧹',
        title: 'Carteira limpa',
        description:
          'Removidos os 7 atalhos que duplicavam o Dashboard. Carteira foca só em listar e gerir ativos. Atalhos ficam no Início.',
      },
      {
        emoji: '📄',
        title: 'Tela "Relatório pronto" estilo Grana',
        description:
          'Ao gerar o relatório de Declaração, abre uma tela full-screen com checkmarks pra cada categoria coberta (Bens, Dividendos, JCP, etc.).',
      },
      {
        emoji: '🧠',
        title: 'IA flutuante consertada',
        description:
          'Botão "IA" no canto inferior direito agora abre o Gestor IA de qualquer lugar do app. Antes ficava travado.',
      },
    ],
  },
  {
    version: '2.5.0',
    date: '2026-06-17',
    title: 'Layout repensado — nada mais escondido',
    subtitle: 'IA flutuante, grid de atalhos no Início e bug do back resolvido',
    highlights: [
      {
        emoji: '🧭',
        title: 'Atalhos visuais no Início',
        description:
          'Grid de 6 botões com ícones coloridos: Proventos, IR/DARF, Declaração, Operações, Comparar e Acompanho. Tudo a um toque sem precisar entrar na Carteira.',
      },
      {
        emoji: '🧠',
        title: 'Gestor IA flutuante',
        description:
          'Botão "IA" flutuante no canto direito de qualquer tela. Diagnóstico, perguntas e análise de ativo sempre a 1 toque.',
      },
      {
        emoji: '🔧',
        title: 'Bug do voltar corrigido',
        description:
          'Quando entravas em "Meta de Dividendos" e tentavas voltar, ficava preso. Agora a seta volta certinho pra tela anterior.',
      },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-06-17',
    title: 'Meta de renda passiva + IBOV corrigido',
    subtitle: 'Define quanto quer receber por mês e o app te guia até lá',
    highlights: [
      {
        emoji: '🎯',
        title: 'Meta de dividendos',
        description:
          'Defina quanto quer receber por mês (R$) OU qual DY mínimo ao ano você busca. O app mostra teu progresso, calcula quanto falta investir e te indica o caminho.',
        action: { label: 'Definir meta', navigateTo: 'DividendTarget' },
      },
      {
        emoji: '📊',
        title: 'IBOV funcionando de verdade',
        description:
          'A comparação com Ibovespa estava quebrada (brapi free não libera o índice). Agora usamos BOVA11 (ETF que segue o IBOV) como proxy — funciona 100% no Vercel.',
      },
      {
        emoji: '✨',
        title: 'Barra inferior mais bonita',
        description:
          'Ícones maiores, fundo destacado na aba ativa e mais sombra. Pequeno detalhe, grande diferença.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-06-16',
    title: 'Boot mais rápido + IBOV ok',
    subtitle: 'Performance, comparação com Ibovespa e mais detalhes do Grana',
    highlights: [
      {
        emoji: '⚡',
        title: 'Dashboard abre em segundos',
        description:
          'Cotações ficam guardadas no celular por 5 minutos. Quando você abre o app, a tela aparece pronta com o último valor visto e atualiza em segundo plano. Dividendos e detalhes também carregam depois do primeiro paint.',
      },
      {
        emoji: '📈',
        title: 'Ibovespa funcionando',
        description:
          'A comparação com IBOV estava quebrada (Yahoo bloqueia Vercel). Agora puxa direto da brapi.dev — mais estável e rápido.',
      },
      {
        emoji: '🔴',
        title: 'Indicador de DARF pendente',
        description:
          'Na calculadora IR, chips dos últimos 3 meses com bolinha vermelha mostram quais meses precisam de DARF (vendas > R$ 20k em ações).',
      },
      {
        emoji: '👨‍💼',
        title: 'Compartilhar com contador',
        description:
          'Botão novo na tela Conta gera um resumo formatado do ano anterior pra mandar pro contador via WhatsApp/email com 1 toque.',
      },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-06-16',
    title: 'Declaração, alerta DARF e bar chart',
    subtitle: 'Mais alguns que vi no Grana — todos com a cara do Vesti',
    highlights: [
      {
        emoji: '📑',
        title: 'Tela Declaração com Relatório Copia & Cola',
        description:
          'Gera um relatório do ano-base pronto pra colar no programa da Receita: bens e direitos com código DIRPF, dividendos isentos (09), JCP (10) e operações mês a mês.',
        action: { label: 'Abrir Declaração', navigateTo: 'Declaracao' },
      },
      {
        emoji: '⚠️',
        title: 'Alerta DARF no Dashboard',
        description:
          'Quando você vende mais de R$ 20k em ações num mês, aparece um aviso laranja no topo do Dashboard lembrando do prazo de pagamento.',
      },
      {
        emoji: '📊',
        title: 'Gráfico de proventos mês a mês',
        description:
          'Barras lado a lado mostrando o que você já recebeu (verde) vs o que ainda está a receber (verde claro) nos últimos 12 meses + próximo mês.',
      },
      {
        emoji: '🔄',
        title: 'Sugestões de conversa recarregáveis',
        description:
          'Botão "Recarregar" nas sugestões da IA pra trocar as 4 perguntas sugeridas quando nenhuma te agradar.',
      },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-06-16',
    title: 'Tela Conta reformulada',
    subtitle: 'Tudo da sua conta num só lugar, no estilo dos grandes apps',
    highlights: [
      {
        emoji: '👤',
        title: 'Editar nome direto na conta',
        description:
          'Toque em "Editar nome" no card do perfil pra renomear sua conta em segundos.',
      },
      {
        emoji: '💾',
        title: 'Exportar backup completo',
        description:
          'Botão "Exportar dados" gera um JSON com TUDO: carteiras, operações, proventos, snapshots e watchlist. No celular usa o compartilhamento nativo, no navegador baixa o arquivo.',
      },
      {
        emoji: '🧹',
        title: 'Limpar todos os dados',
        description:
          'Recomeço total com 1 toque. Apaga carteiras, operações, proventos e metas — mantém sua conta e perfil. Tem confirmação dupla pra evitar acidentes.',
      },
    ],
  },
  {
    version: '2.0.0',
    date: '2026-06-16',
    title: 'Vesti 2.0 — Gestor IA, Proventos e Evolução',
    subtitle: 'Tudo que faltava pra ser o app de carteira mais completo do BR',
    highlights: [
      {
        emoji: '🧠',
        title: 'Gestor IA com Diagnóstico',
        description:
          'Nova tela do Gestor IA com botão "Fazer diagnóstico da carteira": análise completa em segundos, pontos fortes, riscos e próximos passos. Toque num ticker pra IA analisar individualmente.',
        action: { label: 'Abrir Gestor IA', navigateTo: 'AIHub' },
      },
      {
        emoji: '💰',
        title: 'Tela de Proventos completa',
        description:
          'Histórico mês a mês de dividendos, JCP e rendimentos recebidos. Totais por ano e últimos 12 meses. Registre proventos com 1 toque pra acompanhar sua renda passiva real.',
        action: { label: 'Ver proventos', navigateTo: 'Proventos' },
      },
      {
        emoji: '📈',
        title: 'Gráfico de evolução do patrimônio',
        description:
          'Linha do tempo do seu patrimônio direto no Dashboard. Salva 1 snapshot por dia automaticamente e mostra a variação no período com gradiente verde/vermelho.',
      },
      {
        emoji: '💬',
        title: 'Sugestões de conversa rotativas',
        description:
          'Cards com perguntas prontas pra IA. Não sabe o que perguntar? Toque numa e receba uma resposta personalizada baseada na sua carteira.',
      },
      {
        emoji: '🔐',
        title: 'Esqueci minha senha',
        description:
          'Recuperação de senha por email integrada ao login. Reset seguro via link mágico do Supabase.',
      },
    ],
  },
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
