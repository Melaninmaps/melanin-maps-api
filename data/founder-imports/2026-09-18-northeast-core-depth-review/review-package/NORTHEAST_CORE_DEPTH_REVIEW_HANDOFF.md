# Philadelphia, Tri-State, and New York City Depth Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT PUBLISHED.** This package is not connected to a production database. It does not create public directory entries, map pins, Kinfolk retrieval data, user records, authentication changes, password changes, waitlist changes, membership changes, or payment changes.

## Scope

This package consolidates two focused source-backed passes for **Philadelphia city; Pennsylvania suburbs around Philadelphia; New Jersey; Delaware; and New York City**. It is an additive research package that supplements earlier evidence. It is not a complete inventory for any location and it does not certify that a destination is currently operating.

| Measure | Count |
| --- | ---: |
| Source records consolidated | 151 |
| Review candidates | 151 |
| `business` candidates | 82 |
| `online_business` candidates | 4 |
| `regulated_review` candidates | 48 |
| `community_resource` candidates | 13 |
| `cultural_place` candidates | 4 |
| Physical commercial candidates eligible for later map-pin review | 82 |
| Online-only/mapless candidates | 4 |
| Source leads held before consolidation | 107 |
| Candidate customer destinations checked | 187 unique URLs |
| Reachable destination checks | 177 |
| Network-error destination checks | 1 |
| Timed-out destination checks | 1 |
| Non-success checks requiring research | 8 |
| Initial `pending_review` candidates | 141 |
| Initial `needs_research` candidates | 10 |

The review manifest SHA-256 is **`2cfbe50a3f744ac71ac17e06968781ee452202019f6b443d10ec5f3030ecede0`**.

## Evidence boundary

Every review candidate has a public source URL and an inspected customer-facing official website or official business-social destination. Physical candidates have a source-supported numbered street address. Online-only candidates are explicitly mapless and have no fabricated address or coordinates.

This evidence is **not** a certification of a business’s current operation, ownership, demographics, culture, language, licensure, safety, quality, accessibility, price, availability, hours, or service suitability. Where any designation is present, it remains attributed to the public source in the record rather than inferred by Mapping with Melanin.

## Files

| File | Purpose |
| --- | --- |
| `northeast-core-depth-combined-review-only-candidates.jsonl` | Exact 151-record review manifest; this is the only candidate input for protected staging. |
| `northeast-core-depth-combined-review-summary.json` | Counts, review states, safeguards, and the manifest checksum. |
| `northeast-core-depth-combined-destination-health.json` | A copy of the bounded destination-health report used in the package. |
| `northeast-core-depth-combined-review-held-candidates.jsonl` | Candidates held by package eligibility policy, if any. |
| `northeast-core-depth-source-held-candidates.jsonl` | The 107 source leads excluded before consolidation because their evidence was incomplete, conflicting, stale, duplicate, unsupported, or otherwise unsuitable for the review manifest. |
| `../consolidated/northeast-core-depth-combined-destination-health.json` | Full destination-check outcomes. A non-success is a review signal, not evidence that a business has closed. |
| `../consolidated/northeast-core-depth-destination-collisions-review.json` | Customer-destination collision report for manual reconciliation. |
| `../source-reports/` | Ten geographic source reports with URL logs, source families, record dispositions, dedupe methods, and category coverage. |

## Protected review procedure

1. **Verify manifest identity.** Recalculate SHA-256 for `northeast-core-depth-combined-review-only-candidates.jsonl`; it must equal the checksum above before staging.
2. **Stage only through the protected directory review route.** Never directly import this manifest into production and never bulk-import raw source or held files.
3. **Reconcile each candidate with the live directory.** Match normalized name, address, city, region, country, phone, and official destination. A possible duplicate is a reviewer decision; do not auto-overwrite or delete an existing listing.
4. **Clear all ten `needs_research` gates.** Re-inspect customer-destination identity and the source evidence. HTTP errors, timeouts, blocks, and non-success responses are not closure determinations.
5. **Route by target type.** `regulated_review` records require the applicable licensing/authority workflow before public display. `community_resource` and `cultural_place` records remain in noncommercial routes. `online_business` records can be searchable only after approval and must remain mapless. Only `business` candidates may proceed toward a commercial map pin.
6. **Geocode only approved physical commercial records.** Use confirmed addresses through the controlled server-side geocode workflow; reject ambiguous results. Do not geocode online-only, cultural, community-resource, or unapproved/regulated records.
7. **Approve through protected reviewer controls.** Preserve evidence URLs and provenance. Do not infer attributes or replace official destinations with third-party links.
8. **Publish only approved records.** Verify real post-publication behavior in `/api/businesses`, search by name/relevant terms/location/typos, business details, official links, approved map-pin click-through, and authenticated Kinfolk local recommendations.

## Publication rule

**No record in this package is live solely because the research package is merged into GitHub.** Publication requires protected staging, reconciliation, current destination/identity review, category routing, controlled geocoding where applicable, approval, public publication, and API/UI verification.

## Continuation priority

Continue research in this order only: **Philadelphia city and Pennsylvania suburbs; New Jersey; Delaware; New York City.** Use new high-yield source families and diverse everyday-need categories. Do not shift capacity to other domestic or international cities until this core geography has the requested depth.
