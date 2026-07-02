// Cliente Pluggy do lado do app: chama backend Vercel.
import { supabase } from '../services/supabase';

const API_BASE = 'https://vesti-nine.vercel.app/api/pluggy';

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchConnectToken(itemId?: string): Promise<string> {
  const r = await fetch(`${API_BASE}/connect-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ itemId }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Falha ao gerar token (${r.status}): ${t.slice(0, 200)}`);
  }
  const data = await r.json();
  return data.accessToken;
}

export async function syncItem(itemId: string): Promise<{ synced: number }> {
  const r = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ itemId }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Sync falhou (${r.status}): ${t.slice(0, 200)}`);
  }
  return r.json();
}

export async function disconnectItem(itemId: string, keepAssets = false): Promise<void> {
  const r = await fetch(`${API_BASE}/disconnect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify({ itemId, keepAssets }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Desconexão falhou (${r.status}): ${t.slice(0, 200)}`);
  }
}

export type PluggyItem = {
  id: string;
  itemId: string;
  connectorName: string | null;
  status: string;
  errorMessage: string | null;
  lastSyncAt: number | null;
  createdAt: number;
};

export async function listPluggyItems(): Promise<PluggyItem[]> {
  const { data, error } = await supabase
    .from('pluggy_items')
    .select('id, item_id, connector_name, status, error_message, last_sync_at, created_at')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((r: any) => ({
    id: r.id,
    itemId: r.item_id,
    connectorName: r.connector_name,
    status: r.status,
    errorMessage: r.error_message,
    lastSyncAt: r.last_sync_at ? new Date(r.last_sync_at).getTime() : null,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export function pluggyConnectUrl(accessToken: string): string {
  // URL hosted da Pluggy que abre no browser externo
  return `https://connect.pluggy.ai/?connect_token=${encodeURIComponent(accessToken)}`;
}
