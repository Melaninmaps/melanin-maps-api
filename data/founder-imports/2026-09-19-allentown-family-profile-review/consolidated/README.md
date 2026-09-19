# allentown family profile Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial allentown-family-profile pass produced 58 source records. The consolidation retained 57 structurally complete candidates after removing 1 exact normalized cross-source duplicates and holding 0 incomplete rows outside the package. 1 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

56 candidates have a source-backed physical street address. 16 commercial candidates could proceed to a later protected map-pin review after duplicate reconciliation, current-destination verification, and guarded server-side geocoding. 0 community resources have no qualifying street address and remain explicitly mapless. 1 candidates are valid online-only services or shops; they may be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 58 |
| Consolidated candidates | 57 |
| Exact duplicates removed | 1 |
| Incomplete rows held | 0 |
| Address-backed candidates | 56 |
| Commercial map-pin review candidates | 16 |
| Explicitly mapless community resources | 0 |
| Online-only candidates | 1 |
| Same-destination review collisions | 1 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is allentown-family-profile-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is e8ab0f9be1b960af11832108a48fc2e3d036e6968caea340b4a0f0e8a935f36d.
