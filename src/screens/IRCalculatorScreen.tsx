import { useState } from 'react';
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
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fmtBRL } from '../utils/format';
import Card from '../components/Card';

type Mode = 'acao' | 'fii' | 'daytrade';

const MODE_INFO: Record<Mode, { label: string; rate: number; code: string; note: string }> = {
  acao: {
    label: 'Ação (swing-trade)',
    rate: 0.15,
    code: '6015',
    note: 'Isento se total vendido no mês ≤ R$ 20.000. Acima disso, paga 15% sobre o lucro.',
  },
  fii: {
    label: 'FII (venda)',
    rate: 0.2,
    code: '6015',
    note: 'Sempre 20% sobre o lucro. FII NÃO tem isenção dos R$ 20k. Rendimentos mensais distribuídos são isentos.',
  },
  daytrade: {
    label: 'Day-trade',
    rate: 0.2,
    code: '6015',
    note: 'Compra e venda no mesmo dia. 20% sobre o lucro, sem isenção. Tem retenção em fonte de 1%.',
  },
};

export default function IRCalculatorScreen({ navigation }: any) {
  const [mode, setMode] = useState<Mode>('acao');
  const [totalVendido, setTotalVendido] = useState('');
  const [lucro, setLucro] = useState('');

  const totalSold = parseFloat(totalVendido.replace(/\./g, '').replace(',', '.')) || 0;
  const profit = parseFloat(lucro.replace(/\./g, '').replace(',', '.')) || 0;

  const info = MODE_INFO[mode];

  // Cálculo
  const isExempt = mode === 'acao' && totalSold > 0 && totalSold <= 20000;
  const hasProfit = profit > 0;
  const irDue = isExempt || !hasProfit ? 0 : profit * info.rate;
  const liquido = profit - irDue;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculadora IR</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Calcule o Imposto de Renda devido nas vendas do mês. Você apura, gera o DARF e paga até o último dia útil do mês seguinte.
          </Text>

          {/* Tipo de operação */}
          <Text style={styles.sectionLabel}>Tipo de operação</Text>
          <View style={styles.modeRow}>
            {(['acao', 'fii', 'daytrade'] as Mode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, mode === m && styles.modeChipActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeChipText, mode === m && styles.modeChipTextActive]}>
                  {MODE_INFO[m].label.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{info.note}</Text>
          </View>

          {/* Inputs */}
          {mode === 'acao' && (
            <>
              <Text style={styles.sectionLabel}>Total vendido no mês (R$)</Text>
              <TextInput
                style={styles.input}
                value={totalVendido}
                onChangeText={setTotalVendido}
                placeholder="20.000,00"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helper}>
                Soma tudo que você vendeu de ações no mês (não importa o lucro).
              </Text>
            </>
          )}

          <Text style={styles.sectionLabel}>Lucro líquido no mês (R$)</Text>
          <TextInput
            style={styles.input}
            value={lucro}
            onChangeText={setLucro}
            placeholder="1.000,00"
            keyboardType="decimal-pad"
          />
          <Text style={styles.helper}>
            Lucro = (preço de venda − preço médio de compra) × quantidade. Considere apenas operações com lucro positivo.
          </Text>

          {/* Resultado */}
          {(profit > 0 || totalSold > 0) && (
            <Card
              style={[
                styles.resultCard,
                isExempt ? styles.resultCardExempt : irDue > 0 ? styles.resultCardOwe : styles.resultCardOk,
              ]}
            >
              {isExempt ? (
                <>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                  <Text style={styles.resultTitle}>Isento!</Text>
                  <Text style={styles.resultBody}>
                    Total vendido ({fmtBRL(totalSold)}) está abaixo do limite de R$ 20.000/mês. Você não paga IR sobre esse lucro.
                  </Text>
                </>
              ) : !hasProfit ? (
                <>
                  <Ionicons name="trending-down" size={32} color={colors.warning} />
                  <Text style={styles.resultTitle}>Sem lucro, sem IR</Text>
                  <Text style={styles.resultBody}>
                    Sem lucro líquido positivo, não há IR a pagar. Mas registre o prejuízo — dá pra abater de lucros futuros.
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="document-text" size={32} color={colors.warning} />
                  <Text style={styles.resultTitle}>IR a pagar: {fmtBRL(irDue)}</Text>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultRowLabel}>Lucro bruto:</Text>
                    <Text style={styles.resultRowValue}>{fmtBRL(profit)}</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultRowLabel}>Alíquota:</Text>
                    <Text style={styles.resultRowValue}>{(info.rate * 100).toFixed(0)}%</Text>
                  </View>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultRowLabel}>Lucro líquido:</Text>
                    <Text style={styles.resultRowValue}>{fmtBRL(liquido)}</Text>
                  </View>
                  <View style={styles.darfBox}>
                    <Text style={styles.darfLabel}>Código DARF</Text>
                    <Text style={styles.darfCode}>{info.code}</Text>
                    <Text style={styles.darfNote}>
                      Pague até o último dia útil do mês seguinte ao mês das operações.
                    </Text>
                  </View>
                </>
              )}
            </Card>
          )}

          <View style={styles.disclaimer}>
            <Ionicons name="warning-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.disclaimerText}>
              Cálculo simplificado para fins educacionais. Não substitui a apuração formal feita por um contador. Day-trade tem retenção de 1% (IRRF) na fonte que pode ser compensada.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  headerTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  intro: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.lg },

  sectionLabel: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  modeRow: { flexDirection: 'row' },
  modeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeChipText: { color: colors.text, fontWeight: '600' },
  modeChipTextActive: { color: colors.textLight },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  infoText: { flex: 1, marginLeft: spacing.sm, fontSize: fontSize.body, color: colors.text, lineHeight: 18 },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.text,
  },
  helper: { fontSize: fontSize.small, color: colors.textTertiary, marginTop: 4 },

  resultCard: { padding: spacing.lg, alignItems: 'center', marginTop: spacing.lg },
  resultCardExempt: { backgroundColor: colors.successLight, borderColor: colors.success },
  resultCardOwe: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  resultCardOk: { backgroundColor: colors.surface },
  resultTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, marginTop: spacing.sm, textAlign: 'center' },
  resultBody: { fontSize: fontSize.body, color: colors.text, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: spacing.sm },
  resultRowLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  resultRowValue: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  darfBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    width: '100%',
    alignItems: 'center',
  },
  darfLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase', fontWeight: '700' },
  darfCode: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.primary, marginTop: 4 },
  darfNote: { fontSize: fontSize.small, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 16 },

  disclaimer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  disclaimerText: { flex: 1, fontSize: fontSize.small, color: colors.textSecondary, marginLeft: spacing.sm, lineHeight: 16 },
});
