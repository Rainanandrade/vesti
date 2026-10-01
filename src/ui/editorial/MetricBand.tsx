import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { editorial } from '../../theme/editorial';

type Props = { label: string; value: string; delta?: string; tone?: 'positive' | 'neutral' | 'attention'; hidden?: boolean; onToggleHidden?: () => void; children?: React.ReactNode };

export default function MetricBand({ label, value, delta, tone = 'neutral', hidden, onToggleHidden, children }: Props) {
  const toneStyle = tones[tone];
  return <View style={styles.root}><View style={styles.top}><View><Text style={styles.label}>{label}</Text><View style={styles.valueRow}><Text selectable style={styles.value}>{hidden ? '••••••' : value}</Text>{onToggleHidden ? <Pressable accessibilityRole="button" accessibilityLabel={hidden ? 'Mostrar valores' : 'Ocultar valores'} onPress={onToggleHidden} hitSlop={10}><Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={editorial.color.muted} /></Pressable> : null}</View></View>{delta ? <Text style={[styles.delta, toneStyle]}>{delta}</Text> : null}</View>{children}</View>;
}

const tones = StyleSheet.create({ positive: { color: editorial.color.positive, backgroundColor: editorial.color.positiveSoft }, neutral: { color: editorial.color.indigo, backgroundColor: editorial.color.indigoSoft }, attention: { color: editorial.color.danger, backgroundColor: editorial.color.dangerSoft } });
const styles = StyleSheet.create({ root: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: editorial.color.line, paddingVertical: editorial.space.lg, gap: editorial.space.md }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: editorial.space.md }, label: { color: editorial.color.muted, fontSize: editorial.type.caption, marginBottom: editorial.space.xs }, valueRow: { flexDirection: 'row', alignItems: 'center', gap: editorial.space.sm }, value: { fontFamily: editorial.font.display, fontSize: editorial.type.value, fontWeight: '500', letterSpacing: -0.8, color: editorial.color.ink, fontVariant: ['tabular-nums'] }, delta: { paddingHorizontal: editorial.space.md, paddingVertical: editorial.space.sm, borderRadius: editorial.radius.full, fontSize: editorial.type.caption, fontWeight: '700', overflow: 'hidden' } });
