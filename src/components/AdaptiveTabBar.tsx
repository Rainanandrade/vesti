import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { editorial } from '../theme/editorial';

export const DESKTOP_BREAKPOINT = editorial.layout.desktop;
export const SIDEBAR_WIDTH = 220;
const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = { Hoje: 'sunny-outline', Investir: 'stats-chart-outline', Planejar: 'navigate-outline', Aprender: 'book-outline' };

export default function AdaptiveTabBar(props: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  return width >= DESKTOP_BREAKPOINT ? <Navigation {...props} desktop /> : <Navigation {...props} />;
}

function Navigation({ state, descriptors, navigation, desktop = false }: BottomTabBarProps & { desktop?: boolean }) {
  const insets = useSafeAreaInsets();
  return <View style={[desktop ? styles.rail : styles.mobileWrap, !desktop && { paddingBottom: Math.max(insets.bottom, 8) }]}>
    {desktop ? <View style={styles.brand}><Text style={styles.brandName}>vesti<Text style={styles.brandDot}>.</Text></Text><Text style={styles.brandSub}>clareza para decidir</Text></View> : null}
    <View style={desktop ? styles.railItems : styles.bar}>{state.routes.map((route, index) => {
      const focused = state.index === index;
      const options = descriptors[route.key].options;
      const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title || route.name;
      const press = () => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (event.defaultPrevented) return; if (route.name === 'Investir') (navigation.navigate as any)(route.name, { screen: 'PortfolioMain' }); else if (!focused) navigation.navigate(route.name as never); };
      return <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={String(label)} onPress={press} style={({ pressed }) => [desktop ? styles.railItem : styles.barItem, focused && (desktop ? styles.railActive : styles.barActive), pressed && styles.pressed]}><Ionicons name={ICONS[route.name]} size={desktop ? 20 : 19} color={focused ? editorial.color.white : editorial.color.inverseMuted} /><Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>{focused ? <View style={desktop ? styles.railPulse : styles.mobilePulse} /> : null}</Pressable>;
    })}</View>
    {desktop ? <View style={styles.railFoot}><View style={styles.railRule} /><Text style={styles.railNote}>Seu dinheiro, explicado.</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  mobileWrap: { backgroundColor: editorial.color.canvas, paddingHorizontal: 15, paddingTop: 6 },
  bar: { minHeight: 66, flexDirection: 'row', alignItems: 'center', backgroundColor: editorial.color.inverse, borderRadius: editorial.radius.navigation, borderWidth: 1, borderColor: editorial.color.line, paddingHorizontal: editorial.space.sm },
  barItem: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: editorial.radius.soft, opacity: 0.55 },
  barActive: { opacity: 1, backgroundColor: editorial.color.indigoSoft },
  mobilePulse: { position: 'absolute', top: 5, width: 18, height: 3, borderRadius: 2, backgroundColor: editorial.color.indigo },
  rail: { ...Platform.select({ web: { position: 'fixed' as any, height: '100vh' as any }, default: { position: 'absolute' as const, top: 0, bottom: 0 } }), left: 0, width: SIDEBAR_WIDTH, backgroundColor: editorial.color.inverse, padding: editorial.space.xl, zIndex: 100 },
  brand: { paddingVertical: editorial.space.lg, paddingHorizontal: editorial.space.sm, marginBottom: editorial.space.xl },
  brandName: { fontFamily: editorial.font.display, color: editorial.color.white, fontSize: 27, fontWeight: '700', letterSpacing: -1 },
  brandDot: { color: editorial.color.coral },
  brandSub: { color: editorial.color.inverseMuted, fontSize: editorial.type.kicker, marginTop: 3 },
  railItems: { flex: 1, gap: editorial.space.sm },
  railItem: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: editorial.space.md, paddingHorizontal: editorial.space.md, borderRadius: editorial.radius.soft, position: 'relative' },
  railActive: { backgroundColor: editorial.color.indigoSoft },
  railPulse: { position: 'absolute', left: -editorial.space.xl, width: 4, height: 24, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: editorial.color.indigo },
  label: { color: editorial.color.inverseMuted, fontSize: editorial.type.kicker, fontWeight: '600' },
  labelActive: { color: editorial.color.white, fontWeight: '800' },
  railFoot: { gap: editorial.space.md, padding: editorial.space.sm },
  railRule: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  railNote: { color: editorial.color.inverseMuted, fontFamily: editorial.font.display, fontSize: editorial.type.caption, lineHeight: 17 },
  pressed: { opacity: 0.65 },
});
