# Vesti Órbita — Reliability and Interaction Design

**Date:** 2026-10-02  
**Status:** Approved direction  
**Reference:** `vesti-redesign-directions.html`, variant “Órbita”

## Objective

Transform the current Vesti experience into one coherent Órbita product while removing the state, navigation, and asynchronous-operation failures that currently make the app lock, lose its recovery path, or expose actions that cannot complete.

The release is successful when an authenticated user can clear their financial data, start again, add an asset, edit or delete a position, navigate every primary flow, recover from network failures without restarting the app, and understand how every screen relates to Hoje, Investir, Planejar, or Aprender.

## Confirmed root causes

1. `clearAllUserData` deletes every wallet and leaves `activeWalletId` null. The UI still exposes “Adicionar ativo”, but `AddAssetScreen` has no wallet destination and cannot save.
2. A portfolio row opens `AssetDetailScreen`. That screen has no visible edit action, even though `EditAssetScreen` exists. Editing is therefore technically implemented but practically unreachable from the primary flow.
3. Several data-loading effects set loading state to true and only clear it on success. Rejected chart, dividend, benchmark, or asset-detail requests can leave permanent spinners.
4. Refresh handlers await network work without guaranteed cleanup. A rejected refresh can leave pull-to-refresh active and produce unhandled promise rejections.
5. The interface combines legacy `theme/colors`, the Pulso editorial tokens, large screen-local style sheets, and different header/back patterns. This creates visual drift and inconsistent interaction behavior.
6. Existing tests validate many source-code markers but do not cover the lifecycle invariant that a signed-in user must always have a writable active wallet after destructive data reset.

## Chosen approach

Use an incremental structural migration rather than a patch-only repair or a full rewrite.

- Preserve the existing Expo SDK 54 and React Navigation architecture.
- Establish explicit domain invariants and shared asynchronous-state helpers.
- Repair the critical data and navigation flows first with regression tests.
- Replace Pulso visual tokens and primitives with Órbita equivalents, then migrate every reachable screen through the shared primitives.
- Keep calculations, tax rules, authentication, profile logic, and Supabase security behavior intact unless a failing test proves they are part of the defect.

This approach removes the root causes without introducing the risk of rebuilding the product from zero.

## Data and state invariants

### Active wallet

For every authenticated user inside the main application:

- There is at least one owned, writable wallet.
- `activeWalletId` points to an existing wallet.
- Shared read-only wallets never become the automatic recovery wallet.
- Screens that require a wallet render a recoverable state while the invariant is being restored; they do not open a form that cannot save.

`clearAllUserData` will delete financial records in dependency-safe order, create a fresh “Carteira principal”, mark it active, and atomically replace local financial state with that wallet. A failed reset preserves the previous local state and presents a retryable error instead of partially clearing the UI.

Initial cloud hydration will also repair legacy accounts that have no owned wallet by creating a default wallet before the main app becomes interactive.

### Asset mutations

Adding, editing, and removing assets will share these rules:

- Reject duplicate submissions while a mutation is pending.
- Keep form values on failure.
- Apply a bounded timeout to the Supabase request.
- Show a useful inline or alert error and allow retry.
- Update local state only after the server confirms success.
- Return to the Investir root only after success.

Adding an existing symbol continues to update the weighted average and quantity. Editing validates positive quantity and average price. Deleting a position requires destructive confirmation.

## Navigation and interaction contract

The four primary destinations remain Hoje, Investir, Planejar, and Aprender.

- Every screen has one deterministic back or close action.
- Returning from an Investir child always lands on `PortfolioMain`.
- Tapping a portfolio position opens its detail page.
- The detail page contains a persistent, visible “Editar posição” action when the asset belongs to the active writable wallet.
- A secondary edit affordance may appear on the position row, but detail remains the primary tap target.
- Read-only shared positions explain why editing is unavailable.
- Empty portfolio states first ensure a writable wallet, then open Add Asset.

The Hoje screen becomes an interactive map of the rest of the product:

- Patrimônio opens Investir.
- Aportes opens the aporte suggestion flow.
- Proventos opens Rendimentos.
- Risco/saúde opens the portfolio diagnostic.
- The Vesti insight opens AI Hub.
- Timeline entries open the relevant investment history.
- Next steps route to their concrete destination and never to a generic fallback when a specific destination exists.

Every tappable surface receives pressed feedback, an accessibility role/label, a minimum touch target, and a real action.

## Asynchronous screen contract

Every network-backed surface implements four explicit states: initial loading, content, empty, and error. Refresh errors preserve existing content.

- All effects support cancellation on unmount.
- All pending indicators end in `finally` or through a shared state reducer.
- All requests use a bounded timeout.
- User-triggered failures expose Retry.
- Background failures do not replace usable cached content.
- Refresh controls always stop, even when the request rejects.
- No screen requires an app restart to recover.

The first migration set includes asset details, edit asset, price charts, asset returns, provento history, Ibovespa comparison, dashboard refresh, portfolio refresh, news, rankings, reports, declarations, and AI prefetching.

## Órbita visual system

Órbita replaces Pulso as the only current visual identity.

### Palette

- Canvas: near-black navy (`#11131B`).
- Raised surfaces: layered navy (`#1A1D28`, `#1B1E29`).
- Primary: luminous violet (`#7C5CFF`) with a deeper pressed state.
- AI/action accent: coral (`#FF786B`).
- Primary text: warm off-white (`#F7F4EF`).
- Secondary text: cool gray-lilac.
- Success, warning, and danger remain semantic and meet contrast requirements.

### Shared structure

The existing editorial primitives will be replaced or renamed into a single Órbita entry point. Screens consume shared components instead of inventing local identity:

- `OrbitScreen`: dark canvas, safe insets, width constraints, scrolling, refresh, and keyboard behavior.
- `OrbitHeader`: Vesti brand, context, back action, alerts, and profile.
- `OrbitHero`: violet gradient for the primary financial fact and optional chart.
- `OrbitMetric`: compact actionable metrics with status.
- `OrbitSurface`: standard raised container with pressed and disabled states.
- `OrbitRow`: consistent navigation/data row.
- `OrbitState`: loading, empty, error, read-only, and retry states.
- `OrbitTabs`: one tab treatment across investment detail and portfolio views.
- `OrbitAction`: primary, secondary, ghost, and destructive controls.

Mobile navigation uses the Órbita bottom bar from the approved reference. Desktop uses the same colors, icon language, ordering, and active-state signal in a rail.

### Screen relationships

Each primary screen has a distinct purpose but shares the same shell:

- Hoje explains what changed and links to action.
- Investir owns positions, movements, income, asset details, and aporte suggestions.
- Planejar turns the investment state into goals, simulations, and tax preparation.
- Aprender uses profile and portfolio context to recommend relevant lessons.

Secondary screens inherit their parent section context in headers and return behavior. They do not appear as unrelated mini-apps.

## Code organization

The migration will avoid a second design system. `src/theme/editorial.ts` becomes the Órbita token source or is replaced by `src/theme/orbit.ts`, and all shared UI is exported through one entry point. Legacy `theme/colors.ts` remains temporarily only as a compatibility adapter and cannot introduce new colors.

Large, duplicated screen-local behaviors will move into focused utilities or hooks:

- wallet invariant and recovery;
- async task state and timeout handling;
- deterministic investment navigation;
- reusable mutation feedback;
- interactive dashboard destination mapping.

No broad folder or navigation-library rewrite is included.

## Error handling

- Supabase errors are translated into user-facing Portuguese.
- Reset failure never reports success and never discards the previous local state.
- A missing wallet triggers recovery, not a dead-end form.
- Network timeout messages identify the affected action and offer retry.
- Unknown assets remain editable even when market-data providers have no quote.
- Market data is optional for editing: a quote failure cannot block changing quantity or average price.
- All destructive actions remain explicitly confirmed.

## Testing strategy

Implementation follows red-green-refactor.

### Regression coverage

- Clearing data produces one fresh active writable wallet.
- Failure during reset preserves current local financial state.
- Legacy hydration with no owned wallet repairs the account.
- Add asset refuses to start without a recoverable wallet and succeeds after recovery.
- Add, edit, and delete mutations exit pending state on success, timeout, and server error.
- Asset detail exposes edit only for an owned writable position.
- Investment child screens return to `PortfolioMain`.
- Every audited loading effect exits on rejection and supports retry where user-triggered.
- Hoje interactive cards map to the expected routes.
- All reachable screens consume the Órbita system and contain no Pulso-only identity tokens.

### Release verification

- Full automated test suite.
- TypeScript check and JavaScript syntax check.
- Expo SDK 54 dependency validation.
- Web export.
- Manual production walkthrough: clear data, add first asset, add same asset again, edit, delete, refresh with and without connectivity, navigate each card and back action, and verify mobile/desktop layouts.
- The authenticated walkthrough requires the account owner to unlock the production PIN; credentials or PINs will never be guessed or bypassed.

## Delivery order

1. Add regression tests for wallet reset, asset mutation recovery, edit reachability, navigation, and loading failures.
2. Implement the wallet invariant and safe reset.
3. Repair add/edit/delete position flows and navigation.
4. Standardize asynchronous screen states and recovery.
5. Build the Órbita tokens and shared primitives.
6. Migrate Hoje and Investir, including all interactive destinations.
7. Migrate Planejar, Aprender, and every reachable secondary screen.
8. Run automated verification, export, manual walkthrough, Git commit/push, and production deployment.

## Non-goals

- Replacing React Navigation with Expo Router.
- Changing Supabase provider or authentication model.
- Rewriting tax calculations or investment-allocation mathematics without a reproduced defect.
- Adding new paid features, brokerage integrations, or social features.
- Guessing or bypassing the user’s PIN for production testing.
