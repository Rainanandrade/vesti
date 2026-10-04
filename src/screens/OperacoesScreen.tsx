import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
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
import { useApp, Operation } from '../context/AppContext';
import { fmtBRL } from '../utils/format';
import Card from '../components/Card';
import Isentometro from '../components/Isentometro';
import { safeBackToCarteira } from '../utils/navigation';
import { useOperationModal } from '../context/OperationModalContext';
import { editorial } from '../theme/editorial';
import { EditorialState } from '../ui/editorial';
import Button from '../components/Button';
import { confirmAction } from '../utils/confirm';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
const { formatBrazilianDateInput, brazilianDateToISO } = require('../utils/dateInput');

export default function OperacoesScreen({ navigation }: any) {
  const { operations, privacyMode, updateOperationAndPosition, removeOperationAndUpdatePosition } = useApp();
  const { open: openOperation } = useOperationModal();
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [editing, setEditing] = useState<Operation | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editFees, setEditFees] = useState('');
  const [editDate, setEditDate] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = (operation: Operation) => {
    setEditing(operation);
    setEditQuantity(String(operation.quantity).replace('.', ','));
    setEditPrice(formatCurrencyInput(String(Math.round(operation.price * 100))));
    setEditFees(formatCurrencyInput(String(Math.round((operation.fees || 0) * 100))));
    setEditDate(formatDateBR(operation.date));
  };

  const saveEdit = async () => {
    if (!editing || saving) return;
    const quantity = Number(editQuantity.replace(',', '.'));
    const price = parseFormattedNumber(editPrice);
    const fees = parseFormattedNumber(editFees);
    const date = brazilianDateToISO(editDate);
    if (!Number.isFinite(quantity) || quantity <= 0 || price <= 0 || !date) {
      Alert.alert('Confira os dados', 'Use quantidade e preço válidos e data no formato DD/MM/AAAA.');
      return;
    }
    setSaving(true);
    try {
      await updateOperationAndPosition(editing.id, { quantity, price, fees, date });
      setEditing(null);
    } catch (error: any) {
      Alert.alert('Não foi possível editar', error?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const deleteOperation = (operation: Operation) => confirmAction(
    'Excluir movimento',
    `Excluir ${operation.type === 'buy' ? 'a compra' : 'a venda'} de ${operation.symbol}? A posição da carteira será recalculada.`,
    async () => {
      try { await removeOperationAndUpdatePosition(operation.id); }
      catch (error: any) { Alert.alert('Não foi possível excluir', error?.message || 'Tente novamente.'); }
    },
    { confirmLabel: 'Excluir', destructive: true },
  );

  // Agrupa operações por mês
  const monthsAvailable = useMemo(() => {
    const set = new Set<string>();
    operations.forEach((o) => set.add(o.date.slice(0, 7)));
    set.add(new Date().toISOString().slice(0, 7));
    return Array.from(set).sort().reverse();
  }, [operations]);

  const filteredOps = useMemo(
    () => operations.filter((o) => o.date.startsWith(filterMonth)),
    [operations, filterMonth],
  );

  // Cálculo para Isentômetro: total vendido em ações no mês selecionado
  const totalVendidoNoMes = useMemo(() => {
    return operations
      .filter(
        (o) =>
          o.type === 'sell' &&
          o.assetType === 'acao' &&
          o.date.startsWith(filterMonth),
      )
      .reduce((s, o) => s + o.quantity * o.price, 0);
  }, [operations, filterMonth]);

  // Lucro por tipo no mês
  const summary = useMemo(() => {
    const result = {
      acao: { lucro: 0, vendido: 0 },
      fii: { lucro: 0, vendido: 0 },
      daytrade: { lucro: 0, vendido: 0 },
      etf: { lucro: 0, vendido: 0 },
    };
    // Pra cada venda, calcula lucro simplificado (assumindo PM nominal igual ao preço)
    // OBS: lucro real precisaria do preço médio histórico — aqui usamos só vendas
    filteredOps.forEach((o) => {
      if (o.type !== 'sell') return;
      const key = o.assetType;
      result[key].vendido += o.quantity * o.price;
    });
    return result;
  }, [filteredOps]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => safeBackToCarteira(navigation)}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operações</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openOperation} accessibilityRole="button" accessibilityLabel="Adicionar operação">
          <Ionicons name="add" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Selector de mês */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthRow}>
          {monthsAvailable.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.monthChip, filterMonth === m && styles.monthChipActive]}
              onPress={() => setFilterMonth(m)}
            >
              <Text
                style={[
                  styles.monthChipText,
                  filterMonth === m && styles.monthChipTextActive,
                ]}
              >
                {formatMonthBR(m)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Isentômetro */}
        <Isentometro totalVendidoNoMes={totalVendidoNoMes} privacyMode={privacyMode} />

        {/* Resumo por categoria */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.summaryTitle}>Resumo do mês</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Swing-trade</Text>
              <Text style={styles.summaryValue}>{fmtBRL(summary.acao.vendido, privacyMode)}</Text>
              <Text style={styles.summarySub}>vendido</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>Day-trade</Text>
              <Text style={styles.summaryValue}>{fmtBRL(summary.daytrade.vendido, privacyMode)}</Text>
              <Text style={styles.summarySub}>vendido</Text>
            </View>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>FII / ETF</Text>
              <Text style={styles.summaryValue}>
                {fmtBRL(summary.fii.vendido + summary.etf.vendido, privacyMode)}
              </Text>
              <View style={styles.fiiBadge}>
                <Text style={styles.fiiBadgeText}>sem isenção na venda</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Lista de operações */}
        <Text style={styles.sectionTitle}>Operações do mês ({filteredOps.length})</Text>

        {filteredOps.length === 0 ? (
          <EditorialState kind="empty" title="Nenhuma operação neste mês" detail="Registre suas compras e vendas para acompanhar a carteira e o imposto sem retrabalho." action={{ label: 'Adicionar operação', onPress: openOperation }} />
        ) : (
          filteredOps.map((op) => (
            <Card key={op.id} style={styles.opCard}>
              <View style={styles.opRow}>
                <View style={[styles.typeIcon, op.type === 'buy' ? styles.buyIcon : styles.sellIcon]}>
                  <Ionicons
                    name={op.type === 'buy' ? 'arrow-down' : 'arrow-up'}
                    size={16}
                    color={colors.textLight}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={styles.opTitleRow}>
                    <Text style={styles.opSymbol}>{op.symbol}</Text>
                    <View style={styles.assetTypeBadge}>
                      <Text style={styles.assetTypeText}>{labelAssetType(op.assetType)}</Text>
                    </View>
                  </View>
                  <Text style={styles.opMeta}>
                    {op.quantity} × {fmtBRL(op.price, privacyMode)} · {formatDateBR(op.date)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.opTotal,
                      { color: op.type === 'sell' ? colors.success : colors.text },
                    ]}
                  >
                    {fmtBRL(op.quantity * op.price, privacyMode)}
                  </Text>
                  <Text style={styles.syncedLabel}>SINCRONIZADA</Text>
                </View>
              </View>
              <View style={styles.opActions}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Editar movimento" onPress={() => openEdit(op)} style={styles.opAction}><Ionicons name="create-outline" size={17} color={colors.primary} /><Text style={styles.opActionText}>Editar</Text></TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="Excluir movimento" onPress={() => deleteOperation(op)} style={styles.opAction}><Ionicons name="trash-outline" size={17} color={colors.danger} /><Text style={[styles.opActionText, { color: colors.danger }]}>Excluir</Text></TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={editing !== null} transparent animationType="slide" onRequestClose={() => !saving && setEditing(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => !saving && setEditing(null)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Editar movimento</Text>
            <Text style={styles.modalSub}>{editing?.symbol} · {editing?.type === 'buy' ? 'Compra' : 'Venda'}</Text>
            <Text style={styles.inputLabel}>Quantidade</Text>
            <TextInput style={styles.input} value={editQuantity} onChangeText={setEditQuantity} keyboardType="decimal-pad" editable={!saving} />
            <Text style={styles.inputLabel}>Preço unitário</Text>
            <TextInput style={styles.input} value={editPrice} onChangeText={(value) => setEditPrice(formatCurrencyInput(value))} keyboardType="decimal-pad" editable={!saving} />
            <Text style={styles.inputLabel}>Custos e taxas</Text>
            <TextInput style={styles.input} value={editFees} onChangeText={(value) => setEditFees(formatCurrencyInput(value))} keyboardType="decimal-pad" editable={!saving} />
            <Text style={styles.inputLabel}>Data</Text>
            <TextInput style={styles.input} value={editDate} onChangeText={(value) => setEditDate(formatBrazilianDateInput(value))} keyboardType="number-pad" placeholder="DD/MM/AAAA" editable={!saving} />
            <View style={styles.modalActions}><Button title="Cancelar" variant="ghost" onPress={() => setEditing(null)} disabled={saving} style={{ flex: 1 }} /><Button title="Salvar alterações" onPress={saveEdit} loading={saving} style={{ flex: 1 }} /></View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  );
}

function formatMonthBR(yyyyMM: string): string {
  const [y, m] = yyyyMM.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

function formatDateBR(yyyyMMdd: string): string {
  const [y, m, d] = yyyyMMdd.split('-');
  return `${d}/${m}/${y}`;
}

function labelAssetType(t: Operation['assetType']): string {
  return { acao: 'Ação', fii: 'FII', etf: 'ETF', daytrade: 'Day-trade' }[t];
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: editorial.color.canvas },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  headerTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  addBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  monthRow: { marginBottom: spacing.md, marginHorizontal: -spacing.md, paddingHorizontal: spacing.md },
  monthChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  monthChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthChipText: { color: colors.textSecondary, fontWeight: '600', fontSize: fontSize.small },
  monthChipTextActive: { color: colors.textLight },

  summaryTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCol: { flex: 1 },
  summaryLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase' },
  summaryValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  summarySub: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  fiiBadge: { backgroundColor: colors.successLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.pill, alignSelf: 'flex-start', marginTop: 4 },
  fiiBadgeText: { fontSize: fontSize.tiny, color: colors.success, fontWeight: '700' },

  sectionTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },

  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 20 },
  emptyBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  emptyBtnText: { color: colors.textLight, fontWeight: '600' },

  opCard: { marginBottom: spacing.sm },
  opRow: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  buyIcon: { backgroundColor: colors.success },
  sellIcon: { backgroundColor: colors.danger },
  opTitleRow: { flexDirection: 'row', alignItems: 'center' },
  opSymbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginRight: spacing.sm },
  assetTypeBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill },
  assetTypeText: { fontSize: fontSize.tiny, color: colors.primary, fontWeight: '700' },
  opMeta: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  opTotal: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  syncedLabel: { marginTop: 5, color: colors.success, fontSize: fontSize.tiny, fontWeight: '800', letterSpacing: 0.5 },
  opActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider },
  opAction: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.sm },
  opActionText: { color: colors.primary, fontSize: fontSize.small, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: editorial.color.scrim },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, paddingBottom: spacing.xxl, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: fontSize.title, fontWeight: '800' },
  modalSub: { color: colors.textSecondary, marginTop: 3, marginBottom: spacing.md },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.small, fontWeight: '700', marginTop: spacing.sm, marginBottom: 5 },
  input: { minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background, color: colors.text, paddingHorizontal: spacing.md, fontSize: fontSize.body },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
});
