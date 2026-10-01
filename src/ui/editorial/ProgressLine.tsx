import { StyleSheet, Text, View } from 'react-native';
import { editorial } from '../../theme/editorial';

export default function ProgressLine({ value, label, color = editorial.color.indigo }: { value: number; label: string; color?: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(bounded) }} style={styles.root}><View style={styles.labels}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{Math.round(bounded)}%</Text></View><View style={styles.track}><View style={[styles.fill, { width: `${bounded}%`, backgroundColor: color }]} /></View></View>;
}
const styles = StyleSheet.create({ root: { gap: editorial.space.sm }, labels: { flexDirection: 'row', justifyContent: 'space-between' }, label: { color: editorial.color.ink, fontSize: editorial.type.caption, fontWeight: '600' }, value: { color: editorial.color.muted, fontSize: editorial.type.caption, fontVariant: ['tabular-nums'] }, track: { height: 6, borderRadius: editorial.radius.full, overflow: 'hidden', backgroundColor: editorial.color.line }, fill: { height: '100%', borderRadius: editorial.radius.full } });
