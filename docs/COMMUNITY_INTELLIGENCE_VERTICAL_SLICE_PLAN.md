# Community Intelligence — First Functional Vertical Slice

## Authorization and release boundary

The founder has explicitly authorized implementation of the first Community Intelligence vertical slice after the current Kinfolk candidate merge. The baseline is `staging/kinfolk-full-candidate-20261014` at `f46d87edbcd1c1dd81e00e27c80558827846b947`, which already contains the native interactive-preview handoff. This work is additive to that candidate and does **not** create a mobile build, TestFlight upload, production deployment, production data collection, database backfill, or an unrelated redesign.

The internal Community Intelligence methodology remains confidential. This implementation uses only the public product contract: member context is voluntary; community signals are aggregated; recommendations are explainable; private activity is not exposed; and the feature is never optimized for engagement.

## Product outcome

Implement a shared Community Intelligence layer for website and native app:

1. Kinfolk recognizes **wedding inspiration** and **birthday planning** context without requiring the member to create a formal Life Journey.
2. Kinfolk returns at most **three** “You might also want to consider…” items, each with a plain-language reason tied to the current journey stage and intent.
3. Members can mark each item **Helpful**, **Not relevant**, or **Already handled**.
4. An explicit Community Intelligence participation control explains the boundary and lets a member enable/disable eligibility only when the server-controlled feature flag permits collection.
5. The same central contract powers web and native UI; no client invents its own recommendations.
6. A founder/admin view presents only privacy-safe aggregated category gaps and never exposes private conversations, individual activity, or identifying small cohorts.

## Architecture

### Reuse before adding

- **Life Journey:** retain existing journey creation, needs, phases, steps, limits, and Smart Match behavior. The new context recognizer feeds a compact `journeyType`, `stage`, and `intent` into the response contract; it does not replace the Life Journey model.
- **Kinfolk chat:** extend the existing response contract and answer presentation paths instead of starting a second chat or planner.
- **Existing feedback:** retain answer-level Helpful / Not helpful feedback as a separate existing feature. New suggestion-level feedback is structured and scoped to Community Intelligence suggestions.
- **Business directory:** retain existing ownership, verification, safety, eligibility, and recommendation rules. A category gap may identify a need but may never create, imply, or rank an invented business.
- **Settings and admin:** add focused sections to the existing Kinfolk settings and existing founder/admin surface; do not replace settings, role checks, dashboards, or tabs.

### New bounded modules

| Module | Responsibility |
|---|---|
| `lifeJourneyIntelligence` | Pure, reusable journey type/stage/intent recognition plus a dependency graph for wedding and birthday planning. It establishes foundational suggestions before community aggregates exist. |
| `communityLearningService` | Central eligibility, feedback normalization, aggregation, suppression, ranking adjustment, and explanation service. It accepts only structured, permitted signals. |
| Community Intelligence API contract | Preferences, suggestion feedback, current suggestions, and founder aggregate gap view. The Kinfolk response uses this same service. |
| UI suggestion card | Shared data shape rendered in web and native Kinfolk answer surfaces with three feedback controls and a reason. |
| Settings control | Clear participation status, purpose, scope exclusion, disable/revocation behavior, and feature-disabled state. |

## Data and privacy model

### New data (additive migrations only)

1. **Community Intelligence preference** — one member-owned record for explicit participation state and timestamps. It contains no journey text, private memory, documents, locations, or sensitive category values.
2. **Consent-eligible learning event** — a structured event limited to journey type, stage, intent, dependency category, feedback outcome, coarse non-identifying scope where valid, and time window. It stores no raw chat, note, uploaded document, connected inbox data, exact location, medical/financial/sensitive attribute, or business-quality assertion.
3. **Aggregate/category-gap read model** — derived aggregate counts/rates suitable for founder/admin presentation only after cohort/suppression checks.

### Collection and retention boundary

- `COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED` defaults to **false**. Production code can render foundational suggestions and transparent settings, but cannot record production learning events while false.
- Explicit opt-in is required before a learning event is eligible when the flag is true.
- The first slice never reads historic private conversations, private memory, medical/financial data, email, uploaded documents, exact location history, or sensitive personal information.
- Feedback and event deletion/revocation is member-addressable. The service documents a retention/deletion configuration; the initial migration provides an expiry field and cleanup-ready query path but does not launch a worker or backfill.
- Minimum-cohort and rare-combination suppression are enforced centrally before an aggregate can affect a suggestion or appear to a founder/admin. Threshold configuration stays server-side and is never exposed as an individual-member claim.

## Journey recognition and suggestion behavior

### Wedding inspiration (primary)

Recognize only a bounded, evidence-based combination of wedding planning language and intent stage. In inspiration/discovery, suggestions may draw from the foundational graph such as **alterations/fittings**, **hair trial/getting-ready timing**, and **vendor setup/cleanup coordination**. They must not introduce unrelated legal, financial, health, or other sensitive categories.

### Birthday planning (generalization)

Recognize celebration planning separately and return its own context-appropriate dependencies, such as **venue logistics**, **transportation/accessibility**, or **setup/cleanup**, without reusing wedding-only suggestions.

### Learning effect

An eligible synthetic event may increase or decrease the ranking of a relevant foundational suggestion for a later synthetic member in the same context. It cannot convert a category signal into a factual business recommendation. UI copy remains: “You might also want to consider…” and a plain language relevance reason; it never claims “other members found this helpful” unless the central service has valid, unsuppressed aggregate evidence.

## Website and native surfaces

- Extend the current Kinfolk response models and components on both clients to render the same `communityIntelligenceSuggestions` contract.
- Preserve existing chat, memory, voice, saved places, all navigation tabs, Safety controls, business discovery/profile, business-owner, and settings behavior.
- Add a small Community Intelligence section under the existing Kinfolk settings control center for participation review/change and a clear disabled/coming-soon collection state.
- Add a founder/admin aggregate category-gap route or tab using existing authorization. It presents aggregated demand/coverage language, scope, and time period only; no names, raw messages, member records, or individual actions.

## Verification and evidence

Use synthetic fixtures only. The required end-to-end proof is:

1. wedding context → three relevant foundational suggestions;
2. opted-in synthetic feedback produces eligible aggregate learning;
3. later wedding response changes relevant ranking without exposing a member;
4. birthday produces a different, context-appropriate suggestion set;
5. disabled collection produces no learning event;
6. opt-out/revocation blocks future event recording;
7. web and native render the same contract;
8. existing Kinfolk, business discovery/profile, Community, Safety Hub, settings, and business-owner contract tests remain green.

Where no native runtime is available in this Sandbox, capture matching source/contract evidence and record the remaining iOS/Android screenshot comparison explicitly rather than claiming it completed.

## Project structure

```text
artifacts/api-server/
  src/services/community-intelligence/       central recognizer, policy, aggregation, contracts
  src/routes/community-intelligence.ts       authenticated preference/feedback APIs
  src/routes/admin-community-intelligence.ts founder aggregate API
  migrations/                                additive schema migration
  src/__tests__/                             synthetic vertical-slice and regression tests

artifacts/web/
  src/components/kinfolk/                    response suggestion cards
  src/pages/kinfolk-settings.tsx             consent control extension
  src/pages/admin*.tsx                       aggregate founder view extension

artifacts/mobile/
  components/                                native suggestion presentation
  app/kinfolk-settings.tsx                   consent control extension
  app/admin.tsx                              founder aggregate view extension
  lib/                                       shared API client/contract mapping
  __tests__/                                 native contract and rendering tests

docs/
  COMMUNITY_INTELLIGENCE_VERTICAL_SLICE_PLAN.md
  COMMUNITY_INTELLIGENCE_VERTICAL_SLICE_TODO.md
  COMMUNITY_INTELLIGENCE_VERTICAL_SLICE_REPORT.md
```

## Material constraints

- No broad refactor or alternate recommendation system.
- No production deployment, production collection, mobile build, TestFlight/Play submission, or production database migration run.
- No copy of confidential ranking methodology into public-facing strings or public documentation.
- Preserve unrelated active release, tester, Safety, referral, business-profile, preview, and visual work.
- Stop after the complete branch-level vertical slice and report for founder review before any production activation.
