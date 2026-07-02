// Sync de investimentos: puxa /investments?itemId=X da Pluggy, mapeia pra Asset
// do Vesti e upserta no Supabase. Usa Service Role (bypass RLS) porque o webhook
// não tem contexto de auth.

import { pluggyFetch } from '../_lib/pluggy.js';

// Mapeia o campo `type` da Pluggy pro nosso enum de asset type
function mapPluggyTypeToVesti(inv) {
  const t = String(inv.type || '').toUpperCase();
  const sub = String(inv.subtype || '').toUpperCase();
  if (t === 'EQUITY' || sub === 'STOCK' || sub === 'BDR') return 'acao';
  if (t === 'MUTUAL_FUND' && sub === 'REAL_ESTATE_FUND') return 'fii';
  if (sub === 'ETF') return 'etf';
  if (t === 'FIXED_INCOME' || sub === 'CDB' || sub === 'LCI' || sub === 'LCA') return 'cdb';
  if (t === 'GOVERNMENT_BOND' || sub === 'TREASURY') return 'tesouro';
  return 'outro';
}

// Extrai um símbolo (ticker) da Pluggy. Alguns brokers já retornam em `code`
function extractSymbol(inv) {
  return String(inv.code || inv.isin || inv.name || '').toUpperCase().trim().slice(0, 20);
}

/**
 * Sincroniza um item.
 * @param {Object} p
 * @param {SupabaseClient} p.sb - client Supabase (service role)
 * @param {string} p.userId
 * @param {string} p.itemId
 */
export async function syncInvestmentsForItem({ sb, userId, itemId }) {
  // 1) Buscar investimentos na Pluggy (paginação simples)
  const investments = [];
  let page = 1;
  while (true) {
    const r = await pluggyFetch(`/investments?itemId=${encodeURIComponent(itemId)}&pageSize=100&page=${page}`);
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      throw new Error(`Pluggy /investments falhou: ${r.status} ${txt.slice(0, 200)}`);
    }
    const data = await r.json();
    investments.push(...(data.results || []));
    if (!data.results || data.results.length < 100) break;
    page++;
    if (page > 20) break; // safety net
  }

  // 2) Descobrir wallet do usuário — usa a primeira ou cria "Sincronizado" se não tiver
  const { data: wallets } = await sb.from('wallets').select('id').eq('user_id', userId).limit(1);
  let walletId = wallets?.[0]?.id;
  if (!walletId) {
    const { data: created, error } = await sb
      .from('wallets')
      .insert({ user_id: userId, name: 'Minha carteira' })
      .select('id')
      .single();
    if (error) throw new Error(`Falha ao criar wallet: ${error.message}`);
    walletId = created.id;
  }

  // 3) Upsertar cada asset (agrega por símbolo somando quantidades entre contas)
  const bySymbol = new Map();
  for (const inv of investments) {
    const symbol = extractSymbol(inv);
    if (!symbol) continue;
    const qty = Number(inv.balance || inv.quantity || 0);
    if (qty <= 0) continue;
    const value = Number(inv.value || inv.amount || 0);
    const avg = qty > 0 ? value / qty : 0;
    const type = mapPluggyTypeToVesti(inv);

    const cur = bySymbol.get(symbol) || { symbol, name: inv.name || symbol, type, qty: 0, weightedAvg: 0 };
    // Média ponderada de preço médio
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
    const { error } = await sb
      .from('assets')
      .upsert(upserts, { onConflict: 'wallet_id,symbol,source' });
    if (error) throw new Error(`Upsert assets falhou: ${error.message}`);
  }

  // 4) Marca last_sync_at no pluggy_items
  await sb.from('pluggy_items').update({ last_sync_at: nowIso }).eq('item_id', itemId);

  return { synced: upserts.length };
}
