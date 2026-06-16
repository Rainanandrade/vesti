import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

function ToolChip({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={toolStyles.chip} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={toolStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fetchQuotes, Quote } from '../api/brapi';
import { fmtBRL, fmtPct } from '../utils/format';
import Card from '../components/Card';
import { fetchDividendInfoBatch, DividendInfo, formatNextPayment, formatDateBR, frequencyLabel } from '../api/dividends';

export default function PortfolioScreen({ navigation }: any) {
  const { activeWallet, privacyMode, removeAsset } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [dividends, setDividends] = useState<Record<string, DividendInfo | null>>({});
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!activeWallet) return;
    const symbols = activeWallet.assets
      .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
      .map((a) => a.symbol);
    const data = await fetchQuotes(symbols);
    const map: Record<string, Quote> = {};
    data.forEach((q) => (map[q.symbol] = q));
    setQuotes(map);

    // Histórico de dividendos pra mostrar próximo pagamento
    const divMap = await fetchDividendInfoBatch(symbols);
    setDividends(divMap);
  }, [activeWallet]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRemove = (symbol: string) => {
    Alert.alert('Remover ativo', `Tem certeza que deseja remover ${symbol}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          if (!activeWallet) return;
          try {
            await removeAsset(activeWallet.id, symbol);
          } catch (e: any) {
            Alert.alert('Não foi possível excluir', e?.message || 'Tente novamente.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{activeWallet?.name || 'Carteira'}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.addBtn, styles.watchBtn]}
            onPress={() => navigation.navigate('Watchlist')}
          >
            <Ionicons name="eye-outline" size={18} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Acompanho</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('AddAsset')}
          >
            <Ionicons name="add" size={22} color={colors.textLight} />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Atalhos pra ferramentas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsRow}
      >
        <ToolChip icon="sparkles-outline" label="Gestor IA" onPress={() => navigation.getParent()?.getParent()?.navigate('AIHub')} />
        <ToolChip icon="cash-outline" label="Proventos" onPress={() => navigation.navigate('Proventos')} />
        <ToolChip icon="document-text-outline" label="Declaração" onPress={() => navigation.navigate('Declaracao')} />
        <ToolChip icon="git-compare-outline" label="Comparar" onPress={() => navigation.navigate('Compare')} />
        <ToolChip icon="calculator-outline" label="Aporte" onPress={() => navigation.navigate('AporteCalc')} />
        <ToolChip icon="receipt-outline" label="IR/DARF" onPress={() => navigation.navigate('IRCalculator')} />
        <ToolChip icon="swap-vertical-outline" label="Operações" onPress={() => navigation.navigate('Operacoes')} />
      </ScrollView>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {(!activeWallet || activeWallet.assets.length === 0) && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📈</Text>
            <Text style={styles.emptyTitle}>Carteira vazia</Text>
            <Text style={styles.emptyDesc}>
              Toque em "Adicionar" pra começar a registrar seus ativos.
            </Text>
          </View>
        )}

        {activeWallet?.assets.map((a) => {
          const q = quotes[a.symbol];
          const price = q?.regularMarketPrice ?? a.avgPrice;
          const total = price * a.quantity;
          const invested = a.avgPrice * a.quantity;
          const profit = total - invested;
          const profitPct = invested > 0 ? (profit / invested) * 100 : 0;
          const dayChange = q?.regularMarketChangePercent ?? 0;

          return (
            <TouchableOpacity
              key={a.symbol}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EditAsset', { symbol: a.symbol })}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.symbol}>{a.symbol}</Text>
                      <View style={[styles.typePill, typePillColor(a.type)]}>
                        <Text style={styles.typeText}>{typeLabel(a.type)}</Text>
                      </View>
                    </View>
                    <Text style={styles.subText}>
                      {a.quantity} × {fmtBRL(price, privacyMode)}
                      {q && (
                        <Text style={{ color: dayChange >= 0 ? colors.success : colors.danger }}>
                          {'  '}({fmtPct(dayChange, privacyMode)} hoje)
                        </Text>
                      )}
                    </Text>
                    {dividends[a.symbol] && (
                      <View style={styles.dividendRow}>
                        <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                        <Text style={styles.dividendText}>
                          {frequencyLabel(dividends[a.symbol]!.frequency)} · próximo {formatNextPayment(dividends[a.symbol]!).whenLabel}
                          {dividends[a.symbol]!.nextEstimatedAmount > 0 && (
                            <Text style={styles.dividendValue}>
                              {' '}· ~{fmtBRL(dividends[a.symbol]!.nextEstimatedAmount * a.quantity, privacyMode)}
                            </Text>
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{fmtBRL(total, privacyMode)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.totalLabel}>Lucro/Prejuízo</Text>
                  <Text
                    style={[
                      styles.totalValue,
                      { color: profit >= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {fmtBRL(profit, privacyMode)}
                  </Text>
                  <Text
                    style={[
                      styles.profitPct,
                      { color: profit >= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {fmtPct(profitPct, privacyMode)}
                  </Text>
                </View>
              </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function typeLabel(t: string): string {
  return {
    acao: 'Ação',
    fii: 'FII',
    etf: 'ETF',
    tesouro: 'Tesouro',
    cdb: 'CDB',
    outro: 'Outro',
  }[t] || t;
}

function typePillColor(t: string) {
  const colorsMap: Record<string, any> = {
    acao: { backgroundColor: colors.primaryLight },
    fii: { backgroundColor: colors.warningLight },
    etf: { backgroundColor: colors.successLight },
    tesouro: { backgroundColor: '#F3E8FF' },
    cdb: { backgroundColor: '#FEF3C7' },
    outro: { backgroundColor: colors.surface },
  };
  return colorsMap[t] || { backgroundColor: colors.surface };
}

const toolStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  label: { color: colors.primary, fontWeight: '700', fontSize: fontSize.small, marginLeft: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  toolsRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  watchBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  addBtnText: { color: colors.textLight, fontWeight: '600', marginLeft: 4 },
  scroll: { padding: spacing.md },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  symbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  typePill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginLeft: spacing.sm },
  typeText: { fontSize: fontSize.tiny, fontWeight: '600', color: colors.text },
  subText: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  dividendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dividendText: { fontSize: fontSize.small, color: colors.textSecondary, marginLeft: 4 },
  dividendValue: { color: colors.success, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  profitPct: { fontSize: fontSize.small, fontWeight: '600', marginTop: 2 },
});
