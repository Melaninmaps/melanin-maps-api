# Mapping With Melanin Live Content Discoverability Audit

**Audit date:** 2026-08-12 EDT  
**Scope:** Live authenticated web API and representative detail endpoints for businesses, cultural sites, tour cultural sites, events, recurring events, and community organizations.

## Executive verdict

The content collections are **partially discoverable**, but the reported statement that every listed content type is fully searchable and map-ready is **not supported by the live API evidence**. Businesses, selected cultural sites, selected tour sites, selected events, recurring events, and organizations all have working list/detail endpoints. However, the live counts differ from the report, several claimed map-ready collections lack coordinates for most or all returned records, and the cultural-sites endpoint returns more than the claimed total with mixed record types.

The platform should not describe all listed content as universally map-ready until coordinate coverage and endpoint classification are reconciled.

## Live endpoint evidence

| Content type | Live list endpoint | Live count/return evidence | Detail endpoint | Discoverability assessment |
|---|---|---:|---|---|
| Businesses | `GET /api/businesses` | API reported **2,429** total; the request returned a maximum page of 200 | Pass for Hakim's Bookstore | Search/list/detail work for sampled active businesses; reported 2,639 active count was not reproduced. |
| Cultural sites | `GET /api/cultural-sites` | `limit=1000` returned **1,000** sites, not the reported 714 | Pass for Alabama A&M University | List/detail work, but collection count and type hygiene require reconciliation. |
| Tour cultural sites | `GET /api/tour-cultural-sites` | **599** returned and reported | Pass for Machu Picchu | List/detail work; only 45 of 599 returned records had coordinates. |
| Events | `GET /api/events` | Only **1** event returned in live default response | Pass for Community Wealth Building Workshop | Sample detail works; reported total of 514 was not reproduced through this live route. |
| Recurring events | `GET /api/recurring-events` | **85** returned and reported | Pass for Atlanta First Fridays Art Walks | List/detail work; no coordinates returned for the full collection. |
| Community organizations | `GET /api/community-orgs` | **61** returned and reported | Pass for Atlanta Black Chambers | List/detail work; no coordinates returned for the full collection. |

## Map-readiness evidence

| Content type | Returned records inspected | With latitude and longitude | Without coordinates | Assessment |
|---|---:|---:|---:|---|
| Businesses | 200 page records | 200 | 0 | Sampled business page is map-ready. Full total requires paginated verification. |
| Cultural sites | 1,000 | 624 | 376 | Not all returned cultural-site records are map-ready. |
| Tour cultural sites | 599 | 45 | 554 | The claim that all 599 are map-ready is contradicted by the live payload. |
| Events | 1 | 1 | 0 | Sample is map-ready; live event total needs reconciliation. |
| Recurring events | 85 | 0 | 85 | Discoverable as list/detail records but not map-ready from the returned data. |
| Community organizations | 61 | 0 | 61 | Discoverable as list/detail records but not map-ready from the returned data. |

## Representative records verified

| Type | Record | City | Live detail result | Coordinates returned |
|---|---|---|---|---|
| Business | Hakim's Bookstore | Philadelphia | HTTP 200 | Yes |
| Cultural site | Alabama A&M University | Normal | HTTP 200 | Yes |
| Tour cultural site | Machu Picchu — Inca City in the Clouds | Aguas Calientes | HTTP 200 | Yes |
| Event | Community Wealth Building Workshop | Houston | HTTP 200 | Yes |
| Recurring event | First Fridays Art Walks — Atlanta Neighborhoods | Atlanta | HTTP 200 | No |
| Community organization | Atlanta Black Chambers | Atlanta | HTTP 200 | No |

## Findings that require correction before broad map-readiness claims

1. **Business total discrepancy.** The live businesses endpoint reported 2,429 rather than 2,639. Replit must supply the production query and explain whether 210 claimed active businesses are excluded by pagination, visibility filtering, listing status, or another condition.

2. **Cultural-site collection discrepancy.** The live cultural-sites endpoint returned 1,000 records when requested with a 1,000-record limit, exceeding the claimed 714. Its returned sample included content that appears event-like, including a car-and-craft show. Replit must reconcile the content type and total count before publishing a cultural-site total.

3. **Tour-site map gap.** Only 45 of 599 returned tour cultural sites had both latitude and longitude. The remaining 554 should not be represented as map-ready until geocoded or explicitly handled as a list-only/service-area record.

4. **Recurring-event and organization map gap.** None of the 85 recurring events or 61 community organizations returned latitude/longitude in the live list payload. They are searchable/listable/detail-accessible but not demonstrably mappable.

5. **Event count gap.** The live events endpoint returned one event in its current default route response, not the claimed 514. Replit must provide the actual discovery query/filter used to expose the complete active event inventory.

## Required narrow verification from Replit

Replit should provide a read-only production manifest for every public content type with: total records, active/visible records, records with both coordinates, records without coordinates, records suppressed from map, and endpoint/filter used. The customer-facing map should then either show only coordinate-valid records or use a clear non-map fallback; it must never claim a pin that cannot exist.

## Current launch implication

The collections are not absent: representative records are discoverable and accessible. But the all-content claim is overstated. The platform is not ready to claim universal map readiness until the data counts and coordinate completeness are reconciled.

This discoverability gap is separate from the concurrent member-load failures found in the 30-account Kinfolk/Library audit.
