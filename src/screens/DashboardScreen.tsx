import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import PortfolioChart from '../components/PortfolioChart';
import { fetchQuotes, getCachedQuotes, Quote } from '../api/brapi';
import { useApp } from '../context/AppContext';
import { buildTodayNarrative } from '../features/editorial/todayModel';
import TodayNextSteps from '../features/today/TodayNextSteps';
import TodaySignals from '../features/today/TodaySignals';
import TodayTimeline, { TimelineItem } from '../features/today/TodayTimeline';
import { editorial } from '../theme/editorial';
import { EditorialHeader, EditorialScreen, EditorialSectionHeader, EditorialTitle, InsightNote, MetricBand } from '../ui/editorial';
import { fmtBRL } from '../utils/format';
import { CoachAction, computeHealthScoreDetailed } from '../utils/healthCoach';
import { computePortfolioStats } from '../utils/portfolio';

// CommonJS keeps the pure timeline executable by the Node regression suite.
const { buildTodayTimeline } = require('../features/today/timeline');

export default function DashboardScreen({ navigation }: any) {
  const { user, activeWallet, privacyMode, togglePrivacy, profile, snapshots, operations, proventos, recordSnapshot } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [refreshing, setRefreshing] = useState(false);
  const assets = activeWallet?.assets || [];
  const load = useCallback(async (force = false) => {
    const symbols = assets.filter((asset) => ['acao', 'fii', 'etf'].includes(asset.type)).map((asset) => asset.symbol);
    if (!symbols.length) { setQuotes({}); return; }
    if (!force) { const cached = await getCachedQuotes(symbols); setQuotes(Object.fromEntries(cached.map((quote) => [quote.symbol, quote]))); }
    const fresh = await fetchQuotes(symbols, { force });
    setQuotes(Object.fromEntries(fresh.map((quote) => [quote.symbol, quote])));
  }, [assets]);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); await load(true); setRefreshing(false); };
  const prices = Object.fromEntries(Object.entries(quotes).map(([symbol, quote]) => [symbol, quote.regularMarketPrice]));
  const stats = computePortfolioStats(assets, prices);
  const health = computeHealthScoreDetailed(assets, stats.profitPct, profile);
  useEffect(() => { if (stats.totalCurrent > 0) recordSnapshot(stats.totalCurrent, stats.totalInvested); }, [stats.totalCurrent, stats.totalInvested, recordSnapshot]);
  const month = new Date().toISOString().slice(0, 7);
  const timeline = useMemo(() => buildTodayTimeline({ operations, proventos, month }) as TimelineItem[], [operations, proventos, month]);
  const monthlyBuys = operations.filter((operation) => operation.date.startsWith(month) && operation.type === 'buy').reduce((sum, operation) => sum + operation.quantity * operation.price, 0);
  const monthlyIncome = proventos.filter((income) => income.date.startsWith(month)).reduce((sum, income) => sum + income.amount, 0);
  const cashFlow = monthlyIncome - monthlyBuys;
  const positions = assets.map((asset) => asset.quantity * (prices[asset.symbol] || asset.avgPrice));
  const concentration = stats.totalCurrent > 0 ? (Math.max(0, ...positions) / stats.totalCurrent) * 100 : 0;
  const narrative = buildTodayNarrative({ profitPct: stats.profitPct, cashFlow, concentration }) as { headline: string; reason: string; tone: 'positive' | 'neutral' | 'attention' };
  const hour = new Date().getHours();
  const greeting = `${hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`;
  const date = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  const handleCoachAction = (action: CoachAction) => { const lower = action.title.toLowerCase(); if (lower.includes('aporte')) navigation.navigate('Aporte'); else if (lower.includes('ativo') || lower.includes('divers')) navigation.navigate('Investir'); else navigation.navigate('Planejar'); };

  return <EditorialScreen refreshing={refreshing} onRefresh={onRefresh}>
    <EditorialHeader context={date} onAvatar={() => navigation.navigate('Settings')} actions={[{ icon: 'notifications-outline', label: 'Abrir alertas', onPress: () => navigation.navigate('Alerts') }]} />
    <EditorialTitle kicker={greeting} title={narrative.headline} support={narrative.reason} />
    <MetricBand label="Patrimônio acompanhado" value={fmtBRL(stats.totalCurrent)} delta={`${stats.profitPct >= 0 ? '+' : ''}${stats.profitPct.toFixed(1)}% desde os aportes`} tone={narrative.tone} hidden={privacyMode} onToggleHidden={togglePrivacy}>
      {snapshots.length > 1 ? <View style={styles.chart}><PortfolioChart data={snapshots.map((snapshot) => ({ date: snapshot.date, total: snapshot.total }))} privacyMode={privacyMode} height={152} /></View> : null}
    </MetricBand>
    <TodaySignals cashFlow={cashFlow} profitPct={stats.profitPct} healthScore={health.score} />
    <View style={styles.insight}><InsightNote title="Uma leitura do Vesti" detail="Converse sobre o que mudou e transforme os números em próximos passos claros." tone="inverse" actionLabel="Conversar com o Vesti" onPress={() => navigation.navigate('AIHub', { context: { source: 'today' } })} /></View>
    <EditorialSectionHeader title="Seu mês até aqui" meta={`${timeline.length} movimentos`} />
    <TodayTimeline items={timeline} onAdd={() => navigation.navigate('Investir', { screen: 'Operacoes' })} />
    <EditorialSectionHeader title="Próximos passos" meta="Para você" />
    <TodayNextSteps actions={health.actions} onSelect={handleCoachAction} />
  </EditorialScreen>;
}

const styles = StyleSheet.create({ chart: { marginTop: editorial.space.sm }, insight: { marginTop: editorial.space.xl } });
