import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fetchChart } from '../api/chart';

type Props = {
  portfolioReturnPct: number | null; // % de retorno da carteira no período
  daysOfHistory: number;             // dias de histórico da carteira (pra escolher range)
};

export default function IbovespaComparison({ portfolioReturnPct, daysOfHistory }: Props) {
  const [ibovChangePct, setIbovChangePct] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'1mo' | '6mo' | '1y' | '5y'>('1y');

  useEffect(() => {
    // Escolhe range que melhor se aproxima do histórico da carteira
    let chosenRange: typeof range = '1y';
    if (daysOfHistory < 45) chosenRange = '1mo';
    else if (daysOfHistory < 200) chosenRange = '6mo';
    else if (daysOfHistory < 400) chosenRange = '1y';
    else chosenRange = '5y';
    setRange(chosenRange);

    let cancelled = false;
    setLoading(true);
    fetchChart('^BVSP', chosenRange).then((d) => {
      if (cancelled) return;
      if (d) setIbovChangePct(d.changePct);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [daysOfHistory]);

  if (portfolioReturnPct == null) return null;

  const rangeLabel = {
    '1mo': 'no último mês',
    '6mo': 'nos últimos 6 meses',
    '1y': 'no último ano',
    '5y': 'nos últimos 5 anos',
  }[range];

  const beating = ibovChangePct != null && portfolioReturnPct > ibovChangePct;
  const diff = ibovChangePct != null ? portfolioReturnPct - ibovChangePct : 0;

  // Pra barras visuais, normalizamos pelo maior absoluto entre os 2
  const maxAbs = Math.max(Math.abs(portfolioReturnPct), Math.abs(ibovChangePct || 0), 1);

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🏆 Sua carteira vs Ibovespa</Text>
        <Text style={styles.rangeLabel}>{rangeLabel}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : ibovChangePct == null ? (
        <Text style={styles.errorText}>Não consegui carregar o Ibovespa agora.</Text>
      ) : (
        <>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Sua carteira</Text>
            <Text style={[styles.rowValue, { color: portfolioReturnPct >= 0 ? colors.success : colors.danger }]}>
              {portfolioReturnPct >= 0 ? '+' : ''}{portfolioReturnPct.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(Math.abs(portfolioReturnPct) / maxAbs) * 100}%`,
                  backgroundColor: portfolioReturnPct >= 0 ? colors.success : colors.danger,
                },
              ]}
            />
          </View>

          <View style={[styles.row, { marginTop: spacing.sm }]}>
            <Text style={styles.rowLabel}>Ibovespa</Text>
            <Text style={[styles.rowValue, { color: ibovChangePct >= 0 ? colors.success : colors.danger }]}>
              {ibovChangePct >= 0 ? '+' : ''}{ibovChangePct.toFixed(2)}%
            </Text>
          </View>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(Math.abs(ibovChangePct) / maxAbs) * 100}%`,
                  backgroundColor: ibovChangePct >= 0 ? colors.textSecondary : colors.danger,
                },
              ]}
            />
          </View>

          <View style={[styles.verdict, beating ? styles.verdictWin : styles.verdictLose]}>
            <Ionicons
              name={beating ? 'trophy' : 'trending-down'}
              size={16}
              color={beating ? colors.success : colors.warning}
            />
            <Text style={styles.verdictText}>
              {beating
                ? `Você está SUPERANDO o Ibovespa em ${diff.toFixed(2)} pp`
                : `Você está atrás do Ibovespa em ${Math.abs(diff).toFixed(2)} pp`}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  rangeLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase' },
  loadingBox: { padding: spacing.lg, alignItems: 'center' },
  errorText: { color: colors.textSecondary, fontSize: fontSize.body, textAlign: 'center', paddingVertical: spacing.md },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '500' },
  rowValue: { fontSize: fontSize.bodyLarge, fontWeight: '700' },
  barBg: { height: 8, backgroundColor: colors.divider, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },

  verdict: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  verdictWin: { backgroundColor: colors.successLight },
  verdictLose: { backgroundColor: colors.warningLight },
  verdictText: { flex: 1, fontSize: fontSize.body, color: colors.text, fontWeight: '600', marginLeft: spacing.sm },
});
