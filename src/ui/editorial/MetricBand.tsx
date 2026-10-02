import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { editorial } from '../../theme/editorial';

type Props = { label: string; value: string; delta?: string; tone?: 'positive' | 'neutral' | 'attention'; hidden?: boolean; onToggleHidden?: () => void; children?: React.ReactNode };

export default function MetricBand({ label, value, delta, tone = 'neutral', hidden, onToggleHidden, children }: Props) {
  const toneStyle = tones[tone];
  return <LinearGradient colors={[editorial.color.indigo, editorial.color.indigoPressed]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.root}><View style={styles.top}><View><Text style={styles.label}>{label}</Text><View style={styles.valueRow}><Text selectable style={styles.value}>{hidden ? '••••••' : value}</Text>{onToggleHidden ? <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Mostrar valores' : 'Ocultar valores'} onPress={onToggleHidden} hitSlop={10}><Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={editorial.color.white} /></Pressable> : null}</View></View>{delta ? <Text style={[styles.delta, toneStyle]}>{delta}</Text> : null}</View>{children}</LinearGradient>;
}

const tones = StyleSheet.create({ positive: { color: editorial.color.white, backgroundColor: 'rgba(17,19,27,0.28)' }, neutral: { color: editorial.color.white, backgroundColor: 'rgba(17,19,27,0.28)' }, attention: { color: editorial.color.white, backgroundColor: 'rgba(17,19,27,0.28)' } });
const styles = StyleSheet.create({ root: { padding: editorial.space.xl, gap: editorial.space.md, borderRadius: 26, overflow: 'hidden' }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: editorial.space.md }, label: { color: '#DDD8FF', fontSize: editorial.type.caption, marginBottom: editorial.space.xs }, valueRow: { flexDirection: 'row', alignItems: 'center', gap: editorial.space.sm }, value: { fontFamily: editorial.font.display, fontSize: editorial.type.value, fontWeight: '600', letterSpacing: -0.8, color: editorial.color.white, fontVariant: ['tabular-nums'] }, delta: { paddingHorizontal: editorial.space.md, paddingVertical: editorial.space.sm, borderRadius: editorial.radius.full, fontSize: editorial.type.caption, fontWeight: '700', overflow: 'hidden' } });
