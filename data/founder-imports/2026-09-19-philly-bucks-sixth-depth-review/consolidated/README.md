# Philadelphia and Bucks County Sixth-Depth Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial philly-bucks-sixth-depth pass produced 83 source records. The consolidation retained 80 structurally complete candidates after removing 3 exact normalized cross-source duplicates and holding 2 incomplete rows outside the package. 0 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

75 candidates have a source-backed physical street address. 25 commercial candidates could proceed to a later protected map-pin review after duplicate reconciliation, current-destination verification, and guarded server-side geocoding. 4 community resources have no qualifying street address and remain explicitly mapless. 1 candidates are valid online-only services or shops; they may be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 83 |
| Consolidated candidates | 80 |
| Exact duplicates removed | 3 |
| Incomplete rows held | 2 |
| Address-backed candidates | 75 |
| Commercial map-pin review candidates | 25 |
| Explicitly mapless community resources | 4 |
| Online-only candidates | 1 |
| Same-destination review collisions | 0 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is philly-bucks-sixth-depth-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is e0281361b35660fa4ac49a33564245465549a6e4358296852fe2cc07f5f642b5.
