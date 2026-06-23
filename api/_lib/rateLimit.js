// Rate limit em memória — partial protection (cada cold start zera).
// Pra proteção real distribuída usaríamos Upstash. Aqui é suficiente
// pra parar abuso simples e ataques de força bruta de IP único.

const buckets = new Map();

function getKey(req) {
  // Vercel injeta x-forwarded-for; fallback pro remoteAddress
  const ip =
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';
  return ip;
}

/**
 * Limita N requisições por janela. Retorna true se permitido, false se excedeu.
 *   limit: máximo de chamadas
 *   windowMs: janela em milissegundos
 */
export function checkRateLimit(req, { limit = 20, windowMs = 60_000, prefix = 'g' } = {}) {
  const key = `${prefix}:${getKey(req)}`;
  const now = Date.now();
  const bucket = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (bucket.length >= limit) return false;
  bucket.push(now);
  buckets.set(key, bucket);
  // GC simples — limpa entradas antigas quando o map cresce
  if (buckets.size > 2000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return true;
}

/**
 * Atalho: aplica rate limit e responde 429 se excedeu.
 * Retorna true se a request deve continuar, false se já respondeu erro.
 */
export function rateLimitOrReject(req, res, opts) {
  if (checkRateLimit(req, opts)) return true;
  res.status(429).json({ error: 'Muitas requisições. Espera 1 minuto.' });
  return false;
}
