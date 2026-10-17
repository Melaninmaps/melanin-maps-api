# Kinfolk Entertainment Discovery & Availability — TODO

## Completed source foundation

- [x] Review the current Kinfolk candidate, conversation route, memory consent, preferences, existing contextual research, and Web/native chat surfaces.
- [x] Record provider alternatives, licensing/coverage constraints, attribution requirements, and the no-activation decision.
- [x] Add a provider-gated, disabled-by-default availability interface, authenticated readiness route, and no-network default result.
- [x] Add deterministic current-availability/showtime detection for explicit title questions. General entertainment/culture conversation remains on its existing route.
- [x] Add a deterministic consent prompt for a member’s ordinary streaming-subscription/favorite statement. Nothing is written from that message; the member may explicitly save a service in Settings or use the existing `Remember that…` flow.
- [x] Extend existing Kinfolk preferences with explicit, clearable saved streaming services and an availability country. A member’s saved country/services are read privately by the availability endpoint, but never treated as live provider evidence.
- [x] Add Web and native settings controls and native navigation. They clearly label live availability/showtimes as unavailable until an approved provider is connected.
- [x] Preserve existing culture conversation, citations, private-memory safeguards, and no-background-location behavior.

## Completed quality work

- [x] Add API service/route tests for explicit detection, consent prompting, provider-disabled, title, country, and showtime-location boundaries.
- [x] Add Web and native preference/navigation contract tests.
- [x] Run database/API/Web/native TypeScript checks; focused API/Web/native tests; and Web production build.
- [x] Update the cumulative release matrix and final source handoff with exact commits and validation results.

## Explicitly deferred and inactive

- [ ] Contract, configure, or call JustWatch, International Showtimes, Watchmode, MovieGlu, TMDB, or any other provider.
- [ ] Render real streaming offers/showtime cards. Those cards require a provider response with contractual attribution and freshness evidence; the source candidate returns a truthful unavailable state instead.
- [ ] Run a database migration or deploy.
- [ ] Create a mobile build, AWS/device session, provider-output/audio acceptance, local-speaker validation, or member acceptance.
- [ ] Claim working live availability, rental/purchase options, showtimes, pricing, geographic coverage, or ticketing.
