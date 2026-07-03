import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { PRO_FEATURES } from '../data/proFeatures';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubscribe?: () => void;   // clique em "Assinar Vesti Pro"
  highlightIcon?: string;     // ícone da feature que o usuário tocou (destaca no topo da lista)
  title?: string;
  subtitle?: string;
};

/**
 * Modal que abre quando o usuário tenta usar uma feature Pro sem ser assinante.
 * Mostra TODAS as features do Pro (não só a que foi tocada) — o objetivo é
 * comunicar o valor completo do plano.
 */
export default function PremiumLockModal({
  visible,
  onClose,
  onSubscribe,
  highlightIcon,
  title = 'Vesti Pro',
  subtitle = 'Tudo que você desbloqueia assinando',
}: Props) {
  // Coloca a feature clicada no topo da lista (se identificada)
  const ordered = highlightIcon
    ? [
        ...PRO_FEATURES.filter((f) => f.icon === highlightIcon),
        ...PRO_FEATURES.filter((f) => f.icon !== highlightIcon),
      ]
    : PRO_FEATURES;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#0B5345']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.proBadge}>
              <Ionicons name="diamond" size={14} color={colors.primary} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </LinearGradient>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: spacing.md }}>
            {ordered.map((f) => (
              <View
                key={f.title}
                style={[styles.featRow, highlightIcon === f.icon && styles.featRowHighlight]}
              >
                <View style={[styles.iconBox, f.status === 'soon' && styles.iconBoxSoon]}>
                  <Ionicons name={f.icon as any} size={18} color={f.status === 'soon' ? colors.textTertiary : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.featTitleRow}>
                    <Text style={styles.featTitle}>{f.title}</Text>
                    {f.status === 'soon' && (
                      <View style={styles.soonBadge}>
                        <Text style={styles.soonText}>EM BREVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.featDesc}>{f.description}</Text>
                </View>
              </View>
            ))}

            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>A partir de</Text>
              <Text style={styles.price}>R$ 9,90<Text style={styles.priceUnit}>/mês</Text></Text>
              <Text style={styles.priceHint}>ou R$ 99/ano (2 meses grátis) · 7 dias grátis pra testar</Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => { onClose(); setTimeout(() => onSubscribe?.(), 250); }}
              activeOpacity={0.85}
            >
              <Text style={styles.btnPrimaryText}>Ver planos e assinar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.btnSecondary}>
              <Text style={styles.btnSecondaryText}>Depois</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    overflow: 'hidden',
    maxHeight: '92%',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  headerGradient: { padding: spacing.lg, alignItems: 'center' },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  proBadgeText: { color: colors.primary, fontWeight: '800', marginLeft: 4, fontSize: 11, letterSpacing: 0.5 },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.textLight, textAlign: 'center' },
  subtitle: { fontSize: fontSize.body, color: '#FFFFFFDD', textAlign: 'center', marginTop: 4 },

  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  featRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.md as any,
  },
  featRowHighlight: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginHorizontal: -spacing.sm,
  },
  iconBox: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxSoon: { backgroundColor: colors.divider },
  featTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 as any },
  featTitle: { fontSize: fontSize.body, fontWeight: '800', color: colors.text, flexShrink: 1 },
  featDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  soonBadge: { backgroundColor: colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill },
  soonText: { color: colors.warning, fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },

  priceBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  priceLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase' },
  price: { fontSize: 36, fontWeight: '900', color: colors.primary, marginTop: 2 },
  priceUnit: { fontSize: fontSize.body, fontWeight: '600', color: colors.textSecondary },
  priceHint: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.divider,
    gap: spacing.sm as any,
  },
  btnPrimary: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.textLight, fontWeight: '800', fontSize: fontSize.bodyLarge },
  btnSecondary: { padding: spacing.sm, alignItems: 'center' },
  btnSecondaryText: { color: colors.textSecondary, fontWeight: '700' },
});
