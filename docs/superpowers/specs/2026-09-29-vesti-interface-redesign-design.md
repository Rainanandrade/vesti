# Vesti Interface Redesign

**Date:** 29 September 2026  
**Status:** Approved design  
**Scope:** Complete interface and information-architecture redesign for the existing Expo SDK 54 application

## Objective

Redesign every user-facing Vesti screen while preserving the product name, financial data, corrected tax behavior, authentication, subscriptions, and backend contracts. The new product should feel like a clear and supportive personal financial assistant rather than a brokerage terminal or private-banking dashboard.

The home experience must answer “Como estou?” immediately, then explain what changed and what the user can do next.

## Product principles

1. **Explain before exposing complexity.** Lead with a plain-language financial status and progressively reveal details.
2. **Balanced density.** Show enough information to be useful without filling the screen with competing cards and metrics.
3. **Contextual assistance.** “Pergunte ao Vesti” appears where the user needs help and receives the current screen or asset as context. AI does not occupy a primary navigation destination.
4. **Four clear destinations.** Every existing capability belongs to Hoje, Investir, Planejar, or Aprender.
5. **No functional regression.** The redesign changes presentation and navigation, not financial rules, database authorization, authentication behavior, or paid entitlement enforcement.
6. **One visual language everywhere.** Onboarding, authentication, PIN, subscriptions, settings, tools, and empty/error states must use the same system as the four primary areas.

## Visual direction

The existing emerald, champagne-gold, heavy-card, private-banking style will be removed completely.

### Palette

- Warm ivory as the application background
- Blue-charcoal for primary text
- Indigo-violet as the primary interactive color
- Restrained coral for attention, warnings, and selected progress accents
- Soft lavender and pale blue for charts, categories, and supporting states
- Semantic success, warning, and danger colors that remain distinct and accessible

Green may appear only when semantically required for positive financial movement. It must not function as the brand color. Gold is not part of the new interface.

### Typography and composition

- Editorial, characterful display treatment for key headings and financial summaries
- Highly legible sans-serif treatment for navigation, controls, tables, and body copy
- Strong hierarchy based on type scale and whitespace rather than containers around every element
- Moderate corner radii; pills only for filters, states, and compact actions
- Soft elevation used sparingly for overlays and focused interactive elements
- Thin, consistent iconography; emoji cannot serve as primary product iconography

### Motion

- Subtle route and section transitions
- Animated number changes where they improve comprehension
- Lightweight chart reveals and progress transitions
- Haptic confirmation for meaningful actions on supported devices
- Full support for reduced-motion preferences

The initial release uses the warm light theme only. A dark theme is a later extension and must not delay this redesign.

## Information architecture

### 1. Hoje

Hoje is the default screen and combines the strongest parts of the approved visual concepts “Resumo vivo”, “Linha do tempo”, and “Bússola financeira”.

Order of content:

1. Compact header with avatar, greeting, and notifications
2. Net worth and period movement, with privacy toggle and time-range control
3. Plain-language status such as growing, stable, or requiring attention
4. Three concise signals covering the current month, portfolio development, and risk balance
5. One contextual Vesti observation or suggested action
6. Monthly financial timeline containing contributions, dividends, portfolio movements, and relevant milestones
7. Two or three prioritized next steps with transparent reasoning

The page must not depend on an unexplained composite score. When any health or direction indicator appears, the user can see which underlying facts produced it.

### 2. Investir

Investir combines the existing portfolio, assets, operations, dividends, contribution, watchlist, and comparison experiences.

- Begin with a consolidated portfolio summary before the holdings list
- Provide clear switching between carteira, proventos, and operações
- Make search and asset addition contextual actions rather than a permanent central floating button
- Organize asset detail into overview, history, and fundamentals
- Keep watchlist and asset comparison within the same investment flow
- Mark shared wallets and assets clearly as read-only

### 3. Planejar

Planejar combines goals, passive-income projections, contribution suggestions, tax tools, declarations, reports, and simulations.

- Goals and future-income progress appear first
- Suggested contribution is the primary action
- IR, annual declaration, reports, and backtest live under a clearly labeled Tools section
- Tools open as ordinary pages or appropriate bottom sheets rather than a collection of visually unrelated full-screen modals
- Tax explanations retain the corrected 2026 rules and educational disclaimers

### 4. Aprender

Aprender combines lessons, personalized learning progress, market news, and rankings.

- Lead with the next lesson recommended for the user’s profile
- Show active learning paths and progress
- Present news and rankings as supporting content, not competing top-level destinations
- Keep educational language distinct from personalized investment advice

### Global destinations

Profile, settings, security, legal documents, wallet sharing, and subscription management open from the avatar or relevant contextual entry points. Notifications open from the Hoje header.

## Contextual Vesti assistant

The assistant is accessed through a consistent “Pergunte ao Vesti” entry point. It receives only the minimum context needed for the current task, such as the current section, selected asset, visible period, and already-approved financial aggregates. It must preserve existing server-side Pro entitlement enforcement and AI input/output validation.

The assistant can explain, summarize, and guide users toward existing application actions. It does not execute trades, move money, or present generated text as regulated financial advice.

## Design-system architecture

The redesign introduces a single source of truth for:

- Semantic colors and data-visualization colors
- Typography roles and scaling
- Spacing, content widths, radii, borders, elevation, and motion durations
- Touch-target minimums, focus states, and disabled states
- Responsive breakpoints and desktop content constraints

Reusable primitives will cover:

- App header and section header
- Page container and responsive content rail
- Financial metric and trend presentation
- Surface/panel, list row, and grouped list
- Primary, secondary, quiet, and destructive buttons
- Text fields, selectors, chips, and segmented controls
- Status banner, inline feedback, toast, and confirmation sheet
- Skeleton, empty state, error state, and retry state
- Contextual assistant entry point
- Pro feature explanation and upgrade entry point

Legacy components are replaced by these primitives. The final result cannot contain mixed old and new palettes, inconsistent spacing systems, or screens that retain the old card-heavy composition.

## Navigation and responsive behavior

The mobile application uses four bottom destinations: Hoje, Investir, Planejar, and Aprender. Settings and profile are not tabs. The current central contribution button is removed; contribution actions appear where financially relevant.

Mobile is the reference layout. Desktop and wide web layouts use a compact navigation rail and bounded content columns. They may place complementary sections side by side when this improves comprehension, but they must not merely stretch the mobile layout.

Navigation preserves deep links and existing business destinations through a mapping layer, allowing internal route names to be migrated safely without changing backend behavior.

## Loading, empty, error, and locked states

- Loading uses skeletons matching the expected content geometry
- Empty states explain the benefit of adding data and expose one primary action
- Recoverable failures explain what could not be loaded and offer retry
- Mutation failures keep the previous local state and show actionable feedback
- Shared data is visually marked as read-only before the user attempts an edit
- Pro features explain their value in context and never replace an entire unrelated page unexpectedly
- Offline or stale information is labeled with its last successful update time

## Accessibility

- WCAG-aligned color contrast for text, controls, charts, and status distinctions
- Minimum touch targets and visible keyboard focus on web
- Dynamic text support without clipping critical financial values
- Screen-reader labels for icons, chart summaries, privacy controls, and trend direction
- No information communicated by color alone
- Reduced-motion behavior for transitions and animated metrics

## Migration strategy

Implementation proceeds in four controlled layers:

1. **Foundation:** new tokens, typography, responsive containers, primitives, and navigation shell
2. **Primary areas:** Hoje, Investir, Planejar, and Aprender
3. **Supporting flows:** onboarding, authentication, PIN, asset details, tools, subscription, profile, and settings
4. **Removal and audit:** delete obsolete styling paths, verify no legacy palette or component composition remains, and run accessibility/responsive checks

During the transition, individual routes may be migrated behind the new shell, but a release is not considered complete while user-accessible screens visibly mix the two design systems.

## Testing and acceptance criteria

Automated checks will cover:

- Four-destination navigation and mappings to existing capabilities
- Loading, empty, error, read-only, privacy, and Pro states
- Responsive behavior at mobile, tablet, and desktop widths
- Token usage and removal of legacy emerald/gold brand colors from user-facing UI
- Accessibility labels and reduced-motion behavior for critical interactions
- Existing tax, authentication, entitlement, report-safety, database, and PIN regression tests

Manual visual validation will cover representative small and large phones plus desktop web. The redesign is accepted when:

1. Every reachable screen uses the new identity
2. Hoje communicates status, timeline, and next steps without unexplained scoring
3. All existing capabilities remain reachable through the new information architecture
4. No corrected financial or security behavior regresses
5. The interface remains understandable with privacy mode, no portfolio data, loading failures, and shared read-only data

## Out of scope

- Renaming Vesti
- Changing investment calculations or tax rules
- Changing Supabase authorization or account-deletion behavior
- Changing subscription entitlement rules or payment providers
- Executing trades or moving money
- Shipping a dark theme in the initial redesign
- Adding new social, banking, or brokerage integrations
