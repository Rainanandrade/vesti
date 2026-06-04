import { useEffect, useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { fetchQuotes } from '../api/brapi';
import { getAllReachedGoals, getGoals, Goal } from '../utils/goals';
import { rewardForGoal } from '../utils/rewards';
import { fmtBRL, fmtCompactBRL } from '../utils/format';
import Card from '../components/Card';
import CelebrationModal from '../components/CelebrationModal';

export default function GoalsScreen() {
  const { activeWallet, privacyMode } = useApp();
  const [patrimony, setPatrimony] = useState(0);
  const [openGoal, setOpenGoal] = useState<Goal | null>(null);

  const load = useCallback(async () => {
    if (!activeWallet) return;
    const symbols = activeWallet.assets
      .filter((a) => a.type === 'acao' || a.type === 'fii' || a.type === 'etf')
      .map((a) => a.symbol);
    const quotes = await fetchQuotes(symbols);
    const map: Record<string, number> = {};
    quotes.forEach((q) => (map[q.symbol] = q.regularMarketPrice));
    const total = activeWallet.assets.reduce(
      (s, a) => s + (map[a.symbol] ?? a.avgPrice) * a.quantity,
      0,
    );
    setPatrimony(total);
  }, [activeWallet]);

  useEffect(() => {
    load();
  }, [load]);

  const { current, next, reachedCount } = getGoals(patrimony);
  const reachedAll = getAllReachedGoals(patrimony);
  const progress = Math.min(100, (patrimony / next.value) * 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Suas metas</Text>
        <Text style={styles.subtitle}>Conquistas progressivas. Não tem teto.</Text>

        {/* Meta atual — clicável */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => current.reached && setOpenGoal(current)}>
          <Card style={[styles.currentCard, { marginTop: spacing.md }]}>
            <View style={styles.trophyRow}>
              <Text style={styles.trophy}>🏆</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.currentLabel}>Última meta batida</Text>
                <Text style={styles.currentValue}>{current.reached ? current.label : '—'}</Text>
                {current.reached && (
                  <Text style={styles.reachedCount}>
                    {reachedCount} conquista{reachedCount === 1 ? '' : 's'} · toque pra ver recompensa
                  </Text>
                )}
              </View>
              {current.reached && (
                <Ionicons name="chevron-forward" size={22} color={colors.textTertiary} />
              )}
            </View>
          </Card>
        </TouchableOpacity>

        {/* Próxima meta */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={styles.nextLabel}>Próxima meta</Text>
          <Text style={styles.nextValue}>{next.label}</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{progress.toFixed(1)}%</Text>
            <Text style={styles.progressText}>
              Falta {fmtCompactBRL(next.value - patrimony, privacyMode)}
            </Text>
          </View>
          <Text style={styles.totalText}>
            Patrimônio atual: <Text style={{ fontWeight: '700' }}>{fmtBRL(patrimony, privacyMode)}</Text>
          </Text>
        </Card>

        {/* Histórico */}
        {reachedAll.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={styles.sectionTitle}>Histórico de conquistas</Text>
            <Text style={styles.sectionHint}>Toque numa conquista pra ver a recompensa</Text>
            {reachedAll
              .slice()
              .reverse()
              .map((g, i) => {
                const reward = rewardForGoal(g.value);
                return (
                  <TouchableOpacity key={g.value} activeOpacity={0.7} onPress={() => setOpenGoal(g)}>
                    <Card style={styles.historyCard}>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyBadge}>{reward.badge}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.historyLabel}>{g.label}</Text>
                          <Text style={styles.historyReward}>{reward.title}</Text>
                        </View>
                        <Text style={styles.historyOrder}>#{reachedAll.length - i}</Text>
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
          </View>
        )}
      </ScrollView>

      {/* Celebração ao tocar numa conquista */}
      <CelebrationModal
        visible={openGoal !== null}
        goalValue={openGoal?.value ?? null}
        goalLabel={openGoal?.label || ''}
        variant="history"
        onClose={() => setOpenGoal(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.xs },
  currentCard: { backgroundColor: colors.warningLight, borderColor: colors.warning },
  trophyRow: { flexDirection: 'row', alignItems: 'center' },
  trophy: { fontSize: 48, marginRight: spacing.md },
  currentLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  currentValue: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.text },
  reachedCount: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  nextLabel: { fontSize: fontSize.body, color: colors.textSecondary },
  nextValue: { fontSize: fontSize.display, fontWeight: 'bold', color: colors.primary, marginVertical: spacing.sm },
  barBg: { height: 12, backgroundColor: colors.divider, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: 12, backgroundColor: colors.primary },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  progressText: { fontSize: fontSize.body, color: colors.textSecondary },
  totalText: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.md },
  sectionTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  sectionHint: { fontSize: fontSize.small, color: colors.textTertiary, marginBottom: spacing.sm },
  historyCard: { marginBottom: spacing.sm, padding: spacing.md },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyBadge: { fontSize: 28, marginRight: spacing.sm },
  historyLabel: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  historyReward: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2 },
  historyOrder: { fontSize: fontSize.small, color: colors.textTertiary, marginLeft: spacing.sm },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  sheet: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  rewardBadgeWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  rewardBadge: { fontSize: 56 },
  rewardGoal: { fontSize: fontSize.title, color: colors.textSecondary },
  rewardTitle: {
    fontSize: fontSize.display,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 4,
  },
  rewardMessage: {
    fontSize: fontSize.bodyLarge,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 24,
  },
  curiosityBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    width: '100%',
  },
  curiosityLabel: { fontSize: fontSize.body, fontWeight: '600', color: colors.primaryDark },
  curiosityText: { fontSize: fontSize.body, color: colors.text, marginTop: spacing.xs, lineHeight: 20 },
  closeBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  closeBtnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.bodyLarge },
});
