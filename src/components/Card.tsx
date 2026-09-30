import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Surface from '../ui/Surface';

export default function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <Surface style={style}>{children}</Surface>;
}
