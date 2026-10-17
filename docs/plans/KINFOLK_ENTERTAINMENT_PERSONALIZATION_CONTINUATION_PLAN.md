# Kinfolk Entertainment Personalization & Offline Provider Readiness Plan

## Objective

Extend the existing provider-gated Entertainment Discovery foundation without restarting it. The deliverable is a **source-only, consent-first** continuation: Kinfolk can recognize subscription additions, replacements, and cancellations; retain only member-approved preferences across conversations; apply the member’s no-extra-cost rule to offline provider-shaped data; and safely prepare provider/showtime adapters with offline fixtures.

The plan does not authorize a provider account, key, trial, request, scrape, migration, deployment, mobile build, Device Farm run, payment, ticketing action, or production change.

## Source design

The existing `user_preferences` record remains the sole structured store for entertainment subscriptions, availability country, and the new cost policy. No new memory store is added. Natural language creates a short-lived consent plan in the chat response; a separate authenticated consent endpoint applies the requested add, remove, replace, or cost-policy operation only after the member confirms it. Settings continue to provide direct review, edit, and clear controls.

Subscription identity uses a small deterministic alias map. It normalizes common names such as `HBO Max` to `Max` and `Amazon Prime` to `Prime Video`, deduplicates requests, and never treats unrecognized text as a subscription. A cancellation or replacement changes only the explicitly named service; it never deletes unrelated saved services.

The cost policy has two explicit values: `any` and `included_only`. `included_only` means that, when provider-shaped offers are available, Kinfolk may retain only offers whose monetization is subscription-included, free, or ad-supported. Rental and purchase offers are excluded. If no saved services exist, Kinfolk returns a truthful “choose subscriptions first” state instead of claiming an offer is included.

## Provider-shaped offline readiness

The adapter contract is implemented server-side with typed offers, showtimes, formats, attribution, source URL, freshness timestamp, country, city, and outbound destination validation. The default resolver continues to return `provider_not_configured` and makes no network request.

Offline fixtures model attributed streaming offers and cinema/showtime results. They are available to source tests only, not a runtime switch. The contract verifies subscription filtering, the no-extra-cost policy, URL safety, provider failure, country/city/title requirements, and no fabricated live results.

An explicit city and country are required for showtime discovery. Title-less requests such as “What Black movies are playing near me?” and “Find me a showing tonight” are treated as a live showtime discovery request, not a general question. Without an approved provider, Kinfolk returns a truthful provider-unavailable or location-needed state. It does not infer a city from “my mom’s house,” use background location, or invent local theaters.

## Conversation behavior

General questions about movies, television, actors, music, books, entertainment history, and culture retain the existing Kinfolk conversation route and persona. They neither require a streaming provider nor become shorter due to availability support.

Only explicit availability/showtime language enters the availability boundary. Direct title text is accepted. A title-less theatrical discovery question is recognized safely and will ask for the missing city/country or explain that verified showtimes are not connected. Existing sessions are not expanded with a new memory system; provider requests will eventually receive title/session context only under the existing continuity policy and later authorization.

## Cross-platform behavior

Web and native settings add an explicit no-extra-cost rule alongside the existing service/country controls. Chat responses expose a structured consent plan for Web/native renderers. Source tests cover the data contract and navigation; Device Farm validation is prepared in the acceptance matrix but not started.

## Provider recommendation research

The decision packet will recommend **JustWatch Content Partner API** for streaming availability and **International Showtimes** for cinema/showtime discovery, subject to founder approval and commercial terms. JustWatch documents daily VOD updates, provider/offering distinctions, 100+ country coverage, contractual token issuance, and branded JustWatch linking. International Showtimes publicly lists a 7-day free trial and starts at €149/month/market for Basic and €299/month/market for a business/discovery tier; contract terms, coverage, freshness, attribution, and ticket-link rights still require review.

Watchmode is a lower-friction streaming alternative but its free tier is non-commercial and limited to 2,500 credits/month and three countries. Its listed commercial tier begins at $349/month. TMDB is not recommended for this Kinfolk capability because its terms restrict use in AI/chatbot products absent a commercial written agreement. MovieGlu is a showtime alternative with 90+ country claims but request-quote pricing.

## Completion boundary

Source completion means consent-controlled subscription personalization, offline fixture validation, provider-shaped contracts, country/city/title gating, safe outbound-link validation, Web/native source controls, tests, a decision packet, and matrix/handoff updates are complete. It does **not** mean that current availability, showtimes, prices, ticketing, coverage, or device behavior are live or verified.
