# Cleveland, Columbus, and Cincinnati Source-Backed Directory Review Package

**Status:** **RESEARCH / REVIEW ONLY — NOT PUBLISHED.** This package has not been written to a production database, exposed through website or mobile search, placed on the live map, or supplied to live Kinfolk recommendations. It does not modify users, authentication, login, passwords, sessions, tester access, waitlist records, billing, or deployment configuration.

## Package identity

| Field | Value |
|---|---|
| Coverage | Cleveland and nearby Northeast Ohio; Columbus and nearby Central Ohio; Cincinnati and nearby Southwest Ohio |
| Consolidated source candidates | 25 |
| Review-manifest candidates | 25 |
| Held by package normalization | 0 |
| Pending reviewer queue | 25 |
| Review-manifest SHA-256 | `bad283b008e97fef1caa7f51f23a520839e61fc37709fe6bcdf2d72e3cbe16c1` |
| Source-manifest SHA-256 | `c30d1ca9d0b50be519c72a004f2c4793238778663730cec6f30d413018e620df` |
| Destination check | 27 of 27 distinct selected customer destinations returned reachable HTTP responses during the bounded check |

## Review composition

| Route | Candidates | Publication treatment |
|---|---:|---|
| Commercial business | 12 | May be considered for the protected commercial import only after reviewer approval, live-directory duplicate reconciliation, and server-side address/geocode verification. |
| Online-only business | 1 | May be searchable after approval but must remain addressless and mapless. |
| Regulated-review lead | 3 | Requires licensing or authoritative review; must not be published as a vetted provider based on this package alone. |
| Community resource | 5 | Remains in the resource route and must not become a commercial map pin. |
| Cultural place | 4 | Remains in the cultural route and must not become a commercial-business map pin. |
| **Total** | **25** | **Protected reviewer workflow required.** |

Twenty-four records have source-backed numbered street addresses. Address support alone does not create a public map pin: only a reviewer-approved physical commercial business that successfully passes controlled server-side geocoding may enter the commercial map layer. The online-only record is explicitly addressless and mapless.

## Evidence and source boundaries

Every manifest candidate has a public source URL and a selected customer-facing official website or official business-social destination. The city reports document the inspected evidence and the original leads held during source collection: [Cleveland source report](../source-reports/cleveland-source-report.md), [Columbus source report](../source-reports/columbus-source-report.md), and [Cincinnati source report](../source-reports/cincinnati-source-report.md).

Publisher lists, chamber membership, tourism/editorial inclusion, and community-directory inclusion are retained only as **source basis**. They are not represented as ownership certification and do not justify inferred identity, language, license, hours, pricing, accessibility, availability, health outcome, or operating-status claims. The successful destination checks only establish a contemporaneous reachable response; they do **not** prove that a business is currently open or taking clients.

## Required protected reviewer sequence

1. Verify the review-manifest SHA-256 value shown above. Do not manually alter the manifest after verification.
2. Stage the manifest only through the existing protected directory-import route. Do **not** use direct production SQL or a bulk insert.
3. Reconcile every candidate against the live directory by normalized name, customer destination, address, and existing business identifier. A collision is an enrichment/review task, never an automatic duplicate listing.
4. Review the original city-pass hold files before attempting any supplemental publication. Their source gaps and conflicts are documented, not treated as closure findings.
5. Route records by `targetKind`. Approved commercial businesses with supported numbered street addresses can proceed to controlled server-side geocoding. Online-only records remain without a coordinate, pin, or directions action. Regulated leads require authority/licensing review. Cultural places and community resources retain their separate routes.
6. After approved publication, test public `/api/businesses` search by name, relevant terms, typo-tolerant query, and location; test physical map-marker click-through to the listing page and official destination; then test authenticated Kinfolk retrieval against only the published, local, relevant listings.

> No reviewer approval has occurred through this package. Until staging, duplicate review, approval, server-side geocode, publication, and public verification succeed, these 25 candidates are **not live directory inventory**.

## Package files

- `tenth-three-city-combined-review-only-candidates.jsonl` — immutable review manifest after checksum verification.
- `tenth-three-city-combined-review-held-candidates.jsonl` — package-level held queue; empty for this package. Original city-pass holds remain in `../held/`.
- `tenth-three-city-combined-review-summary.json` — candidate, queue, destination-health, and checksum summary.
- `tenth-three-city-combined-destination-health.json` — bounded-concurrency customer-destination check results.

## Safety invariants

This package contains no production database credential or production-write command. It cannot itself publish a business, map pin, resource, or cultural listing. It does not create coordinates, directions, or artificial addresses, and does not add/delete users or alter authentication, passwords, tester access, sessions, waitlist, payment, or account-approval flows.
