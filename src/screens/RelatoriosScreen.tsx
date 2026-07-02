import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import ProLock from '../components/ProLock';
import { safeBackToTabs } from '../utils/navigation';
import { buildAnnualReport, buildMonthlyReport, openReport } from '../utils/reports';
import { fetchQuotes, Quote } from '../api/brapi';
import { fetchDividendInfoBatch, DividendInfo } from '../api/dividends';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export default function RelatoriosScreen({ navigation }: any) {
  const { user, activeWallet } = useApp();
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [dividends, setDividends] = useState<Record<string, DividendInfo | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const symbols = (activeWallet?.assets || []).map((a) => a.symbol);
    if (symbols.length === 0) { setLoading(false); return; }
    Promise.all([
      fetchQuotes(symbols).then((qs) => {
        const m: Record<string, Quote> = {};
        qs.forEach((q) => (m[q.symbol] = q));
        setQuotes(m);
      }),
      fetchDividendInfoBatch(symbols).then((d) => setDividends(d)),
    ]).finally(() => setLoading(false));
  }, [activeWallet?.assets.length]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const generateMonthly = (month: number, year: number) => {
    const html = buildMonthlyReport(activeWallet || null, quotes, dividends, user?.name || 'Investidor', month, year);
    openReport(html, `Extrato ${month}/${year}`);
  };

  const generateAnnual = (year: number) => {
    const html = buildAnnualReport(activeWallet || null, quotes, dividends, user?.name || 'Investidor', year);
    openReport(html, `Informe ${year}`);
  };

  const availableMonths: Array<{ label: string; month: number; year: number }> = [];
  for (let i = 0; i < 6; i++) {
    let m = currentMonth - i;
    let y = currentYear;
    if (m < 1) { m += 12; y -= 1; }
    availableMonths.push({ label: `${MONTHS[m - 1]}/${y}`, month: m, year: y });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Relatórios</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <ProLock
          mode="replace"
          title="Relatórios em PDF"
          description="Extrato mensal e informe anual pra IRPF. Envie ao seu contador em 1 clique."
          onUnlock={() => navigation.getParent()?.navigate('ProSubscribe')}
        >
          <Card>
            <Text style={styles.sectionTitle}>📄 Extrato mensal</Text>
            <Text style={styles.sectionDesc}>
              Resumo do mês com posição, proventos recebidos e rentabilidade.
            </Text>
            {availableMonths.map((m) => (
              <TouchableOpacity
                key={`${m.year}-${m.month}`}
                style={styles.row}
                onPress={() => generateMonthly(m.month, m.year)}
                disabled={loading}
              >
                <Ionicons name="calendar" size={18} color={colors.primary} />
                <Text style={styles.rowLabel}>{m.label}</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="download" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </Card>

          <Card style={{ marginTop: spacing.md }}>
            <Text style={styles.sectionTitle}>📊 Informe anual (IRPF)</Text>
            <Text style={styles.sectionDesc}>
              Consolidado pra declaração de imposto de renda: proventos, posição e ativos.
            </Text>
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <TouchableOpacity
                key={y}
                style={styles.row}
                onPress={() => generateAnnual(y)}
                disabled={loading}
              >
                <Ionicons name="document-text" size={18} color={colors.primary} />
                <Text style={styles.rowLabel}>Informe de {y}</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="download" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </Card>

          <Text style={styles.footnote}>
            O relatório abre em nova aba. Use "Imprimir → Salvar como PDF" pra baixar.
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
  sectionTitle: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  sectionDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md as any, paddingVertical: spacing.md, borderTopWidth: 1, borderColor: colors.divider },
  rowLabel: { fontSize: fontSize.body, color: colors.text, fontWeight: '600', marginLeft: 6 },
  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md, fontStyle: 'italic' },
});
