# Tampa Bay, Orlando, and Jacksonville Directory Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT STAGED OR PUBLISHED**

**Package date:** 2026-09-18
**Geography:** Tampa Bay; Orlando and nearby Central Florida communities; Jacksonville and nearby Northeast Florida communities.

## Purpose and publication boundary

This package consolidates source-backed local directory research into a **protected reviewer input**. It does **not** connect to a database, create or update a business, create a map pin, modify the website or mobile app, change Kinfolk retrieval, or modify users, authentication, passwords, reset flows, sessions, tester access, approvals, or waitlist records.

A research candidate is not a public listing. It must be staged into the protected review environment, reconciled against existing directory records, individually approved by an authorized reviewer, and—where appropriate—geocoded server-side before it becomes searchable or appears as a map pin. A successful destination check is only a point-in-time technical signal; it is not proof that a business is open, licensed, accessible, culturally affiliated, or suitable for a specific member.

## Integrity and composition

| Measure | Count |
|---|---:|
| Source-pass candidate rows received | 39 |
| Structurally complete consolidated candidates | 39 |
| Package-level structural holds | 0 |
| Exact cross-source duplicates removed | 0 |
| Same-destination collisions requiring reconciliation | 0 |
| Review-only candidates in the manifest | **39** |
| `pending_review` candidates | 38 |
| `needs_research` candidates | 1 |
| Research-pass held records, outside the manifest | 28 |

The review manifest SHA-256 is:

```text
ed8a5fb3a64f63ce6c7e1ad648060556f9c3320f7c2a40d429e4e8eb0ef5c860
```

Do not edit the manifest after this checksum is recorded. Correct a source record by rebuilding the package and rerunning the destination-health check.

| Review route | Candidates | Publication rule |
|---|---:|---|
| Commercial business | 21 | Reconcile duplicates, confirm the customer-facing official destination, review the street address, obtain server-side geocoding, and approve before creating any listing or map pin. |
| Online-only business | 2 | Confirm the customer destination and reviewer approval; it may be searchable after approval but must remain addressless and mapless. |
| Regulated-review lead | 2 | Keep out of commercial publication until a reviewer verifies appropriate licensing or authority evidence. |
| Community resource | 9 | Review in the resource route; a resource with no supported street address remains mapless and must not be converted into a commercial listing. |
| Cultural place | 5 | Review in the cultural/discovery route; do not create a commercial business or map pin. |

## Automated destination check

The retained candidates reference **47 distinct customer destinations**. The bounded verification pass recorded **46 reachable** destinations and **1 non-success response requiring review**. The affected candidate is marked `needs_research`; it is not described as closed or removed.

## Source evidence

The detailed URL-by-URL evidence, direct source language, and limitations are retained with the package:

- [Tampa Bay source report](../source-reports/tampa-source-report.md) documents 44 inspected public pages, 17 retained candidates, and 8 evidence-gated records.
- [Orlando source report](../source-reports/orlando-source-report.md) documents 36 inspected public pages, 8 retained candidates, and 5 evidence-gated records.
- [Jacksonville source report](../source-reports/jacksonville-source-report.md) documents 52 inspected public pages, 14 retained candidates, and 15 evidence-gated records.

The sources include public Black and Hispanic business directories/chambers, official tourism or government guides, community and cultural institutions, and first-party customer destinations. Source reports preserve publisher/business designations only when directly stated; **membership in a chamber or appearance in a directory is not an ownership certification**. No ownership, identity, language ability, hours, accessibility accommodation, licensing, health claim, or other fact may be inferred merely from a name, source category, neighborhood, or image.

## Files

| File | Role |
|---|---|
| `fifth-three-city-combined-review-only-candidates.jsonl` | Checksum-pinned reviewer manifest. |
| `fifth-three-city-combined-review-summary.json` | Candidate, route, status, and checksum summary. |
| `fifth-three-city-combined-destination-health.json` | Point-in-time destination technical outcomes. |
| `fifth-three-city-combined-review-held-candidates.jsonl` | Package-level holds; empty for this build. |
| `../consolidated/fifth-three-city-invalid-or-incomplete-rows-held.json` | Structural exclusion report. |
| `../consolidated/fifth-three-city-exact-duplicates-removed.json` | Exact duplicate report. |
| `../consolidated/fifth-three-city-destination-collisions-review.json` | Potential same-destination collision report. |
| `../source-passes/*.jsonl` | Reproducible source-pass inputs. |

## Reviewer procedure

1. Verify the manifest checksum above before staging.
2. Run only the existing protected **dry-run** importer first and confirm it reports **zero publication writes**.
3. Stage this package only in the authorized local review database, never directly in the production directory database.
4. Reconcile every candidate with existing live businesses. Link or enrich an existing record rather than creating a duplicate.
5. For a commercial physical business, verify the current official customer destination, confirm the street address, use the protected server-side geocoder, examine the coordinate result, and approve only then. A listing is not a map pin until this happens.
6. Keep online-only businesses and addressless community resources mapless. Do not manufacture an address, coordinate, directions action, or pin.
7. Route regulated, community, and cultural candidates to their distinct review paths. Do not turn them into commercial listings.
8. Maintain the `needs_research` hold for any candidate whose destination was not confirmed reachable until a reviewer obtains current evidence.
9. After publication of an approved subset, verify exact-name and reasonable-misspelling search, locality/relevance behavior, business-detail link destinations, map-pin click-through, and authenticated Kinfolk local recommendations against the actual public API and clients.

> **No raw research record should be publicly visible merely because it is present in this package.** The review boundary prevents duplicate, stale, mislocated, unsupported, or improperly categorized information from reaching users.
