# Kinfolk Entertainment Discovery & Availability — Source Implementation Plan

## Delivery objective

Implement a **source-only, consent-first, provider-gated foundation** so Kinfolk can understand entertainment conversation, retain only member-approved preferences, and safely present a compact “Where to Watch” or “Find Showtimes” enhancement **when an approved live data provider is later configured**.

This plan intentionally does **not** activate a provider, send a provider request, run a migration, deploy, build mobile binaries, create a ticket purchase flow, or represent current availability/showtimes as working.

## Design principles

1. **Conversation first.** Film, television, music, books, sports, games, and cultural conversation remain direct and useful even when live availability is unavailable.
2. **Live data is not model memory.** Availability, price, provider, cinema, showtime, and ticket facts may come only from an approved provider response with an explicit freshness timestamp.
3. **Consent is separate from conversation.** Mentioning a service or favorite does not save it. Kinfolk shows the existing private-memory consent control before retaining a natural-language preference; settings save only after a clear, explicit member action.
4. **No demographic or sensitive inference.** Entertainment preferences cannot infer identity, age, politics, health, religion, or protected traits.
5. **Location is optional and minimized.** Streaming uses an explicit member-selected country. Showtimes use an explicit city/country or the existing, request-scoped location permission path; no background location collection.
6. **Provider failure fails closed.** Missing configuration, an unavailable provider, an unknown title, stale data, or an error yields a labeled unavailable/degraded state—not invented options.
7. **External checkout only.** Kinfolk may display a source-attributed outbound link, never purchase tickets/subscriptions or expose provider secrets.

## Workstreams

### A. Provider-gated availability boundary

- Add a typed, server-only `EntertainmentAvailabilityProvider` interface with bounded request/response shapes.
- Add a disabled default and provider readiness resolver. The default does not call the network.
- Define the data contract for:
  - streaming subscription/rental/purchase offers;
  - title release state;
  - cinema/showtime listings and explicit outbound ticket links;
  - provider attribution, source URL, region, retrieved timestamp, and a `not_configured`/`unavailable` state.
- Add configuration names and validation only; no secrets or provider key are committed.
- Enforce a short request timeout, a bounded result count, a country/location requirement, and no raw-coordinate persistence.

### B. Entertainment conversation and current-info routing

- Add deterministic detection for films, television, streaming, rentals/purchases, cinema/showtimes, music, books, sports, games, and culture.
- Preserve the existing `culture_entertainment` route for general discussion.
- Invoke live-availability resolution only when the member explicitly asks a current availability question (for example, “Where can I watch it?”, “Is it on Netflix?”, or “What are showtimes near me?”).
- Resolve a title only from explicit current-turn text or bounded, same-session entertainment context—never from model invention or global profile inference.
- Retain title context only in the existing member-owned Kinfolk session when continuity is enabled; otherwise keep it request-scoped and ephemeral.
- Attach provider results after the core answer. The current discussion and citations remain primary.

### C. Preferences and existing memory consent

- Extend existing Kinfolk preferences with a member-editable streaming-service list and country selection, both disabled/empty by default.
- Reuse the existing explicit private-memory consent plan for statements such as “I have Netflix” or “I love Afrofuturist films.” The feature must not silently write a preference.
- Read only active, member-owned consented memories relevant to an entertainment request, plus separately selected preference fields. Either input may be edited, paused/revoked, or cleared through existing settings/memory controls.
- Keep a deterministic normalization map for service names and genres. It is a recognition aid, not a provider claim or a demographic label.

### D. Member experience

- Add a compact, optional **Where to Watch** card in Web chat and native chat, including only source-provided service/rental/purchase options and provider attribution.
- Add a compact **Find Showtimes** card only for an explicit theatrical query with selected city/country or approved request-scoped location.
- Include clear states: `Live availability unavailable`, `Provider not connected`, `No result for this country`, and `Location needed`.
- Add Web and native controls for country and saved streaming services; preserve the current Kinfolk settings layout and accessibility patterns.
- Do not build a new standalone entertainment navigation surface or a full translation/localization project.

### E. Verification and handoff

- Add unit/contract tests for intent recognition, explicit consent, no implicit retention, provider-disabled behavior, source attribution, link safety, stale/error behavior, session scoping, and location gating.
- Add Web/native source tests for cards and preference controls.
- Run focused API/Web/native tests, TypeScript checks, and Web production build.
- Update the existing cumulative completion matrix and prepare—not execute—staging, local-speaker/audio, location, provider, and device acceptance cases.

## Future authorization gates

| Gate | Required before activation | Not part of this source task |
|---|---|---|
| Streaming provider | Founder approval of provider contract, price, coverage, attribution, data retention, secret setup, and a limited staging key | Any provider account, key, trial, paid plan, live query, or purchase path |
| Showtime provider | Founder approval of commercial terms, markets, ticket-link terms, freshness/SLA, secret setup, and a limited staging key | Any showtime provider request or ticket checkout |
| Database | Staging authorization and migration review | Running the additive migration |
| Location | Member-controlled staging verification on Web/iOS/Android | Background tracking or silent location collection |
| Quality | Recorded provider output and local-speaker/product acceptance | Calling the feature live or claiming availability quality |

## Success definition for this workstream

**SOURCE IMPLEMENTED** means the offline source candidate safely understands and represents the experience, persists only explicit member choices, displays only provider-shaped data, and fails closed when no approved live provider is present.

It does **not** mean that streaming availability, rental/purchase options, showtimes, ticket links, provider costs, geographic coverage, live device behavior, recorded output quality, or member acceptance have been verified.