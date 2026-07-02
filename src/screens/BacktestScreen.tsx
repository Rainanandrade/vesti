import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import ProLock from '../components/ProLock';
import BenchmarkSparkline from '../components/BenchmarkSparkline';
import { safeBackToTabs } from '../utils/navigation';
import { monteCarloProjection } from '../utils/backtesting';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { fmtBRL } from '../utils/format';

export default function BacktestScreen({ navigation }: any) {
  const { activeWallet } = useApp();
  const currentTotal = (activeWallet?.assets || []).reduce((s, a) => s + a.avgPrice * a.quantity, 0);

  const [monthlyStr, setMonthlyStr] = useState('50000'); // R$ 500,00
  const [years, setYears] = useState(10);
  const [expectedReturn, setExpectedReturn] = useState(10); // % ao ano
  const [volatility, setVolatility] = useState(15);         // % ao ano

  const monthlyAmount = parseFormattedNumber(monthlyStr);

  const result = useMemo(() => monteCarloProjection({
    currentValue: currentTotal,
    monthlyContribution: monthlyAmount,
    years,
    expectedAnnualReturnPct: expectedReturn,
    annualVolatilityPct: volatility,
  }), [currentTotal, monthlyAmount, years, expectedReturn, volatility]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Simulador de aportes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ProLock
          mode="replace"
          title="Simulação Monte Carlo"
          description="Projete cenários (P10, P50, P90) pra seus aportes com retorno esperado e volatilidade."
          onUnlock={() => navigation.getParent()?.navigate('ProSubscribe')}
        >
          <Card>
            <Text style={styles.sectionTitle}>Parâmetros</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Valor atual da carteira</Text>
              <Text style={styles.valueDisplay}>{fmtBRL(currentTotal)}</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Aporte mensal</Text>
              <TextInput
                style={styles.input}
                value={formatCurrencyInput(monthlyStr)}
                onChangeText={(v) => setMonthlyStr(v.replace(/\D/g, ''))}
                keyboardType="numeric"
                placeholder="R$ 500,00"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Período (anos): {years}</Text>
              <View style={styles.chipsRow}>
                {[5, 10, 15, 20, 30].map((y) => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.chip, years === y && styles.chipActive]}
                    onPress={() => setYears(y)}
                  >
                    <Text style={[styles.chipText, years === y && styles.chipTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Retorno esperado ao ano: {expectedReturn}%</Text>
              <View style={styles.chipsRow}>
                {[6, 8, 10, 12, 15].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, expectedReturn === r && styles.chipActive]}
                    onPress={() => setExpectedReturn(r)}
                  >
                    <Text style={[styles.chipText, expectedReturn === r && styles.chipTextActive]}>{r}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Volatilidade ao ano: {volatility}%</Text>
              <View style={styles.chipsRow}>
                {[5, 10, 15, 20, 25].map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, volatility === v && styles.chipActive]}
                    onPress={() => setVolatility(v)}
                  >
                    <Text style={[styles.chipText, volatility === v && styles.chipTextActive]}>{v}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>Resultado da simulação</Text>
            <Text style={styles.sectionDesc}>
              1.000 cenários simulados com aportes mensais + retorno aleatório.
            </Text>

            <View style={styles.resultRow}>
              <View style={styles.resultCell}>
                <Text style={styles.resultLabel}>P90 · otimista</Text>
                <Text style={[styles.resultValue, { color: colors.success }]}>{fmtBRL(result.P90)}</Text>
              </View>
              <View style={styles.resultCell}>
                <Text style={styles.resultLabel}>P50 · mediana</Text>
                <Text style={styles.resultValue}>{fmtBRL(result.P50)}</Text>
              </View>
              <View style={styles.resultCell}>
                <Text style={styles.resultLabel}>P10 · pessimista</Text>
                <Text style={[styles.resultValue, { color: colors.danger }]}>{fmtBRL(result.P10)}</Text>
              </View>
            </View>

            <Text style={styles.contribution}>
              Total contribuído (sem juros): {fmtBRL(result.totalContributed)}
            </Text>

            {/* Gráfico simples: P10/P50/P90 ao longo dos anos */}
            <View style={{ marginTop: spacing.md }}>
              <BenchmarkSparkline
                height={140}
                series={[
                  {
                    label: 'Mediana (P50)',
                    color: colors.primary,
                    values: buildProjection(currentTotal, monthlyAmount, years, expectedReturn / 100),
                  },
                  {
                    label: 'Total aportado',
                    color: colors.warning,
                    values: buildContributionLine(currentTotal, monthlyAmount, years),
                  },
                ]}
                labels={[`Hoje`, `${years}a`]}
              />
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 <Text style={{ fontWeight: '800' }}>90% de chance</Text> do seu patrimônio ficar entre {fmtBRL(result.P10)} e {fmtBRL(result.P90)} em {years} anos.
              </Text>
            </View>
          </Card>

          <Text style={styles.footnote}>
            Projeção baseada em modelo estatístico. Retornos passados não garantem retornos futuros.
          </Text>
        </ProLock>
      </ScrollView>
    </SafeAreaView>
  );
}

function buildProjection(current: number, monthly: number, years: number, annualReturn: number): number[] {
  const monthReturn = annualReturn / 12;
  const points = [];
  let val = current;
  for (let m = 0; m <= years * 12; m++) {
    if (m % 6 === 0) points.push(val);
    val = val * (1 + monthReturn) + monthly;
  }
  return points;
}

function buildContributionLine(current: number, monthly: number, years: number): number[] {
  const points = [];
  for (let m = 0; m <= years * 12; m += 6) {
    points.push(current + monthly * m);
  }
  return points;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  sectionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  sectionDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },

  field: { marginTop: spacing.md },
  label: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '700', marginBottom: 6 },
  valueDisplay: { fontSize: fontSize.bodyLarge, color: colors.text, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.sm, color: colors.text, fontSize: fontSize.body },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 as any },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.small, color: colors.text, fontWeight: '700' },
  chipTextActive: { color: colors.textLight },

  resultRow: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm as any },
  resultCell: { flex: 1, backgroundColor: colors.surface, padding: spacing.sm, borderRadius: radius.md },
  resultLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase' },
  resultValue: { fontSize: fontSize.body, color: colors.text, fontWeight: '800', marginTop: 4 },

  contribution: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: spacing.sm, fontStyle: 'italic' },

  infoBox: { marginTop: spacing.md, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md },
  infoText: { fontSize: fontSize.small, color: colors.text, lineHeight: 20 },

  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md, fontStyle: 'italic' },
});
