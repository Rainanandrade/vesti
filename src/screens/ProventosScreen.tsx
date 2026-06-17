import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fmtBRL } from '../utils/format';
import Card from '../components/Card';
import { MONTH_NAMES_PT } from '../data/dividends';
import {
  DividendInfo,
  fetchDividendInfoBatch,
} from '../api/dividends';
import {
  computeReceivedProventos,
  groupProventosByMonth,
} from '../utils/receivedProventos';

export default function ProventosScreen({ navigation }: any) {
  const { activeWallet, privacyMode } = useApp();
  const [dividendInfoMap, setDividendInfoMap] = useState<Record<string, DividendInfo | null>>({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Puxa histórico de dividendos pra ativos elegíveis
  useEffect(() => {
    if (!activeWallet) {
      setLoading(false);
      return;
    }
    const symbols = activeWallet.assets
      .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
      .map((a) => a.symbol);
    if (symbols.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchDividendInfoBatch(symbols).then((map) => {
      setDividendInfoMap(map);
      setLoading(false);
    });
  }, [activeWallet?.id, activeWallet?.assets.length]);

  const received = useMemo(
    () => computeReceivedProventos(activeWallet?.assets || [], dividendInfoMap),
    [activeWallet, dividendInfoMap],
  );

  const totalYear = useMemo(() => {
    const y = new Date().getFullYear();
    return received.filter((p) => p.date.startsWith(String(y))).reduce((s, p) => s + p.amount, 0);
  }, [received]);

  const total12m = useMemo(() => {
    const limit = new Date();
    limit.setMonth(limit.getMonth() - 12);
    const iso = limit.toISOString().slice(0, 10);
    return received.filter((p) => p.date >= iso).reduce((s, p) => s + p.amount, 0);
  }, [received]);

  const byMonth = useMemo(() => groupProventosByMonth(received), [received]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            // Sempre garante voltar pra Carteira (não pro Dashboard)
            const parent = navigation.getParent();
            if (parent) parent.navigate('Carteira', { screen: 'PortfolioMain' });
            else navigation.navigate('PortfolioMain');
          }}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Proventos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Recebido em {new Date().getFullYear()}</Text>
            <Text style={styles.summaryValue}>{fmtBRL(totalYear, privacyMode)}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>Últimos 12 meses</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {fmtBRL(total12m, privacyMode)}
            </Text>
          </View>
        </Card>

        <Text style={styles.autoNote}>
          🤖 Calculado automaticamente do histórico de dividendos dos seus ativos.
          Considera que você precisava ter o ativo na carteira pelo menos 5 dias antes do pagamento.
        </Text>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Buscando histórico de dividendos...</Text>
          </View>
        )}

        {!loading && received.length === 0 && (
          <Card style={{ marginTop: spacing.md, alignItems: 'center', padding: spacing.lg }}>
            <Text style={{ fontSize: 40 }}>💰</Text>
            <Text style={styles.emptyTitle}>Nenhum provento recebido ainda</Text>
            <Text style={styles.emptyDesc}>
              Assim que os ativos da sua carteira pagarem dividendos, JCP ou rendimentos, aparecerão aqui automaticamente.
            </Text>
          </Card>
        )}

        {byMonth.map(({ monthKey, total, items }) => {
          const [y, m] = monthKey.split('-');
          const label = `${MONTH_NAMES_PT[Number(m) - 1]}/${y}`;
          const isOpen = expanded[monthKey];
          return (
            <Card key={monthKey} style={{ marginTop: spacing.md, padding: 0 }}>
              <TouchableOpacity
                style={styles.monthHeader}
                onPress={() => setExpanded((prev) => ({ ...prev, [monthKey]: !prev[monthKey] }))}
              >
                <View>
                  <Text style={styles.monthLabel}>{label}</Text>
                  <Text style={styles.monthCount}>
                    {items.length} {items.length === 1 ? 'pagamento' : 'pagamentos'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.monthSum}>{fmtBRL(total, privacyMode)}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textTertiary}
                    style={{ marginLeft: spacing.sm }}
                  />
                </View>
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.monthBody}>
                  {items.map((p, i) => (
                    <View key={`${p.symbol}-${p.date}-${i}`} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.itemSymbol}>{p.symbol}</Text>
                          <View style={[styles.kindPill, kindStyle(p.kind)]}>
                            <Text style={styles.kindText}>{labelKind(p.kind)}</Text>
                          </View>
                        </View>
                        <Text style={styles.itemDate}>
                          {formatDateBR(p.date)} · R$ {p.perShare.toFixed(4)}/cota
                        </Text>
                      </View>
                      <Text style={styles.itemAmount}>{fmtBRL(p.amount, privacyMode)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function labelKind(k: 'dividendo' | 'jcp' | 'rendimento'): string {
  return k === 'dividendo' ? 'Dividendo' : k === 'jcp' ? 'JCP' : 'Rendimento';
}

function kindStyle(k: 'dividendo' | 'jcp' | 'rendimento') {
  if (k === 'jcp') return { backgroundColor: colors.warningLight };
  if (k === 'rendimento') return { backgroundColor: colors.primaryLight };
  return { backgroundColor: colors.successLight };
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  summaryCard: { flexDirection: 'row' },
  summaryLabel: {
    fontSize: fontSize.tiny,
    color: colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  autoNote: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    lineHeight: 18,
  },
  loadingBox: { alignItems: 'center', padding: spacing.lg },
  loadingText: { color: colors.textSecondary, marginTop: spacing.sm },
  emptyTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  monthLabel: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  monthCount: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },
  monthSum: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.success },
  monthBody: { borderTopWidth: 1, borderColor: colors.divider, padding: spacing.md, paddingTop: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  itemSymbol: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  itemDate: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },
  itemAmount: { fontSize: fontSize.body, fontWeight: '700', color: colors.success },
  kindPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginLeft: spacing.sm },
  kindText: { fontSize: fontSize.tiny, fontWeight: '600', color: colors.text },
});
