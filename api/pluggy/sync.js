// POST /api/pluggy/sync  { itemId }
// User dispara sync manual do item conectado. Valida que o item pertence ao user.

import { createClient } from '@supabase/supabase-js';
import { setCors } from '../_lib/cors.js';
import { authOrReject } from '../_lib/auth.js';
import { rateLimitOrReject } from '../_lib/rateLimit.js';
import { syncInvestmentsForItem } from './_sync.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const user = await authOrReject(req, res);
  if (!user) return;
  if (!(await rateLimitOrReject(req, res, { limit: 6, windowMs: 60_000, prefix: 'pluggy-sync' }))) return;

  const itemId = req.body?.itemId ? String(req.body.itemId) : '';
  if (!itemId) return res.status(400).json({ error: 'itemId obrigatório' });

  if (!SUPABASE_SERVICE_ROLE) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE não configurado' });
  }
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verifica que o item pertence ao user autenticado
  const { data: row } = await sb
    .from('pluggy_items')
    .select('user_id')
    .eq('item_id', itemId)
    .single();
  if (!row || row.user_id !== user.id) {
    return res.status(404).json({ error: 'Item não encontrado' });
  }

  try {
    const result = await syncInvestmentsForItem({ sb, userId: user.id, itemId });
    return res.status(200).json({ ok: true, ...result });
  } catch (e) {
    return res.status(502).json({ error: 'Falha no sync', detail: String(e).slice(0, 300) });
  }
}
