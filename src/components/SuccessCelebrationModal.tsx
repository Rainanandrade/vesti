import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Circle } from 'react-native-svg';
import { colors, fontSize, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onNew: () => void;
  title?: string;
  subtitle?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
};

const CONFETTI = Array.from({ length: 40 }).map((_, i) => ({
  x: Math.random() * 100,
  y: Math.random() * 60,
  rot: Math.random() * 360,
  color: ['#C9A961', '#10B981', '#0B5345', '#DC2626', '#F59E0B', '#3B82F6', '#EC4899'][i % 7],
  shape: i % 3 === 0 ? 'circle' : 'rect',
  size: 6 + Math.random() * 8,
}));

export default function SuccessCelebrationModal({
  visible,
  onClose,
  onNew,
  title = 'Uhuuuu! Compra de ativo lançada com sucesso!',
  subtitle = 'Pode levar até 5 minutos para que esse lançamento apareça em sua carteira',
  primaryLabel = '+ Novo lançamento',
  secondaryLabel = 'Voltar para a carteira',
}: Props) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fallAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fallAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }).start();
      Animated.loop(
        Animated.timing(fallAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [visible]);

  const translateY = fallAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 500] });

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Confetes animados */}
        <Animated.View style={[StyleSheet.absoluteFillObject, { transform: [{ translateY }] }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            {CONFETTI.map((c, i) => (
              c.shape === 'circle' ? (
                <Circle key={i} cx={`${c.x}%`} cy={c.y} r={c.size / 2} fill={c.color} opacity={0.85} />
              ) : (
                <Rect key={i} x={`${c.x}%`} y={c.y} width={c.size} height={c.size} fill={c.color} opacity={0.85} transform={`rotate(${c.rot})`} />
              )
            ))}
          </Svg>
        </Animated.View>

        <View style={styles.center}>
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.glowRing}>
              <View style={styles.glowRing2}>
                <View style={styles.iconCircle}>
                  <Ionicons name="cash" size={36} color={colors.textLight} />
                </View>
              </View>
            </View>
          </Animated.View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
              <Text style={styles.secondaryText}>{secondaryLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={onNew}>
              <Text style={styles.primaryText}>{primaryLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(255,255,255,0.97)', justifyContent: 'center' },
  center: { padding: spacing.xl, alignItems: 'center' },
  glowRing: { width: 140, height: 140, borderRadius: 70, backgroundColor: colors.primaryLight + '60', alignItems: 'center', justifyContent: 'center' },
  glowRing2: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  iconCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.primary, textAlign: 'center', marginTop: spacing.xl, lineHeight: 28, paddingHorizontal: spacing.md },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, lineHeight: 20, paddingHorizontal: spacing.md },
  actions: { flexDirection: 'row', marginTop: spacing.xl, gap: spacing.md as any },
  secondaryBtn: { backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  secondaryText: { color: colors.text, fontWeight: '700' },
  primaryBtn: { backgroundColor: colors.text, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, marginLeft: spacing.sm },
  primaryText: { color: colors.textLight, fontWeight: '700' },
});
