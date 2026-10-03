import { useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { searchTickers, searchTickersAsync, TickerInfo, TICKERS } from '../data/tickers';
import { fetchQuotes } from '../api/brapi';
import { fmtBRL } from '../utils/format';
const { submitOperationWithDeadline } = require('../utils/operationSubmission');
const { formatBrazilianDateInput, brazilianDateToISO, todayBrazilian } = require('../utils/dateInput');

type Side = 'buy' | 'sell';
type AssetKind = 'acao' | 'fii' | 'etf' | 'daytrade';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDone?: () => void;
};

export default function NewOperationModal({ visible, onClose, onDone }: Props) {
  const { activeWallet, ensureActiveWallet, recordOperationAndUpdatePosition } = useApp();
  const [side, setSide] = useState<Side>('buy');
  const [assetKind, setAssetKind] = useState<AssetKind>('acao');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayBrazilian());
  const [fees, setFees] = useState('');
  const [withholdingTax, setWithholdingTax] = useState('');
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientRequestId, setClientRequestId] = useState(() => createClientRequestId());
  const [requestLocked, setRequestLocked] = useState(false);

  const reset = () => {
    setSide('buy');
    setAssetKind('acao');
    setSymbol('');
    setQuantity('');
    setPrice('');
    setDate(todayBrazilian());
    setFees('');
    setWithholdingTax('');
    setLivePrice(null);
    setSubmitError(null);
    setClientRequestId(createClientRequestId());
    setRequestLocked(false);
  };

  useEffect(() => {
    if (!visible || requestLocked) return;
    reset();
  }, [visible, requestLocked]);

  const [suggestions, setSuggestions] = useState<TickerInfo[]>([]);

  useEffect(() => {
    if (assetKind === 'daytrade') { setSuggestions([]); return; }
    const local = searchTickers(symbol, 5);
    const filter = (arr: TickerInfo[]) => {
      if (assetKind === 'acao' || assetKind === 'fii' || assetKind === 'etf') {
        return arr.filter((t) => t.type === assetKind);
      }
      return arr;
    };
    setSuggestions(filter(local));
    if (symbol.trim().length >= 2) {
      let cancelled = false;
      searchTickersAsync(symbol, 10).then((all) => {
        if (cancelled) return;
        setSuggestions(filter(all));
      }).catch(() => { if (!cancelled) setSuggestions(filter(local)); });
      return () => { cancelled = true; };
    }
  }, [symbol, assetKind]);

  // Auto preço quando ticker bate exato com brapi
  useEffect(() => {
    const clean = symbol.trim().toUpperCase();
    if (clean.length < 4) {
      setLivePrice(null);
      return;
    }
    let cancelled = false;
    fetchQuotes([clean]).then((qs) => {
      if (cancelled) return;
      setLivePrice(qs[0]?.regularMarketPrice ?? null);
    }).catch(() => { if (!cancelled) setLivePrice(null); });
    return () => { cancelled = true; };
  }, [symbol]);

  const useMarketPrice = () => {
    if (livePrice != null) {
      setPrice(formatCurrencyInput(String(Math.round(livePrice * 100))));
    }
  };

  const handleSave = async () => {
    const sym = symbol.trim().toUpperCase();
    const qty = parseFloat(quantity.replace(',', '.'));
    const pr = parseFormattedNumber(price);
    const operationFees = parseFormattedNumber(fees);
    const operationWithholding = parseFormattedNumber(withholdingTax);

    if (!sym || sym.length < 3) { Alert.alert('Atenção', 'Digite um ticker válido.'); return; }
    if (!isFinite(qty) || qty <= 0) { Alert.alert('Atenção', 'Quantidade inválida.'); return; }
    if (!isFinite(pr) || pr <= 0) { Alert.alert('Atenção', 'Preço inválido.'); return; }
    const isoDate = brazilianDateToISO(date);
    if (!isoDate) { Alert.alert('Atenção', 'Use uma data válida no formato DD/MM/AAAA.'); return; }
    setSubmitError(null);
    setSaving(true);
    let mutationStarted = false;
    try {
      const targetWallet = activeWallet && !activeWallet.readOnly ? activeWallet : await ensureActiveWallet();
      const existing = targetWallet.assets.find((a) => a.symbol === sym);
      if (assetKind !== 'daytrade' && side === 'sell' && !existing) {
        throw new Error(`Você não possui ${sym} nesta carteira.`);
      }
      if (assetKind !== 'daytrade' && side === 'sell' && existing && qty > existing.quantity) {
        throw new Error(`A venda excede sua posição atual de ${existing.quantity} unidades.`);
      }
      const payloadHash = JSON.stringify({ walletId: targetWallet.id, side, assetKind, sym, qty, pr, operationFees, operationWithholding, isoDate });
      const info = TICKERS.find((t) => t.symbol === sym);
      setRequestLocked(true);
      mutationStarted = true;
      await submitOperationWithDeadline(() => recordOperationAndUpdatePosition({
          clientRequestId,
          payloadHash,
          walletId: targetWallet.id,
          type: side,
          symbol: sym,
          assetType: assetKind,
          quantity: qty,
          price: pr,
          fees: operationFees,
          withholdingTax: operationWithholding,
          date: isoDate,
          name: info?.name || sym,
      }));

      onDone?.();
      reset();
      onClose();
    } catch (e: any) {
      if (!mutationStarted) setRequestLocked(false);
      setSubmitError(e?.message || 'Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={styles.root}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Nova operação</Text>
          <View style={{ width: 26 }} />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Compra / Venda toggle */}
            <View style={styles.sideRow}>
              <TouchableOpacity
                style={[styles.sideBtn, side === 'buy' && styles.sideBuyActive]}
                onPress={() => setSide('buy')}
                disabled={requestLocked}
              >
                <Ionicons name="arrow-down" size={18} color={side === 'buy' ? colors.textLight : colors.success} />
                <Text style={[styles.sideText, side === 'buy' && styles.sideTextActive]}>Compra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sideBtn, side === 'sell' && styles.sideSellActive]}
                onPress={() => setSide('sell')}
                disabled={requestLocked}
              >
                <Ionicons name="arrow-up" size={18} color={side === 'sell' ? colors.textLight : colors.danger} />
                <Text style={[styles.sideText, side === 'sell' && styles.sideTextActive]}>Venda</Text>
              </TouchableOpacity>
            </View>

            {/* Tipo de ativo */}
            <Text style={styles.label}>Tipo de ativo</Text>
            <View style={styles.kindRow}>
              {(['acao', 'fii', 'etf', 'daytrade'] as AssetKind[]).map((k) => (
                <TouchableOpacity
                  key={k}
                  style={[styles.kindChip, assetKind === k && styles.kindChipActive]}
                  onPress={() => setAssetKind(k)}
                  disabled={requestLocked}
                >
                  <Text style={[styles.kindText, assetKind === k && styles.kindTextActive]}>
                    {k === 'acao' ? 'Ação' : k === 'fii' ? 'FII' : k === 'etf' ? 'ETF' : 'Day-trade'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Ticker */}
            <Text style={styles.label}>Ticker</Text>
            <TextInput
              style={styles.input}
              placeholder="PETR4, MXRF11..."
              value={symbol}
              onChangeText={(t) => setSymbol(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!requestLocked}
            />
            {suggestions.length > 0 && !TICKERS.find((t) => t.symbol === symbol.trim().toUpperCase()) && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
                {suggestions.map((s) => (
                  <TouchableOpacity key={s.symbol} style={styles.suggChip} onPress={() => setSymbol(s.symbol)} disabled={requestLocked}>
                    <Text style={styles.suggText}>{s.symbol}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Quantidade */}
            <Text style={styles.label}>Quantidade</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              editable={!requestLocked}
            />

            {/* Preço */}
            <Text style={styles.label}>Preço unitário (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              value={price}
              onChangeText={(t) => setPrice(formatCurrencyInput(t))}
              keyboardType="decimal-pad"
              editable={!requestLocked}
            />
            {livePrice != null && (
              <TouchableOpacity onPress={useMarketPrice} style={styles.usePriceRow} disabled={requestLocked}>
                <Ionicons name="cash-outline" size={14} color={colors.primary} />
                <Text style={styles.usePriceText}>Usar cotação atual: {fmtBRL(livePrice)}</Text>
              </TouchableOpacity>
            )}

            {/* Data */}
            <Text style={styles.label}>Data</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              value={date}
              onChangeText={(value) => setDate(formatBrazilianDateInput(value))}
              keyboardType="number-pad"
              autoCapitalize="none"
              editable={!requestLocked}
            />

            <Text style={styles.label}>Custos e taxas (R$)</Text>
            <TextInput style={styles.input} placeholder="0,00" value={fees} onChangeText={(t) => setFees(formatCurrencyInput(t))} keyboardType="decimal-pad" editable={!requestLocked} />

            {side === 'sell' ? <>
              <Text style={styles.label}>IR retido na fonte (R$)</Text>
              <TextInput style={styles.input} placeholder="0,00" value={withholdingTax} onChangeText={(t) => setWithholdingTax(formatCurrencyInput(t))} keyboardType="decimal-pad" editable={!requestLocked} />
            </> : null}

            <View style={styles.preview}>
              <Text style={styles.previewLabel}>VALOR DA OPERAÇÃO</Text>
              <Text style={styles.previewValue}>{qtyPreview(quantity, price)}</Text>
              <Text style={styles.previewDetail}>A operação também atualiza sua posição na carteira.</Text>
            </View>

            {submitError ? <View style={styles.errorBox}><Ionicons name="alert-circle" size={18} color={colors.danger} /><Text style={styles.errorText}>{submitError}</Text></View> : null}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : submitError && requestLocked ? 'Confirmar novamente' : 'Salvar operação'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.surface },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  scroll: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxl },
  sideRow: { flexDirection: 'row', gap: spacing.md as any, marginBottom: spacing.lg },
  sideBtn: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  sideBuyActive: { backgroundColor: colors.success, borderColor: colors.success },
  sideSellActive: { backgroundColor: colors.danger, borderColor: colors.danger },
  sideText: { fontWeight: '800', color: colors.text, marginLeft: 6 },
  sideTextActive: { color: colors.textLight },
  label: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginTop: spacing.md, marginBottom: 6 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap' },
  kindChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, marginRight: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  kindChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  kindText: { color: colors.text, fontWeight: '600' },
  kindTextActive: { color: colors.textLight, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, fontSize: fontSize.bodyLarge, color: colors.text, backgroundColor: colors.surface },
  suggChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primaryLight, marginRight: spacing.sm },
  suggText: { color: colors.primary, fontWeight: '700' },
  usePriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.primaryLight, borderRadius: radius.md, alignSelf: 'flex-start' },
  usePriceText: { color: colors.primary, fontWeight: '700', marginLeft: 4, fontSize: fontSize.small },
  preview: { marginTop: spacing.lg, padding: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  previewLabel: { color: colors.textSecondary, fontSize: fontSize.tiny, fontWeight: '900', letterSpacing: 1.2 },
  previewValue: { color: colors.text, fontSize: fontSize.heading, fontWeight: '900', marginTop: 4 },
  previewDetail: { color: colors.textSecondary, fontSize: fontSize.small, marginTop: 6 },
  errorBox: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, marginTop: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerLight },
  errorText: { color: colors.danger, flex: 1, fontWeight: '700' },
  saveBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', minHeight: 54, justifyContent: 'center' },
  saveBtnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.bodyLarge },
});

function qtyPreview(quantity: string, price: string): string {
  const qty = Number(quantity.replace(',', '.'));
  const value = parseFormattedNumber(price);
  return Number.isFinite(qty) && qty > 0 && value > 0 ? fmtBRL(qty * value) : 'R$ 0,00';
}

function createClientRequestId(): string {
  const cryptoApi = (globalThis as any).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });
}
