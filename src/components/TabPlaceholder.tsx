import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';

type Props = {
  icon?: any;
  title: string;
  description: string;
};

export default function TabPlaceholder({ icon = 'construct-outline', title, description }: Props) {
  return (
    <View style={styles.card}>
      <Ionicons name={icon} size={36} color={colors.primary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>EM BREVE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.divider, alignItems: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
  desc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  badge: { marginTop: spacing.md, backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.pill },
  badgeText: { color: colors.primary, fontSize: fontSize.tiny, fontWeight: '800', letterSpacing: 1 },
});
