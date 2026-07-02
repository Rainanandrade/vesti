import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { colors, fontSize, spacing } from '../theme/colors';

type Series = { label: string; color: string; values: number[] };

type Props = {
  series: Series[];        // ordem: [carteira, benchmark]
  labels?: string[];        // datas curtinhas (opcional, mostra 3-4)
  width?: number;
  height?: number;
  yPrefix?: string;         // 'R$' opcional
  showLegend?: boolean;
};

/**
 * Gráfico compacto de linhas comparando 2 séries.
 * Usado pra "Carteira vs Inflação" e "Carteira vs Ibovespa".
 *
 * Renderiza SVG com auto-escala e linha zero, sem eixos formais.
 */
export default function BenchmarkSparkline({
  series,
  labels,
  width = 320,
  height = 120,
  showLegend = true,
}: Props) {
  const validSeries = series.filter((s) => s.values.length >= 2);
  if (validSeries.length === 0) return null;

  const N = Math.max(...validSeries.map((s) => s.values.length));
  const all = validSeries.flatMap((s) => s.values);
  const minY = Math.min(...all);
  const maxY = Math.max(...all);
  const range = maxY - minY || 1;

  const padX = 8;
  const padY = 10;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;

  const toX = (i: number, len: number) => padX + (i / Math.max(1, len - 1)) * plotW;
  const toY = (v: number) => padY + plotH - ((v - minY) / range) * plotH;

  const buildPath = (values: number[]) => {
    if (values.length < 2) return '';
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, values.length).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  };

  return (
    <View>
      <Svg width={width} height={height}>
        {/* Baseline (linha do valor inicial da carteira) */}
        {validSeries[0].values.length > 0 && (
          <Line
            x1={padX}
            y1={toY(validSeries[0].values[0])}
            x2={width - padX}
            y2={toY(validSeries[0].values[0])}
            stroke={colors.divider}
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {validSeries.map((s) => (
          <Path
            key={s.label}
            d={buildPath(s.values)}
            stroke={s.color}
            strokeWidth={2}
            fill="none"
          />
        ))}

        {/* Ponto final destacado em cada série */}
        {validSeries.map((s) => (
          <Circle
            key={`dot-${s.label}`}
            cx={toX(s.values.length - 1, s.values.length)}
            cy={toY(s.values[s.values.length - 1])}
            r={3}
            fill={s.color}
          />
        ))}
      </Svg>

      {showLegend && (
        <View style={styles.legendRow}>
          {validSeries.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {labels && labels.length > 0 && (
        <View style={styles.labelsRow}>
          {labels.slice(0, 4).map((l, i) => (
            <Text key={i} style={styles.labelText}>{l}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: { flexDirection: 'row', gap: spacing.md as any, marginTop: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { fontSize: fontSize.tiny, color: colors.textSecondary, fontWeight: '600' },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  labelText: { fontSize: fontSize.tiny, color: colors.textTertiary },
});
