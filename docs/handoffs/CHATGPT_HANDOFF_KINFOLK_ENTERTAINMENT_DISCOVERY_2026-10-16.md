# ChatGPT Handoff — Kinfolk Entertainment Discovery & Availability

## Purpose

Use this document as the single context package when continuing or reviewing the **Kinfolk Entertainment Discovery & Availability** feature in ChatGPT. It records what is implemented, what is deliberately inactive, the exact source commits, verification evidence, and the only safe next stage.

## Source identity

| Item | Value |
|---|---|
| Repository | `Melaninmaps/melanin-maps-api` |
| Branch | `feature/kinfolk-regional-dialect-multilingual-foundation-20261016` |
| Source implementation commit | `1f00d195cb12ded23a0ccded6fbb80bbc7e52ec4` |
| Published handoff commit | `b13ae386a7af385926587483f681dd1311ac507f` |
| Status | **SOURCE IMPLEMENTED — PROVIDER GATED** |

## Product requirement

Kinfolk should understand and naturally discuss entertainment and culture—including movies, television, music, books, sports, and related cultural topics—without treating an ordinary discussion as a request for live data.

When a member explicitly asks for **current** availability, such as “Where can I watch *The Woman King*?” or “Is *Moonlight* on Netflix?”, Kinfolk must rely only on a separately approved, attributed availability provider. It must never invent a streaming service, rental option, price, cinema, ticket link, or showtime.

When a member says they subscribe to a service or names a favorite entertainment preference, Kinfolk must ask for or receive clear consent before retaining it. The preference must be private, editable, and deletable.

## Implemented source behavior

| Area | Implemented behavior |
|---|---|
| Conversation boundary | An explicit current streaming/showtime question is detected before generic model chat. General cultural conversation remains on the existing Kinfolk route. |
| Truthful unavailable state | Until a provider is separately configured, the deterministic response says that live availability is not connected. It returns no offers or showtimes. |
| Provider-gated API | Authenticated routes exist for entertainment readiness and availability. The source candidate makes **no outbound provider request**. |
| Streaming preferences | Members can explicitly save, change, and clear streaming services and a two-letter availability country in existing Kinfolk preferences. |
| Consent | “I have Netflix” or a favorite statement produces a consent boundary; ordinary chat is not silently persisted. A member may explicitly choose Settings or use the existing `Remember that…` private-memory flow. |
| Privacy | There is no background location collection. Streaming requires a country; showtimes require country and explicit city. Saved services/country are private defaults, not live availability evidence. |
| Web | Kinfolk Settings contains service chips, country selection, a clear action, and an explicit disclosure that live data is unavailable. |
| Native | Kinfolk Settings links to a dedicated Entertainment screen with equivalent authenticated controls. |

## Provider decision status

No provider has been enabled, configured, called, paid for, or contractually accepted.

| Purpose | Proposed provider | Status |
|---|---|---|
| Streaming availability | JustWatch Content Partner API | Evaluation only; requires contract/token, country coverage review, attribution/branding confirmation, and approval. |
| Cinema/showtimes | International Showtimes Cinema Showtimes API | Evaluation only; requires commercial terms, coverage/freshness review, outbound-link/ticket terms, and approval. |
| Alternatives | Watchmode, MovieGlu, TMDB | Evaluation only. TMDB is metadata-only for this product decision and requires commercial licensing for commercial use. |

## Important non-claims

Do **not** say that Kinfolk currently has live streaming availability, rental/purchase data, showtimes, theater locations, prices, ticketing, geographic coverage, or a configured provider. It does not.

Do **not** say that an ordinary entertainment statement has been saved. It has not, unless the member explicitly selects a setting or uses the direct private-memory instruction.

## Validation completed

| Validation | Result |
|---|---|
| Database TypeScript | Passed |
| API TypeScript | Passed |
| New entertainment API tests | **7/7 passed** |
| Existing transcript/voice API subset | **19/19 passed** |
| Web TypeScript and focused settings tests | Passed; **3/3** focused tests passed |
| Native TypeScript and focused settings tests | Passed using the existing TypeScript 6 compatibility override; **9/9** focused tests passed |
| Production Web build | Passed; only existing source-map and bundle-size warnings |

## Explicitly not performed

- No database migration was run.
- No deployment, staging activation, or production modification occurred.
- No provider account, key, trial, payment, or live API request was created.
- No scraping was introduced.
- No mobile build, AWS Device Farm session, device validation, or member acceptance occurred.
- No checkout, ticket purchase, or outbound purchase action was introduced.

## Required next authorization

The next step requires a founder-approved provider decision and a separately authorized, bounded **non-production staging** scope. That scope should:

1. Select and authorize only one approved provider path.
2. Configure the credential only in non-production.
3. Run the reviewed additive migration on an approved test database.
4. Inspect redacted provider requests/responses for title, country/city, attribution, freshness, and failure behavior.
5. Verify no background location, no invented offers, preference save/reload/clear, and safe outbound-link handling.
6. Capture controlled Web, iOS, and Android evidence before any release decision.

Do not activate a provider, run migrations, deploy, create mobile builds, or start AWS sessions without separate authorization.

## Related source documents

- [Full source handoff](KINFOLK_ENTERTAINMENT_DISCOVERY_SOURCE_HANDOFF_2026-10-16.md)
- [Provider assessment](../plans/KINFOLK_ENTERTAINMENT_DATA_PROVIDER_ASSESSMENT_2026-10-16.md)
- [Implementation plan](../plans/KINFOLK_ENTERTAINMENT_DISCOVERY_IMPLEMENTATION_PLAN.md)
- [Completion checklist](../plans/KINFOLK_ENTERTAINMENT_DISCOVERY_TODO.md)
- [Release acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md)
