import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fetchChart, ChartRange } from '../api/chart';
import { IPCA_12M } from '../api/brapi';

type Period = { label: string; range: ChartRange; ipcaAccum: number };

// IPCA acumulado aproximado (atualizado periodicamente — usar valor publico)
const PERIODS: Period[] = [
  { label: '1m', range: '1mo', ipcaAccum: 0.35 },
  { label: '6m', range: '6mo', ipcaAccum: 2.1 },
  { label: '1a', range: '1y', ipcaAccum: IPCA_12M },
  { label: '5a', range: '5y', ipcaAccum: 30 }, // ~5.5% a.a composto em 5y
];

type Props = {
  symbol: string;
};

type Row = { label: string; nominal: number | null; real: number | null };

export default function AssetReturnsPanel({ symbol }: Props) {
  const [rows, setRows] = useState<Row[]>(PERIODS.map((p) => ({ label: p.label, nominal: null, real: null })));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all(
      PERIODS.map(async (p) => {
        const data = await fetchChart(symbol, p.range);
        if (!data) return { label: p.label, nominal: null as number | null, real: null as number | null };
        const nominal = data.changePct;
        const real = nominal - p.ipcaAccum;
        return { label: p.label, nominal, real };
      }),
    ).then((res) => {
      if (!cancelled) {
        setRows(res);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>📈 Rentabilidade do ativo</Text>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.cellHeader, { flex: 0.8 }]}>Período</Text>
        <Text style={[styles.cell, styles.cellHeader, { textAlign: 'right' }]}>Nominal</Text>
        <Text style={[styles.cell, styles.cellHeader, { textAlign: 'right' }]}>Real (vs IPCA)</Text>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <Text style={[styles.cell, { flex: 0.8, fontWeight: '700' }]}>{r.label}</Text>
          <Text style={[styles.cell, valueColor(r.nominal), { textAlign: 'right' }]}>
            {r.nominal == null ? '—' : `${r.nominal >= 0 ? '+' : ''}${r.nominal.toFixed(2)}%`}
          </Text>
          <Text style={[styles.cell, valueColor(r.real), { textAlign: 'right' }]}>
            {r.real == null ? '—' : `${r.real >= 0 ? '+' : ''}${r.real.toFixed(2)}%`}
          </Text>
        </View>
      ))}
      <Text style={styles.footer}>
        Real = rentabilidade nominal − inflação acumulada (IPCA) do período.
      </Text>
    </View>
  );
}

function valueColor(n: number | null) {
  if (n == null) return { color: colors.textTertiary };
  return { color: n >= 0 ? colors.success : colors.danger, fontWeight: '700' as const };
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.divider },
  title: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider },
  row: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider },
  cell: { flex: 1, fontSize: fontSize.body, color: colors.text },
  cellHeader: { color: colors.textTertiary, fontSize: fontSize.tiny, fontWeight: '700', textTransform: 'uppercase' },
  footer: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: spacing.sm, fontStyle: 'italic' },
  loadingBox: { padding: spacing.lg, alignItems: 'center' },
});
