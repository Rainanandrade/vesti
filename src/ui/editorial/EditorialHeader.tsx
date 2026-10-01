import { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { editorial } from '../../theme/editorial';

type IconName = keyof typeof Ionicons.glyphMap;
type Action = { icon: IconName; label: string; onPress: () => void };
type Props = { context?: string; onAvatar?: () => void; actions?: Action[]; trailing?: ReactNode; onBack?: () => void };

export default function EditorialHeader({ context, onAvatar, actions = [], trailing, onBack }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.left}>
        {onBack ? <HeaderAction icon="arrow-back" label="Voltar" onPress={onBack} /> : null}
        <Text style={styles.brand}>vesti<Text style={styles.dot}>.</Text></Text>
      </View>
      <View style={styles.right}>
        {context ? <Text style={styles.context}>{context}</Text> : null}
        {actions.map((action) => <HeaderAction key={action.label} {...action} />)}
        {onAvatar ? <Pressable accessibilityRole="button" accessibilityLabel="Abrir perfil e ajustes" onPress={onAvatar} style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}><Ionicons name="person-outline" size={18} color={editorial.color.white} /></Pressable> : null}
        {trailing}
      </View>
    </View>
  );
}

export function HeaderAction({ icon, label, onPress }: Action) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Ionicons name={icon} size={18} color={editorial.color.ink} /></Pressable>;
}

const styles = StyleSheet.create({
  root: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: editorial.space.xl },
  left: { flexDirection: 'row', alignItems: 'center', gap: editorial.space.sm },
  right: { flexDirection: 'row', alignItems: 'center', gap: editorial.space.sm },
  brand: { fontFamily: editorial.font.display, fontSize: 24, fontWeight: '700', letterSpacing: -1, color: editorial.color.ink },
  dot: { color: editorial.color.coral },
  context: { maxWidth: 126, textAlign: 'right', color: editorial.color.muted, fontSize: editorial.type.kicker, lineHeight: 15, textTransform: 'uppercase', letterSpacing: 0.8 },
  action: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: editorial.color.line, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: editorial.color.inverse, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.62 },
});
