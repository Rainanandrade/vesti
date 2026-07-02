import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Card from '../components/Card';
import { safeBackToTabs } from '../utils/navigation';
import {
  disconnectItem,
  fetchConnectToken,
  listPluggyItems,
  PluggyItem,
  pluggyConnectUrl,
  syncItem,
} from '../api/pluggy';
import { useApp } from '../context/AppContext';

function relTime(ms: number | null): string {
  if (!ms) return 'nunca';
  const diff = Date.now() - ms;
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.round(h / 24)}d`;
}

function statusColor(s: string) {
  if (s === 'UPDATED') return colors.success;
  if (s === 'CONNECTING' || s === 'UPDATING') return colors.warning;
  return colors.danger;
}

function statusLabel(s: string) {
  switch (s) {
    case 'UPDATED': return 'Sincronizado';
    case 'CONNECTING': return 'Conectando…';
    case 'UPDATING': return 'Atualizando…';
    case 'LOGIN_ERROR': return 'Login expirou';
    case 'OUTDATED': return 'Desatualizado';
    case 'WAITING_USER_INPUT': return 'Aguardando você';
    default: return s;
  }
}

export default function IntegracoesScreen({ navigation }: any) {
  const { refreshFromCloud } = useApp() as any;
  const [items, setItems] = useState<PluggyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  const load = useCallback(async () => {
    try {
      const list = await listPluggyItems();
      setItems(list);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não conseguimos carregar as integrações.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Ao voltar do browser externo (Pluggy Connect), recarrega
    const sub = AppState.addEventListener('change', (next) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        load();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [load]);

  const onConnect = useCallback(async () => {
    setConnecting(true);
    try {
      const token = await fetchConnectToken();
      const url = pluggyConnectUrl(token);
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('Não conseguimos abrir o navegador.');
      await Linking.openURL(url);
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao iniciar conexão.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const onSync = useCallback(async (item: PluggyItem) => {
    setSyncingId(item.itemId);
    try {
      await syncItem(item.itemId);
      await load();
      if (typeof refreshFromCloud === 'function') await refreshFromCloud();
      Alert.alert('Pronto', 'Corretora sincronizada.');
    } catch (e: any) {
      Alert.alert('Erro no sync', e?.message || 'Tente novamente em alguns instantes.');
    } finally {
      setSyncingId(null);
    }
  }, [load, refreshFromCloud]);

  const onDisconnect = useCallback((item: PluggyItem) => {
    Alert.alert(
      'Desconectar corretora?',
      `Vamos remover a conexão com ${item.connectorName || 'a corretora'}. Escolha o que fazer com os ativos sincronizados:`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar ativos',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnectItem(item.itemId, false);
              await load();
              if (typeof refreshFromCloud === 'function') await refreshFromCloud();
            } catch (e: any) {
              Alert.alert('Erro', e?.message || 'Falha ao desconectar.');
            }
          },
        },
        {
          text: 'Manter (virar manual)',
          onPress: async () => {
            try {
              await disconnectItem(item.itemId, true);
              await load();
              if (typeof refreshFromCloud === 'function') await refreshFromCloud();
            } catch (e: any) {
              Alert.alert('Erro', e?.message || 'Falha ao desconectar.');
            }
          },
        },
      ],
    );
  }, [load, refreshFromCloud]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Integrações</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <Card style={styles.intro}>
          <Text style={styles.introTitle}>🔗 Sincronize sua corretora</Text>
          <Text style={styles.introText}>
            Conecte sua conta na XP, Rico, Clear, BTG, Nubank e outras — os ativos aparecem
            automaticamente aqui. Feito via Open Finance, você mantém o controle total.
          </Text>
        </Card>

        <TouchableOpacity
          style={[styles.connectBtn, connecting && { opacity: 0.6 }]}
          onPress={onConnect}
          disabled={connecting}
          activeOpacity={0.8}
        >
          {connecting ? (
            <ActivityIndicator color={colors.textLight} />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={22} color={colors.textLight} />
              <Text style={styles.connectText}>Conectar corretora</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Conectadas</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Nenhuma corretora conectada ainda.</Text>
          </Card>
        ) : (
          items.map((it) => (
            <Card key={it.id} style={{ marginBottom: spacing.sm }}>
              <View style={styles.rowHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.connectorName}>{it.connectorName || 'Corretora'}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor(it.status) }]} />
                    <Text style={styles.statusText}>{statusLabel(it.status)}</Text>
                    <Text style={styles.subText}> · sync {relTime(it.lastSyncAt)}</Text>
                  </View>
                  {it.errorMessage && (
                    <Text style={styles.errorText}>{it.errorMessage}</Text>
                  )}
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.action, syncingId === it.itemId && { opacity: 0.5 }]}
                  onPress={() => onSync(it)}
                  disabled={syncingId === it.itemId}
                >
                  {syncingId === it.itemId ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="refresh" size={18} color={colors.primary} />
                  )}
                  <Text style={styles.actionText}>Sincronizar agora</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.action} onPress={() => onDisconnect(it)}>
                  <Ionicons name="unlink-outline" size={18} color={colors.danger} />
                  <Text style={[styles.actionText, { color: colors.danger }]}>Desconectar</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}

        <Text style={styles.footnote}>
          Powered by Pluggy · Open Finance regulado pelo Banco Central
        </Text>
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
  intro: { marginBottom: spacing.md },
  introTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text, marginBottom: 6 },
  introText: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 as any, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, marginBottom: spacing.lg },
  connectText: { color: colors.textLight, fontWeight: '800', fontSize: fontSize.body },
  sectionLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.sm },
  loading: { padding: spacing.xl, alignItems: 'center' },
  empty: { color: colors.textSecondary, textAlign: 'center', padding: spacing.md, fontStyle: 'italic' },
  rowHeader: { flexDirection: 'row', alignItems: 'center' },
  connectorName: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: fontSize.small, color: colors.text, fontWeight: '600' },
  subText: { fontSize: fontSize.small, color: colors.textTertiary },
  errorText: { fontSize: fontSize.small, color: colors.danger, marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: spacing.md as any, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, flex: 1 },
  actionText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.small },
  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.xl },
});
