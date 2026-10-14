# Community Intelligence Completion and Safe Integration Plan

**Status:** Implementation-only integration plan
**Integration branch:** `feature/community-intelligence-complete-integration-20261014`
**Base candidate:** `staging/kinfolk-full-candidate-20261014` at `f46d87edbcd1c1dd81e00e27c80558827846b947`
**Prepared:** 2026-10-14

## 1. Authority and release boundaries

| Surface | Evidence | Treatment in this work |
|---|---|---|
| **Authoritative Kinfolk integration candidate** | `staging/kinfolk-full-candidate-20261014` at `f46d87ed` contains the recorded native interactive-preview handoff and is the approved Kinfolk integration base. | **Base branch.** All new work is integrated here first. |
| **Current production API** | Railway `melanin-maps-api` production is healthy at deployment `c865a111` from `manus/philadelphia-kinfolk-duplicate-reconciliation` commit `e3b5966`. | **Read-only reference only.** It is 226 commits divergent from the Kinfolk candidate; no broad merge or deployment is permitted. |
| **Private Kinfolk Journeys source** | Commit `3fd1851955bcc1754ca54736d4d6ef339432102f` (`feat: add private Kinfolk Journeys source implementation`) is not an ancestor of the candidate. | Selectively integrate after a file-by-file conflict review, retaining candidate Journey behavior where it already exists. |
| **Community Intelligence vertical slice** | Local source commit `4d4f27c6` on `feature/community-intelligence-vertical-slice-20261014`; report and branch correction commits follow it. | Integrate the verified vertical-slice implementation after preservation checks. |
| **Connected Apps** | No verified, completed Connected Apps source integration was found on the candidate during the preflight map. | **Do not manufacture or import it.** Record as unavailable rather than treating it as complete. |

> The current production deployment is intentionally not the merge target. This prevents a 245-commit reconciliation from being hidden inside a Community Intelligence change.

## 2. Product contract to preserve

The implementation must satisfy the current Founder Vision and Community Intelligence Constitution:

- Kinfolk strengthens a member’s relationship with community; it does not optimize engagement or sell access.
- Member-controlled preferences and member-created Life Journey context may be used only with consent; private conversations remain private.
- Professional expertise, popularity, business promotion, community trust, and verified facts remain distinct.
- No system exposes other members’ private data, raw messages, exact locations, small-cohort counts, or internal scoring/weighting logic.
- Paid promotion is never represented as organic community trust.
- Safety, medical, legal, financial, emergency, and surveillance scenarios remain guarded and cannot enter Community Intelligence learning.

## 3. Feature-preservation and conflict matrix

| Area | Candidate state | Integration action | Must not change |
|---|---|---|---|
| Existing **Life Journeys** | `life_journeys`, `entity_connections`, `/journeys`, current mobile Life Journey screen, Kinfolk prompt injection. | Preserve as the canonical existing Journey system. Add private Kinfolk Journeys as a separate namespaced route/domain only where it can coexist. | Existing journey creation, tier limits, phase/step flows, deletion, entity graph, prompt injection. |
| **Private Kinfolk Journeys** (`3fd18519`) | Source-only private planning, confirmation parser, retention worker, token-vault pattern, web/mobile route clients. | Import only after resolving route registration, SPA routing, schema export, and UI entry-point overlaps. Maintain explicit feature/migration gating. | No automatic provider connection, background sync, production migration, account linking, or activation. |
| **Community Intelligence** (`4d4f27c6`) | Consent-gated suggestion policy, feedback controls, suppression-safe aggregate gap view. | Import as the common policy/service/API/UI contract; add tests against current candidate interfaces. | No raw chat collection, identity/location fields, silent opt-in, personal analytics, business/founder access to individual activity. |
| **Kinfolk conversations** | Existing answer route and native/web chat clients. | Extend only the response contract with ≤3 transparent suggestions and feedback actions. | Existing messages, voice, memory, attachments, error/fallback states, request semantics. |
| **Kinfolk settings** | Existing controls and direct member consent surfaces. | Add/retain an explicit Community Intelligence preference row and disabled-state wording. | Existing memory/voice/saved-place and all other settings behavior. |
| **Business discovery and profiles** | Existing directory, business cards, profile routes, verification distinctions, owner dashboard. | No new business ranking logic beyond synthetic policy tests. | Data, ownership/verification display rules, profile actions, business tools, dashboard. |
| **Community and Safety** | Existing routes and member controls. | Keep existing functional regression tests; preserve safety exclusions in policy. | Posts, images/video, permissions, reporting, emergency/safety controls. |
| **Admin / founder aggregate view** | Existing authorized Admin surface. | Add a suppression-safe category-gap surface only. | Admin permissions, moderation, account/data controls; no individual traces. |
| **Connected Apps** | No verified completed artifact identified. | Exclude from code integration; note it in final matrix. | OAuth/account links, tokens, providers, member connections. |

## 4. Integration sequence

1. **Preflight and provenance** — record base, production reference, source commit SHAs, and the matrix above.
2. **Cherry-pick Community Intelligence** — import `4d4f27c6`; resolve only integration-file conflicts; run type checks and existing contracts.
3. **Reconcile Private Kinfolk Journeys** — import the `3fd18519` implementation; preserve existing `/journeys` and add only explicitly separate private Journey routes and entry points. Keep source-disabled/feature-gated behavior unless current candidate owns an approved activation path.
4. **Complete cross-layer contract** — verify API, web, mobile, shared DB schema, migrations, route registration, and Admin surfaces together; add only narrow adapters required by current candidate contract differences.
5. **Run synthetic proof and regressions** — use test fixtures only for consent, revocation, suppression, wedding/birthday policy, Journey boundaries, disabled collection, and recommendation response safety. Do not use live member data.
6. **Validate at matching surfaces** — capture web screenshots and interaction checks if a compatible runtime is available; record native-device evidence as pending if no runtime exists. No visual substitution or new design.
7. **Commit the integration branch** — retain a conflict log and a final feature-preservation matrix. Stop before merge, deployment, migration application, feature activation, mobile build, or TestFlight/Play action.

## 5. Acceptance gates

| Gate | Required proof |
|---|---|
| Journey compatibility | Existing `/journeys` contracts still pass; imported private Journey contracts pass; route names remain distinct. |
| Consent and privacy | Collection defaults off; no write occurs without the global gate plus explicit participation; revocation stops future use; small cohorts are suppressed. |
| Recommendation quality | Wedding and birthday test fixtures produce relevant, different, transparent suggestions; sensitive/high-consequence inputs produce none. |
| API / client parity | API, web, and mobile types compile; member response and setting controls agree on payload shapes. |
| Protected surfaces | Kinfolk, discovery/profile, Community, Safety, settings, owner dashboard, and Admin contracts pass or are explicitly documented as a pre-existing external failure. |
| Scope control | Diff contains only Community Intelligence / Journey integration files, narrow route/schema adapters, tests, and handoff records. |
| Release isolation | No merge, deployment, production DB migration, data backfill, runtime activation, native binary build, TestFlight, or Play submission. |

## 6. Explicit non-goals

- No live Community Intelligence collection or analytics.
- No model training, raw-message persistence, retroactive/automatic data harvest, or founder/business individual-member analytics.
- No Connected Apps/OAuth integration.
- No rework of the existing mobile or web visual design.
- No broad reconciliation of the active production branch into the Kinfolk candidate.
- No production deployment or release action.

## 7. Integration-time safety decisions

| Decision | Resolution on this branch | Release consequence |
|---|---|---|
| Community Intelligence table creation | Removed runtime DDL from the service. Added `20261014_community_intelligence_source_only.sql`, which is not referenced by startup migration code. | A separately reviewed migration application is required before any collection can work. |
| Missing Community Intelligence schema | Settings reads report collection off; feedback fails closed without a schema or event write; preference changes return unavailable rather than creating storage. | No production database mutation or partial activation occurs accidentally. |
| Private Journey feature | `KINFOLK_JOURNEYS_ENABLED` remains the explicit default-off gate. Existing `/journeys` remains separate from `/kinfolk-journeys`. | No new Journey persistence or member action is available until approval, migration, and activation. |
| Provider / Connected Apps scaffolding | Provider network calls require both the Journey feature and `KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED`; disabled capability responses mask providers as unavailable. | Credentials alone cannot create a connection, invoke a provider, or imply Connected Apps is live. |
| Imported root checklist | Removed as duplicate scope noise; the retained Journey implementation plan lives under `docs/product/kinfolk-journeys/`. | Final diff stays limited to integration artifacts and avoids an unrelated top-level TODO. |
