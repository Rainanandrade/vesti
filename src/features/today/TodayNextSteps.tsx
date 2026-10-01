import { StyleSheet, Text, View } from 'react-native';
import { CoachAction } from '../../utils/healthCoach';
import { editorial } from '../../theme/editorial';
import { EditorialRow, EditorialState } from '../../ui/editorial';

export default function TodayNextSteps({ actions, onSelect }: { actions: CoachAction[]; onSelect: (action: CoachAction) => void }) {
  if (!actions.length) return <EditorialState kind="empty" title="Nenhuma pendência por agora" detail="Quando surgir um próximo passo relevante, ele aparece aqui com o motivo." />;
  return <View>{actions.slice(0, 3).map((action, index) => <EditorialRow key={`${action.title}-${index}`} last={index === Math.min(actions.length, 3) - 1} leading={<Text style={styles.index}>{String(index + 1).padStart(2, '0')}</Text>} title={action.title} detail={action.description} onPress={() => onSelect(action)} />)}</View>;
}
const styles = StyleSheet.create({ index: { color: editorial.color.coral, fontSize: editorial.type.caption, fontWeight: '800' } });
