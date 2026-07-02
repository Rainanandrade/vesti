import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors, fontSize, spacing } from '../theme/colors';

/**
 * Ponto de corte pra virar layout desktop (sidebar + conteúdo).
 * Abaixo disso, renderiza o BottomTabBar padrão do react-navigation.
 */
export const DESKTOP_BREAKPOINT = 900;
export const SIDEBAR_WIDTH = 220;

const ICONS: Record<string, { active: any; inactive: any }> = {
  Início: { active: 'home', inactive: 'home-outline' },
  Carteira: { active: 'wallet', inactive: 'wallet-outline' },
  Metas: { active: 'trophy', inactive: 'trophy-outline' },
  Aprender: { active: 'book', inactive: 'book-outline' },
  Aportar: { active: 'add-circle', inactive: 'add-circle-outline' },
};

export default function AdaptiveTabBar(props: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  if (!isDesktop) {
    return <BottomTabBar {...props} />;
  }

  return <Sidebar {...props} />;
}

function Sidebar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.sidebar}>
      <View style={styles.brandBox}>
        <Text style={styles.brand}>Vesti</Text>
        <Text style={styles.brandSub}>Sua carteira</Text>
      </View>

      <View style={{ flex: 1, paddingTop: spacing.md }}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : options.title ?? route.name;

          const iconSet = ICONS[route.name];
          const iconName = iconSet ? (focused ? iconSet.active : iconSet.inactive) : 'ellipse';

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.8}
              onPress={onPress}
              style={[styles.item, focused && styles.itemActive]}
            >
              <Ionicons
                name={iconName}
                size={22}
                color={focused ? colors.primary : colors.textSecondary}
              />
              {label ? (
                <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 Vesti</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    ...Platform.select({
      web: { position: 'fixed' as any, left: 0, top: 0, bottom: 0, height: '100vh' as any },
      default: { position: 'absolute', left: 0, top: 0, bottom: 0 },
    }),
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.background,
    borderRightWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    zIndex: 100,
  },
  brandBox: { paddingHorizontal: spacing.sm, paddingBottom: spacing.md, borderBottomWidth: 1, borderColor: colors.divider },
  brand: { fontSize: fontSize.title, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  brandSub: { fontSize: fontSize.tiny, color: colors.textTertiary, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  itemActive: { backgroundColor: colors.primaryLight },
  label: { color: colors.textSecondary, fontWeight: '600', marginLeft: spacing.md, fontSize: fontSize.body },
  labelActive: { color: colors.primary, fontWeight: '800' },

  footer: { paddingVertical: spacing.md, borderTopWidth: 1, borderColor: colors.divider },
  footerText: { color: colors.textTertiary, fontSize: fontSize.tiny, textAlign: 'center' },
});
