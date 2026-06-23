// /api/ai-diagnostic — POST com {profile, assets, totals, dividendos}
// Resposta em texto livre (markdown leve), análise diagnóstica da carteira
// inteira: pontos fortes, fracos, concentração, sugestões.

import { authOrReject } from './_lib/auth.js';
import { setCors } from './_lib/cors.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';
import { checkBodySize, sanitizeProfile, sanitizeAssets, sanitizeString, sanitizeNumber } from './_lib/validate.js';
import { fetchWithTimeout } from './_lib/fetch.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const SYSTEM_PROMPT = `Você é um assessor financeiro brasileiro experiente, didático e direto.
Seu papel é fazer o DIAGNÓSTICO DA CARTEIRA do usuário com base nos dados que receber.

ESTRUTURA da resposta (sempre nessa ordem, com cabeçalhos):

1. 🩺 Saúde geral — 2-3 frases avaliando a carteira como um todo.
2. ✅ Pontos fortes — 3 a 4 bullets curtos (ações concretas que estão BEM feitas).
3. ⚠️ Riscos e pontos fracos — 3 a 4 bullets concretos (concentração setorial, falta de internacional, peso em renda fixa, dependência de 1 ativo, etc.).
4. 🎯 Próximos passos — 3 a 5 ações práticas e específicas (com tickers reais quando fizer sentido).
5. 💬 Mensagem final — 1 parágrafo motivacional baseado no perfil do investidor.

REGRAS:
- Português brasileiro, tom amigável mas respeitoso.
- Cite NÚMEROS reais que você recebeu (% de cada ativo, DY da carteira, etc.).
- Quando sugerir um ativo, prefira tickers já presentes no mercado BR (PETR4, ITUB4, MXRF11, BOVA11, IVVB11, TAEE11, etc.).
- NÃO use markdown pesado (sem tabelas, sem **). Use só os cabeçalhos com emoji e bullets simples começando com "- ".
- Máximo ~500 palavras. Vai direto ao ponto.
- NÃO peça desculpa por nada. NÃO diga "vou fazer". FAÇA.
- Lembre o usuário: você não é conselho de investimento; é uma análise educativa.`;

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  if (!checkBodySize(req, res)) return;
  if (!rateLimitOrReject(req, res, { limit: 10, windowMs: 60_000, prefix: 'ai-diag' })) return;

  const user = await authOrReject(req, res);
  if (!user) return;

  if (!GROQ_API_KEY) {
    return res.status(503).json({
      error: 'IA não configurada. Adicione GROQ_API_KEY no Vercel.',
    });
  }

  const rawBody = req.body || {};
  const profile = sanitizeProfile(rawBody.profile);
  if (!profile) return res.status(400).json({ error: 'profile inválido' });
  const assets = sanitizeAssets(rawBody.assets);
  const totals = {
    totalCurrent: sanitizeNumber(rawBody.totals?.totalCurrent),
    totalInvested: sanitizeNumber(rawBody.totals?.totalInvested),
    profitPct: sanitizeNumber(rawBody.totals?.profitPct, { min: -100, max: 10000 }),
  };
  const dividendos = {
    ytdReceived: sanitizeNumber(rawBody.dividendos?.ytdReceived),
    weightedDY: sanitizeNumber(rawBody.dividendos?.weightedDY, { min: 0, max: 100 }),
  };
  const question = sanitizeString(rawBody.question, 600);

  const assetsLines = assets.length === 0
    ? '(carteira vazia)'
    : assets
        .map((a) => {
          const pct = totals.totalCurrent > 0 ? ((a.currentValue / totals.totalCurrent) * 100).toFixed(1) : '0';
          return `- ${a.symbol} (${a.type}) · ${a.quantity} cotas · R$ ${a.currentValue?.toFixed(2) || '0'} (${pct}% da carteira) · L/P ${a.profitPct?.toFixed(2) || '0'}%`;
        })
        .join('\n');

  const userMessage = `PERFIL DO INVESTIDOR:
- Tipo: ${profile.type}
- Preferência: ${profile.preference || 'sem_preferencia'}
- Estratégia alvo: RF ${profile.strategy?.renda_fixa || 0}% · RV ${profile.strategy?.renda_variavel || 0}% · Internacional ${profile.strategy?.internacional || 0}%

TOTAIS:
- Patrimônio atual: R$ ${(totals.totalCurrent || 0).toFixed(2)}
- Investido: R$ ${(totals.totalInvested || 0).toFixed(2)}
- L/P: ${(totals.profitPct || 0).toFixed(2)}%
- Dividendos recebidos YTD: R$ ${(dividendos.ytdReceived || 0).toFixed(2)}
- DY ponderado da carteira: ${(dividendos.weightedDY || 0).toFixed(2)}%

CARTEIRA:
${assetsLines}

${question ? `O usuário tem uma pergunta específica adicional: "${question}". Responda essa pergunta NO FINAL, depois do diagnóstico.` : 'Faça o diagnóstico completo da carteira seguindo a estrutura definida.'}`;

  try {
    const r = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `Erro Groq: ${text.slice(0, 300)}` });
    }

    const json = await r.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'Resposta vazia da IA' });

    return res.status(200).json({ diagnostic: content });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
