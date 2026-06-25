import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: string;
};

export default function PremiumLockModal({
  visible,
  onClose,
  title = 'Função PRO',
  description,
  feature = 'Essa função',
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark || '#5C0593']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.proBadge}>
              <Ionicons name="diamond" size={14} color={colors.primary} />
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Em breve no Vesti</Text>
          </LinearGradient>

          <View style={styles.body}>
            <Text style={styles.desc}>
              {description ||
                `${feature} faz parte do plano Premium. Estamos finalizando os últimos detalhes pra liberar em breve com toda a segurança.`}
            </Text>

            <View style={styles.features}>
              <FeatureItem icon="sync" text="Sincronização automática com a B3" />
              <FeatureItem icon="cloud-download" text="Importação de toda sua carteira" />
              <FeatureItem icon="time" text="Histórico completo de operações" />
              <FeatureItem icon="shield-checkmark" text="Conexão criptografada" />
            </View>

            <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.btnText}>Entendi, avisa quando lançar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FeatureItem({ icon, text }: { icon: any; text: string }) {
  return (
    <View style={styles.featRow}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={styles.featText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.background, borderRadius: radius.xl, overflow: 'hidden' },
  headerGradient: { padding: spacing.lg, alignItems: 'center' },
  proBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.textLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, marginBottom: spacing.sm },
  proBadgeText: { color: colors.primary, fontWeight: '800', marginLeft: 4, fontSize: 11, letterSpacing: 0.5 },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.textLight, textAlign: 'center' },
  subtitle: { fontSize: fontSize.body, color: '#FFFFFFCC', textAlign: 'center', marginTop: 4 },
  body: { padding: spacing.lg },
  desc: { fontSize: fontSize.body, color: colors.text, lineHeight: 22, textAlign: 'center' },
  features: { marginTop: spacing.lg, gap: spacing.sm as any },
  featRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  featText: { color: colors.text, marginLeft: spacing.sm, fontSize: fontSize.body },
  btn: { marginTop: spacing.lg, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.bodyLarge },
});
