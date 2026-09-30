import { ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleProp, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { layout, palette, space } from '../theme/tokens';
type Props = { children: ReactNode; scroll?: boolean; refreshing?: boolean; onRefresh?: () => void; contentStyle?: StyleProp<ViewStyle> };
export default function AppScreen({ children, scroll = true, refreshing = false, onRefresh, contentStyle }: Props) { const { width } = useWindowDimensions(); const content = <View style={[styles.content, width >= layout.desktopBreakpoint && styles.wide, contentStyle]}>{children}</View>; return <SafeAreaView style={styles.safe} edges={['top']}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} /> : undefined}>{content}</ScrollView> : content}</SafeAreaView>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: palette.canvas }, scroll: { flexGrow: 1 }, content: { width: '100%', paddingHorizontal: layout.mobileGutter, paddingTop: space.md, paddingBottom: space.xxxl }, wide: { maxWidth: layout.maxContentWidth, alignSelf: 'center', paddingHorizontal: layout.desktopGutter } });
