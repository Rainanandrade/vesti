import { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, fontSize, spacing } from '../theme/colors';
import { fmtBRL } from '../utils/format';

type Series = { label: string; color: string; values: number[] };

type Props = {
  series: Series[];
  labels?: string[];
  height?: number;
  showLegend?: boolean;
  privacyMode?: boolean;
};

/**
 * Sparkline responsivo com 2 séries.
 * Se adapta à largura do container (não fixa em 320px como antes).
 * Mostra eixo Y com 3 marcações, área com gradient sob a série principal
 * e valor final de cada linha destacado.
 */
export default function BenchmarkSparkline({
  series,
  labels,
  height = 160,
  showLegend = true,
  privacyMode,
}: Props) {
  const [width, setWidth] = useState(320);
  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w > 0 && w !== width) setWidth(w);
  };

  const validSeries = series.filter((s) => s.values.length >= 2);
  if (validSeries.length === 0) return null;

  const all = validSeries.flatMap((s) => s.values);
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const pad = (rawMax - rawMin) * 0.1 || rawMax * 0.05 || 1;
  const minY = rawMin - pad;
  const maxY = rawMax + pad;
  const range = maxY - minY || 1;

  const yAxisWidth = 44;
  const padY = 12;
  const plotLeft = yAxisWidth;
  const plotRight = width - 8;
  const plotW = Math.max(50, plotRight - plotLeft);
  const plotH = height - padY * 2;

  const toX = (i: number, len: number) => plotLeft + (i / Math.max(1, len - 1)) * plotW;
  const toY = (v: number) => padY + plotH - ((v - minY) / range) * plotH;

  const buildPath = (values: number[]) => {
    if (values.length < 2) return '';
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, values.length).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
  };

  const buildArea = (values: number[]) => {
    if (values.length < 2) return '';
    const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, values.length).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
    const lastX = toX(values.length - 1, values.length);
    const firstX = toX(0, values.length);
    const baseY = padY + plotH;
    return `${line} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;
  };

  const yTicks = [maxY, (maxY + minY) / 2, minY];
  const primary = validSeries[0];

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      <Svg width={width} height={height}>
        <Defs>
          <SvgGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={primary.color} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={primary.color} stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Gridlines horizontais */}
        {yTicks.map((v, i) => (
          <Line
            key={`gl-${i}`}
            x1={plotLeft}
            y1={toY(v)}
            x2={plotRight}
            y2={toY(v)}
            stroke={colors.divider}
            strokeWidth={1}
            strokeDasharray={i === 1 ? undefined : '2,4'}
          />
        ))}

        {/* Área sob série principal */}
        <Path d={buildArea(primary.values)} fill="url(#areaGrad)" />

        {/* Linhas */}
        {validSeries.map((s) => (
          <Path
            key={s.label}
            d={buildPath(s.values)}
            stroke={s.color}
            strokeWidth={s === primary ? 2.5 : 2}
            fill="none"
            strokeDasharray={s === primary ? undefined : '4,4'}
          />
        ))}

        {/* Ponto final de cada série */}
        {validSeries.map((s) => (
          <Circle
            key={`dot-${s.label}`}
            cx={toX(s.values.length - 1, s.values.length)}
            cy={toY(s.values[s.values.length - 1])}
            r={s === primary ? 4 : 3}
            fill={s.color}
            stroke={colors.background}
            strokeWidth={1.5}
          />
        ))}
      </Svg>

      {/* Labels do eixo Y sobrepostos ao SVG */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { paddingLeft: 4 }]}>
        {yTicks.map((v, i) => (
          <Text
            key={`ylab-${i}`}
            style={[
              styles.yLabel,
              {
                top: toY(v) - 7,
              },
            ]}
          >
            {fmtBRL(v, privacyMode).replace('R$', '').trim()}
          </Text>
        ))}
      </View>

      {showLegend && (
        <View style={styles.legendRow}>
          {validSeries.map((s) => {
            const last = s.values[s.values.length - 1];
            return (
              <View key={s.label} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                <Text style={styles.legendLabel}>{s.label}</Text>
                <Text style={[styles.legendValue, { color: s.color }]}>{fmtBRL(last, privacyMode)}</Text>
              </View>
            );
          })}
        </View>
      )}

      {labels && labels.length >= 2 && (
        <View style={[styles.labelsRow, { paddingLeft: yAxisWidth }]}>
          <Text style={styles.dateLabel}>{labels[0]}</Text>
          <Text style={styles.dateLabel}>{labels[labels.length - 1]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  yLabel: {
    position: 'absolute',
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '600',
    width: 40,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md as any,
    marginTop: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 as any },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendLabel: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '600' },
  legendValue: { fontSize: fontSize.small, fontWeight: '800', marginLeft: 4 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dateLabel: { fontSize: fontSize.tiny, color: colors.textTertiary },
});
