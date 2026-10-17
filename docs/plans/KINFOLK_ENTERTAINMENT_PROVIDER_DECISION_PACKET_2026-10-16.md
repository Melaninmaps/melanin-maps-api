# Kinfolk Entertainment Provider Decision Packet

**Decision status:** recommendation only. No provider was selected, contracted, configured, called, or paid for.

## Recommendation

Use **JustWatch Content Partner API** as the preferred streaming-availability source and **International Showtimes** as the preferred cinema/showtime source. Use two providers. Neither public offering documents a reliable single-source answer for both streaming availability and global theater showtimes.

JustWatch is the stronger primary streaming candidate because its content-partner documentation describes VOD availability for up to 250,000 films and 60,000 TV shows, more than 500 providers in more than 100 countries, daily availability updates, provider offer categories including `flatrate`, `rent`, `buy`, `ads`, and `free`, direct provider destination URLs, and active-country information. Its formal partner API requires a concluded contract and a partner token. It also requires branded JustWatch linking alongside every where-to-watch integration. Public documentation does not publish a price, so a commercial quote is required before approval. [1] [2]

International Showtimes is the preferred showtime candidate because its public pricing page lists cinema metadata, published showtimes, language/subtitle data, formats, and ticket links. It offers a 7-day free trial, but this task must not start it. Its published Basic tier starts at €149 per month per market and Business at €299 per month per market; the page positions Business for startup, discovery, and ticketing platforms. Before any selection, verify the exact countries, freshness, ticket-link conditions, permitted caching, attribution, and production support terms in a written agreement. [3]

Watchmode is the lower-friction streaming fallback. Its public site states it covers streaming sources in more than 50 countries, differentiates subscription/rental/purchase/free sources, and has daily updates. Its free Developer tier has 2,500 monthly credits but is non-commercial and restricted to three countries. Its listed commercial Startup tier begins at $349/month for 40,000 credits and 50+ country sources. Its terms require compliance with the applicable plan, may require attribution, and acknowledge that availability can be incomplete or inaccurate. Use it only if JustWatch commercial terms are unsuitable and only after commercial approval. [4] [5]

MovieGlu is a showtime fallback with claimed coverage in more than 90 countries and quote-based pricing. It is suitable for a later commercial comparison but does not provide publicly posted comparable pricing. [6]

TMDB is not recommended for Kinfolk’s availability/chat capability. TMDB’s terms require a separate written agreement for commercial use and specifically identify use in an AI/chatbot or interactive query-response system as commercial. [7]

## Credentials and permissions required after approval

| Provider | Minimum requirement |
|---|---|
| JustWatch | Executed partner agreement, partner token, confirmed approved locales/markets, approved attribution/link treatment, and non-production credential. |
| International Showtimes | Commercial account or authorized test access, scoped market entitlement, API credential, confirmation of ticket-link and caching terms, and non-production credential. |
| Watchmode fallback | Commercial Startup-or-higher account/key for commercial use, approved attribution/link treatment if applicable, and non-production credential. |

## Minimum non-production validation

Use a narrow test database and one approved non-production credential per provider. Verify a small set of fixtures against live responses only after authorization: one subscription-included title, one rent/buy-only title, one no-result title, one current theatrical title, one expired showtime, one city with multiple cinemas, and one city with no coverage. Confirm country/city gates, freshness timestamp, provider attribution, safe HTTPS destination links, included-only filtering, error fallback, no raw-coordinate storage, and Web/iOS/Android rendering. Do not perform checkout or ticket purchase.

## Limited mode before approval

Yes. Kinfolk can safely operate in its current limited mode: discuss culture and entertainment normally, retain only explicitly confirmed preferences, show those preferences in Settings, and return a truthful provider-not-connected response for current availability/showtime requests. It must not display any provider offer, price, showtime, theater, or ticket link until the selected provider is configured and verified.

## References

[1]: https://apis.justwatch.com/docs/content_partner/ "JustWatch Content Partner: Getting Started"
[2]: https://apis.justwatch.com/docs/api/ "JustWatch Content Partner API"
[3]: https://www.internationalshowtimes.com/pricing "International Showtimes Pricing"
[4]: https://api.watchmode.com/ "Watchmode Streaming Availability API and Pricing"
[5]: https://api.watchmode.com/tc "Watchmode API Terms and Conditions"
[6]: https://movieglu.com/pricing/ "MovieGlu Pricing"
[7]: https://www.themoviedb.org/api-terms-of-use "TMDB API Terms of Use"
