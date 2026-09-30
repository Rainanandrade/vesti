import { Platform } from 'react-native';
export const palette = { canvas: '#FBF8F3', canvasRaised: '#FFFFFF', canvasMuted: '#F3EFE8', ink: '#171A2C', inkSecondary: '#5E6275', inkMuted: '#8C90A0', brand: '#5B4CF0', brandPressed: '#4638D8', brandSoft: '#ECEAFE', accent: '#F07A6A', accentSoft: '#FDEBE7', periwinkle: '#8E91F2', sky: '#A8D8F0', success: '#27866F', successSoft: '#E4F3EE', warning: '#B86B24', warningSoft: '#FBEDDC', danger: '#C94A5A', dangerSoft: '#FBE7EA', border: '#E5E0D8', divider: '#ECE7DF', scrim: 'rgba(23, 26, 44, 0.42)' } as const;
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const typeScale = { caption: 11, label: 13, body: 15, bodyLarge: 17, title: 22, heading: 28, display: 38 } as const;
export const layout = { mobileGutter: 20, desktopGutter: 32, maxContentWidth: 1180, navRailWidth: 232, desktopBreakpoint: 900 } as const;
export const motion = { quick: 140, standard: 220, deliberate: 360 } as const;
export const elevation = Platform.select({ web: { shadowColor: '#171A2C', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, default: { shadowColor: '#171A2C', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 } });
