# Memphis, Nashville, and Tulsa Source-Backed Directory Review Package

**Status:** **RESEARCH / REVIEW ONLY — NOT PUBLISHED.** This package has not been written to a production database, exposed in website or mobile search, placed on the map, or used by live Kinfolk recommendations. It does not change users, authentication, login, passwords, sessions, tester access, waitlist records, billing, or deployment configuration.

## Package identity

| Field | Value |
|---|---|
| Coverage | Memphis and nearby Tennessee communities; Nashville and nearby Middle Tennessee communities; Tulsa and nearby Oklahoma communities |
| Consolidated candidates | 24 |
| Review-manifest candidates | 24 |
| Held during package normalization | 0 |
| Pending reviewer queue | 23 |
| Needs-research queue | 1 |
| Review-manifest SHA-256 | `997e5c9e01d172f4f5cb0a8b53e3b99a00a46a50b09d61bef974c3c8745b93d6` |
| Source-manifest SHA-256 | `b1daf6c50cb65d31e8d306fd344941c6caa8301b73b9692918f70a49314333e7` |
| Destination check | 24 of 25 distinct customer destinations returned reachable responses; one timeout remains **needs research**, not a closure finding |

## Review composition

| Route | Candidates | Publication treatment |
|---|---:|---|
| Commercial business | 10 | May be considered for the protected commercial import only after reviewer approval, live-directory duplicate reconciliation, and server-side address/geocode verification. |
| Online-only business | 1 | May be searchable after approval but must remain addressless and mapless. |
| Regulated-review lead | 1 | Requires licensing/authority review; it must not be published as a vetted provider on the basis of this package. |
| Community resource | 5 | Remains in the resource route; it must not become a commercial map pin. Addressless resources remain mapless. |
| Cultural place | 7 | Remains in the cultural route; it must not become a commercial-business map pin. |
| **Total** | **24** | **Protected reviewer workflow required.** |

The consolidated source set contains 21 address-backed records, one online-only commercial record, and two addressless community resources. Address support alone does not create a public map pin: only an approved physical commercial record with a verified server-side geocode may enter the commercial map layer.

## Evidence and source boundaries

Every retained record has a public source URL and a customer-facing official website or official business-social destination. Public chamber membership, tourism/editorial inclusion, and community-directory inclusion are recorded as **source basis** only. They are not treated as an ownership certification or as an inferred identity, language, license, hours, pricing, accessibility, availability, health outcome, or operating-status claim.

The source reports document the inspected evidence and records held during the original city passes. They include the [Memphis source report](../source-reports/memphis-source-report.md), [Nashville source report](../source-reports/nashville-source-report.md), and [Tulsa source report](../source-reports/tulsa-source-report.md). Primary discovery and contextual sources include the Memphis Black Chamber and Memphis Black Business Directory, the Nashville Black Chamber, HOLA Tennessee, the Tennessee Latin American Chamber of Commerce, Visit Tulsa’s Black-owned-business guide, and the Tulsa Area Hispanic Chamber. First-party destinations were separately inspected where retained.

## Required protected reviewer sequence

1. Verify that the review manifest has the SHA-256 value shown above. Do not manually edit it after this check.
2. Stage the manifest only through the existing protected directory-import route. Do **not** perform direct production SQL writes or bulk inserts.
3. Reconcile each candidate against the live directory using normalized name, destination, address, and any existing business identifier. Treat a collision as review/enrichment work, not an automatic duplicate listing.
4. Review the one `needs_research` record and each original held record using current first-party evidence. A timeout, non-success response, or network failure is a review signal only; it does not establish a closure.
5. Route records by their `targetKind`. Commercial businesses with a supported numbered street address may proceed only after approval and controlled server-side geocoding. Online-only businesses receive no map coordinate or pin. Regulated leads require authority/licensing review. Cultural places and community resources retain their separate routes.
6. After approved publication, verify public `/api/businesses` search by name, relevant terms, typo-tolerant query, and location; verify physical map-marker click-through to the business detail page and official customer links; then verify authenticated Kinfolk recommendations retrieve only the published, relevant local results.

> No approval has been performed by this package. Until the protected staging, review, approval, geocode, publication, and public verification steps finish, these 24 candidates are **not live directory inventory**.

## Package files

- `ninth-three-city-combined-review-only-candidates.jsonl` — immutable review manifest after checksum verification.
- `ninth-three-city-combined-review-held-candidates.jsonl` — records held by package normalization; empty for this package because the original city-pass holds remain documented in their source folders.
- `ninth-three-city-combined-review-summary.json` — candidate, state, destination-health, and checksum summary.
- `ninth-three-city-combined-destination-health.json` — bounded-concurrency customer-destination check results.

## Safety invariants

This package cannot publish listings by itself. It contains no database credentials or production-write command, and it cannot add or delete a user or alter any authentication, password, tester-access, session, waitlist, payment, or account-approval flow. It does not create coordinates, directions, or artificial addresses.
