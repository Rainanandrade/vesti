# Plano de Aporte e Planejamento Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the contribution AI with an immediate, deterministic and transparent Vesti plan, then complete Planejar with a future-value calculator and an emergency-reserve planner.

**Architecture:** Keep the existing Expo SDK 54/React Navigation structure and the current allocation engine. Put every new financial formula in a dependency-free utility, render all calculations locally, and add the two planning tools to the main stack so they return reliably to Planejar. Quote lookup may refine a contribution plan, but the initial result never waits for the network.

**Tech Stack:** Expo SDK 54, React Native 0.81, React 19, React Navigation 7, TypeScript, Node test runner.

**Status:** Implementado e verificado em 2026-10-04. Testes, TypeScript, Expo Doctor e exportação web concluídos; entrega registrada nos commits da branch.

---

### Task 1: Lock the financial formulas with failing tests

**Files:**
- Create: `tests/planning-calculators.test.js`
- Create: `src/utils/planningCalculators.js`

- [ ] **Step 1: Write future-value RED tests**

Cover zero-rate accumulation, positive compound interest, invested-capital totals, and rejection of negative values, zero duration, annual rates at or below -100%, and non-finite input.

- [ ] **Step 2: Write required-contribution RED tests**

Cover a zero-rate target, a positive-rate target, an already-funded target that needs no monthly contribution, and invalid inputs.

- [ ] **Step 3: Write scenario RED tests**

Assert conservative/base/optimistic labels and rates around the user's annual rate, with a conservative floor of zero.

- [ ] **Step 4: Write reserve RED tests**

Cover reserve target, current coverage, missing amount, progress clamped to 100%, and estimated months with and without monthly saving.

- [ ] **Step 5: Run the focused test and confirm RED**

Run: `node --test tests/planning-calculators.test.js`

Expected: module-not-found or missing-export failures before implementation.

### Task 2: Implement the pure planning engine

**Files:**
- Create: `src/utils/planningCalculators.js`
- Test: `tests/planning-calculators.test.js`

- [ ] **Step 1: Add input validation**

Use one finite, non-negative amount guard and validate `years > 0` plus `annualRate > -100`. Throw a short `RangeError` instead of returning `NaN` or `Infinity`.

- [ ] **Step 2: Implement future value**

Convert the annual percentage to an effective monthly rate and calculate initial-capital growth plus an ordinary monthly annuity. Special-case a zero monthly rate:

```js
const months = Math.round(years * 12)
const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1
const futureValue = monthlyRate === 0
  ? initial + monthly * months
  : initial * Math.pow(1 + monthlyRate, months)
    + monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
```

Return `{ finalValue, invested, interest }` with normalized finite numbers.

- [ ] **Step 3: Implement required monthly contribution**

Grow the initial capital over the period, subtract it from the target, and divide the remaining target by the annuity factor. Return zero when the initial capital already reaches the target.

- [ ] **Step 4: Implement scenarios and reserve planning**

Build scenarios at `max(0, rate - 2)`, `rate`, and `rate + 2`. Calculate reserve target, covered months, missing amount, progress, and `ceil(missing / monthlySaving)` when saving is positive.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run: `node --test tests/planning-calculators.test.js`

Expected: all planning formula tests pass.

### Task 3: Replace contribution AI with Plano de Aporte Vesti

**Files:**
- Modify: `tests/launch-readiness.test.js`
- Modify: `src/screens/AporteScreen.tsx`
- Modify: `src/utils/allocation.ts`

- [ ] **Step 1: Replace the old AI contract test and confirm RED**

Assert that Aporte does not import or call `fetchAiSuggestion`, exposes `Montar meu plano`, names the result `Plano de Aporte Vesti`, includes the educational disclaimer, and still records purchases idempotently.

Run: `node --test tests/launch-readiness.test.js`

Expected: the new deterministic-plan assertions fail against the old screen.

- [ ] **Step 2: Give the local engine a product-facing API**

Export `buildContributionPlan` from the allocation utility. Preserve `suggestAporte` as a compatibility alias if another screen still uses it.

- [ ] **Step 3: Remove AI dependencies and state**

Delete `fetchAiSuggestion`, AI result/error/source state, AI-specific copy, and narrative-merging helpers from Aporte. Replace them with one local `planResult` built from profile, focus, target allocation, portfolio composition, and known prices.

- [ ] **Step 4: Make the plan immediate and network-optional**

On `Montar meu plano`, render the local result synchronously. Then attempt quote enrichment and replace the result only if fresh prices arrive. A quote failure leaves the first plan usable and never leaves a spinner blocking the user.

- [ ] **Step 5: Explain the calculation**

Show the profile and focus used, the target-vs-current allocation gap, each proposed amount, and the exact non-recommendation disclaimer. Preserve the existing broker choice and idempotent purchase registration flow.

- [ ] **Step 6: Run the focused regression test**

Run: `node --test tests/launch-readiness.test.js && npm run typecheck`

Expected: contribution regression assertions and TypeScript pass.

### Task 4: Modernize the Calculadora de Futuro

**Files:**
- Modify: `src/screens/AporteCalculatorScreen.tsx`
- Modify: `src/utils/navigation.ts`
- Test: `tests/planning-calculators.test.js`

- [ ] **Step 1: Connect the pure engine**

Replace inline formulas with `futureValue`, `requiredMonthlyContribution`, and `buildFutureScenarios`. Keep drafts as localized currency/rate strings and validate before rendering results.

- [ ] **Step 2: Implement the two modes**

Provide clear controls for `Quanto terei` and `Quanto aportar`. Show initial value, monthly contribution or goal, years, and estimated annual rate according to the selected mode.

- [ ] **Step 3: Add transparent results**

Render final value, total invested, accumulated interest, three scenarios, and a horizontal invested-versus-interest composition bar. Handle zero interest without division errors.

- [ ] **Step 4: Remove fixed market promises**

Delete the Selic/Ibovespa/FII return examples and show an educational simulation notice that explicitly says results are estimates and not guaranteed returns.

- [ ] **Step 5: Fix return navigation**

Add or reuse a helper that returns to the `Planejar` tab when the stack cannot pop, so the calculator never strands the user.

### Task 5: Add the Reserva de Emergência planner

**Files:**
- Create: `src/screens/EmergencyReserveScreen.tsx`
- Modify: `src/utils/navigation.ts`

- [ ] **Step 1: Build the Orbit form**

Add localized inputs for essential monthly expenses, current reserve, and monthly saving. Add accessible 3/6/9/12-month chips with six months selected by default.

- [ ] **Step 2: Render the plan locally**

Use `calculateEmergencyReserve` to show reserve target, covered months, missing amount, progress, and estimated time to reach the target. Empty or invalid fields show guidance, never a frozen state.

- [ ] **Step 3: Add the planning disclaimer and return path**

State that the tool is educational and does not recommend financial products. Ensure Back returns to Planejar even when there is no previous stack route.

### Task 6: Integrate both tools into Planejar

**Files:**
- Create: `tests/planning-navigation.test.js`
- Modify: `src/screens/PlanningScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Write the navigation RED test**

Assert that Planejar contains a `Simulações` section linking to `FutureCalculator` and `EmergencyReserve`, and that both routes exist in the main stack. Assert that the planning insight no longer opens AI chat.

- [ ] **Step 2: Add main-stack routes**

Register `FutureCalculator` with `AporteCalculatorScreen` and `EmergencyReserve` with the new screen. Keep any existing nested calculator route only if required for backward compatibility.

- [ ] **Step 3: Reorganize Planejar**

Keep Plano de Aporte, Metas, and Renda Futura under `Agora`; add Calculadora de Futuro and Reserva de Emergência under `Simulações`; retain tax, declaration, report, and backtest tools under `Ferramentas`.

- [ ] **Step 4: Replace the AI invitation**

Use a static planning note that encourages periodic review of goals, reserve, and contributions without routing to AI.

- [ ] **Step 5: Run focused tests and typecheck**

Run: `node --test tests/planning-calculators.test.js tests/planning-navigation.test.js tests/launch-readiness.test.js && npm run typecheck`

Expected: all focused tests and TypeScript pass.

### Task 7: Verify the complete user journey

**Files:**
- Modify as required by failures only.

- [ ] **Step 1: Run the complete test suite**

Run: `node --test tests/*.test.js`

Expected: every test passes.

- [ ] **Step 2: Validate Expo SDK 54 and types**

Run: `npx expo-doctor` and `npm run typecheck`.

Expected: Expo dependency checks and TypeScript pass.

- [ ] **Step 3: Produce the web build**

Run: `npx expo export --platform web`.

Expected: export finishes without route or bundling errors.

- [ ] **Step 4: Inspect the planning flows visually**

Open the local or deployed web app and verify Planejar, Plano de Aporte, Calculadora de Futuro, Reserva de Emergência, input interaction, results, theme variants, and every Back action.

- [ ] **Step 5: Review the final diff**

Confirm there is no AI request or AI wording in Aporte, no fixed return promise in the calculator, no accidental Supabase write in either new tool, and no unrelated user changes.

### Task 8: Commit, push, and publish

**Files:**
- All files above.

- [ ] **Step 1: Commit coherent changes**

Create focused commits for the calculation engine, deterministic contribution plan, and Planejar integration.

- [ ] **Step 2: Push the existing hardening branch**

Push `codex/production-hardening` after all verification is green.

- [ ] **Step 3: Publish the verified production build**

Deploy through the repository's existing production workflow, then check the production URL and core planning routes for successful responses.

- [ ] **Step 4: Report only verified outcomes**

Return the shipped features, verification results, commit identifiers, branch, production URL, and any external limitation that remains outside the repository.
