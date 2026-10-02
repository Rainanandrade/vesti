import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { editorial } from '../theme/editorial';
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
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [styles.base, variants[variant].container, pressed && !isDisabled && styles.pressed, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variants[variant].text.color} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, variants[variant].text, icon ? { marginLeft: editorial.space.sm } : null]}>
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
    minHeight: 48,
    paddingVertical: editorial.space.md,
    paddingHorizontal: editorial.space.xl,
    borderRadius: editorial.radius.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: editorial.font.body,
    fontSize: editorial.type.body,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: { opacity: 0.68 },
});

const variants: Record<Variant, { container: ViewStyle; text: { color: string } }> = {
  primary: {
    container: { backgroundColor: editorial.color.indigo },
    text: { color: editorial.color.white },
  },
  secondary: {
    container: { backgroundColor: 'transparent', borderWidth: 1, borderColor: editorial.color.line },
    text: { color: editorial.color.ink },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: editorial.color.indigo },
  },
  danger: {
    container: { backgroundColor: editorial.color.danger },
    text: { color: editorial.color.white },
  },
};
