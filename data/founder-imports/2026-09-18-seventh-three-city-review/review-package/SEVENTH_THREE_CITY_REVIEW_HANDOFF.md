# Denver, Phoenix, and Las Vegas Directory Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT STAGED OR PUBLISHED**

**Package date:** 2026-09-18
**Geography:** Denver and nearby Front Range communities; Phoenix and nearby Valley communities; Las Vegas and nearby Southern Nevada communities.

## Purpose and publication boundary

This package consolidates source-backed research into a **protected reviewer input**. It does **not** connect to a database, create or update a business, create a map pin, modify the website or mobile app, change Kinfolk retrieval, or modify users, authentication, passwords, reset flows, sessions, tester access, approvals, or waitlist records.

A research candidate is not a public listing. It must be staged into the protected review environment, reconciled against existing directory records, individually approved by an authorized reviewer, and—where appropriate—geocoded server-side before it becomes searchable or appears as a map pin. A destination check is a point-in-time technical signal, not proof that a business is open, licensed, accessible, culturally affiliated, or suitable for a specific member.

## Integrity and composition

| Measure | Count |
|---|---:|
| Source-pass candidate rows received | 38 |
| Structurally complete consolidated candidates | 38 |
| Package-level structural holds | 1 |
| Exact cross-source duplicates removed | 0 |
| Same-destination collisions requiring reconciliation | 0 |
| Review-only candidates in the manifest | **37** |
| `pending_review` candidates | 34 |
| `needs_research` candidates | 3 |
| Research-pass held records, outside the manifest | 21 |

The review manifest SHA-256 is:

```text
25eedf13bb9d09b6b2ee5181d1622552d98ce60b3520fe21a0770df6cb60feb9
```

Do not edit the manifest after this checksum is recorded. Correct a source record by rebuilding the package and rerunning the destination-health check.

| Review route | Candidates | Publication rule |
|---|---:|---|
| Commercial business | 17 | Reconcile duplicates, confirm the customer-facing official destination, review the street address, use server-side geocoding, and approve before creating any listing or map pin. |
| Community resource | 14 | Review in the resource route. Addressless resources remain mapless and must not be converted into commercial listings. |
| Cultural place | 6 | Review in the cultural/discovery route; do not create a commercial business or commercial map pin. |

## Automated destination check

The manifest references **40 distinct customer destinations**. The bounded verification pass recorded **37 reachable** destinations, **2 non-success responses requiring review**, and **1 timeout**. Those three corresponding candidates are marked `needs_research`; none is described as closed or removed. One structurally complete source record with no valid customer-facing destination is retained in the package hold file rather than the review manifest.

## Source evidence

Detailed URL-by-URL evidence, direct source language, and limitations remain with the package:

- [Denver source report](../source-reports/denver-source-report.md) documents 33 inspected public pages, 14 retained candidates, and 8 evidence-gated records.
- [Phoenix source report](../source-reports/phoenix-source-report.md) documents 21 inspected public pages, 11 retained candidates, and 5 evidence-gated records.
- [Las Vegas source report](../source-reports/las-vegas-source-report.md) documents 26 inspected public pages, 13 retained candidates, and 8 evidence-gated records.

Sources include public Black and Hispanic business directories/chambers, local-government and tourism guides, community and cultural institutions, and first-party customer destinations. Source reports preserve publisher/business designations only when directly stated; **membership in a chamber or appearance in a directory is not an ownership certification**. No ownership, identity, language ability, hours, accessibility accommodation, licensing, health claim, or other fact may be inferred merely from a name, source category, neighborhood, or image.

## Files

| File | Role |
|---|---|
| `seventh-three-city-combined-review-only-candidates.jsonl` | Checksum-pinned reviewer manifest. |
| `seventh-three-city-combined-review-summary.json` | Candidate, route, status, and checksum summary. |
| `seventh-three-city-combined-destination-health.json` | Point-in-time destination technical outcomes. |
| `seventh-three-city-combined-review-held-candidates.jsonl` | Package-level hold for the missing customer destination. |
| `../consolidated/seventh-three-city-invalid-or-incomplete-rows-held.json` | Structural exclusion report. |
| `../consolidated/seventh-three-city-exact-duplicates-removed.json` | Exact duplicate report. |
| `../consolidated/seventh-three-city-destination-collisions-review.json` | Potential same-destination collision report. |
| `../source-passes/*.jsonl` | Reproducible source-pass inputs. |

## Reviewer procedure

1. Verify the manifest checksum above before staging.
2. Run only the existing protected **dry-run** importer first and confirm it reports **zero publication writes**.
3. Stage this package only in the authorized local review database, never directly in the production directory database.
4. Reconcile every candidate with existing live businesses. Link or enrich an existing record rather than creating a duplicate.
5. For commercial physical businesses, verify the current official customer destination, confirm the street address, use the protected server-side geocoder, inspect the coordinate result, and approve only then. A listing is not a map pin until this occurs.
6. Keep addressless community resources mapless. Do not manufacture an address, coordinate, directions action, or pin.
7. Route community and cultural candidates to their distinct review paths. Do not turn them into commercial listings.
8. Maintain the three `needs_research` holds until a reviewer obtains current destination evidence; treat a timeout or non-success result as an evidence gate, not a closure claim.
9. After publication of an approved subset, verify exact-name and reasonable-misspelling search, locality/relevance behavior, business-detail link destinations, map-pin click-through, and authenticated Kinfolk local recommendations against the actual public API and clients.

> **No raw research record should be publicly visible merely because it is present in this package.** The review boundary prevents duplicate, stale, mislocated, unsupported, or improperly categorized information from reaching users.
