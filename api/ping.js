// Keep-alive do Supabase: faz uma query mínima na BD 1x/dia (via cron Vercel)
// pra o projeto não pausar por inatividade (plano gratuito pausa após 7 dias).

import { createClient } from '@supabase/supabase-js';
import { rateLimitOrReject } from './_lib/rateLimit.js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYXJkaWdleWJzenVrbndpeG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTM5NzcsImV4cCI6MjA5NTc2OTk3N30.ETMwaGfujbRCwje8L401am6xnM0EX-B1vvb4EFTLUxQ';

export default async function handler(req, res) {
  // 60 pings/min por IP — o suficiente pro cron + uptime robot, bloqueia abuso.
  if (!(await rateLimitOrReject(req, res, { limit: 60, windowMs: 60_000, prefix: 'ping' }))) return;
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Query leve — RLS retorna 0 mas a BD é tocada, o que mantém o projeto ativo.
    const { error } = await sb.from('profiles').select('id', { count: 'exact', head: true });
    if (error) {
      return res.status(200).json({ ok: false, error: error.message });
    }
    return res.status(200).json({ ok: true, pinged_at: new Date().toISOString() });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e?.message || e) });
  }
}
