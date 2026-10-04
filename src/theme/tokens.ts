import { DynamicColorIOS, Platform, PlatformColor } from 'react-native';
export const palette = { canvas: '#11131B', canvasRaised: '#1A1D28', canvasMuted: '#1B1E29', ink: '#F7F4EF', inkSecondary: '#B7B8C5', inkMuted: '#8F93A2', onBrand: '#FFFFFF', brand: '#7C5CFF', brandPressed: '#6247D9', brandSoft: '#292445', accent: '#FF786B', accentSoft: '#3A242A', periwinkle: '#9A89FF', sky: '#73B9DB', success: '#70DDB0', successSoft: '#18392F', warning: '#F5B86A', warningSoft: '#3B2D1D', danger: '#FF7F91', dangerSoft: '#3D222B', border: '#303343', divider: '#292C38', scrim: 'rgba(4,5,10,0.72)' } as const;
export const lightPalette = { canvas: '#F8F7FC', canvasRaised: '#FFFFFF', canvasMuted: '#F0EEF7', ink: '#171523', inkSecondary: '#555166', inkMuted: '#777287', onBrand: '#FFFFFF', brand: '#6847F5', brandPressed: '#5436D8', brandSoft: '#EAE5FF', accent: '#E95E52', accentSoft: '#FFE8E5', periwinkle: '#7563E8', sky: '#2F86AA', success: '#167C5B', successSoft: '#DDF5EB', warning: '#9A5B10', warningSoft: '#FFF0D9', danger: '#C23D55', dangerSoft: '#FFE4EA', border: '#D9D5E4', divider: '#E8E5EF', scrim: 'rgba(23,21,35,0.45)' } as const;

function adaptive(light: string, dark: string, androidSemantic?: string): any {
  if (Platform.OS === 'ios') return DynamicColorIOS({ light, dark });
  if (Platform.OS === 'android' && androidSemantic) return PlatformColor(androidSemantic);
  // No web, o RN Web valida cores durante a criação do StyleSheet. Mantemos a
  // cor escura válida e o ThemeProvider gera overrides CSS para o modo claro.
  if (Platform.OS === 'web') return dark;
  return dark;
}

export const adaptivePalette = {
  canvas: adaptive(lightPalette.canvas, palette.canvas, '?android:attr/colorBackground'),
  canvasRaised: adaptive(lightPalette.canvasRaised, palette.canvasRaised, '?android:attr/colorBackgroundFloating'),
  canvasMuted: adaptive(lightPalette.canvasMuted, palette.canvasMuted, '?android:attr/colorBackground'),
  ink: adaptive(lightPalette.ink, palette.ink, '?android:attr/textColorPrimary'),
  inkSecondary: adaptive(lightPalette.inkSecondary, palette.inkSecondary, '?android:attr/textColorSecondary'),
  inkMuted: adaptive(lightPalette.inkMuted, palette.inkMuted, '?android:attr/textColorTertiary'),
  onBrand: palette.onBrand,
  brand: adaptive(lightPalette.brand, palette.brand, '?android:attr/colorAccent'), brandPressed: adaptive(lightPalette.brandPressed, palette.brandPressed, '?android:attr/colorAccent'), brandSoft: adaptive(lightPalette.brandSoft, palette.brandSoft, '?android:attr/colorBackgroundFloating'),
  accent: adaptive(lightPalette.accent, palette.accent, '?android:attr/colorAccent'), accentSoft: adaptive(lightPalette.accentSoft, palette.accentSoft, '?android:attr/colorBackgroundFloating'), periwinkle: adaptive(lightPalette.periwinkle, palette.periwinkle, '?android:attr/colorAccent'), sky: adaptive(lightPalette.sky, palette.sky, '?android:attr/colorAccent'),
  success: adaptive(lightPalette.success, palette.success, '?android:attr/textColorPrimary'), successSoft: adaptive(lightPalette.successSoft, palette.successSoft, '?android:attr/colorBackgroundFloating'), warning: adaptive(lightPalette.warning, palette.warning, '?android:attr/textColorPrimary'), warningSoft: adaptive(lightPalette.warningSoft, palette.warningSoft, '?android:attr/colorBackgroundFloating'), danger: adaptive(lightPalette.danger, palette.danger, '?android:attr/textColorPrimary'), dangerSoft: adaptive(lightPalette.dangerSoft, palette.dangerSoft, '?android:attr/colorBackgroundFloating'),
  border: adaptive(lightPalette.border, palette.border, '?android:attr/textColorTertiary'), divider: adaptive(lightPalette.divider, palette.divider, '?android:attr/textColorTertiary'), scrim: adaptive(lightPalette.scrim, palette.scrim),
} as const;
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radii = { sm: 8, md: 10, lg: 14, xl: 20, pill: 999 } as const;
export const typeScale = { caption: 11, label: 13, body: 15, bodyLarge: 17, title: 22, heading: 28, display: 38 } as const;
export const layout = { mobileGutter: 20, desktopGutter: 32, maxContentWidth: 1180, navRailWidth: 232, desktopBreakpoint: 900 } as const;
export const motion = { quick: 140, standard: 220, deliberate: 360 } as const;
export const elevation = Platform.select({ web: { boxShadow: '0 18px 42px rgba(5,6,14,0.34)' } as any, default: { boxShadow: '0 12px 28px rgba(5,6,14,0.32)' } as any });
