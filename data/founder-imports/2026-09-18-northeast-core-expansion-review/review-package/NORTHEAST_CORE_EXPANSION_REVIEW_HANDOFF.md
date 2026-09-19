# Philadelphia, Tri-State, and New York City Expanded Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT PUBLISHED.** This package does not connect to a production database. It cannot create public listings, map pins, Kinfolk retrieval entries, user records, authentication changes, password changes, waitlist changes, membership changes, or payment changes.

## Scope

This package consolidates **four additive, source-backed collection passes** for the requested launch geography: **Philadelphia city; Pennsylvania suburbs around Philadelphia; New Jersey; Delaware; and New York City**. It is not a complete inventory and does not certify that a destination is operating today.

| Measure | Count |
| --- | ---: |
| Source records consolidated after per-wave screening | 360 |
| Exact cross-source duplicate removed during consolidation | 1 |
| Review candidates | 359 |
| `business` candidates | 214 |
| `online_business` candidates | 5 |
| `regulated_review` candidates | 82 |
| `community_resource` candidates | 49 |
| `cultural_place` candidates | 9 |
| Physical commercial candidates eligible for later map-pin review | 214 |
| Explicit online-only/mapless candidates | 5 |
| Source leads held before consolidation | 228 |
| Candidate customer destinations checked | 407 unique URLs |
| Reachable destination checks | 374 |
| Network-error destination checks | 3 |
| Timed-out destination checks | 2 |
| Non-success checks requiring research | 28 |
| Initial `pending_review` candidates | 328 |
| Initial `needs_research` candidates | 31 |

The review manifest SHA-256 is **`0df140a700ff0d994ff5a0781b94ee6d4f42d06beb5a442780cf941e1a7859ca`**.

## Evidence boundary

Every candidate has a public source URL and an inspected customer-facing official website or official business-social destination. Physical candidates have a source-supported numbered street address. Explicit online-only candidates have no fabricated address or coordinate and must remain mapless.

This evidence does **not** establish current operation, ownership, demographic identity, culture, language, licensure, safety, quality, accessibility, price, availability, hours, or service suitability. Any public designation wording is preserved only as attributed source evidence; Mapping with Melanin must not infer it.

## Files

| File | Purpose |
| --- | --- |
| `northeast-core-expansion-combined-review-only-candidates.jsonl` | Exact 359-record review manifest; the only candidate input for protected staging. |
| `northeast-core-expansion-combined-review-summary.json` | Candidate counts, review states, safeguards, and the manifest checksum. |
| `northeast-core-expansion-combined-destination-health.json` | Packaged bounded destination-health results. |
| `northeast-core-expansion-combined-review-held-candidates.jsonl` | Candidates held by package eligibility policy, if any. |
| `northeast-core-expansion-source-held-candidates.jsonl` | 228 leads excluded before consolidation because their evidence was incomplete, conflicting, stale, duplicate, unsupported, or unsuitable for the review manifest. |
| `../consolidated/northeast-core-expansion-combined-destination-health.json` | Full destination health. A failed, blocked, timed-out, or non-success response is a reviewer signal—not a closure determination. |
| `../consolidated/northeast-core-expansion-destination-collisions-review.json` | Customer-destination collision report for manual reconciliation. |
| `../source-reports/` | Twenty geographic source reports that record every inspected URL, source family, category coverage, dedupe approach, record disposition, and research boundary. |

## Protected review and publication procedure

1. **Verify package identity.** Recalculate SHA-256 for `northeast-core-expansion-combined-review-only-candidates.jsonl`; it must equal the checksum above.
2. **Stage only through protected reviewer routes.** Do not bulk-import raw source or held files and do not execute a direct production write.
3. **Reconcile against the live directory.** Compare normalized name, address, city, region, country, phone, and official customer destination. A possible duplicate is a reviewer decision—never an automatic overwrite or deletion.
4. **Clear all 31 `needs_research` gates.** Re-inspect current identity and official customer destinations. A timeout, network error, block, or non-success response does not prove a business has closed.
5. **Route by target type.** `regulated_review` candidates need relevant licensing/authority review before any public listing. `community_resource` and `cultural_place` records remain outside commercial map-pin routes. `online_business` may be searchable after approval but must stay mapless. Only `business` candidates may move to commercial map-pin review.
6. **Geocode only approved physical commercial candidates.** Use confirmed addresses through controlled server-side geocoding, reject ambiguous results, and never geocode online-only, cultural, community-resource, unapproved, or regulated records.
7. **Approve through protected reviewer controls.** Preserve original source and official customer URLs. Do not infer claims or replace official destinations with third-party links.
8. **Verify after publication.** Test API and UI search by exact name, relevant terms, location, and reasonable typo clarification; then test listing detail, official link, approved map-pin click-through, and authenticated Kinfolk recommendations against the published dataset.

## Publication rule

**GitHub merge does not make these records live.** Public availability requires protected staging, reconciliation, destination review, type routing, controlled geocoding where applicable, reviewer approval, publication, and public API/UI verification.

## Continuation priority

Continue source research only in this order: **Philadelphia city and Pennsylvania suburbs; New Jersey; Delaware; New York City.** Use unexhausted high-yield public directories and broad everyday-life categories. Do not shift effort to other domestic or international cities until this core launch geography has substantially more validated depth.
