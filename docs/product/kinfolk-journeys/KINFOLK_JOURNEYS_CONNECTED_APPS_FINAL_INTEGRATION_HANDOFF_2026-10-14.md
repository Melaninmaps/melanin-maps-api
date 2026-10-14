# Kinfolk Journeys & Connected Apps — Final Integration Handoff

**Prepared:** 2026-10-14
**Independent source branch:** `feature/kinfolk-journeys-source-implementation-20261014`
**Assigned-work code commit:** `0d251fab2aa81f202225d5a09953cec329beaab5` — `fix(journeys): align provider readiness contracts`
**Journeys source feature commits:** `3fd18519`, `f5d4c099`
**Kinfolk remediation reconciliation:** `b4db8af440819b02bc8a33390a8db04ea1d00f37`

> This is an **independent source handoff**, not final Mapping with Melanin/KinfolkAI integration or release approval. No deployment, production migration, provider activation, private-data collection, OAuth credential setup, mobile build, TestFlight submission, production data change, or live member connection was performed.

## 1. Assigned functionality status

| Capability | Status | Source behavior / boundary |
|---|---|---|
| Private Journey create, list, detail, update, archive/delete | **Implemented and validated in source** | Authenticated, owner-scoped API routes; soft deletion clears private Journey material and audits the action. Web has Journey list/detail routes; native has a registered workspace route. Staging migration and feature flag are still required. |
| Flights, lodging/hotels, transport, reservations, activities/events, places, notes, reminders | **Implemented and validated in source** | Supported Journey item kinds are `flight`, `lodging`, `transport`, `reservation`, `event`, `place`, `note`, and `reminder`. Member-created items are private; confirmed commitments cannot be changed by imports or Kinfolk without an explicit member edit. |
| Time zones and itinerary ordering | **Implemented and validated in source** | Journey and item validation requires valid IANA zones when supplied; invalid date ranges/times fail closed. Detail lists items by `starts_at NULLS LAST, created_at ASC`. iCalendar import requires member review rather than silently deriving a timezone. |
| Pasted confirmation import | **Implemented and validated in source** | Member-consented 4–20,000-character confirmation text is parsed only into review-only suggestions. Exact-content duplicates are returned as duplicates rather than added again. |
| PDF, `.eml`, and `.ics` import review | **Implemented and validated in source** | Private, owner-scoped PDF, selected email, and iCalendar files are processed only after explicit review consent. File bytes/raw text are not persisted, returned, logged, or sent to ordinary Kinfolk chat. |
| Image import | **Implemented but awaiting staging** | JPG/PNG/WebP/HEIC images can be stored as private review-needed attachments. **Image OCR/fact extraction is not implemented**; images remain manual-review attachments. |
| Correcting and confirming imports | **Implemented but awaiting staging** | Members can review parsed suggestions and choose items to save; source routes preserve redacted provenance. Web/native presentation currently selects a proposed title for the save flow. Final integration should complete richer per-field edit/reject UI and API lifecycle coverage. |
| Duplicate and conflicting confirmations | **Partial; final integration dependency** | Exact digest deduplication is implemented. Stale private-document review fails closed. A full cross-source conflict detection/resolution lifecycle is **not implemented** even though the schema reserves a `conflict` status; repeated confirmation must receive an explicit idempotency guard before activation. |
| Kinfolk conversation to Journey draft/update | **Partial; final integration dependency** | `POST /kinfolk-journeys/:journeyId/drafts/from-kinfolk` owner-scopingly saves **member-confirmed** selected Kinfolk suggestions as proposed items and retains a session reference. It is not yet invoked by the Web/native chat clients. Ordinary Kinfolk chat currently provides only an optional Connected Apps prompt, not direct private-Journey context or create/update actions. |
| Return from Journey to Kinfolk | **Implemented but awaiting staging** | Web exposes an `Ask Kinfolk` navigation action, and Journey navigation is registered on Web/native. A durable selected-Journey conversational handoff must still be wired by the final integrator before claiming contextual continuity. |
| Journey preferences and approved member context | **Partial; final integration dependency** | Journey preferences are schema/API-supported; global Kinfolk member context is separately consented. Journey creation UIs do not yet collect Journey-specific preferences, and those preferences are not injected into ordinary Kinfolk chat. |
| Native selected device-calendar events | **Implemented in source; awaiting native build** | Expo Calendar permission/selection lets a member add selected events as tentative items only. It requires OS permission and a separate authorized native build. |
| Google/Microsoft calendar OAuth | **Provider/configuration blocked** | PKCE, state, nonce, encrypted transaction/token envelope, and owner-scoped callback code exist. Client IDs, client secrets, registered HTTPS redirect URIs, token-encryption key, and the explicit provider-network feature gate are intentionally unset. |
| Gmail/Outlook mailbox linking | **Not implemented by design** | Mailbox OAuth is intentionally disabled because ordinary mailbox scopes exceed selected-message access. Supported path is member-selected `.eml`, PDF, ICS, or pasted confirmation review. |
| Flight watch | **Implemented but provider/configuration blocked** | Member-consented advisory watch records can be created, paused, revoked, and deleted. No provider poller, airline-account access, booking/PNR access, notification delivery, or live status claim is active. |
| Private reminders | **Implemented but awaiting delivery infrastructure** | Private reminder records support save/pause/delete. Delivery is explicitly `not_scheduled`; no notification dispatcher is active. |
| Connected Apps catalog and consent | **Implemented and validated in source** | Member-scoped catalog, explicit purpose/data-type consent, sensitive-data acknowledgement, audit records, truthful availability labels, and optional Kinfolk prompts are implemented. A catalog entry does not mean any account is connected. |
| Connected Apps revoke/delete | **Implemented and validated in source** | Revoke/delete clears local token envelopes and related Journey-provider authorization, writes audit records, and does not silently delete Journey plans. |
| Member isolation, private assets, retention, audit | **Implemented and validated in source** | Journey and private asset queries are owner-scoped. Safe responses omit token envelopes and raw document/email content. A bounded retention worker redacts/deletes Journey content transactionally but is deliberately not scheduled or activated. |

## 2. Focused validation completed

| Area | Validation | Result |
|---|---|---:|
| API | 10 focused Journey/Connected Apps suites | **45/45 tests passed** |
| API | `pnpm run typecheck` | Passed |
| Web | Journeys + Connected Apps contract suites | **11/11 tests passed** |
| Web | `pnpm run typecheck` | Passed |
| Native | Journeys + Connected Apps contract suites | **12/12 tests passed** |
| Native | `pnpm exec tsc --noEmit -p tsconfig.json` | Passed |
| Shared DB | `pnpm exec tsc -b tsconfig.json` | Passed |
| Source integrity | `git diff --check`; provider readiness search | Passed |

### Newly hardened negative coverage

- Cross-member private attachment access fails as `JOURNEY_NOT_FOUND` and preserves the requester-specific owner predicate.
- Journey routes retain owner predicates, duplicate digest handling, and stale-review conflict failure behavior.
- Connected Apps revoke/delete clears local authorization/token envelopes while retaining member-controlled Journey deletion boundaries.
- Web and native regressions lock the API/client provider state to **`available`**, preventing a configured connection from being incorrectly disabled by stale `ready` checks.

Existing focused coverage also includes unreadable PDFs, unsupported/oversized attachments, disabled feature flags, unavailable providers, token-envelope redaction, retention cleanup, rollback, and advisory flight-watch consent.

## 3. Interfaces for final integration

### API routes

All routes are mounted behind the existing authenticated member wall.

- `GET /api/kinfolk-journeys/capabilities`
- `GET|POST /api/kinfolk-journeys`
- `GET|PATCH|DELETE /api/kinfolk-journeys/:journeyId`
- `POST|DELETE /api/kinfolk-journeys/:journeyId/items[/:itemId]`
- `POST /api/kinfolk-journeys/:journeyId/imports/text`
- `POST /api/kinfolk-journeys/:journeyId/imports/assets`
- `POST /api/kinfolk-journeys/:journeyId/imports/:importId/extract-private-document`
- `POST /api/kinfolk-journeys/:journeyId/imports/:importId/confirm`
- Reminder and flight-watch member lifecycle routes under the same Journey ID.
- `GET /api/kinfolk-journeys/connections`, connection start/callback/disconnect routes, and `POST /api/kinfolk-journeys/:journeyId/drafts/from-kinfolk`.
- `GET /api/kinfolk-connected-apps`, contextual catalog, explicit permission creation, revoke, and delete routes.

### Shared source interfaces

- API: `artifacts/api-server/src/routes/kinfolk-journeys.ts`, `artifacts/api-server/src/routes/kinfolk-connected-apps.ts`
- Domain/security: `artifacts/api-server/src/kinfolk/journeys/`
- Web clients/UI: `artifacts/web/src/features/journeys/api.ts`, `artifacts/web/src/pages/journeys.tsx`, `artifacts/web/src/components/kinfolk/ConnectedAppsSettings.tsx`
- Native clients/UI: `artifacts/mobile/lib/kinfolkJourneys.ts`, `artifacts/mobile/app/kinfolk-journeys.tsx`, `artifacts/mobile/app/kinfolk-connected-apps.tsx`

## 4. Database and configuration dependencies

**Unapplied, review-only migrations:**

- `artifacts/api-server/migrations/20261014_kinfolk_journeys_source_only.sql`
- `artifacts/api-server/migrations/20261014_kinfolk_connected_apps_source_only.sql`

They create private Journey, item, import/source receipt, connection, collaborator, reminder, flight-watch, Connected Apps permission, and audit structures. They must receive a separate migration-review and staging approval before any environment applies them.

**Required activation choices are intentionally absent:**

- `KINFOLK_JOURNEYS_ENABLED=true` only after staging migration/application verification.
- A 256-bit `KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY` with an approved secret-rotation plan.
- Provider-specific OAuth client IDs/secrets and registered exact HTTPS callbacks.
- An explicit decision on `KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED`; credentials alone must not enable provider traffic.
- Approved retention and reminder-delivery operations. The worker/records exist but no scheduler is enabled.

## 5. Overlap assessment — do not merge these independently

No separate robust Travel/Calendar implementation is available in the fetched remote branches.

| Ref | Commit | Relevant finding |
|---|---|---|
| `origin/candidate/mwm-build136-kinfolk-integration` | `2739013640a4d45ed88b0ca4f8e374ad464f4067` | Ancestor of this branch; no Journey/Calendar/Connected Apps delta. |
| `origin/candidate/mwm-build136-kinfolk-completion-remediation` | `00a190ea2c3e7d57578fbdb7c5220b47f594280c` | Already reconciled by `b4db8af4`; Kinfolk/mobile safeguards, no Journey/Connected Apps module. |
| `origin/candidate/mwm-build136-kinfolk-post-stage-remediation` | `26ddfb59419a20549b9c11bc43c0037b9d4716d8` | Not merged here; Travel-screen voice/cache/style changes only, no Calendar/Journey/Connected Apps implementation. Reassess separately during final integration. |

## 6. Required preservation notes

1. Preserve `buildContextualConnectedAppsPrompt(message)` and its conditional response spread in `artifacts/api-server/src/routes/kinfolk.ts`; private question attachments must continue to suppress this optional prompt.
2. Preserve owner-scoped predicates, explicit import/confirmation consent, private-media purpose, raw-content/token redaction, audit writes, and no-booking boundaries.
3. Preserve the source-only migrations as **unapplied** until the final migration review.
4. Preserve the `available` provider-readiness vocabulary across API, Web, and native. Do not restore the obsolete `ready` UI gate.
5. Do not replace native selected device-calendar flow with disabled mailbox OAuth. The member-selected calendar/event boundary is the current source capability.
6. Do not remove the optional Connected Apps prompt merely because it is not a live connection; it truthfully routes member choice to settings without importing anything.

## 7. Recommended final-integration order

1. Compare all independent candidates against the Master Founder Vision without wholesale replacement of `kinfolk.ts`, `travel.tsx`, or Journey modules.
2. Preserve the Journeys/Connected Apps source boundary and resolve direct chat-to-Journey UX: explicit member-selected Journey context, draft creation/update, selected suggestion save, and return to the same conversation.
3. Implement explicit import conflict state/idempotent confirmation and per-field edit/reject UX before enabling member access.
4. Decide whether image extraction is required; if so, design a separate private, consented OCR path with raw-content retention limits and no ordinary-chat leakage.
5. Apply migrations only in an approved staging environment; enable the feature flag there and run behavioral API tests for owner isolation, repeat confirmation, revoke→use prevention, deletion/retention, and disabled-state UX.
6. Configure/verify providers only after registered redirects, credentials, encryption/rotation, provider terms review, and network-activation approval. Keep Gmail/Outlook mailbox OAuth disabled unless a narrower provider-approved mechanism exists.
7. Validate Web navigation, private import review, Connected Apps lifecycle, and no-leak behavior in staging. Build iOS/Android only under a separate native-build authorization after device-calendar permission testing.

## 8. Final boundary

This branch is ready for a **final integrator’s source comparison and staged integration plan**, not release. It must not be represented as live calendar/email/flight linking, live flight monitoring, active reminder delivery, applied database schema, or an installed native feature.


## 9. Cross-feature intelligence verification — required before final merge

> **Conclusion:** Kinfolk has meaningful shared general-chat capabilities, but the repository does **not** demonstrate a single authorized connected-data reasoning layer across Journeys, Connected Apps, provider events, and health records. These are functional source components, not yet the complete cross-feature KinfolkAI experience.

### What general Kinfolk chat actually understands today

| General-chat capability | Evidence in current source | Classification |
|---|---|---|
| General conversation, governed business discovery, public/current city and travel research | `artifacts/api-server/src/routes/kinfolk.ts` has the general chat route, directory/evidence gates, public current-information routing, and sourced city briefing behavior. | **Implemented source capability** |
| Consent-gated preferences and permitted memory | General chat applies only server-permitted, relevant member context and has explicit sensitive-memory boundaries. Private question attachments suppress ordinary personalization. | **Implemented source capability** |
| Active existing Life Journey context | `kinfolk.ts` reads the latest active `lifeJourneysTable` record for the authenticated member at the general-chat route. | **Implemented, but separate from private Kinfolk Journeys** |
| Health education and current health research | `buildHealthRetrievalContext` supplies current public educational/official health evidence for a health question; health safety overrides and non-diagnosis rules are in the shared prompt/routing. | **Implemented for educational/public evidence; not a personal-record connector** |
| Current-turn member-provided PDF/image question | Private attachments can be considered for that answer only and are excluded from ordinary contextual/research/memory paths. | **Implemented with a strict current-turn privacy boundary** |
| Connected Apps | General chat emits only `buildContextualConnectedAppsPrompt(message)`, a safe invitation to settings. It does not retrieve an app's data. | **Implemented invitation; not connected-data reasoning** |
| Private Kinfolk Journeys | No `kinfolkJourney`, Journey import, flight-watch, or Connected Apps permission table is queried by the general chat route. | **Not integrated into general chat** |

The relevant source history is present on this branch: `3e8117a4` (health retrieval), `df6df2ea` (consented health context), `0d12ce7b` and descendants (explicit conversation handoffs), `f5d4c099` (Journeys completion), and `b4db8af4` (reconciliation). Those commits do **not** establish the missing unified connected-data correlation described below.

### Required capability versus actual evidence

| Founder-required behavior | Current evidence | Result |
|---|---|---|
| Retrieve authorized calendar, flight, email, provider, and Journey records through general chat | Journeys/provider adapters are source-only, feature-gated, and not read by `kinfolk.ts`; mailbox OAuth is deliberately disabled. | **Not implemented** |
| Correlate a flight arrival with a concert, location, transport buffer, and time zone | No shared Journey/provider event normalizer or conflict evaluator is called from general chat. | **Not demonstrated / not implemented** |
| Explain known facts versus a travel-time estimate | General chat can distinguish public evidence from uncertainty, but no Journey-flight/event conflict path exists. | **Partial foundation only** |
| “What does my week look like?” across authorized sources | No general-chat aggregation of calendar/Journey/reminder/provider records exists. | **Not implemented** |
| Interpret MyChart/FHIR appointments, labs, medications, instructions, and referrals | Existing health retrieval is public educational research plus consented population context; no FHIR/MyChart personal-record connector, schema, consent route, or chat retrieval exists. | **Not implemented** |
| Proactive provider event → affected Journey → useful member alert | Flight watches are `pending_provider`; provider network is disabled; reminders return `not_scheduled`; retention worker is intentionally unscheduled. | **Not implemented** |
| Natural return to a related issue later | Explicit conversation handoffs exist, but no Journey/provider context is saved/retrieved into those handoffs. | **Partial, not connected-data continuity** |
| Consent, revocation, freshness, source provenance across all features | Journey and Connected Apps local controls exist; no shared cross-feature authorization/provenance contract is consumed by general chat. | **Partial foundation only** |

### Synthetic acceptance result

No passing synthetic Delta-flight/concert, MyChart/FHIR, cross-source weekly-summary, or proactive-event test exists in the focused repository test inventory. The source review therefore **does not claim** that these cases work. A synthetic test cannot honestly be marked passing until the shared authorized-context and conflict-routing integration below exists.

This is a source-verification finding, not an external-provider blocker:

- A Delta example can be tested with a clearly labeled **synthetic provider event**; it must not imply live flight monitoring.
- A MyChart example can be tested with synthetic FHIR-style records; it must not connect a real patient record or infer a diagnosis.
- The absence of those tests and retrieval paths is an integration gap, not a reason to fabricate a live-provider result.

### Single shared integration contract required

The final integrator must add or identify **one server-side authorized-context composition contract** used by general Kinfolk chat, rather than a separate AI system per feature. At minimum it needs to deliver bounded, owner-scoped records with:

1. **Consent and scope:** explicit member purpose/access mode, revocation state, source/provider key, and feature flag.
2. **Fact provenance and freshness:** source-record ID, observed/effective timestamps, zone, confidence, and a clear distinction between provider fact, member-entered fact, and Kinfolk estimate.
3. **Relevant relation evaluation:** deterministic or reviewed evaluation for time overlap, flight-arrival/event risk, dates, location, transit/baggage buffers, and other domain-specific constraints; estimates must be labeled, never promoted to verified facts.
4. **General-chat retrieval:** the chat route may retrieve only the minimum context relevant to the explicit question or separately opted-in proactive rule; it must not sweep all private plans/documents into every prompt.
5. **Revocation/deletion/freshness enforcement:** a revoked source, deleted Journey, stale provider event, or disabled feature must be unavailable to chat before model prompting.
6. **Member control and audit:** members can see, correct, pause, disconnect, delete, and understand why a fact or relationship mattered; use is auditable without storing raw sensitive payloads in chat history.

### Exact required synthetic acceptance tests for final integration

1. **Travel conflict:** seed one member's authorized Journey with a Delta flight initially arriving in Atlanta at 17:00, a synthetic update at 19:15, an 20:00 Atlanta concert commitment, explicit time zone, venue, airport, transportation/baggage assumptions, and provenance timestamps. A general-chat question such as *“Will my flight delay affect my concert?”* must identify the risk, separate provider facts from an estimated transfer buffer, explain uncertainty, suggest safe options, and never book/change anything.
2. **Cross-feature weekly view:** seed only authorized calendar/Journey/reminder records. *“What does my week look like?”* must return a useful bounded summary without requiring screen switching; a no-consent/revoked-source variant must truthfully state what cannot be used.
3. **Health record understanding:** seed synthetic FHIR-style appointment, instruction, medication, lab, and referral records after explicit health-data consent. General chat must distinguish source facts, provider instructions, and educational explanation; identify scheduling/follow-up information; never diagnose, change treatment, or claim a fact absent from the record.
4. **Revocation and isolation:** member B, a revoked permission, a deleted Journey, and an expired/stale source event must yield no content in member A's or member B's chat context. Assert the absence before model invocation and audit access decisions.
5. **Proactive event:** only after a separately approved event/notification implementation, exercise synthetic flight-delay input → affected private Journey → relevance decision → member preference → one non-duplicative notification. A disabled provider, no permission, or no delivery channel must send nothing and make no live-monitoring claim.

## 10. Updated final-integration boundary

Before any final merge, the final integrator must reconcile this cross-feature intelligence requirement with the source modules above. The current branch contributes private Journeys, governed Connected Apps scaffolding, provider readiness boundaries, and safe source interfaces. It does **not** prove that general Kinfolk chat can reason across authorized connected data, and it must not be presented as doing so until the synthetic acceptance suite passes.

## 11. Accepted individual-task closure

**Founder acceptance recorded:** 2026-10-14
**Task status:** **INTEGRATION-READY** — not founder-complete, released, staged, deployed, provider-active, or available in a native build.

The final integrator must preserve this branch, its source/test history, review-only migrations, and every privacy boundary above. The following are mandatory final-integration requirements, not optional enhancements:

1. General Kinfolk chat must retrieve only **relevant, authorized** Journey and Connected Apps context.
2. Kinfolk must correlate commitments across authorized sources, including a changed flight arrival and a concert/event schedule.
3. Any approved health connection must provide privacy-protected record understanding through general chat, distinguish record facts from educational explanation, and never diagnose or alter care instructions.
4. Journey imports must have conflict-safe/idempotent confirmation, member correction/rejection controls, and an explicitly designed private image-understanding boundary where image extraction is required.
5. Reminders, proactive alerts, and provider monitoring must integrate with the shared notification/event infrastructure; stored preferences or pending watches are not monitoring.
6. Final integration must preserve the most complete compatible Journey/calendar implementation across independent workstreams rather than replace it with a thinner duplicate.
7. The synthetic cross-feature acceptance cases in Section 9 must pass before any connected-data intelligence is described as operational.

No additional work is assigned to this independent branch unless the final integrator identifies a specific regression attributable to it.
