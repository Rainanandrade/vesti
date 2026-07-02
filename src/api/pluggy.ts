// Cliente Pluggy do lado do app: chama backend Vercel (endpoint único com ?action=).
import { supabase } from '../services/supabase';

const API_URL = 'https://vesti-nine.vercel.app/api/pluggy';

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function callAction<T = any>(action: string, body: any = {}): Promise<T> {
  const r = await fetch(`${API_URL}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`Falha em ${action} (${r.status}): ${t.slice(0, 200)}`);
  }
  return r.json();
}

export async function fetchConnectToken(itemId?: string): Promise<string> {
  const data = await callAction<{ accessToken: string }>('connect-token', { itemId });
  return data.accessToken;
}

export async function syncItem(itemId: string): Promise<{ synced: number }> {
  return callAction('sync', { itemId });
}

export async function disconnectItem(itemId: string, keepAssets = false): Promise<void> {
  await callAction('disconnect', { itemId, keepAssets });
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
  return `https://connect.pluggy.ai/?connect_token=${encodeURIComponent(accessToken)}`;
}
