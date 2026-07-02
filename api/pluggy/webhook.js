// POST /api/pluggy/webhook
// Recebe eventos da Pluggy (item/created, item/updated, item/error, etc.)
// Não usamos signing secret — validamos re-consultando o itemId na Pluggy.
// Se a Pluggy retornar 200 e o clientUserId bater com o registro que temos,
// atualizamos pluggy_items e disparamos sync interno.

import { createClient } from '@supabase/supabase-js';
import { pluggyFetch } from '../_lib/pluggy.js';
import { syncInvestmentsForItem } from './_sync.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';

function supabaseAdmin() {
  if (!SUPABASE_SERVICE_ROLE) {
    throw new Error('SUPABASE_SERVICE_ROLE não configurado — necessário pro webhook escrever bypass RLS');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const body = req.body || {};
  const event = String(body.event || '');
  const itemId = body.itemId || body.item?.id;

  if (!itemId) {
    // Evento sem itemId (ex: connector/updated) — só reconhece e sai
    return res.status(200).json({ ok: true, ignored: 'sem itemId' });
  }

  try {
    // Valida re-consultando o item na Pluggy
    const r = await pluggyFetch(`/items/${encodeURIComponent(itemId)}`);
    if (!r.ok) {
      // Item inexistente ou não pertence à nossa aplicação — ignora
      return res.status(200).json({ ok: true, ignored: 'item inválido' });
    }
    const item = await r.json();
    const userId = item.clientUserId; // que passamos no connect-token
    if (!userId) {
      return res.status(200).json({ ok: true, ignored: 'sem clientUserId' });
    }

    const sb = supabaseAdmin();

    // Upsert do pluggy_items
    const record = {
      user_id: userId,
      item_id: itemId,
      connector_id: item.connector?.id ?? null,
      connector_name: item.connector?.name ?? null,
      status: item.status ?? 'UPDATED',
      error_message: item.error?.message ?? null,
      last_sync_at: item.status === 'UPDATED' ? new Date().toISOString() : null,
    };
    const { error: upsertErr } = await sb
      .from('pluggy_items')
      .upsert(record, { onConflict: 'item_id' });
    if (upsertErr) {
      // Loga mas não falha o webhook — Pluggy re-tenta em falha 5xx e não queremos loops
      console.error('[pluggy webhook] upsert erro:', upsertErr.message);
    }

    // Se item ficou UPDATED, dispara sync de investimentos
    if (event.endsWith('/updated') || item.status === 'UPDATED') {
      try {
        await syncInvestmentsForItem({ sb, userId, itemId });
      } catch (e) {
        console.error('[pluggy webhook] sync erro:', String(e).slice(0, 200));
      }
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[pluggy webhook] erro:', String(e).slice(0, 300));
    // Retorna 200 mesmo em erro interno pra Pluggy não re-tentar em loop
    return res.status(200).json({ ok: false, error: 'erro interno' });
  }
}
