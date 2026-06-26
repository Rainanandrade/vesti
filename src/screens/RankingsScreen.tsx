import { useEffect, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fetchRanking, RANKING_CATEGORIES, RankingResponse, RankingItem } from '../api/rankings';

export default function RankingsScreen({ navigation }: any) {
  const [category, setCategory] = useState(RANKING_CATEGORIES[0].key);
  const [data, setData] = useState<RankingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRanking(category).then((r) => {
      if (!cancelled) {
        setData(r);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [category]);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs');
  };

  const openAsset = (it: RankingItem) => {
    navigation.navigate('AssetDetail', {
      symbol: it.symbol,
      name: it.name,
      type: it.symbol.endsWith('11') ? 'fii' : 'acao',
    });
  };

  const activeCat = RANKING_CATEGORIES.find((c) => c.key === category);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Rankings</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar} contentContainerStyle={{ padding: spacing.md }}>
        {RANKING_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.catChip, category === c.key && styles.catChipActive]}
            onPress={() => setCategory(c.key)}
          >
            <Text style={[styles.catEmoji]}>{c.emoji}</Text>
            <Text style={[styles.catText, category === c.key && styles.catTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Hero da categoria */}
        {activeCat && (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#5C0593']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <Text style={styles.heroEmoji}>{activeCat.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>{activeCat.label}</Text>
              <Text style={styles.heroSub}>
                {data ? `Top ${data.items.length} ativos · atualizado a cada 6h` : 'Carregando...'}
              </Text>
            </View>
          </LinearGradient>
        )}

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Carregando ranking...</Text>
          </View>
        )}

        {!loading && data && data.items.map((it, i) => (
          <TouchableOpacity
            key={it.symbol}
            activeOpacity={0.7}
            onPress={() => openAsset(it)}
            style={styles.itemCard}
          >
            <View style={[styles.rankBadge, rankColor(i + 1)]}>
              <Text style={[styles.rankNum, i + 1 <= 3 && { color: colors.textLight }]}>{i + 1}</Text>
            </View>
            <View style={styles.itemMain}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.itemSymbol}>{it.symbol}</Text>
                <View style={[styles.typeTag, { backgroundColor: it.symbol.endsWith('11') ? colors.warningLight : colors.primaryLight }]}>
                  <Text style={styles.typeTagText}>{it.symbol.endsWith('11') ? 'FII' : 'AÇÃO'}</Text>
                </View>
              </View>
              <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="cash-outline" size={11} color={colors.textTertiary} />
                <Text style={styles.metaText}>R$ {it.price.toFixed(2)}</Text>
                {it.change != null && (
                  <>
                    <Text style={[styles.metaText, { marginLeft: spacing.sm, color: it.change >= 0 ? colors.success : colors.danger }]}>
                      {it.change >= 0 ? '↑' : '↓'} {Math.abs(it.change).toFixed(2)}%
                    </Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{formatMetric(data.metric, it)}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} style={{ marginTop: 4 }} />
            </View>
          </TouchableOpacity>
        ))}

        {!loading && !data && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Não foi possível carregar o ranking agora.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function rankColor(rank: number) {
  if (rank === 1) return { backgroundColor: '#FFD700' };       // ouro
  if (rank === 2) return { backgroundColor: '#C0C0C0' };       // prata
  if (rank === 3) return { backgroundColor: '#CD7F32' };       // bronze
  return { backgroundColor: colors.primaryLight };
}

function formatMetric(metric: string, it: RankingItem): string {
  switch (metric) {
    case 'dy': return it.dy != null ? `${it.dy.toFixed(2)}%` : '—';
    case 'pl': return it.pl != null && it.pl > 0 ? `${it.pl.toFixed(1)}x` : '—';
    case 'pvp': return it.pvp != null && it.pvp > 0 ? `${it.pvp.toFixed(2)}x` : '—';
    case 'change': return `${it.change >= 0 ? '+' : ''}${it.change.toFixed(2)}%`;
    case 'volume': return `${(it.volume / 1_000_000).toFixed(1)}M`;
    default: return '—';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  backBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 70 },
  backText: { color: colors.text, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  catBar: { height: 56, maxHeight: 56, minHeight: 56, flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  catChip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, height: 38, minWidth: 110, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.sm, borderWidth: 1, borderColor: 'transparent', flexShrink: 0 },
  catChipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  catEmoji: { fontSize: 14, marginRight: 6 },
  catText: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
  catTextActive: { color: colors.primary, fontWeight: '800' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  hero: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, shadowColor: colors.primary, shadowOpacity: 0.25, shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6 },
  heroEmoji: { fontSize: 32, marginRight: spacing.md },
  heroLabel: { color: colors.textLight, fontSize: fontSize.title, fontWeight: 'bold' },
  heroSub: { color: '#FFFFFFCC', fontSize: fontSize.small, marginTop: 2 },
  loadingBox: { alignItems: 'center', padding: spacing.xl },
  loadingText: { color: colors.textSecondary, marginTop: spacing.sm },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.divider },
  rankBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rankNum: { color: colors.primary, fontWeight: '800', fontSize: fontSize.body },
  itemMain: { flex: 1, marginLeft: spacing.md },
  itemSymbol: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  itemName: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metaText: { fontSize: fontSize.tiny, color: colors.textTertiary, marginLeft: 3 },
  typeTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, marginLeft: 6 },
  typeTagText: { fontSize: 9, fontWeight: '800', color: colors.text, letterSpacing: 0.5 },
  metricBox: { alignItems: 'flex-end', marginLeft: spacing.sm },
  metricValue: { fontSize: fontSize.bodyLarge, fontWeight: 'bold', color: colors.primary },
  errorCard: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center' },
  errorText: { color: colors.textSecondary, textAlign: 'center' },
});
