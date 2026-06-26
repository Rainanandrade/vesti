import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
  onBuy: () => void;
  onSell: () => void;
};

export default function AddOptionsModal({ visible, onClose, onBuy, onSell }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Novo lançamento</Text>
          <Text style={styles.subtitle}>O que você quer registrar?</Text>

          <TouchableOpacity style={[styles.option, styles.buyOpt]} onPress={onBuy} activeOpacity={0.85}>
            <View style={[styles.iconBox, { backgroundColor: colors.successLight }]}>
              <Ionicons name="trending-up" size={24} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Compra de ativo</Text>
              <Text style={styles.optDesc}>Comprei novas cotas e quero adicionar à carteira</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.option, styles.sellOpt]} onPress={onSell} activeOpacity={0.85}>
            <View style={[styles.iconBox, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="trending-down" size={24} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optTitle}>Venda de ativo</Text>
              <Text style={styles.optDesc}>Vendi cotas e quero registrar pra cálculo de IR</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg },
  handle: { width: 40, height: 4, backgroundColor: colors.divider, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  title: { fontSize: fontSize.title, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.lg },
  option: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.sm },
  buyOpt: { borderColor: colors.successLight, backgroundColor: colors.background },
  sellOpt: { borderColor: colors.dangerLight, backgroundColor: colors.background },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  optTitle: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  optDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  cancelBtn: { padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  cancelText: { color: colors.textSecondary, fontWeight: '600' },
});
