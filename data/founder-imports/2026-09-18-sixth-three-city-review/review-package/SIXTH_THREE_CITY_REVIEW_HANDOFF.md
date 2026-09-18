# San Antonio, Kansas City, and St. Louis Directory Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT STAGED OR PUBLISHED**

**Package date:** 2026-09-18
**Geography:** San Antonio and nearby Texas communities; Kansas City metropolitan area in Missouri and Kansas; St. Louis metropolitan area in Missouri and Illinois.

## Purpose and publication boundary

This package consolidates source-backed research into a **protected reviewer input**. It does **not** connect to a database, create or update a business, create a map pin, modify the website or mobile app, change Kinfolk retrieval, or modify users, authentication, passwords, reset flows, sessions, tester access, approvals, or waitlist records.

A research candidate is not a public listing. It must be staged into the protected review environment, reconciled against existing directory records, individually approved by an authorized reviewer, and—where appropriate—geocoded server-side before it becomes searchable or appears as a map pin. A destination check is a point-in-time technical signal, not proof that a business is open, licensed, accessible, culturally affiliated, or suitable for a specific member.

## Integrity and composition

| Measure | Count |
|---|---:|
| Source-pass candidate rows received | 34 |
| Structurally complete consolidated candidates | 34 |
| Package-level structural holds | 1 |
| Exact cross-source duplicates removed | 0 |
| Same-destination collisions requiring reconciliation | 0 |
| Review-only candidates in the manifest | **33** |
| `pending_review` candidates | 30 |
| `needs_research` candidates | 3 |
| Research-pass held records, outside the manifest | 12 |

The review manifest SHA-256 is:

```text
6a4f8fbec2d9b5648fb0c374abf26c0bb49cb75be11a63d8187c98d44995b46a
```

Do not edit the manifest after this checksum is recorded. Correct a source record by rebuilding the package and rerunning the destination-health check.

| Review route | Candidates | Publication rule |
|---|---:|---|
| Commercial business | 16 | Reconcile duplicates, confirm the customer-facing official destination, review the street address, use server-side geocoding, and approve before creating any listing or map pin. |
| Regulated-review lead | 1 | Keep out of commercial publication until a reviewer verifies appropriate licensing or authority evidence. |
| Community resource | 11 | Review in the resource route; the addressless San Antonio chamber remains mapless and must not be converted into a commercial listing. |
| Cultural place | 5 | Review in the cultural/discovery route; do not create a commercial business or map pin. |

## Automated destination check

The manifest references **34 distinct customer destinations**. The bounded verification pass recorded **31 reachable** destinations, **1 non-success response requiring review**, and **2 timeouts**. Those three corresponding candidates are marked `needs_research`; none is described as closed or removed. One structurally complete source record with no valid customer-facing destination is retained in the package hold file rather than the review manifest.

## Source evidence

Detailed URL-by-URL evidence, direct source language, and limitations remain with the package:

- [San Antonio source report](../source-reports/san-antonio-source-report.md) documents 50 inspected public pages, 11 retained candidates, and 8 evidence-gated records.
- [Kansas City source report](../source-reports/kansas-city-source-report.md) documents 32 inspected public pages, 16 retained candidates, and 4 evidence-gated records.
- [St. Louis source report](../source-reports/st-louis-source-report.md) documents 12 inspected public pages and 7 retained candidates.

Sources include public Black and Hispanic business directories/chambers, public county or local-government guides, official tourism/editorial guides, community and cultural institutions, and first-party customer destinations. Source reports preserve publisher/business designations only when directly stated; **membership in a chamber or appearance in a directory is not an ownership certification**. No ownership, identity, language ability, hours, accessibility accommodation, licensing, health claim, or other fact may be inferred merely from a name, source category, neighborhood, or image.

## Files

| File | Role |
|---|---|
| `sixth-three-city-combined-review-only-candidates.jsonl` | Checksum-pinned reviewer manifest. |
| `sixth-three-city-combined-review-summary.json` | Candidate, route, status, and checksum summary. |
| `sixth-three-city-combined-destination-health.json` | Point-in-time destination technical outcomes. |
| `sixth-three-city-combined-review-held-candidates.jsonl` | Package-level hold for the missing customer destination. |
| `../consolidated/sixth-three-city-invalid-or-incomplete-rows-held.json` | Structural exclusion report. |
| `../consolidated/sixth-three-city-exact-duplicates-removed.json` | Exact duplicate report. |
| `../consolidated/sixth-three-city-destination-collisions-review.json` | Potential same-destination collision report. |
| `../source-passes/*.jsonl` | Reproducible source-pass inputs. |

## Reviewer procedure

1. Verify the manifest checksum above before staging.
2. Run only the existing protected **dry-run** importer first and confirm it reports **zero publication writes**.
3. Stage this package only in the authorized local review database, never directly in the production directory database.
4. Reconcile every candidate with existing live businesses. Link or enrich an existing record rather than creating a duplicate.
5. For commercial physical businesses, verify the current official customer destination, confirm the street address, use the protected server-side geocoder, inspect the coordinate result, and approve only then. A listing is not a map pin until this occurs.
6. Keep addressless community resources mapless. Do not manufacture an address, coordinate, directions action, or pin.
7. Route regulated, community, and cultural candidates to their distinct review paths. Do not turn them into commercial listings.
8. Maintain the three `needs_research` holds until a reviewer obtains current destination evidence; treat a timeout or non-success result as an evidence gate, not a closure claim.
9. After publication of an approved subset, verify exact-name and reasonable-misspelling search, locality/relevance behavior, business-detail link destinations, map-pin click-through, and authenticated Kinfolk local recommendations against the actual public API and clients.

> **No raw research record should be publicly visible merely because it is present in this package.** The review boundary prevents duplicate, stale, mislocated, unsupported, or improperly categorized information from reaching users.
