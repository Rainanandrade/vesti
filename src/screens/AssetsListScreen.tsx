import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
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
import { fetchQuotes, Quote } from '../api/brapi';
import { fmtBRL } from '../utils/format';
import PortfolioDonut from '../components/PortfolioDonut';

type ClassFilter = 'acao' | 'fii' | 'etf' | 'tesouro' | 'cdb' | 'outro';
type ColumnKey =
  | 'qtd' | 'saldo' | 'preco' | 'precoMedio' | 'precoAtual'
  | 'variacao' | 'rent' | 'minhaNota' | 'pctCarteira' | 'pctIdeal' | 'comprar';

const COLUMNS: { key: ColumnKey; label: string; default: boolean }[] = [
  { key: 'qtd',         label: 'Qtd.',          default: true },
  { key: 'saldo',       label: 'Saldo',         default: true },
  { key: 'precoMedio',  label: 'Preço médio',   default: false },
  { key: 'precoAtual',  label: 'Preço atual',   default: true },
  { key: 'variacao',    label: 'Variação',      default: true },
  { key: 'rent',        label: 'Rentabilidade', default: false },
  { key: 'minhaNota',   label: 'Minha nota',    default: false },
  { key: 'pctCarteira', label: '% Carteira',    default: true },
  { key: 'pctIdeal',    label: '% ideal',       default: false },
  { key: 'comprar',     label: 'Comprar',       default: false },
];

const TICKER_COLORS: Record<string, string> = {
  PETR: '#FFCC00', VALE: '#90C840', ITUB: '#EC7000', BBDC: '#CC092F', BBAS: '#FECB00',
  TAEE: '#5A9BD4', CPLE: '#F39A2C', MXRF: '#10B981', XPML: '#FBBF24', GGRC: '#F97316',
  KNCA: '#34D399', SNEL: '#A78BFA', WEGE: '#3B82F6', RDOR: '#06B6D4', SUZB: '#84CC16',
};

function tickerColor(symbol: string): string {
  const prefix = symbol.slice(0, 4);
  return TICKER_COLORS[prefix] || colors.primary;
}

export default function AssetsListScreen({ navigation, route }: any) {
  const { activeWallet, privacyMode, profile } = useApp();
  const initialClass = (route?.params?.classFilter as ClassFilter) || 'acao';
  const [classFilter, setClassFilter] = useState<ClassFilter>(initialClass);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [columns, setColumns] = useState<ColumnKey[]>(
    COLUMNS.filter((c) => c.default).map((c) => c.key),
  );
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [notes, setNotes] = useState<Record<string, number>>({}); // ticker → nota
  const [noteEdit, setNoteEdit] = useState<{ sym: string; value: string } | null>(null);

  const [sortBy, setSortBy] = useState<ColumnKey | 'symbol'>('symbol');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const baseFiltered = useMemo(
    () => (activeWallet?.assets || []).filter((a) => a.type === classFilter),
    [activeWallet, classFilter],
  );

  const filtered = useMemo(() => {
    const arr = [...baseFiltered];
    arr.sort((a, b) => {
      const qa = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
      const qb = quotes[b.symbol]?.regularMarketPrice ?? b.avgPrice;
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sortBy) {
        case 'symbol':       va = a.symbol; vb = b.symbol; break;
        case 'qtd':          va = a.quantity; vb = b.quantity; break;
        case 'saldo':        va = qa * a.quantity; vb = qb * b.quantity; break;
        case 'precoMedio':   va = a.avgPrice; vb = b.avgPrice; break;
        case 'precoAtual':   va = qa; vb = qb; break;
        case 'variacao':     va = quotes[a.symbol]?.regularMarketChangePercent ?? 0; vb = quotes[b.symbol]?.regularMarketChangePercent ?? 0; break;
        case 'rent':         va = ((qa - a.avgPrice) / a.avgPrice) * 100; vb = ((qb - b.avgPrice) / b.avgPrice) * 100; break;
        case 'minhaNota':    va = notes[a.symbol] ?? 0; vb = notes[b.symbol] ?? 0; break;
        case 'pctCarteira':  va = qa * a.quantity; vb = qb * b.quantity; break;
        default:             va = a.symbol; vb = b.symbol;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? (va as string).localeCompare(vb as string) : (vb as string).localeCompare(va as string);
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return arr;
  }, [baseFiltered, quotes, sortBy, sortDir, notes]);

  const toggleSort = (k: ColumnKey | 'symbol') => {
    if (sortBy === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(k); setSortDir('asc'); }
  };

  const totalCarteira = useMemo(() => {
    return (activeWallet?.assets || []).reduce((s, a) => {
      const p = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
      return s + p * a.quantity;
    }, 0);
  }, [activeWallet, quotes]);

  // % ideal por ativo: divide a % da classe pelo nº de ativos da classe
  const idealPctPerAsset = useMemo(() => {
    const classIdeal = profile?.targetAllocation?.[classFilter] || 0;
    return filtered.length > 0 ? classIdeal / filtered.length : 0;
  }, [profile, classFilter, filtered]);

  useEffect(() => {
    const symbols = filtered.map((a) => a.symbol);
    if (symbols.length > 0) {
      fetchQuotes(symbols).then((qs) => {
        const map: Record<string, Quote> = {};
        qs.forEach((q) => (map[q.symbol] = q));
        setQuotes((prev) => ({ ...prev, ...map }));
      });
    }
  }, [filtered.map((a) => a.symbol).join(',')]);

  const toggleColumn = (key: ColumnKey) => {
    setColumns((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Tabs');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Lista de ativos</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            // AssetsList vive no MainStack como modal. AddAsset vive no
            // PortfolioStack. Precisamos pular do MainStack pra o Tab Carteira
            // e abrir AddAsset lá.
            navigation.navigate('Tabs', { screen: 'Carteira', params: { screen: 'AddAsset' } });
          }}
        >
          <Ionicons name="add" size={22} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={{ padding: spacing.md }}>
        {(['acao', 'fii', 'etf'] as ClassFilter[]).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, classFilter === c && styles.filterChipActive]}
            onPress={() => setClassFilter(c)}
          >
            <Ionicons
              name={c === 'acao' ? 'shield-outline' : c === 'fii' ? 'business-outline' : 'analytics-outline'}
              size={14}
              color={classFilter === c ? colors.textLight : colors.text}
            />
            <Text style={[styles.filterText, classFilter === c && styles.filterTextActive]}>
              {c === 'acao' ? 'Ações' : c === 'fii' ? 'FIIs' : 'ETFs'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ flex: 1 }}>
        <ScrollView horizontal>
          <View>
            {/* Header — usa ordem canônica de COLUMNS, filtrada pelas ativas */}
            <View style={styles.tableHeader}>
              <TouchableOpacity style={styles.cellFixed} onPress={() => toggleSort('symbol')}>
                <Text style={styles.thText}>
                  Ativos {sortBy === 'symbol' ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                </Text>
              </TouchableOpacity>
              {COLUMNS.filter((c) => columns.includes(c.key)).map((c) => (
                <TouchableOpacity key={c.key} style={styles.th} onPress={() => toggleSort(c.key)}>
                  <Text style={styles.thText}>
                    {c.label} {sortBy === c.key ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rows — mesma ordem canônica */}
            <ScrollView>
              {filtered.map((a) => {
                const q = quotes[a.symbol];
                const price = q?.regularMarketPrice ?? a.avgPrice;
                const value = price * a.quantity;
                const variation = q?.regularMarketChangePercent ?? 0;
                const rent = ((price - a.avgPrice) / a.avgPrice) * 100;
                const pctCarteira = totalCarteira > 0 ? (value / totalCarteira) * 100 : 0;
                const idealPct = idealPctPerAsset;
                const needBuy = idealPct > 0 && pctCarteira < idealPct - 1;
                const nota = notes[a.symbol] ?? 0;

                const renderCell = (key: ColumnKey) => {
                  switch (key) {
                    case 'qtd':         return <Cell key={key} text={String(a.quantity)} />;
                    case 'saldo':       return <Cell key={key} text={fmtBRL(value, privacyMode)} />;
                    case 'precoMedio':  return <Cell key={key} text={fmtBRL(a.avgPrice, privacyMode)} />;
                    case 'precoAtual':
                    case 'preco':       return <Cell key={key} text={fmtBRL(price, privacyMode)} />;
                    case 'variacao':
                      return (
                        <View key={key} style={styles.td}>
                          <View style={[styles.pill, { backgroundColor: variation >= 0 ? colors.successLight : colors.dangerLight }]}>
                            <Text style={{ color: variation >= 0 ? colors.success : colors.danger, fontWeight: '700' }}>
                              {variation.toFixed(2)}% {variation >= 0 ? '▲' : '▼'}
                            </Text>
                          </View>
                        </View>
                      );
                    case 'rent':
                      return (
                        <View key={key} style={styles.td}>
                          <View style={[styles.pill, { backgroundColor: rent === 0 ? colors.surface : (rent > 0 ? colors.successLight : colors.dangerLight) }]}>
                            <Text style={{ color: rent === 0 ? colors.textTertiary : (rent > 0 ? colors.success : colors.danger), fontWeight: '700' }}>
                              {rent.toFixed(2)}%
                            </Text>
                          </View>
                        </View>
                      );
                    case 'minhaNota':
                      return (
                        <View key={key} style={styles.td}>
                          <TouchableOpacity
                            style={styles.noteBadge}
                            onPress={(e) => {
                              e.stopPropagation();
                              setNoteEdit({ sym: a.symbol, value: String(nota) });
                            }}
                          >
                            <Text style={styles.noteText}>{nota}</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    case 'pctCarteira': return <Cell key={key} text={`${pctCarteira.toFixed(2)}%`} />;
                    case 'pctIdeal':    return <Cell key={key} text={`${idealPct.toFixed(2)}%`} />;
                    case 'comprar':
                      return (
                        <View key={key} style={styles.td}>
                          <View style={[styles.pill, { backgroundColor: needBuy ? colors.successLight : colors.dangerLight }]}>
                            <Ionicons name={needBuy ? 'checkmark-circle' : 'close-circle'} size={14} color={needBuy ? colors.success : colors.danger} />
                            <Text style={{ color: needBuy ? colors.success : colors.danger, fontWeight: '700', marginLeft: 4 }}>
                              {needBuy ? 'Sim' : 'Não'}
                            </Text>
                          </View>
                        </View>
                      );
                    default: return null;
                  }
                };

                return (
                  <TouchableOpacity
                    key={a.symbol}
                    style={styles.tr}
                    onPress={() => navigation.navigate('EditAsset', { symbol: a.symbol })}
                    activeOpacity={0.65}
                  >
                    <View style={styles.cellFixed}>
                      <View style={[styles.logo, { backgroundColor: tickerColor(a.symbol) + '30' }]}>
                        <Text style={[styles.logoText, { color: tickerColor(a.symbol) }]}>{a.symbol.slice(0, 2)}</Text>
                      </View>
                      <Text style={styles.symbol}>{a.symbol}</Text>
                    </View>
                    {COLUMNS.filter((c) => columns.includes(c.key)).map((c) => renderCell(c.key))}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <FooterBtn icon="pie-chart-outline" label="% Ideal" onPress={() => navigation.getParent()?.navigate('DividendTarget')} />
        <FooterBtn icon="bar-chart-outline" label="Gráfico" onPress={() => setChartOpen(true)} />
        <FooterBtn icon="settings-outline" label="Customizar" onPress={() => setCustomizeOpen(true)} />
      </View>

      {/* Modal Gráfico — donut da composição */}
      <Modal visible={chartOpen} transparent animationType="slide" onRequestClose={() => setChartOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setChartOpen(false)}>
          <Pressable style={[styles.sheet, { padding: spacing.lg }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Composição — {classFilter === 'acao' ? 'Ações' : classFilter === 'fii' ? 'FIIs' : 'ETFs'}</Text>
            <PortfolioDonut
              data={filtered.map((a) => ({
                label: a.symbol,
                value: (quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice) * a.quantity,
              }))}
              size={260}
            />
            <TouchableOpacity style={[styles.closeBtn, { marginTop: spacing.lg }]} onPress={() => setChartOpen(false)}>
              <Text style={styles.closeBtnText}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal customizar colunas */}
      <Modal visible={customizeOpen} transparent animationType="fade" onRequestClose={() => setCustomizeOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCustomizeOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Customizar colunas</Text>
            <ScrollView>
              {COLUMNS.map((c) => {
                const on = columns.includes(c.key);
                return (
                  <TouchableOpacity key={c.key} style={styles.colRow} onPress={() => toggleColumn(c.key)}>
                    <Ionicons name={on ? 'checkbox' : 'square-outline'} size={22} color={on ? colors.primary : colors.textTertiary} />
                    <Text style={styles.colLabel}>{c.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setCustomizeOpen(false)}>
              <Text style={styles.closeBtnText}>Pronto</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal editar nota */}
      <Modal visible={!!noteEdit} transparent animationType="fade" onRequestClose={() => setNoteEdit(null)}>
        <Pressable style={styles.backdrop} onPress={() => setNoteEdit(null)}>
          <Pressable style={[styles.sheet, { padding: spacing.lg }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Sua nota pra {noteEdit?.sym}</Text>
            <Text style={{ fontSize: fontSize.small, color: colors.textSecondary, marginTop: spacing.xs }}>De 0 a 10</Text>
            <TextInput
              style={styles.noteInput}
              value={noteEdit?.value || ''}
              onChangeText={(t) => setNoteEdit((cur) => cur ? { ...cur, value: t.replace(/[^0-9]/g, '').slice(0, 2) } : null)}
              keyboardType="number-pad"
              autoFocus
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                if (noteEdit) {
                  const n = Math.max(0, Math.min(10, parseInt(noteEdit.value, 10) || 0));
                  setNotes((prev) => ({ ...prev, [noteEdit.sym]: n }));
                }
                setNoteEdit(null);
              }}
            >
              <Text style={styles.closeBtnText}>Salvar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Cell({ text }: { text: string }) {
  return (
    <View style={styles.td}>
      <Text style={styles.tdText}>{text}</Text>
    </View>
  );
}

function FooterBtn({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.footerBtn} onPress={onPress}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.footerText}>{label}</Text>
    </TouchableOpacity>
  );
}

const COL_W = 130;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, flex: 1, marginLeft: spacing.sm },
  addBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  filterBar: { maxHeight: 60 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill, marginRight: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  filterText: { color: colors.text, fontWeight: '600', marginLeft: 6 },
  filterTextActive: { color: colors.textLight, fontWeight: '700' },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.divider },
  th: { width: COL_W, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  thText: { fontSize: fontSize.small, color: colors.textSecondary, fontWeight: '700' },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderColor: colors.divider, minHeight: 60, alignItems: 'center' },
  cellFixed: { width: 160, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, backgroundColor: colors.background, borderRightWidth: 1, borderColor: colors.divider },
  td: { width: COL_W, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  tdText: { fontSize: fontSize.body, color: colors.text, fontWeight: '500' },
  logo: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  logoText: { fontSize: 11, fontWeight: '800' },
  symbol: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  noteBadge: { backgroundColor: colors.text, width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  noteText: { color: colors.textLight, fontWeight: '800', fontSize: fontSize.body },
  footer: { flexDirection: 'row', justifyContent: 'space-around', padding: spacing.sm, borderTopWidth: 1, borderColor: colors.divider, backgroundColor: colors.background },
  footerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface },
  footerText: { color: colors.text, fontWeight: '600', marginLeft: 6, fontSize: fontSize.small },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md, maxHeight: '80%' },
  sheetTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  colRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  colLabel: { color: colors.text, fontSize: fontSize.body, marginLeft: spacing.sm, fontWeight: '600' },
  closeBtn: { marginTop: spacing.md, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  closeBtnText: { color: colors.textLight, fontWeight: '700' },
  noteInput: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
});
