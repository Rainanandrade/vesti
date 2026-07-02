import { useCallback, useEffect, useState } from 'react';
import { Alert as RNAlert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import ProLock from '../components/ProLock';
import { safeBackToTabs } from '../utils/navigation';
import { Alert as AlertType, createAlert, deleteAlert, listAlerts, toggleAlert } from '../api/alerts';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { fmtBRL } from '../utils/format';

const KIND_LABELS: Record<string, { title: string; icon: any; color: string }> = {
  price_above: { title: 'Preço acima de', icon: 'trending-up', color: colors.success },
  price_below: { title: 'Preço abaixo de', icon: 'trending-down', color: colors.danger },
  datacom: { title: 'Data-com se aproximando', icon: 'calendar', color: colors.primary },
  concentration: { title: 'Concentração alta', icon: 'pie-chart', color: colors.warning },
  dividend_drop: { title: 'Dividendo caiu', icon: 'arrow-down-circle', color: colors.warning },
};

export default function AlertsScreen({ navigation }: any) {
  const { activeWallet } = useApp();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [thresholdStr, setThresholdStr] = useState('');
  const [kind, setKind] = useState<'price_above' | 'price_below'>('price_above');

  const load = useCallback(async () => {
    try {
      setAlerts(await listAlerts());
    } catch (e: any) {
      RNAlert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addAlert = async () => {
    if (!selectedSymbol) { RNAlert.alert('Escolha', 'Selecione um ativo da sua carteira.'); return; }
    const t = parseFormattedNumber(thresholdStr);
    if (!t || t <= 0) { RNAlert.alert('Valor inválido', 'Digite um preço válido.'); return; }
    setCreating(true);
    try {
      await createAlert({ kind, symbol: selectedSymbol, threshold: t });
      setThresholdStr('');
      setSelectedSymbol(null);
      await load();
    } catch (e: any) {
      RNAlert.alert('Erro', e.message);
    } finally {
      setCreating(false);
    }
  };

  const removeAlert = async (id: string) => {
    try { await deleteAlert(id); await load(); } catch (e: any) { RNAlert.alert('Erro', e.message); }
  };

  const flipAlert = async (a: AlertType) => {
    try { await toggleAlert(a.id, !a.active); await load(); } catch (e: any) { RNAlert.alert('Erro', e.message); }
  };

  const walletSymbols = (activeWallet?.assets || []).map((a) => a.symbol);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Alertas inteligentes</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ProLock
          mode="replace"
          title="Alertas inteligentes"
          description="Preço alvo, data-com de dividendo, concentração de setor. Você é avisado antes."
          onUnlock={() => navigation.getParent()?.navigate('ProSubscribe')}
        >
          <Card>
            <Text style={styles.sectionTitle}>➕ Novo alerta de preço</Text>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.kindRow}>
              <TouchableOpacity
                style={[styles.kindBtn, kind === 'price_above' && styles.kindBtnActive]}
                onPress={() => setKind('price_above')}
              >
                <Ionicons name="trending-up" size={16} color={kind === 'price_above' ? colors.textLight : colors.text} />
                <Text style={[styles.kindText, kind === 'price_above' && { color: colors.textLight }]}>Subir até</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.kindBtn, kind === 'price_below' && styles.kindBtnActive]}
                onPress={() => setKind('price_below')}
              >
                <Ionicons name="trending-down" size={16} color={kind === 'price_below' ? colors.textLight : colors.text} />
                <Text style={[styles.kindText, kind === 'price_below' && { color: colors.textLight }]}>Cair até</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Ativo</Text>
            <View style={styles.symbolsRow}>
              {walletSymbols.length === 0 && (
                <Text style={{ color: colors.textTertiary, fontStyle: 'italic', fontSize: fontSize.small }}>
                  Adicione ativos na carteira primeiro.
                </Text>
              )}
              {walletSymbols.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, selectedSymbol === s && styles.chipActive]}
                  onPress={() => setSelectedSymbol(s)}
                >
                  <Text style={[styles.chipText, selectedSymbol === s && { color: colors.textLight }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Preço alvo</Text>
            <TextInput
              style={styles.input}
              value={formatCurrencyInput(thresholdStr)}
              onChangeText={(v) => setThresholdStr(v.replace(/\D/g, ''))}
              keyboardType="numeric"
              placeholder="R$ 25,00"
            />

            <TouchableOpacity
              style={[styles.addBtn, (!selectedSymbol || !thresholdStr || creating) && { opacity: 0.5 }]}
              onPress={addAlert}
              disabled={!selectedSymbol || !thresholdStr || creating}
            >
              <Ionicons name="notifications" size={16} color={colors.textLight} />
              <Text style={styles.addText}>{creating ? 'Criando...' : 'Criar alerta'}</Text>
            </TouchableOpacity>
          </Card>

          <Text style={styles.listLabel}>Alertas ativos</Text>

          {loading ? (
            <Text style={{ color: colors.textTertiary, textAlign: 'center', padding: spacing.md }}>Carregando...</Text>
          ) : alerts.length === 0 ? (
            <Card>
              <Text style={styles.empty}>Nenhum alerta criado ainda.</Text>
            </Card>
          ) : (
            alerts.map((a) => {
              const meta = KIND_LABELS[a.kind];
              return (
                <Card key={a.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.alertRow}>
                    <View style={[styles.alertIcon, { backgroundColor: meta.color + '22' }]}>
                      <Ionicons name={meta.icon} size={18} color={meta.color} />
                    </View>
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text style={styles.alertTitle}>
                        {a.symbol} {meta.title.toLowerCase()} {a.threshold != null ? fmtBRL(a.threshold) : ''}
                      </Text>
                      {a.triggeredAt && (
                        <Text style={styles.alertSub}>
                          Disparou em {new Date(a.triggeredAt).toLocaleDateString('pt-BR')}
                        </Text>
                      )}
                    </View>
                    <Switch value={a.active} onValueChange={() => flipAlert(a)} />
                    <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => removeAlert(a.id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          )}

          <Text style={styles.footnote}>
            Alertas de preço são verificados sempre que o app abre. Push notifications automáticos virão em breve.
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
  sectionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  label: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '700', marginTop: spacing.md, marginBottom: 6 },
  kindRow: { flexDirection: 'row', gap: spacing.sm as any },
  kindBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 as any, padding: 10, borderRadius: radius.md, borderWidth: 1, borderColor: colors.divider },
  kindBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  kindText: { color: colors.text, fontWeight: '700' },
  symbolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 as any },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700', fontSize: fontSize.small },
  input: { borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.sm, color: colors.text, fontSize: fontSize.body },
  addBtn: { flexDirection: 'row', gap: 6 as any, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md },
  addText: { color: colors.textLight, fontWeight: '800' },
  listLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase', marginTop: spacing.lg, marginBottom: spacing.sm },
  empty: { color: colors.textSecondary, textAlign: 'center', padding: spacing.md, fontStyle: 'italic' },
  alertRow: { flexDirection: 'row', alignItems: 'center' },
  alertIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: fontSize.body, color: colors.text, fontWeight: '700' },
  alertSub: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },
  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md, fontStyle: 'italic' },
});
