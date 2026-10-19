# FLIGHT-001 — Existing Flight-Status Readiness Decision Packet

**Decision date:** 2026-10-19
**Claim:** `FLIGHT-001-PROVIDER-NEUTRAL-READINESS-PACKET` (P1)
**Central coordination receipt:** `de51d9d98528b2acbd251b329f2a8ec98668341b`
**Sealed source-evidence authority:** `78a17e1d647daeec7c9814330910c94ab08f142c`
**Decision:** **NO-GO for provider account setup, credentials, API calls, activation, or deployment.** The founder has conditionally selected AviationStack Basic as the preferred future direction for an existing-flight-status pilot, but that direction does not authorize a purchase, credential, provider call, member-data transfer, or production use.

## Decision matrix

| Option | Published status capability and freshness | Published cost / commercial terms | Pilot decision |
|---|---|---|---|
| **AviationStack Basic** | The `flights` endpoint provides global real-time status. AviationStack publishes 30–60 second source updates, global coverage figures of 10,000+ airports and 13,000+ airlines, and a 99.9% average uptime claim for the prior 12 months. [1] [2] | **$49.99/month**, 10,000 requests, commercial use, real-time data and HTTPS. Each request above the quota is published at **$0.019996**; the provider says overages continue service after quota rather than stopping it. [1] [3] | **Preferred future pilot direction, not activated.** Its published commercial plan and status documentation fit the intended scope, and the repository already has a separate optional AviationStack compatibility seam. The founder’s $49.99 ceiling is **not currently enforceable** from the published terms because no documented hard-stop/no-overage control was found. |
| **FlightLabs Starter** | FlightLabs publishes worldwide flight positions, routes, and status; its `/flights` feed updates every minute. A status lookup can be filtered by flight number or IATA/ICAO identifier. [4] [5] | **$24.99/month**, 4,000 calls, 10 requests per 10 seconds, 100 real-time results. Its terms require a payment card for the trial, automatically bill after an uncancelled trial, and enable extra-call “Soft Limit” usage by default unless the account holder disables it. The standard terms do not promise availability; a custom SLA is an Enterprise feature. [4] [6] | **Do not select for this pilot.** It has a lower published entry price, but its default extra-usage behavior and less specific published reliability commitment make it a weaker fit for the required strict budget boundary. |
| **Existing direct compatibility seam** | It can directly query AviationStack only when `AVIATIONSTACK_API_KEY` is present. Absent a key, it returns unavailable and makes no provider request. [7] | It has no pilot plan, provider-neutral capability registry, hard budget control, or status-specific disclosure authorization. | **Preserve but do not activate or broaden.** This is a legacy compatibility boundary, not a sanctioned pilot integration. |

AviationStack’s published 99.9% figure is a provider claim, not a service-level agreement accepted by Mapping with Melanin. The comparison does not verify carrier-level coverage, data accuracy for a specific flight, legal suitability, or a hard spending cap.

## What currently exists

The sealed source evidence shows a private-flight context, not an authorized shared flight-status product. Its existing boundaries are valuable and must remain intact:

- Flight records are owner-scoped. Newly authored private-flight fields are encrypted, and authenticated owner responses use `Cache-Control: no-store`. [8] [9]
- Create, correction, attachment, unlink, and deletion actions require exact `memberConfirmed: true` input. That confirmation is a storage/relationship confirmation only. It is not consent to call a provider or disclose flight data to a friend. [8] [9]
- PNRs, booking references, exact addresses, coordinates, and live location are excluded. Private-flight context expressly does not automatically activate provider tracking, chat, memory, recommendations, calendar, reminders, sharing, analytics, booking, Map, Directory, Community, or Safety behavior. [8] [9]
- The distinct compatibility endpoint `GET /travel/flights/status` opens records only after an owner-scoped lookup. With no `AVIATIONSTACK_API_KEY`, it returns `providerStatus: "unavailable"`, `checked: 0`, and does not make a provider request. If a key exists, it directly constructs an AviationStack URL, checks no more than five records, and maps failed checks to local unknown/unavailable responses. [7]

The sealed test receipt reports **2 API files / 11 tests passed** for encrypted private-flight policy and selected-trip routing, and **1 mobile file / 2 tests passed** for explicit private-context wording and absence of a legacy status fetch. Those are existing source-only results, not this packet’s test run. They do not verify provider authorization, status normalization, freshness, a provider failure contract, friend sharing, cross-platform status behavior, or any live API result. [10]

## Readiness gaps before any status pilot

The compatibility endpoint is provider-specific and has no approved boundary for the intended questions, such as “Is Sean delayed?” or “What time will Sean land?” The following gaps remain open:

1. **Separate authorization is absent.** There is no versioned, revocable disclosure grant that separately authorizes sending a flight number and departure date to a status provider. `memberConfirmed` cannot be reused for that purpose.
2. **Member-to-member sharing is absent.** A member must explicitly choose whether a narrow status fact may be shared with a specific recipient. A provider-disclosure grant and a recipient-sharing grant are distinct decisions; neither may be inferred from stored flight context or a social relationship.
3. **Provider-neutral status contract is absent.** The code has no `FlightStatusProvider.lookupStatus`-only interface, injected adapter boundary, normalized status schema, provenance/freshness field, or provider capability registry.
4. **Fail-closed status semantics are incomplete.** The existing route maps a subset of direct-provider fields. It does not establish a durable typed contract for no consent, disabled capability, missing credential, timeout, rate limit, malformed payload, stale observation, no result, or unsupported flight.
5. **Privacy minimization is incomplete.** A future adapter must receive only the minimally authorized flight number and departure date. It must not transmit encrypted notes, PNRs, booking references, origin/destination beyond what an approved provider query strictly requires, exact addresses, coordinates, live aircraft position, member identity, trip content, or Kinfolk conversation context.
6. **Truthfulness rules are absent.** Kinfolk needs an explicit status vocabulary and observed-at/provenance behavior. It must present only provider-supported scheduled, estimated, actual, cancellation, diversion, or unavailable facts. It must never infer a delay, landing time, or live tracking location from a schedule, a stale response, missing data, or another member’s plan.
7. **Controlled test coverage is absent.** No injected-fake-provider suite proves no call without authorization, safe stripping of hostile provider payloads, neutral fallback, no retry/substitution, no data leakage, or the distinction between owner status access and recipient sharing.
8. **Travel-coordination integration is absent.** A future coordination recommendation may use only an explicitly shared, fresh, normalized arrival status and separately authorized shared availability. It must not silently reveal an itinerary, create a meeting, message a member, track a flight, or substitute uncertain status for member confirmation.

## Required future provider-neutral status contract

This is a future source-contract specification only. It does not authorize any source modification in this FLIGHT-001 decision claim.

A future status adapter must expose only a status lookup capability, for example `FlightStatusProvider.lookupStatus(query)`. It must have no search-for-offers, pricing, booking, hold, ticketing, change, cancellation, payment, polling, monitoring, or notification capability. The normalized query may contain only a validated flight number and departure date after current authorization is confirmed.

A separately versioned, time-bounded, revocable **provider-disclosure grant** must state the provider ID, the narrow `existing_flight_status` purpose, allowed data categories, grant and expiry times, and revocation state. Missing, expired, revoked, provider-mismatched, purpose-mismatched, or scope-mismatched grants must cause zero outbound requests. A distinct, revocable **recipient-sharing grant** must identify the intended recipient and allow only the specific normalized status fields that the flight owner chose to share. No friend, Circle, trip attachment, or stored record may imply either grant.

A disabled-by-default capability registry must contain no credential value. It must require all of: an approved provider ID; `status` as the only allowed capability; a non-production/test/live state chosen by a future approved configuration process; a credential-availability flag without the credential; and a recorded data-processing approval. Credentials alone must never enable a provider.

The normalized result must be deliberately narrow: a stable flight reference, normalized status state, allowed scheduled/estimated/actual departure or arrival timestamps, observation time, and provider provenance suitable for a member-facing freshness statement. The adapter must discard raw payloads and any PNR, booking reference, price, payment data, member identifier, private note, exact address, coordinate, live location, provider secret, or unapproved field. Unknown, malformed, stale, rate-limited, timed-out, authentication-failed, unsupported, or no-result outcomes must map to one neutral typed unavailable result. There must be no automatic retry, provider substitution, extrapolation, or invented arrival/departure time.

Injected fake-provider tests must prove the following before any provider interaction is proposed: no call without each current consent; no call after revocation or expiry; no call while disabled or without credential approval; exact minimized payload; raw-field rejection/stripping; stable unavailable fallback; no provider-name, secret, or protected flight context in logs or client output; no retry/substitution; and no claim that a missing or stale arrival time is known. Separate tests must prove that recipient sharing remains denied unless the flight owner has made the dedicated recipient-sharing grant.

## Controlled-pilot gate and exact approval needed

The founder’s conditional choice of AviationStack Basic is a provider direction and budget preference only. Its published Basic plan has a $49.99 monthly base charge but published automatic overage exposure. Therefore, **the $49.99 ceiling is not enforceable from the current public evidence. No purchase or activation may proceed on that assumption.** [1] [3]

Before an account can be created or used, a future approval request must include all of the following exact evidence and actions:

1. **Written billing control:** AviationStack must provide written confirmation of a hard no-overage stop or an equivalent binding control that prevents charges above $49.99 per month. If it cannot, a separate founder decision must approve a different provider/plan or a different budget control. Dashboard notifications at 75%, 90%, and 100% are monitoring, not a spending cap. [3]
2. **Exact purchase authorization:** after the billing condition is satisfied, the founder must approve the named account owner, AviationStack Basic monthly plan, total recurring charge of $49.99, taxes/fees if any, confirmed no-overage control, renewal behavior, cancellation path, and a prohibition on upgrades or added subscriptions. This must use the payment workflow before any payment.
3. **Source-contract acceptance:** central coordination must first accept a separately claimed and tested provider-neutral status contract, consent lifecycle, fake-provider suite, and status error/fallback behavior. FLIGHT-001 does not itself accept or integrate source work.
4. **Test-only activation authorization:** a later approval must name the non-production environment, provider credential custody, isolated test identity/data, permitted request cap, no-real-member-data rule, log redaction rules, stop conditions, and rollback/credential-removal plan. It must authorize only bounded test requests. It must not imply production activation, member sharing, mobile release, or background tracking.

The future pilot must stop before an external request whenever authorization is absent or invalid, the capability registry is disabled, the billing hard cap is not documented, input contains a prohibited field, a result is malformed/stale/ambiguous, or the request expands into tracking, monitoring, messaging, recommendations, or flight commerce.

## Scope and verification record

This is an uncommitted documentation-only carrier. It does not create, amend, activate, or integrate product source; configure a provider; create an account; request or use credentials; make a provider request; transfer member data; access a browser/device; change a database/schema; build; deploy; migrate; or activate a feature. It preserves flight commerce as separate future scope.

The initial sealed evidence archive was verified against its supplied outer SHA-256 `2a1abaeefc41dd66a5622b2b00d30241dfc5b37ea7a02ce77287cddeed6a4c8a`. The sealed manifest hashes for its claim, official readiness trace, private-flight policy, selected-trip route, and compatibility route matched. The delivery manifest accompanying this one-document carrier records the final document and outer-carrier SHA-256 values after static scope and whitespace validation.

## References

[1]: https://aviationstack.com/pricing "AviationStack pricing plans"

[2]: https://docs.apilayer.com/aviationstack/docs/api-documentation "AviationStack API documentation"

[3]: https://aviationstack.com/billing-overages-documentation "AviationStack billing overages documentation"

[4]: https://www.goflightlabs.com/ "FlightLabs flight status API and pricing"

[5]: https://www.goflightlabs.com/real-time "FlightLabs real-time flights API"

[6]: https://www.goflightlabs.com/terms "FlightLabs terms and conditions"

[7]: sealed read-only source extract `artifacts/api-server/src/routes/travel-flights.ts`, SHA-256 `6782d314d8423730e6b10605113bfd5cdc1d83765b709f13439b4f4c4b66ed04`

[8]: sealed read-only source extract `artifacts/api-server/src/kinfolk/trip-flight-policy.ts`, SHA-256 `fcb04e97fbe74c6c3f0645a42522d522b6178c681c6ecfa3f684784010f30ce8`

[9]: sealed read-only source extract `artifacts/api-server/src/routes/kinfolk-trip-flights.ts`, SHA-256 `d9d8245f22b61df8a0f6d6f577291875e42ea4c83e8309af889dc50b9075b4f1`

[10]: sealed read-only source trace `evidence/flight-readiness-trace.md`, SHA-256 `67f047f15cc140c691623e074a33879123bdb098ff244c66a7498486e6ca46c9`
