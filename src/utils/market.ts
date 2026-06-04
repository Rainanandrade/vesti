// Status do mercado da B3 usando timezone America/Sao_Paulo.
// Horário regular do pregão: seg-sex, 10h00 às 17h00.

export type MarketStatus = {
  isOpen: boolean;
  label: string;
  nextChange: string;
};

const WEEKDAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

function getBrasiliaParts(now: Date) {
  // Usa Intl pra obter a hora em São Paulo de forma confiável.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const weekdayShort = parts.find((p) => p.type === 'weekday')?.value || 'Mon';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = map[weekdayShort] ?? 1;
  return { weekday, hour, minute };
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const { weekday, hour, minute } = getBrasiliaParts(now);
  const totalMin = hour * 60 + minute;

  const OPEN = 10 * 60; // 10:00
  const CLOSE = 17 * 60; // 17:00
  const isWeekday = weekday >= 1 && weekday <= 5;

  if (isWeekday && totalMin >= OPEN && totalMin < CLOSE) {
    return {
      isOpen: true,
      label: 'Mercado aberto',
      nextChange: 'Fecha às 17:00',
    };
  }

  // Fechado — calcular quando abre
  if (isWeekday && totalMin < OPEN) {
    return {
      isOpen: false,
      label: 'Mercado fechado',
      nextChange: 'Abre hoje às 10:00',
    };
  }

  // Fechado depois do horário ou fim de semana — descobrir próximo dia útil
  let daysAhead = 1;
  let nextDay = (weekday + 1) % 7;
  while (nextDay === 0 || nextDay === 6) {
    daysAhead++;
    nextDay = (nextDay + 1) % 7;
  }

  const label = daysAhead === 1 ? 'amanhã' : `na ${WEEKDAY_NAMES[nextDay]}`;
  return {
    isOpen: false,
    label: 'Mercado fechado',
    nextChange: `Abre ${label} às 10:00`,
  };
}
