# Houston Cumulative Everyday Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial houston-cumulative-everyday pass produced 454 source records. The consolidation retained 396 structurally complete candidates after removing 58 exact normalized cross-source duplicates and holding 1 incomplete rows outside the package. 22 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

382 candidates have a source-backed physical street address. 200 commercial candidates could proceed to a later protected map-pin review after duplicate reconciliation, current-destination verification, and guarded server-side geocoding. 7 community resources have no qualifying street address and remain explicitly mapless. 7 candidates are valid online-only services or shops; they may be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 454 |
| Consolidated candidates | 396 |
| Exact duplicates removed | 58 |
| Incomplete rows held | 1 |
| Address-backed candidates | 382 |
| Commercial map-pin review candidates | 200 |
| Explicitly mapless community resources | 7 |
| Online-only candidates | 7 |
| Same-destination review collisions | 22 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is houston-cumulative-everyday-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is 412bd96e6f6241380560d577c3a4a1380295f570576c5d2fcc71d5c07ba1468e.
