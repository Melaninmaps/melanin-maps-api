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
2. **Live availability is safely gated.** Only explicit current-availability/showtime requests enter the deterministic availability path. Without an approved provider, Kinfolk returns a truthful unavailable result and never invents services, rentals, purchases, prices, theaters, showtimes, ticket links, or geographic coverage.
3. **Subscription changes are consent-first.** “I have Netflix,” “I switched from Hulu to Max,” “I cancelled Peacock,” and an explicit no-extra-cost request produce a specific confirm/dismiss card. Chat text alone does not write a preference.
4. **No duplicate memory store was created.** Confirmed choices use the existing `user_preferences` record. Settings and chat both support review/edit/clear behavior. The preferences are private and do not change membership pricing, billing, or subscription entitlements.
5. **No-extra-cost behavior exists in source.** The `included_only` preference filters provider-shaped fixture data to subscription-included, free, or ad-supported options from saved services; rental/purchase options are excluded. It never claims a real offer without a provider.
6. **Showtime questions are bounded.** Title-less prompts such as “What Black movies are playing near me?” are recognized. Kinfolk requests a country/city/title as required, does not infer “my mom’s house,” and does not retain raw device coordinates.
7. **Offline provider fixtures exist only for tests.** Typed fixture data includes offers, showtimes, attribution, freshness, formats, destination validation, and provider failure. There is no runtime fixture switch and no outbound provider call.
8. **Web and native source paths exist.** Web and native settings include service/country/no-extra-cost controls; Web and native chats render a confirmation card before persisting a natural-language subscription change.

## Validation at source commit `77beb13794a1d77f14f5d0ae122f1d82fbee3236`

| Validation | Result |
|---|---|
| Database, API, Web TypeScript | Passed |
| Native TypeScript | Passed with existing `--ignoreDeprecations 6.0` compatibility override |
| API focused tests | **17/17 passed** across 4 files |
| Web focused tests | **4/4 passed** across 2 files |
| Native focused tests | **4/4 passed** across 2 files |
| Web production build | Passed; existing source-map and bundle-size warnings only |

## Provider decision

No provider was enabled, configured, called, paid for, trialed, or contractually accepted.

| Need | Recommendation | Why | Approval requirement |
|---|---|---|---|
| Streaming availability | **JustWatch Content Partner API** | Public documentation describes daily VOD updates, 500+ providers, 100+ countries, provider offers, and direct provider URLs. It requires a partner agreement/token and branded JustWatch link. Public price is not posted. | Written commercial/attribution approval, token, approved markets, non-production credential. |
| Theater/showtimes | **International Showtimes** | Public page lists cinema metadata, published showtimes, formats, subtitles/languages, ticket links, 7-day trial, €149/month/market Basic and €299/month/market Business. | Written terms, coverage/freshness/ticket-link/caching verification, non-production credential. |
| Streaming fallback | Watchmode | Listed commercial Startup: $349/month; free tier is non-commercial and restricted. | Commercial plan/key and terms approval. |
| Do not select by default | TMDB | Its terms require commercial written approval for AI/chatbot use. | Separate legal/commercial decision. |

Read the [provider decision packet](../plans/KINFOLK_ENTERTAINMENT_PROVIDER_DECISION_PACKET_2026-10-16.md) before recommending a provider.

## Must not be claimed

Do **not** say that Kinfolk currently has live streaming availability, rentals/purchases, prices, showtimes, theaters, ticket links, coverage, a configured provider, device acceptance, or member acceptance. It does not.

Do **not** say a plain entertainment statement is saved. It is saved only after the member confirms a dedicated consent card or explicitly changes Settings.

## Next authorized action

The workstream is blocked only on **founder provider approval** and a **bounded non-production staging authorization**. When approved: configure only one non-production credential, run the additive migration on an approved test database, inspect redacted provider requests/responses for title/country/city/attribution/freshness/link safety, and execute `ENT-01`–`ENT-08` in the acceptance matrix across Web/iOS/Android. No ticket checkout.

## Related documents

- [Continuation source handoff](KINFOLK_ENTERTAINMENT_PERSONALIZATION_CONTINUATION_HANDOFF_2026-10-16.md)
- [Provider decision packet](../plans/KINFOLK_ENTERTAINMENT_PROVIDER_DECISION_PACKET_2026-10-16.md)
- [Continuation implementation plan](../plans/KINFOLK_ENTERTAINMENT_PERSONALIZATION_CONTINUATION_PLAN.md)
- [Completion checklist](../plans/KINFOLK_ENTERTAINMENT_DISCOVERY_TODO.md)
- [Release acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md)
