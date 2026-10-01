import { Platform } from 'react-native';

export const editorial = {
  color: {
    canvas: '#F5F0E8',
    canvasRaised: '#FFFCF7',
    ink: '#171827',
    muted: '#6C6674',
    faint: '#8A838D',
    line: '#D8D0C4',
    indigo: '#5B4CF0',
    indigoPressed: '#493BD1',
    indigoSoft: '#EEE9FF',
    coral: '#FF655B',
    coralSoft: '#FBE2DC',
    sky: '#ABC8D8',
    positive: '#28644F',
    positiveSoft: '#DEF0E7',
    warning: '#A96120',
    warningSoft: '#F7E8D4',
    danger: '#B93E50',
    dangerSoft: '#F8E1E5',
    inverse: '#201D31',
    inverseMuted: '#BDB8C9',
    white: '#FFFFFF',
    scrim: 'rgba(23,24,39,0.46)',
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
