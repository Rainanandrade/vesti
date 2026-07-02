// Cliente Pluggy compartilhado — cacheia API key (2h TTL) e expõe fetchWithAuth.
// Documentação: https://docs.pluggy.ai/reference

const PLUGGY_BASE = 'https://api.pluggy.ai';

const CLIENT_ID = process.env.PLUGGY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET || '';

const API_KEY_TTL_MS = 2 * 60 * 60 * 1000; // 2h — key expira em 2h na Pluggy
let apiKeyCache = { key: null, expiresAt: 0 };

async function requestNewApiKey() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('PLUGGY_CLIENT_ID/PLUGGY_CLIENT_SECRET não configurados no ambiente');
  }
  const r = await fetch(`${PLUGGY_BASE}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`Pluggy auth falhou (${r.status}): ${txt}`);
  }
  const data = await r.json();
  apiKeyCache = { key: data.apiKey, expiresAt: Date.now() + API_KEY_TTL_MS };
  return data.apiKey;
}

export async function getPluggyApiKey() {
  if (apiKeyCache.key && apiKeyCache.expiresAt > Date.now() + 60_000) return apiKeyCache.key;
  return requestNewApiKey();
}

export async function pluggyFetch(path, opts = {}) {
  const apiKey = await getPluggyApiKey();
  const url = path.startsWith('http') ? path : `${PLUGGY_BASE}${path}`;
  const r = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
      ...(opts.headers || {}),
    },
  });
  if (r.status === 401) {
    // Cache expirou entre chamadas — tenta uma vez com key nova
    apiKeyCache = { key: null, expiresAt: 0 };
    const apiKey2 = await getPluggyApiKey();
    const r2 = await fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey2, ...(opts.headers || {}) },
    });
    return r2;
  }
  return r;
}
