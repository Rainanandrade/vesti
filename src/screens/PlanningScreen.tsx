import { StyleSheet, Text, View } from 'react-native';
import { editorial } from '../theme/editorial';
import { EditorialHeader, EditorialRow, EditorialScreen, EditorialSectionHeader, EditorialTitle, InsightNote, ProgressLine } from '../ui/editorial';

const objectives = [{ label: 'Planejar aporte', description: 'Distribua o próximo valor com intenção.', route: 'Aporte', marker: '01' }, { label: 'Minhas metas', description: 'Acompanhe objetivos e marcos patrimoniais.', route: 'Goals', marker: '02' }, { label: 'Renda futura', description: 'Projete a renda mensal que você quer construir.', route: 'DividendTarget', marker: '03' }] as const;
const tools = [{ label: 'Imposto de renda', description: 'Apure operações e organize o DARF.', route: 'IRAutomatico' }, { label: 'Declaração anual', description: 'Prepare os dados para o IRPF.', route: 'Declaracao' }, { label: 'Relatórios', description: 'Exporte uma leitura da carteira.', route: 'Relatorios' }, { label: 'Simular estratégia', description: 'Compare cenários históricos.', route: 'Backtest' }] as const;

export default function PlanningScreen({ navigation }: any) {
  return <EditorialScreen>
    <EditorialHeader context="Horizontes e decisões" onAvatar={() => navigation.navigate('Settings')} />
    <EditorialTitle kicker="Planejar" title="Dê forma ao futuro que você quer financiar." support="Metas, aportes e obrigações reunidos em uma sequência mais fácil de seguir." />
    <View style={styles.plan}><Text style={styles.planKicker}>Plano em foco</Text><Text style={styles.planTitle}>Seu próximo aporte pode ter um propósito claro.</Text><Text style={styles.planDetail}>Revise a prioridade, escolha o horizonte e transforme intenção em um movimento concreto.</Text><ProgressLine label="Clareza do plano · 2 de 3 etapas" value={67} color={editorial.color.coral} /></View>
    <EditorialSectionHeader title="Agora" meta="Próximas decisões" />
    <View>{objectives.map((item, index) => <EditorialRow key={item.route} last={index === objectives.length - 1} leading={<Text style={styles.index}>{item.marker}</Text>} title={item.label} detail={item.description} onPress={() => navigation.navigate(item.route)} />)}</View>
    <View style={styles.insight}><InsightNote title="Organize o próximo movimento" detail="O Vesti pode ajudar a conectar suas metas, seu perfil e o valor disponível." tone="coral" actionLabel="Conversar sobre o plano" onPress={() => navigation.navigate('AIHub', { context: { source: 'planning' } })} /></View>
    <EditorialSectionHeader title="Ferramentas" meta="Quando precisar" />
    <View>{tools.map((item, index) => <EditorialRow key={item.route} last={index === tools.length - 1} leading={<View style={styles.bullet} />} title={item.label} detail={item.description} onPress={() => navigation.navigate(item.route)} />)}</View>
  </EditorialScreen>;
}
const styles = StyleSheet.create({ plan: { padding: editorial.space.xl, borderRadius: editorial.radius.feature, backgroundColor: editorial.color.inverse, gap: editorial.space.sm }, planKicker: { color: editorial.color.coral, fontSize: editorial.type.kicker, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }, planTitle: { color: editorial.color.white, fontFamily: editorial.font.display, fontSize: 27, lineHeight: 31 }, planDetail: { color: editorial.color.inverseMuted, fontSize: editorial.type.body, lineHeight: 21, marginBottom: editorial.space.sm }, index: { color: editorial.color.coral, fontSize: editorial.type.kicker, fontWeight: '900' }, bullet: { width: 8, height: 8, borderRadius: 4, backgroundColor: editorial.color.indigo }, insight: { marginTop: editorial.space.xl } });
