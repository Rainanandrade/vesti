import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { AssetDetails } from '../api/yahooDetails';
import { TickerInfo } from '../data/tickers';
import { buildChecklist, checklistScore } from '../utils/investorChecklist';

type Props = {
  ticker: TickerInfo;
  details: AssetDetails | null;
};

export default function InvestorChecklist({ ticker, details }: Props) {
  const items = buildChecklist(ticker, details);
  const { passed, total, pct } = checklistScore(items);
  const color = pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>✅ Checklist do investidor</Text>
        <Text style={[styles.score, { color }]}>{passed}/{total}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.row}>
          <Ionicons
            name={item.passed ? 'checkmark-circle' : 'close-circle'}
            size={20}
            color={item.passed ? colors.success : colors.textTertiary}
          />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={[styles.label, !item.passed && { color: colors.textSecondary }]}>
              {item.label}
            </Text>
            {item.reason && <Text style={styles.reason}>{item.reason}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.divider },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm },
  title: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  score: { fontSize: fontSize.title, fontWeight: 'bold' },
  barBg: { height: 6, backgroundColor: colors.divider, borderRadius: 3, marginBottom: spacing.md, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider },
  label: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  reason: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },
});
