import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

type Props = {
  size?: number;
  variant?: 'mark' | 'wordmark';
  color?: string;
};

// Logo "mark": V estilizado em círculo roxo (estilo Nubank).
// Wordmark: mark + texto Vesti ao lado.
export default function Logo({ size = 64, variant = 'mark', color }: Props) {
  const fg = color || colors.textLight;

  if (variant === 'wordmark') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <LogoMark size={size} fg={fg} />
        <View style={{ marginLeft: size * 0.25 }}>
          <WordmarkText size={size} />
        </View>
      </View>
    );
  }

  return <LogoMark size={size} fg={fg} />;
}

function LogoMark({ size, fg }: { size: number; fg: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.primary} />
          <Stop offset="1" stopColor={colors.primaryDark} />
        </LinearGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill="url(#grad)" />
      {/* V estilizado: duas linhas convergindo */}
      <Path
        d="M 28 28 L 50 72 L 72 28 L 64 28 L 50 56 L 36 28 Z"
        fill={fg}
      />
      {/* Pequeno detalhe: ponto crescente no topo do V direito */}
      <Circle cx="72" cy="28" r="4" fill={colors.gold} />
    </Svg>
  );
}

function WordmarkText({ size }: { size: number }) {
  const charSize = size * 0.7;
  return (
    <Svg width={charSize * 3.4} height={charSize}>
      <Path
        d="M0,0 L100,100"
        stroke="transparent"
      />
    </Svg>
  );
}
