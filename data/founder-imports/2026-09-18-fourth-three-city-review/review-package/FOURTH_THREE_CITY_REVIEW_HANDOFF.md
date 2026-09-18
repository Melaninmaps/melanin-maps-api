# Dallas–Fort Worth, Miami–Fort Lauderdale, and New York City Directory Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT STAGED OR PUBLISHED**

**Package date:** 2026-09-18
**Geography:** Dallas–Fort Worth and nearby Texas communities; Miami–Fort Lauderdale and nearby South Florida communities; New York City and nearby boroughs.

## Purpose and publication boundary

This package consolidates source-backed local directory research into a **protected reviewer input**. It does **not** connect to a database, create or update a business, create a map pin, modify the website or mobile app, change Kinfolk retrieval, or modify users, authentication, passwords, reset flows, sessions, tester access, approvals, or waitlist records.

A research candidate is not a public listing. It must be staged into the protected review environment, reconciled against existing directory records, individually approved by an authorized reviewer, and—where appropriate—geocoded server-side before it becomes searchable or appears as a map pin. A successful destination check is only a point-in-time technical signal; it is not proof that a business is open, licensed, accessible, culturally affiliated, or suitable for a specific member.

## Integrity and composition

| Measure | Count |
|---|---:|
| Source-pass candidate rows received | 52 |
| Structurally complete consolidated candidates | 52 |
| Package-level structural holds | 0 |
| Exact cross-source duplicates removed | 0 |
| Same-destination collisions requiring reconciliation | 0 |
| Review-only candidates in the manifest | **52** |
| `pending_review` candidates | 49 |
| `needs_research` candidates | 3 |
| Research-pass held records, outside the manifest | 23 |

The review manifest SHA-256 is:

```text
e1cb6f9c61bed0ff6f4406ecec7a10197e2a6b92d794c09a1ba34da26b32ef6c
```

Do not edit the manifest after this checksum is recorded. Correct a source record by rebuilding the package and rerunning the destination-health check.

| Review route | Candidates | Publication rule |
|---|---:|---|
| Commercial business | 29 | Reconcile duplicates, confirm the customer-facing official destination, review the street address, obtain server-side geocoding, and approve before creating any listing or map pin. |
| Community resource | 9 | Review in the resource route; do not create a commercial business or map pin. |
| Cultural place | 14 | Review in the cultural/discovery route; do not create a commercial business or map pin. |

## Automated destination check

The retained candidates reference **56 distinct customer destinations**. The bounded verification pass recorded **53 reachable** destinations and **3 non-success responses requiring review**. The three affected candidates are marked `needs_research`; they are not described as closed or removed.

There are no online-only or regulated-review records in this specific package. This does not change how those categories are handled in other packages: online-only services remain addressless and mapless, and regulated services remain subject to their specialized authority/licensing review route.

## Source evidence

The detailed URL-by-URL evidence, direct source language, and limitations are retained with the package:

- [Dallas–Fort Worth source report](../source-reports/dallas-source-report.md) documents 53 inspected public pages, 11 retained candidates, and 11 evidence-gated records.
- [Miami–Fort Lauderdale source report](../source-reports/miami-source-report.md) documents 60 inspected public pages, 21 retained candidates, and 5 evidence-gated records.
- [New York City source report](../source-reports/new-york-city-source-report.md) documents 43 inspected public pages, 20 retained candidates, and 7 evidence-gated records.

The sources include public Black and Hispanic business directories/chambers, official tourism or government guides, community and cultural institutions, and first-party customer destinations. Source reports preserve publisher/business designations only when directly stated; **membership in a chamber or appearance in a directory is not an ownership certification**. No ownership, identity, language ability, hours, accessibility accommodation, licensing, health claim, or other fact may be inferred merely from a name, source category, neighborhood, or image.

## Files

| File | Role |
|---|---|
| `fourth-three-city-combined-review-only-candidates.jsonl` | Checksum-pinned reviewer manifest. |
| `fourth-three-city-combined-review-summary.json` | Candidate, route, status, and checksum summary. |
| `fourth-three-city-combined-destination-health.json` | Point-in-time destination technical outcomes. |
| `fourth-three-city-combined-review-held-candidates.jsonl` | Package-level holds; empty for this build. |
| `../consolidated/fourth-three-city-invalid-or-incomplete-rows-held.json` | Structural exclusion report. |
| `../consolidated/fourth-three-city-exact-duplicates-removed.json` | Exact duplicate report. |
| `../consolidated/fourth-three-city-destination-collisions-review.json` | Potential same-destination collision report. |
| `../source-passes/*.jsonl` | Reproducible source-pass inputs. |

## Reviewer procedure

1. Verify the manifest checksum above before staging.
2. Run only the existing protected **dry-run** importer first and confirm it reports **zero publication writes**.
3. Stage this package only in the authorized local review database, never directly in the production directory database.
4. Reconcile every candidate with existing live businesses. Link or enrich an existing record rather than creating a duplicate.
5. For a commercial physical business, verify the current official customer destination, confirm the street address, use the protected server-side geocoder, examine the coordinate result, and approve only then. A listing is not a map pin until this happens.
6. Maintain the `needs_research` hold for any candidate whose destination was not confirmed reachable until a reviewer obtains current evidence.
7. After publication of an approved subset, verify exact-name and reasonable-misspelling search, locality/relevance behavior, business-detail link destinations, map-pin click-through, and authenticated Kinfolk local recommendations against the actual public API and clients.

> **No raw research record should be publicly visible merely because it is present in this package.** The review boundary prevents duplicate, stale, mislocated, or unsupported information from reaching users.
