# Vesti Interface Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every reachable Vesti interface with the approved warm, human personal-finance experience while preserving existing financial, authentication, entitlement, and database behavior.

**Architecture:** Introduce a compatibility-first design system, migrate the application shell to four destinations, then rebuild primary and supporting screens on focused UI primitives. Keep data acquisition and business logic stable; extract only pure presentation models where tests improve confidence, and remove legacy styling only after every route has migrated.

**Tech Stack:** Expo SDK 54, React Native 0.81, React Navigation 7, TypeScript 5.9, React Native SVG, Expo Haptics, Node built-in test runner.

---

## Documentation constraints

- Use only Expo SDK 54 documentation. Relevant references:
  - `https://docs.expo.dev/versions/v54.0.0/sdk/haptics/`
  - `https://docs.expo.dev/versions/v54.0.0/sdk/font/`
  - `https://docs.expo.dev/versions/v54.0.0/sdk/linear-gradient/`
- Install Expo libraries with `npx expo install`, never a raw package-manager add.
- Do not upgrade Expo or React Native during the redesign.

## File structure

### New design-system files

- `src/theme/tokens.ts`: semantic color, spacing, radius, typography, elevation, and layout tokens.
- `src/theme/type.ts`: platform-safe editorial and functional font-family selection.
- `src/ui/AppScreen.tsx`: safe-area, responsive width, background, and scrolling behavior.
- `src/ui/AppHeader.tsx`: title, greeting, avatar, back, notification, and trailing-action layouts.
- `src/ui/Section.tsx`: consistent section title, supporting text, and optional action.
- `src/ui/Surface.tsx`: quiet grouped surface; replaces indiscriminate card usage.
- `src/ui/FinancialHero.tsx`: net-worth and period-change presentation with privacy support.
- `src/ui/StatusSignal.tsx`: accessible semantic status summary.
- `src/ui/StateView.tsx`: loading, empty, error, retry, locked, and read-only states.
- `src/ui/Skeleton.tsx`: reduced-motion-aware loading placeholders.
- `src/ui/VestiPrompt.tsx`: contextual assistant entry point.
- `src/ui/haptics.ts`: guarded SDK-54 Expo Haptics calls.
- `src/features/today/timeline.ts`: pure monthly timeline construction.
- `src/features/today/TodayTimeline.tsx`: visual timeline.
- `src/features/today/TodaySignals.tsx`: month, portfolio, and risk signals.
- `src/features/today/TodayNextSteps.tsx`: transparent prioritized actions.
- `src/screens/PlanningScreen.tsx`: goals, income, contribution, and tools destination.
- `tests/ui-redesign.test.js`: static design-system, navigation, legacy-color, and accessibility invariants.
- `tests/today-timeline.test.js`: chronological timeline behavior.

### Existing files migrated in place

- `src/theme/colors.ts`: compatibility export backed by new semantic tokens.
- `src/components/Button.tsx`, `Card.tsx`, `AdaptiveTabBar.tsx`, `AIFloatingButton.tsx`, `ProLock.tsx`: new system behavior while preserving callers during migration.
- `src/navigation/RootNavigator.tsx`: four destinations and responsive rail.
- `src/screens/DashboardScreen.tsx`, `PortfolioScreen.tsx`, `LearnScreen.tsx`: Hoje, Investir, and Aprender.
- Every other file in `src/screens/` and every user-facing file in `src/components/`: migrate to the new tokens and primitives before completion.

## Task 1: Establish redesign invariants and theme foundation

**Files:**
- Create: `tests/ui-redesign.test.js`
- Create: `src/theme/tokens.ts`
- Create: `src/theme/type.ts`
- Modify: `src/theme/colors.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write the failing redesign invariant test**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('new brand tokens replace the legacy emerald and gold identity', () => {
  const tokens = read('src/theme/tokens.ts');
  assert.match(tokens, /canvas:\s*'#FBF8F3'/);
  assert.match(tokens, /brand:\s*'#5B4CF0'/);
  assert.match(tokens, /accent:\s*'#F07A6A'/);
  assert.doesNotMatch(tokens, /#0B5345|#C9A961/i);
});

test('main navigation exposes exactly four approved destinations', () => {
  const navigator = read('src/navigation/RootNavigator.tsx');
  for (const name of ['Hoje', 'Investir', 'Planejar', 'Aprender']) {
    assert.match(navigator, new RegExp(`name=["']${name}["']`));
  }
  assert.doesNotMatch(navigator, /name=["']Aportar["']/);
  assert.doesNotMatch(navigator, /name=["']Metas["']/);
});

test('contextual assistant is accessible by name', () => {
  const prompt = read('src/ui/VestiPrompt.tsx');
  assert.match(prompt, /accessibilityLabel/);
  assert.match(prompt, /Pergunte ao Vesti/);
});
```

- [ ] **Step 2: Run the test and verify the missing token/UI files fail**

Run: `node --test tests/ui-redesign.test.js`  
Expected: FAIL because `src/theme/tokens.ts` and `src/ui/VestiPrompt.tsx` do not exist.

- [ ] **Step 3: Install the SDK-compatible haptics package**

Run: `npx expo install expo-haptics`  
Expected: `expo-haptics` is added at the SDK 54-compatible version (`~15.0.8` according to the pinned documentation).

- [ ] **Step 4: Create the semantic token source**

```ts
// src/theme/tokens.ts
import { Platform } from 'react-native';

export const palette = {
  canvas: '#FBF8F3',
  canvasRaised: '#FFFFFF',
  canvasMuted: '#F3EFE8',
  ink: '#171A2C',
  inkSecondary: '#5E6275',
  inkMuted: '#8C90A0',
  brand: '#5B4CF0',
  brandPressed: '#4638D8',
  brandSoft: '#ECEAFE',
  accent: '#F07A6A',
  accentSoft: '#FDEBE7',
  periwinkle: '#8E91F2',
  sky: '#A8D8F0',
  success: '#27866F',
  successSoft: '#E4F3EE',
  warning: '#B86B24',
  warningSoft: '#FBEDDC',
  danger: '#C94A5A',
  dangerSoft: '#FBE7EA',
  border: '#E5E0D8',
  divider: '#ECE7DF',
  scrim: 'rgba(23, 26, 44, 0.42)',
} as const;

export const space = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 } as const;
export const typeScale = { caption: 11, label: 13, body: 15, bodyLarge: 17, title: 22, heading: 28, display: 38 } as const;
export const layout = { mobileGutter: 20, desktopGutter: 32, maxContentWidth: 1180, navRailWidth: 232, desktopBreakpoint: 900 } as const;
export const motion = { quick: 140, standard: 220, deliberate: 360 } as const;
export const elevation = Platform.select({
  web: { shadowColor: '#171A2C', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  default: { shadowColor: '#171A2C', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
});
```

- [ ] **Step 5: Define platform-safe type roles and compatibility exports**

```ts
// src/theme/type.ts
import { Platform } from 'react-native';

export const fontFamily = {
  display: Platform.select({ ios: 'New York', android: 'serif', web: 'Georgia, serif', default: 'serif' }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', web: 'Inter, system-ui, sans-serif', default: 'System' }),
  mono: Platform.select({ ios: 'SF Mono', android: 'monospace', web: 'ui-monospace, monospace', default: 'monospace' }),
} as const;
```

Replace `src/theme/colors.ts` with aliases backed by `tokens.ts`, so existing screens compile while they are migrated:

```ts
import { palette, radii, space, typeScale } from './tokens';

export const colors = {
  primary: palette.brand,
  primaryDark: palette.brandPressed,
  primaryLight: palette.brandSoft,
  primaryAccent: palette.accent,
  background: palette.canvas,
  surface: palette.canvasRaised,
  surfaceDark: palette.canvasMuted,
  text: palette.ink,
  textSecondary: palette.inkSecondary,
  textTertiary: palette.inkMuted,
  textLight: palette.canvasRaised,
  success: palette.success,
  successLight: palette.successSoft,
  danger: palette.danger,
  dangerLight: palette.dangerSoft,
  warning: palette.warning,
  warningLight: palette.warningSoft,
  border: palette.border,
  divider: palette.divider,
  gold: palette.accent,
  heroBg: palette.brand,
  heroBgDark: palette.brandPressed,
};

export const spacing = { xs: space.xs, sm: space.sm, md: space.lg, lg: space.xl, xl: space.xxl, xxl: space.xxxl };
export const fontSize = { tiny: typeScale.caption, small: typeScale.label, body: typeScale.body, bodyLarge: typeScale.bodyLarge, title: typeScale.title, heading: typeScale.heading, display: typeScale.display, hero: 44 };
export const radius = { sm: radii.sm, md: radii.md, lg: radii.lg, xl: radii.xl, pill: radii.pill };
```

- [ ] **Step 6: Run configuration checks**

Run: `node --test tests/config.test.js tests/ui-redesign.test.js && npm run typecheck`  
Expected: navigation and prompt assertions still fail; token assertion passes; TypeScript exits 0.

- [ ] **Step 7: Commit the foundation**

```bash
git add package.json package-lock.json src/theme tests/ui-redesign.test.js
git commit -m "feat: establish new Vesti visual foundation"
```

## Task 2: Build the reusable interface primitives

**Files:**
- Create: `src/ui/AppScreen.tsx`
- Create: `src/ui/AppHeader.tsx`
- Create: `src/ui/Section.tsx`
- Create: `src/ui/Surface.tsx`
- Create: `src/ui/FinancialHero.tsx`
- Create: `src/ui/StatusSignal.tsx`
- Create: `src/ui/StateView.tsx`
- Create: `src/ui/Skeleton.tsx`
- Create: `src/ui/VestiPrompt.tsx`
- Create: `src/ui/haptics.ts`
- Modify: `src/components/Button.tsx`
- Modify: `src/components/Card.tsx`

- [ ] **Step 1: Add responsive page and heading primitives**

Create `AppScreen` with this public interface:

```tsx
type AppScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function AppScreen({ children, scroll = true, refreshing = false, onRefresh, contentStyle }: AppScreenProps) {
  const { width } = useWindowDimensions();
  const content = (
    <View style={[styles.content, width >= layout.desktopBreakpoint && styles.contentWide, contentStyle]}>
      {children}
    </View>
  );
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.brand} /> : undefined}
        >
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}
```

`AppHeader` must expose `title`, `eyebrow`, `subtitle`, `onBack`, `onAvatar`, `onNotifications`, and `trailing` props. Add `accessibilityRole="header"` to the title container and labels to icon-only controls.

- [ ] **Step 2: Add compositional surfaces and sections**

```tsx
// src/ui/Surface.tsx
export function Surface({ children, tone = 'raised', style }: Props) {
  return <View style={[styles.base, toneStyles[tone], style]}>{children}</View>;
}

// src/ui/Section.tsx
export function Section({ title, description, action, children }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}
```

Use `palette.canvasRaised` only for meaningful grouping. `Surface` tones are `raised`, `muted`, `brandSoft`, and `transparent`.

- [ ] **Step 3: Add financial summary and state primitives**

`FinancialHero` receives `label`, `value`, `change`, `changeLabel`, `privacyMode`, `onTogglePrivacy`, and chart children. Its privacy button must announce whether values are currently hidden.

`StatusSignal` receives `icon`, `label`, `value`, `explanation`, and semantic `tone: 'neutral' | 'positive' | 'attention'`.

`StateView` receives this exact state model:

```ts
type StateViewProps = {
  kind: 'empty' | 'error' | 'locked' | 'readOnly';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};
```

- [ ] **Step 4: Add accessible loading and assistant entry points**

```tsx
// src/ui/VestiPrompt.tsx
export default function VestiPrompt({ contextLabel, onPress }: { contextLabel: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pergunte ao Vesti sobre ${contextLabel}`}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.icon}><Ionicons name="sparkles-outline" size={20} color={palette.brand} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>Pergunte ao Vesti</Text>
        <Text style={styles.subtitle}>Entenda seus números e planeje o próximo passo.</Text>
      </View>
      <Ionicons name="arrow-forward" size={18} color={palette.inkSecondary} />
    </Pressable>
  );
}
```

Use `AccessibilityInfo.isReduceMotionEnabled()` in `Skeleton` to disable looping opacity animation when reduced motion is enabled.

- [ ] **Step 5: Add guarded haptic helpers**

```ts
// src/ui/haptics.ts
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const safely = (effect: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  effect().catch(() => {});
};

export const haptics = {
  select: () => safely(() => Haptics.selectionAsync()),
  success: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
```

- [ ] **Step 6: Refactor Button and Card without breaking callers**

Keep the existing `Button` props, switch from `TouchableOpacity` to `Pressable`, add `accessibilityRole="button"`, and call `haptics.select()` only for enabled primary actions. Change `Card` to delegate to `Surface` while keeping its `children` and `style` API.

- [ ] **Step 7: Run primitive checks**

Run: `node --test tests/ui-redesign.test.js && npm run typecheck`  
Expected: contextual assistant assertion passes; only the navigation assertion remains failing.

- [ ] **Step 8: Commit primitives**

```bash
git add src/ui src/components/Button.tsx src/components/Card.tsx
git commit -m "feat: add accessible Vesti interface primitives"
```

## Task 3: Replace the application shell with four destinations

**Files:**
- Create: `src/screens/PlanningScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/components/AdaptiveTabBar.tsx`
- Modify: `tests/ui-redesign.test.js`

- [ ] **Step 1: Confirm the navigation test fails before the shell change**

Run: `node --test tests/ui-redesign.test.js`  
Expected: FAIL because the current tab navigator still contains Início, Carteira, Aportar, Metas, and Aprender.

- [ ] **Step 2: Create a functional Planejar destination**

Create `PlanningScreen.tsx` using `AppScreen`, `AppHeader`, `Section`, and `Surface`. Provide these route actions:

```tsx
const primaryActions = [
  { label: 'Planejar aporte', description: 'Distribua seu próximo investimento.', icon: 'add-circle-outline', route: 'Aporte' },
  { label: 'Minhas metas', description: 'Acompanhe patrimônio e renda futura.', icon: 'flag-outline', route: 'Goals' },
  { label: 'Renda futura', description: 'Projete sua meta de dividendos.', icon: 'trending-up-outline', route: 'DividendTarget' },
] as const;

const tools = [
  { label: 'Imposto de renda', route: 'IRAutomatico' },
  { label: 'Declaração anual', route: 'Declaracao' },
  { label: 'Relatórios', route: 'Relatorios' },
  { label: 'Simular estratégia', route: 'Backtest' },
] as const;
```

Render every action as an accessible row with label, description, icon, and chevron. The screen must be useful before later visual refinements.

- [ ] **Step 3: Replace the tab set**

Use these exact mappings in `MainTabs`:

```tsx
<Tab.Screen name="Hoje" component={DashboardScreen} />
<Tab.Screen name="Investir" component={PortfolioStackNavigator} />
<Tab.Screen name="Planejar" component={PlanningScreen} />
<Tab.Screen name="Aprender" component={LearnScreen} />
```

Move `AporteScreen` and `GoalsScreen` into `MainStack` as routes named `Aporte` and `Goals`. Keep every existing tool/detail route reachable.

- [ ] **Step 4: Rebuild mobile bar and desktop rail**

Use icons `home-outline`, `pie-chart-outline`, `compass-outline`, and `book-outline`. On mobile, render a custom four-item bar with 48-pixel minimum targets and no central raised button. On desktop, use `layout.navRailWidth`, brand title “Vesti”, subtitle “Sua vida financeira”, and the same destinations.

- [ ] **Step 5: Run navigation and type checks**

Run: `node --test tests/ui-redesign.test.js && npm run typecheck`  
Expected: all redesign invariant tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit the new shell**

```bash
git add src/navigation/RootNavigator.tsx src/components/AdaptiveTabBar.tsx src/screens/PlanningScreen.tsx tests/ui-redesign.test.js
git commit -m "feat: simplify Vesti into four destinations"
```

## Task 4: Rebuild Hoje from status, timeline, and next steps

**Files:**
- Create: `src/features/today/timeline.js`
- Create: `src/features/today/TodayTimeline.tsx`
- Create: `src/features/today/TodaySignals.tsx`
- Create: `src/features/today/TodayNextSteps.tsx`
- Create: `tests/today-timeline.test.js`
- Modify: `src/screens/DashboardScreen.tsx`

- [ ] **Step 1: Write failing timeline tests**

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildTodayTimeline } = require('../src/features/today/timeline');

test('builds a newest-first timeline from operations and proceeds', () => {
  const items = buildTodayTimeline({
    operations: [{ id: 'op', type: 'buy', symbol: 'PETR4', date: '2026-09-10', quantity: 10, price: 30 }],
    proventos: [{ id: 'p', symbol: 'PETR4', date: '2026-09-14', amount: 42 }],
    month: '2026-09',
  });
  assert.deepEqual(items.map((item) => item.id), ['provento:p', 'operation:op']);
  assert.equal(items[0].tone, 'positive');
});

test('ignores records outside the requested month and caps the result', () => {
  const operations = Array.from({ length: 12 }, (_, index) => ({
    id: String(index), type: 'buy', symbol: 'BOVA11', date: `2026-09-${String(index + 1).padStart(2, '0')}`, quantity: 1, price: 100,
  }));
  const items = buildTodayTimeline({ operations, proventos: [{ id: 'old', date: '2026-08-10', amount: 5 }], month: '2026-09', limit: 6 });
  assert.equal(items.length, 6);
  assert.ok(items.every((item) => item.date.startsWith('2026-09')));
});
```

- [ ] **Step 2: Run the timeline tests and verify failure**

Run: `node --test tests/today-timeline.test.js`  
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure timeline model**

Return records with `{ id, date, title, amount, detail, icon, tone }`. Purchases use a neutral tone and negative cash-flow amount; sales and proceeds use positive or neutral tones without implying investment profit. Sort descending by ISO date, filter by `month`, and apply `limit` after sorting.

- [ ] **Step 4: Run the timeline tests**

Run: `node --test tests/today-timeline.test.js`  
Expected: 2 tests pass.

- [ ] **Step 5: Split the Hoje presentation into focused components**

`TodaySignals` renders exactly three `StatusSignal` instances: current month cash direction, portfolio development, and risk balance. Each explanation cites the underlying input in plain language.

`TodayTimeline` renders timeline items with semantic icons, localized date, amount, and detail. When empty, use `StateView` with “Seu mês começa aqui” and the action “Registrar operação”.

`TodayNextSteps` accepts `CoachAction[]`, renders at most three items, and shows the reason below every action title.

- [ ] **Step 6: Recompose DashboardScreen as Hoje**

Preserve its existing quote, detail, dividend, notification, snapshot, and goal effects. Replace only the rendered hierarchy with:

```tsx
<AppScreen refreshing={refreshing} onRefresh={onRefresh}>
  <AppHeader eyebrow={greeting} title="Como você está hoje?" onAvatar={() => navigation.navigate('Settings')} onNotifications={() => navigation.navigate('Alerts')} />
  <FinancialHero label="Patrimônio" value={fmtBRL(totalCurrent)} change={profitPct} changeLabel="desde seus aportes" privacyMode={privacyMode} onTogglePrivacy={togglePrivacy}>
    <PortfolioChart data={snapshots.map((snapshot) => ({ date: snapshot.date, total: snapshot.total }))} privacyMode={privacyMode} />
  </FinancialHero>
  <TodaySignals monthData={monthData} portfolioData={portfolioData} riskData={healthData} />
  <VestiPrompt contextLabel="seu resumo financeiro" onPress={() => navigation.navigate('AIHub', { context: 'today' })} />
  <Section title="Seu mês até aqui"><TodayTimeline items={timelineItems} /></Section>
  <Section title="Próximos passos" description="Escolhidos a partir dos seus dados atuais."><TodayNextSteps actions={healthData.actions} onSelect={handleCoachAction} /></Section>
</AppScreen>
```

Move secondary market news, dividend details, and benchmark content to their existing dedicated destinations instead of retaining the 1,100-line dashboard feed.

- [ ] **Step 7: Verify Hoje**

Run: `node --test tests/today-timeline.test.js && npm run typecheck`  
Expected: tests pass and TypeScript exits 0.

- [ ] **Step 8: Commit Hoje**

```bash
git add src/features/today src/screens/DashboardScreen.tsx tests/today-timeline.test.js
git commit -m "feat: rebuild Hoje as a financial status story"
```

## Task 5: Consolidate the Investir journey

**Files:**
- Modify: `src/screens/PortfolioScreen.tsx`
- Modify: `src/screens/AssetsListScreen.tsx`
- Modify: `src/screens/AssetDetailScreen.tsx`
- Modify: `src/screens/AddAssetScreen.tsx`
- Modify: `src/screens/EditAssetScreen.tsx`
- Modify: `src/screens/OperacoesScreen.tsx`
- Modify: `src/screens/ProventosScreen.tsx`
- Modify: `src/screens/WatchlistScreen.tsx`
- Modify: `src/screens/CompareAssetsScreen.tsx`
- Modify: `src/components/PortfolioTabs.tsx`
- Modify: `src/components/PortfolioMetrics.tsx`
- Modify: `src/components/AssetTabs.tsx`
- Modify: `tests/ui-redesign.test.js`

- [ ] **Step 1: Extend the static test with Investir requirements**

```js
test('Investir exposes the consolidated sub-sections and read-only treatment', () => {
  const portfolio = read('src/screens/PortfolioScreen.tsx');
  assert.match(portfolio, /Carteira/);
  assert.match(portfolio, /Proventos/);
  assert.match(portfolio, /Operações/);
  assert.match(portfolio, /somente leitura/i);
});
```

- [ ] **Step 2: Run the new assertion and verify failure**

Run: `node --test tests/ui-redesign.test.js`  
Expected: FAIL until PortfolioScreen exposes all three sections and the shared-wallet state.

- [ ] **Step 3: Rebuild PortfolioScreen as the Investir landing page**

Use `AppScreen`, `AppHeader`, `FinancialHero`, and a three-value segmented control for `Carteira`, `Proventos`, and `Operações`. The header action opens a small action sheet with `Adicionar ativo`, `Registrar operação`, `Comparar`, and `Watchlist`. Show `StateView kind="readOnly"` above the content when `activeWallet` belongs to another user.

- [ ] **Step 4: Migrate asset and transaction lists**

Use `FlatList` for assets, operations, proceeds, and watchlist entries. Every row must provide an accessibility label combining symbol/name, relevant value, and change/status. Replace nested bordered cards with section spacing and quiet grouped surfaces.

- [ ] **Step 5: Migrate asset add/edit/detail flows**

Use `AppHeader onBack`, grouped `Surface` sections, persistent bottom primary action on mobile, and inline validation messages. Asset detail uses `Visão geral`, `Histórico`, and `Fundamentos`; discussions and news remain reachable below those primary sections.

- [ ] **Step 6: Run Investir checks**

Run: `node --test tests/ui-redesign.test.js && npm run typecheck`  
Expected: the consolidated Investir assertion and TypeScript pass.

- [ ] **Step 7: Commit Investir**

```bash
git add src/screens/PortfolioScreen.tsx src/screens/AssetsListScreen.tsx src/screens/AssetDetailScreen.tsx src/screens/AddAssetScreen.tsx src/screens/EditAssetScreen.tsx src/screens/OperacoesScreen.tsx src/screens/ProventosScreen.tsx src/screens/WatchlistScreen.tsx src/screens/CompareAssetsScreen.tsx src/components/PortfolioTabs.tsx src/components/PortfolioMetrics.tsx src/components/AssetTabs.tsx tests/ui-redesign.test.js
git commit -m "feat: consolidate the Investir experience"
```

## Task 6: Complete Planejar and migrate financial tools

**Files:**
- Modify: `src/screens/PlanningScreen.tsx`
- Modify: `src/screens/AporteScreen.tsx`
- Modify: `src/screens/AporteCalculatorScreen.tsx`
- Modify: `src/screens/GoalsScreen.tsx`
- Modify: `src/screens/DividendTargetScreen.tsx`
- Modify: `src/screens/IRAutomaticoScreen.tsx`
- Modify: `src/screens/IRCalculatorScreen.tsx`
- Modify: `src/screens/DeclaracaoScreen.tsx`
- Modify: `src/screens/RelatoriosScreen.tsx`
- Modify: `src/screens/BacktestScreen.tsx`
- Modify: `src/components/ProLock.tsx`

- [ ] **Step 1: Add a static tools-reachability test**

```js
test('Planejar keeps every approved planning tool reachable', () => {
  const planning = read('src/screens/PlanningScreen.tsx');
  for (const route of ['Aporte', 'Goals', 'DividendTarget', 'IRAutomatico', 'Declaracao', 'Relatorios', 'Backtest']) {
    assert.match(planning, new RegExp(route));
  }
});
```

- [ ] **Step 2: Refine the Planejar hierarchy**

Read current portfolio totals and goals from `useApp`. Render goal/future-income progress first, the contribution suggestion as the primary action, and the tools list afterward. Use descriptive rows; do not expose route names to the user.

- [ ] **Step 3: Migrate contribution and goal screens**

Replace hero gradients and dense card grids with `AppHeader`, `Section`, `Surface`, and a single primary action. Preserve all allocation calculations, goal persistence, privacy behavior, and Pro enforcement.

- [ ] **Step 4: Migrate tax and reporting tools without changing rules**

Wrap each tool in `AppScreen`; use the new segmented controls and inputs; keep the corrected tax engine and 2026 explanatory copy untouched. Present calculated results in `Surface tone="brandSoft"` and warnings in semantic attention surfaces.

- [ ] **Step 5: Make ProLock contextual**

Keep `mode="replace"` compatibility, but render an explanation surface with feature title, concrete value, and one upgrade button. Inline locked sections must not replace unrelated page content.

- [ ] **Step 6: Run regression checks**

Run: `node --test tests/ui-redesign.test.js tests/ir-engine.test.js tests/legal-copy.test.js && npm run typecheck`  
Expected: all selected tests pass and TypeScript exits 0.

- [ ] **Step 7: Commit Planejar and tools**

```bash
git add src/screens/PlanningScreen.tsx src/screens/AporteScreen.tsx src/screens/AporteCalculatorScreen.tsx src/screens/GoalsScreen.tsx src/screens/DividendTargetScreen.tsx src/screens/IRAutomaticoScreen.tsx src/screens/IRCalculatorScreen.tsx src/screens/DeclaracaoScreen.tsx src/screens/RelatoriosScreen.tsx src/screens/BacktestScreen.tsx src/components/ProLock.tsx tests/ui-redesign.test.js
git commit -m "feat: rebuild Planejar and financial tools"
```

## Task 7: Rebuild Aprender and contextual AI

**Files:**
- Modify: `src/screens/LearnScreen.tsx`
- Modify: `src/screens/NewsScreen.tsx`
- Modify: `src/screens/RankingsScreen.tsx`
- Modify: `src/screens/AIHubScreen.tsx`
- Modify: `src/screens/IAConsultorScreen.tsx`
- Modify: `src/components/AIFloatingButton.tsx`
- Modify: `src/components/AssetNewsFeed.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Make the learning path the Aprender lead**

Use `AppScreen` and `AppHeader`. Render the next recommended lesson and active progress before discovery content. Place news and rankings under a section titled `Explore também`, with explanatory subtitles.

- [ ] **Step 2: Replace the floating AI button with contextual VestiPrompt**

Convert `AIFloatingButton` into a compatibility wrapper around `VestiPrompt` during migration. Pass route params shaped as:

```ts
type AssistantContext = {
  source: 'today' | 'portfolio' | 'asset' | 'planning' | 'learning';
  assetSymbol?: string;
  period?: string;
};
```

Do not pass names, email addresses, or raw unbounded records.

- [ ] **Step 3: Restyle AIHub and consultant flows**

Use a normal page header, suggested questions, readable answer sections, explicit loading, and recoverable error states. Preserve server entitlement checks and AI response validation; do not add client-only authorization assumptions.

- [ ] **Step 4: Migrate news and rankings**

Use virtualized lists, bounded desktop width, source/date metadata, and clear external-link indicators. Keep ranking values factual and avoid recommendation language.

- [ ] **Step 5: Verify Aprender and AI**

Run: `node --test tests/entitlement.test.js tests/ai-response.test.js && npm run typecheck`  
Expected: AI safety and entitlement tests pass; TypeScript exits 0.

- [ ] **Step 6: Commit Aprender and assistant**

```bash
git add src/screens/LearnScreen.tsx src/screens/NewsScreen.tsx src/screens/RankingsScreen.tsx src/screens/AIHubScreen.tsx src/screens/IAConsultorScreen.tsx src/components/AIFloatingButton.tsx src/components/AssetNewsFeed.tsx src/navigation/RootNavigator.tsx
git commit -m "feat: make learning and AI contextual"
```

## Task 8: Migrate onboarding, authentication, subscription, and settings

**Files:**
- Modify: `src/screens/OnboardingScreen.tsx`
- Modify: `src/screens/AuthScreen.tsx`
- Modify: `src/screens/PasswordRecoveryScreen.tsx`
- Modify: `src/screens/PinScreen.tsx`
- Modify: `src/screens/ProfileQuizScreen.tsx`
- Modify: `src/screens/PreferenceScreen.tsx`
- Modify: `src/screens/ProSubscribeScreen.tsx`
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src/screens/LegalDocScreen.tsx`
- Modify: `src/screens/ShareWalletsScreen.tsx`
- Modify: `src/screens/AlertsScreen.tsx`

- [ ] **Step 1: Rebuild first-run screens as one visual family**

Use the ivory canvas, editorial heading, indigo primary actions, coral highlights, and functional sans-serif copy. Onboarding remains short and educational. Authentication and recovery retain all Supabase behavior and clearly separate primary and secondary actions.

- [ ] **Step 2: Rebuild PIN and profile setup**

Keep the persistent lockout helper and secure-write guarantees. Use large accessible PIN targets, announce failed-attempt/lock state to screen readers, and apply haptic warning only after the state transition has been persisted.

- [ ] **Step 3: Rebuild subscription presentation**

Use plain feature comparisons and one clear purchase/activation path. Preserve external payment restrictions, server-side entitlement semantics, legal disclaimers, and restore/access instructions.

- [ ] **Step 4: Rebuild Settings as grouped lists**

Group account, privacy, security, sharing, subscription, legal, and destructive actions. Use a destructive semantic surface for account deletion and keep its existing confirmation flow. Avoid presenting settings as a wall of unrelated cards.

- [ ] **Step 5: Verify authentication and safety regressions**

Run: `node --test tests/pin-lockout.test.js tests/database-hardening.test.js tests/legal-copy.test.js && npm run typecheck`  
Expected: all selected tests pass and TypeScript exits 0.

- [ ] **Step 6: Commit account flows**

```bash
git add src/screens/OnboardingScreen.tsx src/screens/AuthScreen.tsx src/screens/PasswordRecoveryScreen.tsx src/screens/PinScreen.tsx src/screens/ProfileQuizScreen.tsx src/screens/PreferenceScreen.tsx src/screens/ProSubscribeScreen.tsx src/screens/SettingsScreen.tsx src/screens/LegalDocScreen.tsx src/screens/ShareWalletsScreen.tsx src/screens/AlertsScreen.tsx
git commit -m "feat: unify Vesti account and settings flows"
```

## Task 9: Migrate remaining components and remove the legacy system

**Files:**
- Modify: `src/components/AllocationConfig.tsx`
- Modify: `src/components/AllocationDelta.tsx`
- Modify: `src/components/AssetAbout.tsx`
- Modify: `src/components/AssetAnalysis.tsx`
- Modify: `src/components/AssetClassCards.tsx`
- Modify: `src/components/AssetDiscussions.tsx`
- Modify: `src/components/AssetFinancials.tsx`
- Modify: `src/components/AssetProventosHistory.tsx`
- Modify: `src/components/AssetReturnsPanel.tsx`
- Modify: `src/components/BenchmarkSparkline.tsx`
- Modify: `src/components/CelebrationModal.tsx`
- Modify: `src/components/DividendTargetCard.tsx`
- Modify: `src/components/GestoresComparison.tsx`
- Modify: `src/components/HealthRing.tsx`
- Modify: `src/components/HowItWorksAporte.tsx`
- Modify: `src/components/IbovespaComparison.tsx`
- Modify: `src/components/InfoTooltip.tsx`
- Modify: `src/components/InvestorChecklist.tsx`
- Modify: `src/components/Isentometro.tsx`
- Modify: `src/components/Logo.tsx`
- Modify: `src/components/MarketStatusBar.tsx`
- Modify: `src/components/NewOperationModal.tsx`
- Modify: `src/components/PortfolioChart.tsx`
- Modify: `src/components/PortfolioDonut.tsx`
- Modify: `src/components/PremiumLockModal.tsx`
- Modify: `src/components/PriceChart.tsx`
- Modify: `src/components/ProventosBarChart.tsx`
- Modify: `src/components/ReleaseNotesModal.tsx`
- Modify: `src/components/RentabilidadeCompleta.tsx`
- Modify: `src/components/SuccessCelebrationModal.tsx`
- Modify: `src/components/TabPlaceholder.tsx`
- Modify: `src/components/Toast.tsx`
- Modify: `src/screens/IntegracoesScreen.tsx`
- Modify: `App.tsx`
- Modify: `tests/ui-redesign.test.js`

- [ ] **Step 1: Inventory remaining legacy imports and colors**

Run:

```bash
rg -n "#0B5345|#073B30|#C9A961|heroBgDark|primaryAccent|LinearGradient" src App.tsx
rg -L "../theme/|./theme/" src/screens/*.tsx src/components/*.tsx
```

Expected: produce the exact migration list; do not treat non-empty output as success.

- [ ] **Step 2: Migrate remaining charts, modals, and domain panels**

Use semantic visualization colors from `tokens.ts`, new surfaces, new typography roles, and accessibility summaries. Preserve chart calculations and domain component props. Modals use consistent sheets/dialog surfaces and provide explicit close labels.

- [ ] **Step 3: Update App loading and release notes**

Use `palette.canvas` for the loading root, `palette.brand` for the activity indicator, and migrate `ReleaseNotesModal`, celebration modals, toast, and operation modal to the new system.

- [ ] **Step 4: Strengthen the no-legacy assertion**

```js
test('user-facing source contains no legacy brand hex values', () => {
  const files = fs.readdirSync(path.join(root, 'src/screens')).filter((name) => name.endsWith('.tsx'))
    .map((name) => read(`src/screens/${name}`))
    .concat(fs.readdirSync(path.join(root, 'src/components')).filter((name) => name.endsWith('.tsx')).map((name) => read(`src/components/${name}`)));
  assert.doesNotMatch(files.join('\n'), /#0B5345|#073B30|#C9A961/i);
});
```

- [ ] **Step 5: Run the legacy scan and full type check**

Run:

```bash
node --test tests/ui-redesign.test.js
rg -n "#0B5345|#073B30|#C9A961" src App.tsx
npm run typecheck
```

Expected: tests pass, `rg` returns no matches, and TypeScript exits 0.

- [ ] **Step 6: Commit legacy removal**

```bash
git add App.tsx src tests/ui-redesign.test.js
git commit -m "refactor: remove the legacy Vesti interface"
```

## Task 10: Accessibility, responsiveness, and release verification

**Files:**
- Modify only files required by failures found in this task.

- [ ] **Step 1: Verify focus and screen-reader labels**

Search icon-only presses and inspect each result:

```bash
rg -n "<(Pressable|TouchableOpacity)" src/screens src/components src/ui
```

Every icon-only action must provide `accessibilityRole`, `accessibilityLabel`, and sufficient hit area. Every chart must expose a textual summary.

- [ ] **Step 2: Verify responsive widths**

Run web locally and inspect widths 375, 768, 1024, and 1440. Confirm no horizontal overflow, mobile bottom navigation below 900 pixels, desktop rail at or above 900 pixels, bounded content width, and readable two-column layouts where used.

- [ ] **Step 3: Verify critical states manually**

Check: no portfolio, populated portfolio, privacy mode, loading, recoverable API failure, shared read-only wallet, expired Pro access, active Pro access, PIN lockout, password recovery, and reduced motion.

- [ ] **Step 4: Run the complete automated suite**

Run: `npm run verify`  
Expected: all Node tests pass, TypeScript exits 0, JavaScript syntax checks pass, and Expo dependency validation reports the SDK 54 packages compatible. Record whether Expo used network or its offline dependency map.

- [ ] **Step 5: Produce a production web export**

Run: `npx expo export --platform web`  
Expected: Metro bundles the application and writes `dist`; `dist` remains ignored and unstaged.

- [ ] **Step 6: Inspect the final diff and repository state**

Run:

```bash
git diff --check
git status --short
git diff --stat origin/main...HEAD
```

Expected: no whitespace errors, no generated output or environment files, and only approved redesign/configuration/test files.

- [ ] **Step 7: Commit verification fixes, if any**

```bash
git add -u
git commit -m "fix: complete interface accessibility audit"
```

Skip this commit when verification required no changes.

- [ ] **Step 8: Push normally without force**

Run: `git push`  
Expected: the current `codex/production-hardening` branch and its configured remote are synchronized.
