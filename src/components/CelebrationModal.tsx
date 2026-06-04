import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Button from './Button';
import { rewardForGoal } from '../utils/rewards';

type Props = {
  visible: boolean;
  goalValue: number | null;
  goalLabel: string;
  variant?: 'history' | 'new';   // history = clicou na conquista | new = bateu agora
  onClose: () => void;
};

export default function CelebrationModal({ visible, goalValue, goalLabel, variant = 'history', onClose }: Props) {
  if (goalValue == null) return null;
  const reward = rewardForGoal(goalValue);
  const isNew = variant === 'new';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {isNew && (
            <View style={styles.bannerNew}>
              <Ionicons name="sparkles" size={16} color={colors.gold} />
              <Text style={styles.bannerNewText}>VOCÊ ACABOU DE CONQUISTAR!</Text>
              <Ionicons name="sparkles" size={16} color={colors.gold} />
            </View>
          )}

          <View style={styles.badgeWrap}>
            <Text style={styles.badge}>{reward.badge}</Text>
          </View>

          <Text style={styles.rewardLabel}>{reward.rewardLabel}</Text>
          <Text style={styles.goal}>{goalLabel}</Text>
          <Text style={styles.title}>{reward.title}</Text>
          <Text style={styles.message}>{reward.message}</Text>

          <View style={styles.curiosityBox}>
            <Text style={styles.curiosityLabel}>💡 Curiosidade</Text>
            <Text style={styles.curiosityText}>{reward.curiosity}</Text>
          </View>

          <View style={styles.phraseBox}>
            <Text style={styles.phraseText}>{reward.phrase}</Text>
          </View>

          <Button
            title={isNew ? 'Continuar conquistando' : 'Fechar'}
            onPress={onClose}
            style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: spacing.lg },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  bannerNew: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  bannerNewText: {
    color: colors.textLight,
    fontSize: fontSize.tiny,
    fontWeight: '800',
    letterSpacing: 1,
    marginHorizontal: 6,
  },
  badgeWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 4,
    borderColor: colors.gold,
  },
  badge: { fontSize: 56 },
  rewardLabel: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goal: { fontSize: fontSize.title, color: colors.textSecondary, marginTop: 4 },
  title: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  message: {
    fontSize: fontSize.bodyLarge,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  curiosityBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  curiosityLabel: { fontSize: fontSize.body, fontWeight: '600', color: colors.primaryDark },
  curiosityText: { fontSize: fontSize.body, color: colors.text, marginTop: spacing.xs, lineHeight: 20 },
  phraseBox: {
    width: '100%',
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  phraseText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});
