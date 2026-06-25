// Lista local dos principais ativos da B3 pra autocomplete instantâneo.
// Atualizada conforme necessidade.

export type TickerInfo = {
  symbol: string;
  name: string;
  type: 'acao' | 'fii' | 'etf';
};

export const TICKERS: TickerInfo[] = [
  // ============ AÇÕES — Bancos & Financeiro ============
  { symbol: 'ITUB4', name: 'Itaú Unibanco PN', type: 'acao' },
  { symbol: 'ITUB3', name: 'Itaú Unibanco ON', type: 'acao' },
  { symbol: 'BBDC4', name: 'Bradesco PN', type: 'acao' },
  { symbol: 'BBDC3', name: 'Bradesco ON', type: 'acao' },
  { symbol: 'BBAS3', name: 'Banco do Brasil', type: 'acao' },
  { symbol: 'SANB11', name: 'Santander Brasil Unit', type: 'acao' },
  { symbol: 'BPAC11', name: 'BTG Pactual Unit', type: 'acao' },
  { symbol: 'ITSA4', name: 'Itaúsa PN', type: 'acao' },
  { symbol: 'B3SA3', name: 'B3', type: 'acao' },
  { symbol: 'BBSE3', name: 'BB Seguridade', type: 'acao' },
  { symbol: 'PSSA3', name: 'Porto Seguro', type: 'acao' },
  { symbol: 'IRBR3', name: 'IRB Brasil', type: 'acao' },
  { symbol: 'CXSE3', name: 'Caixa Seguridade', type: 'acao' },
  { symbol: 'WIZS3', name: 'Wiz Soluções', type: 'acao' },

  // ============ AÇÕES — Energia & Petróleo ============
  { symbol: 'PETR4', name: 'Petrobras PN', type: 'acao' },
  { symbol: 'PETR3', name: 'Petrobras ON', type: 'acao' },
  { symbol: 'PRIO3', name: 'PetroRio', type: 'acao' },
  { symbol: 'RECV3', name: 'PetroReconcavo', type: 'acao' },
  { symbol: 'CSAN3', name: 'Cosan', type: 'acao' },
  { symbol: 'UGPA3', name: 'Ultrapar', type: 'acao' },
  { symbol: 'VBBR3', name: 'Vibra Energia', type: 'acao' },
  { symbol: 'ELET3', name: 'Eletrobras ON', type: 'acao' },
  { symbol: 'ELET6', name: 'Eletrobras PNB', type: 'acao' },
  { symbol: 'CMIG4', name: 'Cemig PN', type: 'acao' },
  { symbol: 'EGIE3', name: 'Engie Brasil', type: 'acao' },
  { symbol: 'TAEE11', name: 'Taesa Unit', type: 'acao' },
  { symbol: 'CPFE3', name: 'CPFL Energia', type: 'acao' },
  { symbol: 'EQTL3', name: 'Equatorial', type: 'acao' },
  { symbol: 'NEOE3', name: 'Neoenergia', type: 'acao' },

  // ============ AÇÕES — Mineração & Siderurgia ============
  { symbol: 'VALE3', name: 'Vale', type: 'acao' },
  { symbol: 'CSNA3', name: 'CSN', type: 'acao' },
  { symbol: 'USIM5', name: 'Usiminas PNA', type: 'acao' },
  { symbol: 'GGBR4', name: 'Gerdau PN', type: 'acao' },
  { symbol: 'GOAU4', name: 'Metalúrgica Gerdau PN', type: 'acao' },

  // ============ AÇÕES — Varejo & Consumo ============
  { symbol: 'MGLU3', name: 'Magazine Luiza', type: 'acao' },
  { symbol: 'LREN3', name: 'Lojas Renner', type: 'acao' },
  { symbol: 'AMER3', name: 'Americanas', type: 'acao' },
  { symbol: 'VIIA3', name: 'Via Varejo', type: 'acao' },
  { symbol: 'PCAR3', name: 'Pão de Açúcar', type: 'acao' },
  { symbol: 'ASAI3', name: 'Assaí', type: 'acao' },
  { symbol: 'CRFB3', name: 'Carrefour Brasil', type: 'acao' },
  { symbol: 'BRFS3', name: 'BRF', type: 'acao' },
  { symbol: 'JBSS3', name: 'JBS', type: 'acao' },
  { symbol: 'MRFG3', name: 'Marfrig', type: 'acao' },
  { symbol: 'BEEF3', name: 'Minerva', type: 'acao' },
  { symbol: 'NTCO3', name: 'Natura', type: 'acao' },
  { symbol: 'HYPE3', name: 'Hypera', type: 'acao' },

  // ============ AÇÕES — Indústria & Bens ============
  { symbol: 'WEGE3', name: 'WEG', type: 'acao' },
  { symbol: 'EMBR3', name: 'Embraer', type: 'acao' },
  { symbol: 'KLBN11', name: 'Klabin Unit', type: 'acao' },
  { symbol: 'SUZB3', name: 'Suzano', type: 'acao' },
  { symbol: 'RAIZ4', name: 'Raízen', type: 'acao' },
  { symbol: 'CYRE3', name: 'Cyrela', type: 'acao' },
  { symbol: 'MRVE3', name: 'MRV', type: 'acao' },
  { symbol: 'EZTC3', name: 'Eztec', type: 'acao' },
  { symbol: 'TRPL4', name: 'Transmissão Paulista PN', type: 'acao' },

  // ============ AÇÕES — Tecnologia & Telecom ============
  { symbol: 'TOTS3', name: 'Totvs', type: 'acao' },
  { symbol: 'POSI3', name: 'Positivo', type: 'acao' },
  { symbol: 'LWSA3', name: 'Locaweb', type: 'acao' },
  { symbol: 'VIVT3', name: 'Telefônica Vivo', type: 'acao' },
  { symbol: 'TIMS3', name: 'TIM', type: 'acao' },

  // ============ AÇÕES — Saúde ============
  { symbol: 'RDOR3', name: "Rede D'Or", type: 'acao' },
  { symbol: 'HAPV3', name: 'Hapvida', type: 'acao' },
  { symbol: 'QUAL3', name: 'Qualicorp', type: 'acao' },
  { symbol: 'FLRY3', name: 'Fleury', type: 'acao' },
  { symbol: 'PARD3', name: 'Hermes Pardini', type: 'acao' },
  { symbol: 'RADL3', name: 'Raia Drogasil', type: 'acao' },
  { symbol: 'PNVL3', name: 'Panvel', type: 'acao' },
  { symbol: 'BIOM3', name: 'Biomm', type: 'acao' },
  { symbol: 'BLAU3', name: 'Blau Farmacêutica', type: 'acao' },

  // ============ AÇÕES — Outras ============
  { symbol: 'ABEV3', name: 'Ambev', type: 'acao' },
  { symbol: 'RAIL3', name: 'Rumo', type: 'acao' },
  { symbol: 'CCRO3', name: 'CCR', type: 'acao' },
  { symbol: 'AZUL4', name: 'Azul PN', type: 'acao' },
  { symbol: 'GOLL4', name: 'Gol PN', type: 'acao' },
  { symbol: 'CVCB3', name: 'CVC', type: 'acao' },
  { symbol: 'IRBR3', name: 'IRB Brasil', type: 'acao' },
  { symbol: 'CPLE6', name: 'Copel PNB', type: 'acao' },
  { symbol: 'SBSP3', name: 'Sabesp', type: 'acao' },
  { symbol: 'SAPR11', name: 'Sanepar Unit', type: 'acao' },
  { symbol: 'CSMG3', name: 'Copasa', type: 'acao' },
  { symbol: 'ALOS3', name: 'Allos', type: 'acao' },
  { symbol: 'MULT3', name: 'Multiplan', type: 'acao' },
  { symbol: 'IGTI11', name: 'Iguatemi Unit', type: 'acao' },
  { symbol: 'SLCE3', name: 'SLC Agrícola', type: 'acao' },
  { symbol: 'AGRO3', name: 'BrasilAgro', type: 'acao' },
  { symbol: 'SMTO3', name: 'São Martinho', type: 'acao' },
  { symbol: 'CCRO3', name: 'CCR', type: 'acao' },
  { symbol: 'ECOR3', name: 'EcoRodovias', type: 'acao' },
  { symbol: 'STBP3', name: 'Santos Brasil', type: 'acao' },
  { symbol: 'GMAT3', name: 'Grupo Mateus', type: 'acao' },
  { symbol: 'KEPL3', name: 'Kepler Weber', type: 'acao' },
  { symbol: 'YDUQ3', name: 'Yduqs', type: 'acao' },
  { symbol: 'COGN3', name: 'Cogna', type: 'acao' },
  { symbol: 'SEER3', name: 'Ser Educacional', type: 'acao' },
  { symbol: 'CMIN3', name: 'CSN Mineração', type: 'acao' },
  { symbol: 'AURE3', name: 'Auren Energia', type: 'acao' },
  { symbol: 'CSED3', name: 'Cruzeiro do Sul Educacional', type: 'acao' },
  { symbol: 'ENGI11', name: 'Energisa Unit', type: 'acao' },
  { symbol: 'CMIG3', name: 'Cemig ON', type: 'acao' },
  { symbol: 'GEPA4', name: 'Guarani PN', type: 'acao' },
  { symbol: 'TUPY3', name: 'Tupy', type: 'acao' },

  // ============ FIIs — Papel ============
  { symbol: 'MXRF11', name: 'Maxi Renda', type: 'fii' },
  { symbol: 'KNCR11', name: 'Kinea Rendimentos', type: 'fii' },
  { symbol: 'KNIP11', name: 'Kinea Índices de Preços', type: 'fii' },
  { symbol: 'KNHY11', name: 'Kinea High Yield', type: 'fii' },
  { symbol: 'RBRR11', name: 'RBR Rendimento High Grade', type: 'fii' },
  { symbol: 'IRDM11', name: 'Iridium Recebíveis', type: 'fii' },
  { symbol: 'RECR11', name: 'REC Recebíveis', type: 'fii' },
  { symbol: 'VGIR11', name: 'Valora CRI', type: 'fii' },

  // ============ FIIs — Tijolo (Lajes/Galpões) ============
  { symbol: 'HGLG11', name: 'CSHG Logística', type: 'fii' },
  { symbol: 'XPLG11', name: 'XP Log', type: 'fii' },
  { symbol: 'VILG11', name: 'Vinci Logística', type: 'fii' },
  { symbol: 'BTLG11', name: 'BTG Pactual Logística', type: 'fii' },
  { symbol: 'GGRC11', name: 'GGR Covepi Renda', type: 'fii' },
  { symbol: 'KNRI11', name: 'Kinea Renda Imobiliária', type: 'fii' },
  { symbol: 'BCFF11', name: 'BTG Pactual Fundo de Fundos', type: 'fii' },
  { symbol: 'BRCR11', name: 'BC Fund', type: 'fii' },
  { symbol: 'HGRE11', name: 'CSHG Real Estate', type: 'fii' },
  { symbol: 'JSRE11', name: 'JS Real Estate', type: 'fii' },
  { symbol: 'RCRB11', name: 'Rio Bravo Renda Corporativa', type: 'fii' },

  // ============ FIIs — Shoppings ============
  { symbol: 'XPML11', name: 'XP Malls', type: 'fii' },
  { symbol: 'HSML11', name: 'HSI Mall', type: 'fii' },
  { symbol: 'VISC11', name: 'Vinci Shopping Centers', type: 'fii' },
  { symbol: 'MALL11', name: 'Malls Brasil Plural', type: 'fii' },

  // ============ FIIs — Fundo de Fundos ============
  { symbol: 'HGFF11', name: 'CSHG Fundo de Fundos', type: 'fii' },
  { symbol: 'KFOF11', name: 'Kinea Fundo de Fundos', type: 'fii' },
  { symbol: 'RBRF11', name: 'RBR Alpha FoF', type: 'fii' },

  // ============ FIIs — Hospitalar/Outros ============
  { symbol: 'NSLU11', name: 'Hospital Nossa Senhora de Lourdes', type: 'fii' },
  { symbol: 'HCTR11', name: 'Hectare CE', type: 'fii' },
  { symbol: 'DEVA11', name: 'Devant Recebíveis', type: 'fii' },

  // ============ ETFs ============
  { symbol: 'BOVA11', name: 'iShares Ibovespa', type: 'etf' },
  { symbol: 'SMAL11', name: 'iShares Small Caps', type: 'etf' },
  { symbol: 'IVVB11', name: 'iShares S&P 500', type: 'etf' },
  { symbol: 'BOVV11', name: 'It Now Ibovespa', type: 'etf' },
  { symbol: 'DIVO11', name: 'It Now IDIV', type: 'etf' },
  { symbol: 'GOLD11', name: 'Trend Ouro', type: 'etf' },
  { symbol: 'FIXA11', name: 'It Now Pré-fixado', type: 'etf' },
  { symbol: 'NASD11', name: 'Trend ETF Nasdaq 100', type: 'etf' },
  { symbol: 'SPXI11', name: 'It Now S&P 500', type: 'etf' },
  { symbol: 'WRLD11', name: 'Trend ETF Mundo', type: 'etf' },
  { symbol: 'BITH11', name: 'Hashdex Bitcoin', type: 'etf' },
  { symbol: 'ETHE11', name: 'Hashdex Ethereum', type: 'etf' },
];

export function searchTickers(query: string, limit = 8): TickerInfo[] {
  const q = query.trim().toUpperCase();
  if (q.length === 0) return [];
  // Primeiro: começa com a query
  const startsWith = TICKERS.filter((t) => t.symbol.startsWith(q));
  // Depois: contém no nome
  const inName = TICKERS.filter(
    (t) => !t.symbol.startsWith(q) && t.name.toUpperCase().includes(q),
  );
  return [...startsWith, ...inName].slice(0, limit);
}
