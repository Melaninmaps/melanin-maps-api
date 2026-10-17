# Kinfolk Entertainment Discovery & Availability — Source Handoff

> **Superseded for continuation purposes:** Read [the Personalization & Provider Readiness handoff](KINFOLK_ENTERTAINMENT_PERSONALIZATION_CONTINUATION_HANDOFF_2026-10-16.md) and [the single ChatGPT handoff](CHATGPT_HANDOFF_KINFOLK_ENTERTAINMENT_DISCOVERY_2026-10-16.md) for the current status, continuation commit, provider decision, and next authorization boundary.

**Status:** **SOURCE IMPLEMENTED — PROVIDER GATED**  
**Source branch:** `feature/kinfolk-regional-dialect-multilingual-foundation-20261016`  
**Source implementation commit:** `1f00d195cb12ded23a0ccded6fbb80bbc7e52ec4`  
**Starting candidate:** `7f2cc447672c40aaa82f66e38c6839b90c6d7d88`

## Delivered source behavior

Kinfolk can now distinguish ordinary entertainment/culture conversation from a request for **current** streaming availability or showtimes. It keeps cultural discussion on the existing Kinfolk path. For an explicit question such as “Where can I watch *The Woman King*?” or “Is *Moonlight* on Netflix?”, the source candidate takes a deterministic current-data path and fails closed: it says that live availability is not connected rather than inventing a service, rental option, price, cinema, or showtime.

A member statement such as “I have Netflix” or “My favorite genre is…” receives a clear consent boundary. It is **not** silently written to memory. The member can explicitly select services/country in Kinfolk Settings, or use the existing “Remember that…” private-memory flow. Streaming services and country are member-owned, private, clearable fields. They do not establish live provider availability.

| Surface | Delivered behavior |
|---|---|
| Provider boundary | A typed server-owned availability contract and authenticated readiness/availability routes. The default makes no outbound request and returns `provider_not_configured`, `location_required`, or input error states only. |
| Live-fact safety | Current availability/showtime questions are stopped before generic model chat. No static metadata, model memory, or scraper output can be presented as current availability. |
| Streaming preferences | Existing Kinfolk preferences now hold a member-selected streaming-service list and ISO country. The availability route reads them privately as request defaults. |
| Location | Streaming requires country. Showtimes require country and explicit city. There is no background location collection or coordinate persistence. |
| Web | Kinfolk Settings exposes explicit country and service controls, a clear-all action, and the unavailable-live-data disclosure. |
| Native | Kinfolk Settings links to a dedicated Entertainment screen with the same authenticated, explicit controls. |
| Memory | Existing explicit-memory consent recognizes entertainment statements saved through a direct `Remember that…` instruction; ordinary statements are not persisted. |

## Provider decision boundary

The accompanying assessment documents a **proposed** path, not a configuration:

- **Streaming:** JustWatch Content Partner API, subject to contract/token, country coverage, branding/attribution terms, and founder authorization.
- **Showtimes:** International Showtimes Cinema Showtimes API, subject to commercial terms, ticket/deep-link terms, coverage, freshness/SLA, and founder authorization.
- **Alternatives:** Watchmode, MovieGlu, and TMDB remain unactivated evaluation alternatives. TMDB is metadata-only for this decision and requires commercial licensing for commercial use.

No key, account, trial, provider call, price, purchase flow, scraping route, or provider contract was created or accepted.

## Validation evidence

| Check | Result |
|---|---|
| Database TypeScript | Passed: `pnpm --filter @workspace/db exec tsc -b tsconfig.json --force --pretty false` |
| API TypeScript | Passed: `pnpm --filter @workspace/api-server exec tsc -p tsconfig.json --noEmit --pretty false` |
| Entertainment API contracts | **7/7 passed** across service and route contract files |
| Existing voice/transcript API regression subset | **19/19 passed**; entertainment changes did not break the governed transcript paths |
| Web TypeScript and focused settings tests | Passed; **3/3** focused tests passed |
| Native TypeScript and focused settings tests | Passed with the workspace’s established `--ignoreDeprecations 6.0` compatibility override; **9/9** focused tests passed |
| Web production build | Passed. Existing source-map and bundle-size warnings only. |

## Deliberately not done

No database migration was executed. No deployment, production modification, provider activation, live streaming/showtime lookup, scrape, payment/ticketing action, mobile build, AWS Device Farm run, staging verification, device run, or member acceptance occurred.

There is intentionally **no live offer or showtime card** yet. It requires an authorized provider response carrying contractual attribution, destination link, region, and freshness data. The source candidate displays truthful unavailable states instead.

## Next authorized action

**Await a founder-approved provider decision and a controlled staging authorization.** The authorized staging scope should: configure only the selected non-production provider credential; run the additive migration on the approved test database; inspect redacted provider requests/responses; verify country/city/location gating, attribution, outbound-link safety, preference clear/reload, and provider failure states on Web/iOS/Android; then capture Device Farm and member acceptance evidence. Do not activate provider keys, execute migrations, deploy, create mobile builds, or start AWS sessions without that separate authorization.

See the [provider assessment](../plans/KINFOLK_ENTERTAINMENT_DATA_PROVIDER_ASSESSMENT_2026-10-16.md), [implementation plan](../plans/KINFOLK_ENTERTAINMENT_DISCOVERY_IMPLEMENTATION_PLAN.md), [completion checklist](../plans/KINFOLK_ENTERTAINMENT_DISCOVERY_TODO.md), and [acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md).
