import { useState } from 'react';
import {
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
import { useApp } from '../context/AppContext';
import PriceChart from '../components/PriceChart';
import AssetAnalysis from '../components/AssetAnalysis';
import { TICKERS } from '../data/tickers';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import { fetchAssetDetails, AssetDetails } from '../api/yahooDetails';
import { fetchQuotes, Quote } from '../api/brapi';
import { fetchDividendInfo, DividendInfo, formatNextPayment, frequencyLabel } from '../api/dividends';
import { useEffect } from 'react';
import { fmtBRL, fmtPct } from '../utils/format';
import Card from '../components/Card';

export default function EditAssetScreen({ navigation, route }: any) {
  const { activeWallet, updateAsset, removeAsset, profile, privacyMode } = useApp();
  const symbol: string = route?.params?.symbol;
  const asset = activeWallet?.assets.find((a) => a.symbol === symbol);
  // Pra TODOS os tradeables (ação/FII/ETF), criamos um TickerInfo "virtual" se
  // o ativo não estiver na nossa lista — assim charts e análises aparecem
  // mesmo pra tickers customizados que o usuário cadastrou
  const isTradeable = asset && (asset.type === 'acao' || asset.type === 'fii' || asset.type === 'etf');
  const tickerInfo = asset && isTradeable
    ? (TICKERS.find((t) => t.symbol === asset.symbol) || {
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type as 'acao' | 'fii' | 'etf',
      })
    : null;

  const [quantity, setQuantity] = useState(asset?.quantity.toString().replace('.', ',') || '');
  // Preço já vem formatado pra ter ponto de milhar + 2 casas decimais
  const [price, setPrice] = useState(
    asset ? formatCurrencyInput(Math.round(asset.avgPrice * 100).toString()) : '',
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [dividendInfo, setDividendInfo] = useState<DividendInfo | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!asset || !tickerInfo) return;
    let cancelled = false;
    setLoadingData(true);
    Promise.all([
      fetchQuotes([asset.symbol]),
      fetchAssetDetails(asset.symbol),
      fetchDividendInfo(asset.symbol),
    ]).then(([qs, d, dv]) => {
      if (cancelled) return;
      setQuote(qs[0] || null);
      setDetails(d);
      setDividendInfo(dv);
      setLoadingData(false);
    });
    return () => {
      cancelled = true;
    };
  }, [asset?.symbol, tickerInfo]);

  if (!asset || !activeWallet) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Editar</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ padding: spacing.lg }}>
          <Text style={styles.errorText}>Ativo não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    const qty = parseFloat(quantity.replace(',', '.'));
    const pr = parseFormattedNumber(price);
    if (!isFinite(qty) || qty <= 0) {
      Alert.alert('Atenção', 'Quantidade inválida');
      return;
    }
    if (!isFinite(pr) || pr <= 0) {
      Alert.alert('Atenção', 'Preço médio inválido');
      return;
    }
    setSaving(true);
    try {
      await updateAsset(activeWallet.id, asset.symbol, { quantity: qty, avgPrice: pr });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Não foi possível salvar', e?.message || 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Excluir posição',
      `Tem certeza que deseja remover ${asset.symbol} da carteira?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await removeAsset(activeWallet.id, asset.symbol);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Não foi possível excluir', e?.message || 'Tente novamente.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
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
          <Text style={styles.title}>Editar posição</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.assetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.symbol}>{asset.symbol}</Text>
                <Text style={styles.name}>{asset.name}</Text>
              </View>
              {quote && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.cotacaoLabel}>cotação</Text>
                  <Text style={styles.cotacaoValue}>{fmtBRL(quote.regularMarketPrice)}</Text>
                  <Text
                    style={[
                      styles.cotacaoChange,
                      { color: quote.regularMarketChangePercent >= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {fmtPct(quote.regularMarketChangePercent)} hoje
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Gráfico histórico pra qualquer tradeable */}
          {isTradeable && (
            <View style={styles.chartBox}>
              <PriceChart symbol={asset.symbol} />
            </View>
          )}

          {/* Posição atual */}
          {quote && (
            <Card style={styles.positionCard}>
              <Text style={styles.positionTitle}>Sua posição</Text>
              <View style={styles.positionRow}>
                <View>
                  <Text style={styles.positionLabel}>Quantidade</Text>
                  <Text style={styles.positionValue}>{asset.quantity}</Text>
                </View>
                <View>
                  <Text style={styles.positionLabel}>Preço médio</Text>
                  <Text style={styles.positionValue}>{fmtBRL(asset.avgPrice, privacyMode)}</Text>
                </View>
                <View>
                  <Text style={styles.positionLabel}>Total atual</Text>
                  <Text style={styles.positionValue}>
                    {fmtBRL(quote.regularMarketPrice * asset.quantity, privacyMode)}
                  </Text>
                </View>
              </View>
              <View style={styles.positionDivider} />
              <View style={styles.positionRow}>
                <View>
                  <Text style={styles.positionLabel}>Lucro/Prejuízo</Text>
                  <Text
                    style={[
                      styles.positionValue,
                      {
                        color:
                          quote.regularMarketPrice * asset.quantity - asset.avgPrice * asset.quantity >= 0
                            ? colors.success
                            : colors.danger,
                      },
                    ]}
                  >
                    {fmtBRL(
                      quote.regularMarketPrice * asset.quantity - asset.avgPrice * asset.quantity,
                      privacyMode,
                    )}
                  </Text>
                </View>
                <View>
                  <Text style={styles.positionLabel}>Retorno</Text>
                  <Text
                    style={[
                      styles.positionValue,
                      {
                        color:
                          quote.regularMarketPrice >= asset.avgPrice ? colors.success : colors.danger,
                      },
                    ]}
                  >
                    {fmtPct(
                      ((quote.regularMarketPrice - asset.avgPrice) / asset.avgPrice) * 100,
                      privacyMode,
                    )}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Próximo pagamento */}
          {dividendInfo && (
            <Card style={styles.dividendCard}>
              <View style={styles.dividendHeader}>
                <Ionicons name="calendar" size={18} color={colors.primary} />
                <Text style={styles.dividendTitle}>Próximo pagamento</Text>
              </View>
              <View style={styles.dividendRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dividendLabel}>{frequencyLabel(dividendInfo.frequency)}</Text>
                  <Text style={styles.dividendDate}>
                    {formatNextPayment(dividendInfo).whenLabel}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.dividendLabel}>Valor estimado</Text>
                  <Text style={styles.dividendAmount}>
                    {fmtBRL(dividendInfo.nextEstimatedAmount * asset.quantity, privacyMode)}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Análise fundamentalista completa */}
          {tickerInfo && profile && (
            <AssetAnalysis
              ticker={tickerInfo}
              details={details}
              loading={loadingData}
              profile={profile}
            />
          )}

          <Text style={styles.label}>Quantidade</Text>
          <TextInput
            style={styles.input}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
          />

          <Text style={styles.label}>Preço médio (R$)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={(t) => setPrice(formatCurrencyInput(t))}
            keyboardType="decimal-pad"
          />
          <Text style={styles.helper}>
            O preço médio é o quanto você pagou por unidade (considerando taxas de corretagem).
          </Text>

          <Button
            title="Salvar alterações"
            onPress={handleSave}
            loading={saving}
            style={{ marginTop: spacing.lg }}
          />

          <Button
            title="Excluir posição"
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  assetHeader: { marginBottom: spacing.lg },
  symbol: { fontSize: fontSize.hero, fontWeight: 'bold', color: colors.primary },
  name: { fontSize: fontSize.body, color: colors.textSecondary },
  chartBox: { marginBottom: spacing.lg, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg },
  cotacaoLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase' },
  cotacaoValue: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  cotacaoChange: { fontSize: fontSize.small, fontWeight: '600' },
  positionCard: { marginBottom: spacing.md },
  positionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  positionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  positionLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  positionValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  positionDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  dividendCard: { marginBottom: spacing.md, backgroundColor: colors.primaryLight, borderColor: colors.primary },
  dividendHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  dividendTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.primaryDark, marginLeft: 6 },
  dividendRow: { flexDirection: 'row', alignItems: 'center' },
  dividendLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  dividendDate: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  dividendAmount: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.success, marginTop: 2 },
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
  errorText: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center' },
});
