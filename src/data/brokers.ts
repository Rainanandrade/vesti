// Lista das principais corretoras e bancos de investimento do Brasil.

export type Broker = {
  id: string;
  name: string;
  category: 'banco_digital' | 'corretora' | 'banco_tradicional' | 'internacional';
  features: {
    acoes: boolean;
    fiis: boolean;
    etfs: boolean;
    tesouro: boolean;
    cdb: boolean;
    lci_lca: boolean;
    bdrs: boolean;
    fundos: boolean;
    cripto: boolean;
    internacional_direto: boolean;
  };
  note: string;
};

export const BROKERS: Broker[] = [
  // ============ BANCOS DIGITAIS ============
  {
    id: 'nubank',
    name: 'Nubank (Nu Invest)',
    category: 'banco_digital',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: false, fundos: true, cripto: true, internacional_direto: false,
    },
    note: 'Taxa zero em ações e FIIs. Não oferece BDRs. Cripto via Nubank Cripto.',
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    category: 'banco_digital',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: true,
    },
    note: 'Corretagem zero, conta completa. Tem Inter US pra investir lá fora.',
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    category: 'banco_digital',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: false, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'App moderno, banking integrado. Sem BDRs no momento.',
  },
  {
    id: 'pagbank',
    name: 'PagBank',
    category: 'banco_digital',
    features: {
      acoes: true, fiis: true, etfs: false, tesouro: true, cdb: true,
      lci_lca: false, bdrs: false, fundos: false, cripto: false, internacional_direto: false,
    },
    note: 'Foco em renda fixa simples. Limitado em ETFs e BDRs.',
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    category: 'banco_digital',
    features: {
      acoes: false, fiis: false, etfs: false, tesouro: true, cdb: true,
      lci_lca: false, bdrs: false, fundos: false, cripto: true, internacional_direto: false,
    },
    note: 'Foco em CDB próprio e Tesouro. Sem bolsa.',
  },

  // ============ CORRETORAS ESPECIALIZADAS ============
  {
    id: 'xp',
    name: 'XP Investimentos',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: true, internacional_direto: true,
    },
    note: 'Maior corretora do Brasil, plataforma completa.',
  },
  {
    id: 'rico',
    name: 'Rico Investimentos',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Do grupo XP. Taxa zero em ações, foco em iniciantes.',
  },
  {
    id: 'btg',
    name: 'BTG Pactual',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: true, internacional_direto: true,
    },
    note: 'Premium, completa, com previdência privada robusta.',
  },
  {
    id: 'clear',
    name: 'Clear (BTG)',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: false, bdrs: true, fundos: false, cripto: false, internacional_direto: false,
    },
    note: 'Foco em trader. Taxas baixas e ferramentas de análise.',
  },
  {
    id: 'modal',
    name: 'Modal (BTG)',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Forte em renda fixa privada.',
  },
  {
    id: 'toro',
    name: 'Toro Investimentos',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Plataforma educativa, boa pra iniciantes.',
  },
  {
    id: 'genial',
    name: 'Genial Investimentos',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Forte em renda fixa privada e produtos exclusivos.',
  },
  {
    id: 'agora',
    name: 'Ágora (Bradesco)',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Corretora do Bradesco. Completa.',
  },
  {
    id: 'orama',
    name: 'Órama Investimentos',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Foco em fundos de investimento.',
  },

  // ============ BANCOS TRADICIONAIS ============
  {
    id: 'itau',
    name: 'Itaú Corretora',
    category: 'banco_tradicional',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: true,
    },
    note: 'Banco tradicional, completa mas com taxas em alguns produtos.',
  },
  {
    id: 'bradesco',
    name: 'Bradesco Corretora',
    category: 'banco_tradicional',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Banco tradicional. Use a Ágora pra mais opções.',
  },
  {
    id: 'bb',
    name: 'Banco do Brasil',
    category: 'banco_tradicional',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Banco tradicional. Plataforma BB Investimentos.',
  },
  {
    id: 'santander',
    name: 'Santander',
    category: 'banco_tradicional',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Banco tradicional. Plataforma completa.',
  },
  {
    id: 'caixa',
    name: 'Caixa Econômica',
    category: 'banco_tradicional',
    features: {
      acoes: false, fiis: false, etfs: false, tesouro: true, cdb: true,
      lci_lca: true, bdrs: false, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Limitado a renda fixa e fundos. Sem renda variável direta.',
  },

  // ============ INTERNACIONAL ============
  {
    id: 'avenue',
    name: 'Avenue Securities',
    category: 'internacional',
    features: {
      acoes: false, fiis: false, etfs: false, tesouro: false, cdb: false,
      lci_lca: false, bdrs: false, fundos: false, cripto: false, internacional_direto: true,
    },
    note: 'Foco no mercado americano (ações + ETFs US). Sem ativos BR.',
  },
  {
    id: 'nomad',
    name: 'Nomad',
    category: 'internacional',
    features: {
      acoes: false, fiis: false, etfs: false, tesouro: false, cdb: false,
      lci_lca: false, bdrs: false, fundos: false, cripto: false, internacional_direto: true,
    },
    note: 'Conta em dólar + investimentos nos EUA. Sem ativos BR.',
  },
  {
    id: 'inter_us',
    name: 'Inter US',
    category: 'internacional',
    features: {
      acoes: false, fiis: false, etfs: false, tesouro: false, cdb: false,
      lci_lca: false, bdrs: false, fundos: false, cripto: false, internacional_direto: true,
    },
    note: 'Braço americano do Inter. Use junto com Inter BR pra carteira completa.',
  },

  // ============ OUTRA ============
  {
    id: 'outra',
    name: 'Outra corretora',
    category: 'corretora',
    features: {
      acoes: true, fiis: true, etfs: true, tesouro: true, cdb: true,
      lci_lca: true, bdrs: true, fundos: true, cripto: false, internacional_direto: false,
    },
    note: 'Configuração genérica (assume acesso completo à B3).',
  },
];

export function getBrokerById(id?: string): Broker | undefined {
  if (!id) return undefined;
  return BROKERS.find((b) => b.id === id);
}

export function brokerLimitations(broker: Broker): string[] {
  const limits: string[] = [];
  if (!broker.features.bdrs) limits.push('sem BDRs');
  if (!broker.features.etfs) limits.push('sem ETFs');
  if (!broker.features.fiis) limits.push('sem FIIs');
  if (!broker.features.acoes) limits.push('sem ações');
  if (!broker.features.cripto) limits.push('sem cripto direta');
  if (!broker.features.internacional_direto && !broker.features.bdrs) limits.push('sem acesso internacional direto');
  return limits;
}
