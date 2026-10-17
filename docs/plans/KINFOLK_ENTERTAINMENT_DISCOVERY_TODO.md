# Kinfolk Entertainment Discovery & Availability — TODO

## Completed foundation

- [x] Preserve the existing provider-gated Entertainment Discovery source and do not duplicate its preference or availability architecture.
- [x] Keep general movie, television, actor, music, book, entertainment-history, and cultural conversations on the existing Kinfolk route; a provider is never required for an ordinary answer.
- [x] Keep current availability and showtime facts provider-gated, deterministic, attributed, and fail-closed.
- [x] Keep member-selected streaming services and country private, editable, and removable in existing Kinfolk preferences on Web and native.
- [x] Record provider alternatives, commercial/attribution constraints, and the no-activation decision.

## Authorized continuation — source work

- [x] Recognize natural subscription additions, changes, and cancellations, including phrases such as “I have Netflix,” “I switched from Hulu to Max,” and “I cancelled Peacock.”
- [x] Return a clear consent plan from natural subscription/favorite statements; never write from ordinary chat. Apply only a member-confirmed add/remove/replace/cost-policy operation to the existing preferences record.
- [x] Persist and clear a member’s explicit `included_only` / no-extra-cost preference without changing membership pricing, subscription entitlements, or Stripe billing.
- [x] Apply saved services and the no-extra-cost rule only to provider-shaped fixture data; exclude rental/purchase options from `included_only` results and never claim a real offer without a provider.
- [x] Extend explicit availability/showtime detection to title-less theater discovery requests, including city/country/title clarification. Do not infer “my mom’s house,” collect background location, or invent theaters/showtimes.
- [x] Add typed offline streaming/showtime fixtures with attribution, freshness, formats, destination validation, and controlled provider failure states. Fixtures are source-test-only.
- [x] Add Web and native review/edit/delete controls for services and no-extra-cost policy; preserve the selected Kinfolk persona and existing settings layout.
- [x] Add focused tests for intent, consent, subscriptions, cancellations, included-only filtering, provider failure, country/city/title gating, link safety, ordinary entertainment conversation, and Web/native source behavior.
- [x] Update the provider decision packet, cumulative completion matrix, existing ChatGPT handoff, and Device Farm-ready acceptance cases.

## Explicitly deferred and inactive

- [ ] Contract, configure, or call JustWatch, International Showtimes, Watchmode, MovieGlu, TMDB, or any provider.
- [ ] Run a database migration, deploy, create a mobile build, start AWS Device Farm, activate paid services, or make a production write.
- [ ] Claim structured provider availability, entitlement, price, ticketing, geographic coverage, freshness SLA, or device acceptance without a separately approved and licensed provider.

## Post-source provider research

- [x] Compare official public JustWatch, International Showtimes, Watchmode, MovieGlu, and TMDB terms without opening an account, trial, provider request, or paid service.
- [x] Record published costs, known attribution/licensing constraints, and the absence of a public city-level U.S. showtime coverage list in the provider decision packet.
- [x] Preserve the source candidate in the cumulative integration inventory for later controlled authoritative-candidate assembly.
- [ ] Obtain a founder-approved provider and a written provider confirmation for the named non-production market before any activation.

## Authorized cited-web availability source

- [x] Reuse the configured Kinfolk cited-web search adapter for one exact, explicitly requested current entertainment lookup; do not activate a new provider or make development-time live requests.
- [x] Require title/country and require city for showtimes before a source query; use short-lived non-member-specific caching, safe HTTPS citations, a single low-budget query, and a truthful unavailable state.
- [x] Retain the cited response sentence associated with each safe URL citation, then require an official first-party streaming/cinema source, exact title, exact requested region, explicit current fact, and freshness check before a natural-language availability statement.
- [x] Resolve “it” only from one unambiguous title in the current private session; persist the bounded availability answer and source metadata through the existing session path so the next explicit follow-up can resolve safely.
- [x] Permit a streaming statement only when the cited official page supports it; distinguish included-with-subscription, rental, purchase, and unpriced availability only when the cited text explicitly establishes that detail. Apply `included_only` before responding.
- [x] Permit a theater statement only for a cited allow-listed official cinema page that supports the exact title, member-provided city/country, ISO date, and local start time. Do not construct ticket links.
- [x] Reject stale, ambiguous, generic, geographic-mismatch, uncited, non-official, and same-provider-conflicting claims; provide legitimate source links or a truthful limitation instead.
- [x] Continue to reserve structured provider availability, offers, price/entitlement truth, broad cinema coverage, ticket links, attribution SLA, and provider guarantees for separately authorized provider integration.
