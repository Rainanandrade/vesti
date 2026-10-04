import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { editorial } from '../theme/editorial';
import { EditorialState } from '../ui/editorial';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fmtBRL } from '../utils/format';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { safeBackToPlanejar } from '../utils/navigation';
import Card from '../components/Card';

const { calculateEmergencyReserve } = require('../utils/planningCalculators');
const MONTH_OPTIONS = [3, 6, 9, 12];

export default function EmergencyReserveScreen({ navigation }: any) {
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [months, setMonths] = useState(6);
  const [current, setCurrent] = useState('');
  const [monthlySaving, setMonthlySaving] = useState('');

  const result = useMemo(() => {
    const expenses = parseFormattedNumber(monthlyExpenses);
    if (expenses <= 0) return null;
    try {
      return calculateEmergencyReserve({ monthlyExpenses: expenses, months, current: parseFormattedNumber(current), monthlySaving: parseFormattedNumber(monthlySaving) });
    } catch {
      return null;
    }
  }, [current, monthlyExpenses, monthlySaving, months]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar para Planejar" onPress={() => safeBackToPlanejar(navigation)} style={styles.backButton} hitSlop={10}><Ionicons name="arrow-back" size={22} color={editorial.color.ink} /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.headerKicker}>Planejar</Text><Text style={styles.headerTitle}>Reserva de emergência</Text></View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>Transforme suas despesas essenciais em uma meta de proteção simples e mensurável.</Text>
          <Card style={styles.formCard}>
            <Label>Despesas essenciais por mês</Label>
            <CurrencyInput value={monthlyExpenses} onChange={setMonthlyExpenses} placeholder="3.000,00" />
            <Label>Meses de proteção</Label>
            <View style={styles.monthOptions}>{MONTH_OPTIONS.map((option) => <TouchableOpacity key={option} accessibilityRole="radio" accessibilityState={{ checked: months === option }} onPress={() => setMonths(option)} style={[styles.monthChip, months === option && styles.monthChipActive]}><Text style={[styles.monthChipText, months === option && styles.monthChipTextActive]}>{option} meses</Text></TouchableOpacity>)}</View>
            <Label>Quanto já está reservado</Label>
            <CurrencyInput value={current} onChange={setCurrent} placeholder="0,00" />
            <Label>Quanto consegue guardar por mês</Label>
            <CurrencyInput value={monthlySaving} onChange={setMonthlySaving} placeholder="500,00" />
          </Card>

          {result ? (
            <>
              <Card style={styles.resultCard}>
                <Text style={styles.resultKicker}>RESERVA-ALVO</Text>
                <Text style={styles.resultValue}>{fmtBRL(result.target)}</Text>
                <Text style={styles.resultSupport}>{months} meses das suas despesas essenciais</Text>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${result.progress}%` }]} /></View>
                <Text style={styles.progressText}>{result.progress.toFixed(0)}% concluído</Text>
                <View style={styles.metrics}>
                  <Metric label="Já coberto" value={fmtBRL(parseFormattedNumber(current))} />
                  <Metric label="Meses cobertos" value={`${result.coveredMonths.toFixed(1).replace('.', ',')} meses`} />
                  <Metric label="Ainda falta" value={fmtBRL(result.missing)} strong />
                  <Metric label="Previsão" value={result.estimatedMonths === null ? 'Informe o valor mensal' : result.estimatedMonths === 0 ? 'Meta alcançada' : `${result.estimatedMonths} meses`} accent />
                </View>
              </Card>
              <View style={styles.nextStep}><Ionicons name="shield-checkmark-outline" size={20} color={colors.success} /><Text style={styles.nextStepText}>{result.missing === 0 ? 'Sua meta de proteção já está coberta. Revise-a quando suas despesas mudarem.' : result.estimatedMonths === null ? 'Defina quanto consegue guardar por mês para receber uma previsão de prazo.' : `Mantendo ${fmtBRL(parseFormattedNumber(monthlySaving))} por mês, a estimativa é completar a reserva em ${result.estimatedMonths} meses.`}</Text></View>
            </>
          ) : (
            <EditorialState kind="empty" title="Monte sua proteção" detail="Informe suas despesas essenciais para calcular a reserva." />
          )}

          <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} /><Text style={styles.disclaimerText}>Esta ferramenta é educativa e não recomenda produtos financeiros. Ajuste o prazo à estabilidade da sua renda e às necessidades da sua família.</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) { return <Text style={styles.label}>{children}</Text>; }
function CurrencyInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <View style={styles.currencyRow}><Text style={styles.currencyPrefix}>R$</Text><TextInput style={styles.input} value={value} onChangeText={(text) => onChange(formatCurrencyInput(text))} placeholder={placeholder} placeholderTextColor={colors.textTertiary} keyboardType="decimal-pad" /></View>; }
function Metric({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) { return <View style={styles.metric}><Text style={styles.metricLabel}>{label}</Text><Text style={[styles.metricValue, strong && styles.metricStrong, accent && styles.metricAccent]}>{value}</Text></View>; }

const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: editorial.color.canvas }, header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: editorial.color.line }, backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: editorial.color.line, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, alignItems: 'center' }, headerKicker: { color: editorial.color.coral, fontSize: editorial.type.kicker, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, headerTitle: { color: editorial.color.ink, fontFamily: editorial.font.display, fontSize: editorial.type.title }, headerSpacer: { width: 44 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md }, intro: { color: colors.textSecondary, fontSize: fontSize.body, lineHeight: 21 }, formCard: { padding: spacing.md }, label: { color: colors.textSecondary, fontSize: fontSize.small, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.xs }, currencyRow: { flexDirection: 'row', alignItems: 'center' }, currencyPrefix: { color: colors.textSecondary, fontWeight: '700', fontSize: fontSize.bodyLarge, marginRight: spacing.sm }, input: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, color: colors.text, fontSize: fontSize.bodyLarge, fontWeight: '700', backgroundColor: colors.background },
  monthOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, monthChip: { minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface }, monthChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight }, monthChipText: { color: colors.textSecondary, fontSize: fontSize.small, fontWeight: '700' }, monthChipTextActive: { color: colors.primary },
  resultCard: { padding: spacing.lg, backgroundColor: colors.primaryLight, borderColor: colors.primary }, resultKicker: { color: colors.primary, fontSize: fontSize.tiny, fontWeight: '900', letterSpacing: 0.8 }, resultValue: { color: colors.text, fontSize: fontSize.hero, fontWeight: '900', marginTop: spacing.xs, fontVariant: ['tabular-nums'] }, resultSupport: { color: colors.textSecondary, fontSize: fontSize.small }, progressTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.divider, overflow: 'hidden', marginTop: spacing.md }, progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: radius.pill }, progressText: { color: colors.success, fontSize: fontSize.small, fontWeight: '800', marginTop: spacing.xs }, metrics: { borderTopWidth: 1, borderTopColor: colors.divider, marginTop: spacing.md, paddingTop: spacing.sm }, metric: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, paddingVertical: 5 }, metricLabel: { color: colors.textSecondary, fontSize: fontSize.body }, metricValue: { color: colors.text, fontSize: fontSize.body, fontVariant: ['tabular-nums'], textAlign: 'right' }, metricStrong: { fontWeight: '900' }, metricAccent: { color: colors.success, fontWeight: '800' },
  nextStep: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.successLight }, nextStepText: { flex: 1, color: colors.text, fontSize: fontSize.body, lineHeight: 20 }, disclaimer: { flexDirection: 'row', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.sm }, disclaimerText: { flex: 1, color: colors.textSecondary, fontSize: fontSize.small, lineHeight: 18 },
});
