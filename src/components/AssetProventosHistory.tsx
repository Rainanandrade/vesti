import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fetchDividendInfo, DividendInfo } from '../api/dividends';
import { fmtBRL, fmtCompactBRL } from '../utils/format';

type Props = {
  symbol: string;
  quantity?: number;          // se passado, mostra também valor recebido pelo user
  privacyMode?: boolean;
};

type YearBucket = { year: number; perCota: number; total: number };

export default function AssetProventosHistory({ symbol, quantity = 0, privacyMode }: Props) {
  const [info, setInfo] = useState<DividendInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDividendInfo(symbol).then((d) => {
      if (!cancelled) {
        setInfo(d);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [symbol]);

  const byYear = useMemo<YearBucket[]>(() => {
    if (!info?.history) return [];
    const map = new Map<number, number>();
    for (const h of info.history) {
      const y = Number(h.date.slice(0, 4));
      map.set(y, (map.get(y) || 0) + h.amount);
    }
    const years = Array.from(map.entries())
      .map(([year, perCota]) => ({ year, perCota, total: perCota * quantity }))
      .sort((a, b) => a.year - b.year)
      .slice(-7); // últimos 7 anos
    return years;
  }, [info, quantity]);

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (byYear.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>💰 Histórico de proventos</Text>
        <Text style={styles.empty}>Sem histórico disponível pra esse ativo.</Text>
      </View>
    );
  }

  const w = Dimensions.get('window').width - 64;
  const h = 200;
  const padX = 16;
  const padY = 30;
  const chartH = h - padY * 2;
  const max = Math.max(...byYear.map((b) => b.perCota), 0.01);
  const barGroupW = (w - padX * 2) / byYear.length;
  const barW = barGroupW * 0.65;

  const sum = byYear.reduce((s, b) => s + b.perCota, 0);
  const avg = sum / byYear.length;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>💰 Histórico de proventos (por cota)</Text>
      <Svg width={w} height={h}>
        {/* Grid */}
        {[0, 0.5, 1].map((f, i) => (
          <Line
            key={i}
            x1={padX}
            x2={w - padX}
            y1={padY + chartH * f}
            y2={padY + chartH * f}
            stroke={colors.divider}
            strokeWidth={1}
            strokeDasharray="3,4"
          />
        ))}
        {byYear.map((b, i) => {
          const cx = padX + barGroupW * i + barGroupW / 2;
          const bh = (b.perCota / max) * chartH;
          return (
            <Svg key={b.year}>
              <Rect
                x={cx - barW / 2}
                y={padY + chartH - bh}
                width={barW}
                height={bh}
                fill={colors.primary}
                rx={3}
              />
              <SvgText
                x={cx}
                y={padY + chartH - bh - 6}
                fontSize="9"
                fill={colors.text}
                textAnchor="middle"
                fontWeight="700"
              >
                {b.perCota.toFixed(2)}
              </SvgText>
              <SvgText
                x={cx}
                y={h - 8}
                fontSize="10"
                fill={colors.textTertiary}
                textAnchor="middle"
              >
                {b.year}
              </SvgText>
            </Svg>
          );
        })}
      </Svg>
      <View style={styles.statsRow}>
        <View>
          <Text style={styles.statLabel}>Média/ano por cota</Text>
          <Text style={styles.statValue}>R$ {avg.toFixed(2)}</Text>
        </View>
        {quantity > 0 && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statLabel}>Total recebido (sua qty)</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {fmtBRL(sum * quantity, privacyMode)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.divider },
  title: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  empty: { fontSize: fontSize.body, color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', padding: spacing.lg },
  loadingBox: { padding: spacing.lg, alignItems: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider },
  statLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '700' },
  statValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
});
