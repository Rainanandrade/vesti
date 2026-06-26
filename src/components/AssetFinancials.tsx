import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { AssetDetails } from '../api/yahooDetails';
import { fmtCompactBRL } from '../utils/format';

type Props = {
  details: AssetDetails | null;
  loading?: boolean;
};

export default function AssetFinancials({ details, loading }: Props) {
  if (loading) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Carregando resultados financeiros...</Text>
      </View>
    );
  }
  if (!details) {
    return (
      <View style={styles.empty}>
        <Ionicons name="bar-chart-outline" size={32} color={colors.textTertiary} />
        <Text style={styles.emptyText}>Sem dados financeiros disponíveis pra esse ativo no momento.</Text>
      </View>
    );
  }

  const rows = [
    { label: 'Valor de Mercado', value: details.marketCap, fmt: (v: number) => fmtCompactBRL(v) },
    { label: 'Caixa total', value: details.totalCash, fmt: (v: number) => fmtCompactBRL(v) },
    { label: 'Dívida total', value: details.totalDebt, fmt: (v: number) => fmtCompactBRL(v) },
    { label: 'Dívida / Patrimônio', value: details.debtToEquity, fmt: (v: number) => `${v.toFixed(1)}%` },
    { label: 'Margem líquida', value: details.profitMargins, fmt: (v: number) => `${v.toFixed(1)}%` },
    { label: 'ROE (Retorno sobre PL)', value: details.returnOnEquity, fmt: (v: number) => `${v.toFixed(1)}%` },
    { label: 'ROA (Retorno sobre Ativos)', value: details.returnOnAssets, fmt: (v: number) => `${v.toFixed(1)}%` },
    { label: 'Crescimento da Receita', value: details.revenueGrowth, fmt: (v: number) => `${v.toFixed(1)}%`, colored: true },
    { label: 'Crescimento do Lucro', value: details.earningsGrowth, fmt: (v: number) => `${v.toFixed(1)}%`, colored: true },
    { label: 'P/L (Preço / Lucro)', value: details.trailingPE, fmt: (v: number) => `${v.toFixed(1)}x` },
    { label: 'P/VP (Preço / Valor Patrim.)', value: details.priceToBook, fmt: (v: number) => `${v.toFixed(2)}x` },
    { label: 'Payout (% do lucro distribuído)', value: details.payoutRatio, fmt: (v: number) => `${v.toFixed(0)}%` },
  ];

  const available = rows.filter((r) => r.value != null && isFinite(r.value as number));

  return (
    <View>
      <Text style={styles.title}>📊 Resultados financeiros</Text>
      <Text style={styles.subtitle}>Últimos 12 meses reportados pela companhia</Text>

      {available.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>
            Resultados financeiros não disponíveis pra esse ativo na fonte gratuita. FIIs e Units geralmente não trazem.
          </Text>
        </View>
      )}

      {available.map((r) => {
        const v = r.value as number;
        const color = r.colored
          ? v >= 0
            ? colors.success
            : colors.danger
          : colors.text;
        return (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={[styles.rowValue, { color }]}>{r.fmt(v)}</Text>
          </View>
        );
      })}

      <View style={styles.footnote}>
        <Ionicons name="information-circle-outline" size={14} color={colors.textTertiary} />
        <Text style={styles.footText}>
          Dados consolidados da brapi/Yahoo. Pra análise mais profunda (DRE, balanço completo), consulte ri.{'<empresa>'}.com.br.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { padding: spacing.lg, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider },
  rowLabel: { fontSize: fontSize.body, color: colors.textSecondary, flex: 1, paddingRight: spacing.sm },
  rowValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  footnote: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md },
  footText: { fontSize: fontSize.tiny, color: colors.textTertiary, flex: 1, marginLeft: 6, lineHeight: 14 },
});
