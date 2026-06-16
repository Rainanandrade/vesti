import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { searchTickers, TICKERS } from '../data/tickers';
import { confirmAction } from '../utils/confirm';
import Card from '../components/Card';
import Button from '../components/Button';
import Isentometro from '../components/Isentometro';

export default function OperacoesScreen({ navigation }: any) {
  const { operations, addOperation, removeOperation, privacyMode } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [type, setType] = useState<Operation['type']>('sell');
  const [assetType, setAssetType] = useState<Operation['assetType']>('acao');
  const [symbol, setSymbol] = useState('');
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

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

  const suggestions = search ? searchTickers(search, 6) : [];

  const handleAdd = async () => {
    const qty = parseFloat(quantity.replace(',', '.'));
    const pr = parseFormattedNumber(price);
    if (!symbol.trim()) return Alert.alert('Atenção', 'Informe o ticker');
    if (!isFinite(qty) || qty <= 0) return Alert.alert('Atenção', 'Quantidade inválida');
    if (!isFinite(pr) || pr <= 0) return Alert.alert('Atenção', 'Preço inválido');
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) return Alert.alert('Atenção', 'Data inválida (AAAA-MM-DD)');

    setSaving(true);
    try {
      await addOperation({
        type,
        symbol: symbol.trim().toUpperCase(),
        assetType,
        quantity: qty,
        price: pr,
        date,
      });
      setAddOpen(false);
      setSymbol('');
      setSearch('');
      setQuantity('');
      setPrice('');
      setDate(new Date().toISOString().slice(0, 10));
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (op: Operation) => {
    confirmAction(
      'Remover operação',
      `Remover ${op.type === 'buy' ? 'compra' : 'venda'} de ${op.symbol}?`,
      () => removeOperation(op.id),
      { confirmLabel: 'Remover', destructive: true },
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operações</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
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
                <Text style={styles.fiiBadgeText}>FII isento</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Lista de operações */}
        <Text style={styles.sectionTitle}>Operações do mês ({filteredOps.length})</Text>

        {filteredOps.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Nenhuma operação neste mês</Text>
            <Text style={styles.emptyDesc}>
              Registre suas compras e vendas pra calcular o IR correto e acompanhar o isentômetro.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setAddOpen(true)}>
              <Text style={styles.emptyBtnText}>+ Adicionar operação</Text>
            </TouchableOpacity>
          </View>
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
                  <TouchableOpacity onPress={() => handleRemove(op)} style={{ marginTop: 4 }}>
                    <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal adicionar operação */}
      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setAddOpen(false)} hitSlop={10}>
                <Ionicons name="close" size={26} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nova operação</Text>
              <View style={{ width: 26 }} />
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {/* Tipo: compra/venda */}
              <View style={styles.bigToggle}>
                <TouchableOpacity
                  style={[styles.bigToggleBtn, type === 'buy' && styles.bigToggleBtnBuy]}
                  onPress={() => setType('buy')}
                >
                  <Ionicons name="arrow-down" size={18} color={type === 'buy' ? colors.textLight : colors.success} />
                  <Text style={[styles.bigToggleText, type === 'buy' && { color: colors.textLight }]}>Compra</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bigToggleBtn, type === 'sell' && styles.bigToggleBtnSell]}
                  onPress={() => setType('sell')}
                >
                  <Ionicons name="arrow-up" size={18} color={type === 'sell' ? colors.textLight : colors.danger} />
                  <Text style={[styles.bigToggleText, type === 'sell' && { color: colors.textLight }]}>Venda</Text>
                </TouchableOpacity>
              </View>

              {/* Tipo de ativo */}
              <Text style={styles.label}>Tipo de ativo</Text>
              <View style={styles.assetTypeRow}>
                {(['acao', 'fii', 'etf', 'daytrade'] as const).map((at) => (
                  <TouchableOpacity
                    key={at}
                    style={[styles.assetTypeChip, assetType === at && styles.assetTypeChipActive]}
                    onPress={() => setAssetType(at)}
                  >
                    <Text
                      style={[
                        styles.assetTypeChipText,
                        assetType === at && styles.assetTypeChipTextActive,
                      ]}
                    >
                      {labelAssetType(at)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Ticker com busca */}
              <Text style={styles.label}>Ticker</Text>
              <TextInput
                style={styles.input}
                value={symbol || search}
                onChangeText={(t) => {
                  const v = t.toUpperCase();
                  setSearch(v);
                  setSymbol(v);
                }}
                placeholder="PETR4, MXRF11..."
                autoCapitalize="characters"
              />
              {suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                  {suggestions.map((s) => (
                    <TouchableOpacity
                      key={s.symbol}
                      style={styles.suggItem}
                      onPress={() => {
                        setSymbol(s.symbol);
                        setSearch('');
                      }}
                    >
                      <Text style={styles.suggSym}>{s.symbol}</Text>
                      <Text style={styles.suggName}>{s.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Quantidade</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="100"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Preço unitário (R$)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={(t) => setPrice(formatCurrencyInput(t))}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Data</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="AAAA-MM-DD"
                autoCapitalize="none"
              />

              {parseFloat(quantity.replace(',', '.')) > 0 && parseFormattedNumber(price) > 0 && (
                <View style={styles.totalPreview}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>
                    {fmtBRL(
                      parseFloat(quantity.replace(',', '.')) * parseFormattedNumber(price),
                    )}
                  </Text>
                </View>
              )}

              <Button title="Salvar operação" onPress={handleAdd} loading={saving} style={{ marginTop: spacing.lg }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: colors.surface },
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

  // Modal
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  modalTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  modalScroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  bigToggle: { flexDirection: 'row', marginBottom: spacing.md },
  bigToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
    borderRadius: radius.md,
  },
  bigToggleBtnBuy: { backgroundColor: colors.success, borderColor: colors.success },
  bigToggleBtnSell: { backgroundColor: colors.danger, borderColor: colors.danger },
  bigToggleText: { fontWeight: '700', marginLeft: 6, color: colors.text },

  label: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
  },

  assetTypeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  assetTypeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  assetTypeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  assetTypeChipText: { color: colors.text, fontWeight: '600' },
  assetTypeChipTextActive: { color: colors.textLight },

  suggestionsBox: { marginTop: 4, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  suggItem: { padding: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  suggSym: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.primary },
  suggName: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },

  totalPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md },
  totalLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
});
