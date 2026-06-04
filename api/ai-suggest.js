// /api/ai-suggest — POST com {amount, profile, currentAssets}
// 1) Pré-busca cotações e fundamentos dos tickers candidatos
// 2) Passa pra IA Groq (Llama 3.3 70B) como contexto curado
// 3) IA escolhe dos tickers fornecidos (sem alucinar)

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';

// Ativos curados — IA só pode escolher destes
const CURATED = {
  renda_fixa_options: [
    { symbol: 'Tesouro Selic', name: 'Tesouro Selic', note: 'Liquidez diária, 100% Selic, mais seguro do país.' },
    { symbol: 'Tesouro IPCA+ 2029', name: 'Tesouro IPCA+ 2029', note: 'IPCA + taxa fixa, vencimento médio.' },
    { symbol: 'Tesouro IPCA+ 2035', name: 'Tesouro IPCA+ 2035', note: 'IPCA + taxa fixa, longo prazo.' },
    { symbol: 'Tesouro IPCA+ 2045', name: 'Tesouro IPCA+ 2045', note: 'IPCA + maior taxa fixa, ideal aposentadoria.' },
    { symbol: 'CDB 110% CDI', name: 'CDB 110% CDI', note: 'Banco grande com FGC, prazo de carência.' },
    { symbol: 'CDB liquidez diária', name: 'CDB 100% CDI', note: 'Resgate a qualquer momento, FGC.' },
    { symbol: 'LCI 95% CDI', name: 'LCI imobiliária', note: 'Isenta de IR, lastro imobiliário.' },
    { symbol: 'LCA 95% CDI', name: 'LCA do agronegócio', note: 'Isenta de IR, lastro agro.' },
  ],
  renda_variavel: [
    'BOVA11', 'SMAL11', 'DIVO11',
    'MXRF11', 'KNCR11', 'KNRI11', 'HGLG11', 'BTLG11', 'XPLG11', 'XPML11', 'VISC11', 'BCFF11',
    'ITSA4', 'BBSE3', 'ITUB4', 'BBAS3', 'TAEE11', 'TRPL4', 'EGIE3', 'VIVT3', 'CPLE6',
    'WEGE3', 'TOTS3', 'RDOR3', 'RAIL3', 'B3SA3', 'EQTL3', 'LREN3', 'EMBR3',
    'PETR4', 'VALE3', 'PRIO3', 'SUZB3', 'GGBR4', 'JBSS3',
    'POSI3',
  ],
  internacional: ['IVVB11', 'NASD11', 'WRLD11', 'SPXI11', 'BITH11'],
};

async function fetchQuoteAndFundamentals(symbol) {
  if (!BRAPI_TOKEN) return { symbol };
  try {
    const url = `https://brapi.dev/api/quote/${symbol}?token=${BRAPI_TOKEN}`;
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return { symbol };
    const json = await r.json();
    const q = json?.results?.[0];
    if (!q) return { symbol };
    return {
      symbol,
      name: q.longName || q.shortName || symbol,
      price: q.regularMarketPrice,
      dy: q.dividendYield != null ? Number((q.dividendYield * 100).toFixed(2)) : undefined,
      pl: q.priceEarnings,
      change: q.regularMarketChangePercent,
    };
  } catch {
    return { symbol };
  }
}

function buildContextDocument(rvData, intlData) {
  let doc = 'ATIVOS DISPONÍVEIS — você só pode escolher DESTA lista:\n\n';

  doc += '### RENDA FIXA (sem ticker da bolsa — escolha 1 a 2 opções):\n';
  CURATED.renda_fixa_options.forEach((o) => {
    doc += `- "${o.symbol}" (${o.name}): ${o.note}\n`;
  });

  doc += '\n### RENDA VARIÁVEL — Ações, FIIs, ETFs (com dados atuais):\n';
  rvData.forEach((a) => {
    if (a.price) {
      doc += `- ${a.symbol} (${a.name}): R$ ${a.price.toFixed(2)}`;
      if (a.dy && a.dy > 0) doc += ` | DY ${a.dy}%`;
      if (a.pl && a.pl > 0) doc += ` | P/L ${a.pl.toFixed(1)}`;
      doc += '\n';
    } else {
      doc += `- ${a.symbol}: cotação indisponível\n`;
    }
  });

  doc += '\n### INTERNACIONAL — ETFs globais (com dados atuais):\n';
  intlData.forEach((a) => {
    if (a.price) {
      doc += `- ${a.symbol} (${a.name}): R$ ${a.price.toFixed(2)}`;
      if (a.dy && a.dy > 0) doc += ` | DY ${a.dy}%`;
      doc += '\n';
    } else {
      doc += `- ${a.symbol}: cotação indisponível\n`;
    }
  });

  return doc;
}

const SYSTEM_PROMPT = `Você é um assessor financeiro brasileiro especializado em ajudar pessoas a investir bem. Sua função é distribuir um aporte de forma estratégica.

RESPONDA APENAS EM JSON VÁLIDO seguindo este schema EXATO:

{
  "summary": "1-2 frases explicando a estratégia geral pro aporte",
  "picks": [
    {
      "classKey": "renda_fixa" | "renda_variavel" | "internacional",
      "classLabel": "Renda Fixa" | "Renda Variável" | "Internacional",
      "role": "qual é o papel desta escolha (ex: ETF amplo, FII de papel, Ação de crescimento, Proteção real)",
      "symbol": "TICKER ou nome exato do produto de renda fixa",
      "name": "nome completo do ativo",
      "amount": NUMERO em reais (não use string),
      "reasoning": "2-3 frases dizendo POR QUE esse ativo combina com o usuário, citando DY, P/L ou características reais quando disponíveis"
    }
  ]
}

REGRAS OBRIGATÓRIAS:
1. A SOMA dos amounts DEVE SER IGUAL ao valor total do aporte (sem sobra, sem falta)
2. Use APENAS os tickers/produtos fornecidos na lista de ATIVOS DISPONÍVEIS — NÃO invente outros
3. Distribua respeitando a estratégia do perfil (% RF, RV, Internacional)
4. Inclua entre 3 e 6 picks, diversificados entre as classes
5. Para renda fixa, copie EXATAMENTE o nome fornecido (ex: "Tesouro Selic", "CDB 110% CDI")
6. Para RV/Internacional, use o TICKER exato (PETR4, MXRF11, etc.) no campo "symbol"
7. Para reasoning, cite NÚMEROS REAIS quando disponíveis (DY, P/L, preço)
8. Sem markdown, sem comentários, sem texto fora do JSON
9. Use português do Brasil`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  if (!GROQ_API_KEY) {
    return res.status(503).json({
      error: 'IA não configurada. Adicione GROQ_API_KEY no Vercel.',
    });
  }

  const { amount, profile, currentAssets, brokers } = req.body || {};
  if (!amount || !profile) {
    return res.status(400).json({ error: 'amount e profile são obrigatórios' });
  }

  // Pré-busca dados reais (rápido, em paralelo)
  const [rvData, intlData] = await Promise.all([
    Promise.all(CURATED.renda_variavel.map(fetchQuoteAndFundamentals)),
    Promise.all(CURATED.internacional.map(fetchQuoteAndFundamentals)),
  ]);

  const contextDoc = buildContextDocument(rvData, intlData);

  const userMessage = `${contextDoc}

---

APORTE: R$ ${amount}

PERFIL DO INVESTIDOR:
- Tipo: ${profile.type}
- Estratégia alvo: ${profile.strategy.renda_fixa}% renda fixa, ${profile.strategy.renda_variavel}% renda variável, ${profile.strategy.internacional}% internacional
- Descrição: ${profile.description}
${
  Array.isArray(brokers) && brokers.length > 0
    ? `
CORRETORAS DO USUÁRIO (pode ter mais de uma — recomende em qual delas comprar cada ativo):
${brokers.map((b) => `- ${b.name}: ${b.limitations}`).join('\n')}

IMPORTANTE: No reasoning de cada pick, mencione em QUAL dessas corretoras é melhor comprar (ex: "compre no Nubank", "use a Nomad pra esse"). Respeite as limitações.`
    : ''
}

CARTEIRA ATUAL:
${
  Array.isArray(currentAssets) && currentAssets.length > 0
    ? currentAssets
        .map((a) => `- ${a.symbol} (${a.type}): ${a.quantity} unidades a R$ ${a.avgPrice}/un`)
        .join('\n')
    : '(vazia — esta é a primeira alocação)'
}

Distribua R$ ${amount} entre 3-6 ativos da lista acima. A soma dos amounts deve ser exatamente R$ ${amount}.
Diversifique respeitando o perfil. Cite números reais (DY, P/L, preço) no reasoning quando disponíveis.`;

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: `Erro Groq: ${text.slice(0, 300)}` });
    }

    const json = await r.json();
    const content = json?.choices?.[0]?.message?.content;
    if (!content) return res.status(502).json({ error: 'Resposta vazia da IA' });

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(502).json({ error: 'IA retornou JSON inválido' });
    }

    // Validação: corrige soma se IA errou matemática
    if (Array.isArray(parsed.picks)) {
      const totalPicked = parsed.picks.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      if (Math.abs(totalPicked - amount) > 0.5) {
        // Reescala proporcional pra somar exato
        parsed.picks = parsed.picks.map((p) => ({
          ...p,
          amount: Math.round(((Number(p.amount) || 0) * amount) / totalPicked * 100) / 100,
        }));
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
