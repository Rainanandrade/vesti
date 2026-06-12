import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { computeAllocation, suggestAporte, Suggestion, Pick } from '../utils/allocation';
import { UNIVERSE, getCandidatesForProfile } from '../data/universe';
import { fetchAiSuggestion, AiSuggestion } from '../api/ai';
import { getBrokerById, brokerLimitations } from '../data/brokers';
import { bestBrokerForAsset } from '../utils/brokerMatch';
import Toast from '../components/Toast';
import Card from '../components/Card';
import Button from '../components/Button';
import { TICKERS, TickerInfo } from '../data/tickers';
import { evaluateAssetForProfile } from '../utils/strategyMatch';

const QUICK = [100, 300, 500, 1000];

export default function AporteScreen() {
  const { activeWallet, profile, privacyMode, addAsset } = useApp();
  const [value, setValue] = useState('');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [buying, setBuying] = useState<{ symbol: string; name: string; amount: number; type: any } | null>(null);
  const [buyQty, setBuyQty] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [confirming, setConfirming] = useState(false);

  // IA
  const [aiResult, setAiResult] = useState<AiSuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

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
    const q = await fetchQuotes(symbols);
    const map: Record<string, number> = {};
    q.forEach((x) => (map[x.symbol] = x.regularMarketPrice));
    setPrices(map);
  }, [activeWallet]);

  useEffect(() => {
    loadPrices();
  }, [loadPrices]);

  const numeric = parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;

  const result = useMemo(() => {
    if (!profile || !activeWallet || numeric < 1) return null;
    // Combina preços da carteira + preços do universo pra filtrar por orçamento
    const combinedPrices = { ...universePrices, ...prices };
    return suggestAporte(numeric, activeWallet.assets, combinedPrices, profile);
  }, [numeric, activeWallet, prices, universePrices, profile]);

  const current = useMemo(
    () => computeAllocation(activeWallet?.assets || [], prices),
    [activeWallet, prices],
  );

  const handleSimulate = async () => {
    if (numeric < 1) return;
    setShowSuggestions(true);
    setAiResult(null);
    setAiError(null);
    setBought(new Set());

    // Pré-busca preços dos top candidatos pra filtrar sugestões por orçamento
    if (profile) {
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
        const map: Record<string, number> = {};
        fetched.forEach((q) => (map[q.symbol] = q.regularMarketPrice));
        setUniversePrices((prev) => ({ ...prev, ...map }));
      }
    }
  };

  const handleAi = async () => {
    if (!profile || !activeWallet || numeric < 1) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const brokers = userBrokerIds.map(getBrokerById).filter((b): b is any => !!b);
      const result = await fetchAiSuggestion({
        amount: numeric,
        profile,
        currentAssets: activeWallet.assets.map((a) => ({
          symbol: a.symbol,
          name: a.name,
          quantity: a.quantity,
          avgPrice: a.avgPrice,
          type: a.type,
        })),
        brokers:
          brokers.length > 0
            ? brokers.map((b) => ({
                id: b.id,
                name: b.name,
                limitations: brokerLimitations(b).join(', ') || 'sem limitações relevantes',
              }))
            : undefined,
      });
      setAiResult(result);
    } catch (e: any) {
      setAiError(e?.message || 'Erro ao consultar IA');
    } finally {
      setAiLoading(false);
    }
  };

  const reset = () => {
    setValue('');
    setShowSuggestions(false);
    setAiResult(null);
    setAiError(null);
    setBought(new Set());
  };

  const openBuy = async (symbol: string, name: string, amount: number, classType?: Suggestion['class']) => {
    const tickerInfo = TICKERS.find((t) => t.symbol === symbol);
    const type: any =
      classType === 'renda_fixa' || (!tickerInfo && classType !== 'internacional')
        ? 'tesouro'
        : tickerInfo?.type || 'outro';
    setBuying({ symbol, name, amount, type });
    if (tickerInfo) {
      const q = await fetchQuotes([symbol]);
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
    if (!buying || !activeWallet) return;
    const qty = parseFloat(buyQty.replace(',', '.'));
    const pr = parseFloat(buyPrice.replace(',', '.'));
    if (!isFinite(qty) || qty <= 0) {
      Alert.alert('Atenção', 'Quantidade inválida');
      return;
    }
    if (!isFinite(pr) || pr <= 0) {
      Alert.alert('Atenção', 'Preço inválido');
      return;
    }
    setConfirming(true);
    try {
      await addAsset(activeWallet.id, {
        symbol: buying.symbol,
        name: buying.name,
        type: buying.type,
        quantity: qty,
        avgPrice: pr,
        addedAt: Date.now(),
      });
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
      await loadPrices();
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível adicionar.');
    } finally {
      setConfirming(false);
    }
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.pageTitle}>Aportar</Text>
          <Text style={styles.pageSub}>
            Diga quanto você vai investir e eu sugiro como distribuir conforme seu perfil <Text style={styles.bold}>{profile.type}</Text>.
          </Text>

          <Card style={styles.inputCard}>
            <Text style={styles.inputLabel}>Quanto você quer aportar?</Text>
            <View style={styles.inputRow}>
              <Text style={styles.currency}>R$</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                value={value}
                onChangeText={(t) => {
                  setValue(t);
                  setShowSuggestions(false);
                  setAiResult(null);
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
                    setValue(String(v));
                    setShowSuggestions(false);
                    setAiResult(null);
                  }}
                >
                  <Text style={styles.quickText}>R$ {v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button
              title="Sugerir distribuição"
              onPress={handleSimulate}
              disabled={numeric < 1}
              style={{ marginTop: spacing.md }}
            />
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={handleAi}
              disabled={numeric < 1 || aiLoading}
            >
              {aiLoading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Text style={styles.aiBtnIcon}>✨</Text>
                  <Text style={styles.aiBtnText}>Análise inteligente com IA</Text>
                </>
              )}
            </TouchableOpacity>
          </Card>

          {/* Resultado IA */}
          {aiResult && (
            <>
              <Text style={styles.sectionTitle}>✨ Análise da IA</Text>
              <Card style={styles.aiResultCard}>
                <Text style={styles.aiSummary}>{aiResult.summary}</Text>
              </Card>

              {/* Agrupa picks da IA por classe e renderiza com PickCard (análise completa) */}
              {(['renda_fixa', 'renda_variavel', 'internacional'] as const).map((cls) => {
                const classPicks = aiResult.picks.filter((p) => p.classKey === cls && !bought.has(p.symbol));
                if (classPicks.length === 0) return null;
                const total = classPicks.reduce((s, p) => s + p.amount, 0);
                const classLabel = classPicks[0].classLabel;
                const pillColor: any = {
                  renda_fixa: { backgroundColor: colors.primaryLight, color: colors.primary },
                  renda_variavel: { backgroundColor: colors.successLight, color: colors.success },
                  internacional: { backgroundColor: colors.warningLight, color: colors.warning },
                }[cls];

                return (
                  <View key={cls} style={{ marginBottom: spacing.lg }}>
                    <View style={styles.sectionHeader}>
                      <View style={[styles.classPill, { backgroundColor: pillColor.backgroundColor }]}>
                        <Text style={[styles.classPillText, { color: pillColor.color }]}>{classLabel}</Text>
                      </View>
                      <Text style={styles.sectionHeaderAmount}>{fmtBRL(total, privacyMode)}</Text>
                    </View>
                    {classPicks.map((p, i) => {
                      const isTradeable = !!TICKERS.find((t) => t.symbol === p.symbol);
                      const pick: Pick = {
                        symbol: p.symbol,
                        name: p.name || p.symbol,
                        amount: p.amount,
                        reason: p.reasoning,
                        roleLabel: p.role,
                        isTradeable,
                        isExisting: false,
                      };
                      return (
                        <PickCard
                          key={`${p.symbol}-${i}`}
                          pick={pick}
                          profile={profile}
                          onBuy={(s, n, a) => openBuy(s, n, a, cls)}
                          privacyMode={privacyMode}
                          userBrokerIds={userBrokerIds}
                          assetType={p.classKey === 'renda_fixa' ? 'tesouro' : undefined}
                        />
                      );
                    })}
                  </View>
                );
              })}

              <View style={styles.aiFooter}>
                <Ionicons name="sparkles" size={14} color={colors.primary} />
                <Text style={styles.aiFooterText}>
                  Análise gerada por IA (Llama 3.3 70B via Groq), baseada em cotações ao vivo e fundamentos atuais
                </Text>
              </View>

              <Button title="Nova simulação" variant="ghost" onPress={reset} style={{ marginTop: spacing.md }} />
            </>
          )}

          {aiError && (
            <View style={styles.aiErrorBox}>
              <Ionicons name="alert-circle" size={18} color={colors.warning} />
              <Text style={styles.aiErrorText}>{aiError}</Text>
            </View>
          )}

          {/* Resultado heurístico */}
          {showSuggestions && !aiResult && result && (
            <>
              <Text style={styles.sectionTitle}>Sugestão pra esse aporte</Text>
              <Text style={styles.sectionSub}>
                Distribuído entre as 3 classes conforme seu perfil {profile.type}, considerando o que você já tem.
              </Text>

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

              {result.suggestions.every((s) => s.picks.every((p) => bought.has(p.symbol))) && (
                <View style={styles.allBoughtBox}>
                  <Text style={styles.allBoughtEmoji}>🎉</Text>
                  <Text style={styles.allBoughtText}>
                    Você executou todas as sugestões deste aporte! Bom trabalho.
                  </Text>
                </View>
              )}

              <Text style={styles.sectionTitle}>Carteira depois</Text>
              <Card>
                <Text style={styles.allocTitle}>Alocação alvo (perfil {profile.type})</Text>
                <AllocBar
                  rf={result.targetPct.renda_fixa}
                  rv={result.targetPct.renda_variavel}
                  intl={result.targetPct.internacional}
                />
                <View style={{ height: spacing.md }} />
                <Text style={styles.allocTitle}>Como sua carteira ficará</Text>
                <AllocBar
                  rf={result.afterPct.renda_fixa}
                  rv={result.afterPct.renda_variavel}
                  intl={result.afterPct.internacional}
                />
                <View style={styles.legendRow}>
                  <Legend color={colors.primary} label={`RF ${result.afterPct.renda_fixa.toFixed(0)}%`} />
                  <Legend color={colors.success} label={`RV ${result.afterPct.renda_variavel.toFixed(0)}%`} />
                  <Legend color={colors.warning} label={`Int ${result.afterPct.internacional.toFixed(0)}%`} />
                </View>
              </Card>

              <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.disclaimerText}>
                  Sugestões educativas, baseadas no seu perfil e no que já está na carteira. Não são recomendações personalizadas de investimento.
                </Text>
              </View>

              <Button title="Nova simulação" variant="ghost" onPress={reset} style={{ marginTop: spacing.md }} />
            </>
          )}

          {!showSuggestions && !aiResult && current.total > 0 && (
            <>
              <Text style={styles.sectionTitle}>Sua carteira hoje</Text>
              <Card>
                <Text style={styles.allocTitle}>Patrimônio: {fmtBRL(current.total, privacyMode)}</Text>
                <AllocBar
                  rf={current.currentPct.renda_fixa}
                  rv={current.currentPct.renda_variavel}
                  intl={current.currentPct.internacional}
                />
                <View style={styles.legendRow}>
                  <Legend color={colors.primary} label={`RF ${current.currentPct.renda_fixa.toFixed(0)}%`} />
                  <Legend color={colors.success} label={`RV ${current.currentPct.renda_variavel.toFixed(0)}%`} />
                  <Legend color={colors.warning} label={`Int ${current.currentPct.internacional.toFixed(0)}%`} />
                </View>
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Comprei */}
      <Modal visible={buying !== null} transparent animationType="slide" onRequestClose={() => setBuying(null)}>
        <Pressable style={styles.backdrop} onPress={() => setBuying(null)}>
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
              keyboardType="decimal-pad"
              placeholder="0"
            />

            <Text style={styles.modalLabel}>Preço pago por unidade (R$)</Text>
            <TextInput
              style={styles.modalInput}
              value={buyPrice}
              onChangeText={setBuyPrice}
              keyboardType="decimal-pad"
              placeholder="0,00"
            />

            <View style={styles.totalLine}>
              <Text style={styles.totalLabel}>Total investido:</Text>
              <Text style={styles.totalValue}>
                {fmtBRL(
                  (parseFloat(buyQty.replace(',', '.')) || 0) *
                    (parseFloat(buyPrice.replace(',', '.')) || 0),
                )}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', marginTop: spacing.md }}>
              <Button title="Cancelar" variant="ghost" onPress={() => setBuying(null)} style={{ flex: 1 }} />
              <Button title="Adicionar" onPress={confirmBuy} loading={confirming} style={{ flex: 1 }} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} />
    </SafeAreaView>
  );
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
    Promise.all([fetchQuotes([pick.symbol]), fetchAssetDetails(pick.symbol)]).then(([q, d]) => {
      if (cancelled) return;
      setLivePrice(q[0]?.regularMarketPrice ?? null);
      setDetails(d);
      setLoading(false);
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
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  pageTitle: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  pageSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 20 },
  bold: { fontWeight: '700', color: colors.primary, textTransform: 'capitalize' },

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

  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.sm,
  },
  aiBtnIcon: { fontSize: 16, marginRight: 6 },
  aiBtnText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.body },

  aiErrorBox: {
    flexDirection: 'row',
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  aiErrorText: { flex: 1, fontSize: fontSize.body, color: colors.text, marginLeft: spacing.sm, lineHeight: 18 },

  aiResultCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary, marginBottom: spacing.md },
  aiSummary: { fontSize: fontSize.bodyLarge, color: colors.text, lineHeight: 22, fontStyle: 'italic' },
  aiFooter: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, paddingHorizontal: spacing.sm },
  aiFooterText: { flex: 1, fontSize: fontSize.tiny, color: colors.textTertiary, marginLeft: 4, lineHeight: 14 },

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
