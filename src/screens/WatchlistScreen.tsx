import { useCallback, useEffect, useState } from 'react';
import { safeBackToCarteira } from '../utils/navigation';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fetchQuotes, Quote } from '../api/brapi';
import { fmtBRL, fmtPct } from '../utils/format';
import Card from '../components/Card';
import Button from '../components/Button';
import { searchTickers, TICKERS } from '../data/tickers';
import { confirmAction } from '../utils/confirm';
import PriceChart from '../components/PriceChart';

export default function WatchlistScreen({ navigation }: any) {
  const { watchlist, removeFromWatchlist, addToWatchlist, setWatchlistTarget, privacyMode } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Modal de adicionar
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Modal de target
  const [targetOpen, setTargetOpen] = useState(false);
  const [targetSymbol, setTargetSymbol] = useState<string | null>(null);
  const [targetValue, setTargetValue] = useState('');

  const load = useCallback(async () => {
    if (watchlist.length === 0) return;
    const symbols = watchlist.map((w) => w.symbol);
    const data = await fetchQuotes(symbols);
    const map: Record<string, Quote> = {};
    data.forEach((q) => (map[q.symbol] = q));
    setQuotes(map);
  }, [watchlist]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRemove = (symbol: string) => {
    confirmAction(
      'Remover do acompanho',
      `Remover ${symbol} da lista?`,
      () => removeFromWatchlist(symbol),
      { confirmLabel: 'Remover', destructive: true },
    );
  };

  const handleAdd = async (symbol: string, name: string, type: string) => {
    try {
      await addToWatchlist({ symbol, name, type });
      setAddOpen(false);
      setSearch('');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível adicionar.');
    }
  };

  const openTarget = (symbol: string) => {
    const item = watchlist.find((w) => w.symbol === symbol);
    setTargetSymbol(symbol);
    setTargetValue(item?.targetPrice?.toString().replace('.', ',') || '');
    setTargetOpen(true);
  };

  const saveTarget = async () => {
    if (!targetSymbol) return;
    const v = parseFloat(targetValue.replace(',', '.'));
    if (!isFinite(v) || v <= 0) {
      await setWatchlistTarget(targetSymbol, null);
    } else {
      await setWatchlistTarget(targetSymbol, v);
    }
    setTargetOpen(false);
    setTargetSymbol(null);
    setTargetValue('');
  };

  const suggestions = search
    ? searchTickers(search, 10)
    : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToCarteira(navigation)} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Acompanho</Text>
          <Text style={styles.subtitle}>Ativos que você está de olho</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Ionicons name="add" size={22} color={colors.textLight} />
          <Text style={styles.addBtnText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {watchlist.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👀</Text>
            <Text style={styles.emptyTitle}>Lista vazia</Text>
            <Text style={styles.emptyDesc}>
              Adicione ativos que você quer acompanhar sem precisar comprar. Defina preço-alvo e veja quando bater.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddOpen(true)}>
              <Text style={styles.emptyBtnText}>+ Adicionar ativo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          watchlist.map((item) => {
            const q = quotes[item.symbol];
            const price = q?.regularMarketPrice;
            const dayChange = q?.regularMarketChangePercent ?? 0;
            const target = item.targetPrice;
            const targetReached = target && price ? price <= target : false;
            const distanceToTarget = target && price ? ((price - target) / price) * 100 : null;

            return (
              <Card key={item.symbol} style={[styles.itemCard, targetReached && styles.itemCardAlert]}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.symbolRow}>
                      <Text style={styles.symbol}>{item.symbol}</Text>
                      {targetReached && (
                        <View style={styles.alertBadge}>
                          <Ionicons name="notifications" size={10} color={colors.textLight} />
                          <Text style={styles.alertText}>Alvo atingido!</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.name}>{item.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {price != null ? (
                      <>
                        <Text style={styles.price}>{fmtBRL(price, privacyMode)}</Text>
                        <Text
                          style={{
                            fontSize: fontSize.small,
                            color: dayChange >= 0 ? colors.success : colors.danger,
                            fontWeight: '600',
                          }}
                        >
                          {fmtPct(dayChange, privacyMode)} hoje
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.noPrice}>—</Text>
                    )}
                  </View>
                </View>

                {target != null && (
                  <View style={styles.targetRow}>
                    <Ionicons name="locate-outline" size={14} color={colors.primary} />
                    <Text style={styles.targetText}>
                      Alvo: <Text style={{ fontWeight: '700' }}>{fmtBRL(target, privacyMode)}</Text>
                      {distanceToTarget !== null && !targetReached && (
                        <Text style={styles.distance}>
                          {' '}· falta {Math.abs(distanceToTarget).toFixed(1)}%
                        </Text>
                      )}
                    </Text>
                  </View>
                )}

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openTarget(item.symbol)}>
                    <Ionicons
                      name={target != null ? 'pencil' : 'locate-outline'}
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.actionText}>
                      {target != null ? 'Editar alvo' : 'Definir alvo'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemove(item.symbol)}>
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[styles.actionText, { color: colors.danger }]}>Remover</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal de adicionar */}
      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Adicionar ao acompanho</Text>
            <View style={{ width: 26 }} />
          </View>
          <View style={{ padding: spacing.md }}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar ticker (PETR4, MXRF11...)"
                value={search}
                onChangeText={(t) => setSearch(t.toUpperCase())}
                autoCapitalize="characters"
                autoFocus
              />
            </View>
            <ScrollView style={{ marginTop: spacing.md }}>
              {suggestions.map((t) => (
                <TouchableOpacity
                  key={t.symbol}
                  onPress={() => handleAdd(t.symbol, t.name, t.type)}
                  activeOpacity={0.7}
                >
                  <Card style={{ marginBottom: spacing.sm }}>
                    <View style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.symbol}>{t.symbol}</Text>
                        <Text style={styles.name}>{t.name}</Text>
                      </View>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{t.type.toUpperCase()}</Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de definir alvo (com gráfico pra contexto) */}
      <Modal visible={targetOpen} transparent animationType="slide" onRequestClose={() => setTargetOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setTargetOpen(false)}>
          <Pressable style={styles.targetModal} onPress={(e) => e.stopPropagation()}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.targetModalTitle}>Preço-alvo {targetSymbol}</Text>
              <Text style={styles.targetModalSub}>
                Notifico quando o preço chegar nesse valor (compra). Deixe vazio pra remover.
              </Text>

              {/* Gráfico histórico pra contexto */}
              {targetSymbol && (
                <View style={{ marginTop: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md }}>
                  <PriceChart symbol={targetSymbol} />
                </View>
              )}

              <TextInput
                style={styles.targetInput}
                value={targetValue}
                onChangeText={setTargetValue}
                keyboardType="decimal-pad"
                placeholder="0,00"
              />
              <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
                <Button title="Cancelar" variant="ghost" onPress={() => setTargetOpen(false)} style={{ flex: 1 }} />
                <Button title="Salvar" onPress={saveTarget} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  addBtnText: { color: colors.textLight, fontWeight: '600', marginLeft: 4 },
  scroll: { padding: spacing.md },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  emptyBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  emptyBtnText: { color: colors.textLight, fontWeight: '600' },

  itemCard: { marginBottom: spacing.sm },
  itemCardAlert: { borderColor: colors.success, borderWidth: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  symbolRow: { flexDirection: 'row', alignItems: 'center' },
  symbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  name: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  price: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  noPrice: { fontSize: fontSize.body, color: colors.textTertiary },

  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
  },
  alertText: { color: colors.textLight, fontSize: fontSize.tiny, fontWeight: '700', marginLeft: 2 },

  targetRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider },
  targetText: { fontSize: fontSize.small, color: colors.text, marginLeft: 4 },
  distance: { color: colors.textSecondary },

  actions: { flexDirection: 'row', marginTop: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.lg },
  actionText: { fontSize: fontSize.small, color: colors.primary, fontWeight: '600', marginLeft: 4 },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  modalTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, marginLeft: spacing.sm, fontSize: fontSize.body, color: colors.text },
  typeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  typeBadgeText: { fontSize: fontSize.tiny, fontWeight: '700', color: colors.primary },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  targetModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  targetModalTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  targetModalSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  targetInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.heading,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: spacing.md,
  },
});
