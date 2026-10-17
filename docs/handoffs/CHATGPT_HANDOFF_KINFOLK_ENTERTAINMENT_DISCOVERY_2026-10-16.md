# ChatGPT Handoff — Kinfolk Entertainment Discovery & Availability

## Use this as the single continuation context

This is the authoritative handoff for the **Kinfolk Entertainment Discovery, subscription personalization, and provider-readiness** workstream. Do not restart the feature, build a duplicate preference store, connect a provider, run a migration, deploy, create a mobile build, start AWS Device Farm, or make a production change unless a new authorization explicitly permits it.

## Source identity

| Item | Value |
|---|---|
| Repository | `Melaninmaps/melanin-maps-api` |
| Branch | `feature/kinfolk-regional-dialect-multilingual-foundation-20261016` |
| Original availability foundation | `1f00d195cb12ded23a0ccded6fbb80bbc7e52ec4` |
| Personalization continuation | `77beb13794a1d77f14f5d0ae122f1d82fbee3236` |
| Status | **SOURCE COMPLETE / AWAITING PROVIDER APPROVAL AND STAGING ACCEPTANCE** |

## What is source complete

1. **Normal Kinfolk entertainment conversation is preserved.** Movies, television, actors, music, books, entertainment history, and cultural conversation remain on the existing Kinfolk route, persona, research, and citation behavior. They never require a streaming or showtime provider.
2. **Current availability is safely gated.** Only explicit current availability, showtime, or named-event requests enter the bounded availability path. Title and country are required; city is also required for showtimes/events. A generic reference such as “this movie” stays in the title-required state. With the existing configured cited-web adapter, Kinfolk can return one short-lived list of title-matched source links; without it, it returns a truthful unavailable result. In neither case does it invent or claim a service, offer, entitlement, rental, purchase, price, theater, showtime, ticket link, geographic coverage, or provider result.
3. **Subscription changes are consent-first.** “I have Netflix,” “I switched from Hulu to Max,” “I cancelled Peacock,” and an explicit no-extra-cost request produce a specific confirm/dismiss card. Chat text alone does not write a preference.
4. **No duplicate memory store was created.** Confirmed choices use the existing `user_preferences` record. Settings and chat both support review/edit/clear behavior. The preferences are private and do not change membership pricing, billing, or subscription entitlements.
5. **No-extra-cost behavior exists in source.** The `included_only` preference filters provider-shaped fixture data to subscription-included, free, or ad-supported options from saved services; rental/purchase options are excluded. The cited-web query can be shaped by saved services but never treats them as an entitlement or claims a real included offer.
6. **Showtime questions are bounded.** Title-less prompts such as “What Black movies are playing near me?” are recognized. Kinfolk requests a country/city/title as required, does not infer “my mom’s house,” and does not retain raw device coordinates.
7. **Offline provider fixtures exist only for tests.** Typed fixture data includes offers, showtimes, attribution, freshness, formats, destination validation, and provider failure. There is no runtime fixture switch and no outbound provider call.
8. **Web and native source paths exist.** Web and native settings include service/country/no-extra-cost controls and disclose the cited-web boundary. Existing Web/native source-link components render returned citations; chat still renders a confirmation card before persisting a natural-language subscription change.

## Validation at source commit `77beb13794a1d77f14f5d0ae122f1d82fbee3236`

| Validation | Result |
|---|---|
| Database, API, Web TypeScript | Passed |
| Native TypeScript | Passed with existing `--ignoreDeprecations 6.0` compatibility override |
| API focused tests | **17/17 passed** across 4 files |
| Web focused tests | **4/4 passed** across 2 files |
| Native focused tests | **4/4 passed** across 2 files |
| Web production build | Passed; existing source-map and bundle-size warnings only |

## Provider decision — public-term research completed

No provider was enabled, configured, called, paid for, trialed, or contractually accepted.

| Need | Recommendation | Why | Approval requirement |
|---|---|---|---|
| Streaming availability | **JustWatch Content Partner API** | Strongest documented coverage/freshness candidate, but its token is issued after a concluded partner contract. No public commercial evaluation, sandbox, or price was found. It requires a branded JustWatch link next to each where-to-watch integration. | Written quote, contract, permitted locales, cache/retention terms, attribution design, and test credential. |
| Theater/showtimes | **International Showtimes** | Published 7-day free trial, Basic from €149/month/market, Business from €299/month/market. Business adds the cinema geo/website data, formats, and ticket links missing from Basic. Public pages do not prove city-level U.S. coverage. | Written city-coverage, staging-display, caching, attribution, ticket-link, and credential terms. |
| Streaming fallback | Watchmode | Free Developer plan is explicitly non-commercial. Startup is $349/month for commercial use, 40,000 credits, 50+ countries, and native deep links. | Commercial plan/key, retention/rate estimate, and terms approval. |
| Evaluation-only showtime fallback | MovieGlu | 75 selected-country evaluation requests and unlimited development sandbox are advertised, but the evaluation terms prohibit publishing provider data to members of the public. | Separate written commercial terms before any member-facing staging. |
| Do not select by default | TMDB | Its terms require a separate written commercial agreement for AI/chatbot use. | Separate legal/commercial decision. |

Read the [provider decision packet](../plans/KINFOLK_ENTERTAINMENT_PROVIDER_DECISION_PACKET_2026-10-16.md) before recommending a provider. The current public-term comparison does **not** authorize a sales contact, account, trial, key, contract, or payment.

## Must not be claimed

Do **not** say that Kinfolk currently has structured live streaming availability, rentals/purchases, prices, showtimes, theaters, ticket links, coverage, a configured entertainment provider, device acceptance, or member acceptance. It does not. Cited web links are only source links for the member to review, not availability proof.

Do **not** say a plain entertainment statement is saved. It is saved only after the member confirms a dedicated consent card or explicitly changes Settings.

## Next authorized action

The workstream is source complete and awaits **controlled integration**, then **founder provider approval** and a **bounded non-production staging authorization**. The smallest approval should name one provider, one country, one U.S. city confirmed by that provider, six test titles, and a non-production credential. Only then: run the additive migration on an approved test database, inspect redacted provider requests/responses for title/country/city/attribution/freshness/link safety, and execute `ENT-01`–`ENT-08`. No ticket checkout.

## Related documents

- [Continuation source handoff](KINFOLK_ENTERTAINMENT_PERSONALIZATION_CONTINUATION_HANDOFF_2026-10-16.md)
- [Provider decision packet](../plans/KINFOLK_ENTERTAINMENT_PROVIDER_DECISION_PACKET_2026-10-16.md)
- [Continuation implementation plan](../plans/KINFOLK_ENTERTAINMENT_PERSONALIZATION_CONTINUATION_PLAN.md)
- [Completion checklist](../plans/KINFOLK_ENTERTAINMENT_DISCOVERY_TODO.md)
- [Release acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md)
- [Cumulative integration inventory](../../replit/combined-release/KINFOLK_CUMULATIVE_INTEGRATION_INVENTORY_2026-10-16.md)
