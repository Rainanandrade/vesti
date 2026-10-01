import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/Button';
import { editorial, editorialType } from '../../theme/editorial';

type Kind = 'loading' | 'empty' | 'error' | 'locked' | 'offline' | 'readOnly';
type Props = { kind: Kind; title: string; detail: string; action?: { label: string; onPress: () => void } };
const icons: Record<Exclude<Kind, 'loading'>, keyof typeof Ionicons.glyphMap> = { empty: 'add-circle-outline', error: 'alert-circle-outline', locked: 'lock-closed-outline', offline: 'cloud-offline-outline', readOnly: 'eye-outline' };
export default function EditorialState({ kind, title, detail, action }: Props) {
  return <View style={styles.root}>{kind === 'loading' ? <ActivityIndicator size="large" color={editorial.color.indigo} /> : <View style={styles.icon}><Ionicons name={icons[kind]} size={26} color={kind === 'error' ? editorial.color.danger : editorial.color.indigo} /></View>}<Text style={styles.title}>{title}</Text><Text style={styles.detail}>{detail}</Text>{action ? <Button title={action.label} onPress={action.onPress} style={styles.action} /> : null}</View>;
}
const styles = StyleSheet.create({ root: { alignItems: 'center', justifyContent: 'center', paddingVertical: editorial.space.xxxl, paddingHorizontal: editorial.space.xl }, icon: { width: 58, height: 58, borderRadius: 29, backgroundColor: editorial.color.indigoSoft, alignItems: 'center', justifyContent: 'center', marginBottom: editorial.space.lg }, title: { ...editorialType.section, textAlign: 'center' }, detail: { ...editorialType.body, color: editorial.color.muted, textAlign: 'center', maxWidth: 430, marginTop: editorial.space.sm }, action: { marginTop: editorial.space.xl, alignSelf: 'stretch' } });
