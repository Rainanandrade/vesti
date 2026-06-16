import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { fetchQuotes, Quote } from '../api/brapi';
import { computePortfolioStats } from '../utils/portfolio';
import { fetchAiDiagnostic } from '../api/ai';
import Card from '../components/Card';

const SUGGESTIONS = [
  'Minha carteira tá bem diversificada?',
  'Vale mais a pena dividendos ou crescimento agora?',
  'Como melhorar meus dividendos mensais?',
  'Tô concentrado demais em algum setor?',
  'Preciso adicionar internacional?',
  'O que faço com R$ 500 sobrando este mês?',
  'Minha rentabilidade tá boa pro perfil?',
  'Faz sentido vender algo agora?',
];

export default function AIHubScreen({ navigation }: any) {
  const { activeWallet, profile, proventos } = useApp();
  const [diagnostic, setDiagnostic] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestionSeed, setSuggestionSeed] = useState(0);

  const rotativeSuggestions = useMemo(() => {
    // 4 sugestões aleatórias — embaralha quando seed muda (Recarregar)
    const shuffled = [...SUGGESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestionSeed]);

  const tickerChips = useMemo(
    () => (activeWallet?.assets || []).filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf'),
    [activeWallet],
  );

  const runDiagnostic = async (extraQuestion?: string) => {
    if (!profile) {
      Alert.alert('Faltam dados', 'Complete o perfil pra ter um diagnóstico personalizado.');
      return;
    }
    if (!activeWallet || activeWallet.assets.length === 0) {
      Alert.alert('Carteira vazia', 'Adicione ao menos 1 ativo pra o diagnóstico fazer sentido.');
      return;
    }
    setLoading(true);
    setDiagnostic(null);
    try {
      const symbols = activeWallet.assets
        .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
        .map((a) => a.symbol);
      const quotesData = symbols.length > 0 ? await fetchQuotes(symbols) : [];
      const priceMap: Record<string, number> = {};
      quotesData.forEach((q: Quote) => (priceMap[q.symbol] = q.regularMarketPrice));
      const stats = computePortfolioStats(activeWallet.assets, priceMap);

      const assetsPayload = activeWallet.assets.map((a) => {
        const price = priceMap[a.symbol] ?? a.avgPrice;
        const cur = price * a.quantity;
        const inv = a.avgPrice * a.quantity;
        const pp = inv > 0 ? ((cur - inv) / inv) * 100 : 0;
        return {
          symbol: a.symbol,
          type: a.type,
          quantity: a.quantity,
          currentValue: cur,
          profitPct: pp,
        };
      });

      const year = new Date().getFullYear();
      const ytd = proventos
        .filter((p) => p.date.startsWith(String(year)))
        .reduce((s, p) => s + p.amount, 0);

      const text = await fetchAiDiagnostic({
        profile,
        assets: assetsPayload,
        totals: {
          totalCurrent: stats.totalCurrent,
          totalInvested: stats.totalInvested,
          profitPct: stats.profitPct,
        },
        dividendos: {
          ytdReceived: ytd,
          weightedDY: 0,
        },
        question: extraQuestion?.trim() || undefined,
      });
      setDiagnostic(text);
    } catch (e: any) {
      Alert.alert('Ops', e?.message || 'Não foi possível analisar agora. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (q: string) => {
    setQuestion(q);
    runDiagnostic(q);
  };

  const handleTickerChip = (symbol: string) => {
    const q = `Faça uma análise focada no meu ativo ${symbol}: preço, fundamentos, papel na carteira, e se devo manter, aumentar ou reduzir.`;
    setQuestion(q);
    runDiagnostic(q);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Gestor IA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!diagnostic && !loading && (
          <>
            <Card style={styles.heroCard}>
              <Text style={styles.heroEmoji}>🧠</Text>
              <Text style={styles.heroTitle}>Diagnóstico da sua carteira</Text>
              <Text style={styles.heroDesc}>
                Análise completa: pontos fortes, riscos e próximos passos baseados no seu perfil.
              </Text>
              <TouchableOpacity style={styles.heroBtn} onPress={() => runDiagnostic()}>
                <Ionicons name="sparkles" size={18} color={colors.textLight} />
                <Text style={styles.heroBtnText}>Fazer diagnóstico agora</Text>
              </TouchableOpacity>
            </Card>

            <Card style={{ marginTop: spacing.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>💬 Sugestões de conversa</Text>
                <TouchableOpacity
                  onPress={() => setSuggestionSeed((s) => s + 1)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Ionicons name="refresh" size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: '700', marginLeft: 4 }}>
                    Recarregar
                  </Text>
                </TouchableOpacity>
              </View>
              {rotativeSuggestions.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionRow}
                  onPress={() => handleSuggestion(s)}
                >
                  <Text style={styles.suggestionText}>{s}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </Card>

            {tickerChips.length > 0 && (
              <Card style={{ marginTop: spacing.md }}>
                <Text style={styles.sectionTitle}>📊 Converse sobre um ativo</Text>
                <Text style={styles.sectionSub}>
                  Toque num ativo da sua carteira pra IA analisar individualmente.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginTop: spacing.sm }}
                >
                  {tickerChips.map((a) => (
                    <TouchableOpacity
                      key={a.symbol}
                      style={styles.tickerChip}
                      onPress={() => handleTickerChip(a.symbol)}
                    >
                      <Text style={styles.tickerChipText}>{a.symbol}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Card>
            )}

            <Card style={{ marginTop: spacing.md }}>
              <Text style={styles.sectionTitle}>✍️ Pergunta livre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: como melhoro o dividendo mensal sem perder crescimento?"
                multiline
                value={question}
                onChangeText={setQuestion}
              />
              <TouchableOpacity
                style={[styles.askBtn, !question.trim() && { opacity: 0.5 }]}
                onPress={() => runDiagnostic(question)}
                disabled={!question.trim()}
              >
                <Ionicons name="send" size={16} color={colors.textLight} />
                <Text style={styles.askBtnText}>Perguntar</Text>
              </TouchableOpacity>
            </Card>
          </>
        )}

        {loading && (
          <Card style={[styles.heroCard, { alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.heroTitle, { marginTop: spacing.md }]}>
              Analisando sua carteira...
            </Text>
            <Text style={styles.heroDesc}>
              A IA está cruzando seus ativos, perfil e desempenho. Demora uns segundinhos.
            </Text>
          </Card>
        )}

        {diagnostic && !loading && (
          <>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 0 }]}>
                  Análise da IA
                </Text>
              </View>
              <Text style={styles.diagnosticText}>{diagnostic}</Text>
            </Card>

            <TouchableOpacity
              style={styles.againBtn}
              onPress={() => {
                setDiagnostic(null);
                setQuestion('');
              }}
            >
              <Ionicons name="refresh" size={16} color={colors.primary} />
              <Text style={styles.againBtnText}>Fazer outra pergunta</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              💡 A IA é educativa, não é conselho de investimento. Use como ponto de partida pra suas próprias decisões.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  heroCard: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.primaryLight, borderColor: colors.primaryAccent },
  heroEmoji: { fontSize: 48, marginBottom: spacing.sm },
  heroTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  heroDesc: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 },
  heroBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  heroBtnText: { color: colors.textLight, fontWeight: '700', marginLeft: 6, fontSize: fontSize.bodyLarge },
  sectionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  sectionSub: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: -spacing.xs },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  suggestionText: { fontSize: fontSize.body, color: colors.text, flex: 1, marginRight: spacing.sm },
  tickerChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  tickerChipText: { color: colors.textLight, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    color: colors.text,
    backgroundColor: colors.background,
    fontSize: fontSize.body,
  },
  askBtn: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  askBtnText: { color: colors.textLight, fontWeight: '700', marginLeft: 6 },
  diagnosticText: { fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  againBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  againBtnText: { color: colors.primary, fontWeight: '700', marginLeft: 6 },
  disclaimer: {
    fontSize: fontSize.tiny,
    color: colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
