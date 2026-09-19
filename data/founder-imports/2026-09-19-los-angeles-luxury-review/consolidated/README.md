# Los Angeles Luxury Adult Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial los-angeles-luxury pass produced 433 source records. The consolidation retained 416 structurally complete candidates after removing 17 exact normalized cross-source duplicates and holding 0 incomplete rows outside the package. 4 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

407 candidates have a source-backed physical street address. 310 commercial candidates could proceed to a later protected map-pin review after duplicate reconciliation, current-destination verification, and guarded server-side geocoding. 5 community resources have no qualifying street address and remain explicitly mapless. 4 candidates are valid online-only services or shops; they may be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 433 |
| Consolidated candidates | 416 |
| Exact duplicates removed | 17 |
| Incomplete rows held | 0 |
| Address-backed candidates | 407 |
| Commercial map-pin review candidates | 310 |
| Explicitly mapless community resources | 5 |
| Online-only candidates | 4 |
| Same-destination review collisions | 4 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is los-angeles-luxury-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is 3261a1dd1e5bf69bbc229a71ebc3846954e013b07a1b0b0db915c92fd2fe6d02.
