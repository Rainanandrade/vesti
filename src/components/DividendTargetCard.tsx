import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fmtBRL } from '../utils/format';
import Card from './Card';
import { DividendTarget } from '../data/profileQuiz';
import { TargetProgress, targetDescription } from '../utils/dividendTarget';

type Props = {
  target: DividendTarget;
  progress: TargetProgress & { receivedMonthly?: number; projectedMonthly?: number };
  privacyMode?: boolean;
  onPress?: () => void;
};

export default function DividendTargetCard({ target, progress, privacyMode, onPress }: Props) {
  const pct = Math.round(progress.progress * 100);
  const reached = progress.progress >= 1;
  const received = progress.receivedMonthly;
  const projected = progress.projectedMonthly;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Card style={[styles.card, reached && styles.cardReached]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>🎯 Meta de renda passiva</Text>
            <Text style={styles.targetDesc}>{targetDescription(target)}</Text>
          </View>
          {reached && (
            <View style={styles.reachedBadge}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
          )}
        </View>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subLabel}>Recebido/mês</Text>
            <Text style={styles.value}>{fmtBRL(received ?? progress.currentMonthlyAmount, privacyMode)}</Text>
            {projected != null && received != null && projected !== received && (
              <Text style={styles.subValue}>Projeção: {fmtBRL(projected, privacyMode)}/mês</Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.subLabel}>Meta</Text>
            <Text style={[styles.value, { color: colors.primary }]}>
              {fmtBRL(progress.targetMonthlyAmount, privacyMode)}/mês
            </Text>
          </View>
        </View>

        <View style={styles.barBg}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, pct)}%`,
                backgroundColor: reached ? colors.success : colors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.pctText}>
          {pct}% da meta
          {!reached && progress.capitalGap > 0 && (
            <Text style={styles.gapText}>
              {' '}· Falta investir {fmtBRL(progress.capitalGap, privacyMode)}
            </Text>
          )}
        </Text>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {},
  cardReached: { backgroundColor: colors.successLight, borderColor: colors.success },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  label: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '700' },
  targetDesc: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  reachedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  subLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '600' },
  value: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  subValue: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },
  barBg: { height: 10, backgroundColor: colors.divider, borderRadius: 5, marginTop: spacing.md, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  pctText: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: spacing.xs, fontWeight: '600' },
  gapText: { color: colors.textTertiary, fontWeight: 'normal' },
});
