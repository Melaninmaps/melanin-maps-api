# Philadelphia, Tri-State, and New York City Cumulative Launch Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT PUBLISHED.** This package has no production database connection. It does not create public directory records, map pins, Kinfolk retrieval data, user records, authentication changes, password changes, waitlist changes, membership changes, or payment changes.

## Scope

This cumulative package combines three source-backed collection passes for the requested launch geography: **Philadelphia city; Pennsylvania suburbs around Philadelphia; New Jersey; Delaware; and New York City**. It is an additive evidence collection, not a complete inventory and not a certification that any listed destination is currently operating.

| Measure | Count |
| --- | ---: |
| Source records examined after per-wave screening | 252 |
| Consolidated review candidates | 251 |
| Exact cross-source duplicate removed during consolidation | 1 |
| `business` candidates | 150 |
| `online_business` candidates | 5 |
| `regulated_review` candidates | 68 |
| `community_resource` candidates | 22 |
| `cultural_place` candidates | 6 |
| Physical commercial candidates eligible for later map-pin review | 150 |
| Explicit online-only/mapless candidates | 5 |
| Source leads held before consolidation | 159 |
| Candidate customer destinations checked | 287 unique URLs |
| Reachable destination checks | 272 |
| Network-error destination checks | 1 |
| Timed-out destination checks | 1 |
| Non-success checks requiring research | 13 |
| Initial `pending_review` candidates | 236 |
| Initial `needs_research` candidates | 15 |

The cumulative review manifest SHA-256 is **`5b691b9f2e6095cb8c6458ceadc3ec158586305d85e828733b52a80bef274155`**.

## Evidence boundary

Each review candidate includes a public source URL and an inspected customer-facing official website or official business-social destination. Physical candidates have a source-supported numbered street address. Explicit online-only candidates have no fabricated address or coordinate and must remain mapless.

The package does **not** certify current operation, ownership, demographics, culture, language, licensure, safety, quality, accessibility, price, availability, hours, or service suitability. Where a public source uses designation wording, it is retained only as source-attributed evidence rather than inferred by Mapping with Melanin.

## Files

| File | Purpose |
| --- | --- |
| `northeast-core-launch-combined-review-only-candidates.jsonl` | Exact 251-record review manifest; the sole candidate input for protected staging. |
| `northeast-core-launch-combined-review-summary.json` | Candidate counts, review states, safeguards, and the manifest checksum. |
| `northeast-core-launch-combined-destination-health.json` | Packaged copy of bounded destination-health outcomes. |
| `northeast-core-launch-combined-review-held-candidates.jsonl` | Candidates held by package-eligibility policy, if any. |
| `northeast-core-launch-source-held-candidates.jsonl` | 159 leads excluded before consolidation because their evidence was incomplete, conflicting, stale, duplicate, unsupported, or otherwise unsuitable for this manifest. |
| `../consolidated/northeast-core-launch-combined-destination-health.json` | Full destination-health output. A failed, blocked, timed-out, or non-success response is a reviewer signal—not a closure determination. |
| `../consolidated/northeast-core-launch-destination-collisions-review.json` | Destination-collision report for manual review. |
| `../source-reports/` | Fifteen source reports with every inspected URL, source family, category coverage, dedupe method, record disposition, and research boundary. |

## Protected review and publication procedure

1. **Verify identity before staging.** Recalculate SHA-256 for `northeast-core-launch-combined-review-only-candidates.jsonl`; it must equal the checksum above.
2. **Stage only through protected reviewer routes.** Never run a direct production import or use raw/held files as import inputs.
3. **Reconcile with the live directory.** Review normalized name, address, city, region, country, phone, and official destination. A suspected duplicate requires a reviewer decision—never an automatic overwrite or deletion.
4. **Clear the 15 `needs_research` gates.** Re-inspect official identity and current destination evidence. Destination check errors do not establish closure.
5. **Apply type-specific review.** `regulated_review` records need the appropriate licensing/authority review; `community_resource` and `cultural_place` records remain on noncommercial routes; `online_business` records may be searchable after approval but must never get a map pin; only `business` records may move toward the commercial map-pin path.
6. **Geocode only approved physical commercial records.** Use confirmed addresses in the controlled geocoding workflow and reject ambiguous results. Do not geocode online-only, cultural, community-resource, or unapproved/regulated records.
7. **Approve through protected reviewer controls.** Preserve source URLs and official customer destinations; do not infer claims or substitute third-party destinations.
8. **Verify after publication.** Check public API and UI results by exact name, relevant terms, location, sensible typo clarification, listing-detail page, official link, and approved map-pin click-through. Then verify authenticated Kinfolk local recommendations against the actually published listings.

## Publication rule

**No record is live merely because this package is merged into GitHub.** Live availability requires protected staging, reconciliation, destination review, type routing, controlled geocoding where applicable, reviewer approval, publication, and public API/UI verification.

## Continuation priority

Continue research only in this order: **Philadelphia city and Pennsylvania suburbs; New Jersey; Delaware; New York City.** Keep using unexhausted high-yield public source families and a broad everyday-life category mix. Do not shift collection capacity to other domestic or international cities until this core launch geography has the requested depth.
