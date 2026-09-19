# Philadelphia, Atlanta, and Houston Deep-Pass Directory Review Package

**Status:** **RESEARCH / REVIEW ONLY — NOT PUBLISHED.** Nothing in this package has been written to a production database, exposed in website/mobile search, placed on the live map, or made available to live Kinfolk recommendations. It does not modify users, authentication, login, passwords, sessions, tester access, waitlist records, billing, payments, or deployment configuration.

## Package identity

| Field | Value |
|---|---|
| Coverage | Philadelphia and clearly supported southeastern Pennsylvania; Atlanta metro and clearly supported nearby communities; Houston metro |
| Consolidated source candidates | 30 |
| Review-manifest candidates | 30 |
| Held by package normalization | 0 |
| Pending reviewer queue | 24 |
| Needs-research reviewer queue | 6 |
| Review-manifest SHA-256 | `31d4badabec490fb5b33f8c25e791607fdc03c766bcf8290282a1aa1dc739c2b` |
| Source-manifest SHA-256 | `0ca55d37d0557c6ff393ae7d0f915674f3077f307df80dd9cf7fcb57e659ada2` |
| Destination check | 28 of 36 selected customer destinations returned reachable responses; 5 timed out and 3 returned network errors, remaining review gates |

## Review composition

| Route | Candidates | Publication treatment |
|---|---:|---|
| Commercial business | 4 | May be considered for the protected commercial import only after reviewer approval, live-directory duplicate reconciliation, and server-side address/geocode verification. |
| Online-only business | 0 | None in this package. |
| Regulated-review lead | 15 | Requires licensing or authority review; must not be presented as a vetted provider based on this package alone. |
| Community resource | 8 | Remains in the resource route and must not become a commercial map pin. |
| Cultural place | 3 | Remains in the cultural route and must not become a commercial-business map pin. |
| **Total** | **30** | **Protected reviewer workflow required.** |

Twenty-eight records have source-backed numbered street addresses. This alone does not create a public map pin: only a reviewer-approved physical commercial business that passes controlled server-side geocoding may enter the commercial map layer. Two community resources use source-supported mailing/contact locations but remain noncommercial and mapless under this package.

## Why this deep pass is small

This wave was intentionally narrow and evidence-first. It opened multiple Black, Latino/Hispanic, African/Caribbean/diaspora, municipal, chamber, childcare, and community source families, but did **not** re-add entities already in earlier packages. Leads with parked domains, inaccessible or mismatched customer destinations, conflicting addresses, or no suitable official destination were preserved in the source-pass hold files rather than padded into the review manifest.

## Destination-review gates

Destination checks are operational review signals, **not** business-closure determinations. The following six records are `needs_research` because one or more selected customer destinations timed out or returned a network error during the bounded check:

| Candidate | City | Target kind | Gate |
|---|---|---|---|
| 404 Coffee | Atlanta, GA | business | Customer destination and contact page timed out |
| Essential Wealth Management | Atlanta, GA | regulated_review | Official destination and contact page returned network errors |
| Georgia Association of Black Women Attorneys (GABWA) | Atlanta, GA | community_resource | Official destination timed out |
| The Man Cave Atlanta | Atlanta, GA | regulated_review | Official destination returned a network error |
| Houston MBDA Business Center | Houston, TX | community_resource | Official destination timed out |
| Global Paint for Charity | Peachtree Corners, GA | community_resource | Official contact page timed out |

All other package candidates remain `pending_review`; none is automatically published. A successful response does not prove an entity is open, accepting customers, licensed, owned by a particular person/group, or currently available.

## Evidence and source boundaries

Each candidate retains a public source URL and a selected customer-facing official website or official business-social destination. The deep-pass source reports enumerate every inspected URL, retained/held rationale, and source-family coverage: [Philadelphia report](../source-reports/philadelphia-deep-pass-source-report.md), [Atlanta report](../source-reports/atlanta-deep-pass-source-report.md), and [Houston report](../source-reports/houston-deep-pass-source-report.md).

Public directories, chambers, community lists, municipal resources, and editorial coverage are retained only as **source basis**. They are not ownership certification and do not justify inferred identity, culture, language, licensing, hours, pricing, accessibility, availability, health outcome, or operating-status claims. Demographic, cultural, ownership, and language wording remains attributed only where the inspected public source states it.

## Required protected reviewer sequence

1. Verify the review-manifest SHA-256 value above. Do not manually alter the manifest after verification.
2. Stage the manifest only through the existing protected directory-import route. Do **not** use direct production SQL or an unmanaged bulk insert.
3. Reconcile every record against the live directory by normalized name, customer destination, address, state, and existing business identifier. A collision is an enrichment/review task, never an automatic duplicate listing.
4. Resolve the six destination gates with current reviewer evidence before considering publication.
5. Route records by `targetKind`. Approved physical commercial businesses with supported numbered street addresses can proceed to controlled server-side geocoding. Regulated-review records require authority/licensing review. Cultural places and community resources retain separate routes.
6. After approved publication, test public `/api/businesses` search by full name, relevant terms, typo-tolerant query, and location; test physical map-marker click-through to a listing page and official destination; then test authenticated Kinfolk retrieval against only published, local, relevant listings.

> No reviewer approval has occurred through this package. Until staging, duplicate review, approval, server-side geocode, publication, and public verification succeed, these 30 candidates are **not live directory inventory**.

## Package files

- `deep-launch-city-combined-review-only-candidates.jsonl` — immutable review manifest after checksum verification.
- `deep-launch-city-combined-review-held-candidates.jsonl` — package-level held queue; empty for this package. Original city-pass holds remain in `../held/`.
- `deep-launch-city-combined-review-summary.json` — candidate, queue, destination-health, and checksum summary.
- `deep-launch-city-combined-destination-health.json` — bounded-concurrency customer-destination check results.

## Safety invariants

This package contains no production database credential or production-write command. It cannot itself publish a business, map pin, resource, or cultural listing. It does not create coordinates, directions, or artificial addresses, and does not add/delete users or alter authentication, passwords, tester access, sessions, waitlist, payment, or account-approval flows.
