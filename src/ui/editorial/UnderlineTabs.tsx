import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { editorial } from '../../theme/editorial';

type Props<T extends string> = { items: readonly T[]; value: T; onChange: (value: T) => void; label?: string };
export default function UnderlineTabs<T extends string>({ items, value, onChange, label = 'Seções' }: Props<T>) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" accessibilityLabel={label} contentContainerStyle={styles.root}>{items.map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: item === value }} onPress={() => onChange(item)} style={({ pressed }) => [styles.tab, item === value && styles.active, pressed && styles.pressed]}><Text style={[styles.text, item === value && styles.activeText]}>{item}</Text></Pressable>)}</ScrollView>;
}
const styles = StyleSheet.create({ root: { borderBottomWidth: 1, borderBottomColor: editorial.color.line, gap: editorial.space.xs, marginBottom: editorial.space.xl }, tab: { minHeight: 44, paddingHorizontal: editorial.space.md, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' }, active: { borderBottomColor: editorial.color.indigo }, text: { color: editorial.color.muted, fontSize: editorial.type.caption }, activeText: { color: editorial.color.ink, fontWeight: '700' }, pressed: { opacity: 0.62 } });
