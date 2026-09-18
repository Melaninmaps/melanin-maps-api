# Tri-State Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial tri-state pass produced 2238 source records. The consolidation retained 1442 structurally complete candidates after removing 796 exact normalized cross-source duplicates and holding 193 incomplete rows outside the package. 124 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

1404 candidates have a physical address suitable for the later source-backed map-location review. 38 candidates are valid online-only services or shops. They can be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 2238 |
| Consolidated candidates | 1442 |
| Exact duplicates removed | 796 |
| Incomplete rows held | 193 |
| Physical-address candidates | 1404 |
| Online-only candidates | 38 |
| Same-destination review collisions | 124 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is tri-state-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is fb81364640240be99f4a76ce0b30b1c85f1b6ad8b4faf6e5ea9c510e2f7e6e6f.
