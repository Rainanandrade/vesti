// /api/ai-consultor — POST com { assets, quotes, dividends, snapshots, profile, question? }
// IA analisa a carteira do usuário e responde perguntas ou dá análise mensal.

import { authOrReject } from './_lib/auth.js';
import { setCors } from './_lib/cors.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';
import { fetchWithTimeout } from './_lib/fetch.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const MODEL = 'llama-3.3-70b-versatile';

function summarizeAssets(assets = [], quotes = {}, dividends = {}) {
  const byType = {};
  let totalValue = 0;
  let totalInvested = 0;

  for (const a of assets) {
    const price = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
    const value = price * a.quantity;
    const invested = a.avgPrice * a.quantity;
    totalValue += value;
    totalInvested += invested;
    byType[a.type] = (byType[a.type] || 0) + value;
  }

  const top = [...assets].map((a) => {
    const price = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
    const value = price * a.quantity;
    const rent = a.avgPrice > 0 ? ((price - a.avgPrice) / a.avgPrice) * 100 : 0;
    const info = dividends[a.symbol];
    const dyEst = info?.averageAmount && info?.frequency
      ? ((info.averageAmount * ({ monthly: 12, quarterly: 4, semestral: 2, annual: 1 }[info.frequency] || 12)) / price) * 100
      : null;
    return { symbol: a.symbol, type: a.type, valueBRL: value, weightPct: 0, rentPct: rent, dyEst };
  });
  top.forEach((x) => (x.weightPct = totalValue > 0 ? (x.valueBRL / totalValue) * 100 : 0));
  top.sort((a, b) => b.valueBRL - a.valueBRL);

  const alloc = {};
  Object.keys(byType).forEach((t) => {
    alloc[t] = totalValue > 0 ? (byType[t] / totalValue) * 100 : 0;
  });

  return {
    totalValueBRL: Math.round(totalValue * 100) / 100,
    totalInvestedBRL: Math.round(totalInvested * 100) / 100,
    profitPct: totalInvested > 0 ? ((totalValue - totalInvested) / totalInvested) * 100 : 0,
    allocationByTypePct: alloc,
    assets: top.slice(0, 20).map((x) => ({
      symbol: x.symbol,
      type: x.type,
      weightPct: Math.round(x.weightPct * 10) / 10,
      rentPct: Math.round(x.rentPct * 10) / 10,
      dyPct: x.dyEst ? Math.round(x.dyEst * 10) / 10 : null,
    })),
  };
}

function buildSystemPrompt() {
  return `Você é um consultor de investimentos brasileiro experiente, focado em renda passiva e dividendos, falando com o próprio investidor.

REGRAS:
- Responda em português brasileiro, tom próximo e claro (sem termos rebuscados).
- Base sua análise NOS DADOS FORNECIDOS no user prompt. Não invente números.
- Não recomende compra específica com "certeza" — sempre trate como sugestão.
- Não faz garantia de retorno.
- Comente concentração de setor, DY, alocação, risco.
- Se perguntarem algo fora de investimentos, redirecione politicamente pra carteira.

FORMATO da resposta:
- 3 a 5 parágrafos curtos.
- Use ✅ pra pontos positivos, ⚠️ pra alertas, 💡 pra ideias de aporte.
- Termine com um resumo de 1 linha destacado.`;
}

function buildUserPrompt(summary, profile, question) {
  const q = question?.trim() ? `\n\nPERGUNTA DO USUÁRIO: ${question.slice(0, 300)}` : '\n\nDê uma análise geral da carteira, apontando pontos fortes, fracos e sugerindo próximos aportes.';
  return `Perfil do investidor: ${JSON.stringify(profile || {}).slice(0, 500)}

Situação atual da carteira:
${JSON.stringify(summary, null, 2)}
${q}`;
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const user = await authOrReject(req, res);
  if (!user) return;
  if (!(await rateLimitOrReject(req, res, { limit: 8, windowMs: 60_000, prefix: 'ai-cons' }))) return;

  if (!GROQ_API_KEY) return res.status(500).json({ error: 'IA não configurada (GROQ_API_KEY ausente)' });

  const { assets = [], quotes = {}, dividends = {}, profile, question } = req.body || {};
  if (!Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ error: 'Carteira vazia — adicione ativos pra receber análise.' });
  }

  const summary = summarizeAssets(assets, quotes, dividends);

  try {
    const groqResp = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          { role: 'user', content: buildUserPrompt(summary, profile, question) },
        ],
      }),
    });
    if (!groqResp.ok) {
      const txt = await groqResp.text().catch(() => '');
      return res.status(502).json({ error: 'Falha na IA', detail: txt.slice(0, 200) });
    }
    const data = await groqResp.json();
    const answer = data?.choices?.[0]?.message?.content?.trim() || 'Sem resposta.';
    return res.status(200).json({ answer, summaryUsed: summary });
  } catch (e) {
    return res.status(500).json({ error: 'Erro ao consultar IA', detail: String(e).slice(0, 200) });
  }
}
