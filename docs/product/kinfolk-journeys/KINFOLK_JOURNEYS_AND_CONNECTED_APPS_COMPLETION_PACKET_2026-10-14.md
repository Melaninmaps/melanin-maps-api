# Kinfolk Journeys & Connected Apps — Source Completion Packet

**Prepared:** 2026-10-14
**Source commit:** `f5d4c099` — `feat: complete private Kinfolk Journeys source flows`
**Branch:** `feature/kinfolk-journeys-source-implementation-20261014`
**Integrated baseline:** `685eb746` — current production Admin-repair source was merged into this source candidate before the Journeys/Connected Apps work.
**Status:** **Source implementation complete; not deployed.**

> This packet is intentionally precise: **no production migration, deployment, provider credential, OAuth client, live provider connection, provider poll, native build, TestFlight upload, member-data write, directory change, Map change, or DNS change occurred.**

## 1. What is now implemented in source

| Capability | Source implementation | Live status |
|---|---|---|
| Private Kinfolk Journeys | Member-scoped plans separate from existing Life Journeys; draft, review-needed, confirmed, active, completed, archived, and deleted lifecycle states | Not migrated or deployed |
| Planning data | Dates/time zones, destinations, lodging, transportation, reservations, hard commitments, tentative plans, companions, preferences, saved places, reminders, retention and audit records | Not active |
| Owner control | Authenticated owner-only create/read/edit/delete, review-and-confirm, import correction, disconnect, retention and deletion routes | Not active |
| Kinfolk drafts | A member-approved draft route uses the existing governed itinerary/catalog path; suggestions remain proposals until explicitly saved | Not active |
| Selected imports | Pasted confirmation text; private selected PDF, image, `.eml`, and `.ics` staging; field-level provenance, confidence, duplicate/conflict and review state | Not active |
| Import extraction | Bounded selectable-text PDF, selected `.eml`, and `.ics` parsing; unreadable document/image facts remain review-needed rather than invented | Not active |
| Calendar | Native device-calendar selection source using `expo-calendar`; Google/Microsoft calendar adapter contracts remain disabled until separately configured | Requires later native build and explicit permission |
| Email | Gmail/Outlook use member-selected confirmation imports rather than mailbox-wide scanning | No mailbox connection or sync |
| Flight planning | Manual/selected-confirmation flight, lodging, transport, event and reservation items; advisory flight-watch lifecycle state | No flight-status provider, poller, callback, notification, rebooking, airline login or PNR access |
| Reminders | Per-Journey opt-in reminder records, pause/delete and privacy audit controls | No delivery worker or notification channel |
| Retention | Bounded retention executor with sensitive-data cleanup contract | Deliberately unregistered and unscheduled |
| Connected Apps | Member-controlled Travel, Health, Finance and Everyday catalog, consent/revoke/delete records, audit history and Web/native settings | No provider is represented as live unless separately configured and approved |
| Contextual Kinfolk invitations | Kinfolk may present an **optional** Connected Apps review card based on the current non-private message; it never starts OAuth, imports data, asks an OS permission, or changes a setting | Source only |

### Connected Apps catalog coverage

The private catalog covers the approved breadth without falsely claiming live data access:

- **Travel:** Google Calendar, Microsoft Calendar, selected Gmail/Outlook confirmations, device calendar, airline/hotel/ride confirmations, Ticketmaster, Eventbrite, Apple Wallet and Google Wallet boundaries.
- **Health:** MyChart/Epic, Apple Health, Android Health Connect, Fitbit and Garmin, all marked as sensitive and unavailable pending their own review.
- **Finance:** a read-only future Plaid path with an explicit no-payments/no-transfers/no-advice boundary.
- **Everyday life:** Google Drive, OneDrive, Dropbox, school/family and course calendars, selected files, Spotify, YouTube, TikTok, Pinterest, Goodreads, Canva and Adobe.

Each entry displays its actual availability state: member-selected import, device permission required, provider contract required, not configured, or unsupported. Wallet pass readers remain explicitly unsupported.

## 2. Member journey and safety behavior

1. A member creates a private Journey or accepts a Kinfolk proposal as a **draft**.
2. The member manually enters data or deliberately selects one confirmation/document/event.
3. Parsing produces proposed facts with source kind, confidence, fingerprint, review state and audit metadata.
4. The member reviews and confirms each useful fact. A parser, provider, or Kinfolk message cannot silently create a confirmed booking or commitment.
5. Confirmed commitments can be changed only through an explicit member edit. Kinfolk does not book, purchase, reserve, cancel, email, calendar-write, rebook, move or auto-reschedule anything.
6. A member may pause/revoke/delete an app permission or delete a Journey. Sensitive retention cleanup is modeled, but no automatic retention schedule is registered.

Private Journey records, imports and Connected Apps settings do **not** appear in Community, public profiles, the business directory, Map, public Kinfolk recommendations, or ordinary chat memory. The contextual Connected Apps card is also suppressed for private attachment turns.

## 3. Privacy, security and provider boundaries

| Control | Implemented source behavior |
|---|---|
| Member isolation | Every Journey and Connected Apps API action resolves the authenticated member and scopes data by owner ID. |
| Consent | Connected Apps requires an explicit, purpose-limited consent record. Sensitive health/finance choices require a sensitivity acknowledgement. |
| Audit | Consent, authorization revocation, deletion, Journey events, imports, reminders and flight-watch state retain private audit entries. |
| Tokens | Provider token envelopes use AES-256-GCM. API responses never serialize envelopes, raw tokens, raw inbox contents or raw attachment content. |
| OAuth safety | Provider allowlist, state hash, nonce hash, PKCE, short transaction expiry, redirect validation and scope boundaries exist in source. Network activity stays disabled by default. |
| Selected email | `.eml`, pasted confirmation, PDF, or member-selected export only. No inbox scan, mailbox subscription, forwarding address, delta sync or app-only mail permission. |
| Selected calendar | Explicit native event selection or `.ics` file. The product does not misrepresent broad calendar permission as event-specific access. |
| Documents and images | Dedicated private Journey media purpose; review-before-save; unsupported Wallet passes, QR/barcodes, entry credentials, payment data and unreadable facts are rejected or remain unconfirmed. |
| Flight watch | Advisory-only, member-opt-in lifecycle model. It stores no PNR, surname, ticket, passport, payment, loyalty or airline credentials and creates no live monitor until a provider/contract is separately approved. |
| Kinfolk intelligence | The existing governed itinerary/catalog path remains the only recommendation path. No ungoverned business source, private health source or financial source is added. |

## 4. Review-only schema work

Two additive, **unapplied** migrations are included:

1. `artifacts/api-server/migrations/20261014_kinfolk_journeys_source_only.sql`
   - Journey, item, source, import, connection, collaborator-reservation, reminder, audit and flight-watch tables.
2. `artifacts/api-server/migrations/20261014_kinfolk_connected_apps_source_only.sql`
   - Member-scoped app permissions and private consent-lifecycle audit tables.

They do not alter existing Life Journeys, business data, Kinfolk eligibility, map pins, memberships, authentication, Admin, Safety Hub, or public content. Both include review/rollback guidance. **Neither migration was run.**

## 5. Provider research conclusions

The complete provider and import decision record is in [Provider & import research](KINFOLK_JOURNEYS_PROVIDER_AND_IMPORT_RESEARCH_2026-10-14.md); flight-source research is in [Flight-monitor research](KINFOLK_JOURNEYS_FLIGHT_MONITOR_RESEARCH_2026-10-14.md).

Key decisions:

- Ordinary Google Calendar/Gmail and Microsoft Graph scopes are broad; they are not presented as selected-event/selected-message permissions. Selected files, native event selection, or a separately approved contextual add-in are the honest defaults.
- Delta, American Airlines, Ticketmaster and Wallet passes are **not** scraped, logged into, cloned, parsed as tickets, or connected through consumer credentials.
- An eventual advisory flight monitor requires a contracted provider such as FlightAware, Cirium or a validated Aviationstack arrangement, plus a secure backend-only secret, cost/license approval, callback/polling design, retention decision and notification approval.
- Apple Wallet and Google Wallet are not consumer pass-library read connections. Members use the underlying confirmation rather than a Wallet pass.

## 6. Validation completed

| Surface | Validation | Result |
|---|---|---|
| API | `pnpm run typecheck` | Passed |
| API | Focused Journeys/Connected Apps Vitest: catalog, API route, attachment extraction, confirmation parser, flight watch, retention worker and Journey route contracts | **7 files / 29 tests passed** |
| Web | `pnpm run typecheck` | Passed |
| Web | Journeys and Connected Apps contracts | **2 files / 10 tests passed** |
| Native | `pnpm exec tsc --noEmit -p tsconfig.json` | Passed |
| Native | Journeys and Connected Apps contracts | **2 files / 11 tests passed** |
| Shared DB | `pnpm exec tsc -b tsconfig.json` | Passed |
| Diff | `git diff --check` before commit | Passed |

No broad suite was run, because the direction was to keep the work bounded to the relevant feature contracts. No production endpoint or database was queried as a substitute for source validation.

## 7. Source files of note

- Journey schema: `lib/db/src/schema/kinfolk-journeys.ts`
- Connected Apps schema: `lib/db/src/schema/kinfolk-connected-apps.ts`
- Journey API: `artifacts/api-server/src/routes/kinfolk-journeys.ts`
- Connected Apps API: `artifacts/api-server/src/routes/kinfolk-connected-apps.ts`
- Provider/consent catalog: `artifacts/api-server/src/kinfolk/connected-apps/catalog.ts`
- Selected document extraction: `artifacts/api-server/src/kinfolk/journeys/attachment-extraction.ts`
- Flight-watch policy: `artifacts/api-server/src/kinfolk/journeys/flight-watch.ts`
- Web Journeys: `artifacts/web/src/pages/journeys.tsx`
- Web Connected Apps: `artifacts/web/src/components/kinfolk/ConnectedAppsSettings.tsx`
- Native Journeys: `artifacts/mobile/app/kinfolk-journeys.tsx`
- Native Connected Apps: `artifacts/mobile/app/kinfolk-connected-apps.tsx`

## 8. Required future approvals, in safe order

1. **Source review and isolated staging migration approval.** Apply only the two additive migrations to a non-production database; do not enable the feature.
2. **API/Web deployment approval with features disabled.** Keep `KINFOLK_JOURNEYS_ENABLED=false` and provider network access off. Supply a distinct non-production `KINFOLK_JOURNEYS_TOKEN_ENCRYPTION_KEY` only for synthetic staging tests.
3. **Synthetic acceptance approval.** Validate member isolation, import review, delete/revoke, retention cleanup, disabled-provider states and error/retry behavior with no real member data.
4. **Production migration and staged feature activation approval.** Use a fresh production encryption key; keep all provider network access disabled initially.
5. **Native build/TestFlight approval.** Required for device-calendar capability and all new native Journeys/Connected Apps controls. Installed builds remain unchanged until a new build is distributed.
6. **Provider-by-provider approval.** Each provider needs its own contract/Terms review, OAuth/client registration, exact scope/consent copy, data-retention decision, secret configuration, error/recovery path and testing.
7. **Flight monitor and notifications approval.** Choose an authorized provider, approve costs/licensing/DPA, configure backend-only secrets/callbacks or polling, then separately approve in-app/push/email delivery.

## 9. Rollback plan

- **Before migration:** do not deploy this branch.
- **After deploy but before activation:** leave the feature flag disabled or roll back the application artifact. No Journey data should exist.
- **After migration/activation:** first disable feature access and provider-network activity, then preserve required private audit data under the approved retention policy. Do not blindly drop tables.
- **Native:** rollback is a distribution decision independent of API/Web feature flags.

## 10. Current boundary

This branch is ready for founder source review and a later **separate** migration/deployment approval. It is not a claim that member calendars, emails, flight providers, health records, bank accounts, social accounts, files, Wallet passes or notifications are live today. Those external connections remain intentionally disabled until their independent technical, legal, privacy, security and deployment gates are satisfied.
