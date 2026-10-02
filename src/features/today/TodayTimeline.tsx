import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { editorial } from '../../theme/editorial';
import { EditorialRow, EditorialState } from '../../ui/editorial';
import { fmtBRL } from '../../utils/format';

export type TimelineItem = { id: string; date: string; title: string; amount: number; detail: string; icon: keyof typeof Ionicons.glyphMap; tone: string };
export default function TodayTimeline({ items, onAdd, onSelect }: { items: TimelineItem[]; onAdd: () => void; onSelect: (item: TimelineItem) => void }) {
  if (!items.length) return <EditorialState kind="empty" title="Seu mês começa aqui" detail="Registre uma compra, venda ou rendimento para acompanhar sua história financeira." action={{ label: 'Registrar operação', onPress: onAdd }} />;
  return <View>{items.map((item, index) => { const date = new Date(`${item.date}T12:00:00`); const day = String(date.getDate()).padStart(2, '0'); const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(); return <EditorialRow key={item.id} last={index === items.length - 1} leading={<View style={styles.date}><Text style={styles.day}>{day}</Text><Text style={styles.month}>{month}</Text></View>} title={item.title} detail={item.detail} value={`${item.amount > 0 ? '+' : '−'} ${fmtBRL(Math.abs(item.amount))}`} trendTone={item.amount > 0 ? 'positive' : 'neutral'} onPress={() => onSelect(item)} />; })}</View>;
}
const styles = StyleSheet.create({ date: { width: 38, alignItems: 'center' }, day: { fontFamily: editorial.font.display, color: editorial.color.ink, fontSize: 18, lineHeight: 20 }, month: { color: editorial.color.muted, fontSize: 9, fontWeight: '700' } });
