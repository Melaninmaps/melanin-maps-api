# Next Three City Directory Consolidation

**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.

The source-by-source collection and initial next-three-city pass produced 179 source records. The consolidation retained 179 structurally complete candidates after removing 0 exact normalized cross-source duplicates and holding 1 incomplete rows outside the package. 2 records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.

179 candidates have a physical address suitable for the later source-backed map-location review. 0 candidates are valid online-only services or shops. They can be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.

## Candidate composition

| Measure | Count |
|---|---:|
| Source records collected | 179 |
| Consolidated candidates | 179 |
| Exact duplicates removed | 0 |
| Incomplete rows held | 1 |
| Physical-address candidates | 179 |
| Online-only candidates | 0 |
| Same-destination review collisions | 2 |

## Publication boundary

This package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.

## Files

The consolidated candidate file is next-three-city-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is b41d5e0da521802cc979fbed054d39c1991d8c38093285f261af24e4b6ff196d.
