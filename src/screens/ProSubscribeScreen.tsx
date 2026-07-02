import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import Card from '../components/Card';
import { safeBackToTabs } from '../utils/navigation';
import { useApp } from '../context/AppContext';

const PLAN_MONTHLY = 9.90;
const PLAN_YEARLY = 99.00; // 2 meses grátis (12 × 9,90 = 118,80)

type Feature = { icon: any; title: string; desc: string; available: 'now' | 'soon' };

const FEATURES: Feature[] = [
  { icon: 'sync-circle', title: 'Sincronização com corretora', desc: 'XP, Rico, BTG, Nubank e outras. Ativos aparecem sozinhos.', available: 'soon' },
  { icon: 'calculator', title: 'IR & DARF automático', desc: 'Calcula imposto mensal, gera DARF e informe de rendimentos.', available: 'soon' },
  { icon: 'sparkles', title: 'IA consultora da carteira', desc: 'Analisa mensalmente e sugere aportes personalizados.', available: 'soon' },
  { icon: 'notifications', title: 'Alertas inteligentes', desc: 'Data-com de dividendo, preço alvo, concentração de setor.', available: 'soon' },
  { icon: 'trending-up', title: 'Métricas avançadas', desc: 'Sharpe, Volatilidade, Max Drawdown e comparação com Ibovespa.', available: 'now' },
  { icon: 'wallet', title: 'Multi-carteira ilimitada', desc: 'Carteiras separadas pra você, cônjuge, filho, aposentadoria.', available: 'soon' },
  { icon: 'analytics', title: 'Backtesting & simulação', desc: '"E se eu tivesse comprado X em 2019?" + Monte Carlo pra aportes.', available: 'soon' },
  { icon: 'document-text', title: 'Relatórios PDF', desc: 'Extrato mensal e anual pro contador em 1 clique.', available: 'soon' },
  { icon: 'ribbon', title: 'Comparação com gestores', desc: 'Sua carteira × Verde × Dahlia × Trígono.', available: 'soon' },
];

export default function ProSubscribeScreen({ navigation }: any) {
  const { pro } = useApp();

  const handleSubscribe = (billing: 'monthly' | 'yearly') => {
    // TODO: integrar Mercado Pago Suscripciones (próxima sessão)
    Alert.alert(
      'Assinar Vesti Pro',
      `Pagamento via Mercado Pago em breve. Enquanto isso, você tem trial grátis de 7 dias ativo.\n\nPlano ${billing === 'yearly' ? 'anual (R$ 99)' : 'mensal (R$ 9,90)'} escolhido.`,
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => safeBackToTabs(navigation)} style={styles.iconBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark || '#053E31']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.diamondBox}>
            <Ionicons name="diamond" size={32} color={colors.gold} />
          </View>
          <Text style={styles.heroTitle}>Vesti Pro</Text>
          <Text style={styles.heroSubtitle}>
            Seu consultor de dividendos e IR automatizado.
          </Text>
          {pro.isTrial && pro.daysLeft != null && (
            <View style={styles.trialBadge}>
              <Ionicons name="time-outline" size={14} color={colors.textLight} />
              <Text style={styles.trialText}>
                Você tem {pro.daysLeft} {pro.daysLeft === 1 ? 'dia' : 'dias'} de trial
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Planos */}
        <View style={styles.plansRow}>
          <TouchableOpacity style={[styles.plan, styles.planYearly]} activeOpacity={0.9} onPress={() => handleSubscribe('yearly')}>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>MELHOR OFERTA</Text>
            </View>
            <Text style={styles.planName}>Anual</Text>
            <Text style={styles.planPrice}>R$ {PLAN_YEARLY.toFixed(0)}</Text>
            <Text style={styles.planPeriod}>/ano</Text>
            <Text style={styles.planEquiv}>≈ R$ {(PLAN_YEARLY / 12).toFixed(2)}/mês</Text>
            <Text style={styles.planSavings}>2 meses grátis</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.plan} activeOpacity={0.9} onPress={() => handleSubscribe('monthly')}>
            <Text style={styles.planName}>Mensal</Text>
            <Text style={styles.planPrice}>R$ {PLAN_MONTHLY.toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.planPeriod}>/mês</Text>
            <Text style={styles.planEquiv}> </Text>
            <Text style={styles.planSavings}>Cancele quando quiser</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <Text style={styles.sectionLabel}>Tudo que vem com o Pro</Text>
        {FEATURES.map((f, i) => (
          <Card key={i} style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  {f.available === 'soon' && (
                    <View style={styles.soonPill}>
                      <Text style={styles.soonText}>em breve</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          </Card>
        ))}

        <Text style={styles.footnote}>
          Você pode cancelar a qualquer momento nos ajustes da conta. Pagamento processado via Mercado Pago.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  hero: { padding: spacing.xl, borderRadius: radius.xl, alignItems: 'center', marginBottom: spacing.lg },
  diamondBox: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: fontSize.hero, fontWeight: '900', color: colors.textLight, marginTop: spacing.md, letterSpacing: -0.5 },
  heroSubtitle: { fontSize: fontSize.body, color: 'rgba(255,255,255,0.9)', marginTop: 6, textAlign: 'center' },
  trialBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 as any, marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  trialText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.small },

  plansRow: { flexDirection: 'row', gap: spacing.md as any, marginBottom: spacing.lg },
  plan: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.divider, position: 'relative', alignItems: 'center' },
  planYearly: { borderColor: colors.primary, borderWidth: 2 },
  planBadge: { position: 'absolute', top: -10, backgroundColor: colors.primary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill },
  planBadgeText: { color: colors.textLight, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  planName: { fontSize: fontSize.body, color: colors.textSecondary, fontWeight: '700', marginTop: 4 },
  planPrice: { fontSize: fontSize.heading, fontWeight: '900', color: colors.text, marginTop: 6 },
  planPeriod: { fontSize: fontSize.small, color: colors.textTertiary },
  planEquiv: { fontSize: fontSize.tiny, color: colors.textSecondary, marginTop: 4, minHeight: 14 },
  planSavings: { fontSize: fontSize.tiny, color: colors.success, fontWeight: '700', marginTop: 4 },

  sectionLabel: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  featureCard: { marginBottom: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start' },
  featureIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  featureDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  soonPill: { marginLeft: 8, backgroundColor: colors.warningLight, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  soonText: { fontSize: 9, color: colors.warning, fontWeight: '800', letterSpacing: 0.3 },

  footnote: { fontSize: fontSize.tiny, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg, lineHeight: 16 },
});
