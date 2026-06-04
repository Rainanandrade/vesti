import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { AssetDetails } from '../api/yahooDetails';
import { TickerInfo } from '../data/tickers';
import { Profile } from '../data/profileQuiz';
import { evaluateAssetForProfile } from '../utils/strategyMatch';
import { fmtBRL } from '../utils/format';

type Props = {
  ticker: TickerInfo;
  details: AssetDetails | null;
  loading: boolean;
  profile: Profile | null;
};

export default function AssetAnalysis({ ticker, details, loading, profile }: Props) {
  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Analisando o ativo...</Text>
      </View>
    );
  }

  if (!profile) return null;

  const match = evaluateAssetForProfile(ticker, details, profile);
  const fitColor =
    match.fitScore >= 70 ? colors.success : match.fitScore >= 50 ? colors.warning : colors.danger;
  const fitBg =
    match.fitScore >= 70 ? colors.successLight : match.fitScore >= 50 ? colors.warningLight : colors.dangerLight;

  return (
    <View style={styles.container}>
      {/* Header: nome + setor */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{details?.longName || details?.shortName || ticker.name}</Text>
          {details?.sector && <Text style={styles.sector}>{details.sector}</Text>}
        </View>
        {details?.currentPrice && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.priceLabel}>Cotação</Text>
            <Text style={styles.priceValue}>{fmtBRL(details.currentPrice)}</Text>
          </View>
        )}
      </View>

      {/* Fit Score */}
      <View style={[styles.fitBox, { backgroundColor: fitBg, borderColor: fitColor }]}>
        <View style={styles.fitTop}>
          <Text style={[styles.fitScore, { color: fitColor }]}>{match.fitScore}/100</Text>
          <Text style={[styles.fitLabel, { color: fitColor }]}>{match.fitLabel}</Text>
        </View>
        {match.reasons.map((r, i) => (
          <Text key={i} style={styles.fitReason}>
            {r}
          </Text>
        ))}
      </View>

      {/* Indicadores */}
      {details && (
        <View style={styles.indicators}>
          <Text style={styles.sectionTitle}>📊 Análise fundamentalista</Text>
          <View style={styles.grid}>
            <Indicator label="P/L" value={details.trailingPE} fmt={(v) => v.toFixed(1)} />
            <Indicator label="DY" value={details.dividendYield} fmt={(v) => `${v.toFixed(1)}%`} />
            <Indicator label="P/VP" value={details.priceToBook} fmt={(v) => v.toFixed(2)} />
            <Indicator label="ROE" value={details.returnOnEquity} fmt={(v) => `${v.toFixed(1)}%`} />
            <Indicator label="ROA" value={details.returnOnAssets} fmt={(v) => `${v.toFixed(1)}%`} />
            <Indicator
              label="Margem"
              value={details.profitMargins}
              fmt={(v) => `${v.toFixed(1)}%`}
            />
            <Indicator label="Beta" value={details.beta} fmt={(v) => v.toFixed(2)} />
            <Indicator
              label="Payout"
              value={details.payoutRatio}
              fmt={(v) => `${v.toFixed(0)}%`}
            />
            <Indicator
              label="DY 5 anos"
              value={details.fiveYearAvgDividendYield}
              fmt={(v) => `${v.toFixed(1)}%`}
            />
          </View>

          {/* Range 52 semanas */}
          {details.fiftyTwoWeekLow && details.fiftyTwoWeekHigh && details.currentPrice && (
            <View style={styles.rangeBox}>
              <Text style={styles.rangeLabel}>Range 52 semanas</Text>
              <View style={styles.rangeBar}>
                <View
                  style={[
                    styles.rangeMarker,
                    {
                      left: `${
                        ((details.currentPrice - details.fiftyTwoWeekLow) /
                          (details.fiftyTwoWeekHigh - details.fiftyTwoWeekLow)) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.rangeLabels}>
                <Text style={styles.rangeText}>{fmtBRL(details.fiftyTwoWeekLow)}</Text>
                <Text style={styles.rangeText}>{fmtBRL(details.fiftyTwoWeekHigh)}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Bandeiras */}
      {match.positives.length > 0 && (
        <View style={styles.flagsBox}>
          <Text style={styles.flagsTitle}>✅ Pontos positivos</Text>
          {match.positives.map((p, i) => (
            <Text key={i} style={styles.flagItem}>
              • {p}
            </Text>
          ))}
        </View>
      )}

      {match.warnings.length > 0 && (
        <View style={[styles.flagsBox, { backgroundColor: colors.warningLight }]}>
          <Text style={[styles.flagsTitle, { color: colors.warning }]}>⚠️ Pontos de atenção</Text>
          {match.warnings.map((w, i) => (
            <Text key={i} style={styles.flagItem}>
              • {w}
            </Text>
          ))}
        </View>
      )}

      {!details && (
        <Text style={styles.noDetails}>
          Análise fundamentalista indisponível pra esse ticker. Ainda assim, a sugestão considerou seu perfil.
        </Text>
      )}
    </View>
  );
}

function Indicator({
  label,
  value,
  fmt,
}: {
  label: string;
  value: number | undefined;
  fmt: (v: number) => string;
}) {
  return (
    <View style={styles.indicator}>
      <Text style={styles.indicatorLabel}>{label}</Text>
      <Text style={styles.indicatorValue}>{value != null && isFinite(value) ? fmt(value) : '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  loadingText: { marginLeft: spacing.sm, color: colors.textSecondary },

  container: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  sector: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  priceLabel: { fontSize: fontSize.tiny, color: colors.textTertiary },
  priceValue: { fontSize: fontSize.bodyLarge, fontWeight: 'bold', color: colors.primary },

  fitBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  fitTop: { flexDirection: 'row', alignItems: 'baseline' },
  fitScore: { fontSize: fontSize.title, fontWeight: 'bold' },
  fitLabel: { fontSize: fontSize.body, fontWeight: '600', marginLeft: spacing.sm },
  fitReason: { fontSize: fontSize.body, color: colors.text, marginTop: spacing.xs, lineHeight: 18 },

  indicators: { marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  indicator: {
    width: '33.33%',
    paddingVertical: spacing.sm,
  },
  indicatorLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '600' },
  indicatorValue: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginTop: 2 },

  rangeBox: { marginTop: spacing.md },
  rangeLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, marginBottom: 4 },
  rangeBar: {
    height: 6,
    backgroundColor: colors.divider,
    borderRadius: 3,
    position: 'relative',
  },
  rangeMarker: {
    position: 'absolute',
    top: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginLeft: -6,
  },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  rangeText: { fontSize: fontSize.tiny, color: colors.textSecondary },

  flagsBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
  },
  flagsTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.success, marginBottom: spacing.xs },
  flagItem: { fontSize: fontSize.body, color: colors.text, lineHeight: 20 },

  noDetails: {
    marginTop: spacing.sm,
    fontSize: fontSize.small,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
