# Kinfolk Entertainment Discovery — Data Provider Assessment

**Assessment date:** 2026-10-16  
**Scope:** source-only selection and integration boundary. No provider account, key, contract, paid API, scrape, live request, deployment, or migration was activated.

## Decision summary

Kinfolk needs two distinct data classes. They must not be conflated:

1. **Streaming availability** — current subscription, rental, purchase, and outbound watch links by title and member-selected country.
2. **Theatrical availability** — current cinema/showtimes, date, proximity, and outbound ticketing links.

The preferred production path is:

| Need | Proposed provider | Why | Activation state |
|---|---|---|---|
| Streaming availability | **JustWatch Content Partner API** | It exposes title offers, upcoming/theatrical release information, country locales, and returns canonical JustWatch paths. Its documented partner contract, token, branding, and attribution model are appropriate for a commercial member experience. | **Not contracted or configured** |
| Cinema/showtimes | **International Showtimes Cinema Showtimes API** | It documents cinema/showtime metadata, deep booking links, daily freshness controls, 25,000+ cinemas, and coverage in 120+ markets. | **Not contracted or configured** |
| Optional lower-volume streaming alternative | **Watchmode** | It advertises a 2,500-request/month free plan across up to three selected countries and streaming-service links; its own documentation cautions that availability can be outdated or inaccurate. | **Not activated** |
| Title metadata only, if commercially licensed | **TMDB** | It can support title identity, not the authoritative live availability or showtime decision. TMDB says commercial projects require a commercial license and it provides no SLA. | **Not licensed or configured** |

## Licensing, coverage, and display constraints

### JustWatch Content Partner API

- A contract is required before use, after which the partner receives a unique token.
- API responses include a country-specific JustWatch path. JustWatch requires branded links beside every “where to watch” presentation.
- It documents offers and release information, including theatrical releases, across many locales; exact title/provider availability remains region- and contract-dependent.
- It is the preferred streaming source because it supports the required provenance and outbound-link treatment.

Source: [JustWatch Content Partner API documentation](https://apis.justwatch.com/docs/api/).

### International Showtimes

- Documents cinema and showtime metadata, deep booking links, cinema/movie matching, and API/data-feed delivery.
- Claims coverage in 120+ countries and 25,000+ cinema locations, with details subject to provider confirmation and contract terms.
- Pricing is commercially negotiated; a trial/contact route exists, but **no trial or account has been started**.

Source: [International Showtimes Cinema Showtimes API](https://www.internationalshowtimes.com/showtimes-api).

### Watchmode

- Its public request page advertises 2,500 monthly requests and up to three countries on a free plan.
- It provides availability metadata and outbound service links, but explicitly notes that data can sometimes be outdated or inaccurate.
- It is not selected as an unqualified production source for broad global availability. It may be evaluated only in a separately approved, bounded provider comparison.

Source: [Watchmode API key request](https://api.watchmode.com/requestApiKey).

### MovieGlu and TMDB

- MovieGlu documents cinemas, geo-based showtimes, and ticket/deep-link endpoints, but coverage, commercial terms, and country suitability need a separate procurement review. It remains a **fallback candidate**, not a configured integration.
- TMDB’s developer API is free only for non-commercial use with attribution. Commercial use requires contacting sales, and TMDB states it provides no SLA. It must not be treated as the live availability or showtime authority.

Sources: [MovieGlu API documentation](https://developer.movieglu.com/), [TMDB API FAQ](https://developer.themoviedb.org/docs/faq).

## Source design decision

The source foundation will expose a **server-owned provider interface** with a disabled default and deterministic `provider_not_configured` result. It will:

- make **no outbound provider request** until a future authorized configuration supplies the selected provider and a secret token;
- require an explicit member-selected country for streaming availability and explicit location/city permission or manual city for showtimes;
- keep all provider tokens server-side;
- preserve provider attribution/deep-link requirements in returned data;
- return a truthful unavailable state rather than guessed service, rental, purchase, theatre, price, or showtime data;
- keep the purchase path external—Kinfolk only links out and never sells tickets or subscriptions.

## Explicit non-decisions

- No paid, trial, or free provider account/key was created.
- No web scraping of streaming, theatre, ticketing, or search-result pages is permitted for this feature.
- No provider contract, pricing, country coverage, SLA, or freshness claim is represented as approved until the founder separately authorizes it.
- No current showtime or availability claim is made from model memory, static metadata, or a member’s past conversation.
