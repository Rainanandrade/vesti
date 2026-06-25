import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { AllocationClass, ALLOCATION_LABELS, TargetAllocation } from '../data/profileQuiz';
import Card from './Card';

const ALL_CLASSES: AllocationClass[] = ['acao', 'fii', 'etf', 'tesouro', 'cdb', 'internacional', 'outro'];

const DEFAULT_PRESET: TargetAllocation = { acao: 40, fii: 25, etf: 10, tesouro: 25 };

export default function AllocationConfig() {
  const { profile, setProfile } = useApp();
  const initial = profile?.targetAllocation || DEFAULT_PRESET;
  const [alloc, setAlloc] = useState<TargetAllocation>(initial);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = Object.values(alloc).reduce((s, v) => s + (v || 0), 0);
  const valid = Math.abs(total - 100) < 0.1;

  const updateClass = (k: AllocationClass, value: string) => {
    const num = parseFloat(value.replace(',', '.')) || 0;
    setAlloc((prev) => ({ ...prev, [k]: Math.max(0, Math.min(100, num)) }));
  };

  const removeClass = (k: AllocationClass) => {
    setAlloc((prev) => {
      const copy = { ...prev };
      delete copy[k];
      return copy;
    });
  };

  const addClass = (k: AllocationClass) => {
    setAlloc((prev) => ({ ...prev, [k]: 0 }));
    setAddModalOpen(false);
  };

  const save = async () => {
    if (!profile) return;
    if (!valid) {
      Alert.alert('Total inválido', `A soma das porcentagens deve dar 100% (atual: ${total.toFixed(1)}%).`);
      return;
    }
    setSaving(true);
    try {
      await setProfile({ ...profile, targetAllocation: alloc });
      Alert.alert('Pronto!', 'Alocação alvo salva.');
    } finally {
      setSaving(false);
    }
  };

  const availableToAdd = ALL_CLASSES.filter((c) => alloc[c] == null);
  const totalColor = valid ? colors.success : total > 100 ? colors.danger : colors.warning;

  return (
    <View>
      <Text style={styles.intro}>
        Defina a porcentagem ideal pra cada classe. A soma precisa dar 100%. O Vesti vai te avisar quando teu portfolio sair muito da meta.
      </Text>

      <Card>
        {Object.entries(alloc).map(([k, v]) => (
          <View key={k} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.className}>{ALLOCATION_LABELS[k as AllocationClass]}</Text>
            </View>
            <TextInput
              style={styles.input}
              value={String(v ?? 0)}
              onChangeText={(t) => updateClass(k as AllocationClass, t)}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <Text style={styles.percent}>%</Text>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeClass(k as AllocationClass)}
              hitSlop={10}
            >
              <Ionicons name="close-circle" size={22} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))}

        {availableToAdd.length > 0 && (
          <TouchableOpacity style={styles.addRow} onPress={() => setAddModalOpen(true)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addText}>Adicionar classe</Text>
          </TouchableOpacity>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={[styles.totalValue, { color: totalColor }]}>
            {total.toFixed(1)}% / 100%
          </Text>
        </View>
      </Card>

      <TouchableOpacity
        style={[styles.saveBtn, (!valid || saving) && { opacity: 0.5 }]}
        onPress={save}
        disabled={!valid || saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar alocação'}</Text>
      </TouchableOpacity>

      <Modal visible={addModalOpen} transparent animationType="fade" onRequestClose={() => setAddModalOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setAddModalOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Adicionar classe</Text>
            {availableToAdd.map((k) => (
              <TouchableOpacity key={k} style={styles.sheetItem} onPress={() => addClass(k)}>
                <Text style={styles.sheetItemText}>{ALLOCATION_LABELS[k]}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderColor: colors.divider },
  className: { fontSize: fontSize.bodyLarge, fontWeight: '600', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    minWidth: 60,
    textAlign: 'right',
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  percent: { color: colors.textSecondary, fontWeight: '700', marginLeft: 4, marginRight: spacing.sm },
  removeBtn: { padding: 4 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  addText: { color: colors.primary, fontWeight: '700', marginLeft: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: colors.divider },
  totalLabel: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text },
  totalValue: { fontSize: fontSize.title, fontWeight: 'bold' },
  saveBtn: { marginTop: spacing.md, backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  saveBtnText: { color: colors.textLight, fontWeight: '700', fontSize: fontSize.bodyLarge },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.background, borderRadius: radius.lg, padding: spacing.lg },
  sheetTitle: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  sheetItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  sheetItemText: { fontSize: fontSize.bodyLarge, color: colors.text },
});
