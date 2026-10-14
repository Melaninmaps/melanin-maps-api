# Kinfolk Journeys — Source-Only Release Packet

**Prepared:** 2026-10-14
**Source commit:** `3fd1851955bcc1754ca54736d4d6ef339432102f`
**Branch:** `feature/kinfolk-journeys-source-implementation-20261014`
**Deployment status:** **Not deployed.** No production migration, configuration, provider credential, provider call, live member data change, native build, or TestFlight upload occurred.

## Scope completed in source

| Capability | Source status | Production status |
|---|---|---|
| Private member-scoped Journeys | Implemented behind `KINFOLK_JOURNEYS_ENABLED` | Disabled / not migrated |
| Lifecycle, owner-only items, confirmation, deletion, retention controls | Implemented | Not active |
| Pasted confirmation parsing and field-level review/provenance | Implemented | Not active |
| Private PDF/image storage boundary | Implemented with `kinfolk_journey_private` media purpose | Not active |
| Google/Microsoft calendar and mail OAuth adapters | PKCE/state/nonce/scope/token-encryption source contracts implemented | No credentials, redirect, network access, or connection enabled |
| Device calendar selection | Native source implemented using `expo-calendar` | Requires a later native build and member permission |
| Manual flight, lodging, transport, event, reservation, and reminder support | Implemented | Not active |
| Live flight status | Intentionally unavailable with an honest manual-entry state | No provider selected or called |
| Member-selected Kinfolk drafts | Explicit review-only `drafts/from-kinfolk` path implemented | Not active |
| Reminder persistence | Implemented, delivery explicitly unscheduled | No notification worker or permission enabled |
| Retention expiry executor | Implemented but deliberately unregistered | No worker scheduled |

## Member experience included

The Web and native screens supply a private list/detail workspace, create flow, structured items, confirmation review, private document/image attachment staging, imported-fact confirmation, connection status, optional device-calendar event selection, reminders, error/retry/empty states, disconnect, and deletion. The Web layout and native Profile screen link to Journeys.

> Journeys is a planning workspace, **not a booking system**. It cannot book, change, cancel, purchase, email, calendar-write, or silently confirm commitments.

All imported facts remain review-needed until a member selects and saves them. Confirmed items can only be changed through an explicit member edit. Journeys never appear in Community, public profiles, the directory, Map, or ordinary Kinfolk chat.

## Data model and review-only migration

`artifacts/api-server/migrations/20261014_kinfolk_journeys_source_only.sql` is additive and has **not** been run. It creates:

- `kinfolk_journeys`
- `kinfolk_journey_items`
- `kinfolk_journey_sources`
- `kinfolk_journey_imports`
- `kinfolk_journey_connections`
- `kinfolk_journey_collaborators` (schema reserved; collaboration has no live UI)
- `kinfolk_journey_reminders`
- `kinfolk_journey_audit`

The migration contains review-only rollback guidance. It does not alter existing Life Journeys, directory businesses, Kinfolk eligibility, Map pins, Admin, memberships, authentication, Safety Hub, or public content.

## Security, privacy, and abuse boundary

| Control | Source behavior |
|---|---|
| Ownership and isolation | Every Journey route resolves the authenticated member and scopes all reads/writes by owner ID. |
| Token storage | OAuth transaction and token data use AES-256-GCM envelopes. Routes never return an envelope, raw token, raw inbox content, or raw attachment content. |
| Token key | `KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY` must be a unique base64-encoded 32-byte key before any connection flow can be enabled. |
| OAuth | PKCE, state hash, nonce hash, short transaction expiry, provider allowlist, HTTPS redirect base, and minimum requested scopes are enforced. |
| Mail | Mail connectors expose selected-confirmation semantics only. No inbox scan is implemented. |
| Files | Journey attachments use a dedicated private upload purpose; no provider URL is returned to the client. Unprocessed files remain review-needed. |
| Provenance | Parsed/accepted facts retain source kind, confidence, content fingerprint, extraction state, and member confirmation, with no raw confirmation text stored in surfaced responses. |
| Destructive retention | Member deletion and future expiry clear imported facts and sensitive payloads, cancel items, revoke collaborators, delete reminders, and preserve an audit event. They deliberately do **not** disconnect account-scoped connections. |
| Recommendations | The existing governed Kinfolk itinerary/catalog contracts remain the only recommendation path; member-selected suggestions are stored as proposals. |

## Validation completed

| Surface | Command/result |
|---|---|
| API types | `pnpm run typecheck` — passed |
| API Journey suites | 6 files / 21 tests passed: domain, parser, providers, token vault, retention worker, route contract |
| Web types | `pnpm run typecheck` — passed |
| Web suites | 2 files / 13 tests passed: Journeys contract and authenticated transport |
| Native types | `pnpm exec tsc --noEmit -p tsconfig.json` — passed |
| Native suites | 2 files / 15 tests passed: Journeys contract and primary-action confirmation |
| Database declarations | Prettier check and `pnpm exec tsc -b tsconfig.json` — passed |
| Diff hygiene | `git diff --check` passed before source commit |

The focused source checks passed. No broad suite, production request, database query, deployment, or native build was run under this work item.

## Required future approvals and operating sequence

1. **Review this source commit and migration.** Approve an isolated staging migration only; do not enable the feature yet.
2. **Deploy the API/Web source with `KINFOLK_JOURNEYS_ENABLED` absent or `false`.** This remains safe and keeps the public and existing member experience unchanged.
3. **Stage test the private workspace** with synthetic accounts/data. Set a distinct non-production `KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY`; verify owner isolation, deleted-data behavior, upload access, and disabled-provider states.
4. **Authorize production migration and feature activation separately.** Use a fresh production encryption key and keep provider network access off.
5. **Authorize an iOS/Android build separately** if native device-calendar selection is wanted. The new `expo-calendar` dependency needs a native build; it does not affect installed binaries.
6. **Authorize each OAuth provider separately** only after its client registration, consent copy, redirect URI, scope review, token-rotation plan, incident path, and provider Terms review are ready. Configure only the chosen provider credentials and then decide whether to set `KINFOLK_JOURNEYS_PROVIDER_NETWORK_ENABLED=true`.
7. **Authorize notification delivery and retention scheduling separately.** The source persists reminders and includes a retention executor, but no background delivery or deletion schedule is registered.

## Future rollback

- **Before migration:** do not deploy the branch.
- **After API/Web deploy but before activation:** keep `KINFOLK_JOURNEYS_ENABLED=false` or roll back the application artifact; no member Journey data exists.
- **After migration/activation:** first disable the feature flag, revoke/clear provider network activation, export required audit records under the approved retention policy, then use the migration’s reviewed rollback only after verified data handling. Do not drop tables blindly.
- **Native:** release rollback is a store/TestFlight distribution decision and is independent of Web/API feature gating.

## Files of note

- Schema: `lib/db/src/schema/kinfolk-journeys.ts`
- Review-only migration: `artifacts/api-server/migrations/20261014_kinfolk_journeys_source_only.sql`
- Private API: `artifacts/api-server/src/routes/kinfolk-journeys.ts`
- Provider safeguards: `artifacts/api-server/src/kinfolk/journeys/providers.ts`
- Encryption: `artifacts/api-server/src/kinfolk/journeys/token-vault.ts`
- Web workspace: `artifacts/web/src/pages/journeys.tsx`
- Native workspace: `artifacts/mobile/app/kinfolk-journeys.tsx`
- Test coverage: `artifacts/api-server/src/kinfolk/journeys/__tests__/`, `artifacts/web/src/__tests__/kinfolk-journeys-contract.test.ts`, and `artifacts/mobile/__tests__/kinfolk-journeys-contract.test.ts`
