// Validação de JWT do Supabase nos endpoints sensíveis.
// Retorna o user se o token for válido, ou null.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://ihardigeybszuknwixnd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloYXJkaWdleWJzenVrbndpeG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTM5NzcsImV4cCI6MjA5NTc2OTk3N30.ETMwaGfujbRCwje8L401am6xnM0EX-B1vvb4EFTLUxQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Lê o header Authorization e valida o JWT contra o Supabase.
 * Retorna { user } se válido ou null.
 */
export async function requireAuth(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = String(header).replace(/^Bearer\s+/i, '');
  if (!token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Atalho que escreve 401 caso o JWT não exista/seja inválido.
 * Use no início do handler: `const user = await authOrReject(req, res); if (!user) return;`
 */
export async function authOrReject(req, res) {
  const user = await requireAuth(req);
  if (!user) {
    res.status(401).json({ error: 'Não autenticado. Faça login pra usar essa funcionalidade.' });
    return null;
  }
  return user;
}
