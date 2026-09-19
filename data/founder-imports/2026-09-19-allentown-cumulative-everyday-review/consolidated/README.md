# Allentown Cumulative Everyday Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial allentown-cumulative-everyday pass produced 192 source records. The consolidation retained 170 structurally complete candidates after removing 22 exact normalized cross-source duplicates and holding 0 incomplete rows outside the package. 5 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

169 candidates have a source-backed physical street address. 76 commercial candidates could proceed to a later protected map-pin review after duplicate reconciliation, current-destination verification, and guarded server-side geocoding. 0 community resources have no qualifying street address and remain explicitly mapless. 1 candidates are valid online-only services or shops; they may be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 192 |
| Consolidated candidates | 170 |
| Exact duplicates removed | 22 |
| Incomplete rows held | 0 |
| Address-backed candidates | 169 |
| Commercial map-pin review candidates | 76 |
| Explicitly mapless community resources | 0 |
| Online-only candidates | 1 |
| Same-destination review collisions | 5 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is allentown-cumulative-everyday-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is ad3b67e56b2954254b41bb62c62678b14d40ca62b0bb0bb0a4e1ac6816a57663.
