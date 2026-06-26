import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { getMarketStatus } from '../utils/market';

export default function MarketStatusBar() {
  const status = getMarketStatus();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!status.isOpen) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status.isOpen, pulse]);

  return (
    <View style={styles.bar}>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: status.isOpen ? colors.success : colors.danger,
            opacity: status.isOpen ? pulse : 1,
            shadowColor: status.isOpen ? colors.success : colors.danger,
          },
        ]}
      />
      <Text style={styles.text}>{status.label}</Text>
      <Text style={styles.sub}>{status.nextChange}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  text: { fontSize: fontSize.small, fontWeight: '700', color: colors.text, marginLeft: spacing.sm },
  sub: { fontSize: fontSize.tiny, color: colors.textTertiary, marginLeft: 'auto' as any },
});
