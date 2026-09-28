# Vesti Production Hardening Design

**Date:** 2026-09-28

**Status:** Approved for implementation planning

## Goal

Bring the current Vesti application to a production-ready baseline without changing its visual layout. The work covers every actionable finding from the full repository review: authorization, account deletion, tax calculations and content, authentication recovery, subscription enforcement, AI response safety, report generation, persistence reliability, release configuration, and automated verification.

## Scope boundaries

- Preserve the current visual design and navigation structure.
- Preserve Expo SDK 54 and use only SDK 54-compatible APIs and package versions.
- Do not introduce a payment checkout; enforce the subscription state already stored in `profiles`.
- Do not redesign the portfolio or recommendation product behavior beyond correcting unsafe or demonstrably incorrect results.
- Database changes must be delivered as a new idempotent migration. Existing migrations remain immutable historical records.

## Architecture

### 1. Database authorization and account lifecycle

Create a new Supabase migration that replaces broad `FOR ALL` sharing policies with operation-specific policies. Owners retain full access. Accepted viewers receive read-only access. Editors may update assets only if the product explicitly supports that role, but neither viewers nor editors may delete the owner's wallet. Every share must reference a wallet owned by `owner_id`.

Invitation acceptance will move to a security-definer RPC with a fixed empty `search_path`, qualified object names, authenticated-only execution, and server-side comparison between the authenticated user's email and the normalized invited email. Pending invitations will be exposed through a similarly constrained RPC instead of a policy that attempts to read `auth.users` directly.

Account deletion will be transactional and will remove the authenticated user from `auth.users`, allowing foreign-key cascades to remove owned records. Received shares and audit data that can identify the user will also be removed or anonymized before deletion. The RPC will use qualified names, a fixed `search_path`, explicit privilege revocation, and an authenticated-only grant.

### 2. Client data and persistence

Shared wallets and their assets will be loaded separately from owned wallets and represented as read-only in client state. Mutation functions will reject writes against shared wallets before contacting Supabase.

All Supabase mutations will inspect returned errors before changing local state or reporting success. Bulk deletion will run in a safe dependency order and stop on the first failed operation. PIN and onboarding state will be namespaced by user where relevant. PIN unlock failures and lockout expiry will be persisted locally so restarting the app cannot reset the attempt counter. Secure storage failures will propagate rather than silently reporting protection as enabled.

### 3. Brazilian tax engine and legal copy

Extract deterministic tax primitives that process operations chronologically and maintain quantity and weighted-average acquisition cost after each purchase and sale. Common stock operations, ETFs, FIIs, and day trades will remain separate tax buckets. Only qualifying stock sales will receive the R$20,000 monthly exemption. ETFs, FIIs, and day trades will not.

Operation records will support optional fees and withholding tax. Monthly results will account for deductible costs, carried losses by compatible category, IRRF credits, the R$10 minimum-payment carry, and a due date adjusted to the previous weekday when month-end falls on a weekend. The interface will describe the calculation as an estimate and direct users to official records for holidays and exceptional events.

Tax and privacy copy will be updated for the rules effective in 2026, including the dividend withholding threshold and annual high-income regime introduced by Law 15,270/2025. Incorrect statements such as “FII isento” for disposal gains and unconditional dividend exemption will be removed.

### 4. Authentication and local security

Password recovery will supply an application redirect URL, handle the Supabase `PASSWORD_RECOVERY` event, and present a dedicated password-update screen. The app will clear the recovery state after a successful password update.

The legal text will accurately distinguish passwords managed by Supabase Auth, session tokens stored by the configured auth adapter, native PIN storage in SecureStore, and the web fallback. No claim will be made that passwords are stored locally.

### 5. Subscription enforcement and AI safety

Add a server-side entitlement helper that queries the authenticated user's profile and requires a paid subscription identifier plus an unexpired entitlement. Every paid AI endpoint and paid Pluggy action will call it after authentication. Public market-data endpoints remain public.

AI request payloads will be bounded and normalized. AI responses will be parsed into explicit schemas, reject non-finite or negative monetary values, cap strings and item counts, and return controlled errors when the model response cannot be repaired. Rebalancing a zero-sum response will return an error instead of generating `NaN`.

### 6. Report generation

All dynamic text inserted into generated HTML will be escaped, including names, symbols, notes, dates, and titles. Web reports will open with `noopener`/`noreferrer`, and object URLs will be revoked. The existing appearance of reports will remain unchanged.

### 7. Release and tooling

Use one application version source and align `package.json`, `app.json`, and in-app release notes. Store submission configuration will no longer contain fake placeholder values; optional credentials will be supplied through the build environment or documented as required external configuration.

Exclude generated output from TypeScript compilation. Add deterministic scripts for type checking, server JavaScript syntax checking, unit tests, and a combined verification command. Dependency compatibility will be checked with Expo SDK 54 tooling.

## Error handling

- User-facing operations only report success after the server confirms success.
- Server handlers return stable public messages and do not forward provider response bodies or internal exception details.
- Security-sensitive RPCs fail closed and never fall back to client-side authorization.
- Partial bulk operations return an error that identifies the failed category without exposing sensitive database details.

## Testing strategy

Tests will be added before production changes and must demonstrate the existing failure first. Coverage will include:

- chronological weighted-average cost after partial sales;
- ETF, FII, day-trade, and stock exemption boundaries;
- carried losses, IRRF, minimum DARF carry, and weekend due dates;
- AI zero-sum and malformed responses;
- HTML escaping;
- subscription entitlement decisions;
- PIN lockout persistence;
- static assertions for the new RLS/RPC migration and release configuration.

Final verification consists of the complete test suite, strict TypeScript checking, JavaScript syntax checking, Expo dependency validation, a production web export, and a clean Git diff review. After verification, the branch will be compared with its fetched remote tracking branch, committed, and pushed without force.

## Rollout order

1. Establish the test runner and failing regression tests.
2. Correct database authorization and account deletion.
3. Correct the tax engine and legal content.
4. Complete password recovery and PIN persistence.
5. Enforce Pro entitlements and validate AI traffic.
6. Harden reports and mutation error handling.
7. Align release configuration and tooling.
8. Run full verification, fetch and compare the remote, resolve safe differences, commit, and push.

## Acceptance criteria

- No accepted shared-wallet viewer can mutate or delete owner data.
- Invitations can be listed and accepted only by the invited authenticated email.
- Account deletion removes the Supabase Auth user and associated personal data.
- Automated tax examples match the documented 2026 rules for supported operation types.
- Password reset completes inside the app.
- Paid endpoints reject users without a valid paid entitlement.
- Malformed AI output cannot introduce `NaN`, invalid monetary values, or an unexpected response shape.
- Generated reports cannot execute user-controlled HTML or script.
- Failed persistence operations remain visible as failures and do not produce false success UI.
- Tests, type checking, syntax checks, Expo validation, and production export pass.
- The final pushed commit contains no secrets, generated build output, or unrelated files.
