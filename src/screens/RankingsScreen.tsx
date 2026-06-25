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
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Card from '../components/Card';
import { fetchRanking, RANKING_CATEGORIES, RankingResponse } from '../api/rankings';
import { safeBackToTabs } from '../utils/navigation';

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Rankings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar} contentContainerStyle={{ padding: spacing.md }}>
        {RANKING_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            style={[styles.catChip, category === c.key && styles.catChipActive]}
            onPress={() => setCategory(c.key)}
          >
            <Text style={[styles.catEmoji, category === c.key && { color: colors.textLight }]}>
              {c.emoji}
            </Text>
            <Text style={[styles.catText, category === c.key && styles.catTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={styles.loadingText}>Carregando ranking...</Text>
          </View>
        )}
        {!loading && data && (
          <>
            <Text style={styles.subtitle}>{data.label}</Text>
            {data.items.map((it, i) => (
              <Card key={it.symbol} style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <View style={styles.rank}>
                    <Text style={styles.rankNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.symbol}>{it.symbol}</Text>
                    <Text style={styles.name} numberOfLines={1}>{it.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.metric}>{formatMetric(data.metric, it)}</Text>
                    <Text style={styles.price}>R$ {it.price.toFixed(2)}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}
        {!loading && !data && (
          <Card>
            <Text style={styles.error}>Não foi possível carregar o ranking agora.</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatMetric(metric: string, it: any): string {
  switch (metric) {
    case 'dy': return it.dy != null ? `DY ${it.dy.toFixed(2)}%` : '—';
    case 'pl': return it.pl != null && it.pl > 0 ? `P/L ${it.pl.toFixed(1)}` : '—';
    case 'pvp': return it.pvp != null && it.pvp > 0 ? `P/VP ${it.pvp.toFixed(2)}` : '—';
    case 'change': return `${it.change >= 0 ? '+' : ''}${it.change.toFixed(2)}%`;
    case 'volume': return `Vol: ${(it.volume / 1_000_000).toFixed(1)}M`;
    default: return '—';
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  catBar: { maxHeight: 60, borderBottomWidth: 1, borderColor: colors.divider },
  catChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, marginRight: spacing.sm },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catEmoji: { fontSize: 14, marginRight: 4 },
  catText: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '600' },
  catTextActive: { color: colors.textLight, fontWeight: '700' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  subtitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  loadingBox: { alignItems: 'center', padding: spacing.xl },
  loadingText: { color: colors.textSecondary, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  rank: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  rankNum: { color: colors.primary, fontWeight: '800', fontSize: fontSize.body },
  symbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  name: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  metric: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.primary },
  price: { fontSize: fontSize.small, color: colors.textTertiary, marginTop: 2 },
  error: { color: colors.textSecondary, textAlign: 'center', padding: spacing.md },
});
