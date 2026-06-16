import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
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
import { useApp, Provento } from '../context/AppContext';
import { fmtBRL } from '../utils/format';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import Card from '../components/Card';
import { MONTH_NAMES_PT } from '../data/dividends';

type Kind = 'dividendo' | 'jcp' | 'rendimento';

export default function ProventosScreen({ navigation }: any) {
  const { proventos, addProvento, removeProvento, activeWallet, privacyMode } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  // Form
  const [symbol, setSymbol] = useState('');
  const [kind, setKind] = useState<Kind>('dividendo');
  const [amount, setAmount] = useState('');
  const [perShare, setPerShare] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const totalYear = useMemo(() => {
    const y = new Date().getFullYear();
    return proventos
      .filter((p) => p.date.startsWith(String(y)))
      .reduce((s, p) => s + p.amount, 0);
  }, [proventos]);

  const total12m = useMemo(() => {
    const limit = new Date();
    limit.setMonth(limit.getMonth() - 12);
    const iso = limit.toISOString().slice(0, 10);
    return proventos.filter((p) => p.date >= iso).reduce((s, p) => s + p.amount, 0);
  }, [proventos]);

  const byMonth = useMemo(() => {
    const map: Record<string, Provento[]> = {};
    for (const p of proventos) {
      const key = p.date.slice(0, 7); // YYYY-MM
      (map[key] = map[key] || []).push(p);
    }
    const sorted = Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
    return sorted;
  }, [proventos]);

  const symbols = useMemo(
    () => (activeWallet?.assets || []).map((a) => a.symbol),
    [activeWallet],
  );

  const resetForm = () => {
    setSymbol('');
    setKind('dividendo');
    setAmount('');
    setPerShare('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const submit = async () => {
    const sym = symbol.trim().toUpperCase();
    const amt = parseFormattedNumber(amount);
    const ps = perShare ? parseFormattedNumber(perShare) : undefined;
    if (!sym || amt <= 0 || !date) {
      Alert.alert('Faltam dados', 'Preencha ticker, valor e data.');
      return;
    }
    setBusy(true);
    try {
      await addProvento({
        symbol: sym,
        kind,
        amount: amt,
        perShare: ps,
        date,
      });
      setModalOpen(false);
      resetForm();
    } catch (e: any) {
      Alert.alert('Ops', e?.message || 'Não foi possível registrar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Proventos</Text>
        <TouchableOpacity
          onPress={() => setModalOpen(true)}
          style={[styles.iconBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={22} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Resumo */}
        <Card style={styles.summaryCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryLabel}>Recebido em {new Date().getFullYear()}</Text>
            <Text style={styles.summaryValue}>{fmtBRL(totalYear, privacyMode)}</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.summaryLabel}>Últimos 12 meses</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {fmtBRL(total12m, privacyMode)}
            </Text>
          </View>
        </Card>

        {proventos.length === 0 && (
          <Card style={{ marginTop: spacing.md, alignItems: 'center', padding: spacing.lg }}>
            <Text style={{ fontSize: 40 }}>💰</Text>
            <Text style={styles.emptyTitle}>Nenhum provento registrado</Text>
            <Text style={styles.emptyDesc}>
              Quando receber dividendos, JCP ou rendimentos, toque em "+" pra registrar.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setModalOpen(true)}
            >
              <Text style={styles.emptyBtnText}>+ Registrar provento</Text>
            </TouchableOpacity>
          </Card>
        )}

        {byMonth.map(([month, items]) => {
          const sum = items.reduce((s, p) => s + p.amount, 0);
          const [y, m] = month.split('-');
          const label = `${MONTH_NAMES_PT[Number(m) - 1]}/${y}`;
          const isOpen = expanded[month];
          return (
            <Card key={month} style={{ marginTop: spacing.md, padding: 0 }}>
              <TouchableOpacity
                style={styles.monthHeader}
                onPress={() =>
                  setExpanded((prev) => ({ ...prev, [month]: !prev[month] }))
                }
              >
                <View>
                  <Text style={styles.monthLabel}>{label}</Text>
                  <Text style={styles.monthCount}>
                    {items.length} {items.length === 1 ? 'lançamento' : 'lançamentos'}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.monthSum}>{fmtBRL(sum, privacyMode)}</Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={colors.textTertiary}
                    style={{ marginLeft: spacing.sm }}
                  />
                </View>
              </TouchableOpacity>
              {isOpen && (
                <View style={styles.monthBody}>
                  {items.map((p) => (
                    <View key={p.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.itemSymbol}>{p.symbol}</Text>
                          <View style={[styles.kindPill, kindStyle(p.kind)]}>
                            <Text style={styles.kindText}>{labelKind(p.kind)}</Text>
                          </View>
                        </View>
                        <Text style={styles.itemDate}>
                          {formatDateBR(p.date)}
                          {p.perShare ? ` · R$ ${p.perShare.toFixed(4)}/cota` : ''}
                        </Text>
                      </View>
                      <Text style={styles.itemAmount}>{fmtBRL(p.amount, privacyMode)}</Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Remover', `Excluir provento de ${p.symbol}?`, [
                            { text: 'Cancelar', style: 'cancel' },
                            {
                              text: 'Remover',
                              style: 'destructive',
                              onPress: () => removeProvento(p.id),
                            },
                          ])
                        }
                        style={{ marginLeft: spacing.sm }}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>

      {/* Modal de adicionar */}
      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.header}>
            <Text style={styles.title}>Registrar provento</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.iconBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: spacing.md }}>
            <Text style={styles.label}>Ticker</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: MXRF11"
              autoCapitalize="characters"
              value={symbol}
              onChangeText={setSymbol}
            />
            {symbols.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.sm }}>
                {symbols.map((s) => (
                  <TouchableOpacity key={s} style={styles.suggestChip} onPress={() => setSymbol(s)}>
                    <Text style={styles.suggestText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={[styles.label, { marginTop: spacing.md }]}>Tipo</Text>
            <View style={{ flexDirection: 'row' }}>
              {(['dividendo', 'jcp', 'rendimento'] as Kind[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.kindBtn, kind === k && styles.kindBtnActive]}
                  onPress={() => setKind(k)}
                >
                  <Text style={[styles.kindBtnText, kind === k && styles.kindBtnTextActive]}>
                    {labelKind(k)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: spacing.md }]}>Valor total recebido (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(t) => setAmount(formatCurrencyInput(t))}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Valor por cota (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,0000"
              keyboardType="decimal-pad"
              value={perShare}
              onChangeText={(t) => setPerShare(formatCurrencyInput(t))}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Data do pagamento</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              value={date}
              onChangeText={setDate}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.saveBtn, busy && { opacity: 0.6 }]}
              onPress={submit}
              disabled={busy}
            >
              <Text style={styles.saveBtnText}>{busy ? 'Salvando...' : 'Salvar provento'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function labelKind(k: Kind): string {
  return k === 'dividendo' ? 'Dividendo' : k === 'jcp' ? 'JCP' : 'Rendimento';
}

function kindStyle(k: Kind) {
  if (k === 'jcp') return { backgroundColor: colors.warningLight };
  if (k === 'rendimento') return { backgroundColor: colors.primaryLight };
  return { backgroundColor: colors.successLight };
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
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
  summaryCard: { flexDirection: 'row' },
  summaryLabel: {
    fontSize: fontSize.tiny,
    color: colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontSize: fontSize.title,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 2,
  },
  emptyTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  emptyBtnText: { color: colors.textLight, fontWeight: '700' },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  monthLabel: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  monthCount: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },
  monthSum: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.success },
  monthBody: { borderTopWidth: 1, borderColor: colors.divider, padding: spacing.md, paddingTop: spacing.sm },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  itemSymbol: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  itemDate: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: 2 },
  itemAmount: { fontSize: fontSize.body, fontWeight: '700', color: colors.success },
  kindPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginLeft: spacing.sm },
  kindText: { fontSize: fontSize.tiny, fontWeight: '600', color: colors.text },
  label: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
    backgroundColor: colors.background,
  },
  suggestChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  suggestText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.small },
  kindBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  kindBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  kindBtnText: { color: colors.textSecondary, fontWeight: '600' },
  kindBtnTextActive: { color: colors.textLight, fontWeight: '700' },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.bodyLarge },
});
