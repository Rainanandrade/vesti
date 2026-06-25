import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { AssetDetails } from '../api/yahooDetails';
import { TickerInfo } from '../data/tickers';

type Props = {
  ticker: TickerInfo;
  details: AssetDetails | null;
};

export default function AssetAbout({ ticker, details }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{details?.longName || ticker.name}</Text>
      <Text style={styles.ticker}>{ticker.symbol}</Text>

      {details?.sector && (
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="business-outline" size={12} color={colors.primary} />
            <Text style={styles.tagText}>{details.sector}</Text>
          </View>
          {details?.industry && (
            <View style={styles.tag}>
              <Ionicons name="briefcase-outline" size={12} color={colors.primary} />
              <Text style={styles.tagText}>{details.industry}</Text>
            </View>
          )}
        </View>
      )}

      {details?.businessSummary ? (
        <Text style={styles.summary}>{details.businessSummary}</Text>
      ) : (
        <Text style={styles.empty}>Descrição da empresa indisponível.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.divider },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  ticker: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: fontSize.tiny, color: colors.primary, fontWeight: '700', marginLeft: 4 },
  summary: { fontSize: fontSize.body, color: colors.text, lineHeight: 22, marginTop: spacing.md },
  empty: { fontSize: fontSize.body, color: colors.textSecondary, fontStyle: 'italic', marginTop: spacing.md },
});
