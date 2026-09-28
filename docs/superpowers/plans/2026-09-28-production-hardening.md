# Vesti Production Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct every production-readiness issue documented in the approved hardening design while preserving the existing layout and Expo SDK 54.

**Architecture:** Add small, testable pure helpers for tax, HTML safety, PIN lockout, entitlements, and AI output validation. Apply database authorization changes through one new idempotent Supabase migration, then adapt the existing context/API surfaces without redesigning screens.

**Tech Stack:** Expo SDK 54, React Native 0.81, TypeScript 5.9, Supabase/PostgreSQL, Vercel functions, Node built-in test runner.

---

## File structure

- `tests/*.test.js`: Node regression tests for pure logic and static security/configuration invariants.
- `src/utils/irEngine.js`: chronological tax engine with explicit bucket state.
- `src/utils/html.js`: HTML escaping for generated reports.
- `src/utils/pinLockout.js`: persistent unlock-attempt state transitions.
- `api/_lib/entitlement.js`: server-side paid-plan authorization.
- `api/_lib/aiResponse.js`: bounded AI response validation.
- `supabase/migrations/006_production_hardening.sql`: corrected RLS, invitation RPCs, account deletion, schema additions.
- Existing screens, context, API handlers, legal copy, and configuration files: integration changes only.

### Task 1: Deterministic verification foundation

**Files:**
- Create: `tests/config.test.js`
- Modify: `package.json`
- Modify: `tsconfig.json`

- [ ] **Step 1: Write the failing configuration test**

```js
test('release versions are aligned and generated files are excluded', () => {
  assert.equal(pkg.version, app.expo.version);
  assert.match(tsconfig.exclude.join(' '), /dist/);
  assert.doesNotMatch(JSON.stringify(eas), /PREENCHER_/);
});
```

- [ ] **Step 2: Run `node --test tests/config.test.js` and confirm it fails on the current version mismatch, missing exclude, and EAS placeholders.**

- [ ] **Step 3: Add `test`, `typecheck`, `check:js`, `expo:check`, and `verify` scripts; exclude `dist`, tests, and generated work directories from application TypeScript checking.**

- [ ] **Step 4: Align the package/app/release version to `4.7.0` and remove fake submit credentials so EAS obtains real credentials from its configured environment.**

- [ ] **Step 5: Run the configuration test and confirm it passes.**

### Task 2: Database authorization and lifecycle

**Files:**
- Create: `tests/database-hardening.test.js`
- Create: `supabase/migrations/006_production_hardening.sql`
- Modify: `src/api/walletShares.ts`
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: Write failing static migration tests that require separate owner policies, read-only accepted-share policies, ownership validation, fixed `search_path`, invitation RPCs, deletion of the calling `auth.users` row, and privilege revocation.**

- [ ] **Step 2: Run the database test and confirm it fails because migration 006 does not exist.**

- [ ] **Step 3: Add an idempotent migration that drops the broad sharing policies and creates operation-specific policies.**

- [ ] **Step 4: Add `list_my_wallet_invitations()` and `accept_wallet_invitation(uuid)` security-definer RPCs that use qualified names, validate `auth.uid()`, validate the authenticated email, and expose only the caller's invitation rows.**

- [ ] **Step 5: Replace `delete_my_account()` with a hardened transactional function that removes identifying audit rows, received shares, and the matching `auth.users` row; revoke public execution and grant only to `authenticated`.**

- [ ] **Step 6: Update the wallet-sharing client to use the RPCs and update app loading to include accepted shared wallets/assets as read-only records.**

- [ ] **Step 7: Run the database hardening tests and confirm they pass.**

### Task 3: Correct tax engine for supported 2026 cases

**Files:**
- Create: `tests/ir-engine.test.js`
- Create: `src/utils/irEngine.js`
- Modify: `src/utils/irCalculator.ts`
- Modify: `src/context/AppContext.tsx`
- Modify: `supabase/migrations/006_production_hardening.sql`
- Modify: `src/screens/OperacoesScreen.tsx`
- Modify: `src/screens/IRAutomaticoScreen.tsx`
- Modify: `src/screens/IRCalculatorScreen.tsx`
- Modify: `src/screens/DeclaracaoScreen.tsx`

- [ ] **Step 1: Write failing tests for partial-sale weighted cost, stock exemption boundaries, non-exempt ETFs/FIIs/day trades, category-specific carried losses, fees, IRRF, minimum DARF carry, and weekend due dates.**

- [ ] **Step 2: Run the tax tests and confirm each historical behavior fails for the intended reason.**

- [ ] **Step 3: Implement a chronological ledger that updates weighted cost only on purchases and reduces quantity/cost proportionally on common sales.**

- [ ] **Step 4: Implement separate monthly tax buckets, stock-only exemption, loss carry, fee deductions, IRRF credits, sub-R$10 carry, and previous-weekday due dates.**

- [ ] **Step 5: Add nullable `fees` and `withholding_tax` operation columns and map them through context types and persistence.**

- [ ] **Step 6: Replace incorrect screen labels and ensure the automatic summary consumes the corrected engine.**

- [ ] **Step 7: Run the complete tax test file and confirm it passes.**

### Task 4: Authentication recovery and persistent PIN lockout

**Files:**
- Create: `tests/pin-lockout.test.js`
- Create: `src/utils/pinLockout.js`
- Create: `src/screens/PasswordRecoveryScreen.tsx`
- Modify: `src/context/AppContext.tsx`
- Modify: `src/navigation/RootNavigator.tsx`
- Modify: `src/screens/PinScreen.tsx`
- Modify: `src/storage/storage.ts`

- [ ] **Step 1: Write failing state-transition tests proving five failures create a persisted one-minute lock and that restarting cannot clear it.**

- [ ] **Step 2: Run the PIN tests and confirm failure before the helper exists.**

- [ ] **Step 3: Implement the pure PIN lockout helper and persist its state under a user-scoped key.**

- [ ] **Step 4: Make secure-storage writes throw on failure and only mark a PIN active after confirmed persistence.**

- [ ] **Step 5: Pass an SDK-54-compatible `vesti://password-recovery` redirect to Supabase, handle `PASSWORD_RECOVERY`, add the password-update screen, and call `supabase.auth.updateUser`.**

- [ ] **Step 6: Run PIN tests and TypeScript checking.**

### Task 5: Server-side Pro entitlement and AI output safety

**Files:**
- Create: `tests/entitlement.test.js`
- Create: `tests/ai-response.test.js`
- Create: `api/_lib/entitlement.js`
- Create: `api/_lib/aiResponse.js`
- Modify: `api/ai-consultor.js`
- Modify: `api/ai-diagnostic.js`
- Modify: `api/ai-suggest.js`
- Modify: `api/pluggy.js`
- Modify: `api/_lib/validate.js`

- [ ] **Step 1: Write failing tests for free, expired, paid-active, malformed, zero-sum, negative, non-finite, and oversized AI responses.**

- [ ] **Step 2: Run the two test files and confirm failure because the helpers do not exist.**

- [ ] **Step 3: Implement entitlement checking with the authenticated user's profile and a stable 403 response.**

- [ ] **Step 4: Apply entitlement enforcement after JWT authentication to the three paid AI endpoints and user-triggered Pluggy actions, leaving the provider webhook independent.**

- [ ] **Step 5: Validate request size from the parsed payload as well as headers and normalize all AI inputs.**

- [ ] **Step 6: Validate AI output structure and finite values; reject zero-total allocations instead of dividing by zero.**

- [ ] **Step 7: Remove provider response bodies and raw internal errors from public responses.**

- [ ] **Step 8: Run entitlement and AI tests and confirm they pass.**

### Task 6: Report HTML and mutation reliability

**Files:**
- Create: `tests/html.test.js`
- Create: `src/utils/html.js`
- Modify: `src/utils/reports.ts`
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: Write a failing test that escapes `<`, `>`, `&`, quotes, and apostrophes in report content.**

- [ ] **Step 2: Run it and confirm failure before the helper exists.**

- [ ] **Step 3: Implement escaping and apply it to every user-controlled report interpolation. Open web output with `noopener,noreferrer` and revoke the object URL.**

- [ ] **Step 4: Introduce one result-checking helper for Supabase mutations and apply it to deletes, profile updates, bulk clearing, watchlist operations, goals, lessons, snapshots, and name changes before local optimistic state is finalized.**

- [ ] **Step 5: Run HTML tests and TypeScript checking.**

### Task 7: Accurate legal and operational content

**Files:**
- Create: `tests/legal-copy.test.js`
- Modify: `src/data/legalDocs.ts`
- Modify: `src/screens/IRCalculatorScreen.tsx`
- Modify: `src/screens/OperacoesScreen.tsx`
- Modify: `APP_STORE.md`

- [ ] **Step 1: Write failing static tests that prohibit the false local-password storage claim, unconditional dividend exemption, obsolete “future bill” wording, and disposal-gain FII exemption.**

- [ ] **Step 2: Run and confirm the current copy fails.**

- [ ] **Step 3: Update privacy storage disclosures and supported 2026 tax explanations without claiming the app replaces Receita Federal records or professional advice.**

- [ ] **Step 4: Document external credentials and release requirements without embedding personal secrets.**

- [ ] **Step 5: Run legal-copy tests and confirm they pass.**

### Task 8: Full verification and Git comparison

**Files:**
- Modify only files required by failures found in this task.

- [ ] **Step 1: Run `npm test` and require zero failed tests.**
- [ ] **Step 2: Run `npm run typecheck` and require exit code 0.**
- [ ] **Step 3: Run `npm run check:js` and require exit code 0.**
- [ ] **Step 4: Run `npm run expo:check` and record whether validation used the network or Expo's offline map.**
- [ ] **Step 5: Run a production web export and verify the post-build output; do not commit generated `dist`.**
- [ ] **Step 6: Run `git diff --check`, inspect every changed file, and verify no environment file, credential, or unrelated artifact is staged.**
- [ ] **Step 7: Fetch the configured remote, compare local and remote histories, and stop if the remote contains unreviewed divergent work.**
- [ ] **Step 8: Commit the verified implementation with a descriptive message and push normally to the current branch without force.**
