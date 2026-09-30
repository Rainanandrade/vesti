import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { haptics } from '../ui/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
};

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style, icon }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => { if (variant === 'primary') haptics.select(); onPress(); }}
      disabled={isDisabled}
      style={[styles.base, variants[variant].container, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variants[variant].text.color} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variants[variant].text, icon ? { marginLeft: spacing.sm } : null]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});

const variants: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.textLight },
  },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: colors.primary },
  },
  danger: {
    container: { backgroundColor: colors.danger },
    text: { color: colors.textLight },
  },
};
