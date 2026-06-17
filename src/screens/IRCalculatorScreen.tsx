import { useState } from 'react';
import { safeBackToCarteira } from '../utils/navigation';
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
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import Card from '../components/Card';
import Isentometro from '../components/Isentometro';
import { useApp } from '../context/AppContext';

type Mode = 'acao' | 'fii' | 'daytrade' | 'dividendos';

const MODE_INFO: Record<
  Mode,
  { label: string; rate: number; code: string; note: string }
> = {
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
  dividendos: {
    label: 'Dividendos / JCP',
    rate: 0.15,
    code: '—',
    note: 'Dividendos de ações são isentos. JCP tem 15% retido na fonte (já descontado).',
  },
};

export default function IRCalculatorScreen({ navigation }: any) {
  const { operations, privacyMode } = useApp();
  const [mode, setMode] = useState<Mode>('acao');
  const [totalVendido, setTotalVendido] = useState('');
  const [lucro, setLucro] = useState('');
  const [dividendoTipo, setDividendoTipo] = useState<'dividendo' | 'jcp'>('dividendo');
  const [valorRecebido, setValorRecebido] = useState('');

  // Total vendido em ações no mês corrente (das operações registradas)
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalVendidoMesAtual = operations
    .filter((o) => o.type === 'sell' && o.assetType === 'acao' && o.date.startsWith(currentMonth))
    .reduce((s, o) => s + o.quantity * o.price, 0);

  const totalSold = parseFormattedNumber(totalVendido);
  const profit = parseFormattedNumber(lucro);
  const recebido = parseFormattedNumber(valorRecebido);

  const info = MODE_INFO[mode];

  // Cálculo cripto
  const isExempt = mode === 'acao' && totalSold > 0 && totalSold <= 20000;
  const hasProfit = profit > 0;
  const irDue = isExempt || !hasProfit ? 0 : profit * info.rate;
  const liquido = profit - irDue;
  const needsDarf = irDue > 0 && mode !== 'dividendos';

  // Cálculo dividendos
  const dividendoIrRetido = dividendoTipo === 'jcp' ? recebido * 0.15 : 0;
  const dividendoLiquido = recebido - dividendoIrRetido;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToCarteira(navigation)} hitSlop={10}>
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
            Calcule o IR sobre vendas e veja a tributação de dividendos/JCP. Você apura, gera o DARF (quando necessário) e paga até o último dia útil do mês seguinte.
          </Text>

          {/* Chips dos últimos 3 meses com indicador de pendência de DARF */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {buildMonthChips(operations).map((mc) => (
              <View key={mc.key} style={[styles.monthChip, mc.current && styles.monthChipCurrent]}>
                {mc.pending && <View style={styles.pendingDot} />}
                <Text style={[styles.monthChipText, mc.current && styles.monthChipTextCurrent]}>
                  {mc.label}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Isentômetro com dados das operações registradas */}
          <View style={{ marginBottom: spacing.md }}>
            <Isentometro totalVendidoNoMes={totalVendidoMesAtual} privacyMode={privacyMode} />
            <TouchableOpacity
              style={styles.opLink}
              onPress={() => navigation.navigate('Operacoes')}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.opLinkText}>Registrar operações pra atualizar</Text>
            </TouchableOpacity>
          </View>

          {/* Tipo de operação */}
          <Text style={styles.sectionLabel}>Tipo de operação</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.modeRow}>
              {(['acao', 'fii', 'daytrade', 'dividendos'] as Mode[]).map((m) => (
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
          </ScrollView>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{info.note}</Text>
          </View>

          {/* ============ MODE: Dividendos & JCP ============ */}
          {mode === 'dividendos' && (
            <>
              <Text style={styles.sectionLabel}>Tipo</Text>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeChip, dividendoTipo === 'dividendo' && styles.modeChipActive]}
                  onPress={() => setDividendoTipo('dividendo')}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      dividendoTipo === 'dividendo' && styles.modeChipTextActive,
                    ]}
                  >
                    Dividendo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeChip, dividendoTipo === 'jcp' && styles.modeChipActive]}
                  onPress={() => setDividendoTipo('jcp')}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      dividendoTipo === 'jcp' && styles.modeChipTextActive,
                    ]}
                  >
                    JCP (Juros sobre Capital Próprio)
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionLabel}>Valor bruto recebido (R$)</Text>
              <TextInput
                style={styles.input}
                value={valorRecebido}
                onChangeText={(t) => setValorRecebido(formatCurrencyInput(t))}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />

              {recebido > 0 && (
                <Card
                  style={[
                    styles.resultCard,
                    dividendoTipo === 'dividendo'
                      ? styles.resultCardExempt
                      : styles.resultCardOwe,
                  ]}
                >
                  {dividendoTipo === 'dividendo' ? (
                    <>
                      <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                      <Text style={styles.resultTitle}>Isento de IR</Text>
                      <Text style={styles.resultBody}>
                        Dividendos de ações são isentos de Imposto de Renda pra pessoa física (Lei 9.249/95). Você recebe os {fmtBRL(recebido)} líquidos.
                      </Text>
                      <View style={styles.darfBox}>
                        <Text style={styles.darfLabel}>Precisa emitir DARF?</Text>
                        <Text style={[styles.darfCode, { color: colors.success }]}>NÃO</Text>
                        <Text style={styles.darfNote}>
                          Mas você precisa declarar na ficha "Rendimentos Isentos e Não Tributáveis" no IRPF anual.
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Ionicons name="document-text" size={32} color={colors.warning} />
                      <Text style={styles.resultTitle}>15% retido na fonte</Text>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultRowLabel}>Valor bruto:</Text>
                        <Text style={styles.resultRowValue}>{fmtBRL(recebido)}</Text>
                      </View>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultRowLabel}>IRRF (15%):</Text>
                        <Text style={styles.resultRowValue}>−{fmtBRL(dividendoIrRetido)}</Text>
                      </View>
                      <View style={styles.resultRow}>
                        <Text style={styles.resultRowLabel}>Você recebe líquido:</Text>
                        <Text style={[styles.resultRowValue, { color: colors.success, fontWeight: '700' }]}>
                          {fmtBRL(dividendoLiquido)}
                        </Text>
                      </View>
                      <View style={styles.darfBox}>
                        <Text style={styles.darfLabel}>Precisa emitir DARF?</Text>
                        <Text style={[styles.darfCode, { color: colors.success }]}>NÃO</Text>
                        <Text style={styles.darfNote}>
                          Já vem descontado. Declare na ficha "Rendimentos Sujeitos à Tributação Exclusiva" no IRPF anual.
                        </Text>
                      </View>
                    </>
                  )}
                </Card>
              )}

              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>💡 Casos especiais</Text>
                <Text style={styles.tipText}>
                  • <Text style={{ fontWeight: '700' }}>Rendimento de FII</Text>: ISENTO (atende 50+ cotistas, ≤10% da posse, fundo em bolsa).
                </Text>
                <Text style={styles.tipText}>
                  • <Text style={{ fontWeight: '700' }}>Dividendos de BDR</Text>: 30% retido nos EUA + declaração de exterior no IRPF.
                </Text>
                <Text style={styles.tipText}>
                  • <Text style={{ fontWeight: '700' }}>Reforma tributária</Text>: existe PL pra tributar dividendos em 15% a partir de 2027. Aguarde aprovação.
                </Text>
              </View>
            </>
          )}

          {/* ============ MODE: Ação / FII / Day-trade ============ */}
          {mode !== 'dividendos' && (
            <>
              {mode === 'acao' && (
                <>
                  <Text style={styles.sectionLabel}>Total vendido no mês (R$)</Text>
                  <TextInput
                    style={styles.input}
                    value={totalVendido}
                    onChangeText={(t) => setTotalVendido(formatCurrencyInput(t))}
                    placeholder="0,00"
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
                onChangeText={(t) => setLucro(formatCurrencyInput(t))}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
              <Text style={styles.helper}>
                Lucro = (preço de venda − preço médio de compra) × quantidade. Considere apenas operações com lucro positivo.
              </Text>

              {(profit > 0 || totalSold > 0) && (
                <Card
                  style={[
                    styles.resultCard,
                    isExempt
                      ? styles.resultCardExempt
                      : irDue > 0
                      ? styles.resultCardOwe
                      : styles.resultCardOk,
                  ]}
                >
                  {isExempt ? (
                    <>
                      <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                      <Text style={styles.resultTitle}>Isento!</Text>
                      <Text style={styles.resultBody}>
                        Total vendido ({fmtBRL(totalSold)}) está abaixo do limite de R$ 20.000/mês. Você não paga IR sobre esse lucro.
                      </Text>
                      <View style={styles.darfBox}>
                        <Text style={styles.darfLabel}>Precisa emitir DARF?</Text>
                        <Text style={[styles.darfCode, { color: colors.success }]}>NÃO</Text>
                        <Text style={styles.darfNote}>
                          Mas você ainda declara no IRPF anual como "Rendimento Isento".
                        </Text>
                      </View>
                    </>
                  ) : !hasProfit ? (
                    <>
                      <Ionicons name="trending-down" size={32} color={colors.warning} />
                      <Text style={styles.resultTitle}>Sem lucro, sem IR</Text>
                      <Text style={styles.resultBody}>
                        Sem lucro líquido positivo, não há IR a pagar. Mas registre o prejuízo — dá pra abater de lucros futuros.
                      </Text>
                      <View style={styles.darfBox}>
                        <Text style={styles.darfLabel}>Precisa emitir DARF?</Text>
                        <Text style={[styles.darfCode, { color: colors.success }]}>NÃO</Text>
                      </View>
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
                        <Text style={styles.darfLabel}>Precisa emitir DARF?</Text>
                        <Text style={[styles.darfCode, { color: colors.warning }]}>SIM</Text>
                        <Text style={styles.darfCode}>{info.code}</Text>
                        <Text style={styles.darfNote}>
                          Pague até o último dia útil do mês seguinte ao mês das operações.
                        </Text>
                      </View>
                    </>
                  )}
                </Card>
              )}
            </>
          )}

          <View style={styles.disclaimer}>
            <Ionicons name="warning-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.disclaimerText}>
              Cálculo simplificado para fins educacionais. Não substitui apuração formal por contador. Day-trade tem retenção de 1% (IRRF) na fonte que pode ser compensada na apuração mensal.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const MES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function buildMonthChips(operations: { type: string; assetType: string; quantity: number; price: number; date: string }[]) {
  const chips: { key: string; label: string; pending: boolean; current: boolean }[] = [];
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const sold = operations
      .filter((o) => o.type === 'sell' && o.assetType === 'acao' && o.date.startsWith(key))
      .reduce((s, o) => s + o.quantity * o.price, 0);
    chips.push({
      key,
      label: `${MES_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      pending: sold > 20000,
      current: i === 0,
    });
  }
  return chips;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  monthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthChipCurrent: { borderColor: colors.primary, borderWidth: 2 },
  monthChipText: { color: colors.textSecondary, fontWeight: '600' },
  monthChipTextCurrent: { color: colors.primary, fontWeight: '700' },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    marginRight: 6,
  },
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

  tipBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  tipTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  tipText: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20, marginBottom: 4 },

  disclaimer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
  },
  disclaimerText: { flex: 1, fontSize: fontSize.small, color: colors.textSecondary, marginLeft: spacing.sm, lineHeight: 16 },
  opLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, padding: spacing.sm },
  opLinkText: { color: colors.primary, fontWeight: '600', marginLeft: 4, fontSize: fontSize.body },
});
