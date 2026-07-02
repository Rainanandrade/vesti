import { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, fontSize, spacing } from '../theme/colors';
import { fmtCompactBRL } from '../utils/format';

type Point = { date: string; total: number };

type Props = {
  data: Point[];
  privacyMode?: boolean;
  height?: number;
};

export default function PortfolioChart({ data, privacyMode, height = 180 }: Props) {
  const [w, setW] = useState(320);
  const onLayout = (e: LayoutChangeEvent) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width > 0 && Math.abs(width - w) > 2) setW(width);
  };
  const h = height;
  const padX = 8;
  const padY = 20;

  if (!data || data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>
          {data?.length === 1
            ? 'Vamos guardar a evolução do seu patrimônio a partir de hoje.'
            : 'O gráfico aparece quando tivermos pelo menos 2 dias registrados.'}
        </Text>
      </View>
    );
  }

  const values = data.map((p) => p.total);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  // Padding vertical no eixo Y pra linha não colar nos extremos
  const rawRange = rawMax - rawMin;
  const pad = rawRange > 0 ? rawRange * 0.15 : rawMax * 0.05 || 1;
  const max = rawMax + pad;
  const min = Math.max(0, rawMin - pad);
  const range = max - min || 1;

  const xStep = (w - padX * 2) / (data.length - 1);
  const points = data.map((p, i) => {
    const x = padX + i * xStep;
    const y = padY + (h - padY * 2) * (1 - (p.total - min) / range);
    return { x, y, ...p };
  });

  const path = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  const fillPath = `${path} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  const first = values[0];
  const last = values[values.length - 1];
  const diff = last - first;
  const diffPct = first > 0 ? (diff / first) * 100 : 0;
  const positive = diff >= 0;
  const lineColor = positive ? colors.success : colors.danger;

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>Atual</Text>
          <Text style={styles.summaryValue}>{fmtCompactBRL(last, privacyMode)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.summaryLabel}>Variação no período</Text>
          <Text style={[styles.summaryValue, { color: lineColor }]}>
            {positive ? '↑' : '↓'} {fmtCompactBRL(Math.abs(diff), privacyMode)} ({diffPct.toFixed(2)}%)
          </Text>
        </View>
      </View>

      <Svg width={w} height={h}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity="0.25" />
            <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {/* Grid lines (3 horizontais) */}
        {[0, 0.5, 1].map((f, i) => {
          const y = padY + (h - padY * 2) * f;
          return (
            <Line
              key={i}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke={colors.divider}
              strokeWidth={1}
              strokeDasharray="3,4"
            />
          );
        })}
        <Path d={fillPath} fill="url(#grad)" />
        <Path d={path} stroke={lineColor} strokeWidth={2.5} fill="none" />
        <Circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={lineColor} />
        {/* Labels min/max */}
        <SvgText x={w - padX - 4} y={padY + 4} fontSize="9" fill={colors.textTertiary} textAnchor="end">
          {fmtCompactBRL(rawMax, privacyMode)}
        </SvgText>
        <SvgText x={w - padX - 4} y={h - 6} fontSize="9" fill={colors.textTertiary} textAnchor="end">
          {fmtCompactBRL(rawMin, privacyMode)}
        </SvgText>
      </Svg>

      <View style={styles.xLabels}>
        <Text style={styles.xLabel}>{formatLabel(data[0].date)}</Text>
        <Text style={styles.xLabel}>{formatLabel(data[data.length - 1].date)}</Text>
      </View>
    </View>
  );
}

function formatLabel(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.tiny,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  xLabel: { fontSize: fontSize.tiny, color: colors.textTertiary },
});
