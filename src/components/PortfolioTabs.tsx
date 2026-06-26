import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';

export type PortfolioTabKey =
  | 'resumo'
  | 'proventos'
  | 'rentabilidade'
  | 'patrimonio'
  | 'analise'
  | 'metas'
  | 'lancamentos'
  | 'integracoes'
  | 'irpf'
  | 'config';

const TABS: { key: PortfolioTabKey; label: string; icon: any }[] = [
  { key: 'resumo',        label: 'Resumo',        icon: 'speedometer-outline' },
  { key: 'proventos',     label: 'Proventos',     icon: 'cash-outline' },
  { key: 'rentabilidade', label: 'Rentabilidade', icon: 'trending-up-outline' },
  { key: 'patrimonio',    label: 'Patrimônio',    icon: 'pie-chart-outline' },
  { key: 'analise',       label: 'Análise',       icon: 'sparkles-outline' },
  { key: 'metas',         label: 'Metas',         icon: 'trophy-outline' },
  { key: 'lancamentos',   label: 'Lançamentos',   icon: 'swap-vertical-outline' },
  { key: 'integracoes',   label: 'Integrações',   icon: 'sync-circle-outline' },
  { key: 'irpf',          label: 'IRPF',          icon: 'receipt-outline' },
  { key: 'config',        label: 'Configurações', icon: 'settings-outline' },
];

type Props = {
  active: PortfolioTabKey;
  onChange: (k: PortfolioTabKey) => void;
};

export default function PortfolioTabs({ active, onChange }: Props) {
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
          <Ionicons
            name={t.icon}
            size={16}
            color={active === t.key ? colors.primary : colors.textSecondary}
          />
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
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    maxHeight: 50,
    minHeight: 50,
    flexGrow: 0,
  },
  content: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 4,
    borderBottomWidth: 2.5,
    borderColor: 'transparent',
  },
  tabActive: { borderColor: colors.primary },
  tabText: {
    color: colors.textTertiary,
    fontWeight: '500',
    marginLeft: 6,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  tabTextActive: { color: colors.primary, fontWeight: '700' },
});
