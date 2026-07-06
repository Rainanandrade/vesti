import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '../theme/colors';

/**
 * Card didático explicando os 3 passos da tela Aportar.
 * Mostrado quando o usuário ainda não digitou valor.
 */
export default function HowItWorksAporte() {
  const steps = [
    {
      num: 1,
      icon: 'cash-outline',
      title: 'Você diz quanto vai aportar',
      desc: 'Ex: R$ 500, R$ 1.000 — o valor livre que você tem disponível pra investir agora.',
    },
    {
      num: 2,
      icon: 'sparkles-outline',
      title: 'A IA analisa 4 coisas',
      desc: 'Seu perfil (agressivo/moderado/conservador), sua preferência (dividendos/crescimento), a alocação atual da carteira e o mercado atual.',
    },
    {
      num: 3,
      icon: 'checkmark-circle-outline',
      title: 'Recebe sugestão personalizada',
      desc: 'Quais ativos comprar, quanto de cada, por quê. Você pode aceitar tudo, parte, ou usar como referência.',
    },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="bulb" size={20} color={colors.primary} />
        <Text style={styles.title}>Como funciona</Text>
      </View>
      {steps.map((s) => (
        <View key={s.num} style={styles.stepRow}>
          <View style={styles.stepNum}>
            <Text style={styles.stepNumText}>{s.num}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepTitle}>{s.title}</Text>
            <Text style={styles.stepDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 as any, marginBottom: spacing.md },
  title: { fontSize: fontSize.body, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },

  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md as any, marginBottom: spacing.sm },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: colors.textLight, fontWeight: '900', fontSize: fontSize.body },
  stepTitle: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  stepDesc: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
