import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

function ToolChip({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={toolStyles.chip} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={toolStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fetchQuotes, Quote } from '../api/brapi';
import { fmtBRL, fmtPct } from '../utils/format';
import Card from '../components/Card';
import { fetchDividendInfoBatch, DividendInfo, formatNextPayment, formatDateBR, frequencyLabel } from '../api/dividends';
import AIFloatingButton from '../components/AIFloatingButton';
import { confirmAction } from '../utils/confirm';
import PortfolioTabs, { PortfolioTabKey } from '../components/PortfolioTabs';
import { computeReceivedProventos, groupProventosByMonth } from '../utils/receivedProventos';
import { MONTH_NAMES_PT } from '../data/dividends';
import IbovespaComparison from '../components/IbovespaComparison';
import { computePortfolioStats } from '../utils/portfolio';
import PortfolioChart from '../components/PortfolioChart';
import AllocationConfig from '../components/AllocationConfig';
import TabPlaceholder from '../components/TabPlaceholder';
import PremiumLockModal from '../components/PremiumLockModal';
import AssetClassCards from '../components/AssetClassCards';
import PortfolioDonut from '../components/PortfolioDonut';
import NewOperationModal from '../components/NewOperationModal';
import { useOperationModal } from '../context/OperationModalContext';

export default function PortfolioScreen({ navigation }: any) {
  const { activeWallet, privacyMode, removeAsset, snapshots, profile } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [dividends, setDividends] = useState<Record<string, DividendInfo | null>>({});
  const [tab, setTab] = useState<PortfolioTabKey>('resumo');
  const [proventosExpanded, setProventosExpanded] = useState<Record<string, boolean>>({});
  const [premiumOpen, setPremiumOpen] = useState(false);
  const opModal = useOperationModal();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!activeWallet) return;
    const symbols = activeWallet.assets
      .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
      .map((a) => a.symbol);
    const data = await fetchQuotes(symbols);
    const map: Record<string, Quote> = {};
    data.forEach((q) => (map[q.symbol] = q));
    setQuotes(map);

    // Histórico de dividendos pra mostrar próximo pagamento
    const divMap = await fetchDividendInfoBatch(symbols);
    setDividends(divMap);
  }, [activeWallet]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRemove = (symbol: string) => {
    confirmAction(
      'Remover ativo',
      `Tem certeza que deseja remover ${symbol}?`,
      async () => {
        if (!activeWallet) return;
        try {
          await removeAsset(activeWallet.id, symbol);
        } catch (e: any) {
          Alert.alert('Não foi possível excluir', e?.message || 'Tente novamente.');
        }
      },
      { confirmLabel: 'Remover', destructive: true },
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{activeWallet?.name || 'Carteira'}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={[styles.addBtn, styles.watchBtn]}
            onPress={() => navigation.navigate('Watchlist')}
          >
            <Ionicons name="eye-outline" size={18} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>Acompanho</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => opModal.open()}
          >
            <Ionicons name="add" size={22} color={colors.textLight} />
            <Text style={styles.addBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero: patrimônio — só no Resumo, evita espaço vazio em outras tabs */}
      {tab === 'resumo' && activeWallet && activeWallet.assets.length > 0 && (() => {
        const totalCurrent = activeWallet.assets.reduce((s, a) => {
          const p = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
          return s + p * a.quantity;
        }, 0);
        const totalInvested = activeWallet.assets.reduce((s, a) => s + a.avgPrice * a.quantity, 0);
        const profit = totalCurrent - totalInvested;
        const pct = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
        return (
          <View style={styles.heroWrap}>
            <Text style={styles.heroLabel}>Patrimônio</Text>
            <View style={styles.heroRow}>
              <Text style={styles.heroValue}>{fmtBRL(totalCurrent, privacyMode)}</Text>
              <Text style={[styles.heroPct, { color: pct >= 0 ? colors.success : colors.danger }]}>
                {pct >= 0 ? '↑' : '↓'} {fmtPct(pct, privacyMode)}
              </Text>
            </View>
            <Text style={styles.heroInvested}>
              Investido {fmtBRL(totalInvested, privacyMode)} · L/P {fmtBRL(profit, privacyMode)}
            </Text>
          </View>
        );
      })()}

      {/* Tabs: Resumo · Proventos · Rentabilidade */}
      <PortfolioTabs active={tab} onChange={setTab} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ============ TAB PROVENTOS ============ */}
        {tab === 'proventos' && (() => {
          const auto = computeReceivedProventos(activeWallet?.assets || [], dividends);
          const byMonth = groupProventosByMonth(auto);
          const y = new Date().getFullYear();
          const totalYear = auto.filter((p) => p.date.startsWith(String(y))).reduce((s, p) => s + p.amount, 0);
          const limit12 = new Date(); limit12.setMonth(limit12.getMonth() - 12);
          const iso12 = limit12.toISOString().slice(0, 10);
          const total12 = auto.filter((p) => p.date >= iso12).reduce((s, p) => s + p.amount, 0);
          return (
            <>
              <Card style={{ flexDirection: 'row', marginBottom: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase' }}>Recebido em {y}</Text>
                  <Text style={{ fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, marginTop: 2 }}>{fmtBRL(totalYear, privacyMode)}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700', textTransform: 'uppercase' }}>Últimos 12 meses</Text>
                  <Text style={{ fontSize: fontSize.title, fontWeight: 'bold', color: colors.success, marginTop: 2 }}>{fmtBRL(total12, privacyMode)}</Text>
                </View>
              </Card>
              {byMonth.length === 0 && (
                <Card style={{ alignItems: 'center', padding: spacing.lg }}>
                  <Text style={{ fontSize: 32 }}>💰</Text>
                  <Text style={{ fontSize: fontSize.bodyLarge, color: colors.text, marginTop: spacing.sm, fontWeight: '700' }}>Sem proventos ainda</Text>
                  <Text style={{ fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs }}>
                    Assim que seus ativos pagarem, aparecerão aqui automaticamente.
                  </Text>
                </Card>
              )}
              {byMonth.map(({ monthKey, total, items }) => {
                const [yy, mm] = monthKey.split('-');
                const label = `${MONTH_NAMES_PT[Number(mm) - 1]}/${yy}`;
                const isOpen = proventosExpanded[monthKey];
                return (
                  <Card key={monthKey} style={{ marginBottom: spacing.sm, padding: 0 }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md }}
                      onPress={() => setProventosExpanded((p) => ({ ...p, [monthKey]: !p[monthKey] }))}
                    >
                      <Text style={{ fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, textTransform: 'capitalize' }}>{label}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.success }}>{fmtBRL(total, privacyMode)}</Text>
                        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textTertiary} style={{ marginLeft: 8 }} />
                      </View>
                    </TouchableOpacity>
                    {isOpen && (
                      <View style={{ borderTopWidth: 1, borderColor: colors.divider, padding: spacing.md }}>
                        {items.map((p, i) => (
                          <View key={`${p.symbol}-${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                            <Text style={{ fontWeight: '700', color: colors.text }}>{p.symbol}</Text>
                            <Text style={{ color: colors.success, fontWeight: '700' }}>{fmtBRL(p.amount, privacyMode)}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Card>
                );
              })}
            </>
          );
        })()}

        {/* ============ TAB RENTABILIDADE ============ */}
        {tab === 'rentabilidade' && (() => {
          const priceMap = Object.fromEntries(Object.entries(quotes).map(([k, v]) => [k, v.regularMarketPrice]));
          const stats = computePortfolioStats(activeWallet?.assets || [], priceMap);
          return (
            <>
              <Card style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>📈 Rentabilidade</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700' }}>RETORNO TOTAL</Text>
                    <Text style={{ fontSize: fontSize.title, fontWeight: 'bold', color: stats.profitPct >= 0 ? colors.success : colors.danger, marginTop: 2 }}>
                      {fmtPct(stats.profitPct, privacyMode)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '700' }}>DIAS DE CARTEIRA</Text>
                    <Text style={{ fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, marginTop: 2 }}>{Math.round(stats.weightedDays)}</Text>
                  </View>
                </View>
              </Card>
              {stats.weightedDays >= 7 && (
                <Card>
                  <IbovespaComparison portfolioReturnPct={stats.profitPct} daysOfHistory={stats.weightedDays} />
                </Card>
              )}
            </>
          );
        })()}

        {/* ============ TAB PATRIMÔNIO ============ */}
        {tab === 'patrimonio' && (() => {
          // Consolidado: cada ativo com seu peso
          const assetsList = (activeWallet?.assets || []).map((a) => {
            const p = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
            return { label: a.symbol, value: p * a.quantity };
          }).filter((d) => d.value > 0);

          // Por tipo: agrupa
          const byTypeMap = new Map<string, number>();
          for (const d of (activeWallet?.assets || [])) {
            const p = quotes[d.symbol]?.regularMarketPrice ?? d.avgPrice;
            const v = p * d.quantity;
            const lbl = d.type === 'acao' ? 'Ações' : d.type === 'fii' ? 'FIIs' : d.type === 'etf' ? 'ETFs' : d.type === 'tesouro' ? 'Tesouro' : d.type === 'cdb' ? 'Renda Fixa' : 'Outros';
            byTypeMap.set(lbl, (byTypeMap.get(lbl) || 0) + v);
          }
          const byType = Array.from(byTypeMap.entries()).map(([label, value]) => ({ label, value }));

          return (
            <>
              <Card style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.sm }}>📊 Evolução do patrimônio</Text>
                <PortfolioChart data={snapshots.map((s) => ({ date: s.date, total: s.total }))} privacyMode={privacyMode} />
              </Card>

              <Card style={{ marginBottom: spacing.md }}>
                <Text style={{ fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text, letterSpacing: 1, marginBottom: spacing.md }}>CONSOLIDADO</Text>
                <PortfolioDonut data={assetsList} />
              </Card>

              {byType.length > 0 && (
                <Card>
                  <Text style={{ fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text, letterSpacing: 1, marginBottom: spacing.md }}>POR TIPO</Text>
                  <PortfolioDonut data={byType} />
                </Card>
              )}
            </>
          );
        })()}

        {/* ============ TAB ANÁLISE ============ */}
        {tab === 'analise' && (
          <View>
            <Card style={{ alignItems: 'center', padding: spacing.lg, marginBottom: spacing.md }}>
              <Ionicons name="sparkles" size={36} color={colors.primary} />
              <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm }}>Diagnóstico IA</Text>
              <Text style={{ fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 }}>
                Análise completa da sua carteira pelo Gestor IA: pontos fortes, riscos e próximos passos.
              </Text>
              <TouchableOpacity
                style={{ marginTop: spacing.md, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center' }}
                onPress={() => navigation.getParent()?.getParent()?.navigate('AIHub')}
              >
                <Ionicons name="sparkles" size={16} color={colors.textLight} />
                <Text style={{ color: colors.textLight, fontWeight: '700', marginLeft: 6 }}>Abrir Gestor IA</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* ============ TAB METAS ============ */}
        {tab === 'metas' && (
          <View>
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>🎯 Suas metas</Text>
              <Text style={{ fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs }}>
                Acompanhe progresso, conquistas e meta de renda passiva.
              </Text>
              <TouchableOpacity
                style={{ marginTop: spacing.md, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md }}
                onPress={() => navigation.getParent()?.navigate('Metas')}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', textAlign: 'center' }}>Ver todas as metas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginTop: spacing.sm, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md }}
                onPress={() => navigation.getParent()?.getParent()?.navigate('DividendTarget')}
              >
                <Text style={{ color: colors.textLight, fontWeight: '700', textAlign: 'center' }}>Meta de renda passiva</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* ============ TAB LANÇAMENTOS ============ */}
        {tab === 'lancamentos' && (
          <Card style={{ alignItems: 'center', padding: spacing.lg }}>
            <Ionicons name="swap-vertical-outline" size={36} color={colors.primary} />
            <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: spacing.sm }}>Operações</Text>
            <Text style={{ fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm }}>
              Registre suas compras e vendas pra cálculo automático do isentômetro e IR.
            </Text>
            <TouchableOpacity
              style={{ marginTop: spacing.md, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill }}
              onPress={() => navigation.navigate('Operacoes')}
            >
              <Text style={{ color: colors.textLight, fontWeight: '700' }}>Abrir lançamentos</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* ============ TAB INTEGRAÇÕES ============ */}
        {tab === 'integracoes' && (
          <View>
            <Card style={{ borderColor: colors.primary, borderWidth: 1, marginBottom: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sync-circle-outline" size={36} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text }}>Sincronizar com a B3</Text>
                    <View style={{ marginLeft: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                      <Text style={{ color: colors.textLight, fontSize: 10, fontWeight: '800' }}>PRO</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 }}>
                    Importa todos os ativos automaticamente. Sem digitação.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={{ marginTop: spacing.md, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
                onPress={() => setPremiumOpen(true)}
              >
                <Ionicons name="link" size={16} color={colors.textLight} />
                <Text style={{ color: colors.textLight, fontWeight: '700', marginLeft: 6 }}>Conectar com a B3</Text>
              </TouchableOpacity>
            </Card>
            <TabPlaceholder icon="receipt-outline" title="Outras integrações" description="Em breve: Nubank, Inter, XP e outros bancos/corretoras." />
          </View>
        )}

        {/* ============ TAB IRPF ============ */}
        {tab === 'irpf' && (
          <View>
            <Card style={{ marginBottom: spacing.md }}>
              <Text style={{ fontSize: fontSize.title, fontWeight: '700', color: colors.text }}>📋 Imposto de Renda</Text>
              <Text style={{ fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 }}>
                Tudo pra você não pagar nem mais nem menos: isentômetro, DARF mensal e relatório anual.
              </Text>
              <View style={{ marginTop: spacing.md, gap: spacing.sm as any }}>
                <TouchableOpacity
                  style={{ backgroundColor: colors.warning, padding: spacing.md, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => navigation.navigate('IRCalculator')}
                >
                  <Ionicons name="calculator-outline" size={18} color={colors.textLight} />
                  <Text style={{ color: colors.textLight, fontWeight: '700', marginLeft: 6 }}>IR mensal · gerar DARF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ marginTop: spacing.sm, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => navigation.navigate('Declaracao')}
                >
                  <Ionicons name="document-text-outline" size={18} color={colors.textLight} />
                  <Text style={{ color: colors.textLight, fontWeight: '700', marginLeft: 6 }}>Declaração anual · resumo</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </View>
        )}

        {/* ============ TAB CONFIGURAÇÕES (ALOCAÇÃO ALVO) ============ */}
        {tab === 'config' && (
          <AllocationConfig />
        )}

        {/* ============ TAB RESUMO ============ */}
        {tab === 'resumo' && (
          <>
            {/* Header com contador + botão preto destacado */}
            {activeWallet && activeWallet.assets.length > 0 && (
              <View style={styles.resumoHeader}>
                <Text style={styles.resumoTitle}>Meus ativos ({activeWallet.assets.length})</Text>
                <TouchableOpacity style={styles.addAssetBtn} onPress={() => opModal.open()}>
                  <Ionicons name="add" size={18} color={colors.textLight} />
                  <Text style={styles.addAssetText}>Adicionar ativo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Cards agrupados por classe — estilo Investidor 10 */}
            {activeWallet && activeWallet.assets.length > 0 && (
              <AssetClassCards
                wallet={activeWallet}
                quotes={quotes}
                profile={profile}
                privacyMode={privacyMode}
                onOpenClass={(cls) =>
                  navigation.getParent()?.navigate('AssetsList', { classFilter: cls })
                }
              />
            )}

            {(!activeWallet || activeWallet.assets.length === 0) && (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>📈</Text>
                <Text style={styles.emptyTitle}>Carteira vazia</Text>
                <Text style={styles.emptyDesc}>
                  Toque em "Adicionar" pra começar a registrar seus ativos.
                </Text>
                <TouchableOpacity style={styles.addAssetBtn} onPress={() => opModal.open()}>
                  <Ionicons name="add" size={18} color={colors.textLight} />
                  <Text style={styles.addAssetText}>Adicionar ativo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Lista flat antiga — escondida quando tem AssetClassCards */}
            {false && activeWallet?.assets.map((a) => {
          const q = quotes[a.symbol];
          const price = q?.regularMarketPrice ?? a.avgPrice;
          const total = price * a.quantity;
          const invested = a.avgPrice * a.quantity;
          const profit = total - invested;
          const profitPct = invested > 0 ? (profit / invested) * 100 : 0;
          const dayChange = q?.regularMarketChangePercent ?? 0;

          return (
            <TouchableOpacity
              key={a.symbol}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('EditAsset', { symbol: a.symbol })}
            >
              <Card style={{ marginBottom: spacing.sm }}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTop}>
                      <Text style={styles.symbol}>{a.symbol}</Text>
                      <View style={[styles.typePill, typePillColor(a.type)]}>
                        <Text style={styles.typeText}>{typeLabel(a.type)}</Text>
                      </View>
                    </View>
                    <Text style={styles.subText}>
                      {a.quantity} × {fmtBRL(price, privacyMode)}
                      {q && (
                        <Text style={{ color: dayChange >= 0 ? colors.success : colors.danger }}>
                          {'  '}({fmtPct(dayChange, privacyMode)} hoje)
                        </Text>
                      )}
                    </Text>
                    {dividends[a.symbol] && (
                      <View style={styles.dividendRow}>
                        <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                        <Text style={styles.dividendText}>
                          {frequencyLabel(dividends[a.symbol]!.frequency)} · próximo {formatNextPayment(dividends[a.symbol]!).whenLabel}
                          {dividends[a.symbol]!.nextEstimatedAmount > 0 && (
                            <Text style={styles.dividendValue}>
                              {' '}· ~{fmtBRL(dividends[a.symbol]!.nextEstimatedAmount * a.quantity, privacyMode)}
                            </Text>
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{fmtBRL(total, privacyMode)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.totalLabel}>Lucro/Prejuízo</Text>
                  <Text
                    style={[
                      styles.totalValue,
                      { color: profit >= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {fmtBRL(profit, privacyMode)}
                  </Text>
                  <Text
                    style={[
                      styles.profitPct,
                      { color: profit >= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {fmtPct(profitPct, privacyMode)}
                  </Text>
                </View>
              </View>
              </Card>
            </TouchableOpacity>
          );
        })}
          </>
        )}
      </ScrollView>
      <AIFloatingButton />
      <PremiumLockModal
        visible={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        title="Sincronização com a B3"
        description="A integração permite importar todos os seus ativos automaticamente, sem digitação manual. Estamos validando segurança e estabilidade antes de liberar."
        feature="A sincronização com a B3"
      />

    </SafeAreaView>
  );
}

function ShortcutChip({ icon, label, color, onPress }: { icon: any; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={chipStyles.tile} activeOpacity={0.7}>
      <View style={[chipStyles.iconBox, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={chipStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const chipStyles = StyleSheet.create({
  tile: { width: '31%', backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.sm, alignItems: 'center', marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.divider },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  label: { fontSize: 11, color: colors.text, fontWeight: '700', textAlign: 'center' },
});

function typeLabel(t: string): string {
  return {
    acao: 'Ação',
    fii: 'FII',
    etf: 'ETF',
    tesouro: 'Tesouro',
    cdb: 'CDB',
    outro: 'Outro',
  }[t] || t;
}

function typePillColor(t: string) {
  const colorsMap: Record<string, any> = {
    acao: { backgroundColor: colors.primaryLight },
    fii: { backgroundColor: colors.warningLight },
    etf: { backgroundColor: colors.successLight },
    tesouro: { backgroundColor: '#F3E8FF' },
    cdb: { backgroundColor: '#FEF3C7' },
    outro: { backgroundColor: colors.surface },
  };
  return colorsMap[t] || { backgroundColor: colors.surface };
}

const toolStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  label: { color: colors.primary, fontWeight: '700', fontSize: fontSize.small, marginLeft: 4 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  toolsRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  watchBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: spacing.sm,
  },
  addBtnText: { color: colors.textLight, fontWeight: '600', marginLeft: 4 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  symbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  typePill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, marginLeft: spacing.sm },
  typeText: { fontSize: fontSize.tiny, fontWeight: '600', color: colors.text },
  subText: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  dividendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dividendText: { fontSize: fontSize.small, color: colors.textSecondary, marginLeft: 4 },
  dividendValue: { color: colors.success, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
  profitPct: { fontSize: fontSize.small, fontWeight: '600', marginTop: 2 },
  heroWrap: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  heroLabel: { fontSize: fontSize.tiny, color: colors.primaryDark, fontWeight: '700', textTransform: 'uppercase' },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  heroValue: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text, flex: 1 },
  heroPct: { fontSize: fontSize.bodyLarge, fontWeight: '700' },
  heroInvested: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4 },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.md },
  resumoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resumoTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  addAssetBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.text, paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: 10 },
  addAssetText: { color: colors.textLight, fontWeight: '700', marginLeft: 6 },
});
