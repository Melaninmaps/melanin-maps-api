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
- [ ] Claim live streaming availability, rental/purchase options, showtimes, pricing, geographic coverage, theater listings, ticketing, or device acceptance.

## Post-source provider research

- [x] Compare official public JustWatch, International Showtimes, Watchmode, MovieGlu, and TMDB terms without opening an account, trial, provider request, or paid service.
- [x] Record published costs, known attribution/licensing constraints, and the absence of a public city-level U.S. showtime coverage list in the provider decision packet.
- [x] Preserve the source candidate in the cumulative integration inventory for later controlled authoritative-candidate assembly.
- [ ] Obtain a founder-approved provider and a written provider confirmation for the named non-production market before any activation.
