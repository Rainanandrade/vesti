// Handler único Pluggy — roteia por ?action=connect-token|sync|disconnect|webhook
// Consolidado num arquivo só pra caber no limite de 12 funções do plano Hobby.

import { createClient } from '@supabase/supabase-js';
import { setCors } from './_lib/cors.js';
import { authOrReject } from './_lib/auth.js';
import { rateLimitOrReject } from './_lib/rateLimit.js';
import { pluggyFetch } from './_lib/pluggy.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

function admin() {
  if (!SUPABASE_SERVICE_ROLE) throw new Error('SUPABASE_SERVICE_ROLE não configurado');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Mapeamento Pluggy → Vesti asset type ────────────────────────────────────
function mapType(inv) {
  const t = String(inv.type || '').toUpperCase();
  const sub = String(inv.subtype || '').toUpperCase();
  if (t === 'EQUITY' || sub === 'STOCK' || sub === 'BDR') return 'acao';
  if (t === 'MUTUAL_FUND' && sub === 'REAL_ESTATE_FUND') return 'fii';
  if (sub === 'ETF') return 'etf';
  if (t === 'FIXED_INCOME' || sub === 'CDB' || sub === 'LCI' || sub === 'LCA') return 'cdb';
  if (t === 'GOVERNMENT_BOND' || sub === 'TREASURY') return 'tesouro';
  return 'outro';
}

function extractSymbol(inv) {
  return String(inv.code || inv.isin || inv.name || '').toUpperCase().trim().slice(0, 20);
}

async function syncInvestmentsForItem(sb, userId, itemId) {
  const investments = [];
  let page = 1;
  while (true) {
    const r = await pluggyFetch(`/investments?itemId=${encodeURIComponent(itemId)}&pageSize=100&page=${page}`);
    if (!r.ok) throw new Error(`Pluggy /investments falhou: ${r.status}`);
    const data = await r.json();
    investments.push(...(data.results || []));
    if (!data.results || data.results.length < 100) break;
    if (++page > 20) break;
  }

  const { data: wallets } = await sb.from('wallets').select('id').eq('user_id', userId).limit(1);
  let walletId = wallets?.[0]?.id;
  if (!walletId) {
    const { data: created, error } = await sb.from('wallets').insert({ user_id: userId, name: 'Minha carteira' }).select('id').single();
    if (error) throw new Error(`Falha ao criar wallet: ${error.message}`);
    walletId = created.id;
  }

  const bySymbol = new Map();
  for (const inv of investments) {
    const symbol = extractSymbol(inv);
    if (!symbol) continue;
    const qty = Number(inv.balance || inv.quantity || 0);
    if (qty <= 0) continue;
    const value = Number(inv.value || inv.amount || 0);
    const avg = qty > 0 ? value / qty : 0;
    const type = mapType(inv);
    const cur = bySymbol.get(symbol) || { symbol, name: inv.name || symbol, type, qty: 0, weightedAvg: 0 };
    cur.weightedAvg = ((cur.weightedAvg * cur.qty) + (avg * qty)) / (cur.qty + qty);
    cur.qty += qty;
    bySymbol.set(symbol, cur);
  }

  const nowIso = new Date().toISOString();
  const upserts = [];
  for (const a of bySymbol.values()) {
    upserts.push({
      wallet_id: walletId,
      user_id: userId,
      symbol: a.symbol,
      name: a.name,
      type: a.type,
      quantity: a.qty,
      avg_price: Number(a.weightedAvg.toFixed(4)),
      source: 'pluggy',
      pluggy_item_id: itemId,
      last_sync_at: nowIso,
    });
  }

  if (upserts.length > 0) {
    const { error } = await sb.from('assets').upsert(upserts, { onConflict: 'wallet_id,symbol,source' });
    if (error) throw new Error(`Upsert assets falhou: ${error.message}`);
  }

  await sb.from('pluggy_items').update({ last_sync_at: nowIso }).eq('item_id', itemId);
  return { synced: upserts.length };
}

// ─── Ações ───────────────────────────────────────────────────────────────────

async function handleConnectToken(req, res, user) {
  const itemId = req.body?.itemId ? String(req.body.itemId) : undefined;
  const body = {
    clientUserId: user.id,
    ...(itemId ? { itemId } : {}),
    options: { products: ['INVESTMENTS', 'ACCOUNTS'], countries: ['BR'] },
  };
  const r = await pluggyFetch('/connect_token', { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    return res.status(502).json({ error: 'Falha ao gerar token Pluggy', detail: txt.slice(0, 300) });
  }
  const data = await r.json();
  return res.status(200).json({ accessToken: data.accessToken });
}

async function handleSync(req, res, user) {
  const itemId = req.body?.itemId ? String(req.body.itemId) : '';
  if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });
  const sb = admin();
  const { data: row } = await sb.from('pluggy_items').select('user_id').eq('item_id', itemId).single();
  if (!row || row.user_id !== user.id) return res.status(404).json({ error: 'Item não encontrado' });
  try {
    const result = await syncInvestmentsForItem(sb, user.id, itemId);
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(502).json({ error: 'Falha no sync', detail: String(e).slice(0, 300) });
  }
}

async function handleDisconnect(req, res, user) {
  const itemId = req.body?.itemId ? String(req.body.itemId) : '';
  const keepAssets = !!req.body?.keepAssets;
  if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });
  const sb = admin();
  const { data: row } = await sb.from('pluggy_items').select('user_id').eq('item_id', itemId).single();
  if (!row || row.user_id !== user.id) return res.status(404).json({ error: 'Item não encontrado' });
  try {
    await pluggyFetch(`/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  } catch (e) {
    console.warn('[pluggy disconnect] delete falhou:', String(e).slice(0, 200));
  }
  if (keepAssets) {
    await sb.from('assets').update({ source: 'manual', pluggy_item_id: null, last_sync_at: null })
      .eq('pluggy_item_id', itemId).eq('user_id', user.id);
  } else {
    await sb.from('assets').delete().eq('pluggy_item_id', itemId).eq('user_id', user.id);
  }
  await sb.from('pluggy_items').delete().eq('item_id', itemId).eq('user_id', user.id);
  return res.status(200).json({ ok: true });
}

async function handleWebhook(req, res) {
  const body = req.body || {};
  const event = String(body.event || '');
  const itemId = body.itemId || body.item?.id;
  if (!itemId) return res.status(200).json({ ok: true, ignored: 'sem itemId' });

  try {
    const r = await pluggyFetch(`/items/${encodeURIComponent(itemId)}`);
    if (!r.ok) return res.status(200).json({ ok: true, ignored: 'item inválido' });
    const item = await r.json();
    const userId = item.clientUserId;
    if (!userId) return res.status(200).json({ ok: true, ignored: 'sem clientUserId' });

    const sb = admin();
    const record = {
      user_id: userId,
      item_id: itemId,
      connector_id: item.connector?.id ?? null,
      connector_name: item.connector?.name ?? null,
      status: item.status ?? 'UPDATED',
      error_message: item.error?.message ?? null,
      last_sync_at: item.status === 'UPDATED' ? new Date().toISOString() : null,
    };
    const { error } = await sb.from('pluggy_items').upsert(record, { onConflict: 'item_id' });
    if (error) console.error('[pluggy webhook] upsert erro:', error.message);

    if (event.endsWith('/updated') || item.status === 'UPDATED') {
      try { await syncInvestmentsForItem(sb, userId, itemId); }
      catch (e) { console.error('[pluggy webhook] sync erro:', String(e).slice(0, 200)); }
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[pluggy webhook] erro:', String(e).slice(0, 300));
    return res.status(200).json({ ok: false });
  }
}

// ─── Router principal ───────────────────────────────────────────────────────

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = String(req.query?.action || '').toLowerCase();

  // Webhook: sem auth do user (chega da Pluggy)
  if (action === 'webhook') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
    return handleWebhook(req, res);
  }

  // Ações do user autenticado
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });
  const user = await authOrReject(req, res);
  if (!user) return;
  if (!(await rateLimitOrReject(req, res, { limit: 12, windowMs: 60_000, prefix: `pluggy-${action}` }))) return;

  if (action === 'connect-token') return handleConnectToken(req, res, user);
  if (action === 'sync') return handleSync(req, res, user);
  if (action === 'disconnect') return handleDisconnect(req, res, user);

  return res.status(400).json({ error: 'action inválido (use connect-token|sync|disconnect|webhook)' });
}
