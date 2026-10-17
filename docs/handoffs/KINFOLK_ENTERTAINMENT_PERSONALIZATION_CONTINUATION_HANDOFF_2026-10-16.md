# Kinfolk Entertainment Personalization & Provider Readiness — Source Handoff

> **Superseded for continuation purposes:** The current factual status and no-additional-subscription decision are in the [verified cited-availability handoff](KINFOLK_ENTERTAINMENT_VERIFIED_CITED_AVAILABILITY_HANDOFF_2026-10-16.md).

**Historical status:** **SOURCE COMPLETE / AWAITING STAGING ACCEPTANCE**
**Preserved feature branch:** `feature/kinfolk-entertainment-web-search-first-20261016`
**Continuation source commit:** `77beb13794a1d77f14f5d0ae122f1d82fbee3236`
**Earlier availability foundation:** `1f00d195cb12ded23a0ccded6fbb80bbc7e52ec4`

## Delivered continuation

The continuation preserves the existing Entertainment Discovery feature and adds a consent-first subscription lifecycle. A statement such as “I have Netflix,” “I switched from Hulu to Max,” “I cancelled Peacock,” or “Only recommend movies I can watch without paying extra” produces a specific plan in chat. Nothing is saved until the member confirms the exact action. A confirmed action uses the existing `user_preferences` record; there is no new memory store.

The settings surfaces now let a member review, change, or clear saved streaming services, availability country, and an `included_only` cost policy. With provider-shaped data, `included_only` accepts only subscription-included, free, or ad-supported offers from saved services and excludes rent/buy. Without saved services or an approved provider, the result is a truthful explanation—not a made-up offer.

Current-data parsing now recognizes title-less theater discovery questions such as “What Black movies are playing near me?” and “Find me a showing tonight.” It asks for missing country/city/title as applicable. It does not infer a location from “my mom’s house,” retain device coordinates, invent a theater, or create a ticket link.

## Safety and integrity boundary

| Boundary | Source behavior |
|---|---|
| Ordinary entertainment/culture discussion | Remains on the existing Kinfolk route and persona; no provider is required. |
| Natural subscription language | Produces a reviewable consent plan; no persistence before confirmation. |
| Preference storage | Uses the existing member preference record, is private, editable, and clearable. No subscription entitlement, membership pricing, or billing state is changed. |
| Live data | Default provider resolver makes no network request and returns `provider_not_configured`. |
| Offline fixtures | Test-only streaming offers/showtimes model attribution, freshness, formats, destination links, and provider errors. They are not exposed through a runtime flag. |
| Links | Only validated HTTPS links without credentials, localhost, or `.local` hosts survive the adapter contract. |
| Location | Showtimes require explicit country/city/title; no background location or raw-coordinate persistence was added. |

## Provider decision recommendation

| Capability | Recommended provider | Decision | Cost/terms observed | Approval still required |
|---|---|---|---|---|
| Streaming availability | JustWatch Content Partner API | Preferred | Public documentation describes daily VOD updates, 500+ providers, 100+ countries, contractual partner tokens, and required branded JustWatch links; public price not posted. | Written commercial agreement, token, approved markets/locales, attribution treatment, test credential. |
| Cinema/showtimes | International Showtimes | Preferred | Public pricing lists a 7-day trial; Basic from €149/month/market and Business from €299/month/market. | Founder approval, commercial terms, market coverage/freshness, ticket-link/caching rights, test credential. |
| Streaming fallback | Watchmode | Alternative | Free tier is non-commercial (2,500 credits/month, three countries); listed commercial Startup is $349/month. | Commercial plan/key and attribution/caching review. |
| Showtime fallback | MovieGlu | Alternative | Quote-based pricing; claims coverage in 90+ countries. | Written quote/terms and test credential. |
| Not recommended | TMDB | Do not use for Kinfolk live availability | Its terms require a commercial written agreement for commercial and AI/chatbot use. | Separate legal/commercial decision, not part of this feature. |

See [the complete provider decision packet](../plans/KINFOLK_ENTERTAINMENT_PROVIDER_DECISION_PACKET_2026-10-16.md) for sources and evaluation detail.

## Validation evidence

| Validation | Result |
|---|---|
| Database TypeScript | Passed |
| API TypeScript | Passed |
| Web TypeScript | Passed |
| Native TypeScript | Passed with the established `--ignoreDeprecations 6.0` compatibility override |
| API focused regressions | **17/17 passed** across 4 files |
| Web focused regressions | **4/4 passed** across 2 files |
| Native focused regressions | **4/4 passed** across 2 files |
| Web production build | Passed; existing source-map and bundle-size warnings only |

## Device Farm and staging-ready acceptance cases

The acceptance matrix now includes `ENT-01` through `ENT-08`. Before release, stage the following only after separate authorization: natural add/replace/cancel confirmation; dismiss with no write; saved-service reload/clear; no-extra-cost filtering; explicit streaming country; title-less showtime city/title clarification; provider unavailable/error; unsafe destination rejection; attributed provider response; Web/iOS/Android parity; and no checkout/ticket purchase.

## Not performed

No database migration, provider contract, trial, account, credential, API call, provider payment, deployment, staging activation, production write, mobile build, Device Farm session, device test, member acceptance, ticket checkout, or purchase action occurred.

## Remaining blockers and next authorized action

1. **Founder provider decision:** approve JustWatch + International Showtimes or an alternative after commercial/attribution review.
2. **Bounded non-production authorization:** configure only approved test credentials, run the additive migration against an approved test database, and inspect redacted responses for accuracy/freshness/attribution/link safety.
3. **Staging/device acceptance:** execute `ENT-01`–`ENT-08` on Web/iOS/Android, including a recorded device run, without checkout.

Until those approvals occur, Kinfolk must continue to disclose that structured live availability and showtimes are not connected. A separately bounded cited-web path may show title-matched source links after an explicit request, but it must not label them as an offer, service, price, theater, showtime, ticket link, or provider result.
