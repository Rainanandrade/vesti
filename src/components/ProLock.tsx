import { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
  onUnlock?: () => void;   // ao clicar em "Ver planos"
  mode?: 'blur' | 'replace'; // blur = mostra borrado + overlay; replace = card CTA
};

/**
 * Bloqueia conteúdo pra quem não é Pro.
 * - Pro/trial ativo: renderiza filhos normalmente.
 * - Free/expirado: mostra overlay ou card CTA convidando pra assinar.
 */
export default function ProLock({
  children,
  title = 'Feature exclusiva do Vesti Pro',
  description = 'Assine pra ver métricas avançadas, alertas, IR automático e mais.',
  onUnlock,
  mode = 'blur',
}: Props) {
  const { pro } = useApp();

  if (pro.isPro) return <>{children}</>;

  if (mode === 'replace') {
    return (
      <TouchableOpacity onPress={onUnlock} activeOpacity={0.85} style={styles.card}>
        <View style={styles.proBadgeSm}>
          <Ionicons name="diamond" size={12} color={colors.primary} />
          <Text style={styles.proBadgeSmText}>PRO</Text>
        </View>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
        <View style={styles.ctaBtn}>
          <Text style={styles.ctaText}>Ver planos</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  }

  // Modo blur: mostra o conteúdo original desfocado + overlay
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          Platform.OS === 'web'
            ? ({ filter: 'blur(4px)', pointerEvents: 'none' } as any)
            : { opacity: 0.35 },
        ]}
        pointerEvents="none"
      >
        {children}
      </View>
      <TouchableOpacity style={styles.overlay} activeOpacity={0.9} onPress={onUnlock}>
        <View style={styles.overlayBox}>
          <View style={styles.proBadge}>
            <Ionicons name="diamond" size={14} color={colors.primary} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={styles.overlayTitle}>{title}</Text>
          <Text style={styles.overlayDesc}>{description}</Text>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Desbloquear com Pro</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  content: { minHeight: 120 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  overlayBox: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  proBadgeText: { color: colors.primary, fontWeight: '800', marginLeft: 4, fontSize: 11, letterSpacing: 0.5 },
  overlayTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text, textAlign: 'center' },
  overlayDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 18 },

  card: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
  },
  proBadgeSm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginBottom: 6,
  },
  proBadgeSmText: { color: colors.primary, fontWeight: '800', marginLeft: 4, fontSize: 10, letterSpacing: 0.5 },
  cardTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text, textAlign: 'center' },
  cardDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4, textAlign: 'center', lineHeight: 18 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 as any,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    marginTop: spacing.md,
  },
  ctaText: { color: colors.textLight, fontWeight: '800', fontSize: fontSize.small },
});
