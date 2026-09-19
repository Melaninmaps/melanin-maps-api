# Allentown–Lehigh Valley Cumulative Everyday Directory Review Handoff

**Package status: NOT PUBLISHED.** This is a source-backed, protected-review package. It cannot write to production, create a public listing/map pin, geocode an address, change Kinfolk retrieval, deploy website/mobile code, or change users, accounts, authentication, passwords, approval, sessions, waitlist, membership, or payment behavior.

## Scope

This cumulative Allentown–Lehigh Valley package combines the earlier family-profile package with new everyday research for home/auto repair and mobility; beauty, hair, nails, spa, food/drinks, music, and social life; child care, family support, school-age activities, and youth sports; museums, public art, heritage, galleries, cultural centers, and youth art; and college access, financial-aid education, careers, basketball, nursing/care-workforce learning, and young-adult transition support.

Permitted geography is Allentown, Bethlehem, Easton, Center Valley, Trexlertown, and clearly Lehigh Valley records. Household scenarios guide category selection only and do not infer a person’s demographic identity, health, finances, family situation, language, occupation, or preferences. Ownership/designation evidence is retained only when explicitly attributed in an opened source.

## Cumulative inventory

| Measure | Result |
|---|---:|
| Source-pass files consolidated | 9 |
| Source rows scanned | 192 |
| Source leads held outside the candidate passes | 74 |
| Structurally invalid/incomplete source rows held during consolidation | 0 |
| Exact cross-source duplicates removed | 22 |
| Cumulative review candidates | 170 |
| Preliminary `pending_review` candidates | 141 |
| Preliminary `needs_research` candidates | 29 |
| Same-customer-destination collisions retained for manual review | 5 |
| Unique customer destinations checked | 184 |
| Reachable customer destinations | 155 |
| Review-required customer destinations | 20 |
| Network errors | 9 |

The protected staging manifest SHA-256 is:

```text
350bddce16c6d9da92f9bb04b011486b2efb8589220f62d6f3222251a9c4496c
```

Verify this checksum against the exact manifest before staging. This replaces the earlier Allentown/Lehigh Valley package as the current **cumulative review count**; do not add the prior count to 170.

## Candidate routes

| Route | Candidates | Publication boundary |
|---|---:|---|
| `business` | 59 | Consider only after protected staging, current-record reconciliation, physical-address review, and controlled geocode approval. |
| `online_business` | 1 | Searchable only after approval; remains intentionally mapless. |
| `regulated_review` | 17 | Requires authority/licensing and scope review before publication. |
| `community_resource` | 69 | Remains outside the commercial map-pin path unless a separately approved route applies. |
| `cultural_place` | 24 | Remains outside the commercial map-pin path unless a separately approved route applies. |

The manifest contains **no coordinates**. It includes 169 address-backed candidates and 76 commercial map-pin review candidates. The online-only candidate remains mapless. Five same-destination collisions remain available for manual reconciliation, not automatic merging.

## Protected-review sequence

1. Use the authorized reviewer environment and follow `docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md`.
2. Verify the checksum and stage only `allentown-cumulative-everyday-combined-review-only-candidates.jsonl`.
3. Reconcile every candidate against live inventory records. Preserve existing records/relationships; do not overwrite or delete while enriching.
4. Hold all 29 `needs_research` candidates until the concern is resolved. A network error or review-required response is a review gate—not proof that the listing closed.
5. Verify the evidence source, official customer destination, name/address match, category route, and explicit ownership/designation evidence. Retain unknown fields as `null`.
6. Route regulated candidates through authority/licensing review. Keep resources/cultural places out of commercial map-pin publication.
7. Only after reviewer approval, use controlled server-side geocoding for an approved physical commercial record. Never geocode online-only or intentionally mapless records.
8. Publish only through the protected route. Then test exact-name, locality/relevance/typo search, listing details, official links, map-pin click-through, and authenticated Kinfolk recommendations before reporting any live counts.

## Evidence files

| File or folder | Purpose |
|---|---|
| `allentown-cumulative-everyday-combined-review-only-candidates.jsonl` | Sole manifest for protected staging. |
| `allentown-cumulative-everyday-combined-review-summary.json` | Counts, routes, health outcomes, safeguards, and checksum. |
| `../consolidated/` | Consolidated source candidate set, duplicate audit, customer-destination collision report, destination health report, and reproducibility README. |
| `../source-passes/` | All 9 cumulative source passes. |
| `../source-reports/` | Opened-source evidence ledgers, decisions, and limitations. |
| `../held/` | 74 source leads held outside the manifest. These are not bulk-import candidates. |

## Validation completed

The generated manifest passed JSONL parsing, 24-field package-schema, sequential-row, no-string-`null`, no-coordinate, physical-address, and normalized-duplicate checks. All 170 records retain a source and customer-facing official destination. This package is ready for protected reviewer staging only—not public publication, website deployment, native build, tester release, or store release.
