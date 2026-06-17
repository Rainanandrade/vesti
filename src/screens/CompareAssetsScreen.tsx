import { useEffect, useState } from 'react';
import { safeBackToCarteira } from '../utils/navigation';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { searchTickers, TICKERS } from '../data/tickers';
import { fetchQuotes, Quote } from '../api/brapi';
import { fetchAssetDetails, AssetDetails } from '../api/yahooDetails';
import { fmtBRL, fmtPct } from '../utils/format';
import Card from '../components/Card';

const MAX_ASSETS = 3;

export default function CompareAssetsScreen({ navigation }: any) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [details, setDetails] = useState<Record<string, AssetDetails | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selected.length === 0) {
      setQuotes({});
      setDetails({});
      return;
    }
    setLoading(true);
    Promise.all([
      fetchQuotes(selected),
      Promise.all(selected.map((s) => fetchAssetDetails(s).then((d) => [s, d] as const))),
    ]).then(([qs, ds]) => {
      const qmap: Record<string, Quote> = {};
      qs.forEach((q) => (qmap[q.symbol] = q));
      setQuotes(qmap);
      const dmap: Record<string, AssetDetails | null> = {};
      ds.forEach(([s, d]) => (dmap[s] = d));
      setDetails(dmap);
      setLoading(false);
    });
  }, [selected]);

  const add = (symbol: string) => {
    if (selected.includes(symbol)) return;
    if (selected.length >= MAX_ASSETS) return;
    setSelected([...selected, symbol]);
    setSearch('');
  };

  const remove = (symbol: string) =>
    setSelected(selected.filter((s) => s !== symbol));

  const suggestions = search ? searchTickers(search, 8) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToCarteira(navigation)} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparar ativos</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Selecionados */}
        <View style={styles.selectedRow}>
          {selected.map((s) => {
            const t = TICKERS.find((x) => x.symbol === s);
            return (
              <View key={s} style={styles.selectedChip}>
                <Text style={styles.selectedChipText}>{s}</Text>
                <TouchableOpacity onPress={() => remove(s)} hitSlop={6}>
                  <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Adicionar */}
        {selected.length < MAX_ASSETS && (
          <>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textTertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar ticker (PETR4, MXRF11...)"
                value={search}
                onChangeText={(t) => setSearch(t.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>
            {suggestions.length > 0 && (
              <View style={styles.suggestionsBox}>
                {suggestions.map((t) => (
                  <TouchableOpacity
                    key={t.symbol}
                    style={styles.suggestionItem}
                    onPress={() => add(t.symbol)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.suggSymbol}>{t.symbol}</Text>
                      <Text style={styles.suggName}>{t.name}</Text>
                    </View>
                    <Ionicons name="add-circle" size={22} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}

        {/* Tabela comparativa */}
        {selected.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⚖️</Text>
            <Text style={styles.emptyTitle}>Compare até 3 ativos</Text>
            <Text style={styles.emptyDesc}>
              Selecione tickers pra ver lado a lado: preço, DY, P/L, ROE, P/VP e mais.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Buscando dados...</Text>
          </View>
        ) : (
          <Card style={{ marginTop: spacing.md }}>
            <Row label="" values={selected} bold />
            <RowSeparator />
            <Row
              label="Cotação"
              values={selected.map((s) =>
                quotes[s] ? fmtBRL(quotes[s].regularMarketPrice) : '—',
              )}
            />
            <Row
              label="Variação hoje"
              values={selected.map((s) =>
                quotes[s] ? fmtPct(quotes[s].regularMarketChangePercent) : '—',
              )}
              colors={selected.map((s) =>
                quotes[s]
                  ? quotes[s].regularMarketChangePercent >= 0
                    ? colors.success
                    : colors.danger
                  : colors.text,
              )}
            />
            <Row
              label="DY anual"
              values={selected.map((s) =>
                details[s]?.dividendYield != null && details[s]!.dividendYield! > 0
                  ? `${details[s]!.dividendYield!.toFixed(2)}%`
                  : '—',
              )}
            />
            <Row
              label="P/L"
              values={selected.map((s) =>
                details[s]?.trailingPE != null
                  ? details[s]!.trailingPE!.toFixed(2)
                  : '—',
              )}
            />
            <Row
              label="P/VP"
              values={selected.map((s) =>
                details[s]?.priceToBook != null
                  ? details[s]!.priceToBook!.toFixed(2)
                  : '—',
              )}
            />
            <Row
              label="ROE"
              values={selected.map((s) =>
                details[s]?.returnOnEquity != null && details[s]!.returnOnEquity! > 0
                  ? `${details[s]!.returnOnEquity!.toFixed(1)}%`
                  : '—',
              )}
            />
            <Row
              label="ROA"
              values={selected.map((s) =>
                details[s]?.returnOnAssets != null && details[s]!.returnOnAssets! > 0
                  ? `${details[s]!.returnOnAssets!.toFixed(1)}%`
                  : '—',
              )}
            />
            <Row
              label="Margem"
              values={selected.map((s) =>
                details[s]?.profitMargins != null && details[s]!.profitMargins! !== 0
                  ? `${details[s]!.profitMargins!.toFixed(1)}%`
                  : '—',
              )}
            />
            <Row
              label="Beta"
              values={selected.map((s) =>
                details[s]?.beta != null ? details[s]!.beta!.toFixed(2) : '—',
              )}
            />
            <Row
              label="Setor"
              values={selected.map((s) => details[s]?.sector || '—')}
              small
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  values,
  bold,
  small,
  colors: rowColors,
}: {
  label: string;
  values: string[];
  bold?: boolean;
  small?: boolean;
  colors?: string[];
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
      {values.map((v, i) => (
        <Text
          key={i}
          style={[
            styles.rowValue,
            bold && styles.rowValueBold,
            small && { fontSize: fontSize.tiny },
            rowColors && rowColors[i] ? { color: rowColors[i] } : null,
          ]}
          numberOfLines={1}
        >
          {v}
        </Text>
      ))}
    </View>
  );
}

function RowSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  headerTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selectedChipText: { color: colors.primary, fontWeight: '700', marginRight: 6 },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, paddingVertical: spacing.md, marginLeft: spacing.sm, fontSize: fontSize.body, color: colors.text },
  suggestionsBox: { marginTop: spacing.sm, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  suggSymbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  suggName: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },

  empty: { padding: spacing.xxl, alignItems: 'center', marginTop: spacing.lg },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },

  loading: { padding: spacing.xxl, alignItems: 'center' },
  loadingText: { color: colors.textSecondary, marginTop: spacing.sm },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  rowLabel: { width: 100, fontSize: fontSize.small, color: colors.textSecondary },
  rowLabelBold: { color: colors.text, fontWeight: '700' },
  rowValue: { flex: 1, fontSize: fontSize.body, color: colors.text, textAlign: 'center' },
  rowValueBold: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.primary },
  separator: { height: 1, backgroundColor: colors.divider, marginVertical: 2 },
});
