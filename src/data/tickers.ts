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
  { symbol: 'CPLE3', name: 'Copel ON', type: 'acao' },
  { symbol: 'CPLE5', name: 'Copel PNA', type: 'acao' },
  { symbol: 'TAEE3', name: 'Taesa ON', type: 'acao' },
  { symbol: 'TAEE4', name: 'Taesa PN', type: 'acao' },
  { symbol: 'TRPL3', name: 'Transmissão Paulista ON', type: 'acao' },
  { symbol: 'ALUP3', name: 'Alupar ON', type: 'acao' },
  { symbol: 'ALUP4', name: 'Alupar PN', type: 'acao' },
  { symbol: 'ALUP11', name: 'Alupar Unit', type: 'acao' },
  { symbol: 'ENEV3', name: 'Eneva', type: 'acao' },
  { symbol: 'LIGT3', name: 'Light', type: 'acao' },
  { symbol: 'CEAB3', name: 'C&A', type: 'acao' },
  { symbol: 'AMAR3', name: 'Lojas Marisa', type: 'acao' },
  { symbol: 'GRND3', name: 'Grendene', type: 'acao' },
  { symbol: 'VULC3', name: 'Vulcabras', type: 'acao' },
  { symbol: 'ALPA4', name: 'Alpargatas PN', type: 'acao' },
  { symbol: 'AZZA3', name: 'Azzas 2154', type: 'acao' },
  { symbol: 'GUAR3', name: 'Guararapes', type: 'acao' },
  { symbol: 'SBFG3', name: 'Centauro (SBF)', type: 'acao' },
  { symbol: 'TFCO4', name: 'Track & Field PN', type: 'acao' },
  { symbol: 'PETZ3', name: 'Petz', type: 'acao' },
  { symbol: 'RENT3', name: 'Localiza', type: 'acao' },
  { symbol: 'MOVI3', name: 'Movida', type: 'acao' },
  { symbol: 'VAMO3', name: 'Vamos', type: 'acao' },
  { symbol: 'SIMH3', name: 'Simpar', type: 'acao' },
  { symbol: 'JSLG3', name: 'JSL', type: 'acao' },
  { symbol: 'ARML3', name: 'Armac', type: 'acao' },
  { symbol: 'POMO4', name: 'Marcopolo PN', type: 'acao' },
  { symbol: 'POMO3', name: 'Marcopolo ON', type: 'acao' },
  { symbol: 'FRAS3', name: 'Fras-le', type: 'acao' },
  { symbol: 'SHUL4', name: 'Schulz PN', type: 'acao' },
  { symbol: 'DXCO3', name: 'Dexco', type: 'acao' },
  { symbol: 'KLBN3', name: 'Klabin ON', type: 'acao' },
  { symbol: 'KLBN4', name: 'Klabin PN', type: 'acao' },
  { symbol: 'RANI3', name: 'Irani Papel', type: 'acao' },
  { symbol: 'DASA3', name: 'Dasa', type: 'acao' },
  { symbol: 'KRSA3', name: 'Kora Saúde', type: 'acao' },
  { symbol: 'MATD3', name: 'Mater Dei', type: 'acao' },
  { symbol: 'AALR3', name: 'Alliar', type: 'acao' },
  { symbol: 'ODPV3', name: 'OdontoPrev', type: 'acao' },
  { symbol: 'BHIA3', name: 'Casas Bahia', type: 'acao' },
  { symbol: 'BMOB3', name: 'Bemobi', type: 'acao' },
  { symbol: 'INTB3', name: 'Intelbras', type: 'acao' },
  { symbol: 'DOTZ3', name: 'Dotz', type: 'acao' },
  { symbol: 'VTEX3', name: 'Vtex', type: 'acao' },
  { symbol: 'MELI34', name: 'Mercado Livre BDR', type: 'acao' },
  { symbol: 'DIRR3', name: 'Direcional', type: 'acao' },
  { symbol: 'TEND3', name: 'Construtora Tenda', type: 'acao' },
  { symbol: 'EVEN3', name: 'Even', type: 'acao' },
  { symbol: 'GFSA3', name: 'Gafisa', type: 'acao' },
  { symbol: 'JHSF3', name: 'JHSF', type: 'acao' },
  { symbol: 'TRIS3', name: 'Trisul', type: 'acao' },
  { symbol: 'CURY3', name: 'Cury', type: 'acao' },
  { symbol: 'LAVV3', name: 'Lavvi', type: 'acao' },
  { symbol: 'BRSR6', name: 'Banrisul PNB', type: 'acao' },
  { symbol: 'BMGB4', name: 'Banco BMG', type: 'acao' },
  { symbol: 'ABCB4', name: 'Banco ABC', type: 'acao' },
  { symbol: 'BPAC3', name: 'BTG Pactual ON', type: 'acao' },
  { symbol: 'BPAC5', name: 'BTG Pactual PN', type: 'acao' },
  { symbol: 'BRAP4', name: 'Bradespar PN', type: 'acao' },
  { symbol: 'BRAP3', name: 'Bradespar ON', type: 'acao' },
  { symbol: 'ENGI3', name: 'Energisa ON', type: 'acao' },
  { symbol: 'ENGI4', name: 'Energisa PN', type: 'acao' },
  { symbol: 'ITSA3', name: 'Itaúsa ON', type: 'acao' },
  { symbol: 'LOGG3', name: 'Log Commercial', type: 'acao' },
  { symbol: 'MILS3', name: 'Mills', type: 'acao' },
  { symbol: 'HBSA3', name: 'Hidrovias do Brasil', type: 'acao' },
  { symbol: 'GOAU3', name: 'Metalúrgica Gerdau ON', type: 'acao' },
  { symbol: 'USIM3', name: 'Usiminas ON', type: 'acao' },
  { symbol: 'USIM6', name: 'Usiminas PNB', type: 'acao' },

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
  { symbol: 'HGRU11', name: 'CSHG Urbano', type: 'fii' },
  { symbol: 'VRTA11', name: 'Fator Verita', type: 'fii' },
  { symbol: 'VINO11', name: 'Vinci Offices', type: 'fii' },
  { symbol: 'HGCR11', name: 'CSHG Recebíveis', type: 'fii' },
  { symbol: 'RZTR11', name: 'Riza Terrax', type: 'fii' },
  { symbol: 'KNUQ11', name: 'Kinea Urca', type: 'fii' },
  { symbol: 'HGBS11', name: 'CSHG Brasil Shopping', type: 'fii' },
  { symbol: 'XPCI11', name: 'XP Crédito Imobiliário', type: 'fii' },
  { symbol: 'CPTS11', name: 'Capitânia Securities', type: 'fii' },
  { symbol: 'TGAR11', name: 'TG Ativo Real', type: 'fii' },
  { symbol: 'PVBI11', name: 'VBI Prime Properties', type: 'fii' },
  { symbol: 'SNCI11', name: 'Suno Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'SNAG11', name: 'Suno Agro', type: 'fii' },
  { symbol: 'SNEL11', name: 'Suno Energias Limpas', type: 'fii' },
  { symbol: 'BTHF11', name: 'BTG High Fidelity', type: 'fii' },
  { symbol: 'OUJP11', name: 'Ourinvest JPP', type: 'fii' },
  { symbol: 'URPR11', name: 'URCA Prime Renda', type: 'fii' },
  { symbol: 'MCCI11', name: 'Mauá Capital Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'GARE11', name: 'Guardian Real Estate', type: 'fii' },
  { symbol: 'AFHI11', name: 'AF Invest CRI', type: 'fii' },
  { symbol: 'KNCA11', name: 'Kinea Crédito Agro', type: 'fii' },

  // ============ FIIs — Agro/Fiagros ============
  { symbol: 'CPTR11', name: 'Capitânia Agro', type: 'fii' },
  { symbol: 'XPCA11', name: 'XP Crédito Agrícola', type: 'fii' },
  { symbol: 'RZAG11', name: 'Riza Agro', type: 'fii' },
  { symbol: 'TRXF11', name: 'TRX Real Estate', type: 'fii' },
  { symbol: 'BTRA11', name: 'BTG Pactual Terras Agrícolas', type: 'fii' },
  { symbol: 'AGRX11', name: 'Suno Agroindústria', type: 'fii' },
  { symbol: 'GCRA11', name: 'Galápagos Crédito Agro', type: 'fii' },
  { symbol: 'AGCX11', name: 'AF Invest CRA', type: 'fii' },
  { symbol: 'NCRA11', name: 'Nu Asset CRA', type: 'fii' },
  { symbol: 'JURO11', name: 'Sparta Top FIC FI', type: 'fii' },

  // ============ MAIS FIIs populares (papel, tijolo, FoF, logística) ============
  { symbol: 'RECT11', name: 'REC Renda Imobiliária', type: 'fii' },
  { symbol: 'HFOF11', name: 'Hedge TOP FoF', type: 'fii' },
  { symbol: 'BCRI11', name: 'Banestes Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'BRCO11', name: 'Bresco Logística', type: 'fii' },
  { symbol: 'LVBI11', name: 'VBI Logística', type: 'fii' },
  { symbol: 'ALZR11', name: 'Alianza Trust Renda Imobiliária', type: 'fii' },
  { symbol: 'RBRP11', name: 'RBR Properties', type: 'fii' },
  { symbol: 'RBRY11', name: 'RBR Crédito Imobiliário High Yield', type: 'fii' },
  { symbol: 'RBHY11', name: 'RBR High Yield', type: 'fii' },
  { symbol: 'PORD11', name: 'Polo Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'VGIA11', name: 'Valora Agro', type: 'fii' },
  { symbol: 'CACR11', name: 'Cartesia Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'PLCR11', name: 'Plural Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'BLMG11', name: 'Bluemacaw Logística', type: 'fii' },
  { symbol: 'BTML11', name: 'BTG Pactual Multiestratégia', type: 'fii' },
  { symbol: 'VCJR11', name: 'Vectis Juros Real', type: 'fii' },
  { symbol: 'BPFF11', name: 'BTG Pactual FoF', type: 'fii' },
  { symbol: 'HGPO11', name: 'CSHG Prime Offices', type: 'fii' },
  { symbol: 'HABT11', name: 'Habitat II', type: 'fii' },
  { symbol: 'HSLG11', name: 'HSI Logística', type: 'fii' },
  { symbol: 'HUSC11', name: 'Hedge U.S. Office Income', type: 'fii' },
  { symbol: 'HUSI11', name: 'Hedge US Income', type: 'fii' },
  { symbol: 'KISU11', name: 'Kinea Securities', type: 'fii' },
  { symbol: 'KORE11', name: 'Korea Lodging', type: 'fii' },
  { symbol: 'LASC11', name: 'Lasc FII', type: 'fii' },
  { symbol: 'MFII11', name: 'Mérito Desenvolvimento Imobiliário I', type: 'fii' },
  { symbol: 'NEWL11', name: 'Newport Logística', type: 'fii' },
  { symbol: 'OUFF11', name: 'Ourinvest FoF', type: 'fii' },
  { symbol: 'PATL11', name: 'Pátria Logística', type: 'fii' },
  { symbol: 'PEMA11', name: 'BTG Pactual Educacional', type: 'fii' },
  { symbol: 'RBED11', name: 'Rio Bravo Renda Educacional', type: 'fii' },
  { symbol: 'RBVA11', name: 'Rio Bravo Renda Varejo', type: 'fii' },
  { symbol: 'RBVO11', name: 'Rio Bravo Renda Imobiliária', type: 'fii' },
  { symbol: 'RBRS11', name: 'RBR Sec Recebíveis', type: 'fii' },
  { symbol: 'RCFA11', name: 'Rio Claro Façanha', type: 'fii' },
  { symbol: 'RZAK11', name: 'Riza Akin', type: 'fii' },
  { symbol: 'SADI11', name: 'Santander Diversificado', type: 'fii' },
  { symbol: 'SARE11', name: 'Santander Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'SDIL11', name: 'SDI Rio Bravo Logística', type: 'fii' },
  { symbol: 'TEPP11', name: 'Tellus Properties', type: 'fii' },
  { symbol: 'TRBL11', name: 'TG Ativo Real Imobiliário', type: 'fii' },
  { symbol: 'TVRI11', name: 'TVL Renda Imobiliária', type: 'fii' },
  { symbol: 'VCRI11', name: 'Vectis Crédito Imobiliário', type: 'fii' },
  { symbol: 'VGHF11', name: 'Valora Hedge Fund', type: 'fii' },
  { symbol: 'VGRI11', name: 'Vinci Logística', type: 'fii' },
  { symbol: 'VIUR11', name: 'Vinci Urca Properties', type: 'fii' },
  { symbol: 'VSLH11', name: 'Versalhes Recebíveis Imobiliários', type: 'fii' },
  { symbol: 'XPCM11', name: 'XP Corporate Macaé', type: 'fii' },
  { symbol: 'XPID11', name: 'XP Industrial', type: 'fii' },
  { symbol: 'XPIN11', name: 'XP Industrial Premium', type: 'fii' },
  { symbol: 'XPPR11', name: 'XP Properties', type: 'fii' },
  { symbol: 'XPSF11', name: 'XP Selection FoF', type: 'fii' },
  { symbol: 'YUFI11', name: 'Yuca Renda Imobiliária', type: 'fii' },

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

import { Platform } from 'react-native';

const API_BASE = Platform.OS === 'web' ? '/api' : 'https://vesti-nine.vercel.app/api';
const remoteCache = new Map<string, { ts: number; results: TickerInfo[] }>();
const REMOTE_TTL = 5 * 60 * 1000;

/**
 * Busca tickers TANTO no catálogo local (instantâneo) QUANTO na brapi.dev
 * via /api/search-tickers (dinâmico, cobre todos os ativos da B3).
 * Resultados locais aparecem primeiro; remotos completam.
 */
export async function searchTickersAsync(query: string, limit = 12): Promise<TickerInfo[]> {
  const q = query.trim().toUpperCase();
  if (q.length === 0) return [];
  const local = searchTickers(q, limit);
  if (q.length < 2) return local;

  // Verifica cache do remoto
  const cached = remoteCache.get(q);
  let remote: TickerInfo[] = [];
  if (cached && Date.now() - cached.ts < REMOTE_TTL) {
    remote = cached.results;
  } else {
    try {
      const res = await fetch(`${API_BASE}/search-tickers?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.results)) {
          remote = json.results.map((r: any) => ({
            symbol: r.symbol,
            name: r.name || r.symbol,
            type: r.type as TickerInfo['type'],
          }));
          remoteCache.set(q, { ts: Date.now(), results: remote });
        }
      }
    } catch {
      // ignora — usuário ainda tem resultados locais
    }
  }

  // Merge: locais primeiro, depois remotos que não estão nos locais
  const localSymbols = new Set(local.map((t) => t.symbol));
  const merged = [
    ...local,
    ...remote.filter((r) => !localSymbols.has(r.symbol)),
  ];
  return merged.slice(0, limit);
}
