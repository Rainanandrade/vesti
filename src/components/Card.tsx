import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { editorial } from '../theme/editorial';

export default function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.compatibility, style]}>{children}</View>;
}

const styles = StyleSheet.create({ compatibility: { paddingVertical: editorial.space.lg, borderTopWidth: 1, borderBottomWidth: 1, borderColor: editorial.color.line } });
