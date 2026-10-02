import { Platform } from 'react-native';
export const palette = { canvas: '#11131B', canvasRaised: '#1A1D28', canvasMuted: '#1B1E29', ink: '#F7F4EF', inkSecondary: '#B7B8C5', inkMuted: '#8F93A2', brand: '#7C5CFF', brandPressed: '#6247D9', brandSoft: '#292445', accent: '#FF786B', accentSoft: '#3A242A', periwinkle: '#9A89FF', sky: '#73B9DB', success: '#70DDB0', successSoft: '#18392F', warning: '#F5B86A', warningSoft: '#3B2D1D', danger: '#FF7F91', dangerSoft: '#3D222B', border: '#303343', divider: '#292C38', scrim: 'rgba(4,5,10,0.72)' } as const;
export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radii = { sm: 8, md: 10, lg: 14, xl: 20, pill: 999 } as const;
export const typeScale = { caption: 11, label: 13, body: 15, bodyLarge: 17, title: 22, heading: 28, display: 38 } as const;
export const layout = { mobileGutter: 20, desktopGutter: 32, maxContentWidth: 1180, navRailWidth: 232, desktopBreakpoint: 900 } as const;
export const motion = { quick: 140, standard: 220, deliberate: 360 } as const;
export const elevation = Platform.select({ web: { boxShadow: '0 18px 42px rgba(5,6,14,0.34)' } as any, default: { boxShadow: '0 12px 28px rgba(5,6,14,0.32)' } as any });
