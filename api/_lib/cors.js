// CORS restrito — só permite chamadas do domínio de produção e de dev local.
// Apps nativos (iOS/Android) NÃO mandam Origin, então passam sem checagem.

const ALLOWED_ORIGINS = [
  'https://vesti-nine.vercel.app',
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:19000',
];

export function setCors(req, res) {
  const origin = req.headers?.origin;
  if (!origin) {
    // Sem Origin = chamada nativa (iOS/Android) ou server-side — libera
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    // Origem desconhecida — bloqueia
    res.setHeader('Access-Control-Allow-Origin', 'https://vesti-nine.vercel.app');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
