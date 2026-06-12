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
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { fmtBRL } from '../utils/format';
import Card from '../components/Card';

type Mode = 'pmt' | 'fv';

export default function AporteCalculatorScreen({ navigation }: any) {
  const [mode, setMode] = useState<Mode>('pmt');

  // PMT inputs (preciso atingir X em Y anos)
  const [metaValor, setMetaValor] = useState('');
  const [prazoAnos, setPrazoAnos] = useState('');
  const [taxaAnual, setTaxaAnual] = useState('10');
  const [valorInicial, setValorInicial] = useState('');

  // FV inputs (aportando X por mês durante Y anos)
  const [aporteMensal, setAporteMensal] = useState('');
  const [prazoAnos2, setPrazoAnos2] = useState('');
  const [taxaAnual2, setTaxaAnual2] = useState('10');
  const [valorInicial2, setValorInicial2] = useState('');

  const calculation = useMemo(() => {
    if (mode === 'pmt') {
      const fv = parseFloat(metaValor.replace(/\./g, '').replace(',', '.')) || 0;
      const years = parseFloat(prazoAnos.replace(',', '.')) || 0;
      const rateAnnual = (parseFloat(taxaAnual.replace(',', '.')) || 0) / 100;
      const pv = parseFloat(valorInicial.replace(/\./g, '').replace(',', '.')) || 0;
      if (fv <= 0 || years <= 0) return null;
      const monthlyRate = Math.pow(1 + rateAnnual, 1 / 12) - 1;
      const n = years * 12;
      // FV de valor inicial após n meses
      const fvOfPv = pv * Math.pow(1 + monthlyRate, n);
      const remaining = fv - fvOfPv;
      // PMT pra alcançar o restante
      const pmt =
        monthlyRate === 0
          ? remaining / n
          : (remaining * monthlyRate) / (Math.pow(1 + monthlyRate, n) - 1);
      return { type: 'pmt', monthly: Math.max(0, pmt), totalInvested: pmt * n + pv, fv };
    } else {
      const pmt = parseFloat(aporteMensal.replace(/\./g, '').replace(',', '.')) || 0;
      const years = parseFloat(prazoAnos2.replace(',', '.')) || 0;
      const rateAnnual = (parseFloat(taxaAnual2.replace(',', '.')) || 0) / 100;
      const pv = parseFloat(valorInicial2.replace(/\./g, '').replace(',', '.')) || 0;
      if (pmt <= 0 || years <= 0) return null;
      const monthlyRate = Math.pow(1 + rateAnnual, 1 / 12) - 1;
      const n = years * 12;
      const fvOfPv = pv * Math.pow(1 + monthlyRate, n);
      const fvOfPmt =
        monthlyRate === 0 ? pmt * n : pmt * ((Math.pow(1 + monthlyRate, n) - 1) / monthlyRate);
      const fv = fvOfPv + fvOfPmt;
      const totalInvested = pmt * n + pv;
      return { type: 'fv', monthly: pmt, totalInvested, fv };
    }
  }, [mode, metaValor, prazoAnos, taxaAnual, valorInicial, aporteMensal, prazoAnos2, taxaAnual2, valorInicial2]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calculadora de aporte</Text>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'pmt' && styles.modeTabActive]}
              onPress={() => setMode('pmt')}
            >
              <Text style={[styles.modeTabText, mode === 'pmt' && styles.modeTabTextActive]}>
                Quanto aportar?
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'fv' && styles.modeTabActive]}
              onPress={() => setMode('fv')}
            >
              <Text style={[styles.modeTabText, mode === 'fv' && styles.modeTabTextActive]}>
                Quanto vou ter?
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'pmt' ? (
            <>
              <Text style={styles.modeIntro}>
                Defina sua meta e prazo. Vou calcular quanto você precisa aportar todo mês pra chegar lá.
              </Text>
              <Label>Quanto quero ter?</Label>
              <CurrencyInput value={metaValor} onChange={setMetaValor} placeholder="100.000" />
              <Label>Em quantos anos?</Label>
              <TextInput style={styles.input} value={prazoAnos} onChangeText={setPrazoAnos} placeholder="10" keyboardType="decimal-pad" />
              <Label>Rendimento anual esperado (%)</Label>
              <TextInput style={styles.input} value={taxaAnual} onChangeText={setTaxaAnual} placeholder="10" keyboardType="decimal-pad" />
              <Label>Já tenho guardado (opcional)</Label>
              <CurrencyInput value={valorInicial} onChange={setValorInicial} placeholder="0" />
            </>
          ) : (
            <>
              <Text style={styles.modeIntro}>
                Diga quanto você aporta por mês. Vou projetar quanto você vai ter no final do prazo.
              </Text>
              <Label>Aporte mensal</Label>
              <CurrencyInput value={aporteMensal} onChange={setAporteMensal} placeholder="500" />
              <Label>Durante quantos anos?</Label>
              <TextInput style={styles.input} value={prazoAnos2} onChangeText={setPrazoAnos2} placeholder="20" keyboardType="decimal-pad" />
              <Label>Rendimento anual esperado (%)</Label>
              <TextInput style={styles.input} value={taxaAnual2} onChangeText={setTaxaAnual2} placeholder="10" keyboardType="decimal-pad" />
              <Label>Valor inicial (opcional)</Label>
              <CurrencyInput value={valorInicial2} onChange={setValorInicial2} placeholder="0" />
            </>
          )}

          {calculation && (
            <Card style={styles.resultCard}>
              {calculation.type === 'pmt' ? (
                <>
                  <Text style={styles.resultLabel}>Você precisa aportar</Text>
                  <Text style={styles.resultValue}>{fmtBRL(calculation.monthly)}</Text>
                  <Text style={styles.resultSub}>todo mês durante {prazoAnos} anos</Text>
                </>
              ) : (
                <>
                  <Text style={styles.resultLabel}>Você vai ter</Text>
                  <Text style={styles.resultValue}>{fmtBRL(calculation.fv)}</Text>
                  <Text style={styles.resultSub}>em {prazoAnos2} anos</Text>
                </>
              )}
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Total investido</Text>
                <Text style={styles.rowValue}>{fmtBRL(calculation.totalInvested)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Rendimento</Text>
                <Text style={[styles.rowValue, { color: colors.success }]}>
                  {fmtBRL(calculation.fv - calculation.totalInvested)}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Valor final</Text>
                <Text style={[styles.rowValue, { fontWeight: '700' }]}>{fmtBRL(calculation.fv)}</Text>
              </View>
            </Card>
          )}

          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 Dicas de rendimento</Text>
            <Text style={styles.tipText}>• Tesouro Selic: ~12% ao ano (acompanha Selic)</Text>
            <Text style={styles.tipText}>• Ibovespa histórico: ~12-15% ao ano (longo prazo)</Text>
            <Text style={styles.tipText}>• Carteira diversificada de FIIs: ~10-12% ao ano</Text>
            <Text style={styles.tipText}>• Use rendimento conservador (8-10%) pra metas críticas</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={styles.label}>{children}</Text>;
}

function CurrencyInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.currencyRow}>
      <Text style={styles.currencyPrefix}>R$</Text>
      <TextInput
        style={[styles.input, { flex: 1, marginLeft: spacing.sm }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        keyboardType="decimal-pad"
      />
    </View>
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

  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.md,
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.pill },
  modeTabActive: { backgroundColor: colors.background },
  modeTabText: { color: colors.textSecondary, fontWeight: '600' },
  modeTabTextActive: { color: colors.primary },
  modeIntro: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },

  label: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.md, marginBottom: spacing.xs, fontWeight: '600' },
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
  currencyRow: { flexDirection: 'row', alignItems: 'center' },
  currencyPrefix: { fontSize: fontSize.title, fontWeight: '600', color: colors.textSecondary },

  resultCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  resultLabel: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '600' },
  resultValue: { fontSize: fontSize.hero, fontWeight: 'bold', color: colors.primary, marginVertical: 4 },
  resultSub: { fontSize: fontSize.body, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.divider, width: '100%', marginVertical: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginVertical: 4 },
  rowLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  rowValue: { fontSize: fontSize.body, color: colors.text },

  tipBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  tipTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  tipText: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20 },
});
