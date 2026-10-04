import { Platform } from 'react-native';
import { adaptivePalette as palette } from './tokens';

export const editorial = {
  color: {
    canvas: palette.canvas,
    canvasRaised: palette.canvasRaised,
    ink: palette.ink,
    muted: palette.inkSecondary,
    faint: palette.inkMuted,
    line: palette.divider,
    indigo: palette.brand,
    indigoPressed: palette.brandPressed,
    indigoSoft: palette.brandSoft,
    coral: palette.accent,
    coralSoft: palette.accentSoft,
    sky: palette.sky,
    positive: palette.success,
    positiveSoft: palette.successSoft,
    warning: palette.warning,
    warningSoft: palette.warningSoft,
    danger: palette.danger,
    dangerSoft: palette.dangerSoft,
    inverse: palette.brandPressed,
    inverseMuted: palette.onBrand,
    white: palette.onBrand,
    scrim: palette.scrim,
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: { control: 10, soft: 14, feature: 20, navigation: 22, full: 999 },
  type: { kicker: 11, caption: 12, body: 15, title: 20, headline: 36, value: 31 },
  font: {
    display: Platform.select({ ios: 'New York', android: 'serif', web: 'Georgia, serif', default: 'serif' }),
    body: Platform.select({ ios: 'System', android: 'sans-serif', web: 'Inter, system-ui, sans-serif', default: 'System' }),
  },
  layout: { mobileGutter: 24, maxReadingWidth: 720, maxWorkspaceWidth: 1180, desktop: 900 },
  motion: { fast: 140, base: 220, slow: 360 },
} as const;

export const editorialType = {
  kicker: { fontFamily: editorial.font.body, fontSize: editorial.type.kicker, fontWeight: '700' as const, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: editorial.color.muted },
  headline: { fontFamily: editorial.font.display, fontSize: editorial.type.headline, lineHeight: 39, fontWeight: '600' as const, letterSpacing: -1.2, color: editorial.color.ink },
  section: { fontFamily: editorial.font.display, fontSize: editorial.type.title, lineHeight: 25, fontWeight: '600' as const, color: editorial.color.ink },
  body: { fontFamily: editorial.font.body, fontSize: editorial.type.body, lineHeight: 22, color: editorial.color.ink },
  caption: { fontFamily: editorial.font.body, fontSize: editorial.type.caption, lineHeight: 17, color: editorial.color.muted },
} as const;
