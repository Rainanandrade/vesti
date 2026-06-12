import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import Button from '../components/Button';
import AssetAnalysis from '../components/AssetAnalysis';
import { useApp, Asset } from '../context/AppContext';
import PriceChart from '../components/PriceChart';
import { searchTickers, TickerInfo, TICKERS } from '../data/tickers';
import { fetchQuotes } from '../api/brapi';
import { fetchAssetDetails, AssetDetails } from '../api/yahooDetails';
import { fmtBRL } from '../utils/format';

const TYPES: { value: Asset['type']; label: string; needsSymbol: boolean }[] = [
  { value: 'acao', label: 'Ação', needsSymbol: true },
  { value: 'fii', label: 'FII', needsSymbol: true },
  { value: 'etf', label: 'ETF', needsSymbol: true },
  { value: 'tesouro', label: 'Tesouro', needsSymbol: false },
  { value: 'cdb', label: 'CDB', needsSymbol: false },
  { value: 'outro', label: 'Outro', needsSymbol: false },
];

export default function AddAssetScreen({ navigation, route }: any) {
  const { activeWallet, addAsset, profile } = useApp();
  const prefill = route?.params?.prefill;
  const [type, setType] = useState<Asset['type']>(prefill?.type || 'acao');
  const [symbol, setSymbol] = useState(prefill?.symbol || '');
  const [name, setName] = useState(prefill?.name || '');
  const [quantity, setQuantity] = useState(prefill?.quantity?.toString() || '');
  const [price, setPrice] = useState(prefill?.price?.toString().replace('.', ',') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);

  const typeMeta = TYPES.find((t) => t.value === type)!;
  const selectedTicker = useMemo<TickerInfo | null>(() => {
    const clean = symbol.trim().toUpperCase();
    if (!typeMeta.needsSymbol || clean.length < 4) return null;
    return TICKERS.find((t) => t.symbol === clean) || null;
  }, [symbol, typeMeta.needsSymbol]);

  const suggestions = useMemo(() => {
    if (!typeMeta.needsSymbol) return [];
    const filtered = searchTickers(symbol, 8);
    if (type === 'acao') return filtered.filter((t) => t.type === 'acao');
    if (type === 'fii') return filtered.filter((t) => t.type === 'fii');
    if (type === 'etf') return filtered.filter((t) => t.type === 'etf');
    return filtered;
  }, [symbol, type, typeMeta.needsSymbol]);

  // Busca cotação ao vivo + detalhes
  useEffect(() => {
    if (!selectedTicker) {
      setLivePrice(null);
      setDetails(null);
      return;
    }
    let cancelled = false;
    setLoadingPrice(true);
    setLoadingDetails(true);
    fetchQuotes([selectedTicker.symbol]).then((q) => {
      if (cancelled) return;
      setLivePrice(q[0]?.regularMarketPrice ?? null);
      setLoadingPrice(false);
    });
    fetchAssetDetails(selectedTicker.symbol).then((d) => {
      if (cancelled) return;
      setDetails(d);
      setLoadingDetails(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedTicker]);

  const handlePickSuggestion = (t: TickerInfo) => {
    setSymbol(t.symbol);
    setName(t.name);
    setShowSuggestions(false);
  };

  const useLivePrice = () => {
    if (livePrice !== null) setPrice(livePrice.toFixed(2).replace('.', ','));
  };

  const handleSave = async () => {
    const qty = parseFloat(quantity.replace(',', '.'));
    const pr = parseFloat(price.replace(',', '.'));
    if (typeMeta.needsSymbol && symbol.trim().length < 3) {
      Alert.alert('Atenção', 'Digite o código do ativo (ex: PETR4)');
      return;
    }
    if (!typeMeta.needsSymbol && name.trim().length < 2) {
      Alert.alert('Atenção', 'Digite o nome do investimento');
      return;
    }
    if (!isFinite(qty) || qty <= 0) {
      Alert.alert('Atenção', 'Quantidade inválida');
      return;
    }
    if (!isFinite(pr) || pr <= 0) {
      Alert.alert('Atenção', 'Preço médio inválido');
      return;
    }
    if (!activeWallet) {
      Alert.alert('Erro', 'Nenhuma carteira ativa');
      return;
    }

    const finalSymbol = typeMeta.needsSymbol ? symbol.trim().toUpperCase() : name.trim();
    const finalName = name.trim() || finalSymbol;

    setSaving(true);
    try {
      await addAsset(activeWallet.id, {
        symbol: finalSymbol,
        name: finalName,
        type,
        quantity: qty,
        avgPrice: pr,
        addedAt: Date.now(),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Não foi possível salvar', e?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Adicionar ativo</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeRow}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                onPress={() => {
                  setType(t.value);
                  setSymbol('');
                  setDetails(null);
                  setLivePrice(null);
                }}
              >
                <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {typeMeta.needsSymbol ? (
            <>
              <Text style={styles.label}>Código (ticker)</Text>
              <TextInput
                style={styles.input}
                placeholder="Digite PETR, MXRF, BOVA..."
                value={symbol}
                onChangeText={(t) => {
                  setSymbol(t.toUpperCase());
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              {showSuggestions && suggestions.length > 0 && !selectedTicker && (
                <View style={styles.suggestionsBox}>
                  {suggestions.map((t) => (
                    <TouchableOpacity
                      key={t.symbol}
                      style={styles.suggestionItem}
                      onPress={() => handlePickSuggestion(t)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggSymbol}>{t.symbol}</Text>
                        <Text style={styles.suggName}>{t.name}</Text>
                      </View>
                      <View style={[styles.suggTypeBadge, badgeColor(t.type)]}>
                        <Text style={styles.suggTypeText}>{labelOf(t.type)}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Live price */}
              {selectedTicker && (
                <View style={styles.livePriceBox}>
                  {loadingPrice ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : livePrice !== null ? (
                    <>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.livePriceLabel}>Cotação ao vivo</Text>
                        <Text style={styles.livePriceValue}>{fmtBRL(livePrice)}</Text>
                      </View>
                      <TouchableOpacity style={styles.usePriceBtn} onPress={useLivePrice}>
                        <Text style={styles.usePriceText}>Usar este preço</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.livePriceUnknown}>Cotação indisponível.</Text>
                  )}
                </View>
              )}

              {/* Gráfico histórico */}
              {selectedTicker && (
                <View style={{ marginTop: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg }}>
                  <PriceChart symbol={selectedTicker.symbol} />
                </View>
              )}

              {/* Análise */}
              {selectedTicker && profile && (
                <AssetAnalysis
                  ticker={selectedTicker}
                  details={details}
                  loading={loadingDetails}
                  profile={profile}
                />
              )}
            </>
          ) : (
            <>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Tesouro IPCA+ 2035"
                value={name}
                onChangeText={setName}
              />
            </>
          )}

          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            placeholder="100"
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />
          <Text style={styles.helper}>Pra Tesouro/CDB, use 1 e coloque o valor total no preço médio</Text>

          <Text style={styles.label}>Preço médio (R$)</Text>
          <TextInput
            style={styles.input}
            placeholder="35,50"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Button title="Salvar ativo" onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function labelOf(t: TickerInfo['type']): string {
  return { acao: 'Ação', fii: 'FII', etf: 'ETF' }[t];
}

function badgeColor(t: TickerInfo['type']) {
  return {
    acao: { backgroundColor: colors.primaryLight },
    fii: { backgroundColor: colors.warningLight },
    etf: { backgroundColor: colors.successLight },
  }[t];
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
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  label: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.md, marginBottom: 6 },
  helper: { fontSize: fontSize.small, color: colors.textTertiary, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  typeChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { color: colors.textSecondary, fontWeight: '500' },
  typeChipTextActive: { color: colors.textLight, fontWeight: '600' },

  suggestionsBox: {
    marginTop: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  suggSymbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  suggName: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  suggTypeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  suggTypeText: { fontSize: fontSize.tiny, fontWeight: '700', color: colors.text },

  livePriceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  livePriceLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  livePriceValue: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, marginTop: 2 },
  livePriceUnknown: { fontSize: fontSize.body, color: colors.textSecondary },
  usePriceBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
  },
  usePriceText: { color: colors.textLight, fontWeight: '600', fontSize: fontSize.small },
});
