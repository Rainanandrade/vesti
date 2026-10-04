import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, ColorSchemeName, Platform, useColorScheme, View } from 'react-native';
import { Storage } from '../storage/storage';
import { lightPalette, palette } from './tokens';

export type ThemeMode = 'system' | 'light' | 'dark';
const THEME_KEY = 'vesti_theme_mode';

type ThemeContextValue = {
  mode: ThemeMode;
  resolved: Exclude<ColorSchemeName, null | undefined>;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function syncWebTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.vestiTheme = resolved;
  document.documentElement.style.colorScheme = resolved;
  document.documentElement.style.backgroundColor = resolved === 'dark' ? palette.canvas : lightPalette.canvas;
  const id = 'vesti-light-theme-overrides';
  document.getElementById(id)?.remove();
  const colorMap = new Map<string, string>();
  for (const key of Object.keys(palette) as Array<keyof typeof palette>) {
    const dark = palette[key];
    const light = lightPalette[key];
    colorMap.set(String(dark).toLowerCase(), String(light));
    if (/^#[0-9a-f]{6}$/i.test(String(dark))) {
      const hex = String(dark).slice(1);
      const rgb = `rgb(${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)})`;
      colorMap.set(rgb.toLowerCase(), String(light));
    }
  }
  const overrides: string[] = [];
  const visit = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const declarations: string[] = [];
        for (const property of Array.from(rule.style)) {
          const value = rule.style.getPropertyValue(property).trim().toLowerCase();
          const replacement = colorMap.get(value);
          if (replacement) declarations.push(`${property}:${replacement}!important`);
        }
        if (declarations.length) {
          const selector = rule.selectorText.split(',').map((part) => `html[data-vesti-theme="light"] ${part.trim()}`).join(',');
          overrides.push(`${selector}{${declarations.join(';')}}`);
        }
      } else if ('cssRules' in rule) {
        try { visit((rule as CSSGroupingRule).cssRules); } catch { /* folha externa protegida */ }
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try { if (sheet.cssRules) visit(sheet.cssRules); } catch { /* folha externa protegida */ }
  }
  const style = document.createElement('style');
  style.id = id;
  style.textContent = overrides.join('\n');
  document.head.appendChild(style);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    Storage.get<ThemeMode>(THEME_KEY).then((saved) => {
      if (saved === 'system' || saved === 'light' || saved === 'dark') setModeState(saved);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(mode === 'system' ? null : mode);
    }
  }, [mode]);

  const resolved = mode === 'system' ? (system || 'dark') : mode;
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const frame = requestAnimationFrame(() => syncWebTheme(resolved));
      return () => cancelAnimationFrame(frame);
    }
  }, [resolved]);
  const value = useMemo<ThemeContextValue>(() => ({
    mode,
    resolved,
    setMode: async (next) => {
      setModeState(next);
      await Storage.set(THEME_KEY, next);
    },
  }), [mode, resolved]);

  return (
    <ThemeContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme precisa estar dentro de ThemeProvider');
  return value;
}
