import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle } from 'react-native-svg';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { ChartData, ChartRange, fetchChart, RANGE_LABELS, clearChartCache } from '../api/chart';
import { fmtBRL } from '../utils/format';

type Props = {
  symbol: string;
  width?: number;
  height?: number;
};

const RANGES: ChartRange[] = ['1mo', '6mo', '1y', '5y'];

export default function PriceChart({ symbol, width = 320, height = 180 }: Props) {
  const [range, setRange] = useState<ChartRange>('1y');
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null); // limpa enquanto carrega — evita ver dados antigos do range anterior
    fetchChart(symbol, range, { force: retryNonce > 0 }).then((d) => {
      if (cancelled) return;
      setData(d);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [symbol, range, retryNonce]);

  const handleRetry = () => {
    // Limpa cache desse símbolo (todos os ranges) e força bypass
    clearChartCache(symbol);
    setRetryNonce((n) => n + 1);
  };

  return (
    <View>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {data && (
            <>
              <Text style={styles.priceLabel}>Histórico ({RANGE_LABELS[range]})</Text>
              <Text
                style={[
                  styles.changeText,
                  { color: data.changePct >= 0 ? colors.success : colors.danger },
                ]}
              >
                {data.changePct >= 0 ? '+' : ''}
                {data.changePct.toFixed(2)}% · {fmtBRL(data.first)} → {fmtBRL(data.last)}
              </Text>
            </>
          )}
        </View>
        <View style={styles.rangeTabs}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeTab, range === r && styles.rangeTabActive]}
              onPress={() => setRange(r)}
            >
              <Text
                style={[styles.rangeTabText, range === r && styles.rangeTabTextActive]}
              >
                {RANGE_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={[styles.placeholder, { width, height }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : data && data.points.length >= 2 ? (
        <ChartSvg data={data} width={width} height={height} />
      ) : (
        <View style={[styles.placeholder, { width, height }]}>
          <Text style={styles.placeholderText}>Histórico indisponível</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
            <Text style={styles.retryText}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ChartSvg({ data, width, height }: { data: ChartData; width: number; height: number }) {
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.points.map((p) => p.c);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.points.map((p, i) => {
    const x = padding.left + (i / (data.points.length - 1)) * chartW;
    const y = padding.top + chartH - ((p.c - min) / range) * chartH;
    return { x, y, c: p.c };
  });

  // Construir o path
  const pathStr = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  // Path da área (pra preencher embaixo)
  const areaPath = `${pathStr} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const isPositive = data.changePct >= 0;
  const lineColor = isPositive ? colors.success : colors.danger;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
          <Stop offset="1" stopColor={lineColor} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      {/* Linha de zero (preço inicial) */}
      <Line
        x1={padding.left}
        x2={padding.left + chartW}
        y1={padding.top + chartH - ((data.first - min) / range) * chartH}
        y2={padding.top + chartH - ((data.first - min) / range) * chartH}
        stroke={colors.border}
        strokeDasharray="3,3"
        strokeWidth={1}
      />
      {/* Área */}
      <Path d={areaPath} fill="url(#gradient)" />
      {/* Linha */}
      <Path d={pathStr} stroke={lineColor} strokeWidth={2} fill="none" />
      {/* Ponto final */}
      <Circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={4}
        fill={lineColor}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  priceLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '600' },
  changeText: { fontSize: fontSize.body, fontWeight: '700', marginTop: 2 },
  rangeTabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 2 },
  rangeTab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  rangeTabActive: { backgroundColor: colors.background },
  rangeTabText: { fontSize: fontSize.tiny, color: colors.textSecondary, fontWeight: '600' },
  rangeTabTextActive: { color: colors.primary },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: radius.md },
  placeholderText: { color: colors.textSecondary, fontSize: fontSize.body },
  retryBtn: { marginTop: 10, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: radius.pill },
  retryText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.small },
});
