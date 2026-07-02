// POST /api/pluggy/disconnect  { itemId, keepAssets?: boolean }
// Desconecta a corretora: apaga item na Pluggy, remove pluggy_items.
// Se keepAssets=true, converte assets sincronizados em manual; caso contrário, apaga.

import { createClient } from '@supabase/supabase-js';
import { setCors } from '../_lib/cors.js';
import { authOrReject } from '../_lib/auth.js';
import { rateLimitOrReject } from '../_lib/rateLimit.js';
import { pluggyFetch } from '../_lib/pluggy.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const user = await authOrReject(req, res);
  if (!user) return;
  if (!(await rateLimitOrReject(req, res, { limit: 6, windowMs: 60_000, prefix: 'pluggy-disconnect' }))) return;

  const itemId = req.body?.itemId ? String(req.body.itemId) : '';
  const keepAssets = !!req.body?.keepAssets;
  if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });

  if (!SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE não configurado' });
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Confirma ownership
  const { data: row } = await sb
    .from('pluggy_items')
    .select('user_id')
    .eq('item_id', itemId)
    .single();
  if (!row || row.user_id !== user.id) {
    return res.status(404).json({ error: 'Item não encontrado' });
  }

  // 1) Apaga na Pluggy (idempotente — ignora 404)
  try {
    await pluggyFetch(`/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  } catch (e) {
    // Segue mesmo se Pluggy falhar — user quer desconectar de qualquer forma
    console.warn('[pluggy disconnect] delete falhou:', String(e).slice(0, 200));
  }

  // 2) Trata assets
  if (keepAssets) {
    // Converte pra manual (perde o link, vira "cadastro do user")
    await sb
      .from('assets')
      .update({ source: 'manual', pluggy_item_id: null, last_sync_at: null })
      .eq('pluggy_item_id', itemId)
      .eq('user_id', user.id);
  } else {
    await sb.from('assets').delete().eq('pluggy_item_id', itemId).eq('user_id', user.id);
  }

  // 3) Remove o registro do item
  await sb.from('pluggy_items').delete().eq('item_id', itemId).eq('user_id', user.id);

  return res.status(200).json({ ok: true });
}
