// Rate limit distribuído (Upstash Redis) com fallback pra memória.
//
// Quando UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estão setadas,
// usa o sliding window do @upstash/ratelimit — funciona entre cold starts,
// múltiplas regiões e múltiplas instâncias.
//
// Sem essas envs, cai pro Map em memória (protege parcialmente).

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const upstashEnabled = !!(UPSTASH_URL && UPSTASH_TOKEN);

let redis = null;
const limiters = new Map(); // cache de Ratelimit por (limit, windowMs, prefix)

if (upstashEnabled) {
  try {
    redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  } catch {
    redis = null;
  }
}

function getLimiter(limit, windowMs, prefix) {
  const key = `${prefix}:${limit}:${windowMs}`;
  let lim = limiters.get(key);
  if (!lim) {
    lim = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
      prefix: `rl:${prefix}`,
      analytics: false,
    });
    limiters.set(key, lim);
  }
  return lim;
}

// ---------- FALLBACK em memória ----------
const buckets = new Map();
function memoryCheck(key, limit, windowMs) {
  const now = Date.now();
  const bucket = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (bucket.length >= limit) return false;
  bucket.push(now);
  buckets.set(key, bucket);
  if (buckets.size > 2000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t > windowMs)) buckets.delete(k);
    }
  }
  return true;
}

function getKey(req) {
  const ip =
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';
  return ip;
}

/**
 * Limita N requisições por janela.
 */
export async function checkRateLimit(req, { limit = 20, windowMs = 60_000, prefix = 'g' } = {}) {
  const ip = getKey(req);
  if (upstashEnabled && redis) {
    try {
      const { success } = await getLimiter(limit, windowMs, prefix).limit(ip);
      return success;
    } catch {
      // Falha do Redis → cai pro fallback
      return memoryCheck(`${prefix}:${ip}`, limit, windowMs);
    }
  }
  return memoryCheck(`${prefix}:${ip}`, limit, windowMs);
}

/**
 * Aplica rate limit e responde 429 se excedeu.
 * Retorna true se a request deve continuar.
 */
export async function rateLimitOrReject(req, res, opts) {
  if (await checkRateLimit(req, opts)) return true;
  res.status(429).json({ error: 'Muitas requisições. Espera 1 minuto.' });
  return false;
}
