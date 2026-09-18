# Birmingham, Columbia, and New Orleans Source-Backed Directory Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT STAGED OR PUBLISHED**
**Package date:** 2026-09-18
**Geography:** Birmingham and nearby Alabama suburbs; Columbia and nearby South Carolina suburbs; New Orleans and nearby southeast-Louisiana parishes.

## Purpose and publication boundary

This package consolidates bounded, source-backed local directory research into a **protected reviewer input**. It does **not** connect to a database, create or update a business, create a map pin, alter the website or mobile app, change Kinfolk retrieval, or modify users, authentication, passwords, reset flows, sessions, tester access, approvals, or waitlist records.

A candidate is not a public listing. The package must be staged into the protected review environment, reconciled against existing directory records, individually approved by an authorized reviewer, and—where appropriate—geocoded server-side before it becomes searchable or appears as a map pin. A successful destination check is only a point-in-time technical signal; it is not proof that a business is open, licensed, accessible, culturally affiliated, or suitable for a particular member.

## Integrity and composition

| Measure | Count |
|---|---:|
| Source-pass candidate rows received | 75 |
| Structurally complete consolidated candidates | 74 |
| Separate structural hold | 1 |
| Exact cross-source duplicates removed | 0 |
| Same-destination collisions requiring reconciliation | 0 |
| Review-only candidates in the manifest | **74** |
| `pending_review` destination status | 65 |
| `needs_research` destination status | 9 |
| Research-pass held records, outside the manifest | 23 |

The review manifest SHA-256 is:

```text
31cdcff1d885f4afb68e8f7fd685bf01b0db3ba98521ec7055ce053c4c27aa29
```

Do not edit the manifest after this checksum is recorded. Correct a source record by rebuilding the package and rerunning the destination-health check.

| Review route | Candidates | Publication rule |
|---|---:|---|
| Commercial business | 42 | Resolve duplicates; confirm the official destination; review the street address; obtain server-side geocoding; then approve before creating any listing or map pin. |
| Online-only business | 2 | Confirm the customer destination and reviewer approval; it may be searchable after approval but must remain addressless and mapless. |
| Regulated-review lead | 15 | Keep out of commercial publication until a reviewer verifies appropriate licensing or authority evidence. |
| Community resource | 8 | Review in the resource route; do not create a commercial business or map pin. |
| Cultural place | 7 | Review in the cultural/discovery route; do not create a commercial business or map pin. |

## Automated destination check

The retained candidates reference **89 distinct customer destinations**. The bounded verification pass recorded **80 reachable** destinations, **6 non-success responses requiring review**, and **3 network errors**. The nine candidates affected by non-reachable outcomes are marked `needs_research`; they are not described as closed or removed.

The separate structural hold is **Columbia SC 63: Our Story Matters**. Its source supported an online cultural platform but did not support a physical address. It is intentionally excluded from this physical/cultural package rather than being given an invented location or an inappropriate commercial classification.

## Source evidence

The detailed, URL-by-URL provenance and limitations are retained with the package:

- [Birmingham source report](../source-reports/birmingham-source-report.md) documents 50 inspected public pages, 33 retained candidates, and 10 records held for evidence gaps.
- [Columbia source report](../source-reports/columbia-source-report.md) documents 65 inspected public pages, 34 retained candidates, and 7 records held for evidence gaps.
- [New Orleans source report](../source-reports/new-orleans-source-report.md) documents 39 inspected public pages, 8 retained candidates, and 6 records held for evidence gaps.

Source reports distinguish publisher/business statements from chamber membership. No ownership designation, service fact, language ability, hours, accessibility accommodation, license, or other attribute should be inferred merely from a name, directory category, neighborhood, or image.

## Files

| File | Role |
|---|---|
| `third-three-city-combined-review-only-candidates.jsonl` | Checksum-pinned reviewer manifest. |
| `third-three-city-combined-review-summary.json` | Candidate, route, status, and checksum summary. |
| `third-three-city-combined-destination-health.json` | Point-in-time destination technical outcomes. |
| `third-three-city-combined-review-held-candidates.jsonl` | Package-level holds; empty for this build because the one structural hold was excluded during consolidation. |
| `../consolidated/third-three-city-invalid-or-incomplete-rows-held.json` | The separate structural hold and its precise reason. |
| `../consolidated/third-three-city-exact-duplicates-removed.json` | Exact duplicate report. |
| `../consolidated/third-three-city-destination-collisions-review.json` | Potential same-destination collision report. |
| `../source-passes/*.jsonl` | Source-pass inputs, retained for reproducibility. |

## Reviewer procedure

1. Verify the manifest checksum above before staging.
2. Run only the existing protected **dry-run** importer first and confirm it reports **zero publication writes**.
3. Stage the package only in the authorized local review database, never directly in the production directory database.
4. Reconcile each candidate with any existing live business. Link/enrich an existing record instead of creating a duplicate.
5. For a commercial physical business, verify the current official customer destination, confirm the street address, use the protected server-side geocoder, examine the coordinate result, and approve only then. A listing is not a map pin until this happens.
6. Route regulated, community, and cultural candidates to their distinct review paths. Do not turn them into commercial listings.
7. Maintain the `needs_research` hold for any candidate whose destination was not confirmed reachable until a reviewer obtains current evidence.
8. After publication of an approved subset, verify exact-name and reasonable-misspelling search, locality/relevance behavior, business-detail link destinations, map-pin click-through, and authenticated Kinfolk local recommendations against the actual public API and clients.

> **No raw research record should be publicly visible merely because it is present in this package.** This is the control that prevents duplicate, stale, mislocated, or unsupported information from reaching users.
