import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { useOperationModal } from '../context/OperationModalContext';

// CommonJS keeps the pure timeline executable by the Node regression suite.
const { buildTodayTimeline } = require('../features/today/timeline');

export default function DashboardScreen({ navigation }: any) {
  const { user, activeWallet, privacyMode, togglePrivacy, profile, snapshots, operations, proventos, recordSnapshot } = useApp();
  const { open: openOperation } = useOperationModal();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [refreshing, setRefreshing] = useState(false);
  const assets = activeWallet?.assets || [];
  const load = useCallback(async (force = false) => {
    const symbols = assets.filter((asset) => ['acao', 'fii', 'etf'].includes(asset.type)).map((asset) => asset.symbol);
    if (!symbols.length) { setQuotes({}); return; }
    try {
      if (!force) { const cached = await getCachedQuotes(symbols); setQuotes(Object.fromEntries(cached.map((quote) => [quote.symbol, quote]))); }
      const fresh = await fetchQuotes(symbols, { force });
      setQuotes(Object.fromEntries(fresh.map((quote) => [quote.symbol, quote])));
    } catch {
      // Mantém as últimas cotações úteis; a tela continua interativa e permite atualizar novamente.
    }
  }, [assets]);
  useEffect(() => { load(); }, [load]);
  const onRefresh = async () => { setRefreshing(true); try { await load(true); } finally { setRefreshing(false); } };
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
  const onOpenPortfolio = () => navigation.navigate('Investir');
  const onOpenAporte = () => navigation.getParent()?.navigate('Aporte');
  const onOpenIncome = () => navigation.navigate('Investir', { screen: 'Proventos' });
  const onOpenHealth = () => navigation.getParent()?.navigate('AIHub', { context: { source: 'today-health' } });
  const handleCoachAction = (action: CoachAction) => { const lower = action.title.toLowerCase(); if (lower.includes('aporte')) onOpenAporte(); else if (lower.includes('ativo') || lower.includes('divers') || lower.includes('fii') || lower.includes('etf') || lower.includes('carteira')) onOpenPortfolio(); else onOpenHealth(); };
  const quickActions = [
    { label: 'Aportar agora', detail: 'Sugestão por perfil', icon: 'sparkles-outline', color: editorial.color.coral, onPress: onOpenAporte },
    { label: 'Registrar operação', detail: 'Compra ou venda', icon: 'swap-horizontal-outline', color: editorial.color.indigo, onPress: openOperation },
    { label: 'Analisar carteira', detail: 'Diagnóstico completo', icon: 'scan-outline', color: editorial.color.positive, onPress: onOpenHealth },
  ] as const;

  return <EditorialScreen refreshing={refreshing} onRefresh={onRefresh} hideTopGlow>
    <EditorialHeader context={date} onAvatar={() => navigation.navigate('Settings')} actions={[{ icon: 'notifications-outline', label: 'Abrir alertas', onPress: () => navigation.navigate('Alerts') }]} />
    <EditorialTitle kicker={greeting} title={narrative.headline} support={narrative.reason} />
    <MetricBand label="Patrimônio acompanhado" value={fmtBRL(stats.totalCurrent)} delta={`${stats.profitPct >= 0 ? '+' : ''}${stats.profitPct.toFixed(1)}% desde os aportes`} tone={narrative.tone} hidden={privacyMode} onToggleHidden={togglePrivacy}>
      {snapshots.length > 1 ? <View style={styles.chart}><PortfolioChart data={snapshots.map((snapshot) => ({ date: snapshot.date, total: snapshot.total }))} privacyMode={privacyMode} height={152} /></View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir patrimônio em Investir" onPress={onOpenPortfolio} style={({ pressed }) => [styles.metricLink, pressed && styles.pressed]}><Text style={styles.metricLinkText}>Ver carteira completa</Text></Pressable>
    </MetricBand>
    <View style={styles.quickActions}>{quickActions.map((action) => <Pressable key={action.label} accessibilityRole="button" accessibilityLabel={action.label} onPress={action.onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><View style={[styles.quickIcon, { backgroundColor: action.color }]}><Ionicons name={action.icon} size={20} color={editorial.color.canvas} /></View><Text style={styles.quickLabel}>{action.label}</Text><Text style={styles.quickDetail}>{action.detail}</Text><Ionicons name="arrow-forward" size={16} color={editorial.color.faint} style={styles.quickArrow} /></Pressable>)}</View>
    <TodaySignals monthlyBuys={monthlyBuys} profitPct={stats.profitPct} healthScore={health.score} monthlyIncome={monthlyIncome} onOpenAporte={onOpenAporte} onOpenPortfolio={onOpenPortfolio} onOpenIncome={onOpenIncome} onOpenHealth={onOpenHealth} />
    <View style={styles.insight}><InsightNote title="Uma leitura do Vesti" detail="Converse sobre o que mudou e transforme os números em próximos passos claros." tone="inverse" actionLabel="Conversar com o Vesti" onPress={() => navigation.navigate('AIHub', { context: { source: 'today' } })} /></View>
    <EditorialSectionHeader title="Seu mês até aqui" meta={`${timeline.length} movimentos`} />
    <TodayTimeline items={timeline} onAdd={() => navigation.navigate('Investir', { screen: 'Operacoes' })} onSelect={(item) => navigation.navigate('Investir', { screen: item.id.startsWith('provento:') ? 'Proventos' : 'Operacoes' })} />
    <EditorialSectionHeader title="Próximos passos" meta="Para você" />
    <TodayNextSteps actions={health.actions} onSelect={handleCoachAction} />
  </EditorialScreen>;
}

const styles = StyleSheet.create({
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: editorial.space.md, marginTop: editorial.space.lg, marginBottom: editorial.space.xl },
  quickAction: { position: 'relative', flexGrow: 1, flexBasis: 180, minHeight: 118, padding: editorial.space.lg, borderRadius: editorial.radius.feature, backgroundColor: editorial.color.canvasRaised, borderWidth: 1, borderColor: editorial.color.line, overflow: 'hidden' },
  quickIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: editorial.space.md },
  quickLabel: { color: editorial.color.ink, fontSize: editorial.type.body, fontWeight: '900' },
  quickDetail: { color: editorial.color.muted, fontSize: editorial.type.caption, marginTop: 3 },
  quickArrow: { position: 'absolute', right: editorial.space.md, top: editorial.space.md },
  chart: { marginTop: editorial.space.sm },
  metricLink: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  metricLinkText: { color: editorial.color.indigo, fontWeight: '800', fontSize: editorial.type.caption },
  pressed: { opacity: 0.65, transform: [{ scale: 0.985 }] },
  insight: { marginTop: editorial.space.xl },
});
