import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';

type Props = {
  currentPct: { renda_fixa: number; renda_variavel: number; internacional: number };
  targetPct: { renda_fixa: number; renda_variavel: number; internacional: number };
  showTitle?: boolean;
};

const CLASSES: Array<{
  key: 'renda_fixa' | 'renda_variavel' | 'internacional';
  label: string;
  emoji: string;
  color: string;
  desc: string;
}> = [
  { key: 'renda_fixa', label: 'Renda Fixa', emoji: '🏦', color: colors.primary, desc: 'Tesouro, CDB, LCI/LCA — mais segurança' },
  { key: 'renda_variavel', label: 'Renda Variável', emoji: '📈', color: colors.success, desc: 'Ações, FIIs, ETFs BR — potencial de crescimento' },
  { key: 'internacional', label: 'Internacional', emoji: '🌎', color: colors.warning, desc: 'BDRs, ETFs globais — proteção cambial' },
];

/**
 * Compara alocação atual da carteira × alocação alvo do perfil.
 * Mostra pp de diferença e destaca qual classe precisa mais aporte.
 */
export default function AllocationDelta({ currentPct, targetPct, showTitle = true }: Props) {
  return (
    <View>
      {showTitle && (
        <Text style={styles.title}>Como está sua alocação hoje</Text>
      )}
      <Text style={styles.subtitle}>
        Comparando o que você tem × o ideal pro seu perfil. Números em <Text style={{ fontWeight: '700' }}>pontos percentuais (pp)</Text>.
      </Text>

      {CLASSES.map((cls) => {
        const atual = currentPct[cls.key] || 0;
        const meta = targetPct[cls.key] || 0;
        const diff = atual - meta;              // positivo = excesso, negativo = falta
        const gap = Math.abs(diff);
        const status: 'ok' | 'falta' | 'excesso' =
          gap < 3 ? 'ok' : diff < 0 ? 'falta' : 'excesso';

        return (
          <View key={cls.key} style={styles.classRow}>
            <View style={styles.classHeader}>
              <View style={styles.classNameRow}>
                <Text style={styles.classEmoji}>{cls.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.className}>{cls.label}</Text>
                  <Text style={styles.classDesc}>{cls.desc}</Text>
                </View>
              </View>
              <StatusBadge status={status} gap={gap} />
            </View>

            {/* Barra dupla: atual (sólida) + meta (linha) */}
            <View style={styles.barContainer}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${Math.min(100, atual)}%`, backgroundColor: cls.color }]} />
                {/* Marcador da meta */}
                <View style={[styles.metaMark, { left: `${Math.min(100, meta)}%` }]} />
              </View>
              <View style={styles.barLabels}>
                <Text style={styles.barLabelAtual}>Atual: <Text style={{ fontWeight: '800', color: colors.text }}>{atual.toFixed(1)}%</Text></Text>
                <Text style={styles.barLabelMeta}>Meta: <Text style={{ fontWeight: '800', color: colors.text }}>{meta.toFixed(0)}%</Text></Text>
              </View>
            </View>
          </View>
        );
      })}

      <View style={styles.legendBox}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={styles.legendText}>Sua alocação atual</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={styles.metaMarkLegend} />
          <Text style={styles.legendText}>Meta do seu perfil</Text>
        </View>
      </View>
    </View>
  );
}

function StatusBadge({ status, gap }: { status: 'ok' | 'falta' | 'excesso'; gap: number }) {
  if (status === 'ok') {
    return (
      <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
        <Ionicons name="checkmark-circle" size={12} color={colors.success} />
        <Text style={[styles.badgeText, { color: colors.success }]}>No alvo</Text>
      </View>
    );
  }
  if (status === 'falta') {
    return (
      <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
        <Ionicons name="arrow-up" size={12} color={colors.warning} />
        <Text style={[styles.badgeText, { color: colors.warning }]}>Aumentar {gap.toFixed(1)}pp</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: colors.dangerLight }]}>
      <Ionicons name="arrow-down" size={12} color={colors.danger} />
      <Text style={[styles.badgeText, { color: colors.danger }]}>Reduzir {gap.toFixed(1)}pp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },

  classRow: { marginBottom: spacing.md },
  classHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  classNameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 as any },
  classEmoji: { fontSize: 22 },
  className: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  classDesc: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 1 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 4 as any, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: fontSize.tiny, fontWeight: '800' },

  barContainer: { marginTop: 4 },
  barTrack: { height: 12, backgroundColor: colors.divider, borderRadius: 6, overflow: 'visible', position: 'relative' },
  barFill: { height: '100%', borderRadius: 6 },
  metaMark: {
    position: 'absolute',
    top: -3,
    width: 3,
    height: 18,
    backgroundColor: colors.text,
    borderRadius: 2,
    marginLeft: -1.5,
  },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  barLabelAtual: { fontSize: fontSize.tiny, color: colors.textSecondary },
  barLabelMeta: { fontSize: fontSize.tiny, color: colors.textSecondary },

  legendBox: { flexDirection: 'row', gap: spacing.md as any, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 as any },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  metaMarkLegend: { width: 3, height: 14, backgroundColor: colors.text, borderRadius: 2 },
  legendText: { fontSize: fontSize.tiny, color: colors.textSecondary, fontWeight: '600' },
});
