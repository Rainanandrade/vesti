import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { editorial, editorialType } from '../../theme/editorial';

export default function EditorialSectionHeader({ title, meta, action }: { title: string; meta?: string; action?: ReactNode }) {
  return <View style={styles.root}><Text style={editorialType.section}>{title}</Text><View style={styles.trailing}>{meta ? <Text style={styles.meta}>{meta}</Text> : null}{action}</View></View>;
}
const styles = StyleSheet.create({ root: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: editorial.space.md, marginTop: editorial.space.xl, marginBottom: editorial.space.sm }, trailing: { flexDirection: 'row', alignItems: 'center', gap: editorial.space.sm }, meta: { color: editorial.color.muted, fontSize: editorial.type.kicker, textTransform: 'uppercase', letterSpacing: 0.7 } });
