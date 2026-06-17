import { useState } from 'react';
import {
  Alert,
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
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { safeBackToCarteira } from '../utils/navigation';

type Mode = 'monthly_amount' | 'annual_dy';

export default function DividendTargetScreen({ navigation }: any) {
  const { profile, setProfile } = useApp();
  const existing = profile?.dividendTarget;
  const [mode, setMode] = useState<Mode>(existing?.mode || 'monthly_amount');
  const [monthlyAmount, setMonthlyAmount] = useState(
    existing?.mode === 'monthly_amount' ? formatCurrencyInput(String(existing.value * 100)) : '',
  );
  const [annualDy, setAnnualDy] = useState(
    existing?.mode === 'annual_dy' ? String(existing.value) : '',
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const value =
        mode === 'monthly_amount' ? parseFormattedNumber(monthlyAmount) : parseFloat(annualDy);
      if (!value || value <= 0) {
        Alert.alert('Faltam dados', 'Defina um valor válido pra meta.');
        return;
      }
      if (mode === 'annual_dy' && value > 20) {
        Alert.alert(
          'Meta irrealista',
          'DY acima de 20% ao ano é muito difícil de sustentar no longo prazo no Brasil. Sugiro algo entre 6% e 14%.',
        );
        return;
      }
      await setProfile({ ...profile, dividendTarget: { mode, value } });
      Alert.alert('Pronto!', 'Meta de dividendos salva.', [
        { text: 'OK', onPress: () => safeBackToCarteira(navigation) },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!profile) return;
    const updated = { ...profile };
    delete updated.dividendTarget;
    await setProfile(updated);
    safeBackToCarteira(navigation);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToCarteira(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Meta de Dividendos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.intro}>
          Defina quanto quer receber em dividendos. O Vesti vai mostrar seu progresso no Dashboard e o coach vai sugerir ativos que te ajudem a atingir essa meta.
        </Text>

        <Text style={styles.sectionTitle}>Tipo de meta</Text>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'monthly_amount' && styles.modeBtnActive]}
            onPress={() => setMode('monthly_amount')}
          >
            <Ionicons
              name="cash-outline"
              size={20}
              color={mode === 'monthly_amount' ? colors.textLight : colors.primary}
            />
            <Text
              style={[styles.modeBtnText, mode === 'monthly_amount' && styles.modeBtnTextActive]}
            >
              R$ por mês
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'annual_dy' && styles.modeBtnActive]}
            onPress={() => setMode('annual_dy')}
          >
            <Ionicons
              name="trending-up-outline"
              size={20}
              color={mode === 'annual_dy' ? colors.textLight : colors.primary}
            />
            <Text style={[styles.modeBtnText, mode === 'annual_dy' && styles.modeBtnTextActive]}>
              DY % ao ano
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'monthly_amount' ? (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.label}>Quanto quer receber por mês (R$)</Text>
            <TextInput
              style={styles.input}
              value={monthlyAmount}
              onChangeText={(t) => setMonthlyAmount(formatCurrencyInput(t))}
              placeholder="0,00"
              keyboardType="decimal-pad"
            />
            <Text style={styles.helper}>
              Exemplos práticos: R$ 500/mês = preciso ~R$ 60k investidos com DY 10% a.a.
              R$ 2.000/mês = ~R$ 240k. R$ 5.000/mês = ~R$ 600k.
            </Text>
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.label}>DY mínimo ao ano (%)</Text>
            <TextInput
              style={styles.input}
              value={annualDy}
              onChangeText={setAnnualDy}
              placeholder="10"
              keyboardType="decimal-pad"
            />
            <Text style={styles.helper}>
              Realista no Brasil: 6-9% pra perfil moderado, 10-14% pra foco em renda passiva.
              Acima de 15% sustentável é raro.
            </Text>
          </Card>
        )}

        <Card style={[styles.tipCard, { marginTop: spacing.md }]}>
          <Text style={styles.tipTitle}>💡 Como o Vesti vai te ajudar</Text>
          <Text style={styles.tipText}>
            • Mostra teu progresso atual vs meta no Dashboard{'\n'}
            • Coach sugere quais ações comprar pra subir DY{'\n'}
            • Diagnóstico da IA leva a meta em consideração{'\n'}
            • Quando bate a meta, abre o popup de celebração 🎉
          </Text>
        </Card>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar meta'}</Text>
        </TouchableOpacity>

        {existing && (
          <TouchableOpacity style={styles.clearBtn} onPress={clear}>
            <Text style={styles.clearBtnText}>Remover meta</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  intro: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  modeRow: { flexDirection: 'row' },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  modeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeBtnText: { color: colors.text, fontWeight: '700', marginLeft: spacing.sm },
  modeBtnTextActive: { color: colors.textLight },
  label: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.text,
    backgroundColor: colors.background,
  },
  helper: { fontSize: fontSize.small, color: colors.textTertiary, marginTop: spacing.sm, lineHeight: 18, fontStyle: 'italic' },
  tipCard: { backgroundColor: colors.primaryLight, borderColor: colors.primaryAccent },
  tipTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  tipText: { fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.bodyLarge },
  clearBtn: { marginTop: spacing.sm, padding: spacing.md, alignItems: 'center' },
  clearBtnText: { color: colors.danger, fontWeight: '700' },
});
