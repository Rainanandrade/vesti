import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import ProLock from '../components/ProLock';
import { safeBackToTabs } from '../utils/navigation';
import {
  WalletShare, acceptShare, inviteToWallet,
  listReceivedShares, listSharesOfWallet, revokeShare,
} from '../api/walletShares';

export default function ShareWalletsScreen({ navigation }: any) {
  const { wallets, activeWalletId, refreshFromCloud } = useApp();
  const [invitedEmail, setInvitedEmail] = useState('');
  const [walletId, setWalletId] = useState<string | null>(activeWalletId);
  const [sent, setSent] = useState<WalletShare[]>([]);
  const [received, setReceived] = useState<WalletShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async () => {
    try {
      const targetWallet = walletId || activeWalletId || wallets[0]?.id;
      if (targetWallet) setSent(await listSharesOfWallet(targetWallet));
      setReceived(await listReceivedShares());
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }, [walletId, activeWalletId, wallets]);

  useEffect(() => { load(); }, [load]);

  const invite = async () => {
    const email = invitedEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Email inválido', 'Digite um email válido pra enviar o convite.');
      return;
    }
    const wid = walletId || activeWalletId;
    if (!wid) { Alert.alert('Erro', 'Nenhuma carteira selecionada.'); return; }
    setInviting(true);
    try {
      await inviteToWallet(wid, email, 'viewer');
      setInvitedEmail('');
      await load();
      Alert.alert('Convite enviado', `${email} pode aceitar o convite fazendo login no Vesti.`);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setInviting(false);
    }
  };

  const accept = async (id: string) => {
    try { await acceptShare(id); await load(); await refreshFromCloud(); }
    catch (e: any) { Alert.alert('Erro', e.message); }
  };

  const revoke = async (id: string) => {
    try { await revokeShare(id); await load(); }
    catch (e: any) { Alert.alert('Erro', e.message); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Compartilhar carteira</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ProLock
          mode="replace"
          title="Compartilhar carteira"
          description="Dê acesso ao seu cônjuge, filho ou planejador. Modo leitura por padrão."
          onUnlock={() => navigation.getParent()?.navigate('ProSubscribe')}
        >
          {/* Convites recebidos */}
          {received.filter((r) => r.status === 'pending').length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Convites recebidos</Text>
              {received.filter((r) => r.status === 'pending').map((r) => (
                <Card key={r.id} style={{ marginBottom: spacing.sm }}>
                  <Text style={styles.rowTitle}>Alguém te convidou</Text>
                  <Text style={styles.rowSub}>Modo {r.role === 'viewer' ? 'leitura' : 'edição'} · aceite pra ver a carteira</Text>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => accept(r.id)}>
                    <Text style={styles.acceptText}>Aceitar convite</Text>
                  </TouchableOpacity>
                </Card>
              ))}
            </>
          )}

          {/* Enviar convite */}
          <Card>
            <Text style={styles.sectionTitle}>➕ Convidar alguém</Text>

            <Text style={styles.label}>Qual carteira?</Text>
            <View style={styles.walletsRow}>
              {wallets.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.chip, (walletId || activeWalletId) === w.id && styles.chipActive]}
                  onPress={() => setWalletId(w.id)}
                >
                  <Text style={[styles.chipText, (walletId || activeWalletId) === w.id && { color: colors.textLight }]}>
                    {w.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Email do convidado</Text>
            <TextInput
              style={styles.input}
              value={invitedEmail}
              onChangeText={setInvitedEmail}
              placeholder="conjuge@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TouchableOpacity
              style={[styles.addBtn, (!invitedEmail || inviting) && { opacity: 0.5 }]}
              onPress={invite}
              disabled={!invitedEmail || inviting}
            >
              <Ionicons name="mail" size={16} color={colors.textLight} />
              <Text style={styles.addText}>{inviting ? 'Enviando...' : 'Convidar'}</Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.sectionLabel}>Compartilhamentos ativos</Text>

          {loading ? (
            <Text style={{ color: colors.textTertiary, textAlign: 'center', padding: spacing.md }}>Carregando...</Text>
          ) : sent.length === 0 ? (
            <Card><Text style={styles.empty}>Ninguém foi convidado ainda.</Text></Card>
          ) : (
            sent.map((s) => (
              <Card key={s.id} style={{ marginBottom: spacing.sm }}>
                <View style={styles.shareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{s.invitedEmail}</Text>
                    <Text style={styles.rowSub}>
                      {s.status === 'accepted' ? '✅ Aceitou' : s.status === 'pending' ? '⏳ Pendente' : '❌ Revogado'}
                      {' · '}{s.role === 'viewer' ? 'leitura' : 'edição'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => revoke(s.id)}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}

          <Text style={styles.footnote}>
            O convidado precisa ter uma conta no Vesti com o mesmo email. Ele acessa a carteira em modo leitura, sem poder editar ativos ou operações.
          </Text>
        </ProLock>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  sectionLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm },
  label: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '700', marginTop: spacing.md, marginBottom: 6 },
  walletsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 as any },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700', fontSize: fontSize.small },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.sm, color: colors.text, fontSize: fontSize.body },
  addBtn: { flexDirection: 'row', gap: 6 as any, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md },
  addText: { color: colors.textLight, fontWeight: '800' },
  acceptBtn: { marginTop: spacing.sm, backgroundColor: colors.success, padding: spacing.sm, borderRadius: radius.md, alignItems: 'center' },
  acceptText: { color: colors.textLight, fontWeight: '800' },
  empty: { color: colors.textSecondary, textAlign: 'center', padding: spacing.md, fontStyle: 'italic' },
  shareRow: { flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontSize: fontSize.body, color: colors.text, fontWeight: '700' },
  rowSub: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md, lineHeight: 16, fontStyle: 'italic' },
});
