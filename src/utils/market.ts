// Status do mercado da B3.
// Horário oficial do pregão: seg-sex, 10h00 às 17h00 (horário de Brasília).
// Exibimos os horários convertidos pro fuso do dispositivo + sufixo BRT.

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

const B3_TIMEZONE = 'America/Sao_Paulo';
const OPEN_HOUR_BR = 10; // 10:00 BRT
const CLOSE_HOUR_BR = 17; // 17:00 BRT

function getBrasiliaParts(now: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: B3_TIMEZONE,
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

/**
 * Detecta o fuso local do dispositivo via Intl.
 * Fallback: assume UTC se não conseguir detectar.
 */
function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/**
 * Formata uma data em "HH:mm" no fuso indicado.
 */
function formatTimeIn(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString().slice(11, 16);
  }
}

/**
 * Converte horário do pregão B3 (hora BRT) pra Date absoluta no UTC, depois
 * o consumer pode formatar no fuso local.
 *
 * Estratégia: cria string "YYYY-MM-DDTHH:00:00-03:00" e parseia (B3 é
 * sempre UTC-3, não tem horário de verão desde 2019).
 */
function brasiliaDateAt(year: number, month: number, day: number, hour: number): Date {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  return new Date(`${year}-${mm}-${dd}T${hh}:00:00-03:00`);
}

/**
 * Calcula a próxima abertura do pregão (Date absoluta) a partir de "agora".
 * Pula sábado/domingo.
 */
function nextOpenDate(now: Date): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: B3_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  let y = Number(parts.find((p) => p.type === 'year')?.value);
  let m = Number(parts.find((p) => p.type === 'month')?.value);
  let d = Number(parts.find((p) => p.type === 'day')?.value);

  let cand = brasiliaDateAt(y, m, d, OPEN_HOUR_BR);
  // Avança dias até ser dia útil E ainda não ter passado da abertura
  while (true) {
    const wkPart = new Intl.DateTimeFormat('en-US', { timeZone: B3_TIMEZONE, weekday: 'short' })
      .formatToParts(cand)
      .find((p) => p.type === 'weekday')?.value;
    const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const wk = map[wkPart || 'Mon'];
    const isWeekday = wk >= 1 && wk <= 5;
    if (isWeekday && cand.getTime() > now.getTime()) break;
    // Avança 1 dia
    const next = new Date(cand);
    next.setUTCDate(next.getUTCDate() + 1);
    y = next.getUTCFullYear();
    m = next.getUTCMonth() + 1;
    d = next.getUTCDate();
    cand = brasiliaDateAt(y, m, d, OPEN_HOUR_BR);
  }
  return cand;
}

function todaysCloseDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: B3_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  return brasiliaDateAt(y, m, d, CLOSE_HOUR_BR);
}

export function getMarketStatus(now: Date = new Date()): MarketStatus {
  const { weekday, hour, minute } = getBrasiliaParts(now);
  const totalMin = hour * 60 + minute;
  const OPEN = OPEN_HOUR_BR * 60;
  const CLOSE = CLOSE_HOUR_BR * 60;
  const isWeekday = weekday >= 1 && weekday <= 5;
  const localTz = getLocalTimezone();
  const isBrasilia = localTz === B3_TIMEZONE;

  const brTimeSuffix = (brHour: number) => isBrasilia ? '' : ` (${brHour}h em Brasília)`;

  if (isWeekday && totalMin >= OPEN && totalMin < CLOSE) {
    const closeDate = todaysCloseDate(now);
    return {
      isOpen: true,
      label: 'Mercado aberto',
      nextChange: `Fecha às ${formatTimeIn(closeDate, localTz)}${brTimeSuffix(CLOSE_HOUR_BR)}`,
    };
  }

  const nextOpen = nextOpenDate(now);
  const localTime = formatTimeIn(nextOpen, localTz);

  if (isWeekday && totalMin < OPEN) {
    return {
      isOpen: false,
      label: 'Mercado fechado',
      nextChange: `Abre hoje às ${localTime}${brTimeSuffix(OPEN_HOUR_BR)}`,
    };
  }

  // Fim de semana ou after-hours — descobre o weekday do próximo open
  const wkPartNext = new Intl.DateTimeFormat('en-US', { timeZone: B3_TIMEZONE, weekday: 'short' })
    .formatToParts(nextOpen)
    .find((p) => p.type === 'weekday')?.value;
  const wkMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const nextWk = wkMap[wkPartNext || 'Mon'];

  // Diferença em dias (no fuso local do dispositivo, pra ficar consistente)
  const oneDay = 24 * 60 * 60 * 1000;
  const daysAhead = Math.round((nextOpen.getTime() - now.getTime()) / oneDay);
  const dayLabel = daysAhead <= 1 ? 'amanhã' : `na ${WEEKDAY_NAMES[nextWk]}`;

  return {
    isOpen: false,
    label: 'Mercado fechado',
    nextChange: `Abre ${dayLabel} às ${localTime}${brTimeSuffix(OPEN_HOUR_BR)}`,
  };
}
