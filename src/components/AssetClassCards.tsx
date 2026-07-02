import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { Asset, Wallet } from '../context/AppContext';
import { Quote } from '../api/brapi';
import { Profile, AllocationClass, ALLOCATION_LABELS } from '../data/profileQuiz';
import { fmtBRL, fmtPct } from '../utils/format';
import { DividendInfo } from '../api/dividends';
import { computeDyFromHistory } from '../utils/investorChecklist';

type ClassKey = 'acao' | 'fii' | 'etf' | 'tesouro' | 'cdb' | 'outro';

const CLASS_META: Record<ClassKey, { icon: any; label: string; color: string }> = {
  acao:    { icon: 'shield-outline',  label: 'Ações',   color: colors.primary },
  fii:     { icon: 'business-outline', label: 'FIIs',    color: colors.primaryAccent },
  etf:     { icon: 'analytics-outline', label: 'ETFs',   color: colors.success },
  tesouro: { icon: 'wallet-outline',  label: 'Tesouro', color: colors.warning },
  cdb:     { icon: 'card-outline',    label: 'Renda Fixa', color: colors.textSecondary },
  outro:   { icon: 'ellipsis-horizontal-circle-outline', label: 'Outros', color: colors.textTertiary },
};

type Props = {
  wallet: Wallet | null;
  quotes: Record<string, Quote>;
  profile: Profile | null;
  privacyMode?: boolean;
  onOpenClass: (cls: ClassKey) => void;
  dividends?: Record<string, DividendInfo | null>;
};

export default function AssetClassCards({ wallet, quotes, profile, privacyMode, onOpenClass, dividends = {} }: Props) {
  if (!wallet) return null;
  const targetAlloc = profile?.targetAllocation || {};
  const allClasses: ClassKey[] = ['acao', 'fii', 'etf', 'tesouro', 'cdb', 'outro'];

  // Total da carteira
  const totalCurrent = wallet.assets.reduce((s, a) => {
    const p = quotes[a.symbol]?.regularMarketPrice ?? a.avgPrice;
    return s + p * a.quantity;
  }, 0);

  // Aggregate por classe
  const byClass = new Map<ClassKey, { assets: Asset[]; value: number; invested: number; dayChange: number; weight: number; dividends12m: number }>();
  for (const cls of allClasses) byClass.set(cls, { assets: [], value: 0, invested: 0, dayChange: 0, weight: 0, dividends12m: 0 });

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 12);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  for (const a of wallet.assets) {
    const cls = (a.type as ClassKey) in CLASS_META ? (a.type as ClassKey) : 'outro';
    const q = quotes[a.symbol];
    const price = q?.regularMarketPrice ?? a.avgPrice;
    const value = price * a.quantity;
    const invested = a.avgPrice * a.quantity;
    const dayChg = q?.regularMarketChangePercent ?? 0;
    const cur = byClass.get(cls)!;
    cur.assets.push(a);
    cur.value += value;
    cur.invested += invested;
    cur.dayChange += dayChg * value;
    cur.weight += value;
    const hist = dividends[a.symbol]?.history;
    if (hist && hist.length > 0) {
      // Só conta proventos com data >= data em que o ativo entrou na carteira
      const addedIso = new Date(a.addedAt).toISOString().slice(0, 10);
      const lowerBound = addedIso > cutoffIso ? addedIso : cutoffIso;
      const sumPerShare = hist.filter((h) => h.date >= lowerBound).reduce((s, h) => s + h.amount, 0);
      cur.dividends12m += sumPerShare * a.quantity;
    }
  }

  // Filtra classes que aparecem no targetAlloc OU têm ativos
  const visibleClasses = allClasses.filter((c) => {
    const has = (byClass.get(c)?.assets.length || 0) > 0;
    const inTarget = targetAlloc[c as AllocationClass] != null;
    return has || inTarget;
  });

  if (visibleClasses.length === 0) return null;

  return (
    <View>
      {visibleClasses.map((cls) => {
        const data = byClass.get(cls)!;
        const meta = CLASS_META[cls];
        const count = data.assets.length;
        const pct = totalCurrent > 0 ? (data.value / totalCurrent) * 100 : 0;
        const ideal = targetAlloc[cls as AllocationClass] || 0;
        const variationPct = data.invested > 0 ? ((data.value - data.invested) / data.invested) * 100 : 0;
        const dayPct = data.weight > 0 ? data.dayChange / data.weight : 0;
        const dyPct = data.value > 0 && data.dividends12m > 0 ? (data.dividends12m / data.value) * 100 : 0;
        const showDy = (cls === 'acao' || cls === 'fii' || cls === 'etf') && dyPct > 0;

        return (
          <TouchableOpacity key={cls} onPress={() => onOpenClass(cls)} style={styles.card} activeOpacity={0.7}>
            <View style={styles.header}>
              <View style={[styles.iconCircle, { backgroundColor: meta.color + '22' }]}>
                <Ionicons name={meta.icon} size={20} color={meta.color} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.className}>{meta.label}</Text>
                  <Text style={styles.classCount}>{' '}({count} {count === 1 ? 'ativo' : 'ativos'})</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>

            <View style={styles.grid}>
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>Valor total</Text>
                <Text style={styles.cellValue}>{fmtBRL(data.value, privacyMode)}</Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>Variação</Text>
                <Text style={[styles.cellValue, { color: dayPct >= 0 ? colors.success : colors.danger, fontSize: fontSize.body }]}>
                  {dayPct >= 0 ? '+' : ''}{dayPct.toFixed(2)}% {dayPct >= 0 ? '▲' : '▼'}
                </Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>Rentabilidade</Text>
                <Text style={[styles.cellValue, { color: variationPct >= 0 ? colors.success : colors.danger, fontSize: fontSize.body }]}>
                  {variationPct >= 0 ? '+' : ''}{variationPct.toFixed(2)}%
                </Text>
              </View>
              <View style={styles.cell}>
                <Text style={styles.cellLabel}>% na Carteira</Text>
                <Text style={styles.cellValue}>
                  <Text style={{ color: meta.color, fontWeight: '800' }}>{pct.toFixed(0)}%</Text>
                  <Text style={{ color: colors.textTertiary }}> / {ideal}%</Text>
                </Text>
              </View>
              {showDy && (
                <View style={styles.cell}>
                  <Text style={styles.cellLabel}>DY (12m)</Text>
                  <Text style={[styles.cellValue, { color: colors.primaryAccent, fontSize: fontSize.body }]}>
                    {dyPct.toFixed(2)}%
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.divider },
  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider, marginBottom: spacing.sm },
  iconCircle: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  className: { fontSize: fontSize.bodyLarge, fontWeight: '800', color: colors.text },
  classCount: { fontSize: fontSize.body, color: colors.textTertiary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', paddingVertical: 6 },
  cellLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '600', textTransform: 'uppercase' },
  cellValue: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginTop: 2 },
});
