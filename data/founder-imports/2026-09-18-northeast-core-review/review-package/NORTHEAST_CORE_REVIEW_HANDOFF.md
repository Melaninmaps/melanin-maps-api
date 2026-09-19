# Philadelphia, Tri-State, and New York City Directory Review Package

**Status:** **RESEARCH AND REVIEW ONLY — NOT PUBLISHED.** This package is not connected to a production database. It does not create public business listings, map pins, Kinfolk retrieval data, user records, authentication changes, waitlist changes, password changes, or payment changes.

## Scope

This package consolidates a focused, source-backed expansion for **Philadelphia city; Pennsylvania suburbs around Philadelphia; New Jersey; Delaware; and New York City**. It supplements prior research packages; it is not a complete inventory for any area and it is not a claim that all covered destinations are currently operating.

| Measure | Count |
| --- | ---: |
| Source records consolidated | 68 |
| Review candidates | 68 |
| `business` candidates | 37 |
| `regulated_review` candidates | 22 |
| `community_resource` candidates | 8 |
| `cultural_place` candidates | 1 |
| Physical commercial candidates eligible for later map-pin review | 37 |
| Online-only candidates | 0 |
| Source leads held before consolidation | 52 |
| Candidate customer destinations checked | 73 unique URLs |
| Reachable destination checks | 68 |
| Destination checks requiring research | 5 |
| Initial `pending_review` candidates | 63 |
| Initial `needs_research` candidates | 5 |

The review manifest SHA-256 is **`0ced9cf88f04f34dec90b1802521fb4bc07a1e81addd91fc8aa4900ebd0c9a2a`**.

## Evidence boundary

Each review candidate has a public source URL and at least one customer-facing official website or official business-social destination. Physical candidates have a source-supported numbered street address. This is **not** a certification of current operation, ownership, demographics, culture, language, licensure, safety, quality, accessibility, price, availability, hours, or service suitability. Such attributes must not be inferred during review.

Publicly stated demographic or ownership language, where present, is source-attributed in the evidence record rather than treated as an independently verified claim. No candidate has latitude or longitude in this package. No artificial address, pin, or direction has been created.

## Files

| File | Purpose |
| --- | --- |
| `northeast-core-combined-review-only-candidates.jsonl` | The exact 68-record review manifest; this is the only candidate input to protected staging. |
| `northeast-core-combined-review-summary.json` | Counts, review states, safeguards, and manifest checksum. |
| `../consolidated/northeast-core-combined-destination-health.json` | Bounded current destination-check outcomes; non-success is a review signal, not a closure determination. |
| `../consolidated/northeast-core-destination-collisions-review.json` | Same-destination collision report for manual reconciliation. |
| `northeast-core-source-held-candidates.jsonl` | The 52 leads excluded before consolidation because their evidence was incomplete, conflicting, duplicate, unsupported, or otherwise unsuitable for this review manifest. |
| `../source-reports/` | Human-readable URL audit logs, evidence notes, geographic scopes, and source-family coverage for each contributing area. |

## Protected review procedure

1. **Verify manifest identity.** Recalculate SHA-256 for `northeast-core-combined-review-only-candidates.jsonl` and confirm it equals the checksum above before staging.
2. **Stage only through the protected directory review route.** Do not use a direct production write and do not bulk import raw source or held files.
3. **Reconcile with the live directory.** Match against existing records using normalized name, address, city, region, country, phone, and official customer destination. A possible duplicate is a reviewer decision, not an automatic overwrite or deletion.
4. **Review each current-destination gate.** The five `needs_research` records need a reviewer to inspect the HTTP outcome and official identity. A failed, blocked, timed-out, or non-success destination check is never evidence that a business has closed.
5. **Route by type.** Review `regulated_review` records for appropriate licensing/authority information before any public display. Keep `community_resource` and `cultural_place` records in their respective noncommercial review routes. Only eligible commercial `business` records may move toward the public commercial listing route.
6. **Geocode commercial physical records only after approval.** Use the confirmed address through the controlled geocode process, reject ambiguous results, and do not create map pins for resources, cultural records, regulated leads before their route completes, or any unsupported location.
7. **Approve individually or under protected bulk-review controls.** Approval must preserve source URLs, official customer destinations, and provenance. Do not silently replace public evidence with unverified data.
8. **Publish only approved records.** After publication, verify the public API and interface by full name, relevant terms, typo-tolerant search, locality, business detail page, official link, and map-pin click-through where a commercial physical map pin was approved. Verify authenticated Kinfolk retrieval only after the actual published listing index is updated.

## Resulting publication rule

**Do not call these 68 records live until protected staging, reviewer decisions, controlled geocoding where appropriate, publication, and public verification have all succeeded.** A GitHub merge of this package would document research tooling and evidence only; it would not publish directory data.

## Source areas

The source reports cover Philadelphia city; Bucks, Chester, Delaware, and Montgomery Counties in Pennsylvania; New Jersey; Delaware; and the five boroughs of New York City. They include public Black/Latino/diaspora source families, local chambers, municipal or business-improvement organization directories, and inspected official customer destinations. They intentionally retain a mixed everyday-life inventory rather than padding with restaurants.

## Continuation plan

Continue collection in this exact priority order: **Philadelphia city and Pennsylvania suburbs; New Jersey; Delaware; New York City**. For every new wave, preserve this same evidence, destination, duplicate, routing, geocode, and protected-publication boundary. Do not shift capacity to other cities or international areas until this core launch geography has reached the desired depth.
