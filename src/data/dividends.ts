// Calendário de dividendos por ticker — padrões médios históricos.
// Meses no formato 1-12. Quando o ticker não está aqui, usamos heurística.

export type DividendCalendar = {
  frequency: 'monthly' | 'quarterly' | 'semestral' | 'annual';
  months: number[]; // 1-12
};

export const DIVIDEND_CALENDAR: Record<string, DividendCalendar> = {
  // ============ FIIs — sempre mensais ============
  MXRF11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  KNCR11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  KNIP11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  HGLG11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  BTLG11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  XPLG11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  KNRI11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  XPML11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  VISC11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  BCFF11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  MALL11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  HSML11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  VILG11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  GGRC11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  BRCR11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  HGRE11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  JSRE11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  IRDM11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  RECR11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  RBRF11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  HGFF11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  KFOF11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  RBRR11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  RCRB11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  VGIR11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  HCTR11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  DEVA11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  NSLU11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },

  // ============ Bancos — geralmente mensais (JCP + dividendos) ============
  ITUB4: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  ITUB3: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  BBDC4: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  BBDC3: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  BBAS3: { frequency: 'quarterly', months: [2, 5, 8, 11] },
  SANB11: { frequency: 'semestral', months: [4, 10] },
  BPAC11: { frequency: 'semestral', months: [4, 10] },
  ITSA4: { frequency: 'quarterly', months: [3, 6, 9, 12] },
  B3SA3: { frequency: 'quarterly', months: [3, 6, 9, 12] },

  // ============ Energia — trimestral ou semestral ============
  TAEE11: { frequency: 'quarterly', months: [3, 6, 9, 12] },
  TRPL4: { frequency: 'semestral', months: [4, 10] },
  EGIE3: { frequency: 'semestral', months: [4, 10] },
  CMIG4: { frequency: 'semestral', months: [6, 12] },
  CPLE6: { frequency: 'semestral', months: [4, 10] },
  CPFE3: { frequency: 'semestral', months: [4, 10] },
  EQTL3: { frequency: 'annual', months: [5] },
  NEOE3: { frequency: 'annual', months: [5] },
  ELET3: { frequency: 'annual', months: [6] },
  ELET6: { frequency: 'annual', months: [6] },

  // ============ Petróleo / Commodity — trimestral ============
  PETR4: { frequency: 'quarterly', months: [3, 5, 8, 11] },
  PETR3: { frequency: 'quarterly', months: [3, 5, 8, 11] },
  VALE3: { frequency: 'semestral', months: [3, 9] },
  CSAN3: { frequency: 'annual', months: [6] },
  UGPA3: { frequency: 'annual', months: [4] },
  VBBR3: { frequency: 'semestral', months: [4, 10] },
  PRIO3: { frequency: 'annual', months: [5] },
  RECV3: { frequency: 'semestral', months: [4, 10] },
  GGBR4: { frequency: 'quarterly', months: [3, 6, 9, 12] },
  GOAU4: { frequency: 'quarterly', months: [3, 6, 9, 12] },
  CSNA3: { frequency: 'annual', months: [4] },
  USIM5: { frequency: 'annual', months: [4] },
  SUZB3: { frequency: 'annual', months: [4] },

  // ============ Outras grandes ============
  ABEV3: { frequency: 'semestral', months: [4, 10] },
  WEGE3: { frequency: 'quarterly', months: [3, 6, 9, 12] },
  VIVT3: { frequency: 'semestral', months: [3, 9] },
  TIMS3: { frequency: 'annual', months: [5] },
  TOTS3: { frequency: 'annual', months: [4] },
  EMBR3: { frequency: 'annual', months: [5] },
  RAIL3: { frequency: 'annual', months: [5] },
  CCRO3: { frequency: 'annual', months: [4] },
  RDOR3: { frequency: 'annual', months: [5] },
  HAPV3: { frequency: 'annual', months: [5] },
  QUAL3: { frequency: 'annual', months: [5] },
  BBSE3: { frequency: 'semestral', months: [3, 9] },
  IRBR3: { frequency: 'annual', months: [5] },
  LREN3: { frequency: 'annual', months: [5] },
  MGLU3: { frequency: 'annual', months: [5] },
  BRFS3: { frequency: 'annual', months: [5] },
  JBSS3: { frequency: 'semestral', months: [4, 10] },
  MRFG3: { frequency: 'annual', months: [5] },
  NTCO3: { frequency: 'annual', months: [5] },
  HYPE3: { frequency: 'semestral', months: [4, 10] },
  SBSP3: { frequency: 'annual', months: [4] },
  SAPR11: { frequency: 'annual', months: [4] },
  KLBN11: { frequency: 'quarterly', months: [3, 6, 9, 12] },
  RAIZ4: { frequency: 'annual', months: [6] },
  CYRE3: { frequency: 'annual', months: [4] },
  MRVE3: { frequency: 'annual', months: [4] },
  EZTC3: { frequency: 'annual', months: [4] },
  FLRY3: { frequency: 'annual', months: [5] },
  POSI3: { frequency: 'annual', months: [4] },
  LWSA3: { frequency: 'annual', months: [4] },
  ASAI3: { frequency: 'annual', months: [4] },
  CRFB3: { frequency: 'annual', months: [4] },
  PCAR3: { frequency: 'annual', months: [4] },
  PARD3: { frequency: 'annual', months: [5] },
  BEEF3: { frequency: 'annual', months: [4] },
  AMER3: { frequency: 'annual', months: [4] },
  VIIA3: { frequency: 'annual', months: [4] },
  AZUL4: { frequency: 'annual', months: [5] },
  GOLL4: { frequency: 'annual', months: [5] },
  CVCB3: { frequency: 'annual', months: [5] },

  // ============ ETFs ============
  BOVA11: { frequency: 'semestral', months: [1, 7] },
  BOVV11: { frequency: 'semestral', months: [1, 7] },
  SMAL11: { frequency: 'semestral', months: [1, 7] },
  IVVB11: { frequency: 'semestral', months: [5, 11] },
  SPXI11: { frequency: 'semestral', months: [5, 11] },
  NASD11: { frequency: 'annual', months: [11] },
  WRLD11: { frequency: 'annual', months: [11] },
  GOLD11: { frequency: 'annual', months: [12] },
  FIXA11: { frequency: 'annual', months: [12] },
  DIVO11: { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  BITH11: { frequency: 'annual', months: [12] },
  ETHE11: { frequency: 'annual', months: [12] },
};

const FII_PATTERN = /^[A-Z]{4}11$/;
const BDR_PATTERN = /^[A-Z]{4}3[2-5]$/;
const INTL_ETFS = ['IVVB11', 'NASD11', 'WRLD11', 'SPXI11', 'BITH11', 'ETHE11'];
const ETF_BR = ['BOVA11', 'BOVV11', 'SMAL11', 'DIVO11', 'GOLD11', 'FIXA11'];

export function getCalendarFor(symbol: string): DividendCalendar {
  const upper = symbol.toUpperCase();
  const direct = DIVIDEND_CALENDAR[upper];
  if (direct) return direct;

  // Heurística por padrão de ticker
  if (FII_PATTERN.test(upper) && !INTL_ETFS.includes(upper) && !ETF_BR.includes(upper)) {
    // FII — mensal
    return { frequency: 'monthly', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
  }
  if (INTL_ETFS.includes(upper)) {
    return { frequency: 'annual', months: [12] };
  }
  if (ETF_BR.includes(upper)) {
    return { frequency: 'semestral', months: [1, 7] };
  }
  if (BDR_PATTERN.test(upper)) {
    return { frequency: 'quarterly', months: [3, 6, 9, 12] };
  }
  // Ações desconhecidas — assume trimestral
  return { frequency: 'quarterly', months: [3, 6, 9, 12] };
}

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
