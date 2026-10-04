import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { editorial } from '../theme/editorial';
import { EditorialState } from '../ui/editorial';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fmtBRL } from '../utils/format';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { safeBackToPlanejar } from '../utils/navigation';
import Card from '../components/Card';

const {
  buildFutureScenarios,
  futureValue,
  requiredMonthlyContribution,
} = require('../utils/planningCalculators');

type Mode = 'future' | 'monthly';

function parseDecimal(value: string) {
  return Number(value.replace(',', '.'));
}

export default function AporteCalculatorScreen({ navigation }: any) {
  const [mode, setMode] = useState<Mode>('future');
  const [initial, setInitial] = useState('');
  const [monthly, setMonthly] = useState('');
  const [goal, setGoal] = useState('');
  const [years, setYears] = useState('10');
  const [annualRate, setAnnualRate] = useState('8');

  const calculation = useMemo(() => {
    const initialValue = parseFormattedNumber(initial);
    const duration = parseDecimal(years);
    const rate = parseDecimal(annualRate);
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(rate) || rate <= -100) return null;

    try {
      if (mode === 'monthly') {
        const target = parseFormattedNumber(goal);
        if (target <= 0) return null;
        const required = requiredMonthlyContribution({ goal: target, initial: initialValue, years: duration, annualRate: rate });
        const projection = futureValue({ initial: initialValue, monthly: required, years: duration, annualRate: rate });
        return { ...projection, monthly: required, scenarios: buildFutureScenarios({ initial: initialValue, monthly: required, years: duration, annualRate: rate }) };
      }

      const monthlyValue = parseFormattedNumber(monthly);
      if (monthlyValue <= 0 && initialValue <= 0) return null;
      const projection = futureValue({ initial: initialValue, monthly: monthlyValue, years: duration, annualRate: rate });
      return { ...projection, monthly: monthlyValue, scenarios: buildFutureScenarios({ initial: initialValue, monthly: monthlyValue, years: duration, annualRate: rate }) };
    } catch {
      return null;
    }
  }, [annualRate, goal, initial, mode, monthly, years]);

  const investedShare = calculation && calculation.finalValue > 0
    ? Math.min(100, Math.max(0, (calculation.invested / calculation.finalValue) * 100))
    : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar para Planejar" onPress={() => safeBackToPlanejar(navigation)} style={styles.backButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={editorial.color.ink} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerKicker}>Planejar</Text>
          <Text style={styles.headerTitle}>Calculadora de futuro</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Simule objetivos com as suas próprias premissas e veja de onde vem o resultado.</Text>

          <View style={styles.modeTabs} accessibilityRole="tablist">
            <ModeTab active={mode === 'future'} label="Quanto terei" onPress={() => setMode('future')} />
            <ModeTab active={mode === 'monthly'} label="Quanto aportar" onPress={() => setMode('monthly')} />
          </View>

          <Card style={styles.formCard}>
            <Label>Valor inicial</Label>
            <CurrencyInput value={initial} onChange={setInitial} placeholder="0,00" />
            {mode === 'future' ? (
              <>
                <Label>Aporte mensal</Label>
                <CurrencyInput value={monthly} onChange={setMonthly} placeholder="500,00" />
              </>
            ) : (
              <>
                <Label>Meta desejada</Label>
                <CurrencyInput value={goal} onChange={setGoal} placeholder="100.000,00" />
              </>
            )}
            <View style={styles.inlineFields}>
              <View style={styles.fieldHalf}>
                <Label>Prazo em anos</Label>
                <TextInput style={styles.input} value={years} onChangeText={setYears} keyboardType="decimal-pad" placeholder="10" placeholderTextColor={colors.textTertiary} />
              </View>
              <View style={styles.fieldHalf}>
                <Label>Taxa anual (%)</Label>
                <TextInput style={styles.input} value={annualRate} onChangeText={setAnnualRate} keyboardType="decimal-pad" placeholder="8" placeholderTextColor={colors.textTertiary} />
              </View>
            </View>
          </Card>

          {calculation ? (
            <>
              <Card style={styles.resultCard}>
                <Text style={styles.resultKicker}>{mode === 'monthly' ? 'APORTE MENSAL NECESSÁRIO' : 'VALOR FUTURO ESTIMADO'}</Text>
                <Text style={styles.resultValue}>{fmtBRL(mode === 'monthly' ? calculation.monthly : calculation.finalValue)}</Text>
                <Text style={styles.resultSupport}>{mode === 'monthly' ? `para buscar ${fmtBRL(parseFormattedNumber(goal))} em ${years} anos` : `ao fim de ${years} anos`}</Text>
                <View style={styles.divider} />
                <Metric label="Capital investido" value={fmtBRL(calculation.invested)} />
                <Metric label="Juros acumulados" value={fmtBRL(calculation.interest)} accent />
                <Metric label="Valor final" value={fmtBRL(calculation.finalValue)} strong />
                <View style={styles.compositionTrack} accessibilityLabel={`${investedShare.toFixed(0)}% capital investido e ${(100 - investedShare).toFixed(0)}% juros`}>
                  <View style={[styles.investedFill, { flex: investedShare || 0.001 }]} />
                  <View style={[styles.interestFill, { flex: 100 - investedShare || 0.001 }]} />
                </View>
                <View style={styles.legendRow}>
                  <Text style={styles.legendText}>● Investido {investedShare.toFixed(0)}%</Text>
                  <Text style={styles.legendInterest}>● Juros {(100 - investedShare).toFixed(0)}%</Text>
                </View>
              </Card>

              <Text style={styles.sectionTitle}>Três cenários</Text>
              <View style={styles.scenarios}>
                {calculation.scenarios.map((scenario: any) => (
                  <View key={scenario.key} style={[styles.scenario, scenario.key === 'base' && styles.scenarioBase]}>
                    <Text style={styles.scenarioLabel}>{scenario.label}</Text>
                    <Text style={styles.scenarioRate}>{scenario.annualRate.toFixed(1).replace('.', ',')}% a.a.</Text>
                    <Text style={styles.scenarioValue}>{fmtBRL(scenario.finalValue)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <EditorialState kind="empty" title="Pronto para simular" detail="Preencha valores válidos para ver a projeção." />
          )}

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.disclaimerText}>Simulação educativa baseada na taxa informada. Ela não garante rentabilidade futura e não considera impostos, taxas ou inflação.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ModeTab({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <TouchableOpacity accessibilityRole="tab" accessibilityState={{ selected: active }} style={[styles.modeTab, active && styles.modeTabActive]} onPress={onPress}><Text style={[styles.modeTabText, active && styles.modeTabTextActive]}>{label}</Text></TouchableOpacity>;
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function CurrencyInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <View style={styles.currencyRow}><Text style={styles.currencyPrefix}>R$</Text><TextInput style={[styles.input, styles.currencyInput]} value={value} onChangeText={(text) => onChange(formatCurrencyInput(text))} placeholder={placeholder} placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad" /></View>;
}

function Metric({ label, value, accent, strong }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, accent && styles.metricAccent, strong && styles.metricStrong]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: editorial.color.canvas },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: editorial.color.line },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: editorial.color.line, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' }, headerKicker: { color: editorial.color.coral, fontSize: editorial.type.kicker, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { color: editorial.color.ink, fontFamily: editorial.font.display, fontSize: editorial.type.title }, headerSpacer: { width: 44 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md }, intro: { color: colors.textSecondary, fontSize: fontSize.body, lineHeight: 21 },
  modeTabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.pill, padding: 4 }, modeTab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill }, modeTabActive: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }, modeTabText: { color: colors.textSecondary, fontWeight: '700' }, modeTabTextActive: { color: colors.primary },
  formCard: { padding: spacing.md }, label: { color: colors.textSecondary, fontSize: fontSize.small, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.xs },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: '700', backgroundColor: colors.background },
  currencyRow: { flexDirection: 'row', alignItems: 'center' }, currencyPrefix: { color: colors.textSecondary, fontWeight: '700', fontSize: fontSize.bodyLarge, marginRight: spacing.sm }, currencyInput: { flex: 1 },
  inlineFields: { flexDirection: 'row', gap: spacing.sm }, fieldHalf: { flex: 1 }, resultCard: { padding: spacing.lg, backgroundColor: colors.primaryLight, borderColor: colors.primary },
  resultKicker: { color: colors.primary, fontSize: fontSize.tiny, fontWeight: '900', letterSpacing: 0.8 }, resultValue: { color: colors.text, fontSize: fontSize.hero, fontWeight: '900', marginTop: spacing.xs, fontVariant: ['tabular-nums'] }, resultSupport: { color: colors.textSecondary, fontSize: fontSize.small }, divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  metric: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }, metricLabel: { color: colors.textSecondary, fontSize: fontSize.body }, metricValue: { color: colors.text, fontSize: fontSize.body, fontVariant: ['tabular-nums'] }, metricAccent: { color: colors.success, fontWeight: '700' }, metricStrong: { fontWeight: '900' },
  compositionTrack: { flexDirection: 'row', height: 10, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md }, investedFill: { backgroundColor: colors.primary }, interestFill: { backgroundColor: colors.success }, legendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }, legendText: { color: colors.primary, fontSize: fontSize.tiny }, legendInterest: { color: colors.success, fontSize: fontSize.tiny },
  sectionTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: '800', marginTop: spacing.sm }, scenarios: { flexDirection: 'row', gap: spacing.xs }, scenario: { flex: 1, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }, scenarioBase: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, scenarioLabel: { color: colors.textSecondary, fontSize: fontSize.tiny, fontWeight: '800' }, scenarioRate: { color: colors.primary, fontSize: fontSize.tiny, marginTop: 3 }, scenarioValue: { color: colors.text, fontSize: fontSize.small, fontWeight: '800', marginTop: spacing.sm, fontVariant: ['tabular-nums'] },
  disclaimer: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.sm }, disclaimerText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.small, lineHeight: 18 },
});
