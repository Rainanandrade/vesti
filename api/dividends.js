// /api/dividends?symbol=PETR4
// Fonte primária: Status Invest (tem datas FUTURAS confirmadas)
// Fallbacks: brapi, Yahoo (com proxy)

const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '';
const SI_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  Referer: 'https://statusinvest.com.br/',
};

// "DD/MM/YYYY" → "YYYY-MM-DD"
function parseBrDate(s) {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const ETF_LIST = [
  'BOVA11', 'BOVV11', 'SMAL11', 'DIVO11', 'GOLD11', 'FIXA11',
  'IVVB11', 'NASD11', 'WRLD11', 'SPXI11', 'BITH11', 'ETHE11',
];

function categoryGuess(symbol) {
  const s = symbol.toUpperCase();
  if (ETF_LIST.includes(s)) return 'etf';
  if (/^[A-Z]{4}11$/.test(s)) return 'fii';
  return 'acao';
}

async function fromStatusInvest(symbol, category) {
  try {
    const url = `https://statusinvest.com.br/${category}/companytickerprovents?ticker=${symbol}&chartProventsType=2`;
    const r = await fetch(url, { headers: SI_HEADERS });
    if (!r || !r.ok) return { ok: false, reason: `si-${category}-${r?.status}` };
    const txt = await r.text();
    let json;
    try {
      json = JSON.parse(txt);
    } catch {
      return { ok: false, reason: `si-${category}-not-json` };
    }
    const arr = json?.assetEarningsModels;
    if (!Array.isArray(arr) || arr.length === 0) {
      return { ok: false, reason: `si-${category}-empty` };
    }
    const history = arr
      .map((d) => ({
        date: parseBrDate(d.pd) || parseBrDate(d.ed),
        amount: Number(d.v || 0),
        type: d.etd || d.et || 'dividendo',
      }))
      .filter((d) => d.date && d.amount > 0);
    if (history.length === 0) return { ok: false, reason: `si-${category}-parsed-empty` };
    return { ok: true, history };
  } catch (e) {
    return { ok: false, reason: `si-${category}-err-${String(e).slice(0, 40)}` };
  }
}

async function fromStatusInvestProxied(symbol, category) {
  try {
    const target = `https://statusinvest.com.br/${category}/companytickerprovents?ticker=${symbol}&chartProventsType=2`;
    const url = `https://corsproxy.io/?${encodeURIComponent(target)}`;
    const r = await fetch(url, { headers: SI_HEADERS });
    if (!r || !r.ok) return { ok: false, reason: `si-proxy-${category}-${r?.status}` };
    const txt = await r.text();
    let json;
    try {
      json = JSON.parse(txt);
    } catch {
      return { ok: false, reason: `si-proxy-${category}-not-json` };
    }
    const arr = json?.assetEarningsModels;
    if (!Array.isArray(arr) || arr.length === 0) {
      return { ok: false, reason: `si-proxy-${category}-empty` };
    }
    const history = arr
      .map((d) => ({
        date: parseBrDate(d.pd) || parseBrDate(d.ed),
        amount: Number(d.v || 0),
        type: d.etd || d.et || 'dividendo',
      }))
      .filter((d) => d.date && d.amount > 0);
    if (history.length === 0) return { ok: false, reason: `si-proxy-${category}-parsed-empty` };
    return { ok: true, history };
  } catch (e) {
    return { ok: false, reason: `si-proxy-${category}-err-${String(e).slice(0, 40)}` };
  }
}

function diffDays(d1, d2) {
  const a = new Date(d1).getTime();
  const b = new Date(d2).getTime();
  return Math.round(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

function inferNext(history) {
  if (!history || history.length === 0) return null;
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);

  // 1) Se já tem entrada FUTURA confirmada (data > hoje), usa direto
  const future = sorted.filter((d) => d.date > todayIso);
  if (future.length > 0) {
    const next = future[0];
    const recent = sorted.slice(-6);
    const avgAmount = recent.reduce((s, d) => s + d.amount, 0) / recent.length;
    return {
      lastDate: sorted[sorted.length - 1].date,
      lastAmount: sorted[sorted.length - 1].amount,
      averageAmount: avgAmount,
      averageInterval: estimateInterval(sorted),
      nextEstimatedDate: next.date,
      nextEstimatedAmount: next.amount,
      confidence: 'high',
      isConfirmed: true,
      frequency: frequencyFromInterval(estimateInterval(sorted)),
      history: sorted.slice(-12).reverse(),
    };
  }

  // 2) Senão, estima baseado no padrão
  const past = sorted.filter((d) => d.date <= todayIso);
  if (past.length === 0) return null;
  const last = past[past.length - 1];
  const avgInterval = estimateInterval(past);

  const lastDate = new Date(last.date);
  const next = new Date(lastDate);
  next.setDate(next.getDate() + avgInterval);
  while (next < now) next.setDate(next.getDate() + avgInterval);
  const nextIso = next.toISOString().slice(0, 10);

  const recent = past.slice(-6);
  const avgAmount = recent.reduce((s, d) => s + d.amount, 0) / recent.length;

  let confidence = 'low';
  if (past.length >= 6) confidence = 'high';
  else if (past.length >= 3) confidence = 'medium';

  return {
    lastDate: last.date,
    lastAmount: last.amount,
    averageAmount: avgAmount,
    averageInterval: avgInterval,
    nextEstimatedDate: nextIso,
    nextEstimatedAmount: avgAmount,
    confidence,
    isConfirmed: false,
    frequency: frequencyFromInterval(avgInterval),
    history: sorted.slice(-12).reverse(),
  };
}

function estimateInterval(sorted) {
  if (sorted.length < 2) return 30;
  let totalDays = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalDays += diffDays(sorted[i - 1].date, sorted[i].date);
  }
  const avg = Math.round(totalDays / (sorted.length - 1));
  if (avg <= 35) return 30;
  if (avg <= 100) return 90;
  if (avg <= 200) return 180;
  return 365;
}

function frequencyFromInterval(days) {
  if (days <= 35) return 'monthly';
  if (days <= 100) return 'quarterly';
  if (days <= 200) return 'semestral';
  return 'annual';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

  const { symbol, debug } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'symbol é obrigatório' });
  }

  const clean = symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const guessedCat = categoryGuess(clean);
  const allCats = Array.from(new Set([guessedCat, 'fii', 'acao', 'etf']));
  const attempts = [];

  // Status Invest direto — categoria provável primeiro
  let result = null;
  for (const cat of allCats) {
    const r = await fromStatusInvest(clean, cat);
    attempts.push({ source: `si-${cat}`, ok: r.ok, reason: r.reason });
    if (r.ok) {
      result = r;
      break;
    }
  }

  // Status Invest via corsproxy
  if (!result) {
    for (const cat of allCats) {
      const r = await fromStatusInvestProxied(clean, cat);
      attempts.push({ source: `si-proxy-${cat}`, ok: r.ok, reason: r.reason });
      if (r.ok) {
        result = r;
        break;
      }
    }
  }

  if (!result || !result.history || result.history.length === 0) {
    const payload = { error: 'Sem histórico disponível' };
    if (debug === '1') payload.attempts = attempts;
    return res.status(404).json(payload);
  }

  const inferred = inferNext(result.history);
  if (!inferred) return res.status(404).json({ error: 'Sem dados suficientes' });

  return res.status(200).json({
    ...inferred,
    symbol: clean,
    source: attempts.find((a) => a.ok)?.source || 'unknown',
    ...(debug === '1' ? { attempts } : {}),
  });
}
