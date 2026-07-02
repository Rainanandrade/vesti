import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing } from '../theme/colors';
import { computeReturnMetrics, PatrimonySnap } from '../utils/benchmarks';

type Props = {
  snapshots: PatrimonySnap[];  // série completa (data + total)
  compact?: boolean;
};

/**
 * Mostra 4 métricas de performance da carteira em minicards:
 * - Retorno anualizado
 * - Volatilidade anualizada
 * - Max Drawdown
 * - Sharpe (usa Selic 10.5% como risk-free)
 *
 * Só renderiza se houver ≥ 30 dias de histórico (senão as métricas seriam ruído).
 */
export default function PortfolioMetrics({ snapshots, compact }: Props) {
  const metrics = computeReturnMetrics(snapshots);
  if (!metrics) return null;

  const cells = [
    {
      label: 'Retorno anualizado',
      value: `${metrics.annualizedReturnPct >= 0 ? '+' : ''}${metrics.annualizedReturnPct.toFixed(1)}%`,
      color: metrics.annualizedReturnPct >= 0 ? colors.success : colors.danger,
      help: 'Rentabilidade da carteira projetada pra 12 meses',
    },
    {
      label: 'Volatilidade',
      value: `${metrics.volAnnualPct.toFixed(1)}%`,
      color: colors.warning,
      help: 'O quanto o patrimônio oscila (anualizado)',
    },
    {
      label: 'Max Drawdown',
      value: `-${metrics.maxDrawdownPct.toFixed(1)}%`,
      color: colors.danger,
      help: 'Maior queda a partir de um pico',
    },
    {
      label: 'Sharpe',
      value: metrics.sharpe.toFixed(2),
      color: metrics.sharpe >= 1 ? colors.success : metrics.sharpe >= 0 ? colors.warning : colors.danger,
      help: 'Retorno acima da Selic por unidade de risco. > 1 é bom.',
    },
  ];

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {cells.map((c) => (
        <View key={c.label} style={styles.cell}>
          <Text style={styles.label}>{c.label}</Text>
          <Text style={[styles.value, { color: c.color }]}>{c.value}</Text>
          <Text style={styles.help}>{c.help}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingTop: spacing.sm,
  },
  compact: { marginTop: spacing.sm, paddingTop: spacing.xs },
  cell: { width: '50%', paddingVertical: 6, paddingRight: spacing.sm },
  label: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase' },
  value: { fontSize: fontSize.bodyLarge, fontWeight: '800', marginTop: 2 },
  help: { fontSize: 10, color: colors.textTertiary, marginTop: 2, lineHeight: 12 },
});
