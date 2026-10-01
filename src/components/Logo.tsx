import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { editorial } from '../theme/editorial';

type Props = {
  size?: number;
  variant?: 'mark' | 'wordmark';
  color?: string;
};

// Logo "mark": esmeralda profundo com folha/asas estilizadas em champagne.
// Wordmark: mark + "vesti." ao lado.
export default function Logo({ size = 64, variant = 'mark', color }: Props) {
  if (variant === 'wordmark') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <LogoMark size={size} />
        <Text style={[styles.wordmark, { fontSize: size * 0.6, marginLeft: size * 0.25 }]}>
          vesti<Text style={{ color: editorial.color.coral }}>.</Text>
        </Text>
      </View>
    );
  }
  return <LogoMark size={size} />;
}

function LogoMark({ size }: { size: number }) {
  // SVG inspirado no HTML enviado: forma de "broto/asas/calice" em champagne sobre esmeralda
  return (
    <Svg width={size} height={size} viewBox="0 0 600 600">
      <Rect x="0" y="0" width="600" height="600" rx="170" fill={editorial.color.indigo} />
      {/* Asa esquerda — curva pra baixo */}
      <Path
        d="M 200 215 C 200 300, 232 375, 285 432 C 292 440, 300 440, 300 432"
        fill="none"
        stroke={editorial.color.coral}
        strokeWidth="34"
        strokeLinecap="round"
      />
      {/* Asa direita — espelhada */}
      <Path
        d="M 400 215 C 400 300, 368 375, 315 432 C 308 440, 300 440, 300 432"
        fill="none"
        stroke={editorial.color.coral}
        strokeWidth="34"
        strokeLinecap="round"
      />
      {/* Folha esquerda no topo */}
      <Path
        d="M 200 215 C 182 178, 182 144, 207 118 C 232 144, 232 178, 215 215 Z"
        fill={editorial.color.coral}
      />
      {/* Folha direita no topo */}
      <Path
        d="M 400 215 C 418 178, 418 144, 393 118 C 368 144, 368 178, 385 215 Z"
        fill={editorial.color.coral}
      />
      {/* Gota central */}
      <Circle cx="300" cy="442" r="20" fill={editorial.color.coral} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    fontFamily: editorial.font.display,
    fontWeight: '700',
    color: editorial.color.ink,
    letterSpacing: -1,
  },
});
