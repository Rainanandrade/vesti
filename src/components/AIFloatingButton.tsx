import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';
import { navigate } from '../navigation/RootNavigator';

type Props = {
  bottom?: number;
};

export default function AIFloatingButton({ bottom = 84 }: Props) {
  const handlePress = () => {
    // Usa o ref global pra navegar pra qualquer rota independente da árvore
    navigate('AIHub');
  };

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="box-none">
      <TouchableOpacity style={styles.fab} onPress={handlePress} activeOpacity={0.85}>
        <Ionicons name="sparkles" size={22} color={colors.textLight} />
        <Text style={styles.label}>IA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    right: spacing.md,
    alignItems: 'flex-end',
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  label: { color: colors.textLight, fontWeight: '800', marginLeft: 6, fontSize: 14 },
});
