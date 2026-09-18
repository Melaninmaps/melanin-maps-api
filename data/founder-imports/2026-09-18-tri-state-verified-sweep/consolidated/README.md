# Tri-State Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial tri-state pass produced 753 source records. The consolidation retained 734 structurally complete candidates after removing 19 exact normalized cross-source duplicates and holding 68 incomplete rows outside the package. 12 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

729 candidates have a physical address suitable for the later source-backed map-location review. 5 candidates are valid online-only services or shops. They can be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 753 |
| Consolidated candidates | 734 |
| Exact duplicates removed | 19 |
| Incomplete rows held | 68 |
| Physical-address candidates | 729 |
| Online-only candidates | 5 |
| Same-destination review collisions | 12 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is tri-state-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is 1a7cd78e5f619edd611be6dfec6a85bbe1eab724e5d3bab691e2ab8c869cef60.
