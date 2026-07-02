import { useEffect, useState, useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fetchQuotes, getCachedQuotes, IPCA_12M, Quote } from '../api/brapi';
import { fmtBRL, fmtPct, fmtCompactBRL } from '../utils/format';
import { getMarketStatus } from '../utils/market';
import { getGoals } from '../utils/goals';
import { computePortfolioStats } from '../utils/portfolio';
import Card from '../components/Card';
import InfoTooltip from '../components/InfoTooltip';
import { notifyAssetDrop, notifyGoalReached, checkWatchlistAlerts } from '../services/notifications';
import { computeHealthScoreDetailed, healthLevelLabel, CoachAction } from '../utils/healthCoach';
import { preferenceLabel } from '../data/profileQuiz';
import { getQuoteOfDay } from '../data/motivational';
import CelebrationModal from '../components/CelebrationModal';
import IbovespaComparison from '../components/IbovespaComparison';
import BenchmarkSparkline from '../components/BenchmarkSparkline';
import { buildComparisonSeries, computeReturnMetrics } from '../utils/benchmarks';
import { fetchAssetDetails, AssetDetails } from '../api/yahooDetails';
import { computeDividendForecast } from '../utils/dividendForecast';
import { MONTH_NAMES_PT } from '../data/dividends';
import { fetchDividendInfoBatch, DividendInfo, formatNextPayment, formatDateBR, frequencyLabel, clearDividendCache } from '../api/dividends';
import PortfolioChart from '../components/PortfolioChart';
import ProventosBarChart from '../components/ProventosBarChart';
import DividendTargetCard from '../components/DividendTargetCard';
import AIFloatingButton from '../components/AIFloatingButton';
import { computeReceivedProventos } from '../utils/receivedProventos';
import { computeTargetProgress } from '../utils/dividendTarget';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchNews, NewsItem } from '../api/news';
import { Linking } from 'react-native';
import MarketStatusBar from '../components/MarketStatusBar';
import HealthRing from '../components/HealthRing';

export default function DashboardScreen({ navigation }: any) {
  const { user, activeWallet, privacyMode, togglePrivacy, profile, recordGoal, wallets, setActiveWalletId, goalsReached, watchlist, snapshots, recordSnapshot, operations, proventos } = useApp();
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetchNews('mercado').then((arr) => setNews(arr.slice(0, 5)));
  }, []);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [detailsMap, setDetailsMap] = useState<Record<string, AssetDetails | null>>({});
  const [dividendInfoMap, setDividendInfoMap] = useState<Record<string, DividendInfo | null>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const [celebrateGoal, setCelebrateGoal] = useState<{ value: number; label: string } | null>(null);

  const load = useCallback(async (force = false) => {
    if (!activeWallet || activeWallet.assets.length === 0) {
      setQuotes({});
      return;
    }
    const symbols = activeWallet.assets
      .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
      .map((a) => a.symbol);

    // Cotações cacheadas viram primeiro pra pintar a tela na hora
    if (!force) {
      const cached = await getCachedQuotes(symbols);
      if (cached.length > 0) {
        const cmap: Record<string, Quote> = {};
        cached.forEach((q) => (cmap[q.symbol] = q));
        setQuotes(cmap);
      }
    }

    const data = await fetchQuotes(symbols, { force });
    const map: Record<string, Quote> = {};
    data.forEach((q) => (map[q.symbol] = q));
    setQuotes(map);
    // Alertar quedas significativas no dia (> 5%)
    data.forEach((q) => {
      if (q.regularMarketChangePercent <= -5) {
        notifyAssetDrop(q.symbol, q.regularMarketChangePercent);
      }
    });

    // Watchlist: busca cotações e checa preço-alvo
    if (watchlist.length > 0) {
      const watchSymbols = watchlist.map((w) => w.symbol);
      const watchData = await fetchQuotes(watchSymbols);
      const watchPrices: Record<string, number> = {};
      watchData.forEach((q) => (watchPrices[q.symbol] = q.regularMarketPrice));
      await checkWatchlistAlerts(watchlist, watchPrices);
    }
    // Detalhes + dividendos rodam em background pra não atrasar o primeiro paint
    setTimeout(() => {
      Promise.all(
        symbols.map((s) => fetchAssetDetails(s).then((d) => [s, d] as const)),
      ).then((detailsResults) => {
        const detailsMapNew: Record<string, AssetDetails | null> = {};
        detailsResults.forEach(([s, d]) => (detailsMapNew[s] = d));
        setDetailsMap(detailsMapNew);
      });
      fetchDividendInfoBatch(symbols, force).then(setDividendInfoMap);
    }, 0);
  }, [activeWallet]);

  useEffect(() => {
    load();
    const t = setInterval(() => setMarketStatus(getMarketStatus()), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    clearDividendCache();
    await load(true);
    setRefreshing(false);
  };

  const priceMap = Object.fromEntries(
    Object.entries(quotes).map(([k, v]) => [k, v.regularMarketPrice]),
  );
  const stats = computePortfolioStats(activeWallet?.assets || [], priceMap);
  const { totalInvested, totalCurrent, profit, profitPct, annualizedPct, weightedDays } = stats;

  const goals = getGoals(totalCurrent);

  useEffect(() => {
    if (goals.current.reached && !goalsReached.includes(goals.current.value)) {
      recordGoal(goals.current.value);
      notifyGoalReached(goals.current.label);
      // Mostra popup dentro do app
      setCelebrateGoal({ value: goals.current.value, label: goals.current.label });
    }
  }, [goals.current.value, goals.current.reached, goals.current.label, recordGoal, goalsReached]);

  // Snapshot diário de patrimônio (1 por dia) — alimenta o gráfico de evolução
  useEffect(() => {
    if (totalCurrent > 0) {
      recordSnapshot(totalCurrent, totalInvested);
    }
  }, [totalCurrent, totalInvested, recordSnapshot]);

  const healthData = computeHealthScoreDetailed(activeWallet?.assets || [], profitPct, profile, detailsMap);
  const healthScore = healthData.score;
  const quote = getQuoteOfDay();

  // Previsão de dividendos (usa dados REAIS do Status Invest quando disponíveis)
  const dividendForecast = computeDividendForecast(
    activeWallet?.assets || [],
    priceMap,
    detailsMap,
    dividendInfoMap,
  );
  const currentMonthName = MONTH_NAMES_PT[new Date().getMonth()];

  // Alerta DARF: detecta se no mês passado vendeu acima de R$ 20k em ações
  // (precisa pagar IR até último dia útil do mês corrente)
  const darfAlert = (() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lmKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const sold = operations
      .filter((o) => o.type === 'sell' && o.assetType === 'acao' && o.date.startsWith(lmKey))
      .reduce((s, o) => s + o.price * o.quantity, 0);
    if (sold > 20000) {
      const monthName = MONTH_NAMES_PT[lastMonth.getMonth()];
      return { sold, monthName };
    }
    return null;
  })();

  // Próximos pagamentos: APENAS do mês corrente. Vira automaticamente quando
  // muda o mês (pois usa new Date().getMonth()).
  const upcomingPayments = (() => {
    type Pay = {
      symbol: string;
      date: string;
      amount: number;
      whenLabel: string;
      daysAhead: number;
      isConfirmed: boolean;
    };
    const list: Pay[] = [];
    if (!activeWallet) return list;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString().slice(0, 10);
    const curYear = today.getFullYear();
    const curMonth = today.getMonth() + 1;
    const monthStart = `${curYear}-${String(curMonth).padStart(2, '0')}-01`;
    // Último dia do mês corrente
    const lastDay = new Date(curYear, curMonth, 0).getDate();
    const monthEnd = `${curYear}-${String(curMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    for (const asset of activeWallet.assets) {
      const info = dividendInfoMap[asset.symbol];
      if (!info) continue;
      const addedAtMs = asset.addedAt;
      const addedIso = new Date(addedAtMs).toISOString().slice(0, 10);

      // 1) Agrupa entradas REAIS do mês corrente, dedup por data e somando
      //    valores no mesmo dia (JCP + Dividendo no mesmo PETR4 viram 1 só)
      const sumByDate = new Map<string, { amount: number; isConfirmed: boolean }>();
      let firstConfirmedDate: string | null = null;

      for (const entry of info.history) {
        if (entry.date < monthStart || entry.date > monthEnd) continue;
        // Pagamento futuro: precisa ter sido adicionado antes
        if (entry.date > todayIso) {
          if (entry.date < addedIso) continue;
        } else {
          // Pagamento passado: precisa ter sido holder por 5+ dias antes
          const entryMs = new Date(entry.date).getTime();
          if (entryMs - addedAtMs < 5 * 24 * 60 * 60 * 1000) continue;
          continue; // não mostra passados (já recebido), só futuro/atual
        }
        const existing = sumByDate.get(entry.date) || { amount: 0, isConfirmed: false };
        sumByDate.set(entry.date, { amount: existing.amount + entry.amount, isConfirmed: true });
        if (!firstConfirmedDate || entry.date < firstConfirmedDate) firstConfirmedDate = entry.date;
      }

      // 2) Se NÃO tem entrada confirmada no mês corrente E a frequência é mensal,
      //    projeta uma data estimada baseada no padrão histórico
      if (sumByDate.size === 0 && info.frequency === 'monthly' && info.averageInterval > 0) {
        const sortedDates = info.history.map((h) => h.date).sort();
        const lastKnown = sortedDates[sortedDates.length - 1];
        if (lastKnown) {
          const cursor = new Date(lastKnown);
          // Avança até cair no mês corrente
          while (cursor.toISOString().slice(0, 10) < monthStart) {
            cursor.setDate(cursor.getDate() + info.averageInterval);
          }
          const iso = cursor.toISOString().slice(0, 10);
          if (iso >= monthStart && iso <= monthEnd && iso > todayIso && iso >= addedIso) {
            sumByDate.set(iso, { amount: info.averageAmount, isConfirmed: false });
          }
        }
      }

      // Cria uma linha por ativo (a primeira data válida do mês)
      const entries = Array.from(sumByDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      if (entries.length > 0) {
        const [date, { amount, isConfirmed }] = entries[0];
        const total = amount * asset.quantity;
        if (total > 0) {
          const daysAhead = Math.round(
            (new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          list.push({
            symbol: asset.symbol,
            date,
            amount: total,
            whenLabel: daysAheadLabel(daysAhead),
            daysAhead,
            isConfirmed,
          });
        }
      }
    }

    list.sort((a, b) => a.daysAhead - b.daysAhead);
    return list;
  })();

  // Rentabilidade: pra evitar anualização absurda em períodos curtos,
  // só mostramos anual/mensal quando carteira tem 30+ dias. Antes disso, mostra retorno simples.
  const hasEnoughHistory = weightedDays >= 30;
  // Cap defensivo: anualização pode explodir em períodos curtos
  const cappedAnnualized = Math.max(-95, Math.min(500, annualizedPct));
  const monthlyPct = hasEnoughHistory ? (Math.pow(1 + cappedAnnualized / 100, 1 / 12) - 1) * 100 : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>Olá, {user?.name?.split(' ')[0] || ''}</Text>
            <Text style={styles.subHello}>
              {profile?.type ? `Perfil ${profile.type}` : 'Sua carteira'}
              {profile?.preference && preferenceLabel(profile.preference) !== '' && (
                ` · ${preferenceLabel(profile.preference)}`
              )}
            </Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={onRefresh} style={styles.eyeBtn} disabled={refreshing}>
              <Ionicons
                name="refresh"
                size={22}
                color={refreshing ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePrivacy} style={[styles.eyeBtn, { marginLeft: spacing.sm }]}>
              <Ionicons name={privacyMode ? 'eye-off' : 'eye'} size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('AIHub')}
              style={[styles.eyeBtn, { marginLeft: spacing.sm, backgroundColor: colors.primaryLight }]}
            >
              <Ionicons name="sparkles" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('Settings')}
              style={[styles.eyeBtn, { marginLeft: spacing.sm }]}
            >
              <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Multi-wallet selector */}
        {wallets.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.walletTabs}>
            {wallets.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.walletTab, w.id === activeWallet?.id && styles.walletTabActive]}
                onPress={() => setActiveWalletId(w.id)}
              >
                <Text
                  style={[
                    styles.walletTabText,
                    w.id === activeWallet?.id && styles.walletTabTextActive,
                  ]}
                >
                  {w.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Alerta DARF: vendeu > 20k mês passado, paga IR até último dia útil */}
        {darfAlert && (
          <TouchableOpacity
            onPress={() => navigation.navigate('Carteira', { screen: 'IRCalculator' })}
          >
            <Card style={styles.darfAlertCard}>
              <Text style={styles.darfEmoji}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.darfTitle}>Atenção: você precisa pagar DARF</Text>
                <Text style={styles.darfDesc}>
                  Você vendeu {fmtBRL(darfAlert.sold, privacyMode)} em ações em {darfAlert.monthName}.
                  Como passou de R$ 20 mil, paga IR 15% sobre o lucro até o último dia útil deste mês.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.warning} />
            </Card>
          </TouchableOpacity>
        )}

        {/* Market status — agora com dot pulsante animado */}
        <View style={{ marginTop: spacing.md }}>
          <MarketStatusBar />
          {marketStatus.isOpen && (
            <Text style={styles.delayNote}>
              ℹ️ Cotações com ~15 min de atraso (brapi free)
            </Text>
          )}
        </View>

        {/* Patrimônio total — hero com gradiente */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#5C0593']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGradient}
        >
          <Text style={styles.heroLabel}>Patrimônio atual</Text>
          <Text style={styles.heroValue}>{fmtBRL(totalCurrent, privacyMode)}</Text>
          <View style={styles.heroRow}>
            <View style={[styles.heroChangePill, { backgroundColor: profit >= 0 ? '#FFFFFF22' : '#FFFFFF22' }]}>
              <Ionicons
                name={profit >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color={colors.textLight}
              />
              <Text style={styles.heroChange}>
                {' '}{fmtBRL(Math.abs(profit), privacyMode)} ({fmtPct(profitPct, privacyMode)})
              </Text>
            </View>
          </View>
          <Text style={styles.heroInvested}>Investido: {fmtBRL(totalInvested, privacyMode)}</Text>
        </LinearGradient>

        {/* Atalhos essenciais (atalhos coloridos detalhados ficam dentro da Carteira) */}
        <View style={styles.shortcutsGrid}>
          <ShortcutTile
            icon="trophy-outline"
            label="Rankings"
            color={colors.primaryDark || '#5C0593'}
            onPress={() => navigation.getParent()?.navigate('Rankings')}
          />
          <ShortcutTile
            icon="newspaper-outline"
            label="Notícias"
            color={colors.warning}
            onPress={() => navigation.getParent()?.navigate('News')}
          />
          <ShortcutTile
            icon="wallet-outline"
            label="Carteira"
            color={colors.primary}
            onPress={() => navigation.navigate('Carteira')}
          />
        </View>

        {/* Evolução do patrimônio (snapshots diários) */}
        {(activeWallet?.assets.length || 0) > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📈 Evolução do patrimônio</Text>
            </View>
            <PortfolioChart
              data={snapshots.map((s) => ({ date: s.date, total: s.total }))}
              privacyMode={privacyMode}
            />
          </Card>
        )}

        {/* Frase do dia */}
        <Card style={[styles.quoteCard, { marginTop: spacing.md }]}>
          <Text style={styles.quoteLabel}>✨ Pensamento do dia</Text>
          <Text style={styles.quoteText}>"{quote.text}"</Text>
          {quote.author && <Text style={styles.quoteAuthor}>— {quote.author}</Text>}
        </Card>

        {/* Health Ring + Coach */}
        <View style={{ marginTop: spacing.md }}>
          <HealthRing score={Math.round(healthScore)} message={healthLevelLabel(healthScore)} />
        </View>
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🎯 Coach do investidor</Text>
            <InfoTooltip termName="Diversificação" />
          </View>

          {/* Coach actions */}
          {healthData.actions.length > 0 && (
            <View style={styles.coachBox}>
              <Text style={styles.coachLabel}>🎯 Seu coach sugere:</Text>
              {healthData.actions.map((action: CoachAction, i: number) => (
                <View key={i} style={styles.coachAction}>
                  <Text style={styles.coachIcon}>{action.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.coachActionTitle}>
                      <Text style={styles.coachActionTitleText}>{action.title}</Text>
                      <View style={[styles.impactBadge, impactBadgeColor(action.impact)]}>
                        <Text style={styles.impactText}>{action.impact}</Text>
                      </View>
                    </View>
                    <Text style={styles.coachActionDesc}>{action.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Inflação */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>vs Inflação</Text>
            <InfoTooltip termName="IPCA" />
          </View>
          {weightedDays < 30 || totalInvested === 0 ? (
            <Text style={styles.ipca}>
              {totalInvested === 0
                ? 'Adicione ativos pra comparar com a inflação.'
                : 'Aguarde pelo menos 30 dias de carteira pra ter uma comparação significativa.'}
            </Text>
          ) : (
            <>
              <Text style={styles.ipca}>
                Sua rentabilidade anualizada: <Text style={{ fontWeight: '700' }}>{annualizedPct.toFixed(2)}%</Text>
              </Text>
              <Text style={styles.ipca}>IPCA dos últimos 12 meses: {IPCA_12M}%</Text>
              <Text
                style={[
                  styles.ipcaVerdict,
                  { color: annualizedPct >= IPCA_12M ? colors.success : colors.danger },
                ]}
              >
                {annualizedPct >= IPCA_12M
                  ? `✅ Você está ${(annualizedPct - IPCA_12M).toFixed(2)} pontos acima da inflação`
                  : `⚠️ Você está ${(IPCA_12M - annualizedPct).toFixed(2)} pontos abaixo da inflação`}
              </Text>
              <Text style={styles.ipcaFootnote}>
                Anualização baseada em {Math.round(weightedDays)} dias de carteira (média ponderada).
              </Text>

              {/* Gráfico patrimônio × IPCA projetado */}
              {(() => {
                const comp = buildComparisonSeries(snapshots, IPCA_12M);
                if (!comp || comp.portfolio.length < 3) return null;
                return (
                  <View style={{ marginTop: spacing.md }}>
                    <BenchmarkSparkline
                      width={320}
                      height={110}
                      series={[
                        { label: 'Sua carteira', color: colors.primary, values: comp.portfolio },
                        { label: `IPCA (${IPCA_12M}% aa)`, color: colors.warning, values: comp.benchmark },
                      ]}
                      labels={[comp.labels[0], comp.labels[comp.labels.length - 1]]}
                    />
                  </View>
                );
              })()}
            </>
          )}
        </Card>

        {/* Bar chart de proventos — removido do Dashboard.
            Use a tab Proventos da Carteira pra ver os dados corretos. */}

        {/* Dividendos & Rentabilidade — removido do Dashboard.
            Valores eram estimativas que não batiam com o real.
            Use a tab Proventos da Carteira que mostra só recebimentos reais. */}
        {false && (activeWallet?.assets.length || 0) > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>💰 Dividendos & Rentabilidade</Text>
            </View>

            {/* Este mês */}
            <View style={styles.divThisMonth}>
              <Text style={styles.divMonthLabel}>{currentMonthName}</Text>
              <Text style={styles.divMonthValue}>{fmtBRL(dividendForecast.thisMonth, privacyMode)}</Text>
              {Object.keys(dividendForecast.thisMonthBySymbol).length > 0 ? (
                <View style={styles.divSymbolsRow}>
                  {Object.entries(dividendForecast.thisMonthBySymbol).map(([sym, val]) => (
                    <View key={sym} style={styles.divSymbolChip}>
                      <Text style={styles.divSymbolText}>{sym}</Text>
                      <Text style={styles.divSymbolValue}>{fmtBRL(val, privacyMode)}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.divEmpty}>Nenhum dos seus ativos paga em {currentMonthName}.</Text>
              )}
            </View>

            <View style={styles.divDivider} />

            {/* Recebido YTD + A receber */}
            <View style={styles.divRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.divRowLabel}>Recebido em {dividendForecast.currentYear}</Text>
                <Text style={styles.divRowValue}>{fmtBRL(dividendForecast.ytdReceived, privacyMode)}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.divRowLabel}>A receber até 31/dez</Text>
                <Text style={[styles.divRowValue, { color: colors.success }]}>
                  {fmtBRL(dividendForecast.remainingThisYear, privacyMode)}
                </Text>
              </View>
            </View>

            <View style={{ height: spacing.sm }} />
            <View style={styles.divRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.divRowLabel}>Total esperado em {dividendForecast.currentYear}</Text>
                <Text style={styles.divRowValue}>{fmtBRL(dividendForecast.totalThisYear, privacyMode)}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.divRowLabel}>DY da carteira</Text>
                <Text style={styles.divRowValue}>{dividendForecast.weightedDY.toFixed(2)}%</Text>
              </View>
            </View>

            <View style={styles.divDivider} />

            {/* Rentabilidade — adapta ao histórico disponível */}
            {hasEnoughHistory ? (
              <View style={styles.divRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.divRowLabel}>Rendimento ao mês</Text>
                  <Text style={[styles.divRowValue, { color: monthlyPct >= 0 ? colors.success : colors.danger }]}>
                    {monthlyPct >= 0 ? '+' : ''}{monthlyPct.toFixed(2)}%
                  </Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={styles.divRowLabel}>Rendimento ao ano</Text>
                  <Text style={[styles.divRowValue, { color: cappedAnnualized >= 0 ? colors.success : colors.danger }]}>
                    {cappedAnnualized >= 0 ? '+' : ''}{cappedAnnualized.toFixed(2)}%
                  </Text>
                </View>
              </View>
            ) : (
              <View>
                <View style={styles.divRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.divRowLabel}>Retorno até agora</Text>
                    <Text style={[styles.divRowValue, { color: profitPct >= 0 ? colors.success : colors.danger }]}>
                      {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(2)}%
                    </Text>
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.divRowLabel}>Dias de carteira</Text>
                    <Text style={styles.divRowValue}>{Math.round(weightedDays)} dia{Math.round(weightedDays) === 1 ? '' : 's'}</Text>
                  </View>
                </View>
                <Text style={styles.divFootnote}>
                  * Rentabilidade mensal/anual disponível após 30 dias de carteira pra evitar distorções.
                </Text>
              </View>
            )}
            <Text style={styles.divFootnote}>
              💡 Valores de dividendos baseados no DY atual de cada ativo. Pagamentos reais variam.
            </Text>
          </Card>
        )}

        {/* Comparação com Ibovespa */}
        {weightedDays >= 7 && totalInvested > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <IbovespaComparison
              portfolioReturnPct={profitPct}
              daysOfHistory={weightedDays}
              snapshots={snapshots}
            />
          </Card>
        )}

        {/* Próximos pagamentos — removido por inconsistência nos valores */}
        {false && upcomingPayments.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📅 Próximos pagamentos</Text>
            </View>
            {upcomingPayments.map((p, i) => (
              <View key={`${p.symbol}-${i}`} style={[styles.upcomingRow, i > 0 && styles.upcomingRowBorder]}>
                <View style={styles.upcomingLeft}>
                  {p.daysAhead <= 7 && <Text style={styles.upcomingFire}>🔜</Text>}
                  <Text style={styles.upcomingSymbol}>{p.symbol}</Text>
                  {p.isConfirmed && (
                    <View style={styles.confirmedBadge}>
                      <Ionicons name="checkmark" size={10} color={colors.textLight} />
                    </View>
                  )}
                </View>
                <View style={styles.upcomingMid}>
                  <Text style={styles.upcomingWhen}>{p.whenLabel}</Text>
                  <Text style={styles.upcomingDate}>
                    {p.isConfirmed ? '✓ ' : '~'}{formatDateBR(p.date)}
                  </Text>
                </View>
                <Text style={[styles.upcomingAmount, { color: colors.success }]}>
                  {fmtBRL(p.amount, privacyMode)}
                </Text>
              </View>
            ))}

            {/* Total somado dos pagamentos visíveis */}
            <View style={styles.upcomingTotalRow}>
              <Text style={styles.upcomingTotalLabel}>
                Total em {currentMonthName} ({upcomingPayments.length} pagamento{upcomingPayments.length === 1 ? '' : 's'})
              </Text>
              <Text style={styles.upcomingTotalValue}>
                {fmtBRL(upcomingPayments.reduce((sum, p) => sum + p.amount, 0), privacyMode)}
              </Text>
            </View>

            <Text style={styles.upcomingFootnote}>
              ✓ data confirmada oficialmente · ~ data estimada pelo padrão histórico
            </Text>
          </Card>
        )}

        {/* Meta de Dividendos */}
        {profile?.dividendTarget && totalCurrent > 0 && (() => {
          const autoRec = computeReceivedProventos(activeWallet?.assets || [], dividendInfoMap);
          const year = new Date().getFullYear();
          const ytd = autoRec.filter((p) => p.date.startsWith(String(year))).reduce((s, p) => s + p.amount, 0);
          // Meses elegíveis = do primeiro ativo cadastrado neste ano até agora, min 1.
          // Sem isso, cadastrar em julho ainda divide os proventos por 7 e distorce a média.
          const now = new Date();
          const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
          const firstAssetTs = (activeWallet?.assets || [])
            .map((a) => a.addedAt)
            .filter((t) => t && t >= startOfYear)
            .sort((a, b) => a - b)[0] || now.getTime();
          const firstDate = new Date(firstAssetTs);
          const monthsFromFirst = (now.getFullYear() - firstDate.getFullYear()) * 12
            + (now.getMonth() - firstDate.getMonth()) + 1;
          const monthsElapsed = Math.max(1, Math.min(12, monthsFromFirst));
          const progress = computeTargetProgress(
            profile.dividendTarget,
            totalCurrent,
            dividendForecast.weightedDY || 8,
            ytd,
            monthsElapsed,
          );
          if (!progress) return null;
          return (
            <View style={{ marginTop: spacing.md }}>
              <DividendTargetCard
                target={profile.dividendTarget}
                progress={progress}
                privacyMode={privacyMode}
                onPress={() => navigation.getParent()?.navigate('DividendTarget')}
              />
            </View>
          );
        })()}

        {!profile?.dividendTarget && totalCurrent > 0 && (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate('DividendTarget')}
            style={{ marginTop: spacing.md }}
          >
            <Card style={styles.targetEmptyCard}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.targetEmptyTitle}>Defina uma meta de renda passiva</Text>
                <Text style={styles.targetEmptyDesc}>
                  Ex: receber R$ 2.000/mês em dividendos. Vou te mostrar quanto falta e quais ativos te ajudam a chegar lá.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </Card>
          </TouchableOpacity>
        )}

        {/* Próxima meta — com emoji do milestone */}
        <Card style={{ marginTop: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 32, marginRight: spacing.sm }}>{goals.next.emoji || '🎯'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase' }}>Próxima meta</Text>
              <Text style={styles.goalLabel}>{goals.next.title || goals.next.label}</Text>
              {goals.next.desc && <Text style={{ fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 }}>{goals.next.desc}</Text>}
            </View>
          </View>
          <View style={styles.goalBar}>
            <View
              style={[
                styles.goalBarFill,
                { width: `${Math.min(100, (totalCurrent / goals.next.value) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.goalSub}>
            Falta {fmtCompactBRL(goals.next.value - totalCurrent, privacyMode)}
          </Text>
        </Card>

        {/* Assets list shortcut */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('Carteira')}
        >
          <Text style={styles.ctaText}>Ver carteira completa →</Text>
        </TouchableOpacity>

        {(!activeWallet || activeWallet.assets.length === 0) && (
          <Card style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>Comece sua carteira</Text>
            <Text style={styles.emptyDesc}>
              Adicione seus primeiros ativos pra ver a mágica acontecer.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Carteira')}
            >
              <Text style={styles.emptyBtnText}>+ Adicionar ativo</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Notícias do mercado (5 mais recentes) */}
        {news.length > 0 && (
          <Card style={{ marginTop: spacing.md }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>📰 Notícias do mercado</Text>
              <TouchableOpacity onPress={() => navigation.getParent()?.navigate('News')}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Ver tudo</Text>
              </TouchableOpacity>
            </View>
            {news.map((n, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => Linking.openURL(n.link)}
                style={{ paddingVertical: spacing.sm, borderBottomWidth: i < news.length - 1 ? 1 : 0, borderColor: colors.divider }}
              >
                <Text style={{ fontSize: fontSize.body, fontWeight: '600', color: colors.text }} numberOfLines={2}>
                  {n.title}
                </Text>
                {n.source && (
                  <Text style={{ fontSize: fontSize.tiny, color: colors.primary, marginTop: 4, fontWeight: '700' }}>
                    {n.source}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </Card>
        )}
      </ScrollView>

      {/* Popup auto ao bater meta nova */}
      <CelebrationModal
        visible={celebrateGoal !== null}
        goalValue={celebrateGoal?.value ?? null}
        goalLabel={celebrateGoal?.label || ''}
        variant="new"
        onClose={() => setCelebrateGoal(null)}
      />

      <AIFloatingButton />
    </SafeAreaView>
  );
}

function ShortcutTile({
  icon,
  label,
  color,
  onPress,
}: {
  icon: any;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={shortcutStyles.tile} onPress={onPress} activeOpacity={0.7}>
      <View style={[shortcutStyles.iconBox, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={shortcutStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function healthScoreColor(score: number) {
  if (score >= 8) return colors.success;
  if (score >= 5) return colors.warning;
  return colors.danger;
}

function daysAheadLabel(daysAhead: number): string {
  if (daysAhead < 0) return `${Math.abs(daysAhead)} dia${Math.abs(daysAhead) === 1 ? '' : 's'} atrás`;
  if (daysAhead === 0) return 'hoje';
  if (daysAhead === 1) return 'amanhã';
  if (daysAhead <= 30) return `em ${daysAhead} dias`;
  return `em ~${Math.round(daysAhead / 30)} ${Math.round(daysAhead / 30) === 1 ? 'mês' : 'meses'}`;
}

function impactBadgeColor(impact: 'alto' | 'médio' | 'baixo') {
  if (impact === 'alto') return { backgroundColor: colors.dangerLight };
  if (impact === 'médio') return { backgroundColor: colors.warningLight };
  return { backgroundColor: colors.surface };
}

const shortcutStyles = StyleSheet.create({
  tile: {
    width: '31%',
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  label: { fontSize: 11, color: colors.text, fontWeight: '700', textAlign: 'center' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  hello: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  subHello: { fontSize: fontSize.small, color: colors.textSecondary, textTransform: 'capitalize' },
  eyeBtn: { padding: spacing.sm, backgroundColor: colors.background, borderRadius: radius.pill },
  walletTabs: { marginBottom: spacing.sm },
  walletTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  walletTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  walletTabText: { color: colors.textSecondary, fontWeight: '500' },
  walletTabTextActive: { color: colors.textLight, fontWeight: '600' },
  marketRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  delayNote: { fontSize: 10, color: colors.textTertiary, fontStyle: 'italic', marginBottom: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: spacing.sm },
  marketText: { fontSize: fontSize.body, fontWeight: '600', color: colors.text },
  marketSub: { fontSize: fontSize.body, color: colors.textSecondary },
  heroCard: { backgroundColor: colors.primary, borderColor: colors.primary },
  heroGradient: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  heroLabel: { color: '#FFFFFFCC', fontSize: fontSize.body, fontWeight: '600' },
  heroValue: {
    color: colors.textLight,
    fontSize: fontSize.hero,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  heroChangePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroChange: { fontSize: fontSize.body, fontWeight: '700', color: colors.textLight },
  heroInvested: { color: '#FFFFFFAA', fontSize: fontSize.body, marginTop: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  healthRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' },
  healthScore: { fontSize: fontSize.hero, fontWeight: 'bold' },
  healthOutOf: { fontSize: fontSize.title, color: colors.textSecondary, marginLeft: 4 },
  healthLevel: { fontSize: fontSize.body, fontWeight: '600', marginLeft: spacing.sm },

  // Quote card
  quoteCard: { backgroundColor: colors.primaryLight, borderColor: colors.primaryAccent },
  quoteLabel: { fontSize: fontSize.body, fontWeight: '600', color: colors.primaryDark, marginBottom: spacing.sm },
  quoteText: { fontSize: fontSize.bodyLarge, color: colors.text, lineHeight: 22, fontStyle: 'italic' },
  quoteAuthor: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, fontWeight: '600' },

  // Coach
  coachBox: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderColor: colors.divider },
  coachLabel: { fontSize: fontSize.body, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  coachAction: { flexDirection: 'row', marginBottom: spacing.md },
  coachIcon: { fontSize: 24, marginRight: spacing.sm, marginTop: 2 },
  coachActionTitle: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 },
  coachActionTitleText: { fontSize: fontSize.body, fontWeight: '700', color: colors.text, marginRight: spacing.sm, flex: 1 },
  impactBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  impactText: { fontSize: fontSize.tiny, fontWeight: '700', color: colors.text, textTransform: 'uppercase' },
  coachActionDesc: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 18, marginTop: 2 },
  divThisMonth: { marginTop: spacing.sm },
  divMonthLabel: { fontSize: fontSize.small, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '700' },
  divMonthValue: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.success, marginTop: 2 },
  divSymbolsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  divSymbolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  divSymbolText: { fontSize: fontSize.tiny, fontWeight: '700', color: colors.text },
  divSymbolValue: { fontSize: fontSize.tiny, color: colors.textSecondary, marginLeft: 4 },
  divEmpty: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, fontStyle: 'italic' },
  divDivider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.md },
  divRow: { flexDirection: 'row', alignItems: 'center' },
  divRowLabel: { fontSize: fontSize.small, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600' },
  divRowValue: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, marginTop: 2 },
  divFootnote: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: spacing.sm, fontStyle: 'italic' },

  upcomingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  upcomingRowBorder: { borderTopWidth: 1, borderColor: colors.divider },
  upcomingLeft: { flexDirection: 'row', alignItems: 'center', width: 100 },
  upcomingFire: { fontSize: 16, marginRight: 4 },
  upcomingSymbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  upcomingMid: { flex: 1, paddingHorizontal: spacing.sm },
  upcomingWhen: { fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  upcomingDate: { fontSize: fontSize.tiny, color: colors.textTertiary },
  upcomingAmount: { fontSize: fontSize.bodyLarge, fontWeight: '700' },
  upcomingFootnote: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: spacing.sm, fontStyle: 'italic' },
  confirmedBadge: {
    backgroundColor: colors.success,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  upcomingTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 2,
    borderColor: colors.success,
  },
  upcomingTotalLabel: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  upcomingTotalValue: {
    fontSize: fontSize.title,
    color: colors.success,
    fontWeight: 'bold',
  },
  ipca: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  ipcaVerdict: { fontSize: fontSize.body, fontWeight: '600', marginTop: spacing.sm },
  ipcaFootnote: { fontSize: fontSize.tiny, color: colors.textTertiary, marginTop: spacing.xs, fontStyle: 'italic' },
  goalLabel: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.text, marginVertical: spacing.sm },
  goalBar: { height: 10, backgroundColor: colors.divider, borderRadius: 5, overflow: 'hidden' },
  goalBarFill: { height: 10, backgroundColor: colors.primary },
  goalSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs },
  cta: { padding: spacing.md, alignItems: 'center' },
  ctaText: { color: colors.primary, fontWeight: '600' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  emptyBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  emptyBtnText: { color: colors.textLight, fontWeight: '600' },
  darfAlertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
    marginBottom: spacing.md,
  },
  darfEmoji: { fontSize: 28, marginRight: spacing.sm },
  darfTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  darfDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  targetEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryAccent,
  },
  targetEmptyTitle: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  targetEmptyDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
});
