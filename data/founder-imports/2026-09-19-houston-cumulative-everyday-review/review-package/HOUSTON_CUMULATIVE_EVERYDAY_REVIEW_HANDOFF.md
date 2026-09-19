# Houston Cumulative Everyday Directory Review Handoff

**Package status: NOT PUBLISHED.** This is a source-backed, protected-review package. It cannot write to production, create a public listing or map pin, geocode addresses, change Kinfolk retrieval, deploy website/mobile code, or change any users, accounts, authentication, password, approval, sessions, waitlist, membership, or payment behavior.

## Scope

This cumulative Houston package deepens the everyday inventory for potential testers. It combines all prior Houston source passes retained in the repository with new research for home repair; auto repair and mobility; beauty, textured-hair care, nails, spas, and self-care; culinary learning, specialty food markets, and cooking resources; nursing professional-life support; early childhood and family support; school-age enrichment and youth sports; museums, public art, and culture; dining, jazz, and social experiences; practical family resources; and household shopping.

The stated household scenarios were used only to prioritize useful categories. They do not establish or infer a person’s demographic identity, health, income, occupation, family composition, language, preferences, or eligibility. Source-attributed ownership/designation evidence is preserved only where the source explicitly supplies it; every other such value remains unknown.

## Cumulative inventory

| Measure | Result |
|---|---:|
| Source-pass files consolidated | 18 |
| Source rows scanned | 455 |
| Source leads held outside the candidate passes | 174 |
| Structurally invalid/incomplete source rows held during consolidation | 1 |
| Exact cross-source duplicates removed | 58 |
| Cumulative review candidates | 396 |
| Preliminary `pending_review` candidates | 328 |
| Preliminary `needs_research` candidates | 68 |
| Same-customer-destination collisions retained for manual review | 22 |
| Unique customer destinations checked | 396 |
| Reachable customer destinations | 348 |
| Timeouts | 6 |
| Network errors | 4 |
| Review-required customer destinations | 38 |

The protected staging manifest SHA-256 is:

```text
845ad034d8ae00ae7207732734221ac66af4a568af36f9972a9d215a61e4f217
```

Verify the exact manifest against this checksum before staging. This replaces the prior Houston packages as the current **cumulative review count**; do not add earlier Houston counts to 396.

## Candidate routes

| Route | Candidates | Publication boundary |
|---|---:|---|
| `business` | 139 | Consider only after protected staging, current-record reconciliation, physical-address review, and controlled geocode approval. |
| `online_business` | 7 | Searchable only after approval; remains deliberately mapless. |
| `regulated_review` | 61 | Requires authority/licensing and scope review before publication. |
| `community_resource` | 145 | Remains outside the commercial map-pin path unless a separately approved route applies. |
| `cultural_place` | 44 | Remains outside the commercial map-pin path unless a separately approved route applies. |

The manifest contains **no coordinates**. It includes 382 address-backed candidates, 200 commercial map-pin review candidates, 7 intentionally mapless community resources, and 7 online-only candidates. No address or pin may be invented.

## Protected-review sequence

1. Use the authorized reviewer environment and follow `docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md`.
2. Verify the checksum and stage only `houston-cumulative-everyday-combined-review-only-candidates.jsonl`.
3. Reconcile every candidate against the live inventory. Preserve existing records and relationships; do not overwrite or delete listings while enriching.
4. Hold all 68 `needs_research` candidates until the concern is resolved. A timeout, network error, or review-required response is a review signal—not proof that a business closed.
5. Verify the evidence source, customer-facing destination, name/address match, category route, and explicit ownership/designation evidence. Keep unknown data as `null`.
6. Route regulated candidates through authority/licensing review. Keep community resources and cultural places out of the commercial map-pin path.
7. Use controlled server-side geocoding only after a reviewer approves an address-backed physical commercial record. Never geocode online-only or intentionally mapless records.
8. Publish only through the protected route. Then verify exact-name, locality/relevance/typo search, listing details, official links, map-pin click-through, and authenticated Kinfolk recommendations before reporting live counts.

## Evidence files

| File or folder | Purpose |
|---|---|
| `houston-cumulative-everyday-combined-review-only-candidates.jsonl` | Sole manifest for protected staging. |
| `houston-cumulative-everyday-combined-review-summary.json` | Counts, routes, health outcomes, safeguards, and checksum. |
| `../consolidated/` | Consolidated source candidate set, duplicate audit, customer-destination collision report, invalid-row hold, destination health report, and reproducibility README. |
| `../source-passes/` | All 18 cumulative source passes. |
| `../source-reports/` | Opened-source evidence ledgers, decisions, and limitations. |
| `../held/` | 174 source leads held outside the manifest. These are not bulk-import candidates. |

## Validation completed

The generated manifest passed JSONL parsing, 24-field package-schema, sequential-row, no-string-`null`, no-coordinate, physical-address, and normalized-duplicate checks. All 396 records retain a source and customer-facing official destination. This package is ready for protected reviewer staging only—not public publication, website deployment, native build, tester release, or store release.
