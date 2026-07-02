import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Card from './Card';
import ProLock from './ProLock';
import { useNavigation } from '@react-navigation/native';
import { getGestorRanking } from '../data/gestores';

type Props = {
  portfolioAnnualPct: number | null;
};

function GestoresComparisonInner({ portfolioAnnualPct }: Props) {
  if (portfolioAnnualPct == null) return null;
  const ranking = getGestorRanking(portfolioAnnualPct);

  return (
    <Card>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🏦 Sua carteira vs gestores famosos</Text>
      </View>
      <Text style={styles.subtitle}>
        Comparação da sua rentabilidade anualizada com gestores e índices de referência.
      </Text>

      <View style={styles.rowHeader}>
        <Text style={[styles.colHeader, { flex: 2 }]}>Gestor</Text>
        <Text style={[styles.colHeader, { width: 70, textAlign: 'right' }]}>Média a.a.</Text>
        <Text style={[styles.colHeader, { width: 80, textAlign: 'right' }]}>vs você</Text>
      </View>

      {ranking.map((g) => (
        <View key={g.id} style={styles.row}>
          <View style={{ flex: 2 }}>
            <View style={styles.gestorNameRow}>
              <View style={[styles.colorDot, { backgroundColor: g.color }]} />
              <Text style={styles.gestorName}>{g.name}</Text>
            </View>
            <Text style={styles.gestorDesc} numberOfLines={1}>{g.description}</Text>
          </View>
          <Text style={[styles.returnValue, { width: 70, textAlign: 'right' }]}>
            {g.avgAnnualReturn >= 0 ? '+' : ''}{g.avgAnnualReturn.toFixed(1)}%
          </Text>
          <View style={{ width: 80, alignItems: 'flex-end' }}>
            <View style={[styles.badge, g.youWin ? styles.badgeWin : styles.badgeLose]}>
              <Ionicons
                name={g.youWin ? 'trending-up' : 'trending-down'}
                size={11}
                color={g.youWin ? colors.success : colors.danger}
              />
              <Text style={[styles.badgeText, { color: g.youWin ? colors.success : colors.danger }]}>
                {g.diffVsYou >= 0 ? '+' : ''}{g.diffVsYou.toFixed(1)} pp
              </Text>
            </View>
          </View>
        </View>
      ))}

      <Text style={styles.footnote}>
        Retornos anuais líquidos declarados. Base: 2020-2025.
      </Text>
    </Card>
  );
}

export default function GestoresComparison(props: Props) {
  const nav = useNavigation<any>();
  return (
    <ProLock
      title="Compare com gestores famosos"
      description="Verde, Dahlia, Trígono, IFIX, CDI. Veja quem você está batendo."
      onUnlock={() => nav.getParent()?.navigate('ProSubscribe')}
    >
      <GestoresComparisonInner {...props} />
    </ProLock>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md },

  rowHeader: { flexDirection: 'row', paddingBottom: 6, borderBottomWidth: 1, borderColor: colors.divider },
  colHeader: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase' },

  row: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, alignItems: 'center' },
  gestorNameRow: { flexDirection: 'row', alignItems: 'center' },
  colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  gestorName: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  gestorDesc: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },

  returnValue: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4 as any, paddingHorizontal: 6, paddingVertical: 3, borderRadius: radius.pill },
  badgeWin: { backgroundColor: colors.successLight },
  badgeLose: { backgroundColor: colors.dangerLight },
  badgeText: { fontSize: fontSize.tiny, fontWeight: '800' },

  footnote: { fontSize: 10, color: colors.textTertiary, marginTop: spacing.sm, fontStyle: 'italic' },
});
