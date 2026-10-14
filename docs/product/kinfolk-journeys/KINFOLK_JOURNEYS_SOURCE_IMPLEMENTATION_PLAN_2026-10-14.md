# Kinfolk Journeys — Source-Only Implementation Plan

**Authorization:** Founder authorization dated 2026-10-14. This plan governs source implementation and source-level validation only. It does **not** authorize a production deployment, production migration, native build, provider credential, live connection, directory/data change, or external purchase.

## Product boundary

Kinfolk Journeys is a **private, member-owned travel-planning experience**. It is intentionally separate from the existing Life Journeys feature, existing Kinfolk conversation history, public/shared trip pages, directory data, Safety Hub, and admin surfaces.

The two synchronized entry points are:

- **KinfolkAI conversation:** a validated trip response may offer a private Journey draft. Nothing is persisted until the member explicitly selects **Create Journey** and later completes **Review & Confirm**.
- **Journeys area:** an authenticated member can create, review, edit, organize, archive, delete, import, and manage private travel plans.

The existing Life Journeys (`life_journeys`) model remains unchanged and continues to serve non-travel life planning. Kinfolk Journeys uses a new additive data model and does not inherit Life Journey context automatically.

## Source architecture

### Data model

Create a dedicated schema module with additive tables for:

1. `kinfolk_journeys` — member owner, lifecycle (`draft`, `review_needed`, `confirmed`, `active`, `completed`, `archived`, `deleted`), title, destination, time zone, date range, retention choice, optional Kinfolk session reference, consent timestamps, and soft-deletion timestamps.
2. `kinfolk_journey_items` — member-entered plans, confirmed commitments, tentative items, Kinfolk suggestions, flights, lodging, transport, events, and saved MWM places. Confirmed items are immutable to Kinfolk: only an explicit member edit can revise them.
3. `kinfolk_journey_sources` — field-level provenance, source kind, confidence, extraction status, member confirmation state, source snapshot metadata, and duplicate fingerprint.
4. `kinfolk_journey_imports` — private confirmation text, selected email metadata, file-asset references, manual entry, extraction status, and the requested retention/deletion state. Raw provider content and attachment content remain outside client-visible records.
5. `kinfolk_journey_connections` — provider, status, narrowly granted scopes, expiration/reconnect metadata, encrypted token envelope reference, consent timestamps, and revocation result. No provider token is stored in a session, browser bundle, log, or API response.
6. `kinfolk_journey_collaborators` — future-ready invited companion role/access records. Owner-only is the initial active policy; collaborator access stays disabled until a later explicit sharing activation decision.
7. `kinfolk_journey_reminders` and `kinfolk_journey_audit` — member-controlled reminders, delivery idempotency, privacy-safe audit events, and retention/deletion outcomes.

Prepare an additive SQL migration and rollback notes. Do not apply either.

### Service layer

Create focused Kinfolk Journeys modules rather than adding business logic to the large Kinfolk route:

- `journeys/domain.ts` — strict input/output types and lifecycle transition policy.
- `journeys/authorization.ts` — owner scoping, future collaborator gate, and redaction rules.
- `journeys/confirmation-parser.ts` — deterministic extraction of only clearly recognizable manual/pasted confirmation facts, with explicit confidence and review-needed output. Ambiguity remains unconfirmed.
- `journeys/import-review.ts` — duplicate fingerprinting, conflict handling, field-level provenance, and a Review & Confirm gate.
- `journeys/itinerary.ts` — availability windows, time-zone/date helpers, buffers, and governed MWM candidate preservation. It never fabricates availability, hours, travel times, businesses, map facts, bookings, or safety claims.
- `journeys/providers/*` — configuration-only adapter interfaces for Google/Microsoft calendars and mail, device-calendar imports, and flight status. Disabled or missing-configuration sources return honest capability states without network calls.
- `journeys/token-vault.ts` — versioned AES-GCM token envelope interface that accepts only server-side secret configuration and redacts all route/log output.
- `journeys/retention.ts` — delete, disconnect, purge, and audit mechanics. Remote revocation is represented as a retryable, redacted result; local access is removed immediately.

### API

Mount a new authenticated `/api/kinfolk-journeys` router after the existing member wall. It will support private list/detail/create/update/lifecycle/delete, timeline items, sources, imports/review confirmation, suggestions, provider-connection status, consent/revocation, reminders, and a conversation-draft endpoint.

Every read/write scopes by the authenticated member ID. Journey references are never accepted as authority on their own. A response may contain redacted status, source labels, and safe member-facing metadata; it cannot contain provider tokens, confirmation numbers, raw inbox content, raw document content, another member’s plan, or precise private location without the active owner’s specific action.

### Kinfolk itinerary integration

Reuse only the governed itinerary path:

- `createGovernedKinfolkBusinessRepository`
- `buildValidatedOrRankedItinerary`
- `buildValidatedItineraryReply`

Persisting an itinerary copies only canonical MWM business IDs plus source metadata from the server-authorized result. The legacy free-form travel planner is not used. A Journey conversation handoff is explicit, member-confirmed, and tied to the member-owned Kinfolk session; unrelated conversation history is not mined.

### Web and mobile design

The feature preserves MWM’s existing warm visual system: deep brown for structure, cream for quiet space, gold for actions/progress, and clear contrast. It adds no decorative imagery.

Web adds authenticated `/journeys`, `/journeys/new`, and `/journeys/:id` routes, navigation entry points, a Review & Confirm experience, timeline, imports, suggestions, connection/status screen, reminder settings, privacy/retention controls, and visible loading/error/retry states.

Mobile adds a server-backed `/journeys` flow instead of relying on the existing AsyncStorage itinerary prototype. It reuses secure bearer transport, explicit permission prompts, document/image selection only after the member chooses an import action, and offline-safe cached/error states. No native build is part of this scope.

### Provider and privacy boundary

The source contains provider-neutral adapters and member-facing states for Google Calendar, Microsoft/Outlook Calendar, Gmail, Outlook confirmation imports, Apple/device-compatible imports, and optional flight providers. It does **not** create OAuth applications, client IDs, credentials, callback configuration, real auth redirects, inbox/calendar calls, or commercial flight-provider calls.

The future production implementation must use authorization-code + PKCE, a server-owned one-time transaction, state/nonce validation, fixed allowlisted redirects, least-privilege scopes, encrypted refresh-token envelopes, secret-free readiness reporting, revoke/disconnect handling, and selected-item import only. Free/busy is the default calendar view; event detail access is a separate consent.

### Reversible feature control

All Journeys traffic is gated behind a server-side `KINFOLK_JOURNEYS_ENABLED` capability check. The UI will show an honest unavailable/retry state when the feature is disabled or the required migration is absent. Provider adapters independently report `disabled`, `not_configured`, `needs_reconnect`, `expired`, or `available`; no UI may imply a live connection or monitored flight without evidence.

## Project structure

| Area | Responsibility |
|---|---|
| `lib/db/src/schema/kinfolk-journeys.ts` | Additive database tables and strict persisted type shapes |
| `artifacts/api-server/src/kinfolk/journeys/*` | Domain, authorization, import, parser, itinerary, retention, and provider adapters |
| `artifacts/api-server/src/routes/kinfolk-journeys.ts` | Authenticated member API and redacted route responses |
| `artifacts/api-server/migrations/*kinfolk_journeys*.sql` | Review-only additive migration and rollback companion |
| `artifacts/web/src/pages/journeys*.tsx` | Member Journeys list, editor, review, detail, and controls |
| `artifacts/web/src/features/journeys/*` | Shared UI state, API client, timeline, import/review, and connection components |
| `artifacts/mobile/app/journeys.tsx` and `artifacts/mobile/features/journeys/*` | Server-backed mobile parity flow |
| `*/__tests__/*journeys*` | Owner isolation, privacy, lifecycle, provider, extraction, and UI contracts |

## Completion evidence

Completion requires source-level tests and typechecks across API, Web, and mobile. The final release packet will separate what is implemented in source from what remains adapter-ready pending provider configuration, staging migration approval, production approval, and a future native build.
