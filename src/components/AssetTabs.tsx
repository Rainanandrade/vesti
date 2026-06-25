import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme/colors';

export type TabKey =
  | 'resumo'
  | 'indicadores'
  | 'proventos'
  | 'resultados'
  | 'comparar'
  | 'noticias'
  | 'sobre'
  | 'discussoes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'indicadores', label: 'Indicadores' },
  { key: 'proventos', label: 'Proventos' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'comparar', label: 'Comparar' },
  { key: 'noticias', label: 'Notícias' },
  { key: 'sobre', label: 'Sobre' },
  { key: 'discussoes', label: 'Discussões' },
];

type Props = {
  active: TabKey;
  onChange: (k: TabKey) => void;
};

export default function AssetTabs({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bar}
      contentContainerStyle={styles.content}
    >
      {TABS.map((t) => (
        <TouchableOpacity
          key={t.key}
          style={[styles.tab, active === t.key && styles.tabActive]}
          onPress={() => onChange(t.key)}
        >
          <Text style={[styles.tabText, active === t.key && styles.tabTextActive]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  content: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '600', fontSize: fontSize.small },
  tabTextActive: { color: colors.textLight, fontWeight: '700' },
});
