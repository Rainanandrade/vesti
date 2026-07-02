import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import ProLock from '../components/ProLock';
import { safeBackToTabs } from '../utils/navigation';
import { computeAllMonthlyIr, fmtBRL } from '../utils/irCalculator';

export default function IRAutomaticoScreen({ navigation }: any) {
  const { operations } = useApp();
  const monthly = computeAllMonthlyIr(operations);
  const monthlyReverse = [...monthly].reverse();
  const totalTaxYear = monthly
    .filter((m) => m.monthKey.startsWith(String(new Date().getFullYear())))
    .reduce((s, m) => s + m.taxDue, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>IR Automático</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ProLock
          mode="replace"
          title="IR e DARF automatizados"
          description="Calcula seu imposto mês a mês, avisa vendas tributáveis, mostra prejuízo pra compensar."
          onUnlock={() => navigation.getParent()?.navigate('ProSubscribe')}
        >
          <Card style={{ marginBottom: spacing.md, backgroundColor: colors.primaryLight, borderColor: colors.primary }}>
            <Text style={styles.heroLabel}>IR a pagar em {new Date().getFullYear()}</Text>
            <Text style={styles.heroValue}>{fmtBRL(totalTaxYear)}</Text>
            <Text style={styles.heroSub}>
              Somado de todos os meses tributáveis do ano corrente
            </Text>
          </Card>

          {monthly.length === 0 && (
            <Card>
              <Text style={styles.empty}>
                Sem operações lançadas ainda. Registre suas compras e vendas na tela de Lançamentos.
              </Text>
            </Card>
          )}

          {monthlyReverse.map((m) => {
            const [y, mm] = m.monthKey.split('-');
            const monthLabel = new Date(Number(y), Number(mm) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            return (
              <Card key={m.monthKey} style={{ marginBottom: spacing.sm }}>
                <View style={styles.monthHeader}>
                  <Text style={styles.monthTitle}>{monthLabel}</Text>
                  {m.taxDue > 0 ? (
                    <View style={styles.dueBadge}>
                      <Text style={styles.dueText}>{fmtBRL(m.taxDue)}</Text>
                    </View>
                  ) : (
                    <View style={[styles.dueBadge, { backgroundColor: colors.successLight }]}>
                      <Text style={[styles.dueText, { color: colors.success }]}>Sem IR</Text>
                    </View>
                  )}
                </View>

                {/* Swing trade */}
                {m.swingProfitLoss !== 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Swing trade (ações + ETFs)</Text>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Vendas do mês</Text>
                      <Text style={styles.rowValue}>{fmtBRL(m.swingSalesVolume)}</Text>
                    </View>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Lucro/Prejuízo</Text>
                      <Text style={[styles.rowValue, { color: m.swingProfitLoss >= 0 ? colors.success : colors.danger }]}>
                        {fmtBRL(m.swingProfitLoss)}
                      </Text>
                    </View>
                    {m.swingIsExempt && m.swingProfitLoss > 0 && (
                      <Text style={styles.note}>✅ Isento — vendas ≤ R$ 20 mil</Text>
                    )}
                    {m.taxByCategory.swing > 0 && (
                      <Text style={styles.taxNote}>IR swing (15%): {fmtBRL(m.taxByCategory.swing)}</Text>
                    )}
                  </View>
                )}

                {/* Day trade */}
                {m.dayTradeProfitLoss !== 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Day trade</Text>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Lucro/Prejuízo</Text>
                      <Text style={[styles.rowValue, { color: m.dayTradeProfitLoss >= 0 ? colors.success : colors.danger }]}>
                        {fmtBRL(m.dayTradeProfitLoss)}
                      </Text>
                    </View>
                    {m.taxByCategory.dayTrade > 0 && (
                      <Text style={styles.taxNote}>IR day trade (20%): {fmtBRL(m.taxByCategory.dayTrade)}</Text>
                    )}
                  </View>
                )}

                {/* FII */}
                {m.fiiProfitLoss !== 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Fundos Imobiliários (FII)</Text>
                    <View style={styles.row}>
                      <Text style={styles.rowLabel}>Lucro/Prejuízo</Text>
                      <Text style={[styles.rowValue, { color: m.fiiProfitLoss >= 0 ? colors.success : colors.danger }]}>
                        {fmtBRL(m.fiiProfitLoss)}
                      </Text>
                    </View>
                    {m.taxByCategory.fii > 0 && (
                      <Text style={styles.taxNote}>IR FII (20%): {fmtBRL(m.taxByCategory.fii)}</Text>
                    )}
                  </View>
                )}

                {/* DARF info */}
                {m.taxDue > 0 && (
                  <View style={styles.darfBox}>
                    <View style={styles.darfRow}>
                      <Text style={styles.darfLabel}>DARF código</Text>
                      <Text style={styles.darfValue}>{m.darfCode}</Text>
                    </View>
                    <View style={styles.darfRow}>
                      <Text style={styles.darfLabel}>Vencimento</Text>
                      <Text style={styles.darfValue}>{m.dueDate.split('-').reverse().join('/')}</Text>
                    </View>
                    <Text style={styles.darfHint}>
                      Emita o DARF em receita.fazenda.gov.br → SICALCWEB. Código 6015.
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}

          <Text style={styles.footnote}>
            Cálculo aproximado. Consulte seu contador em casos de dúvida ou grandes valores.
            Regras: swing isento até R$ 20k/mês, day trade sempre 20%, FII sempre 20%, compensação de prejuízos entre meses do mesmo tipo.
          </Text>
        </ProLock>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  heroLabel: { fontSize: fontSize.tiny, color: colors.primaryDark, fontWeight: '800', textTransform: 'uppercase' },
  heroValue: { fontSize: fontSize.heading, fontWeight: '900', color: colors.text, marginTop: 4 },
  heroSub: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },

  empty: { color: colors.textSecondary, textAlign: 'center', padding: spacing.md, fontStyle: 'italic' },

  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  monthTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text, textTransform: 'capitalize' },
  dueBadge: { backgroundColor: colors.warningLight, paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill },
  dueText: { color: colors.warning, fontWeight: '800', fontSize: fontSize.small },

  section: { paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider, marginTop: spacing.sm },
  sectionLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rowLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  rowValue: { fontSize: fontSize.small, color: colors.text, fontWeight: '700' },
  note: { fontSize: fontSize.tiny, color: colors.success, marginTop: 4, fontWeight: '600' },
  taxNote: { fontSize: fontSize.small, color: colors.warning, marginTop: 4, fontWeight: '700' },

  darfBox: { backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.sm },
  darfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  darfLabel: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '600' },
  darfValue: { fontSize: fontSize.small, color: colors.text, fontWeight: '800' },
  darfHint: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 6, fontStyle: 'italic' },

  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md, lineHeight: 16, fontStyle: 'italic' },
});
