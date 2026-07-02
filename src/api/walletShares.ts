import { supabase } from '../services/supabase';

export type WalletShare = {
  id: string;
  walletId: string;
  ownerId: string;
  invitedEmail: string;
  invitedUserId: string | null;
  role: 'viewer' | 'editor';
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: number;
  acceptedAt: number | null;
};

function fromRow(r: any): WalletShare {
  return {
    id: r.id,
    walletId: r.wallet_id,
    ownerId: r.owner_id,
    invitedEmail: r.invited_email,
    invitedUserId: r.invited_user_id,
    role: r.role,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
    acceptedAt: r.accepted_at ? new Date(r.accepted_at).getTime() : null,
  };
}

export async function listSharesOfWallet(walletId: string): Promise<WalletShare[]> {
  const { data, error } = await supabase
    .from('wallet_shares')
    .select('*')
    .eq('wallet_id', walletId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(fromRow);
}

export async function listReceivedShares(): Promise<WalletShare[]> {
  const { data: userRes } = await supabase.auth.getUser();
  const email = userRes.user?.email;
  if (!email) return [];
  const { data, error } = await supabase
    .from('wallet_shares')
    .select('*')
    .eq('invited_email', email)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(fromRow);
}

export async function inviteToWallet(
  walletId: string,
  invitedEmail: string,
  role: 'viewer' | 'editor' = 'viewer',
): Promise<WalletShare> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) throw new Error('Não autenticado');

  const { data, error } = await supabase
    .from('wallet_shares')
    .insert({
      wallet_id: walletId,
      owner_id: uid,
      invited_email: invitedEmail.trim().toLowerCase(),
      role,
      status: 'pending',
    })
    .select()
    .single();
  if (error || !data) {
    if (String(error?.message).includes('duplicate')) throw new Error('Esse email já foi convidado.');
    throw new Error(error?.message || 'Falha no convite');
  }
  return fromRow(data);
}

export async function acceptShare(id: string): Promise<void> {
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;
  if (!uid) throw new Error('Não autenticado');
  const { error } = await supabase
    .from('wallet_shares')
    .update({ status: 'accepted', invited_user_id: uid, accepted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function revokeShare(id: string): Promise<void> {
  const { error } = await supabase.from('wallet_shares').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
