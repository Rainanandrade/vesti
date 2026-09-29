// Validações estritas pra reduzir superfície de ataque.

const MAX_BODY_BYTES = 50_000; // 50KB — gera um diagnóstico inteiro com folga
const SYMBOL_REGEX = /^\^?[A-Z][A-Z0-9]{1,9}$/; // PETR4, MXRF11, ^BVSP, IBOV
const RANGE_REGEX = /^(1mo|6mo|1y|5y)$/;

export function isValidSymbol(s) {
  return typeof s === 'string' && SYMBOL_REGEX.test(s);
}

export function isValidRange(r) {
  return typeof r === 'string' && RANGE_REGEX.test(r);
}

/**
 * Garante que o body recebido cabe no limite. Vercel JÁ aplica body parser
 * com limit padrão, mas duplicamos pra ter certeza.
 */
export function checkBodySize(req, res, maxBytes = MAX_BODY_BYTES) {
  const len = Number(req.headers?.['content-length'] || 0);
  let parsedBytes = 0;
  try {
    parsedBytes = Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
  } catch {
    res.status(400).json({ error: 'Payload inválido' });
    return false;
  }
  if (len > maxBytes || parsedBytes > maxBytes) {
    res.status(413).json({ error: 'Payload muito grande' });
    return false;
  }
  return true;
}

/**
 * Sanitiza profile pra IA: aceita só tipos/campos esperados.
 * Bloqueia injeção via campos extras inesperados.
 */
export function sanitizeProfile(p) {
  if (!p || typeof p !== 'object') return null;
  const out = {
    type: typeof p.type === 'string' ? p.type.slice(0, 40) : 'moderado',
    score: sanitizeNumber(p.score, { min: 0, max: 100 }),
    description: typeof p.description === 'string' ? p.description.slice(0, 400) : '',
    preference: typeof p.preference === 'string' ? p.preference.slice(0, 40) : undefined,
    strategy: null,
  };
  if (p.strategy && typeof p.strategy === 'object') {
    out.strategy = {
      renda_fixa: sanitizeNumber(p.strategy.renda_fixa, { min: 0, max: 100 }),
      renda_variavel: sanitizeNumber(p.strategy.renda_variavel, { min: 0, max: 100 }),
      internacional: sanitizeNumber(p.strategy.internacional, { min: 0, max: 100 }),
    };
  }
  return out;
}

export function sanitizeAssets(arr, maxItems = 100) {
  if (!Array.isArray(arr)) return [];
  return arr
    .slice(0, maxItems)
    .map((a) => ({
      symbol: typeof a?.symbol === 'string' ? a.symbol.slice(0, 12).toUpperCase().replace(/[^A-Z0-9]/g, '') : '',
      type: typeof a?.type === 'string' ? a.type.slice(0, 10) : 'outro',
      quantity: sanitizeNumber(a?.quantity),
      avgPrice: sanitizeNumber(a?.avgPrice),
      currentValue: sanitizeNumber(a?.currentValue),
      profitPct: sanitizeNumber(a?.profitPct, { min: -100, max: 10000 }),
    }))
    .filter((asset) => asset.symbol);
}

export function sanitizeMarketMap(value, symbols, maxItems = 100) {
  if (!value || typeof value !== 'object') return {};
  const allowed = new Set(symbols.slice(0, maxItems));
  const out = {};
  for (const [symbol, row] of Object.entries(value).slice(0, maxItems)) {
    if (!allowed.has(symbol) || !row || typeof row !== 'object') continue;
    out[symbol] = {
      regularMarketPrice: sanitizeNumber(row.regularMarketPrice),
      averageAmount: sanitizeNumber(row.averageAmount),
      frequency: ['monthly', 'quarterly', 'semestral', 'annual'].includes(row.frequency)
        ? row.frequency
        : undefined,
    };
  }
  return out;
}

export function sanitizeBrokers(value, maxItems = 20) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((broker) => ({
    name: sanitizeString(broker?.name, 80),
    limitations: sanitizeString(broker?.limitations, 240),
  })).filter((broker) => broker.name);
}

export function sanitizeString(s, max = 500) {
  if (typeof s !== 'string') return '';
  return s.slice(0, max);
}

export function sanitizeNumber(n, { min = 0, max = 1e12 } = {}) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
