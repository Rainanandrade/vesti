import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { editorial } from '../../theme/editorial';

type Props = { leading?: ReactNode; title: string; detail?: string; value?: string; trend?: string; trendTone?: 'positive' | 'attention' | 'neutral'; onPress?: () => void; disabled?: boolean; last?: boolean };
export default function EditorialRow({ leading, title, detail, value, trend, trendTone = 'neutral', onPress, disabled, last }: Props) {
  const content = <><View style={styles.leading}>{leading}</View><View style={styles.copy}><Text style={styles.title}>{title}</Text>{detail ? <Text style={styles.detail}>{detail}</Text> : null}</View>{value || trend ? <View style={styles.values}>{value ? <Text selectable style={styles.value}>{value}</Text> : null}{trend ? <Text style={[styles.trend, trendStyles[trendTone]]}>{trend}</Text> : null}</View> : null}{onPress ? <Ionicons name="chevron-forward" size={16} color={editorial.color.faint} /> : null}</>;
  if (onPress) return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.root, !last && styles.divider, disabled && styles.disabled, pressed && styles.pressed]}>{content}</Pressable>;
  return <View style={[styles.root, !last && styles.divider, disabled && styles.disabled]}>{content}</View>;
}
const trendStyles = StyleSheet.create({ positive: { color: editorial.color.positive }, attention: { color: editorial.color.danger }, neutral: { color: editorial.color.muted } });
const styles = StyleSheet.create({ root: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: editorial.space.md, paddingVertical: editorial.space.md }, divider: { borderBottomWidth: 1, borderBottomColor: editorial.color.line }, leading: { minWidth: 0 }, copy: { flex: 1 }, title: { color: editorial.color.ink, fontSize: editorial.type.body, fontWeight: '600' }, detail: { color: editorial.color.muted, fontSize: editorial.type.kicker, lineHeight: 16, marginTop: 3 }, values: { alignItems: 'flex-end' }, value: { color: editorial.color.ink, fontSize: editorial.type.caption, fontWeight: '700', fontVariant: ['tabular-nums'] }, trend: { fontSize: editorial.type.kicker, marginTop: 3, fontWeight: '600' }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.62 } });
