import { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { colors, fontSize, spacing } from '../theme/colors';
import { fmtCompactBRL } from '../utils/format';
import { Provento } from '../context/AppContext';

type Props = {
  proventos: Provento[];
  upcoming: { date: string; amount: number }[];
  privacyMode?: boolean;
  height?: number;
};

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function ProventosBarChart({ proventos, upcoming, privacyMode, height = 220 }: Props) {
  const data = useMemo(() => {
    // Últimos 12 meses + próximos 1 mês
    const months: { key: string; label: string; received: number; expected: number }[] = [];
    const now = new Date();
    const cur = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    for (let i = 0; i < 13; i++) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: MONTHS_PT[cur.getMonth()],
        received: 0,
        expected: 0,
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    proventos.forEach((p) => {
      const key = p.date.slice(0, 7);
      const m = months.find((mm) => mm.key === key);
      if (m) m.received += p.amount;
    });

    upcoming.forEach((u) => {
      const key = u.date.slice(0, 7);
      const m = months.find((mm) => mm.key === key);
      if (m) m.expected += u.amount;
    });

    return months;
  }, [proventos, upcoming]);

  const w = Dimensions.get('window').width - 64;
  const h = height;
  const padX = 8;
  const padY = 24;
  const chartH = h - padY * 2;

  const allValues = data.flatMap((d) => [d.received, d.expected]);
  const max = Math.max(...allValues, 1);

  const barGroupW = (w - padX * 2) / data.length;
  const barW = barGroupW * 0.4;

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={styles.legendText}>Recebidos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.successLight, borderWidth: 1, borderColor: colors.success }]} />
          <Text style={styles.legendText}>A receber</Text>
        </View>
      </View>

      <Svg width={w} height={h}>
        {/* Grid horizontal */}
        {[0, 0.5, 1].map((f, i) => {
          const y = padY + chartH * f;
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
        {/* Bars */}
        {data.map((d, i) => {
          const cx = padX + barGroupW * i + barGroupW / 2;
          const hReceived = (d.received / max) * chartH;
          const hExpected = (d.expected / max) * chartH;
          return (
            <Svg key={d.key}>
              {d.received > 0 && (
                <Rect
                  x={cx - barW}
                  y={padY + chartH - hReceived}
                  width={barW * 0.9}
                  height={hReceived}
                  fill={colors.success}
                  rx={2}
                />
              )}
              {d.expected > 0 && (
                <Rect
                  x={cx + barW * 0.1}
                  y={padY + chartH - hExpected}
                  width={barW * 0.9}
                  height={hExpected}
                  fill={colors.successLight}
                  stroke={colors.success}
                  strokeWidth={1}
                  rx={2}
                />
              )}
              <SvgText
                x={cx}
                y={h - 6}
                fontSize="9"
                fill={colors.textTertiary}
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
            </Svg>
          );
        })}
        {/* Max value label */}
        <SvgText x={w - padX - 4} y={padY + 4} fontSize="9" fill={colors.textTertiary} textAnchor="end">
          {fmtCompactBRL(max, privacyMode)}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendText: { fontSize: fontSize.tiny, color: colors.textSecondary, fontWeight: '600' },
});
