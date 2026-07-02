import { supabase } from '../services/supabase';

export type AlertKind = 'price_above' | 'price_below' | 'datacom' | 'concentration' | 'dividend_drop';

export type Alert = {
  id: string;
  kind: AlertKind;
  symbol: string | null;
  threshold: number | null;
  active: boolean;
  triggeredAt: number | null;
  message: string | null;
  createdAt: number;
};

function fromRow(r: any): Alert {
  return {
    id: r.id,
    kind: r.kind,
    symbol: r.symbol,
    threshold: r.threshold != null ? Number(r.threshold) : null,
    active: !!r.active,
    triggeredAt: r.triggered_at ? new Date(r.triggered_at).getTime() : null,
    message: r.message,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export async function listAlerts(): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(fromRow);
}

export async function createAlert(input: {
  kind: AlertKind;
  symbol?: string;
  threshold?: number;
}): Promise<Alert> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) throw new Error('Não autenticado');
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      user_id: uid,
      kind: input.kind,
      symbol: input.symbol ?? null,
      threshold: input.threshold ?? null,
      active: true,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message || 'Falha ao criar alerta');
  return fromRow(data);
}

export async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase.from('alerts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function toggleAlert(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('alerts').update({ active }).eq('id', id);
  if (error) throw new Error(error.message);
}

/**
 * Verifica alertas de preço vs cotações e retorna os que devem disparar agora.
 * Client-side: chamado quando o app carrega o Dashboard.
 */
export function checkPriceAlerts(
  alerts: Alert[],
  quotes: Record<string, { regularMarketPrice: number }>,
): Alert[] {
  const now = Date.now();
  const RECENT_MS = 6 * 60 * 60 * 1000; // 6h — não dispara 2x no mesmo dia
  return alerts.filter((a) => {
    if (!a.active) return false;
    if (a.triggeredAt && now - a.triggeredAt < RECENT_MS) return false;
    if (!a.symbol || a.threshold == null) return false;
    const price = quotes[a.symbol]?.regularMarketPrice;
    if (price == null) return false;
    if (a.kind === 'price_above') return price >= a.threshold;
    if (a.kind === 'price_below') return price <= a.threshold;
    return false;
  });
}

export async function markAlertTriggered(id: string, message: string): Promise<void> {
  await supabase
    .from('alerts')
    .update({ triggered_at: new Date().toISOString(), message })
    .eq('id', id);
}
