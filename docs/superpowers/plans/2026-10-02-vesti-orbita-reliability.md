# Vesti Órbita Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every core Vesti flow recoverable and interactive while migrating the complete reachable interface to the approved Órbita visual system.

**Architecture:** Preserve Expo SDK 54, React Navigation, Supabase, and the current four-tab information architecture. Add a wallet invariant layer, enforce a single bounded async contract, expose editing from asset detail, connect Hoje metrics to their destination screens, and turn the existing editorial tokens/primitives into the sole Órbita design system with legacy tokens acting only as compatibility aliases.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, React Navigation 7, Supabase JS 2, Node test runner, TypeScript.

---

### Task 1: Lock the production regressions with failing tests

**Files:**
- Create: `tests/wallet-invariant.test.js`
- Modify: `tests/ui-redesign.test.js`
- Modify: `tests/async-timeout.test.js`

- [ ] **Step 1: Write failing wallet reset tests**

Test that a reset result contains exactly one owned writable wallet, that it is active, and that missing-wallet hydration chooses or creates a writable wallet rather than a shared read-only wallet.

- [ ] **Step 2: Write failing interaction tests**

Assert that asset detail exposes `Editar posição`, the portfolio position route supplies enough identity to edit, Hoje metrics have concrete handlers, and the reset implementation recreates `Carteira principal` before replacing local state.

- [ ] **Step 3: Write failing async cleanup tests**

Audit `EditAssetScreen`, `PriceChart`, `AssetReturnsPanel`, `AssetProventosHistory`, `IbovespaComparison`, Dashboard refresh, and Portfolio refresh for rejection handling and guaranteed pending-state cleanup.

- [ ] **Step 4: Run the focused tests and confirm RED**

Run: `node --test tests/wallet-invariant.test.js tests/async-timeout.test.js tests/ui-redesign.test.js`

Expected: failures for missing wallet invariant, missing edit affordance, missing interactive metrics, and loaders without cleanup.

### Task 2: Restore the active-wallet invariant

**Files:**
- Create: `src/utils/walletInvariant.js`
- Modify: `src/context/AppContext.tsx`
- Test: `tests/wallet-invariant.test.js`

- [ ] **Step 1: Implement pure wallet selection helpers**

Export helpers that select an existing owned writable active wallet and create the canonical local representation of `Carteira principal` from a Supabase wallet row.

- [ ] **Step 2: Repair hydration**

After cloud wallets load, create a default wallet with a bounded request when no owned writable wallet exists. Do not select a shared read-only wallet as recovery.

- [ ] **Step 3: Make clear-all dependency-safe**

Delete child financial data before wallets, verify every mutation, create a new active `Carteira principal`, and only then replace local state. Preserve previous local state on failure.

- [ ] **Step 4: Guard wallet-required forms**

Expose `ensureActiveWallet()` from context. Add Asset and operation flows call it before saving and present a retryable message if recovery fails.

- [ ] **Step 5: Run focused tests and confirm GREEN**

Run: `node --test tests/wallet-invariant.test.js tests/async-timeout.test.js tests/ui-redesign.test.js && npm run typecheck`

Expected: all focused tests pass and TypeScript reports no errors.

### Task 3: Make position creation and editing reachable and reliable

**Files:**
- Modify: `src/screens/AddAssetScreen.tsx`
- Modify: `src/screens/AssetDetailScreen.tsx`
- Modify: `src/screens/EditAssetScreen.tsx`
- Modify: `src/screens/PortfolioScreen.tsx`
- Modify: `src/utils/navigation.ts`
- Test: `tests/ui-redesign.test.js`

- [ ] **Step 1: Add the edit contract**

Asset detail resolves the matching active-wallet position and shows a visible `Editar posição` action only when the wallet is writable. The action navigates to `EditAsset` with the symbol.

- [ ] **Step 2: Preserve asset context**

Portfolio rows pass symbol, name, and type to detail. Quote-provider failure must not hide the position or edit action.

- [ ] **Step 3: Harden add and edit mutations**

Disable repeated submission, preserve draft fields after failure, guarantee loading cleanup, and return to `PortfolioMain` only after Supabase success.

- [ ] **Step 4: Add explicit recovery states**

Missing assets and missing wallets show a useful state with Back or Retry instead of a dead end.

- [ ] **Step 5: Verify focused behavior**

Run: `node --test tests/wallet-invariant.test.js tests/ui-redesign.test.js && npm run typecheck`

Expected: all tests pass.

### Task 4: Eliminate permanent loading states

**Files:**
- Modify: `src/components/AssetReturnsPanel.tsx`
- Modify: `src/components/AssetProventosHistory.tsx`
- Modify: `src/components/IbovespaComparison.tsx`
- Modify: `src/components/PriceChart.tsx`
- Modify: `src/components/AssetNewsFeed.tsx`
- Modify: `src/screens/DashboardScreen.tsx`
- Modify: `src/screens/PortfolioScreen.tsx`
- Modify: `src/screens/EditAssetScreen.tsx`
- Modify: `src/screens/AssetsListScreen.tsx`
- Modify: `src/screens/DeclaracaoScreen.tsx`
- Modify: `src/screens/RelatoriosScreen.tsx`
- Modify: `src/screens/IAConsultorScreen.tsx`
- Test: `tests/ui-redesign.test.js`

- [ ] **Step 1: Convert effects to cancellation-safe cleanup**

Every async effect handles rejection, retains usable cached data, and clears its pending state in `finally` when still mounted.

- [ ] **Step 2: Make refresh handlers exception-safe**

Dashboard and Portfolio use `try/catch/finally`, retain existing data on failure, and always stop refresh indicators.

- [ ] **Step 3: Expose retry for user-visible errors**

Charts and detail panels replace indefinite spinners with error/empty copy and a working retry action.

- [ ] **Step 4: Run the async audit**

Run source audit plus `node --test tests/async-timeout.test.js tests/ui-redesign.test.js`.

Expected: no audited loader can remain pending after a rejected promise.

### Task 5: Connect Hoje to the rest of the product

**Files:**
- Modify: `src/screens/DashboardScreen.tsx`
- Modify: `src/features/today/TodaySignals.tsx`
- Modify: `src/features/today/TodayTimeline.tsx`
- Modify: `src/features/today/TodayNextSteps.tsx`
- Test: `tests/ui-redesign.test.js`

- [ ] **Step 1: Make metrics actionable**

Patrimônio routes to Investir, cash flow/aportes routes to Aporte or Movimentos, income routes to Proventos, and health routes to AI diagnosis.

- [ ] **Step 2: Make timeline entries actionable**

Operation rows open Movimentos; income rows open Proventos; Add remains available from the empty state.

- [ ] **Step 3: Replace title-string routing**

Map coach action kinds to explicit destinations instead of inferring navigation from Portuguese title text.

- [ ] **Step 4: Verify route mappings**

Run: `node --test tests/ui-redesign.test.js && npm run typecheck`

Expected: all interaction route assertions pass.

### Task 6: Establish Órbita as the only design system

**Files:**
- Modify: `src/theme/editorial.ts`
- Modify: `src/theme/colors.ts`
- Modify: `src/theme/tokens.ts`
- Modify: `src/ui/editorial/*.tsx`
- Modify: `src/components/AdaptiveTabBar.tsx`
- Modify: `src/components/Button.tsx`
- Modify: `src/components/Card.tsx`
- Test: `tests/ui-redesign.test.js`

- [ ] **Step 1: Replace identity tokens**

Use the approved Órbita near-black canvas, navy surfaces, violet primary, coral AI accent, warm off-white text, semantic feedback colors, consistent radii, spacing, and motion.

- [ ] **Step 2: Convert legacy theme exports to aliases**

`theme/colors.ts` and `theme/tokens.ts` reference Órbita values so older screens become coherent immediately and cannot reintroduce Pulso colors.

- [ ] **Step 3: Update shared primitives**

Headers, rows, states, metric bands, tabs, buttons, cards, and navigation gain consistent dark surfaces, pressed states, focus states, disabled states, and accessible contrast.

- [ ] **Step 4: Verify identity**

Run the design token test and audit for old canvas/indigo/coral values.

Expected: reachable screens resolve through Órbita tokens and approved shared primitives.

### Task 7: Migrate and synchronize every reachable screen

**Files:**
- Modify: `src/screens/*.tsx`
- Modify: `src/components/*.tsx`
- Test: `tests/ui-redesign.test.js`

- [ ] **Step 1: Migrate core tabs**

Hoje, Investir, Planejar, and Aprender use the same shell, heading rhythm, section surfaces, action language, empty/error patterns, and navigation context.

- [ ] **Step 2: Migrate investment children**

Add, edit, detail, list, compare, movements, proventos, aporte, watchlist, and declaration inherit Investir context and deterministic return behavior.

- [ ] **Step 3: Migrate planning, learning, account, and AI children**

All modal and secondary screens use Órbita surfaces and headers while preserving their existing behavior.

- [ ] **Step 4: Audit interaction completeness**

Inspect every enabled Pressable/Touchable control for a real handler, pressed feedback, accessibility label, and reachable back action.

- [ ] **Step 5: Verify all reachable screens**

Run the UI audit tests and TypeScript check.

Expected: no reachable screen retains the Pulso visual identity or an inert advertised action.

### Task 8: Release verification and delivery

**Files:**
- Modify: release notes/version files only if required by the repository checks.

- [ ] **Step 1: Run complete verification**

Run: `npm run verify`

Expected: all tests pass, TypeScript and JS syntax checks pass, Expo dependencies match SDK 54.

- [ ] **Step 2: Build the production web bundle**

Run: `npx expo export --platform web`

Expected: build exits zero and writes `dist`.

- [ ] **Step 3: Review the complete diff**

Run: `git diff --check`, inspect status and diff statistics, and confirm no credentials or generated files are staged.

- [ ] **Step 4: Commit and push**

Commit the verified implementation and push `codex/production-hardening`.

- [ ] **Step 5: Deploy and inspect production**

Deploy the `vesti` Vercel project, verify READY status and the `https://vesti-nine.vercel.app` alias, then open the live app and inspect the entry state. Authenticated flows are manually exercised only after the owner unlocks the PIN.
