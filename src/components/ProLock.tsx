import { ReactNode, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import PremiumLockModal from './PremiumLockModal';

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
  onUnlock?: () => void;         // opcional: se passar, é chamado após "Ver planos e assinar"
  featureIcon?: string;           // ícone da feature Pro pra destacar no popup
  mode?: 'blur' | 'replace';
};

/**
 * Bloqueia conteúdo pra quem não é Pro.
 * - Pro/trial ativo: renderiza filhos normalmente.
 * - Free/expirado: mostra overlay ou card CTA convidando pra assinar.
 */
export default function ProLock({
  children,
  title = 'Feature exclusiva do Vesti Pro',
  description = 'Toque pra ver tudo que você desbloqueia.',
  onUnlock,
  featureIcon,
  mode = 'blur',
}: Props) {
  const { pro } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  if (pro.isPro) return <>{children}</>;

  const openPopup = () => setModalOpen(true);
  const closePopup = () => setModalOpen(false);

  const popup = (
    <PremiumLockModal
      visible={modalOpen}
      onClose={closePopup}
      onSubscribe={onUnlock}
      highlightIcon={featureIcon}
      title={title}
    />
  );

  if (mode === 'replace') {
    return (
      <>
        <TouchableOpacity onPress={openPopup} activeOpacity={0.85} style={styles.card}>
          <View style={styles.proBadgeSm}>
            <Ionicons name="diamond" size={12} color={colors.primary} />
            <Text style={styles.proBadgeSmText}>PRO</Text>
          </View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{description}</Text>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Ver tudo do Pro</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
          </View>
        </TouchableOpacity>
        {popup}
      </>
    );
  }

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
      <TouchableOpacity style={styles.overlay} activeOpacity={0.9} onPress={openPopup}>
        <View style={styles.overlayBox}>
          <View style={styles.proBadge}>
            <Ionicons name="diamond" size={14} color={colors.primary} />
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={styles.overlayTitle}>{title}</Text>
          <Text style={styles.overlayDesc}>{description}</Text>
          <View style={styles.ctaBtn}>
            <Text style={styles.ctaText}>Ver tudo do Pro</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textLight} />
          </View>
        </View>
      </TouchableOpacity>
      {popup}
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
