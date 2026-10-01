import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { editorial } from '../../theme/editorial';

type Signal = { label: string; value: string; detail: string; tone: 'positive' | 'attention' | 'neutral' };

export default function TodaySignals({ cashFlow, profitPct, healthScore }: { cashFlow: number; profitPct: number; healthScore: number }) {
  const { width } = useWindowDimensions();
  const compact = width < 680;
  const signals: Signal[] = [
    { label: 'Este mês', value: cashFlow >= 0 ? 'No azul' : 'Atenção', detail: cashFlow >= 0 ? 'Entradas cobrem seus movimentos.' : 'Aportes superam as entradas.', tone: cashFlow >= 0 ? 'positive' : 'attention' },
    { label: 'Carteira', value: profitPct >= 0 ? 'Em evolução' : 'Em ajuste', detail: `${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(1)}% acumulado.`, tone: profitPct >= 0 ? 'positive' : 'attention' },
    { label: 'Equilíbrio', value: `${healthScore.toFixed(1)}/10`, detail: 'Diversificação, perfil e concentração.', tone: 'neutral' },
  ];
  return <View style={[styles.root, compact && styles.compact]}>{signals.map((signal, index) => <View key={signal.label} style={[styles.item, compact && styles.itemCompact, index > 0 && !compact && styles.divider]}><View style={styles.labelRow}><View style={[styles.dot, dotTone[signal.tone]]} /><Text style={styles.label}>{signal.label}</Text></View><Text style={styles.value}>{signal.value}</Text><Text style={styles.detail}>{signal.detail}</Text></View>)}</View>;
}

const dotTone = StyleSheet.create({ positive: { backgroundColor: editorial.color.positive }, attention: { backgroundColor: editorial.color.coral }, neutral: { backgroundColor: editorial.color.indigo } });
const styles = StyleSheet.create({ root: { flexDirection: 'row', borderBottomWidth: 1, borderColor: editorial.color.line, paddingVertical: editorial.space.lg }, compact: { flexDirection: 'column', gap: 0 }, item: { flex: 1, paddingHorizontal: editorial.space.lg }, itemCompact: { paddingHorizontal: 0, paddingVertical: editorial.space.md, borderBottomWidth: 1, borderColor: editorial.color.line }, divider: { borderLeftWidth: 1, borderColor: editorial.color.line }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: editorial.space.sm, marginBottom: editorial.space.sm }, dot: { width: 7, height: 7, borderRadius: 4 }, label: { color: editorial.color.muted, fontSize: editorial.type.kicker, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 }, value: { color: editorial.color.ink, fontFamily: editorial.font.display, fontSize: 22, marginBottom: 3 }, detail: { color: editorial.color.muted, fontSize: editorial.type.caption, lineHeight: 17 } });
