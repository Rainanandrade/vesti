import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import ProLock from '../components/ProLock';
import { safeBackToTabs } from '../utils/navigation';
import { fetchQuotes, Quote } from '../api/brapi';
import { fetchDividendInfoBatch, DividendInfo } from '../api/dividends';
import { supabase } from '../services/supabase';

const API_URL = 'https://vesti-nine.vercel.app/api/ai-consultor';

export default function IAConsultorScreen({ navigation }: any) {
  const { activeWallet, profile } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [dividends, setDividends] = useState<Record<string, DividendInfo | null>>({});
  const [prefetching, setPrefetching] = useState(true);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const symbols = (activeWallet?.assets || []).map((a) => a.symbol);
    if (symbols.length === 0) { setPrefetching(false); return; }
    Promise.all([
      fetchQuotes(symbols).then((qs) => {
        const m: Record<string, Quote> = {};
        qs.forEach((q) => (m[q.symbol] = q));
        setQuotes(m);
      }),
      fetchDividendInfoBatch(symbols).then((d) => setDividends(d)),
    ]).finally(() => setPrefetching(false));
  }, [activeWallet?.assets.length]);

  const ask = async (customQuestion?: string) => {
    if (!activeWallet || activeWallet.assets.length === 0) {
      setError('Adicione ativos na carteira antes de pedir análise.');
      return;
    }
    setLoading(true); setError(null); setAnswer(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const r = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({
          assets: activeWallet.assets,
          quotes,
          dividends,
          profile,
          question: customQuestion ?? question,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Falha na IA');
      setAnswer(json.answer);
    } catch (e: any) {
      setError(e.message || 'Erro ao consultar IA');
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'Faça uma análise geral da minha carteira',
    'Quais são meus principais riscos?',
    'Onde devo aportar próximos R$ 500?',
    'Minha alocação em FIIs está OK?',
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>IA Consultora</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ProLock
          mode="replace"
          title="IA consultora da carteira"
          description="Análise personalizada dos seus ativos, sugestão de aporte e resposta a dúvidas."
          onUnlock={() => navigation.getParent()?.navigate('ProSubscribe')}
        >
          <Card>
            <Text style={styles.introTitle}>✨ Pergunte sobre sua carteira</Text>
            <Text style={styles.introDesc}>
              A IA analisa seus ativos reais, ponderação por classe, DY estimado e responde em português claro.
            </Text>

            <Text style={styles.suggestionsLabel}>Sugestões rápidas</Text>
            <View style={styles.suggestionsRow}>
              {quickQuestions.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={styles.chip}
                  onPress={() => { setQuestion(q); ask(q); }}
                  disabled={loading || prefetching}
                >
                  <Text style={styles.chipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              placeholder="Ou digite uma pergunta livre..."
              placeholderTextColor={colors.textTertiary}
              value={question}
              onChangeText={setQuestion}
              style={styles.input}
              multiline
              maxLength={280}
            />

            <TouchableOpacity
              style={[styles.askBtn, (loading || prefetching || !question.trim()) && { opacity: 0.5 }]}
              onPress={() => ask()}
              disabled={loading || prefetching || !question.trim()}
            >
              {loading ? (
                <ActivityIndicator color={colors.textLight} />
              ) : (
                <>
                  <Ionicons name="send" size={16} color={colors.textLight} />
                  <Text style={styles.askText}>Perguntar</Text>
                </>
              )}
            </TouchableOpacity>
          </Card>

          {prefetching && (
            <Text style={styles.loadingText}>Preparando dados da carteira...</Text>
          )}

          {error && (
            <Card style={{ marginTop: spacing.md, backgroundColor: colors.dangerLight }}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>{error}</Text>
            </Card>
          )}

          {answer && (
            <Card style={{ marginTop: spacing.md, backgroundColor: colors.primaryLight, borderColor: colors.primary }}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={styles.aiHeaderText}>Análise da IA</Text>
              </View>
              <Text style={styles.answerText}>{answer}</Text>
            </Card>
          )}

          <Text style={styles.footnote}>
            Baseado em Llama 3.3. As análises são sugestões, não recomendações de investimento.
          </Text>
        </ProLock>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  introTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  introDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },
  suggestionsLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase', marginTop: spacing.sm, marginBottom: 6 },
  suggestionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 as any },
  chip: { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.divider },
  chipText: { fontSize: fontSize.small, color: colors.text, fontWeight: '600' },
  input: { marginTop: spacing.md, minHeight: 60, borderWidth: 1, borderColor: colors.divider, borderRadius: radius.md, padding: spacing.sm, color: colors.text, textAlignVertical: 'top' },
  askBtn: { flexDirection: 'row', gap: 6 as any, alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md },
  askText: { color: colors.textLight, fontWeight: '800' },
  loadingText: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.md },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, marginBottom: spacing.sm },
  aiHeaderText: { color: colors.primary, fontWeight: '800', fontSize: fontSize.small, letterSpacing: 0.5 },
  answerText: { fontSize: fontSize.body, color: colors.text, lineHeight: 22 },
  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md, fontStyle: 'italic' },
});
