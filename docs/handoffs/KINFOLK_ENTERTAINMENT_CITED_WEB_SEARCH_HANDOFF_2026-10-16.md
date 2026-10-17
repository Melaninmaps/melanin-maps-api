# Kinfolk Entertainment — Cited Web Search Source Handoff

**Status:** **SOURCE COMPLETE / AWAITING CONTROLLED INTEGRATION AND STAGING ACCEPTANCE**
**Repository:** `Melaninmaps/melanin-maps-api`
**Branch:** `feature/kinfolk-entertainment-web-search-first-20261016`
**Source commit:** `7c4dacf7196b5a4998740cccdad9915738b2f645` (`feat: add cited entertainment web search`)

## Purpose

This additive source change lets Kinfolk handle an **explicit current** question such as:

- “Where can I watch *The Woman King* in the US?”
- “What are the showtimes for *[movie]* in Atlanta?”
- “Where can I see *[named event]* in Philadelphia?”

It reuses the existing, configuration-gated Kinfolk cited-web adapter. It is **not** an entertainment data-provider integration and does not authorize an account, trial, API key, payment, deployment, migration, mobile build, or member-facing provider result.

## Implemented behavior

| Area | Source behavior |
|---|---|
| Entry criteria | The request must be explicitly current, have a specific title and country, and include a city for showtimes or named events. “This movie” and other generic references return `title_required`; prior conversation context is not used to fill the title. |
| Search execution | One query only, through `searchCurrentEntertainmentQueriesWithState`. It uses a low search context, 10-second timeout, 800-token output ceiling, and a five-minute non-member-specific cache. |
| Search evidence | The response returns only deduplicated, title-matched, safe HTTPS citations from the existing adapter. The `sourceStatus` reports attempted/state/provider/fallback/partial/cache flags and declares `cited_web_sources_only`. |
| Member preferences | Existing country, selected streaming services, and `included_only` policy shape the query only after the member has explicitly saved them. A saved service is not treated as an entitlement. |
| Chat and endpoint | The authenticated `POST /api/kinfolk/entertainment/availability` route and the Kinfolk chat availability branch both use the cited-source resolver. Existing Web and native source-link components render the citations. |
| Member copy | Web and native entertainment settings disclose that an explicit current question may return cited sources, while Kinfolk cannot claim a service, price, theater, or ticket result without an approved provider. |

## Truth boundary

> A cited web link is a **source for the member to review**, not verified entertainment availability.

The source intentionally does **not** parse, infer, or claim:

- streaming availability, subscription entitlement, rental/purchase availability, or price;
- a theater, showtime, schedule, event date, ticket link, or checkout path;
- provider identity, provider coverage, freshness SLA, or attribution for a structured entertainment result.

If a title does not match a cited result, the configured search is absent, or the source fails, Kinfolk returns a truthful unavailable state with no fabricated suggestion. Structured offers, showtimes, dates, prices, and provider attribution remain reserved for a separately approved and contract-compliant provider integration.

## Privacy, cost, and reliability controls

- No background checks, polling, notifications, or proactive provider calls were added.
- No new provider is configured. The code only calls the pre-existing cited-web adapter when the member explicitly asks a qualifying current question.
- Development and tests used injected/offline search results; **no live web/provider request was made during this work**.
- The query is limited to the requested title, requested country/city, and—only for the member-selected included-only policy—saved service names. There is no raw-conversation history lookup or retention for this feature.
- The short cache reduces duplicate queries while avoiding persistent member-specific search history.

## Validation evidence

| Validation | Result |
|---|---|
| Database declaration build | Passed |
| API TypeScript | Passed |
| API entertainment regression suite | **25/25 passed** across 5 files, including citation-only, cache, title-match, generic-title, event, and no-query-before-prerequisite coverage |
| Web TypeScript and entertainment tests | Passed; **4/4 tests** across 2 files |
| Native TypeScript and entertainment tests | Passed with the existing `--ignoreDeprecations 6.0` compatibility override; **4/4 tests** across 2 files |
| Web production build | Passed; existing source-map and bundle-size warnings only |
| Source integrity | `git diff --check` passed before commit |

## Integration instruction

1. Start from the **then-current authoritative Kinfolk candidate**; do not assume this branch is already incorporated.
2. Apply commit `7c4dacf7196b5a4998740cccdad9915738b2f645` as one additive unit, resolving only genuine overlap in `routes/kinfolk.ts`, `web-search.ts`, and the entertainment documentation/matrix.
3. Preserve the existing provider-disabled fixture behavior, consent flow, and any newer Kinfolk safety fixes.
4. Re-run the API, Web, and native focused entertainment suites after the controlled merge.
5. Keep all structured provider capabilities disabled pending a separate founder/provider decision. No staging query is needed to integrate this source commit.

## Related records

- [Single ChatGPT continuation handoff](CHATGPT_HANDOFF_KINFOLK_ENTERTAINMENT_DISCOVERY_2026-10-16.md)
- [Provider decision packet](../plans/KINFOLK_ENTERTAINMENT_PROVIDER_DECISION_PACKET_2026-10-16.md)
- [Entertainment implementation checklist](../plans/KINFOLK_ENTERTAINMENT_DISCOVERY_TODO.md)
- [Combined release acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md)
