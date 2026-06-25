import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import PriceChart from '../components/PriceChart';
import AssetAnalysis from '../components/AssetAnalysis';
import AssetTabs, { TabKey } from '../components/AssetTabs';
import AssetReturnsPanel from '../components/AssetReturnsPanel';
import InvestorChecklist from '../components/InvestorChecklist';
import AssetProventosHistory from '../components/AssetProventosHistory';
import AssetAbout from '../components/AssetAbout';
import TabPlaceholder from '../components/TabPlaceholder';
import { TICKERS, TickerInfo } from '../data/tickers';
import { fetchAssetDetails, AssetDetails } from '../api/yahooDetails';
import { fetchQuotes, Quote } from '../api/brapi';
import { fetchDividendInfo, DividendInfo } from '../api/dividends';
import { fmtBRL, fmtPct } from '../utils/format';
import Card from '../components/Card';

type Params = { symbol: string; name?: string; type?: TickerInfo['type'] };

export default function AssetDetailScreen({ navigation, route }: any) {
  const params = (route?.params || {}) as Params;
  const symbol: string = params.symbol;
  const { profile } = useApp();

  const tickerInfo = useMemo<TickerInfo>(() => {
    const found = TICKERS.find((t) => t.symbol === symbol);
    if (found) return found;
    return {
      symbol,
      name: params.name || symbol,
      type: (params.type || (symbol.endsWith('11') ? 'fii' : 'acao')) as TickerInfo['type'],
    };
  }, [symbol, params.name, params.type]);

  const [tab, setTab] = useState<TabKey>('resumo');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [dividendInfo, setDividendInfo] = useState<DividendInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchQuotes([symbol]),
      fetchAssetDetails(symbol),
      fetchDividendInfo(symbol),
    ]).then(([qs, d, dv]) => {
      if (cancelled) return;
      setQuote(qs[0] || null);
      setDetails(d);
      setDividendInfo(dv);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [symbol]);

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{symbol}</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} stickyHeaderIndices={[1]}>
        <View style={styles.heroBox}>
          <Text style={styles.heroSymbol}>{symbol}</Text>
          <Text style={styles.heroName}>{tickerInfo.name}</Text>
          {quote && (
            <View style={styles.priceRow}>
              <Text style={styles.priceValue}>{fmtBRL(quote.regularMarketPrice)}</Text>
              <Text style={[styles.priceChange, { color: quote.regularMarketChangePercent >= 0 ? colors.success : colors.danger }]}>
                {quote.regularMarketChangePercent >= 0 ? '↑' : '↓'} {fmtPct(quote.regularMarketChangePercent)} hoje
              </Text>
            </View>
          )}
        </View>

        <AssetTabs active={tab} onChange={setTab} />

        <View style={styles.tabBody}>
          {tab === 'resumo' && (
            <>
              <Card><PriceChart symbol={symbol} /></Card>
              <View style={{ marginTop: spacing.md }}><AssetReturnsPanel symbol={symbol} /></View>
            </>
          )}
          {tab === 'indicadores' && (
            <>
              {profile && <AssetAnalysis ticker={tickerInfo} details={details} loading={loading} profile={profile} dividends={dividendInfo} />}
              <View style={{ marginTop: spacing.md }}>
                <InvestorChecklist ticker={tickerInfo} details={details} dividends={dividendInfo} />
              </View>
            </>
          )}
          {tab === 'proventos' && (
            <AssetProventosHistory symbol={symbol} />
          )}
          {tab === 'resultados' && (
            <TabPlaceholder icon="bar-chart-outline" title="Resultados financeiros" description="Receita, lucro e EBITDA por trimestre/ano. Vamos puxar da CVM." />
          )}
          {tab === 'comparar' && (
            <View>
              <Card>
                <Text style={styles.helper}>Compare {symbol} com outros ativos lado a lado.</Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('Compare', { initialSymbol: symbol })}
                >
                  <Text style={styles.actionBtnText}>Abrir comparador</Text>
                </TouchableOpacity>
              </Card>
            </View>
          )}
          {tab === 'noticias' && (
            <TabPlaceholder icon="newspaper-outline" title="Notícias do ativo" description="Feed de manchetes filtradas sobre essa empresa." />
          )}
          {tab === 'sobre' && (
            <AssetAbout ticker={tickerInfo} details={details} />
          )}
          {tab === 'discussoes' && (
            <TabPlaceholder icon="chatbubbles-outline" title="Discussões da comunidade" description="Comentários e opiniões de outros investidores. Em construção." />
          )}
        </View>

        {loading && (
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  backBtn: { flexDirection: 'row', alignItems: 'center', minWidth: 70 },
  backText: { color: colors.text, fontWeight: '600', marginLeft: 2 },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  heroBox: { padding: spacing.lg, backgroundColor: colors.background },
  heroSymbol: { fontSize: fontSize.hero, fontWeight: 'bold', color: colors.primary },
  heroName: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: spacing.md },
  priceValue: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, flex: 1 },
  priceChange: { fontSize: fontSize.body, fontWeight: '700' },
  tabBody: { padding: spacing.md },
  helper: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.md },
  actionBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  actionBtnText: { color: colors.textLight, fontWeight: '700' },
});
