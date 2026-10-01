import { Platform } from 'react-native';
export const palette = { canvas: '#F5F0E8', canvasRaised: '#FFFCF7', canvasMuted: '#EEE9FF', ink: '#171827', inkSecondary: '#6C6674', inkMuted: '#8A838D', brand: '#5B4CF0', brandPressed: '#493BD1', brandSoft: '#EEE9FF', accent: '#FF655B', accentSoft: '#FBE2DC', periwinkle: '#8E91F2', sky: '#ABC8D8', success: '#28644F', successSoft: '#DEF0E7', warning: '#A96120', warningSoft: '#F7E8D4', danger: '#B93E50', dangerSoft: '#F8E1E5', border: '#D8D0C4', divider: '#D8D0C4', scrim: 'rgba(23,24,39,0.46)' } as const;
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radii = { sm: 8, md: 10, lg: 14, xl: 20, pill: 999 } as const;
export const typeScale = { caption: 11, label: 13, body: 15, bodyLarge: 17, title: 22, heading: 28, display: 38 } as const;
export const layout = { mobileGutter: 20, desktopGutter: 32, maxContentWidth: 1180, navRailWidth: 232, desktopBreakpoint: 900 } as const;
export const motion = { quick: 140, standard: 220, deliberate: 360 } as const;
export const elevation = Platform.select({ web: { shadowColor: '#171A2C', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } }, default: { shadowColor: '#171A2C', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 } });
