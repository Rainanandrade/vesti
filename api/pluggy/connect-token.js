// POST /api/pluggy/connect-token
// Gera um Connect Token efêmero (30min) pro widget Pluggy.
// Passa clientUserId = auth.uid() do Supabase; a Pluggy anexa ao item e
// devolve nos webhooks — assim sabemos a qual usuário o item pertence.

import { setCors } from '../_lib/cors.js';
import { authOrReject } from '../_lib/auth.js';
import { rateLimitOrReject } from '../_lib/rateLimit.js';
import { pluggyFetch } from '../_lib/pluggy.js';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const user = await authOrReject(req, res);
  if (!user) return;

  if (!(await rateLimitOrReject(req, res, { limit: 10, windowMs: 60_000, prefix: 'pluggy-token' }))) return;

  // itemId opcional: quando presente, o widget entra em modo "update" pra corrigir credenciais expiradas
  const itemId = req.body?.itemId ? String(req.body.itemId) : undefined;

  try {
    const body = {
      clientUserId: user.id,
      ...(itemId ? { itemId } : {}),
      options: {
        // Restringe a corretoras/investimentos brasileiros
        products: ['INVESTMENTS', 'ACCOUNTS'],
        countries: ['BR'],
      },
    };

    const r = await pluggyFetch('/connect_token', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      return res.status(502).json({ error: 'Falha ao gerar token Pluggy', detail: txt.slice(0, 300) });
    }
    const data = await r.json();
    return res.status(200).json({ accessToken: data.accessToken });
  } catch (e) {
    return res.status(500).json({ error: 'Erro interno', detail: String(e).slice(0, 300) });
  }
}
