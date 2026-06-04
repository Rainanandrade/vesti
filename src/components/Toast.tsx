import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  message: string;
  variant?: 'success' | 'error' | 'info';
};

export default function Toast({ visible, message, variant = 'success' }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : -100,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  const bg = {
    success: colors.success,
    error: colors.danger,
    info: colors.primary,
  }[variant];

  const icon = {
    success: 'checkmark-circle',
    error: 'close-circle',
    info: 'information-circle',
  }[variant] as 'checkmark-circle' | 'close-circle' | 'information-circle';

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.wrap, { transform: [{ translateY }] }]}
    >
      <View style={[styles.toast, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={colors.textLight} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: '90%',
  },
  message: {
    color: colors.textLight,
    fontSize: fontSize.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
    flex: 1,
  },
});
