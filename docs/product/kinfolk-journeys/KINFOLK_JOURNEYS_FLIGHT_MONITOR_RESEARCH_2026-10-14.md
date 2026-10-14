# Kinfolk Journeys — Live Flight Monitoring Research

**Date:** 2026-10-14
**Status:** Read-only provider research. No account, paid plan, API key, webhook, provider agreement, scheduled poller, or live flight lookup was created.

> **Product decision:** Kinfolk may provide an opt-in, advisory-only disruption monitor only through a contracted, authorized flight-data provider. It must never access a carrier reservation, PNR, loyalty account, airline credentials, or booking-management page. A member continues to use the airline or booking channel for confirmation and changes.

## Viability matrix

| Candidate | Capability | Legitimate path | Source decision | Hard blocker |
|---|---|---|---|---|
| **FlightAware AeroAPI v4** | Flight status plus cancellation/diversion callback alerts; delays derived from timestamp/status deltas | Server-side API key, registered HTTPS callback endpoint, paid plan and license | Strong candidate for a future opt-in advisory monitor; model as a server-only provider adapter | Standard-or-higher paid license, written classification for the member-facing distribution model, durable receiver, privacy/retention review |
| **Cirium Trips & Waivers / Traveler Trip Alerts** | Multi-segment trip monitoring, connection/disruption alerts, callback or pull | Commercial onboarding and contract; an opaque Journey reference can identify the itinerary | Best contractual option for a full multi-segment Journey monitor | Contract/onboarding, DPA and explicit terms permitting B2C notifications/caching/retention |
| **Aviationstack** | Pollable status, delay fields, gate/terminal and status data | Server-side commercial API key; bounded polling plus service-owned state comparison | Candidate for best-effort single-flight monitoring only | Paid commercial plan, coverage/cancellation acceptance validation, monitor scheduler and notification delivery |
| **Amadeus Enterprise Flight Info** | Enterprise operational flight information | Enterprise agreement, coverage confirmation and private technical contract | Conditional future adapter only | Current self-service status access is decommissioned; no public current AA coverage/SLA/webhook contract |
| **American Airlines direct** | Customer-facing status, reservation tools and own notifications | AA-written partner/service-provider authorization with an AA-provisioned interface | **Not a direct Journey connector** from public materials | Written permission and a documented AA contract; never use credentials, record locators, scraping or browser automation |

## Non-negotiable boundaries

- Flight status is **not** reservation access. Do not collect PNRs, surname, ticket numbers, passport, payment, loyalty, or account credentials for a monitor.
- Create a watch only after the member selects a specific operating-carrier flight, date, origin/destination and notification preference; retain only the minimal reference required by the contracted source.
- Source data is advisory: display provider/source time, observed time, confidence/unknown state, and link/instruction to confirm with the airline or booking channel. Never rebook, cancel, claim passenger rights, or imply the airline will protect a connection.
- Provider callback handling must be HTTPS, queued, time-limited, idempotent, replay-safe and reconciled. A callback must not trigger an irreversible action; re-read normalized status before a user-facing suggestion.
- Unknown or stale data remains **unknown**, never “on time,” “not cancelled,” or “delayed.”
- Opt-out, flight completion, itinerary deletion and Journey retention expiry must remove/pause the watch and delete corresponding provider alerts where the provider supports it.

## Recommended source-only adapter contract

A later provider-enabled worker must accept a member-confirmed input only:

```ts
type FlightWatchRequest = {
  operatingCarrier: string;       // 2–3 character IATA/ICAO as the provider requires
  flightNumber: string;           // 1–4 digits
  scheduledDepartureDate: string; // local YYYY-MM-DD
  originIata: string;
  destinationIata: string;
  memberConsent: true;
  notificationPreference: "in_app" | "push" | "email";
};
```

It must persist a normalized state, provider reference, retrieved/source times, freshness, material-change fingerprint, active/pause/ended state and audit entries—not raw provider payloads or travel identity. It may suggest a **draft** Journey adjustment only after the member reviews it.

## Source implementation readiness

- Additive source-only database/API/UI scaffolding may represent an inactive watch and its consent/deletion lifecycle.
- No source build may register an alert, make an external request, send a notification or start a polling worker unless both the provider/license configuration and a separately approved deployment are present.
- FlightAware’s callback-based model is the preferred engineering shape; Cirium is the preferred contract shape for multi-segment monitoring; Aviationstack is a bounded polling fallback, not a push/SLA substitute.

## Official reference set

- [FlightAware AeroAPI](https://www.flightaware.com/commercial/aeroapi/), [AeroAPI v4 OpenAPI spec](https://www.flightaware.com/commercial/aeroapi/resources/aeroapi-openapi.yml), [alerts setup](https://support.flightaware.com/hc/en-us/articles/33381502369175-How-Do-I-Create-A-Post-Alert-In-AeroAPI), [callback safety](https://support.flightaware.com/hc/en-us/articles/32809242173591-Troubleshooting-Common-AeroAPI-Errors)
- [Cirium Flight Status](https://developer.cirium.com/apis/flightstats-apis/flight-status), [Trips & Waivers overview](https://developer.cirium.com/apis/trips-and-waivers/overview), [Traveler Trip Alerts](https://developer.cirium.com/apis/trips-and-waivers/traveler-trip-alerts)
- [Aviationstack API documentation](https://docs.apilayer.com/aviationstack/docs/api-documentation), [Quickstart](https://docs.apilayer.com/aviationstack/docs/quickstart-guide), [pricing](https://aviationstack.com/pricing)
- [Amadeus Enterprise](https://developers.amadeus.com/enterprise), [Amadeus contact](https://amadeus.com/en/contact)
- [American Airlines flight status](https://www.aa.com/travelInformation/flights/status), [AA flight notifications](https://www.aa.com/web/i18n/travel-info/travel-tools/flight-notifications.html), [AA terms](https://www.aa.com/web/i18n/customer-service/support/legal-information.html)

## Separate approval gates

1. Select one provider and obtain the correct **paid/commercial contract** and data-use/DPA approval.
2. Supply provider credential(s), a backend-only secret-management design, callback endpoint/security design, rate/cost budget and data-retention decision.
3. Approve the production migration and enabled service deployment.
4. Run a sandbox/synthetic end-to-end acceptance pass: create → update → pause → revoke/delete → expired Journey cleanup.
5. Obtain explicit approval for any notification channel or native build after source review.
