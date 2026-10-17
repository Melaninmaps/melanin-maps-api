# Cited-Web Evidence Basis for Kinfolk Entertainment

The source extension uses the existing configuration-gated OpenAI Responses web-search adapter only when a member explicitly asks a current entertainment question. No development-time provider or live web request was made.

## Product implications

OpenAI's web-search guide says that web-search responses include message text and URL-citation annotations. It also states that, when web-derived information is shown to end users, inline citations must be clearly visible and clickable. The source implementation therefore retains the returned citations and uses existing Kinfolk source-link components; it never exposes a result as an availability answer unless the deterministic evidence guard accepts it. [1]

The guide supports approximate country, city, region, and timezone input for geography-refined search. Kinfolk sends only the member-selected country and, for showtimes/events, the member-provided/request-scoped city. It does not obtain a background address or reuse an unrelated location. [1]

OpenAI's citation guidance recommends defining permitted citable units, validating citations before rendering, and ensuring the source accurately supports the claim. The evidence guard operationalizes that instruction by accepting a natural-language availability assertion only from a cited official provider/title page or an allow-listed official cinema page that identifies the requested title, the requested region, and an explicit current availability fact. [2]

Structured Outputs can enforce a response schema when a model is used for extraction. This source change deliberately does not use model-generated JSON as proof. It interprets the cited, associated response sentence deterministically and rejects it unless the fixed checks pass. [3]

## Boundaries

- The cited-web adapter may provide a **verified availability statement** only for supported official streaming domains where the cited context explicitly names the title, country, provider, and current availability. It may distinguish included-with-subscription from rental/purchase only when that same cited context says so.
- A current showtime statement requires an allow-listed official cinema source plus exact title, city, country, ISO date, and start time in the cited context. The response contains a source link, never an inferred ticket URL.
- Generic service pages, uncited model text, snippets, directory/aggregator pages, title mentions without an explicit availability statement, stale source dates, region mismatches, ambiguous title references, and conflicting claims are not sufficient. Kinfolk returns a limitation plus legitimate source links where available.
- Structured provider offers, entitlements, prices, broad theater coverage, showtime coverage, ticket links, and SLA-backed freshness still require a separately approved and appropriately licensed provider. Existing provider abstraction remains unchanged.

## References

[1]: https://developers.openai.com/api/docs/guides/tools-web-search "OpenAI web search guide"
[2]: https://developers.openai.com/api/docs/guides/citation-formatting "OpenAI citation formatting guide"
[3]: https://developers.openai.com/api/docs/guides/structured-outputs "OpenAI structured outputs guide"
