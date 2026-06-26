import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontSize, radius, spacing } from '../theme/colors';

type Props = {
  score: number;       // 0 a 10
  title?: string;
  message?: string;
  size?: number;
};

const MESSAGES = [
  'Carteira em fase inicial',
  'Comece registrando ativos',
  'Comece registrando ativos',
  'Em construção. Invista mensalmente.',
  'A crescer. Consistência é a chave.',
  'Em construção. Continue aportando.',
  'Razoável. Mais aportes melhoram a nota.',
  'Boa. Considere adicionar um ETF.',
  'Boa diversificação e consistência.',
  'Muito boa saúde. Continue o ritmo.',
  'Carteira excelente!',
];

export default function HealthRing({ score, title = 'Saúde da Carteira', message, size = 64 }: Props) {
  const safeScore = Math.max(0, Math.min(10, score));
  const r = size / 2 - 6;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - safeScore / 10);
  const color =
    safeScore >= 8 ? colors.success :
    safeScore >= 5 ? colors.primaryAccent :
    colors.danger;

  return (
    <View style={styles.card}>
      <View style={[styles.ring, { width: size, height: size }]}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.divider} strokeWidth={5} />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeDasharray={`${circ}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.scoreAbs}>
          <Text style={[styles.score, { color }]}>{safeScore}</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.msg}>{message || MESSAGES[safeScore]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  ring: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  scoreAbs: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' } as any,
  score: { fontSize: 17, fontWeight: '800' },
  info: { flex: 1, marginLeft: spacing.md },
  title: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  msg: { fontSize: fontSize.small, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
