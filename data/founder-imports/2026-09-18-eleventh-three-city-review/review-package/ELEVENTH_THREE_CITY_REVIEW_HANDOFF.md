# Indianapolis, Twin Cities, and Boston Source-Backed Directory Review Package

**Status:** **RESEARCH / REVIEW ONLY — NOT PUBLISHED.** Nothing in this package has been written to a production database, exposed in website/mobile search, placed on the live map, or made available to live Kinfolk recommendations. It does not modify users, authentication, login, passwords, sessions, tester access, waitlist records, billing, payments, or deployment configuration.

## Package identity

| Field | Value |
|---|---|
| Coverage | Indianapolis; Minneapolis–Saint Paul and a clearly supported Twin Cities suburb; Boston and clearly supported Greater Boston communities |
| Consolidated source candidates | 59 |
| Review-manifest candidates | 59 |
| Held by package normalization | 0 |
| Pending reviewer queue | 57 |
| Needs-research reviewer queue | 2 |
| Review-manifest SHA-256 | `c4ab2d8d510264bbaf256c54515c30e5eddcd71a290522a9e0f64a654871bde5` |
| Source-manifest SHA-256 | `1a4a7e1ba7eb817dc0b368120b1c1dbf66269a27f37c469f90d02b949e22c6c0` |
| Destination check | 72 of 74 distinct selected customer destinations returned reachable HTTP responses; 2 returned 403 and remain review gates |

## Review composition

| Route | Candidates | Publication treatment |
|---|---:|---|
| Commercial business | 39 | May be considered for the protected commercial import only after reviewer approval, live-directory duplicate reconciliation, and server-side address/geocode verification. |
| Online-only business | 1 | May be searchable after approval but must remain addressless and mapless. |
| Regulated-review lead | 2 | Requires licensing or authority review; must not be presented as a vetted provider based on this package alone. |
| Community resource | 12 | Remains in the resource route and must not become a commercial map pin. |
| Cultural place | 5 | Remains in the cultural route and must not become a commercial-business map pin. |
| **Total** | **59** | **Protected reviewer workflow required.** |

Fifty-eight records have source-backed numbered street addresses. This alone does not create a public map pin: only a reviewer-approved physical commercial business that passes controlled server-side geocoding may enter the commercial map layer. The online-only record is explicitly addressless and mapless.

## Destination-review gates

The destination check is an operational review signal, **not** a business-closure determination. The following two records are `needs_research` because their selected official destinations returned HTTP 403 to the bounded automated check; their pre-collection source and destination evidence is retained in the city reports:

| Candidate | City | Target kind | Destination result |
|---|---|---|---|
| Da Blue Lagoon Jamaican Kitchen | Indianapolis, IN | business | HTTP 403 review gate |
| Nashville Coop | Saint Paul, MN | business | HTTP 403 review gate |

All 57 other candidates remain `pending_review`; they are not automatically published. A successful destination response also does not prove a business is open, accepting customers, licensed, owned by a particular person/group, or currently available.

## Evidence and source boundaries

Each candidate has a public source URL and a selected customer-facing official website or official business-social destination. The collection reports enumerate inspected sources, retained/held evidence, and source limitations: [Indianapolis source report](../source-reports/indianapolis-source-report.md), [Twin Cities source report](../source-reports/minneapolis-saint-paul-source-report.md), and [Boston source report](../source-reports/boston-source-report.md).

Publisher lists, chambers, tourism/editorial inclusion, and community-directory inclusion are retained only as **source basis**. They are not ownership certification and do not justify inferred identity, language, licensing, hours, pricing, accessibility, availability, health outcome, or operating-status claims. Demographic, cultural, ownership, and language wording stays attributed to the inspected public source where such wording appears.

## Required protected reviewer sequence

1. Verify the review-manifest SHA-256 shown above. Do not manually alter the manifest after verification.
2. Stage the manifest only through the existing protected directory-import route. Do **not** use direct production SQL or an unmanaged bulk insert.
3. Reconcile each record against the live directory by normalized name, customer destination, address, and existing business identifier. A collision is an enrichment/review task, never an automatic duplicate listing.
4. Resolve the two 403 destination gates with a reviewer’s current evidence check before considering publication.
5. Route records by `targetKind`. Approved physical commercial businesses with supported numbered street addresses may proceed to controlled server-side geocoding. The online-only record remains without a coordinate, pin, or directions action. Regulated-review records require authority/licensing review. Cultural places and community resources retain separate routes.
6. After approved publication, test public `/api/businesses` search by full name, relevant terms, typo-tolerant query, and location; test physical map-marker click-through to the listing page and official destination; then test authenticated Kinfolk retrieval against only published, local, relevant listings.

> No reviewer approval has occurred through this package. Until staging, duplicate review, approval, server-side geocode, publication, and public verification succeed, these 59 candidates are **not live directory inventory**.

## Package files

- `eleventh-three-city-combined-review-only-candidates.jsonl` — immutable review manifest after checksum verification.
- `eleventh-three-city-combined-review-held-candidates.jsonl` — package-level held queue; empty for this package. Original city-pass holds remain in `../held/`.
- `eleventh-three-city-combined-review-summary.json` — candidate, queue, destination-health, and checksum summary.
- `eleventh-three-city-combined-destination-health.json` — bounded-concurrency customer-destination check results.

## Safety invariants

This package contains no production database credential or production-write command. It cannot itself publish a business, map pin, resource, or cultural listing. It does not create coordinates, directions, or artificial addresses, and does not add/delete users or alter authentication, passwords, tester access, sessions, waitlist, payment, or account-approval flows.
