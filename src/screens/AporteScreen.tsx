import { useCallback, useEffect, useMemo, useState } from 'react';
import { editorial } from '../theme/editorial';
import { EditorialState } from '../ui/editorial';
import {
  ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fetchQuotes } from '../api/brapi';
import { fetchAssetDetails, AssetDetails } from '../api/yahooDetails';
import { fmtBRL } from '../utils/format';
import { buildContributionPlan, computeAllocation, getProfileTarget, Suggestion, Pick } from '../utils/allocation';
import { getCandidatesForProfile } from '../data/universe';
import { bestBrokerForAsset } from '../utils/brokerMatch';
import Toast from '../components/Toast';
import { formatCurrencyInput, parseFormattedNumber } from '../utils/numberFormat';
import Card from '../components/Card';
import Button from '../components/Button';
import { TICKERS, TickerInfo } from '../data/tickers';
import { evaluateAssetForProfile } from '../utils/strategyMatch';
import AllocationDelta from '../components/AllocationDelta';
import HowItWorksAporte from '../components/HowItWorksAporte';
import { safeBackToInvestir } from '../utils/navigation';
import { PREFERENCE_INFO } from '../data/profileQuiz';
const { submitOperationWithDeadline } = require('../utils/operationSubmission');

const QUICK = [100, 300, 500, 1000];

function createClientRequestId(): string {
  const cryptoApi = (globalThis as any).crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    return (char === 'x' ? value : (value & 0x3) | 0x8).toString(16);
  });
}

export default function AporteScreen({ navigation }: any) {
  const { activeWallet, ensureActiveWallet, profile, privacyMode, addAsset, recordOperationAndUpdatePosition } = useApp();
  const [value, setValue] = useState('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [buying, setBuying] = useState<{ symbol: string; name: string; amount: number; type: any } | null>(null);
  const [buyQty, setBuyQty] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [buyRequestId, setBuyRequestId] = useState(() => createClientRequestId());
  const [buyRequestLocked, setBuyRequestLocked] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  const [refreshingQuotes, setRefreshingQuotes] = useState(false);

  // Comprados nesta sessão (pra esconder da lista de sugestões)
  const [bought, setBought] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  // Preços do universo (pra filtrar sugestões por orçamento)
  const [universePrices, setUniversePrices] = useState<Record<string, number>>({});

  // Corretoras do usuário (legado brokerId + atual brokerIds)
  const userBrokerIds: string[] =
    profile?.brokerIds || (profile?.brokerId ? [profile.brokerId] : []);

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  };

  const loadPrices = useCallback(async () => {
    if (!activeWallet) return;
    const symbols = activeWallet.assets
      .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
      .map((a) => a.symbol);
    try {
      const q = await fetchQuotes(symbols);
      const map: Record<string, number> = {};
      q.forEach((x) => (map[x.symbol] = x.regularMarketPrice));
      setPrices(map);
    } catch {
      // A sugestão continua usando preços médios quando a cotação está indisponível.
    }
  }, [activeWallet]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const numeric = parseFormattedNumber(value);

  const result = useMemo(() => {
    if (!profile || !activeWallet || numeric < 1) return null;
    // Combina preços da carteira + preços do universo pra filtrar por orçamento
    const combinedPrices = { ...universePrices, ...prices };
    return buildContributionPlan(numeric, activeWallet.assets, combinedPrices, profile);
  }, [numeric, activeWallet, prices, universePrices, profile]);

  const current = useMemo(
    () => computeAllocation(activeWallet?.assets || [], prices),
    [activeWallet, prices],
  );

  const handleBuildPlan = async () => {
    if (!profile || !activeWallet || numeric < 1) return;
    setShowSuggestions(true);
    setBought(new Set());
    setRefreshingQuotes(true);

    try {
      const candidates = new Set<string>();
      (['renda_variavel', 'internacional'] as const).forEach((cls) => {
        const top = getCandidatesForProfile(profile.type, cls, 0, profile.preference);
        top.slice(0, 15).forEach((c) => candidates.add(c.asset.symbol));
      });
      const symbols = Array.from(candidates).filter(
        (s) => !(s in prices) && !(s in universePrices),
      );
      if (symbols.length > 0) {
        const fetched = await fetchQuotes(symbols);
        const fetchedPriceMap: Record<string, number> = {};
        fetched.forEach((q) => (fetchedPriceMap[q.symbol] = q.regularMarketPrice));
        setUniversePrices((prev) => ({ ...prev, ...fetchedPriceMap }));
      }
    } catch {
      // O plano local já foi exibido; cotações são apenas um enriquecimento opcional.
    } finally {
      setRefreshingQuotes(false);
    }
  };

  const reset = () => {
    setValue('');
    setShowSuggestions(false);
    setBought(new Set());
  };

  const openBuy = async (symbol: string, name: string, amount: number, classType?: Suggestion['class']) => {
    const tickerInfo = TICKERS.find((t) => t.symbol === symbol);
    const type: any =
      classType === 'renda_fixa' || (!tickerInfo && classType !== 'internacional')
        ? 'tesouro'
        : tickerInfo?.type || 'outro';
    setBuying({ symbol, name, amount, type });
    setBuyRequestId(createClientRequestId());
    setBuyRequestLocked(false);
    setBuyError(null);
    if (tickerInfo) {
      const q = await fetchQuotes([symbol]).catch(() => []);
      const price = q[0]?.regularMarketPrice;
      if (price) {
        setBuyPrice(price.toFixed(2).replace('.', ','));
        setBuyQty((amount / price).toFixed(2).replace('.', ','));
      } else {
        setBuyPrice('');
        setBuyQty('1');
      }
    } else {
      setBuyPrice(amount.toFixed(2).replace('.', ','));
      setBuyQty('1');
    }
  };

  const confirmBuy = async () => {
    if (!buying) return;
    const qty = parseFloat(buyQty.replace(',', '.'));
    const pr = parseFormattedNumber(buyPrice);
    if (!isFinite(qty) || qty <= 0) {
      Alert.alert('Atenção', 'Quantidade inválida');
      return;
    }
    if (!isFinite(pr) || pr <= 0) {
      Alert.alert('Atenção', 'Preço inválido');
      return;
    }
    setConfirming(true);
    setBuyError(null);
    let mutationStarted = false;
    try {
      const targetWallet = activeWallet && !activeWallet.readOnly ? activeWallet : await ensureActiveWallet();
      if (['acao', 'fii', 'etf'].includes(buying.type)) {
        const isoDate = new Date().toISOString().slice(0, 10);
        const payloadHash = JSON.stringify({ walletId: targetWallet.id, side: 'buy', assetKind: buying.type, sym: buying.symbol, qty, pr, isoDate });
        setBuyRequestLocked(true);
        mutationStarted = true;
        await submitOperationWithDeadline(() => recordOperationAndUpdatePosition({
          clientRequestId: buyRequestId, payloadHash, walletId: targetWallet.id, type: 'buy', symbol: buying.symbol,
          assetType: buying.type, quantity: qty, price: pr, date: isoDate, name: buying.name,
        }));
      } else {
        await addAsset(targetWallet.id, {
          symbol: buying.symbol,
          name: buying.name,
          type: buying.type,
          quantity: qty,
          avgPrice: pr,
          addedAt: Date.now(),
        });
      }
      // Marca como comprado pra remover da lista de sugestões
      setBought((prev) => {
        const next = new Set(prev);
        next.add(buying.symbol);
        return next;
      });
      showToast(`✅ ${buying.symbol} adicionado à carteira`);
      setBuying(null);
      setBuyQty('');
      setBuyPrice('');
      setBuyRequestLocked(false);
      setBuyRequestId(createClientRequestId());
      setBuyError(null);
      await loadPrices();
    } catch (e: any) {
      if (!mutationStarted) setBuyRequestLocked(false);
      setBuyError(e?.message || 'Não foi possível adicionar. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  };

  const closeBuy = () => {
    if (buyRequestLocked) {
      Alert.alert('Confirmação pendente', 'A tentativa já foi enviada. Toque em “Confirmar novamente” para consultar o mesmo registro sem duplicar a compra.');
      return;
    }
    setBuying(null);
    setBuyError(null);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <AporteHeader navigation={navigation} />
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧭</Text>
          <Text style={styles.emptyTitle}>Falta seu perfil</Text>
          <Text style={styles.emptyDesc}>
            Pra sugerir um aporte preciso saber seu perfil. Refaça o quiz no início.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <AporteHeader navigation={navigation} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>💰 Novo aporte</Text>
          <Text style={styles.pageSub}>
            Você diz quanto vai investir. O Vesti cruza seu perfil <Text style={styles.bold}>{profile.type}</Text>, o foco <Text style={styles.bold}>{profile.preference || 'sem preferência'}</Text> e os desvios da carteira para montar um plano transparente.
          </Text>
          <View style={styles.focusBanner}><Ionicons name="options-outline" size={18} color={editorial.color.indigo} /><View style={{ flex: 1 }}><Text style={styles.focusTitle}>Sugestão baseada no seu perfil e foco</Text><Text style={styles.focusText}>{profile.type.charAt(0).toUpperCase() + profile.type.slice(1)} · {PREFERENCE_INFO[profile.preference || 'sem_preferencia'].label}. A distribuição também corrige os desvios da sua carteira atual.</Text></View></View>

          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Quanto você quer aportar?</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currency}>R$</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={value}
                onChangeText={(t) => {
                  setValue(formatCurrencyInput(t));
                  setShowSuggestions(false);
                }}
                keyboardType="decimal-pad"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.quickRow}>
              {QUICK.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={styles.quickChip}
                  onPress={() => {
                    // Converte pra centavos pra reusar a função de formatação
                    setValue(formatCurrencyInput((v * 100).toString()));
                    setShowSuggestions(false);
                  }}
                >
                  <Text style={styles.quickText}>R$ {v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Preview do valor — mostra o significado do aporte na carteira */}
            {numeric >= 1 && current.total > 0 && (
              <View style={styles.previewBox}>
                <Ionicons name="calculator-outline" size={14} color={colors.primary} />
                <Text style={styles.previewText}>
                  Esse aporte representa <Text style={{ fontWeight: '800', color: colors.text }}>
                    {((numeric / (current.total + numeric)) * 100).toFixed(1)}%
                  </Text> da sua carteira nova (patrimônio total ficará {fmtBRL(current.total + numeric, privacyMode)}).
                </Text>
              </View>
            )}

            <Button
              title="Montar meu plano"
              onPress={handleBuildPlan}
              disabled={numeric < 1}
              style={{ marginTop: spacing.md }}
            />
            <Text style={styles.analysisHint}>Cálculo local e gratuito · funciona mesmo sem internet.</Text>
          </Card>

          {showSuggestions && result && (
            <>
              <Text style={styles.sectionTitle}>Plano de Aporte Vesti</Text>
              <Card style={styles.planSummaryCard}>
                <Text style={styles.planSummaryTitle}>Perfil {profile.type} · {PREFERENCE_INFO[profile.preference || 'sem_preferencia'].label}</Text>
                <Text style={styles.planSummaryText}>O valor foi direcionado primeiro às classes mais abaixo da sua meta. Classes já acima do alvo não recebem aporte apenas para repetir uma porcentagem fixa.</Text>
                {refreshingQuotes ? <View style={styles.quoteRefresh}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.quoteRefreshText}>Atualizando cotações sem interromper o plano…</Text></View> : null}
              </Card>

              {result.suggestions.length === 0 ? (
                <EditorialState kind="empty" title="Aporte pequeno para os ativos disponíveis" detail="Aumente o valor ou registre o aporte manualmente. O plano não vai inventar uma compra que não cabe no orçamento." />
              ) : null}

              {result.suggestions.map((s) => {
                const visiblePicks = s.picks.filter((p) => !bought.has(p.symbol));
                if (visiblePicks.length === 0) return null;
                return (
                  <SuggestionSection
                    key={s.class}
                    s={{ ...s, picks: visiblePicks }}
                    privacyMode={privacyMode}
                    profile={profile}
                    onBuy={(sym, name, amount) => openBuy(sym, name, amount, s.class)}
                    userBrokerIds={userBrokerIds}
                  />
                );
              })}

              {result.suggestions.length > 0 && result.suggestions.every((s) => s.picks.every((p) => bought.has(p.symbol))) && (
                <View style={styles.allBoughtBox}>
                  <Text style={styles.allBoughtEmoji}>🎉</Text>
                  <Text style={styles.allBoughtText}>
                    Você executou todas as sugestões deste aporte! Bom trabalho.
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Como sua carteira fica depois</Text>
              <Card>
                <AllocationDelta
                  currentPct={result.afterPct}
                  targetPct={result.targetPct}
                  showTitle={false}
                />
              </Card>

              <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.disclaimerText}>
                  Este plano tem caráter educativo e não constitui recomendação de compra. Confira riscos, custos e adequação ao seu perfil antes de investir.
                </Text>
              </View>

              <Button title="Nova simulação" variant="ghost" onPress={reset} style={{ marginTop: spacing.md }} />
            </>
          )}

          {!showSuggestions && current.total > 0 && (() => {
            const finalTarget = getProfileTarget(profile);

            return (
              <>
                <Card style={{ marginTop: spacing.md }}>
                  <View style={styles.walletHeader}>
                    <Text style={styles.walletLabel}>PATRIMÔNIO ATUAL</Text>
                    <Text style={styles.walletValue}>{fmtBRL(current.total, privacyMode)}</Text>
                  </View>
                  <AllocationDelta
                    currentPct={current.currentPct}
                    targetPct={finalTarget}
                  />
                </Card>

                {/* Insight rápido: onde tá desbalanceado */}
                {(() => {
                  const gaps = [
                    { key: 'renda_fixa' as const, label: 'Renda Fixa', diff: finalTarget.renda_fixa - current.currentPct.renda_fixa },
                    { key: 'renda_variavel' as const, label: 'Renda Variável', diff: finalTarget.renda_variavel - current.currentPct.renda_variavel },
                    { key: 'internacional' as const, label: 'Internacional', diff: finalTarget.internacional - current.currentPct.internacional },
                  ];
                  const maxGap = gaps.reduce((max, g) => g.diff > max.diff ? g : max, gaps[0]);
                  if (maxGap.diff < 3) return null;
                  return (
                    <View style={styles.insightBox}>
                      <Ionicons name="bulb" size={16} color={colors.warning} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.insightTitle}>💡 Dica pro próximo aporte</Text>
                        <Text style={styles.insightText}>
                          Sua carteira está com <Text style={{ fontWeight: '800' }}>{maxGap.diff.toFixed(1)} pontos abaixo</Text> da meta em <Text style={{ fontWeight: '800' }}>{maxGap.label}</Text>. Considere aportar mais nessa classe pra rebalancear.
                        </Text>
                      </View>
                    </View>
                  );
                })()}

                <HowItWorksAporte />
              </>
            );
          })()}

          {!showSuggestions && current.total === 0 && (
            <HowItWorksAporte />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Comprei */}
      <Modal visible={buying !== null} transparent animationType="slide" onRequestClose={closeBuy}>
        <Pressable style={styles.backdrop} onPress={closeBuy}>
          <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Confirmar compra</Text>
            <Text style={styles.modalSub}>
              {buying?.symbol} — {buying?.name}
            </Text>
            <Text style={styles.modalHelp}>
              Digite a quantidade que comprou e o preço pago (já incluindo taxas de corretagem, se houver).
            </Text>

            <Text style={styles.modalLabel}>Quantidade</Text>
            <TextInput
              style={styles.modalInput}
              value={buyQty}
              onChangeText={setBuyQty}
              editable={!buyRequestLocked}
              keyboardType="decimal-pad"
              placeholder="0"
            />

            <Text style={styles.modalLabel}>Preço pago por unidade (R$)</Text>
            <TextInput
              style={styles.modalInput}
              value={buyPrice}
              onChangeText={(t) => setBuyPrice(formatCurrencyInput(t))}
              editable={!buyRequestLocked}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />

            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total investido:</Text>
              <Text style={styles.totalValue}>
                {fmtBRL(
                  (parseFloat(buyQty.replace(',', '.')) || 0) * parseFormattedNumber(buyPrice),
                )}
              </Text>
            </View>

            {buyError ? <Text style={styles.buyError}>{buyError}</Text> : null}

            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
              <Button title="Cancelar" variant="ghost" onPress={closeBuy} disabled={buyRequestLocked} style={{ flex: 1 }} />
              <Button title={buyRequestLocked ? 'Confirmar novamente' : 'Adicionar'} onPress={confirmBuy} loading={confirming} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} />
    </SafeAreaView>
  );
}

function AporteHeader({ navigation }: { navigation: any }) {
  return <View style={styles.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar para Investir" onPress={() => safeBackToInvestir(navigation)} style={styles.backButton} hitSlop={10}><Ionicons name="arrow-back" size={22} color={editorial.color.ink} /></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.headerKicker}>Investir</Text><Text style={styles.headerTitle}>Plano de aporte</Text></View><View style={styles.headerSpacer} /></View>;
}

// ===========================================
// SUGGESTION SECTION — classe com múltiplos picks
// ===========================================

function SuggestionSection({
  s,
  privacyMode,
  profile,
  onBuy,
  userBrokerIds,
}: {
  s: Suggestion;
  privacyMode: boolean;
  profile: any;
  onBuy: (symbol: string, name: string, amount: number) => void;
  userBrokerIds: string[];
}) {
  const pillColor: any = {
    renda_fixa: { backgroundColor: colors.primaryLight, color: colors.primary },
    renda_variavel: { backgroundColor: colors.successLight, color: colors.success },
    internacional: { backgroundColor: colors.warningLight, color: colors.warning },
  }[s.class];

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <View style={styles.sectionHeader}>
        <View style={[styles.classPill, { backgroundColor: pillColor.backgroundColor }]}>
          <Text style={[styles.classPillText, { color: pillColor.color }]}>{s.classLabel}</Text>
        </View>
        <Text style={styles.sectionHeaderAmount}>{fmtBRL(s.totalAmount, privacyMode)}</Text>
      </View>
      {s.picks.map((p, i) => (
        <PickCard
          key={`${p.symbol}-${i}`}
          pick={p}
          profile={profile}
          onBuy={onBuy}
          privacyMode={privacyMode}
          userBrokerIds={userBrokerIds}
          assetType={s.class === 'renda_fixa' ? 'tesouro' : undefined}
        />
      ))}
    </View>
  );
}

// Card de um pick individual com análise
function PickCard({
  pick,
  profile,
  onBuy,
  privacyMode,
  userBrokerIds,
  assetType,
}: {
  pick: Pick;
  profile: any;
  onBuy: (symbol: string, name: string, amount: number) => void;
  privacyMode: boolean;
  userBrokerIds: string[];
  assetType?: string;
}) {
  const brokerHint = bestBrokerForAsset(pick.symbol, assetType, userBrokerIds);
  const [details, setDetails] = useState<AssetDetails | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const tickerInfo: TickerInfo | undefined = TICKERS.find((t) => t.symbol === pick.symbol);

  useEffect(() => {
    if (!pick.isTradeable || !tickerInfo) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchQuotes([pick.symbol]), fetchAssetDetails(pick.symbol)])
      .then(([q, d]) => {
        if (cancelled) return;
        setLivePrice(q[0]?.regularMarketPrice ?? null);
        setDetails(d);
      })
      .catch(() => {
        if (cancelled) return;
        setLivePrice(null);
        setDetails(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pick.symbol, pick.isTradeable, tickerInfo]);

  const match = tickerInfo ? evaluateAssetForProfile(tickerInfo, details, profile) : null;
  const fitColor = match
    ? match.fitScore >= 70
      ? colors.success
      : match.fitScore >= 50
        ? colors.warning
        : colors.danger
    : colors.textSecondary;

  const tickerType = tickerInfo?.type;
  const showIndicators = (key: string) => {
    if (!details) return false;
    if (tickerType === 'fii') return ['DY', 'P/VP', 'P/L'].includes(key);
    if (tickerType === 'etf') return ['DY'].includes(key);
    return true;
  };

  return (
    <Card style={styles.pickCard}>
      {/* HEADER limpo */}
      <View style={styles.pickHeaderClean}>
        <Text style={styles.roleLabel}>{pick.roleLabel}</Text>
        <Text style={styles.pickAmountClean}>{fmtBRL(pick.amount, privacyMode)}</Text>
      </View>

      <View style={styles.pickTitleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pickedSymbol}>{pick.symbol}</Text>
          {pick.name !== pick.symbol && (
            <Text style={styles.pickedName} numberOfLines={1}>
              {pick.name}
            </Text>
          )}
        </View>
        {livePrice !== null && (
          <View style={styles.pickPriceBox}>
            <Text style={styles.livePriceLabelClean}>Cotação</Text>
            <Text style={styles.livePriceValueClean}>{fmtBRL(livePrice)}</Text>
          </View>
        )}
      </View>

      {/* Quantidade — mostra cotas inteiras OU "R$ X de ATIVO" se for fracionário */}
      {livePrice !== null && pick.isTradeable && (() => {
        const cotas = Math.floor(pick.amount / livePrice);
        const isFractional = brokerHint.broker?.features.internacional_direto && cotas === 0;
        if (cotas >= 1) {
          const sobra = pick.amount - cotas * livePrice;
          return (
            <View style={styles.quantityBox}>
              <Text style={styles.quantityLabel}>Com {fmtBRL(pick.amount, privacyMode)} você compra:</Text>
              <Text style={styles.quantityValue}>
                {cotas} cota{cotas === 1 ? '' : 's'}
              </Text>
              <Text style={styles.quantitySub}>
                Total: {fmtBRL(cotas * livePrice, privacyMode)} · sobra {fmtBRL(sobra, privacyMode)}
              </Text>
            </View>
          );
        }
        if (isFractional) {
          return (
            <View style={styles.quantityBox}>
              <Text style={styles.quantityLabel}>Como sua corretora aceita fracionário:</Text>
              <Text style={styles.quantityValue}>
                Compre {fmtBRL(pick.amount, privacyMode)} de {pick.symbol}
              </Text>
              <Text style={styles.quantitySub}>
                Equivalente a ~{(pick.amount / livePrice).toFixed(3)} cota da fração
              </Text>
            </View>
          );
        }
        return (
          <View style={[styles.quantityBox, { backgroundColor: colors.warningLight }]}>
            <Text style={[styles.quantityLabel, { color: colors.warning }]}>
              ⚠️ Valor insuficiente
            </Text>
            <Text style={[styles.quantityValue, { color: colors.warning }]}>
              {pick.symbol} custa {fmtBRL(livePrice)} · falta {fmtBRL(livePrice - pick.amount, privacyMode)}
            </Text>
          </View>
        );
      })()}

      <Text style={styles.pickReason}>{pick.reason}</Text>

      {pick.isExisting && (
        <View style={styles.existingTag}>
          <Ionicons name="refresh" size={12} color={colors.primary} />
          <Text style={styles.existingText}>Reforço de posição</Text>
        </View>
      )}

      {/* Análise */}
      {pick.isTradeable && tickerInfo && match && (
        <View style={styles.analysisBox}>
          <View style={styles.fitRow}>
            <View style={[styles.fitBadge, { backgroundColor: fitColor }]}>
              <Text style={styles.fitBadgeText}>{match.fitScore}/100</Text>
            </View>
            <Text style={[styles.fitLabel, { color: fitColor }]}>{match.fitLabel}</Text>
          </View>

          <Text style={styles.assetTypeLabel}>
            {tickerType === 'fii' ? '🏢 Fundo Imobiliário' : tickerType === 'etf' ? '📊 ETF (cesta diversificada)' : '📈 Ação'}
          </Text>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Buscando dados...</Text>
            </View>
          ) : details ? (
            <>
              <View style={styles.indicatorsRow}>
                {showIndicators('P/L') && details.trailingPE != null && details.trailingPE > 0 && (
                  <Indicator label="P/L" value={details.trailingPE.toFixed(1)} />
                )}
                {showIndicators('DY') && details.dividendYield != null && details.dividendYield > 0 && (
                  <Indicator label="DY" value={`${details.dividendYield.toFixed(1)}%`} />
                )}
                {showIndicators('ROE') && details.returnOnEquity != null && details.returnOnEquity > 0 && (
                  <Indicator label="ROE" value={`${details.returnOnEquity.toFixed(1)}%`} />
                )}
                {showIndicators('P/VP') && details.priceToBook != null && (
                  <Indicator label="P/VP" value={details.priceToBook.toFixed(2)} />
                )}
                {showIndicators('Beta') && details.beta != null && (
                  <Indicator label="Beta" value={details.beta.toFixed(2)} />
                )}
              </View>
              {details.sector && (
                <Text style={styles.sectorText}>📍 {details.sector}</Text>
              )}
            </>
          ) : null}

          {match.positives.length > 0 && (
            <View style={styles.flagsRow}>
              {match.positives.slice(0, 2).map((p, i) => (
                <Text key={i} style={[styles.flagText, { color: colors.success }]}>
                  ✓ {p}
                </Text>
              ))}
            </View>
          )}
          {match.warnings.length > 0 && (
            <View style={styles.flagsRow}>
              {match.warnings.slice(0, 2).map((w, i) => (
                <Text key={i} style={[styles.flagText, { color: colors.warning }]}>
                  ⚠ {w}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Broker hint */}
      {userBrokerIds.length > 0 && (
        <>
          {brokerHint.broker ? (
            <View style={styles.brokerHintBox}>
              <Ionicons name="business-outline" size={14} color={colors.primary} />
              <Text style={styles.brokerHintText}>
                Compre na <Text style={styles.brokerHintBold}>{brokerHint.broker.name}</Text>
                <Text style={styles.brokerHintReason}> · {brokerHint.reason}</Text>
              </Text>
            </View>
          ) : (
            <View style={styles.brokerHintBoxWarn}>
              <Ionicons name="warning-outline" size={14} color={colors.warning} />
              <View style={{ flex: 1, marginLeft: 6 }}>
                <Text style={styles.brokerHintTextWarn}>{brokerHint.reason}</Text>
                {brokerHint.externalSuggestion && brokerHint.externalSuggestion.length > 0 && (
                  <Text style={styles.brokerHintExternal}>
                    Considere abrir conta em{' '}
                    <Text style={styles.brokerHintBold}>
                      {brokerHint.externalSuggestion.map((b) => b.name).join(', ')}
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          )}
        </>
      )}

      <TouchableOpacity style={styles.buyBtn} onPress={() => onBuy(pick.symbol, pick.name, pick.amount)}>
        <Ionicons name="checkmark-circle" size={16} color={colors.textLight} />
        <Text style={styles.buyBtnText}>Comprei essa</Text>
      </TouchableOpacity>
    </Card>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.indicator}>
      <Text style={styles.indicatorLabel}>{label}</Text>
      <Text style={styles.indicatorValue}>{value}</Text>
    </View>
  );
}

function AllocBar({ rf, rv, intl }: { rf: number; rv: number; intl: number }) {
  return (
    <View style={styles.bar}>
      {rf > 0 && <View style={[styles.barFill, { flex: rf, backgroundColor: colors.primary }]} />}
      {rv > 0 && <View style={[styles.barFill, { flex: rv, backgroundColor: colors.success }]} />}
      {intl > 0 && <View style={[styles.barFill, { flex: intl, backgroundColor: colors.warning }]} />}
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  analysisHint: { color: colors.textTertiary, fontSize: fontSize.tiny, lineHeight: 17, textAlign: 'center', marginTop: spacing.sm },
  safe: { flex: 1, backgroundColor: editorial.color.canvas },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: editorial.color.line },
  backButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: editorial.color.line, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, alignItems: 'center' },
  headerKicker: { color: editorial.color.coral, fontSize: editorial.type.kicker, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  headerTitle: { color: editorial.color.ink, fontFamily: editorial.font.display, fontSize: editorial.type.title },
  headerSpacer: { width: 44 },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  pageTitle: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  pageSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  bold: { fontWeight: '700', color: colors.primary, textTransform: 'capitalize' },
  focusBanner: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, backgroundColor: editorial.color.indigoSoft, borderRadius: editorial.radius.soft },
  focusTitle: { color: editorial.color.ink, fontSize: editorial.type.body, fontWeight: '800' },
  focusText: { color: editorial.color.muted, fontSize: editorial.type.caption, lineHeight: 18, marginTop: 2 },

  inputCard: { marginTop: spacing.md, padding: spacing.lg },
  inputLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  currency: { fontSize: fontSize.title, fontWeight: '600', color: colors.textSecondary, marginRight: spacing.sm, marginBottom: 6 },
  input: { flex: 1, fontSize: fontSize.hero, fontWeight: 'bold', color: colors.text, paddingVertical: 0 },
  quickRow: { flexDirection: 'row', marginTop: spacing.md, flexWrap: 'wrap' },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickText: { fontSize: fontSize.body, color: colors.text, fontWeight: '500' },

  planSummaryCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary, marginBottom: spacing.md },
  planSummaryTitle: { fontSize: fontSize.bodyLarge, color: colors.text, fontWeight: '800' },
  planSummaryText: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20, marginTop: spacing.xs },
  quoteRefresh: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  quoteRefreshText: { flex: 1, fontSize: fontSize.tiny, color: colors.textTertiary, marginLeft: spacing.xs },

  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionSub: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.md },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionHeaderAmount: { fontSize: fontSize.bodyLarge, fontWeight: 'bold', color: colors.text },

  classPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill },
  classPillText: { fontSize: fontSize.tiny, fontWeight: '700', textTransform: 'uppercase' },

  suggestionCard: { marginBottom: spacing.md, padding: spacing.md },
  suggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  suggestionAmount: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },

  pickCard: { padding: spacing.md, marginBottom: spacing.sm },
  pickHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  roleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleLabel: { fontSize: fontSize.tiny, color: colors.textSecondary, fontWeight: '700', textTransform: 'uppercase' },
  pickAmount: { fontSize: fontSize.bodyLarge, fontWeight: 'bold', color: colors.text },

  pickedSymbol: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.primary, marginTop: 4 },
  pickedName: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 2 },
  pickReason: { fontSize: fontSize.body, color: colors.text, marginTop: spacing.xs, lineHeight: 18 },

  livePriceLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase' },
  livePriceValue: { fontSize: fontSize.bodyLarge, fontWeight: 'bold', color: colors.text },

  quantityBox: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
  },
  quantityLabel: { fontSize: fontSize.small, color: colors.textSecondary },
  quantityValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.success, marginTop: 2 },
  quantitySub: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '500' },

  existingTag: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  existingText: { fontSize: fontSize.tiny, color: colors.primary, fontWeight: '600', marginLeft: 4 },

  loadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  loadingText: { marginLeft: spacing.xs, fontSize: fontSize.small, color: colors.textSecondary },

  analysisBox: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.md,
  },
  fitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  fitBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  fitBadgeText: { color: colors.textLight, fontSize: fontSize.small, fontWeight: '700' },
  fitLabel: { fontSize: fontSize.body, fontWeight: '600', marginLeft: spacing.sm },
  assetTypeLabel: { fontSize: fontSize.small, color: colors.textSecondary, marginVertical: spacing.xs, fontWeight: '600' },

  indicatorsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  indicator: { marginRight: spacing.md, marginBottom: spacing.xs },
  indicatorLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '600' },
  indicatorValue: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },

  sectorText: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: spacing.xs },

  flagsRow: { marginTop: spacing.xs },
  flagText: { fontSize: fontSize.small, marginVertical: 1, lineHeight: 16 },

  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  buyBtnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.body, marginLeft: 6 },

  allocTitle: { fontSize: fontSize.body, color: colors.textSecondary, marginBottom: spacing.sm },
  walletHeader: { marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider },
  walletLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase' },
  walletValue: { fontSize: fontSize.heading, fontWeight: '900', color: colors.text, marginTop: 4 },
  insightBox: { flexDirection: 'row', gap: spacing.sm as any, backgroundColor: colors.warningLight, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.sm, marginBottom: spacing.sm, borderLeftWidth: 3, borderLeftColor: colors.warning },
  insightTitle: { fontSize: fontSize.small, fontWeight: '800', color: colors.text },
  insightText: { fontSize: fontSize.small, color: colors.text, marginTop: 4, lineHeight: 18 },
  previewBox: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, backgroundColor: colors.primaryLight, padding: spacing.sm, borderRadius: radius.md, marginTop: spacing.md },
  previewText: { flex: 1, fontSize: fontSize.small, color: colors.textSecondary, lineHeight: 18 },
  bar: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: colors.divider },
  barFill: { height: 14 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.sm },
  legend: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 4 },
  legendLabel: { fontSize: fontSize.small, color: colors.textSecondary },

  disclaimer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  disclaimerText: { flex: 1, fontSize: fontSize.small, color: colors.textSecondary, marginLeft: spacing.sm, lineHeight: 18 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  emptyEmoji: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  emptyDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
  },
  modalTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  modalSub: { fontSize: fontSize.body, color: colors.primary, fontWeight: '600', marginTop: 2 },
  modalHelp: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  modalLabel: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.md, marginBottom: 4 },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.bodyLarge,
    color: colors.text,
  },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md },
  buyError: { color: colors.danger, fontSize: fontSize.small, lineHeight: 18, marginTop: spacing.md },
  totalLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  totalValue: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },

  brokerHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  brokerHintBoxWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  brokerHintText: { flex: 1, fontSize: fontSize.small, color: colors.text, marginLeft: 6, lineHeight: 18 },
  brokerHintReason: { color: colors.textSecondary },
  brokerHintTextWarn: { fontSize: fontSize.small, color: colors.text, lineHeight: 18, fontWeight: '600' },
  brokerHintExternal: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  brokerHintBold: { fontWeight: '700', color: colors.primary },

  // Layout limpo do pick
  pickHeaderClean: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  pickAmountClean: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
  pickTitleRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  pickPriceBox: { alignItems: 'flex-end', marginLeft: spacing.sm },
  livePriceLabelClean: { fontSize: fontSize.tiny, color: colors.textTertiary, textTransform: 'uppercase' },
  livePriceValueClean: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },

  allBoughtBox: {
    backgroundColor: colors.successLight,
    padding: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  allBoughtEmoji: { fontSize: 48, marginBottom: spacing.sm },
  allBoughtText: { fontSize: fontSize.bodyLarge, color: colors.text, textAlign: 'center', fontWeight: '600' },
});
