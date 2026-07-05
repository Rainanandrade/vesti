import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Card from './Card';
import BenchmarkSparkline from './BenchmarkSparkline';
import { BENCHMARKS, accumulateBenchmark, getBenchmark } from '../data/benchmarks';
import { PatrimonySnap, filterOutliers } from '../utils/benchmarks';

type Props = {
  snapshots: PatrimonySnap[];
  privacyMode?: boolean;
};

type PeriodKey = 'all' | '12m' | '6m' | '1m';

const PERIODS: Array<{ key: PeriodKey; label: string; days: number }> = [
  { key: 'all', label: 'Desde o início', days: 0 },
  { key: '12m', label: '12 meses', days: 365 },
  { key: '6m', label: '6 meses', days: 183 },
  { key: '1m', label: '1 mês', days: 30 },
];

// Benchmarks visíveis por padrão
const DEFAULT_ENABLED = ['cdi', 'ipca'];

export default function RentabilidadeCompleta({ snapshots, privacyMode }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [enabledBenchmarks, setEnabledBenchmarks] = useState<string[]>(DEFAULT_ENABLED);

  const clean = useMemo(() => filterOutliers(snapshots).sort((a, b) => a.date.localeCompare(b.date)), [snapshots]);

  // Filtra pelo período escolhido
  const filtered = useMemo(() => {
    if (period === 'all' || clean.length === 0) return clean;
    const p = PERIODS.find((x) => x.key === period)!;
    const cutoff = new Date(Date.now() - p.days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return clean.filter((s) => s.date >= cutoff);
  }, [clean, period]);

  const canRender = filtered.length >= 2;

  // Rentabilidade CORRETA: L/P sobre investido (não diferença de patrimônio,
  // pois isso incluiria aportes como se fossem retorno).
  // Fórmula: (total_atual - total_investido) / total_investido
  const portfolioReturnPct = useMemo(() => {
    if (!canRender) return 0;
    const last = filtered[filtered.length - 1];
    return last.invested > 0 ? ((last.total - last.invested) / last.invested) * 100 : 0;
  }, [filtered, canRender]);

  const daysInPeriod = useMemo(() => {
    if (!canRender) return 0;
    const t0 = new Date(filtered[0].date).getTime();
    const t1 = new Date(filtered[filtered.length - 1].date).getTime();
    return Math.max(1, Math.round((t1 - t0) / (24 * 60 * 60 * 1000)));
  }, [filtered, canRender]);

  // Rentabilidade nos últimos 12 meses e último mês (independente do filtro).
  // Cada card mostra o retorno REAL no fim do período: L/P / investido.
  const stats = useMemo(() => {
    const now = Date.now();
    const iso = (offset: number) => new Date(now - offset * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const window = (days: number): { returnPct: number; days: number } => {
      const from = iso(days);
      const inWindow = clean.filter((s) => s.date >= from);
      if (inWindow.length < 1) return { returnPct: 0, days: 0 };
      const last = inWindow[inWindow.length - 1];
      const returnPct = last.invested > 0 ? ((last.total - last.invested) / last.invested) * 100 : 0;
      // Dias de exposição no período
      const first = inWindow[0];
      const t0 = new Date(first.date).getTime();
      const t1 = new Date(last.date).getTime();
      const d = Math.max(1, Math.round((t1 - t0) / (24 * 60 * 60 * 1000)));
      return { returnPct, days: d };
    };
    return {
      total: window(100000),
      last12m: window(365),
      last1m: window(30),
    };
  }, [clean]);

  // Séries do gráfico: carteira + benchmarks ativos.
  // Carteira: L/P sobre investido EM CADA DIA (retorno real, não diff de patrimônio).
  const chartSeries = useMemo(() => {
    if (!canRender) return [];
    const t0 = new Date(filtered[0].date).getTime();

    // Série da carteira: retorno % em cada ponto (L/P / investido daquele dia)
    const portfolioValues = filtered.map((s) => {
      return s.invested > 0 ? ((s.total - s.invested) / s.invested) * 100 : 0;
    });

    const series: Array<{ label: string; color: string; values: number[] }> = [
      { label: 'Rentabilidade', color: colors.primary, values: portfolioValues },
    ];

    // Séries dos benchmarks (mesmo n de pontos que a carteira)
    for (const bId of enabledBenchmarks) {
      const b = getBenchmark(bId);
      if (!b) continue;
      const values = filtered.map((s) => {
        const days = (new Date(s.date).getTime() - t0) / (24 * 60 * 60 * 1000);
        return accumulateBenchmark(b.yearlyRatePct, days);
      });
      series.push({ label: b.name, color: b.color, values });
    }

    return series;
  }, [filtered, enabledBenchmarks, canRender]);

  // Diferença vs CDI no período (em pontos percentuais)
  const cdiInPeriod = useMemo(() => {
    return accumulateBenchmark(11.75, daysInPeriod);
  }, [daysInPeriod]);

  const diffVsCdiPp = portfolioReturnPct - cdiInPeriod;

  const toggleBenchmark = (id: string) => {
    setEnabledBenchmarks((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (clean.length < 2) {
    return (
      <Card>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: spacing.md, fontStyle: 'italic' }}>
          O comparativo com índices aparece quando tivermos pelo menos 2 dias de histórico registrados.
        </Text>
      </Card>
    );
  }

  return (
    <View>
      {/* Cards de retorno */}
      <View style={styles.cardsRow}>
        <StatCard
          label="Rentabilidade total"
          returnPct={stats.total.returnPct}
          days={stats.total.days}
        />
        <StatCard
          label="Últimos 12 meses"
          returnPct={stats.last12m.returnPct}
          days={stats.last12m.days}
        />
        <StatCard
          label="Último mês"
          returnPct={stats.last1m.returnPct}
          days={stats.last1m.days}
        />
      </View>

      {/* Gráfico */}
      <Card style={{ marginTop: spacing.md }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Rentabilidade comparada com índices</Text>
        </View>

        {/* Filtro de período */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.chip, period === p.key && styles.chipActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.chipText, period === p.key && { color: colors.textLight }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Toggle de benchmarks — mostra o retorno acumulado no período embaixo do nome */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
          {BENCHMARKS.map((b) => {
            const active = enabledBenchmarks.includes(b.id);
            const bmValue = accumulateBenchmark(b.yearlyRatePct, daysInPeriod);
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.bmChip, active && { borderColor: b.color, backgroundColor: b.color + '18' }]}
                onPress={() => toggleBenchmark(b.id)}
              >
                <View style={[styles.bmDot, { backgroundColor: b.color, opacity: active ? 1 : 0.3 }]} />
                <View>
                  <Text style={[styles.bmText, active && { color: colors.text, fontWeight: '800' }]}>{b.name}</Text>
                  <Text style={[styles.bmValue, { color: bmValue >= 0 ? colors.success : colors.danger }]}>
                    {bmValue >= 0 ? '+' : ''}{bmValue.toFixed(2)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sparkline com formatação em % */}
        <View style={{ marginTop: spacing.md }}>
          <BenchmarkSparkline
            key={`chart-${period}-${enabledBenchmarks.join(',')}`}
            height={220}
            series={chartSeries}
            labels={[filtered[0].date.split('-').reverse().slice(0, 2).join('/'), filtered[filtered.length - 1].date.split('-').reverse().slice(0, 2).join('/')]}
            showLegend={true}
            yFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
            legendFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`}
          />
        </View>

        {/* Aviso quando período tem poucos dados */}
        {filtered.length < 5 && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
            <Text style={styles.warningText}>
              Você tem só {filtered.length} snapshots no período selecionado. O gráfico fica mais preciso com mais dias de histórico.
            </Text>
          </View>
        )}

        {/* Diff vs CDI */}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>vs CDI no período</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: diffVsCdiPp >= 0 ? colors.success : colors.danger },
            ]}
          >
            {diffVsCdiPp >= 0 ? '+' : ''}{diffVsCdiPp.toFixed(2)} pp
          </Text>
        </View>
        <Text style={styles.footnote}>
          Diferença em pontos percentuais entre sua rentabilidade e o CDI acumulado no mesmo período.
        </Text>
      </Card>
    </View>
  );
}

function StatCard({ label, returnPct, days }: { label: string; returnPct: number; days: number }) {
  const cdi = accumulateBenchmark(11.75, days);
  const diffPp = returnPct - cdi;
  const noData = days === 0;

  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      {noData ? (
        <Text style={styles.statNoData}>Sem histórico suficiente</Text>
      ) : (
        <>
          <Text style={[styles.statValue, { color: returnPct >= 0 ? colors.success : colors.danger }]}>
            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
            <Ionicons
              name={returnPct >= 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={returnPct >= 0 ? colors.success : colors.danger}
            />
          </Text>
          <View style={styles.diffRow}>
            <View style={[styles.diffDot, { backgroundColor: diffPp >= 0 ? colors.success : colors.danger }]} />
            <Text style={styles.diffText}>
              {Math.abs(diffPp).toFixed(2)} pp {diffPp >= 0 ? 'acima' : 'abaixo'} do CDI
            </Text>
          </View>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  cardsRow: { flexDirection: 'row', gap: spacing.sm as any, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: 150, padding: spacing.md },
  statLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: fontSize.heading, fontWeight: '900', marginTop: 6 },
  statNoData: { fontSize: fontSize.small, color: colors.textTertiary, marginTop: 6, fontStyle: 'italic' },
  diffRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 as any },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  diffText: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '600' },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },

  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider, marginRight: 6 },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.small, color: colors.text, fontWeight: '700' },

  bmChip: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider, marginRight: 6 },
  bmDot: { width: 10, height: 10, borderRadius: 5 },
  bmText: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '600' },
  bmValue: { fontSize: fontSize.tiny, fontWeight: '800', marginTop: 2 },
  warningBox: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, backgroundColor: colors.warningLight, padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.sm },
  warningText: { fontSize: fontSize.tiny, color: colors.warning, flex: 1, lineHeight: 16 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md },
  summaryLabel: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '700' },
  summaryValue: { fontSize: fontSize.bodyLarge, fontWeight: '900' },
  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 6, fontStyle: 'italic', textAlign: 'center' },
});
