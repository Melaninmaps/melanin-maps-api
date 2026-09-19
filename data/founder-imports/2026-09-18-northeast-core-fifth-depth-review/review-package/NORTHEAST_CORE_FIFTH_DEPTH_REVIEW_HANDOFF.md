# Philadelphia, Tri-State, and New York City Fifth-Depth Review Handoff

**Package status: NOT PUBLISHED.** This is a protected, source-backed review package. It cannot create a production database record, map pin, geocode result, public listing, Kinfolk retrieval entry, or website/mobile change. It must move through the authorized reviewer staging and approval workflow before any data becomes public.

## What this package contains

This package is the cumulative fifth-depth Northeast core research set. It combines the five focused research depths for **Philadelphia city, Pennsylvania suburbs, New Jersey, Delaware, and New York City**. The fifth depth added 42 new raw candidates after regional source and customer-destination checks. The cumulative review manifest contains **401 distinct review candidates** after consolidation and duplicate removal. This is a replacement cumulative count for the focused core package; it must **not** be added to the earlier 359-candidate package or to the separate 1,336-record tri-state package.

| Measure | Result |
|---|---:|
| Raw candidate rows across five focused depths | 402 |
| Cumulative review candidates | 401 |
| Exact duplicate removed during consolidation | 1 |
| Pre-consolidation source leads held outside the manifest | 277 |
| Preliminary `pending_review` candidates | 359 |
| Preliminary `needs_research` candidates | 42 |
| Customer destinations checked | 453 unique destinations |
| Reachable customer destinations | 409 |
| Network errors | 5 |
| Timeouts | 4 |
| Review-required destinations | 35 |

The review manifest SHA-256 is:

```text
0af7f80a79f9a2b9a5c92700165209ee8505a0990464cd6f7676b580d14b9c4c
```

Verify that value against the exact manifest before staging. Do not substitute a later file, concatenate packages, or alter the manifest without issuing a new checksum and reviewer handoff.

## Candidate routing

| Review route | Candidates | Publication rule |
|---|---:|---|
| `business` | 241 | May be considered for staged review only after record reconciliation, source/official-destination review, and controlled address/geocode approval. |
| `online_business` | 5 | Customer destinations are retained, but these records are mapless and must not receive a fabricated address or pin. |
| `regulated_review` | 92 | Requires licensing, authority, and scope review before any publication. |
| `community_resource` | 52 | Must remain outside the commercial map-pin route unless a later policy explicitly allows otherwise. |
| `cultural_place` | 11 | Must remain outside the commercial map-pin route unless a later policy explicitly allows otherwise. |

The manifest contains **no coordinate fields**. Every physical-business candidate has a numbered address. The five online-only records have no address and remain intentionally mapless. Ownership and demographic designations are source-attributed only; missing evidence remains `null` and must not be inferred from a name, imagery, neighborhood, or source category.

## Required protected-review sequence

Follow the authoritative protected-publication runbook at `docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md` from the authorized reviewer environment.

1. Confirm the manifest checksum shown above and stage **only** `northeast-core-fifth-depth-combined-review-only-candidates.jsonl`.
2. Reconcile each staged record with the current production inventory. Preserve existing records and relationships; do not overwrite or delete them as a side effect of enrichment.
3. Exclude the 42 `needs_research` candidates until the review concern has been resolved. A timeout, network error, or non-success response is a review signal, not proof that a business has closed.
4. Review official customer destinations, source attribution, name/address match, category route, and any ownership/designation evidence. Keep unknown information as unknown.
5. Route all regulated records through authority and licensing review. Keep community resources and cultural places out of the commercial map-pin publication flow.
6. Only after explicit reviewer approval, use the controlled geocoding path for approved physical-business records with confirmed numbered addresses. Never geocode an online-only record or invent coordinates.
7. Publish only through the protected route, then verify public API search, locality/relevance/typo behavior, listing details, official links, map-pin click-through, and authenticated Kinfolk recommendations. State live counts only after those checks succeed.

## Files for the reviewer

| File | Purpose |
|---|---|
| `northeast-core-fifth-depth-combined-review-only-candidates.jsonl` | The sole cumulative review manifest for protected staging. |
| `northeast-core-fifth-depth-combined-review-summary.json` | Counts, checksum, type routes, health summary, and safeguards. |
| `../consolidated/northeast-core-fifth-depth-combined-destination-health.json` | Bounded customer-destination health outcomes. |
| `../held/` | 277 source leads held before consolidation; these are not bulk-import candidates. |
| `../source-reports/` | Evidence ledgers for the five sources/depths. |
| `../consolidated/northeast-core-fifth-depth-exact-duplicates-removed.json` | Exact deduplication audit. |
| `../consolidated/northeast-core-fifth-depth-destination-collisions-review.json` | Customer-destination collision review. |

## Validation completed before handoff

The manifest was parsed as JSONL and verified to contain 401 sequential rows with the expected package schema. No string value equal to `"null"` and no latitude, longitude, or coordinate field was found. A normalized name/city/state/country/address duplicate check returned zero duplicates. The source-held records remain outside the review manifest. These checks support protected review only; they are not approval, publication, deployment, native-build, or store-release evidence.
