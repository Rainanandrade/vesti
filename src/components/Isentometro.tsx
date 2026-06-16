import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fmtBRL } from '../utils/format';

type Props = {
  totalVendidoNoMes: number;
  privacyMode?: boolean;
};

const LIMITE = 20000;

export default function Isentometro({ totalVendidoNoMes, privacyMode }: Props) {
  const pct = Math.min(100, (totalVendidoNoMes / LIMITE) * 100);
  const isAcima = totalVendidoNoMes > LIMITE;
  const restante = Math.max(0, LIMITE - totalVendidoNoMes);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons
            name={isAcima ? 'warning' : 'shield-checkmark'}
            size={18}
            color={isAcima ? colors.danger : colors.success}
          />
          <Text style={styles.title}>Isentômetro · Swing-trade</Text>
        </View>
        <View style={[styles.badge, isAcima ? styles.badgeBad : styles.badgeOk]}>
          <Text style={[styles.badgeText, { color: isAcima ? colors.danger : colors.success }]}>
            {isAcima ? 'PAGA IR' : 'ISENTO'}
          </Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${pct}%`,
              backgroundColor: isAcima ? colors.danger : colors.success,
            },
          ]}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>R$ 0</Text>
        <Text style={styles.rowLabel}>R$ {(LIMITE / 1000).toFixed(0)}k (limite)</Text>
      </View>

      <View style={styles.detailRow}>
        <View>
          <Text style={styles.detailLabel}>Vendido este mês</Text>
          <Text style={styles.detailValue}>{fmtBRL(totalVendidoNoMes, privacyMode)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.detailLabel}>
            {isAcima ? 'Acima do limite' : 'Pode vender mais'}
          </Text>
          <Text
            style={[
              styles.detailValue,
              { color: isAcima ? colors.danger : colors.success },
            ]}
          >
            {isAcima
              ? `+${fmtBRL(totalVendidoNoMes - LIMITE, privacyMode)}`
              : fmtBRL(restante, privacyMode)}
          </Text>
        </View>
      </View>

      <Text style={styles.note}>
        {isAcima
          ? '⚠️ Você ultrapassou R$ 20.000 vendidos em ações este mês. O lucro está sujeito a 15% de IR.'
          : '✓ Vendas em ações abaixo de R$ 20.000/mês são isentas de IR. Só vale pra swing-trade comum (não day-trade nem FII).'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginLeft: 6 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  badgeOk: { backgroundColor: colors.successLight },
  badgeBad: { backgroundColor: colors.dangerLight },
  badgeText: { fontSize: fontSize.tiny, fontWeight: '800' },

  barTrack: {
    height: 16,
    backgroundColor: colors.divider,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  barFill: { height: 16, borderRadius: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  rowLabel: { fontSize: fontSize.tiny, color: colors.textTertiary },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  detailLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  detailValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },

  note: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 16 },
});
