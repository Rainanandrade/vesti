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
import { useApp, Asset } from '../context/AppContext';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { searchTickers, TickerInfo, TICKERS } from '../data/tickers';
import { fetchQuotes } from '../api/brapi';
import { fmtBRL } from '../utils/format';

type Side = 'buy' | 'sell';
type AssetKind = 'acao' | 'fii' | 'etf' | 'daytrade';

type Props = {
  visible: boolean;
  onClose: () => void;
  onDone?: () => void;
};

export default function NewOperationModal({ visible, onClose, onDone }: Props) {
  const { activeWallet, addOperation, addAsset, removeAsset } = useApp();
  const [side, setSide] = useState<Side>('buy');
  const [assetKind, setAssetKind] = useState<AssetKind>('acao');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setSide('buy');
    setAssetKind('acao');
    setSymbol('');
    setQuantity('');
    setPrice('');
    setDate(new Date().toISOString().slice(0, 10));
    setLivePrice(null);
  };

  useEffect(() => {
    if (!visible) return;
    reset();
  }, [visible]);

  const suggestions = useMemo<TickerInfo[]>(() => {
    if (assetKind === 'daytrade') return [];
    const all = searchTickers(symbol, 5);
    const kind = assetKind;
    if (kind === 'acao' || kind === 'fii' || kind === 'etf') return all.filter((t) => t.type === kind);
    return all;
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
    });
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

    if (!sym || sym.length < 3) { Alert.alert('Atenção', 'Digite um ticker válido.'); return; }
    if (!isFinite(qty) || qty <= 0) { Alert.alert('Atenção', 'Quantidade inválida.'); return; }
    if (!isFinite(pr) || pr <= 0) { Alert.alert('Atenção', 'Preço inválido.'); return; }
    if (!activeWallet) { Alert.alert('Erro', 'Nenhuma carteira ativa.'); return; }

    setSaving(true);
    try {
      // 1) Registra a operação no ledger
      await addOperation({
        type: side,
        symbol: sym,
        assetType: assetKind,
        quantity: qty,
        price: pr,
        date,
      });

      // 2) Reflete na carteira
      if (side === 'buy') {
        // Tenta achar nome bonito
        const info = TICKERS.find((t) => t.symbol === sym);
        const assetType = assetKind === 'daytrade' ? 'acao' : assetKind;
        await addAsset(activeWallet.id, {
          symbol: sym,
          name: info?.name || sym,
          type: assetType as Asset['type'],
          quantity: qty,
          avgPrice: pr,
          addedAt: Date.now(),
        });
      } else {
        // Venda: subtrai quantidade do ativo se existir
        const existing = activeWallet.assets.find((a) => a.symbol === sym);
        if (existing) {
          const remaining = existing.quantity - qty;
          if (remaining <= 0) {
            await removeAsset(activeWallet.id, sym);
          } else {
            // Mantém preço médio, reduz qty — addAsset com qty negativa não dá, então:
            // estratégia simples: re-cria o asset com nova quantidade
            await removeAsset(activeWallet.id, sym);
            await addAsset(activeWallet.id, {
              symbol: sym,
              name: existing.name,
              type: existing.type,
              quantity: remaining,
              avgPrice: existing.avgPrice,
              addedAt: existing.addedAt,
            });
          }
        }
      }

      onDone?.();
      onClose();
    } catch (e: any) {
      Alert.alert('Não foi possível salvar', e?.message || 'Tente novamente.');
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
              >
                <Ionicons name="arrow-down" size={18} color={side === 'buy' ? colors.textLight : colors.success} />
                <Text style={[styles.sideText, side === 'buy' && styles.sideTextActive]}>Compra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sideBtn, side === 'sell' && styles.sideSellActive]}
                onPress={() => setSide('sell')}
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
            />
            {suggestions.length > 0 && !TICKERS.find((t) => t.symbol === symbol.trim().toUpperCase()) && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.xs }}>
                {suggestions.map((s) => (
                  <TouchableOpacity key={s.symbol} style={styles.suggChip} onPress={() => setSymbol(s.symbol)}>
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
            />

            {/* Preço */}
            <Text style={styles.label}>Preço unitário (R$)</Text>
            <TextInput
              style={styles.input}
              placeholder="0,00"
              value={price}
              onChangeText={(t) => setPrice(formatCurrencyInput(t))}
              keyboardType="decimal-pad"
            />
            {livePrice != null && (
              <TouchableOpacity onPress={useMarketPrice} style={styles.usePriceRow}>
                <Ionicons name="cash-outline" size={14} color={colors.primary} />
                <Text style={styles.usePriceText}>Usar cotação atual: {fmtBRL(livePrice)}</Text>
              </TouchableOpacity>
            )}

            {/* Data */}
            <Text style={styles.label}>Data</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              value={date}
              onChangeText={setDate}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar operação'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sideRow: { flexDirection: 'row', gap: spacing.md as any, marginBottom: spacing.lg },
  sideBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
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
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: fontSize.bodyLarge, color: colors.text, backgroundColor: colors.background },
  suggChip: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.primaryLight, marginRight: spacing.sm },
  suggText: { color: colors.primary, fontWeight: '700' },
  usePriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, padding: spacing.sm, backgroundColor: colors.primaryLight, borderRadius: radius.md, alignSelf: 'flex-start' },
  usePriceText: { color: colors.primary, fontWeight: '700', marginLeft: 4, fontSize: fontSize.small },
  saveBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  saveBtnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.bodyLarge },
});
