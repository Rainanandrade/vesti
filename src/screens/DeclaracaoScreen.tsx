import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fmtBRL } from '../utils/format';
import Card from '../components/Card';
import { fetchDividendInfoBatch, DividendInfo } from '../api/dividends';
import { computeReceivedProventos } from '../utils/receivedProventos';
import { useEffect } from 'react';

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export default function DeclaracaoScreen({ navigation }: any) {
  const { activeWallet, operations, privacyMode } = useApp();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear - 1); // por padrão: ano-base anterior (DIRPF)
  const [dividendInfoMap, setDividendInfoMap] = useState<Record<string, DividendInfo | null>>({});

  const years = [currentYear - 2, currentYear - 1, currentYear];

  useEffect(() => {
    const symbols = (activeWallet?.assets || [])
      .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
      .map((a) => a.symbol);
    if (symbols.length > 0) fetchDividendInfoBatch(symbols).then(setDividendInfoMap);
  }, [activeWallet?.id, activeWallet?.assets.length]);

  const allReceived = useMemo(
    () => computeReceivedProventos(activeWallet?.assets || [], dividendInfoMap),
    [activeWallet, dividendInfoMap],
  );

  const yearStr = String(year);
  const opsYear = operations.filter((o) => o.date.startsWith(yearStr));
  const pvsYear = allReceived.filter((p) => p.date.startsWith(yearStr));

  const totalDividendosIsentos = useMemo(
    () => pvsYear.filter((p) => p.kind === 'dividendo' || p.kind === 'rendimento').reduce((s, p) => s + p.amount, 0),
    [pvsYear],
  );
  const totalJcpRetido = useMemo(
    () => pvsYear.filter((p) => p.kind === 'jcp').reduce((s, p) => s + p.amount, 0),
    [pvsYear],
  );
  const totalBuyOps = opsYear.filter((o) => o.type === 'buy').reduce((s, o) => s + o.price * o.quantity, 0);
  const totalSellOps = opsYear.filter((o) => o.type === 'sell').reduce((s, o) => s + o.price * o.quantity, 0);

  const buildReport = (): string => {
    const lines: string[] = [];
    lines.push(`============================================`);
    lines.push(`📄 RELATÓRIO PARA DECLARAÇÃO IR ${year + 1}`);
    lines.push(`(Ano-base: ${year})`);
    lines.push(`============================================\n`);

    // BENS E DIREITOS — posição em 31/12
    lines.push(`📌 BENS E DIREITOS — Posição em 31/12/${year}`);
    lines.push(`--------------------------------------------`);
    if (activeWallet?.assets.length) {
      activeWallet.assets.forEach((a) => {
        const valor = a.quantity * a.avgPrice;
        lines.push(`• ${a.symbol} (${a.name})`);
        lines.push(`  Tipo: ${labelType(a.type)}`);
        lines.push(`  Quantidade: ${a.quantity}`);
        lines.push(`  Preço médio: R$ ${a.avgPrice.toFixed(2)}`);
        lines.push(`  Valor total declarado: R$ ${valor.toFixed(2)}`);
        lines.push(`  Código DIRPF sugerido: ${codigoDIRPF(a.type)}\n`);
      });
    } else {
      lines.push(`(sem ativos registrados)\n`);
    }

    // RENDIMENTOS ISENTOS — Dividendos
    lines.push(`\n📌 RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS`);
    lines.push(`Código 09 — Dividendos recebidos`);
    lines.push(`--------------------------------------------`);
    lines.push(`Total no ano: R$ ${totalDividendosIsentos.toFixed(2)}\n`);

    const divsBySymbol: Record<string, number> = {};
    pvsYear
      .filter((p) => p.kind === 'dividendo' || p.kind === 'rendimento')
      .forEach((p) => {
        divsBySymbol[p.symbol] = (divsBySymbol[p.symbol] || 0) + p.amount;
      });
    Object.entries(divsBySymbol).forEach(([sym, val]) => {
      lines.push(`• ${sym}: R$ ${val.toFixed(2)}`);
    });

    // JCP — Tributação Exclusiva
    lines.push(`\n\n📌 RENDIMENTOS SUJEITOS À TRIBUTAÇÃO EXCLUSIVA`);
    lines.push(`Código 10 — Juros sobre Capital Próprio`);
    lines.push(`--------------------------------------------`);
    lines.push(`Total no ano: R$ ${totalJcpRetido.toFixed(2)}\n`);

    const jcpBySymbol: Record<string, number> = {};
    pvsYear.filter((p) => p.kind === 'jcp').forEach((p) => {
      jcpBySymbol[p.symbol] = (jcpBySymbol[p.symbol] || 0) + p.amount;
    });
    Object.entries(jcpBySymbol).forEach(([sym, val]) => {
      lines.push(`• ${sym}: R$ ${val.toFixed(2)} (IRRF 15% já retido na fonte)`);
    });

    // OPERAÇÕES — Renda Variável
    lines.push(`\n\n📌 OPERAÇÕES DE RENDA VARIÁVEL (ANEXO)`);
    lines.push(`--------------------------------------------`);
    lines.push(`Total comprado no ano: R$ ${totalBuyOps.toFixed(2)}`);
    lines.push(`Total vendido no ano: R$ ${totalSellOps.toFixed(2)}\n`);

    // Vendas mês a mês (pra preencher anexo mensal)
    const sellsByMonth: Record<string, { acao: number; fii: number; dt: number }> = {};
    opsYear.filter((o) => o.type === 'sell').forEach((o) => {
      const mk = o.date.slice(0, 7);
      const cur = sellsByMonth[mk] || { acao: 0, fii: 0, dt: 0 };
      const val = o.price * o.quantity;
      if (o.assetType === 'daytrade') cur.dt += val;
      else if (o.assetType === 'fii') cur.fii += val;
      else cur.acao += val;
      sellsByMonth[mk] = cur;
    });
    Object.entries(sellsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([mk, v]) => {
        const [y, m] = mk.split('-');
        lines.push(`\n📅 ${MONTHS_PT[Number(m) - 1]}/${y}`);
        if (v.acao > 0) lines.push(`  Swing-trade ações: R$ ${v.acao.toFixed(2)}${v.acao <= 20000 ? ' (isento — abaixo de 20k)' : ' (TRIBUTADO 15%)'}`);
        if (v.fii > 0) lines.push(`  FIIs: R$ ${v.fii.toFixed(2)} (TRIBUTADO 20% sobre lucro)`);
        if (v.dt > 0) lines.push(`  Day-trade: R$ ${v.dt.toFixed(2)} (TRIBUTADO 20%)`);
      });

    lines.push(`\n\n--------------------------------------------`);
    lines.push(`Gerado pelo Vesti em ${new Date().toLocaleString('pt-BR')}`);
    lines.push(`💡 Use isso como APOIO. Não substitui contador.`);
    return lines.join('\n');
  };

  const handleCopyReport = async () => {
    const report = buildReport();
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(report);
          Alert.alert('Copiado!', 'O relatório foi copiado pra área de transferência. Cola direto no app da Receita.');
        } else {
          const blob = new Blob([report], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vesti-IR-${year + 1}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        await Share.share({ message: report, title: `Relatório IR ${year + 1}` });
      }
    } catch (e: any) {
      Alert.alert('Ops', e?.message || 'Não foi possível compartilhar.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('PortfolioMain');
          }}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Declaração</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLead}>
          Como você quer resolver sua Declaração {year + 1}?
        </Text>

        {/* Year selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.sm }}>
          {years.map((y) => (
            <TouchableOpacity
              key={y}
              style={[styles.yearChip, y === year && styles.yearChipActive]}
              onPress={() => setYear(y)}
            >
              <Text style={[styles.yearChipText, y === year && styles.yearChipTextActive]}>
                Ano-base {y}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Card 1 — Relatório Copia & Cola */}
        <Card style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="document-text" size={32} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Relatório Copia & Cola</Text>
          <Text style={styles.heroDesc}>
            Texto pronto com bens e direitos, dividendos isentos, JCP e operações
            mês a mês — copia e cola direto no programa da Receita.
          </Text>
          <TouchableOpacity style={styles.heroBtn} onPress={handleCopyReport}>
            <Ionicons name="copy-outline" size={18} color={colors.textLight} />
            <Text style={styles.heroBtnText}>Gerar e copiar relatório</Text>
          </TouchableOpacity>
        </Card>

        {/* Card 2 — Resumo do ano */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.cardTitle}>Resumo do ano-base {year}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bens e direitos (posição atual)</Text>
            <Text style={styles.summaryValue}>
              {fmtBRL(
                (activeWallet?.assets || []).reduce((s, a) => s + a.quantity * a.avgPrice, 0),
                privacyMode,
              )}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dividendos isentos (cód. 09)</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {fmtBRL(totalDividendosIsentos, privacyMode)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>JCP — tributação exclusiva (cód. 10)</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {fmtBRL(totalJcpRetido, privacyMode)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total comprado no ano</Text>
            <Text style={styles.summaryValue}>{fmtBRL(totalBuyOps, privacyMode)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total vendido no ano</Text>
            <Text style={styles.summaryValue}>{fmtBRL(totalSellOps, privacyMode)}</Text>
          </View>
        </Card>

        <Card style={[styles.disclaimerCard, { marginTop: spacing.md }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.disclaimerText}>
            Este relatório é um APOIO pra preencher o programa da Receita. Recomendamos sempre conferir com seu contador.
            O Vesti não substitui consultoria fiscal.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function labelType(t: string): string {
  return ({ acao: 'Ação', fii: 'FII', etf: 'ETF', tesouro: 'Tesouro Direto', cdb: 'CDB', outro: 'Outro' } as Record<string, string>)[t] || t;
}

function codigoDIRPF(t: string): string {
  switch (t) {
    case 'acao': return '31 — Ações';
    case 'fii': return '73 — Fundo Imobiliário';
    case 'etf': return '74 — Fundos de Índice (ETF)';
    case 'tesouro': return '45 — Aplicação Tesouro Direto';
    case 'cdb': return '45 — Aplicação de Renda Fixa';
    default: return '99 — Outros bens e direitos';
  }
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
  sectionLead: {
    fontSize: fontSize.bodyLarge,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  yearChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  yearChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  yearChipText: { color: colors.textSecondary, fontWeight: '600' },
  yearChipTextActive: { color: colors.textLight, fontWeight: '700' },
  heroCard: { alignItems: 'center', padding: spacing.lg, backgroundColor: colors.primaryLight, borderColor: colors.primaryAccent },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroTitle: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text },
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
  cardTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  summaryLabel: { fontSize: fontSize.body, color: colors.textSecondary, flex: 1, paddingRight: spacing.sm },
  summaryValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  disclaimerText: {
    flex: 1,
    fontSize: fontSize.small,
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 18,
  },
});
