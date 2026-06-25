import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { colors, fontSize, spacing } from '../theme/colors';

const PALETTE = [
  '#1E88E5', '#42A5F5', '#26C6DA', '#66BB6A', '#FFCA28',
  '#FF7043', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0',
];

type Slice = { label: string; value: number; color?: string };

type Props = {
  data: Slice[];
  size?: number;
  showInsideLabels?: boolean;
};

export default function PortfolioDonut({ data, size = 280, showInsideLabels = true }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const innerR = r * 0.55;

  const slices = useMemo(() => {
    if (total <= 0) return [];
    let acc = 0;
    return data.map((d, i) => {
      const startA = (acc / total) * 2 * Math.PI - Math.PI / 2;
      acc += d.value;
      const endA = (acc / total) * 2 * Math.PI - Math.PI / 2;
      const midA = (startA + endA) / 2;
      const pct = (d.value / total) * 100;

      // Anel donut path
      const x1 = cx + r * Math.cos(startA);
      const y1 = cy + r * Math.sin(startA);
      const x2 = cx + r * Math.cos(endA);
      const y2 = cy + r * Math.sin(endA);
      const x3 = cx + innerR * Math.cos(endA);
      const y3 = cy + innerR * Math.sin(endA);
      const x4 = cx + innerR * Math.cos(startA);
      const y4 = cy + innerR * Math.sin(startA);
      const largeArc = endA - startA > Math.PI ? 1 : 0;

      const path = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`;

      // Label position (middle of slice ring)
      const labelR = (r + innerR) / 2;
      const lx = cx + labelR * Math.cos(midA);
      const ly = cy + labelR * Math.sin(midA);

      return {
        path,
        color: d.color || PALETTE[i % PALETTE.length],
        label: d.label,
        pct,
        lx,
        ly,
      };
    });
  }, [data, total, cx, cy, r, innerR]);

  if (total <= 0) {
    return (
      <View style={[styles.empty, { width: size, height: size }]}>
        <Text style={styles.emptyText}>Sem dados</Text>
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {slices.map((s, i) => (
          <Path key={i} d={s.path} fill={s.color} />
        ))}
        {showInsideLabels && slices.filter((s) => s.pct >= 5).map((s, i) => (
          <SvgText
            key={`l-${i}`}
            x={s.lx}
            y={s.ly}
            fontSize="10"
            fontWeight="700"
            fill={colors.text}
            textAnchor="middle"
          >
            {s.label}
          </SvgText>
        ))}
        {showInsideLabels && slices.filter((s) => s.pct >= 5).map((s, i) => (
          <SvgText
            key={`p-${i}`}
            x={s.lx}
            y={s.ly + 12}
            fontSize="9"
            fill={colors.text}
            textAnchor="middle"
          >
            {s.pct.toFixed(2)}%
          </SvgText>
        ))}
      </Svg>

      <View style={styles.legend}>
        {data.map((d, i) => {
          const color = d.color || PALETTE[i % PALETTE.length];
          const pct = (d.value / total) * 100;
          return (
            <View key={d.label} style={styles.legendRow}>
              <Text style={styles.legendLabel}>{d.label}</Text>
              <Text style={styles.legendPct}>{pct.toFixed(2)}%</Text>
              <View style={styles.barWrap}>
                <View style={[styles.bar, { width: `${Math.max(8, pct)}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { backgroundColor: colors.surface, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textTertiary, fontSize: fontSize.body },
  legend: { width: '100%', marginTop: spacing.lg },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: spacing.sm as any },
  legendLabel: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, width: 70 },
  legendPct: { fontSize: fontSize.body, color: colors.textSecondary, width: 60, textAlign: 'right' },
  barWrap: { flex: 1, height: 8, backgroundColor: colors.divider, borderRadius: 4, marginLeft: spacing.sm, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4 },
});
