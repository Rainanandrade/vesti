import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';
import { Preference, PREFERENCE_INFO } from '../data/profileQuiz';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';

type Props = {
  // Quando true, é o fluxo forçado (usuário antigo sem preferência)
  forced?: boolean;
  navigation?: any;
};

export default function PreferenceScreen({ forced = false, navigation }: Props) {
  const { profile, setProfile } = useApp();
  const [selected, setSelected] = useState<Preference | null>(profile?.preference || null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selected || !profile) return;
    setSaving(true);
    try {
      await setProfile({ ...profile, preference: selected });
      if (navigation && !forced) navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const options: Preference[] = ['dividendos', 'crescimento', 'equilibrado', 'sem_preferencia'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {!forced && navigation && (
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>
            <View style={{ width: 26 }} />
          </View>
        )}

        <Text style={styles.tag}>
          {forced ? 'Atualização do app' : 'Escolha sua preferência'}
        </Text>
        <Text style={styles.title}>
          {forced
            ? 'Adicionamos uma escolha importante'
            : 'O que você prefere no longo prazo?'}
        </Text>
        <Text style={styles.subtitle}>
          {forced
            ? `Você é perfil ${profile?.type || ''}, mas isso é só sobre quanto risco você aguenta. Agora queremos saber o que você BUSCA com seus investimentos.`
            : `Você é perfil ${profile?.type || ''} — isso diz quanto risco você aguenta. Agora me diz o que você BUSCA com seus investimentos.`}
        </Text>

        <View style={styles.optionsList}>
          {options.map((opt) => {
            const info = PREFERENCE_INFO[opt];
            const isActive = selected === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.option, isActive && styles.optionActive]}
                onPress={() => setSelected(opt)}
                activeOpacity={0.7}
              >
                <Text style={styles.optionEmoji}>{info.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {info.label}
                  </Text>
                  <Text style={styles.optionDesc}>{info.description}</Text>
                </View>
                <Ionicons
                  name={isActive ? 'radio-button-on' : 'radio-button-off'}
                  size={22}
                  color={isActive ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.infoText}>
            Pode mudar depois em <Text style={{ fontWeight: '700' }}>Ajustes → Perfil financeiro</Text>.
          </Text>
        </View>

        <Button
          title="Salvar e continuar"
          onPress={handleSave}
          disabled={!selected}
          loading={saving}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  tag: { fontSize: fontSize.body, color: colors.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: fontSize.heading, fontWeight: 'bold', color: colors.text, marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.body, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 20 },
  optionsList: { marginTop: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  optionEmoji: { fontSize: 28, marginRight: spacing.md, marginTop: 2 },
  optionLabel: { fontSize: fontSize.bodyLarge, fontWeight: '700', color: colors.text, marginBottom: 4 },
  optionLabelActive: { color: colors.primaryDark },
  optionDesc: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 18 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  infoText: { flex: 1, fontSize: fontSize.body, color: colors.textSecondary, marginLeft: spacing.sm, lineHeight: 18 },
});
