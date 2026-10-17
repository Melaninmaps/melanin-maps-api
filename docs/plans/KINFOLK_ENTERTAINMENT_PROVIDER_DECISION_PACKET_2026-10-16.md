# Kinfolk Entertainment Provider Decision Packet

**Research date:** 2026-10-16
**Decision status:** **No provider decision or activation.** This packet records current public terms for a future founder decision; no account, trial, credential, API request, contract, payment, migration, deployment, or member-facing result was created.

## Executive decision

The entertainment source candidate remains **provider-disabled for structured offers and showtimes**. Its bounded cited-web path can be used only through the already configured Kinfolk web-search adapter after an explicit title/country request (and city for showtimes or events). It returns matching source links for review, never a claimed offer or schedule.

There is **no single public, low-cost, legally cleared source** that can be selected today for both commercial streaming availability and theatrical showtimes without a further founder decision and provider-specific written terms.

- **Streaming candidate:** JustWatch is strongest on documented breadth/freshness, but public documentation requires a concluded partner contract and partner token; it publishes no commercial evaluation/sandbox terms or price. Its mandatory branded-link treatment must be designed before approval.
- **Showtime candidate:** International Showtimes publishes a **7-day free trial per market**, Basic from **€149/month per market**, and Business from **€299/month per market**. Basic omits cinema websites/geolocations, formats, and ticket links; Business includes them. Its public marketing says 120+ countries and 25,000+ cinemas, but it does **not** publish a city-by-city U.S. coverage list.
- **Lowest public commercial streaming alternative:** Watchmode’s **Startup plan is $349/month** for commercial use, 40,000 monthly credits, 50+ countries, and native deep links. Its free Developer plan is explicitly non-commercial.
- **Evaluation-only showtime alternative:** MovieGlu documents a 75-request selected-country evaluation and an unlimited development sandbox, but its evaluation terms forbid publishing the returned data to members of the public. It is not a member-facing staging substitute.
- **Do not select for Kinfolk availability:** TMDB’s terms require a separate written agreement for commercial use and specifically name AI/chatbot/query-response use as commercial.

## Provider comparison

| Provider | Capability | Public evaluation / lowest published price | Commercial or usage boundary | Attribution / product constraints | Coverage evidence and unresolved point | Decision |
|---|---|---|---|---|---|---|
| **JustWatch Content Partner API** | Streaming availability, offers, prices, provider links, countries | No published evaluation, sandbox, or price located. API access occurs after a concluded contract and partner token issuance. | Must be a contracted partner. Partner-dashboard access is for active partner accounts. | A branded **JustWatch** link beside every where-to-watch integration is mandatory and must point to the country-specific title page. | Docs state 3,900+ local provider catalogues, 500+ providers, 100+ countries, daily updates, and include `en_US`. Exact commercial price, evaluation access, caching, and permitted staging use require written confirmation. | **Best quality candidate; not approval-ready.** Request a written commercial quote and terms only after founder approval to contact/activate a provider. |
| **International Showtimes** | Theatrical showtimes, cinemas, formats, subtitles/languages, ticket links | **7-day free trial** per market; **Basic €149/month/market**; **Business €299/month/market**. Starting a trial requires a registration form and territory selection. | Public pricing is not the complete data-license agreement. Final caching, attribution, ticket-link, and public-display rights still require provider confirmation. | Business includes cinema geo/website data, formats, and ticketing links; Basic omits those fields. Never perform ticket checkout in Kinfolk. | Public site claims 120+ countries / 25,000+ cinemas and cites U.S./Canada use in a customer testimonial. Its Markets page does not enumerate U.S. cities or theaters. | **Best published showtime candidate.** The minimum plan for full near-me format/ticket-link scope appears to be Business; city coverage must be confirmed first. |
| **Watchmode** | Streaming availability, provider links, web/native deep links, title metadata | Developer: **free**, 2,500 monthly credits, up to three countries, **non-commercial**. Startup: **$349/month**, 40,000 credits, commercial, 50+ countries. | Terms permit non-image API data in the owner’s website/app, prohibit resale/sharing, and require data to remain reasonably current. The Developer plan cannot be used for a commercial product. | Developer requires attribution and has a 30-day cache/refresh ceiling. Startup removes the stated attribution requirement and includes iOS/Android deep links. Do not use third-party images without separate rights. | Public site says 200+ services / 50+ countries and country-level availability, including the U.S. | **Most transparent commercial streaming fallback.** A realistic paid streaming comparison baseline, not a free launch option. |
| **MovieGlu** | Theatrical showtimes, cinema data, deep links | 75 free requests for selected countries and unlimited development sandbox use; commercial pricing is quote-based. | Evaluation data may not be published to members of the public, may not be stored, and MovieGlu may inspect the product before release. | Deep links send users to cinemas; no seat selection or payment is supported by the API. | Public site claims 90+ countries; exact U.S. city coverage and commercial price are not published. | **Internal technical evaluation only** if later approved. Not appropriate for member-facing staging under the published evaluation terms. |
| **TMDB** | Metadata / watch-provider references | No usable public commercial price/evaluation conclusion for Kinfolk’s use case. | Commercial and AI/chatbot/query-response use require a separate written commercial agreement. | Requires TMDB attribution/logo and disclaimer if used. | Not selected for current availability/showtimes. | **Exclude from this decision.** |

## Required written confirmation before any activation

1. **JustWatch:** whether a commercial evaluation/sandbox exists; quotation; allowed locales; rate limits; caching/retention; required branded-link design; and a non-production credential policy.
2. **International Showtimes:** exact coverage for the founder-selected initial U.S. city/cities; whether the 7-day trial permits the intended non-production display; licensing/caching rules; freshness SLA; attribution; and ticket-link rules. The existing source does not identify a controlled initial U.S. city list, so city coverage cannot honestly be pre-verified from public pages.
3. **Watchmode:** paid-plan order form/terms, rate/credit estimate for the intended query volume, allowed caching, and whether source attribution will still be shown voluntarily for transparency.
4. **MovieGlu:** commercial quote, selected U.S. territories, public-display permission, retention/caching rules, and launch inspection process.

## Least-cost legally permitted paths

| Stage | Lowest apparent public-cost path | What it can safely prove | What it cannot authorize |
|---|---|---|---|
| Source/unit testing | Existing offline fixtures | Parsing, consent, filters, provider failure, payload validation, and UI behavior | Any claim about a real offer, theater, showtime, price, freshness, or geographic coverage |
| Private developer evaluation | MovieGlu sandbox or 75-request evaluation, both **$0** publicly | Adapter contract only, if separately approved | Any public/member-facing display, stored provider data, checkout, or production use |
| Limited showtime evaluation | International Showtimes 7-day trial, **€0** for one market | Provider output and a named-city coverage test, if terms allow the intended non-production display | Assumed U.S. city coverage, member release, or continuation after seven days |
| Commercial streaming availability | Watchmode Startup, **$349/month** | Commercial streaming availability in 50+ countries, including web/native deep links | Theatrical showtimes or any image right not separately cleared |
| Commercial showtime feature, full intended fields | International Showtimes Business, **€299/month per market** | Cinema geo/website data, formats, subtitles/languages, ticket links, subject to agreement | Unapproved markets, purchase flows, or data beyond contract terms |
| Premium streaming candidate | JustWatch quote required | Potential broad daily streaming availability once contracted | Any budget estimate, sandbox, or launch commitment until the provider responds in writing |

> **Budget floor if both live capabilities are selected:** published pricing supports a planning floor of **$349/month + €299/month per market**, before taxes, usage overages, or any JustWatch quote. This is **not** an authorization to purchase or an estimate of a complete contract.

## Smallest safe staging acceptance plan — after separate approval

1. Select **one named U.S. city**, one country (`US`), and six non-sensitive test titles. Do not infer a city from device, family, or saved-place data.
2. Use one **non-production, server-side credential** per approved provider; keep it out of Web/native clients and logs.
3. Run only the provider-backed `ENT-01`–`ENT-08` flows against a narrow approved test database: consent add/replace/cancel/dismiss, saved-service reload/clear, included-only filtering, country/city/title clarification, provider unavailable/error, and safe-link rejection.
4. Review every response for title match, country, city, freshness timestamp, provider attribution, safe HTTPS destination, provider error behavior, and the absence of raw-coordinate retention.
5. Confirm that `rent` and `buy` offers never appear under a member’s `included_only` policy; do not make an entitlement claim from a saved streaming-service preference.
6. Do **not** display checkout, invoke ticket purchase, activate a production key, publish a mobile build, run Device Farm, or describe the capability as accepted until later authorization and evidence.

## Source truthfulness and cited-web boundary

The source still does **not** call an entertainment provider, scrape a site, use a trial, carry a provider credential, display a structured offer, display a price, display a theater/showtime, or create a ticket link. When the already configured Kinfolk web-search capability is available, one explicit title lookup may return short-lived, title-matched HTTPS citations for the member to open. It does not convert an unstructured citation into an availability, entitlement, price, rental/purchase, theater, showtime, ticketing, provider-coverage, or provider-attribution claim.

The cited-web adapter is limited to one low-context, 10-second lookup with an 800-token output ceiling and five-minute non-member-specific result caching. No web request was executed in this source work. It must continue to fail closed—without sources or a fabricated answer—when configuration, title match, city/country prerequisites, or a provider response is unavailable.

## Sources reviewed

1. [JustWatch Content Partner: Getting Started](https://apis.justwatch.com/docs/content_partner/) — catalogue/provider/country coverage, daily updates, offer fields, branding requirement.
2. [JustWatch Content Partner API](https://apis.justwatch.com/docs/api/) — concluded-contract token requirement, API flow, locale evidence, required branded links.
3. [JustWatch Partner Dashboard Terms](https://partners.justwatch.com/legal/termsofuse) — active-account/contract-bound dashboard access; no public evaluation terms found.
4. [International Showtimes Pricing](https://www.internationalshowtimes.com/pricing) — trial, Basic/Business prices and included fields.
5. [International Showtimes API](https://www.internationalshowtimes.com/showtimes-api) and [Markets](https://www.internationalshowtimes.com/markets) — claimed coverage and absence of a city-level inventory.
6. [International Showtimes subscription page](https://www.internationalshowtimes.com/subscription) — trial requires registration and territory selection.
7. [Watchmode plans](https://api.watchmode.com/) and [terms](https://api.watchmode.com/tc) — commercial/non-commercial tiers, usage, retention, image restrictions, and accuracy caveat.
8. [MovieGlu FAQ](https://movieglu.com/contact/), [evaluation terms](https://developer.movieglu.com/company/terms-of-use/), and [pricing](https://movieglu.com/pricing/) — evaluation/sandbox limitations and quote-based commercial pricing.
9. [TMDB API Terms](https://www.themoviedb.org/api-terms-of-use) — commercial/AI-chatbot restriction and attribution terms.
10. [OpenAI web search guide](https://platform.openai.com/docs/guides/tools-web-search) — cited-search tool behavior and tool-result handling.
11. [OpenAI Services Agreement](https://openai.com/policies/services-agreement/) — general API service terms reviewed before reuse of the existing configured search capability.
