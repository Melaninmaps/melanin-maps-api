# Community Intelligence — Final Completion and Cross-Task Handoff

**Task status:** Bounded source completion; not merged or released
**Branch:** `feature/community-intelligence-complete-integration-20261014`
**Base candidate:** `f46d87edbcd1c1dd81e00e27c80558827846b947`
**Prior accepted safety commit:** `c398fcc31fcdc79a74e3f1fdced0651336028a61`

## Completion outcome

This follow-up closes the identified Community Intelligence gap without broadening into a new product integration. The learning loop now uses only privacy-suppressed aggregate effects to change a later **different, opted-in** member's safe planning suggestions. It never returns or displays a contribution count, member identifier, message, location, private context, or individual feedback history.

A sufficiently aggregated positive signal may order an already relevant category earlier. A sufficiently aggregated reconsider signal from `Not relevant` or `Already handled` feedback removes that category from the later eligible member's offered suggestions. If collection is disabled, storage is unavailable, the recipient has not opted in, or the aggregate read fails, Kinfolk returns the original safe contextual suggestions unchanged.

No production collection was activated. The only evidence uses deterministic synthetic query fixtures and source-level tests.

## Working recommendation and feedback behavior

| Situation | Expected behavior | Evidence |
|---|---|---|
| Member has not opted in | Receives safe current-message planning suggestions, but no aggregate learning adjustment and no feedback event write. | Service test: `does not apply aggregate learning to a non-participating recipient`. |
| Opted-in member marks an offered category `Helpful` | Only structured category/action metadata can be retained after all collection and schema gates pass. Aggregate support can reorder an existing category; it cannot create a category or business result. | Policy/service tests. |
| Multiple opted-in contributors mark a category `Not relevant` or `Already handled` | The aggregate becomes a private reconsider effect. Kinfolk removes only that otherwise relevant category for a later different opted-in member. | Service test: `uses only a suppressed aggregate reconsider signal to change a later opted-in member's suggestions`. |
| Wedding early planning | Venue planning is offered among the bounded, non-business planning considerations. | Policy test: `returns no more than three relevant wedding early-planning suggestions`. |
| Wedding venue already booked | Venue planning is not repeated when that completed need is explicitly stated in the current message. | Policy test: `does not repeat a wedding venue need that the member explicitly says is booked`. |
| Birthday needs decorations | Decorations/setup can be offered. | Policy test: `offers birthday decorations only until the member explicitly says they are handled`. |
| Birthday decorations already handled | Decorations/setup is not repeated when the current message explicitly says it is complete. | Same policy test. |
| Medical, legal, financial, emergency, surveillance, or other excluded context | No Community Intelligence suggestion is produced. | Existing policy safety regression. |

The current-message completion checks are deterministic and transient: they do not infer a life stage, read a calendar, access saved memory, or persist chat text.

## Privacy and consent invariants preserved

| Invariant | Source boundary |
|---|---|
| Default off | `COMMUNITY_INTELLIGENCE_COLLECTION_ENABLED` must be exactly `"true"`; otherwise settings/feedback paths do not query or write Community Intelligence storage. |
| Separate member choice | A member must independently enable participation before an event can be written or aggregate learning can alter that member's suggestions. |
| Migration safety | The service has no runtime table/index creation. `20261014_community_intelligence_source_only.sql` remains unapplied and absent from automatic startup paths. |
| Revocation | Turning participation off revokes active member events; aggregate reads additionally join active participation state. |
| Data minimization | The design stores structured journey/category/action metadata only. It excludes question text, free-form feedback, message identifiers, private memory, location, calendar, profile, documents, and sensitive-category fields. |
| Aggregate-only learning | The ranking service receives only category/effect pairs after privacy suppression. No count, contributor, raw event, or individual feedback is returned to Kinfolk, web, mobile, or Admin. |
| No business manipulation | The loop never creates business recommendations, affects business eligibility/ownership/verification, changes promotion rules, or presents sponsored placement as organic. |

## Founder-scope reconciliation

The future-state package confirms travel, relocation, business support, and life transitions as platform use cases. It does not make every future use case an authorized extension of this individual, source-only Community Intelligence task. The existing approved migration and the previously accepted branch define this task's active structured collection scope as wedding/birthday planning only.

| Founder-approved situation | Status in this task | Ownership / next boundary |
|---|---|---|
| Wedding and birthday planning | **Completed in this task.** Contextual completion suppression and aggregate learning proof now exist. | Remains the bounded Community Intelligence vertical slice. |
| Travel | Confirmed platform use case, but not added as a Community Intelligence feedback category here. | Preserve for the expanded private Journeys / Connected Apps integration. Travel must retain governed itinerary, safety, current-source, and provider boundaries. |
| Relocation | Confirmed platform use case; it requires its own life-stage and safety-aware context, not a copied wedding/birthday classifier. | Existing Kinfolk/relocation workstream and its dedicated planner own it. |
| Graduation | A documented future life-stage/milestone area, not an active category in the approved Community Intelligence migration. | Future life-stage work with explicit member context/consent and milestone policy. |
| Business planning and Community Intelligence Briefings | Future business-intelligence/Phase-6 work with unresolved founder decisions. | Business Intelligence workstream; no business ranking, owner analytics, promotion, or briefing behavior was added here. |
| Medical, legal, financial, emergency, safety, immigration, surveillance | Explicitly excluded. | Existing governed safety/redirect paths, never this learning loop. |

This task therefore does **not** add duplicate Journey, calendar, Connected Apps, general-chat, business-intelligence, or life-stage infrastructure.

## General Kinfolk chat integration contract

The general Kinfolk chat remains the only integration point for this bounded loop. The final integrator must preserve the following interfaces and ordering:

1. `artifacts/api-server/src/routes/kinfolk.ts` calls `communityIntelligenceSuggestionsForMessage(message)` only on the existing low-consequence, non-private-attachment response path.
2. It passes the authenticated member ID to `rankSuggestionsWithCommunitySignals(req.user?.id, suggestions)`. That function must retain fail-closed semantics and return baseline suggestions for disabled collection, missing schema, non-participation, or errors.
3. The API response keeps the optional `communityIntelligenceSuggestions` array with the client-safe fields `id`, `journeyType`, `stage`, `intent`, `categoryKey`, `label`, and `reason`. It must not add counts, member IDs, raw feedback, chat text, locations, ranking metadata, or provider data.
4. Web keeps `CommunityIntelligenceSuggestions` rendered from that response in `artifacts/web/src/pages/travel.tsx`; mobile keeps `CommunityIntelligenceSuggestionCards` rendered by `artifacts/mobile/components/AIChatWidget.tsx`.
5. Feedback remains `POST /api/kinfolk/community-intelligence/feedback` with only `{ suggestionId, action }`. Settings remain `GET`/`PUT /api/kinfolk/community-intelligence/settings`. Founder-only aggregate review remains `GET /api/admin/community-intelligence/gaps`.
6. The Community Intelligence router stays behind the existing member wall. The Admin route remains aggregate-only and must not gain raw event/member routes.

## Newer Journeys / Connected Apps version difference

This branch deliberately contains the earlier private Journeys source (`d07caa0a`). Read-only GitHub provenance confirms the later implementation exists separately as:

| Commit | Meaning | Relationship to this branch |
|---|---|---|
| `f5d4c0992bbd6c94bd6b4a9a781917299a44d21a` | Expanded private Kinfolk Journeys source flows, Connected Apps source-only schema/routes, provider/import/flight-watch work, and web/mobile Connected Apps surfaces. | **Not imported or replaced** here. |
| `b4db8af440819b02bc8a33390a8db04ea1d00f37` | Remediation reconciliation that also touches Kinfolk routes and mobile chat/settings surfaces. | **Not imported or replaced** here. |

The later merge will likely conflict in these shared files: `artifacts/api-server/src/routes/kinfolk.ts`, `artifacts/mobile/components/AIChatWidget.tsx`, `artifacts/mobile/components/KinfolkSettingsControlCenter.tsx`, `artifacts/web/src/pages/travel.tsx`, and `artifacts/web/src/components/kinfolk/KinfolkExperienceSettings.tsx`.

### Required final-integrator procedure

1. Start from the explicitly approved newer Journeys/Connected Apps reconciliation; do not independently cherry-pick or replace it from this task.
2. Manually preserve the General Kinfolk chat contract above, the Community Intelligence route/service/policy modules, both member clients, the Admin aggregate view, and the two source-only migrations.
3. Preserve the namespace boundary: existing Life Journeys remain `/journeys`; private Journeys remain `/kinfolk-journeys`; Connected Apps keeps its own route/module boundary; Community Intelligence must not become a provider, calendar, token, or Journey persistence path.
4. Re-run Community Intelligence policy/service/route contracts, Kinfolk chat presentation contracts, newer Journey/Connected Apps contracts, and focused provider-disabled tests after resolving shared-file conflicts.
5. Stop before applying either migration, enabling collection/provider flags, connecting an account, or deploying.

## Shared build handoff

Exact dependency blockers and minimal proposed corrections are recorded in [Community Intelligence Shared Build Blockers](COMMUNITY_INTELLIGENCE_SHARED_BUILD_BLOCKERS.md). They remain intentionally outside this branch's feature edits.

## Validation evidence for this completion

| Surface | Result |
|---|---|
| Community Intelligence policy, contextual-relevance, consent, aggregate-learning, route, private-Journey route, and provider-disabled tests | **PASS — 5 files, 28 tests** |
| Full API typecheck | Blocked by existing direct dependency issues in six non-Community-Intelligence files; handoff recorded. |
| Full mobile typecheck | Blocked by an existing direct `@workspace/constants` dependency omission across 24 files; handoff recorded. |
| Web/mobile device runtime | Not created. This remains source-level evidence only. |

## Staging and device acceptance still required

Before any release authorization, a separate staged task must: apply the reviewed additive migration in isolated staging; use synthetic opted-in fixtures to validate the member settings, feedback, aggregate adjustment, Admin suppression, and no-count/no-identity response boundaries; verify collection/provider gates are off by default; compare the integrated web and native client behavior; and complete native device acceptance. No production migration, data backfill, provider/OAuth activation, mobile build, PR, final merge, or deployment is authorized by this handoff.
