import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { GLOSSARY } from '../data/glossary';

export default function InfoTooltip({ termName }: { termName: string }) {
  const [open, setOpen] = useState(false);
  const term = GLOSSARY.find((t) => t.term.toLowerCase() === termName.toLowerCase());

  if (!term) return null;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} hitSlop={10} style={styles.btn}>
        <Ionicons name="help-circle-outline" size={18} color={colors.primary} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.term}>{term.term}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.short}>{term.short}</Text>
            <ScrollView style={styles.body}>
              <Text style={styles.full}>{term.full}</Text>
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>💡 Exemplo</Text>
                <Text style={styles.exampleText}>{term.example}</Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: { marginLeft: 4 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: '70%',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  term: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text },
  short: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: 4 },
  body: { marginTop: spacing.md },
  full: { fontSize: fontSize.bodyLarge, color: colors.text, lineHeight: 22 },
  exampleBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  exampleLabel: { fontSize: fontSize.body, fontWeight: '600', color: colors.primaryDark, marginBottom: 4 },
  exampleText: { fontSize: fontSize.body, color: colors.text, lineHeight: 20 },
});
