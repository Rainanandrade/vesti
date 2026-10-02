import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { editorial } from '../../theme/editorial';

type Signal = { label: string; value: string; detail: string; tone: 'positive' | 'attention' | 'neutral'; onPress: () => void };

export default function TodaySignals({ cashFlow, profitPct, healthScore, monthlyIncome, onOpenAporte, onOpenPortfolio, onOpenIncome, onOpenHealth }: { cashFlow: number; profitPct: number; healthScore: number; monthlyIncome: number; onOpenAporte: () => void; onOpenPortfolio: () => void; onOpenIncome: () => void; onOpenHealth: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 680;
  const signals: Signal[] = [
    { label: 'Este mês', value: cashFlow >= 0 ? 'No azul' : 'Atenção', detail: cashFlow >= 0 ? 'Planeje o próximo aporte.' : 'Revise o ritmo dos aportes.', tone: cashFlow >= 0 ? 'positive' : 'attention', onPress: onOpenAporte },
    { label: 'Carteira', value: profitPct >= 0 ? 'Em evolução' : 'Em ajuste', detail: `${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(1)}% acumulado.`, tone: profitPct >= 0 ? 'positive' : 'attention', onPress: onOpenPortfolio },
    { label: 'Proventos', value: monthlyIncome > 0 ? `R$ ${monthlyIncome.toFixed(0)}` : 'Começar', detail: 'Rendimentos recebidos no mês.', tone: monthlyIncome > 0 ? 'positive' : 'neutral', onPress: onOpenIncome },
    { label: 'Equilíbrio', value: `${healthScore.toFixed(1)}/10`, detail: 'Diversificação, perfil e concentração.', tone: 'neutral', onPress: onOpenHealth },
  ];
  return <View style={[styles.root, compact && styles.compact]}>{signals.map((signal, index) => <Pressable key={signal.label} accessibilityRole="button" accessibilityLabel={`${signal.label}: ${signal.value}`} onPress={signal.onPress} style={({ pressed }) => [styles.item, compact && styles.itemCompact, index > 0 && !compact && styles.divider, pressed && styles.pressed]}><View style={styles.labelRow}><View style={[styles.dot, dotTone[signal.tone]]} /><Text style={styles.label}>{signal.label}</Text></View><Text style={styles.value}>{signal.value}</Text><Text style={styles.detail}>{signal.detail}</Text></Pressable>)}</View>;
}

const dotTone = StyleSheet.create({ positive: { backgroundColor: editorial.color.positive }, attention: { backgroundColor: editorial.color.coral }, neutral: { backgroundColor: editorial.color.indigo } });
const styles = StyleSheet.create({ root: { flexDirection: 'row', borderBottomWidth: 1, borderColor: editorial.color.line, paddingVertical: editorial.space.lg }, compact: { flexDirection: 'column', gap: 0 }, item: { flex: 1, minHeight: 96, paddingHorizontal: editorial.space.lg, justifyContent: 'center' }, itemCompact: { paddingHorizontal: 0, paddingVertical: editorial.space.md, borderBottomWidth: 1, borderColor: editorial.color.line }, divider: { borderLeftWidth: 1, borderColor: editorial.color.line }, pressed: { opacity: 0.68 }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: editorial.space.sm, marginBottom: editorial.space.sm }, dot: { width: 7, height: 7, borderRadius: 4 }, label: { color: editorial.color.muted, fontSize: editorial.type.kicker, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }, value: { color: editorial.color.ink, fontFamily: editorial.font.display, fontSize: 22, marginBottom: 3 }, detail: { color: editorial.color.muted, fontSize: editorial.type.caption, lineHeight: 17 } });
