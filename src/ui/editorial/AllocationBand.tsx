import { StyleSheet, Text, View } from 'react-native';
import { editorial } from '../../theme/editorial';

export type AllocationSegment = { label: string; value: number; color?: string };
const defaultColors = [editorial.color.indigo, editorial.color.coral, editorial.color.sky, editorial.color.positive];
export default function AllocationBand({ segments }: { segments: AllocationSegment[] }) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0) || 1;
  return <View accessibilityRole="summary" accessibilityLabel={segments.map((segment) => `${segment.label}: ${Math.round((segment.value / total) * 100)}%`).join(', ')} style={styles.root}><View style={styles.band}>{segments.map((segment, index) => <View key={segment.label} style={[styles.segment, { flex: Math.max(0.001, segment.value), backgroundColor: segment.color || defaultColors[index % defaultColors.length] }]} />)}</View><View style={styles.legend}>{segments.map((segment, index) => <View key={segment.label} style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: segment.color || defaultColors[index % defaultColors.length] }]} /><Text style={styles.legendText}><Text style={styles.legendValue}>{Math.round((segment.value / total) * 100)}%</Text> {segment.label}</Text></View>)}</View></View>;
}
const styles = StyleSheet.create({ root: { gap: editorial.space.sm }, band: { height: 10, flexDirection: 'row', gap: 3, borderRadius: editorial.radius.full, overflow: 'hidden' }, segment: { minWidth: 3 }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: editorial.space.md }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 }, swatch: { width: 7, height: 7, borderRadius: 4 }, legendText: { color: editorial.color.muted, fontSize: editorial.type.kicker }, legendValue: { color: editorial.color.ink, fontWeight: '700' } });
