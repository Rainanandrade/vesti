import { StyleSheet, Text, View } from 'react-native';
import { editorial, editorialType } from '../../theme/editorial';

export default function EditorialTitle({ kicker, title, support }: { kicker: string; title: string; support?: string }) {
  return <View accessibilityRole="header" style={styles.root}><Text style={editorialType.kicker}>{kicker}</Text><Text style={editorialType.headline}>{title}</Text>{support ? <Text style={styles.support}>{support}</Text> : null}</View>;
}

const styles = StyleSheet.create({ root: { gap: editorial.space.sm, marginBottom: editorial.space.xl }, support: { ...editorialType.body, color: editorial.color.muted, maxWidth: 540 } });
