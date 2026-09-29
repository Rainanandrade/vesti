import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYXJkaWdleWJzenVrbndpeG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTM5NzcsImV4cCI6MjA5NTc2OTk3N30.ETMwaGfujbRCwje8L401am6xnM0EX-B1vvb4EFTLUxQ';

export function hasActivePaidEntitlement(profile, now = Date.now()) {
  if (!profile?.mercadopago_subscription_id || !profile?.pro_expires_at) return false;
  const expiresAt = Date.parse(profile.pro_expires_at);
  return Number.isFinite(expiresAt) && expiresAt > now;
}

export async function paidEntitlementOrReject(req, res, user) {
  const authorization = req.headers?.authorization || req.headers?.Authorization || '';
  if (!SUPABASE_ANON_KEY || !authorization) {
    res.status(503).json({ error: 'Não foi possível validar o plano agora.' });
    return false;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from('profiles')
    .select('mercadopago_subscription_id, pro_expires_at')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[entitlement] profile lookup failed');
    res.status(503).json({ error: 'Não foi possível validar o plano agora.' });
    return false;
  }
  if (!hasActivePaidEntitlement(data)) {
    res.status(403).json({
      error: 'Recurso exclusivo do plano Pro ativo.',
      code: 'PRO_REQUIRED',
    });
    return false;
  }
  return true;
}
