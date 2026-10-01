import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchQuotes, Quote } from '../api/brapi';
import { useApp } from '../context/AppContext';
import { buildInvestmentView } from '../features/editorial/investModel';
import { editorial } from '../theme/editorial';
import { AllocationBand, EditorialHeader, EditorialRow, EditorialScreen, EditorialSectionHeader, EditorialState, EditorialTitle, InsightNote, MetricBand, UnderlineTabs } from '../ui/editorial';
import { fmtBRL } from '../utils/format';
import { computePortfolioStats } from '../utils/portfolio';

type Tab = 'Posições' | 'Rendimentos' | 'Movimentos';
const classNames: Record<string, string> = { acao: 'Ações', fii: 'Fundos imobiliários', etf: 'ETFs', renda_fixa: 'Renda fixa', cripto: 'Cripto', outros: 'Outros' };

export default function PortfolioScreen({ navigation }: any) {
  const { activeWallet, privacyMode, togglePrivacy, operations, proventos } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [tab, setTab] = useState<Tab>('Posições');
  const [refreshing, setRefreshing] = useState(false);
  const assets = activeWallet?.assets || [];
  const load = useCallback(async () => { const data = await fetchQuotes(assets.filter((asset) => ['acao', 'fii', 'etf'].includes(asset.type)).map((asset) => asset.symbol)); setQuotes(Object.fromEntries(data.map((quote) => [quote.symbol, quote]))); }, [assets]);
  useEffect(() => { load(); }, [load]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const prices = Object.fromEntries(Object.entries(quotes).map(([symbol, quote]) => [symbol, quote.regularMarketPrice]));
  const stats = computePortfolioStats(assets, prices);
  const view = buildInvestmentView(assets.map((asset) => ({ symbol: asset.symbol, type: asset.type, current: asset.quantity * (prices[asset.symbol] || asset.avgPrice) }))) as any;
  const readOnly = Boolean(activeWallet?.readOnly);
  const openAporte = () => { const mainStack = navigation.getParent?.()?.getParent?.(); if (mainStack) mainStack.navigate('Aporte'); else navigation.navigate('Aporte'); };
  const action = <Pressable accessibilityRole="button" accessibilityLabel="Adicionar ativo" disabled={readOnly} onPress={() => navigation.navigate('AddAsset')} style={({ pressed }) => [styles.add, readOnly && styles.disabled, pressed && styles.pressed]}><Ionicons name="add" size={21} color={editorial.color.white} /></Pressable>;

  return <EditorialScreen refreshing={refreshing} onRefresh={refresh}>
    <EditorialHeader context={activeWallet?.name || 'Carteira principal'} onAvatar={() => navigation.navigate('Settings')} trailing={action} actions={[{ icon: 'search-outline', label: 'Lista de ativos', onPress: () => navigation.getParent()?.navigate('AssetsList') }, { icon: 'git-compare-outline', label: 'Comparar ativos', onPress: () => navigation.navigate('Compare') }]} />
    <EditorialTitle kicker="Investir" title={view.needsAttention ? 'Sua carteira pede mais equilíbrio.' : 'Seu dinheiro, em perspectiva.'} support={view.needsAttention ? `${view.topHolding.symbol} representa ${view.topHolding.share.toFixed(1)}% do patrimônio acompanhado.` : 'Veja a composição, os movimentos e os rendimentos sem perder o contexto.'} />
    {readOnly ? <View style={styles.notice}><EditorialState kind="readOnly" title="Carteira compartilhada" detail="Você está em modo somente leitura; as alterações estão desativadas." /></View> : null}
    <MetricBand label="Patrimônio investido" value={fmtBRL(stats.totalCurrent)} delta={`${stats.profitPct >= 0 ? '+' : ''}${stats.profitPct.toFixed(1)}% acumulado`} tone={stats.profitPct >= 0 ? 'positive' : 'attention'} hidden={privacyMode} onToggleHidden={togglePrivacy}>
      {view.classes.length ? <AllocationBand segments={view.classes.map((item: any) => ({ label: classNames[item.label] || item.label, value: item.value }))} /> : null}
    </MetricBand>
    {!readOnly ? <View style={styles.aporte}><InsightNote title="Sugerir meu aporte" detail="Informe o valor e receba uma distribuição alinhada ao seu perfil e à carteira atual." tone="coral" actionLabel="Abrir sugestão de aporte" onPress={openAporte} /></View> : null}
    <View style={styles.tabs}><UnderlineTabs items={['Posições', 'Rendimentos', 'Movimentos'] as const} value={tab} onChange={setTab} label="Visões da carteira" /></View>
    {tab === 'Posições' ? <Positions assets={assets} prices={prices} hidden={privacyMode} navigation={navigation} /> : null}
    {tab === 'Rendimentos' ? <Income items={proventos} hidden={privacyMode} navigation={navigation} /> : null}
    {tab === 'Movimentos' ? <Movements items={operations} hidden={privacyMode} navigation={navigation} /> : null}
    <View style={styles.insight}><InsightNote title="Diagnóstico da carteira" detail="Peça ao Vesti uma leitura da concentração, do resultado e dos próximos aportes." tone="indigo" actionLabel="Abrir diagnóstico" onPress={() => navigation.getParent()?.navigate('AIHub', { context: { source: 'portfolio' } })} /></View>
  </EditorialScreen>;
}

function Positions({ assets, prices, hidden, navigation }: any) {
  return <><EditorialSectionHeader title="Posições" meta={`${assets.length} ativos`} />{!assets.length ? <EditorialState kind="empty" title="Monte sua carteira" detail="Adicione seu primeiro investimento para acompanhar a evolução." action={{ label: 'Adicionar ativo', onPress: () => navigation.navigate('AddAsset') }} /> : <View>{assets.map((asset: any, index: number) => { const price = prices[asset.symbol] || asset.avgPrice; const value = price * asset.quantity; const profit = asset.avgPrice ? ((price - asset.avgPrice) / asset.avgPrice) * 100 : 0; return <EditorialRow key={asset.symbol} last={index === assets.length - 1} leading={<View style={styles.monogram}><Text style={styles.monogramText}>{asset.symbol.slice(0, 2)}</Text></View>} title={asset.symbol} detail={`${asset.name} · ${asset.quantity} unidades`} value={hidden ? '••••' : fmtBRL(value)} trend={`${profit >= 0 ? '+' : ''}${profit.toFixed(1)}%`} trendTone={profit >= 0 ? 'positive' : 'attention'} onPress={() => navigation.navigate('AssetDetail', { symbol: asset.symbol, asset })} />; })}</View>}</>;
}
function Income({ items, hidden, navigation }: any) { return <><EditorialSectionHeader title="Rendimentos" meta="Recebidos" />{!items.length ? <EditorialState kind="empty" title="Nenhum rendimento ainda" detail="Registre dividendos e juros para enxergar a renda da carteira." action={{ label: 'Abrir rendimentos', onPress: () => navigation.navigate('Proventos') }} /> : <View>{items.slice(0, 12).map((item: any, index: number) => <EditorialRow key={item.id} last={index === Math.min(items.length, 12) - 1} leading={<Text style={styles.kind}>RENDA</Text>} title={item.symbol} detail={`${item.date} · ${item.kind.toUpperCase()}`} value={hidden ? '••••' : `+ ${fmtBRL(item.amount)}`} trendTone="positive" />)}</View>}</> }
function Movements({ items, hidden, navigation }: any) { return <><EditorialSectionHeader title="Movimentos" meta="Recentes" />{!items.length ? <EditorialState kind="empty" title="Nenhuma operação" detail="Registre compras e vendas para acompanhar preço médio e impostos." action={{ label: 'Registrar operação', onPress: () => navigation.navigate('Operacoes') }} /> : <View>{items.slice(0, 12).map((item: any, index: number) => <EditorialRow key={item.id} last={index === Math.min(items.length, 12) - 1} leading={<Text style={styles.kind}>{item.type === 'buy' ? 'COMPRA' : 'VENDA'}</Text>} title={item.symbol} detail={`${item.date} · ${item.quantity} unidades`} value={hidden ? '••••' : fmtBRL(item.quantity * item.price)} />)}</View>}</> }

const styles = StyleSheet.create({ add: { width: 44, height: 44, borderRadius: 22, backgroundColor: editorial.color.indigo, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.35 }, pressed: { opacity: 0.65 }, notice: { marginBottom: editorial.space.lg }, aporte: { marginTop: editorial.space.xl }, tabs: { marginTop: editorial.space.xl }, insight: { marginTop: editorial.space.xl }, monogram: { width: 40, height: 40, borderRadius: 20, backgroundColor: editorial.color.indigoSoft, alignItems: 'center', justifyContent: 'center' }, monogramText: { color: editorial.color.indigo, fontWeight: '900', fontSize: editorial.type.kicker }, kind: { color: editorial.color.coral, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 } });
