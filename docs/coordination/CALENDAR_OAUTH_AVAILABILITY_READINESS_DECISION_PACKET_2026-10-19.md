# OAUTH-001 — Calendar OAuth Availability-First Readiness Decision Packet

**Status:** **NO-GO — contract approval required before any Calendar OAuth claim, source implementation, client configuration, or pilot**
**Decision date:** 2026-10-19
**Authority evidence base:** `78a17e1d647daeec7c9814330910c94ab08f142c`
**Central coordination claim:** `OAUTH-001-AVAILABILITY-FIRST-READINESS-PACKET` (P1), recorded at `de51d9d98528b2acbd251b329f2a8ec98668341b`

## Decision

Calendar OAuth is **not ready** for a source claim, configuration, consent screen, connection, pilot, or activation.

The reviewed product has two deliberately limited and useful seams, but neither is a provider integration boundary:

1. **Manual private availability blocks** are owner-scoped, encrypted, explicit-confirmation records. They explicitly do not connect, read, sync, or block an external calendar.
2. **Shared Plan free/busy evaluation** is a pure, import-free, aggregate-only policy sink. It accepts already-authorized normalized busy intervals, enforces active purpose/plan/participant/time-window grants, and returns only candidate windows and aggregate counts.

There is no approved Calendar OAuth connection contract, adapter, callback/state/PKCE boundary, token vault lifecycle, connection schema, revocation/disconnect workflow, or provider-network permission. The manual-availability storage contract must not be repurposed for provider identity, consent state, scopes, token material, cursors, or raw provider data. SP-002 and SP-003 remain frozen and do not authorize Calendar OAuth or provider work.

## Future-only Calendar Availability Connection Contract v1

The following is the complete minimum contract that must be reviewed and approved before a non-overlapping implementation claim can open. It is a decision specification, not source authorization.

### 1. Sole purpose and output minimization

The sole permitted purpose is exactly:

```text
shared_plan_free_busy
```

The connection may be used only to produce availability for a currently valid, member-authorized Shared Plan grant. It must never support profiling, recommendation, Kinfolk chat context, memory, Map, Directory, Community, Safety, travel monitoring, reminders, notifications, advertising, analytics, AI prompts, or any other purpose.

The maximum provider query window is the active Shared Plan window and may not exceed **31 days**. A valid grant window may not exceed **93 days** and must contain the plan window. The connection must fail closed if the purpose, plan, participant, time window, consent state, or grant is absent, expired, revoked, malformed, or inconsistent.

The adapter output is limited to normalized busy intervals:

```text
{ startAt: canonical UTC instant, endAt: canonical UTC instant, timeZone: canonical IANA zone }
```

Intervals are an internal transient input to the existing aggregate evaluator. The only member-facing result is the existing aggregate candidate-window form: canonical window start/end/time zone, aggregate participant count, minimum-availability decision, and aggregate available count. No participant-level busy state or provider-specific explanation may be returned.

Before aggregate policy is invoked, the adapter must strip and prohibit all event identifiers, event subjects/titles, bodies/descriptions, attendees, organizers, locations, conference details, recurrence data, working-hours data, calendar identifiers/names, provider identifiers, account identifiers, raw responses, and provider error payloads. Those fields must never enter persistence, API responses, logs, traces, metrics, analytics, caches, queues, browser storage, model context, or prompts.

### 2. Delegated member/provider/scope consent model

Each connection is bound to one authenticated member, one provider, one exact delegated scope receipt, and the sole `shared_plan_free_busy` purpose. A connection is never transferable across members, providers, purposes, plans, accounts, or tenants. The future schema must distinguish a member-owned calendar from a calendar merely shared with that member; it must not silently broaden access.

A member must see and affirm explicit consent language before each provider connection and before any materially broader scope. The consent record must include the provider, exact scope string, purpose, grant timestamp, expiry/refresh status, and privacy boundary. Connection state is explicit and fail-closed:

```text
not_connected | consent_pending | granted | expired | revoked | disconnected
```

Only `granted` may be queried. Refresh failure, invalid grant, scope mismatch, provider-account mismatch, or a missing consent receipt moves the state out of `granted` and returns no availability result. Incremental authorization is required for any later scope change; broader scopes are not implied by a previous approval.

### 3. Provider-specific least-privilege choices

**Google Calendar.** Contract v1’s initial and only permitted Google scope is `https://www.googleapis.com/auth/calendar.freebusy`, the narrow availability scope. `calendar.events.freebusy` is not permitted in v1. If a later product requirement demonstrably needs availability across calendars the user can access, it requires a separately approved contract amendment, exact new consent text, and an incremental-consent decision; it may not be silently substituted.

**Microsoft Graph.** Contract v1 permits only delegated `Calendars.ReadBasic` for work/school accounts and only to invoke the documented `calendar/getSchedule` availability boundary. Personal Microsoft accounts are not eligible for this v1 provider path because that API does not support them. Application permissions and app-only tokens are forbidden. The Graph adapter must treat `scheduleItems` as hostile over-broad input because responses can contain fields such as subject and location; all fields other than validated busy/time-bound interval data are discarded before the policy sink.

### 4. Authorization-code callback and client boundary

A future web or native connection flow must use authorization code flow with PKCE where the platform supports it. Every authorization attempt requires a unique, cryptographically non-guessable, single-use `state` value that is bound server-side to the authenticated member, provider, purpose, requested scope, redirect URI, and expiry. The callback must verify state, PKCE verifier/challenge, member/session correlation, redirect URI, provider issuer, and exact approved scope before any token is accepted.

Tokens, authorization codes, `state`, PKCE verifiers, provider account references, and raw responses are forbidden from browser storage, deep links, URLs, query strings, client logs, analytics, or crash reports. Callback failures are generic, do not reveal account existence, clear transient state, and produce no partial connection. Native and web redirect boundaries must be separately specified and reviewed; this packet does not approve either.

### 5. Server-side encrypted token vault and identity protection

A future connection vault is separate from manual private-availability tables. It uses server-side authenticated encryption bound to:

```text
owner + provider + purpose + connection record
```

The vault must retain a key identifier, support key rotation with re-encryption, keep a rotation/audit receipt free of token/account values, apply least-privilege server access controls, and redact all errors. Tokens, refresh tokens, provider account identifiers, calendar identifiers, scopes beyond the consent receipt needed for enforcement, and raw provider responses must never be surfaced to members, other users, client code, logs, analytics, AI, or external providers.

Provider identity is private connection metadata, not Shared Plan input or output. The aggregate evaluator receives only opaque participant references and normalized busy intervals after all connection and consent checks pass.

### 6. Disconnect, revocation, deletion, and failure behavior

A member must be able to explicitly disconnect a provider connection. Disconnect immediately blocks future reads, invalidates the local connection state, and performs local cryptographic deletion of token material and provider-account linkage. It must be idempotent and safe after partial failures. A separately approved implementation may invoke a provider revocation endpoint only under this same member-initiated disconnect/revocation contract; it must not retain provider data while retrying indefinitely.

Provider invalid-grant, expiry, consent withdrawal, security revocation, or scope downgrade must fail closed, securely delete/disable unusable credentials, transition to `expired` or `revoked`, and require fresh interactive consent. No busy intervals, cached results, or aggregate availability may be reused after the connection ceases to be `granted`.

### 7. Source-only adapter and fake-provider test requirements

Before any client configuration, provider network access, or member consent, source-only tests with fake provider/HTTP/clock dependencies must prove all of the following:

- exact Google scope selection and rejection of unapproved or broadened scopes;
- delegated-only Microsoft `getSchedule` eligibility and rejection of personal/app-only paths;
- one-time state, PKCE, issuer, redirect, scope, session, and owner checks;
- owner/provider/purpose isolation for consent records and vault access;
- encrypted token-vault redaction, key rotation behavior, and no token/account/provider leakage;
- stripping of every prohibited Google/Graph event, calendar, attendee, location, body, title/subject, identifier, and raw-response field before aggregate policy;
- fail-closed handling of malformed response intervals, provider error, refresh failure, expiry, revocation, disconnect, and local cryptographic deletion;
- no raw-data persistence, no automatic Kinfolk/Map/Directory/Community/Safety disclosure, no notification/reminder scheduling, and no background polling;
- aggregate-only candidate-window output, with no participant-level availability disclosure; and
- default-disabled per-provider kill switches and no route/client capability that can activate a provider without its separate approvals.

Tests must use fixtures only. They must not contact Google, Microsoft, a calendar, an OAuth client, a database, or any member account.

### 8. Closed pilot and independent authorization sequence

After a reviewed source-only implementation exists, these approvals remain separate and ordered:

1. **Contract and registry approval:** approve this Contract v1, a non-overlapping claim, source paths, threat model, and test plan.
2. **Client/configuration approval:** separately approve creating/configuring each OAuth client, redirect allowlist, consent screen, exact scopes, closed-pilot test-user list, and tenant restrictions. No public audience or broad consent configuration is implied.
3. **Member-consent/pilot approval:** separately approve specific closed-pilot members/tenant, member-facing consent copy, support/revocation handling, and provider networking. Each provider starts disabled behind an independent kill switch.
4. **Operational review:** separately approve any post-pilot change. Calendar sync, background polling, flight monitoring, reminders, workers, notifications, data export, and broader scopes are excluded from v1 and require their own contract and approval.

Contract v1 contains an explicit **no background polling** rule. Availability is read only in response to a member-initiated, active, authorized Shared Plan evaluation, and no provider call occurs while a provider kill switch is disabled or absent.

## Frozen current boundaries

Until all applicable future approvals above are complete, the following remain mandatory:

- manual private availability stays manual, encrypted, owner-scoped, and explicit-confirmation-only;
- the pure Shared Plan evaluator remains a post-normalization aggregate policy sink only;
- no Calendar OAuth/client/configuration/consent screen, scope request, token exchange/storage, callback, connection, sync, provider/network call, schema/database change, member-data transfer, remote Git operation, build, deployment, or activation is authorized;
- SP-002 and SP-003 are unchanged; and
- no claim may use this decision packet as evidence of provider readiness or pilot approval.

## Evidence and review-carrier manifest

The private evidence archive was verified before drafting:

| Item | Verified value |
| --- | --- |
| Handoff | `hnd_hlRM8c9r9qYd-6V8csRNIpSH` |
| Archive | `OAUTH001_AVAILABILITY_FIRST_READINESS_PACKET_BASE_2026-10-19.tar.gz` |
| Archive SHA-256 | `efa4d8f2e5a8ca916b27b8d8ed6deedceb06454cace75f16ff55b3486ffc4175` |
| Claim extract SHA-256 | `6ebee9d07257e1f3d7b038c538df480063a8e7758a5e64ea9533d7a031003bfa` |
| Official provider/readiness trace SHA-256 | `5f679c564b54b8ffcf175d261c2e76741b818c2be74c622c356a1692bec2caa5` |
| Manual availability policy extract SHA-256 | `075c0b4658f55935633ce7f7a7ea0d5f512d9915a470a15b2bc76d29f5e93e99` |
| Shared Plan aggregate evaluator extract SHA-256 | `3e707a6e50568024b5cb7b6900516c3d3ea6c6f7cd1a098200ec6b2565af30d2` |
| Owner-scoped manual availability route extract SHA-256 | `593f5c641aec23501281796272b37ab0f5ca9f5fdc77b84a06db08c273c78dbe` |

This is the sole OAUTH-001 output document. Its whole-file SHA-256 is reported through the private review-carrier handoff metadata after final local verification. It is intentionally uncommitted; the central coordination owner alone may incorporate it.

## References

1. Google, [Choose Google Calendar API scopes](https://developers.google.com/workspace/calendar/api/auth).
2. Google, [OAuth 2.0 best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices).
3. Google, [Configure the OAuth consent screen and choose scopes](https://developers.google.com/workspace/guides/configure-oauth-consent).
4. Microsoft, [calendar: getSchedule](https://learn.microsoft.com/en-us/graph/api/calendar-getschedule?view=graph-rest-1.0).
5. Microsoft, [Overview of Microsoft Graph permissions](https://learn.microsoft.com/en-us/graph/permissions-overview).
6. Microsoft, [Refresh tokens in the Microsoft identity platform](https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens).
