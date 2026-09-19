# Los Angeles Luxury and Everyday Adult Directory Review Handoff

**Package status: NOT PUBLISHED.** This is a source-backed, protected-review package. It cannot write to production, create a public listing/map pin, geocode an address, change Kinfolk retrieval, deploy website/mobile code, or change users, accounts, authentication, passwords, approval, sessions, waitlist, membership, or payment behavior.

## Scope

This cumulative Los Angeles County package combines the prior Los Angeles source pass with new research for luxury hospitality/travel, special-occasion dining/drinks, live music and events, fitness/wellness, grooming/spa, real-estate/home life, academic/intellectual culture, explicitly source-attributed LGBTQ+ community and social options, museums/art/design, and outdoor recreation.

The stated voluntary household profile—two married gay men aged approximately 45–55, one professor and one real-estate professional—was used only to choose useful categories. It does not establish or infer any user’s sexual orientation, marital status, gender, health, wealth, occupation, language, preferences, or eligibility. LGBTQ+ and ownership/designation fields are retained only when an opened source explicitly attributes them.

## Cumulative inventory

| Measure | Result |
|---|---:|
| Source-pass files consolidated | 11 |
| Source rows scanned | 433 |
| Source leads held outside candidate passes | 368 |
| Structurally invalid/incomplete source rows held during consolidation | 0 |
| Exact cross-source duplicates removed | 17 |
| Cumulative review candidates | 416 |
| Preliminary `pending_review` candidates | 357 |
| Preliminary `needs_research` candidates | 59 |
| Same-customer-destination collisions retained for manual review | 4 |
| Unique customer destinations checked | 400 |
| Reachable customer destinations | 342 |
| Review-required customer destinations | 55 |
| Timeouts | 2 |
| Network errors | 1 |

The protected staging manifest SHA-256 is:

```text
57b2961a763c7db9838a5b28e9f5c2b1821a07b32aebad7d98748284b81884f2
```

Verify this checksum against the exact manifest before staging. This is the current **cumulative Los Angeles review count**; do not add its count to the earlier Los Angeles source-pass count.

## Candidate routes

| Route | Candidates | Publication boundary |
|---|---:|---|
| `business` | 286 | Consider only after protected staging, live-record reconciliation, physical-address review, and controlled geocode approval. |
| `online_business` | 4 | Searchable only after approval; remains intentionally mapless. |
| `regulated_review` | 24 | Requires authority/licensing and scope review before publication. |
| `community_resource` | 40 | Remains outside the commercial map-pin path unless a separately approved route applies. |
| `cultural_place` | 62 | Remains outside the commercial map-pin path unless a separately approved route applies. |

The manifest contains **no coordinate fields**. It includes 407 address-backed candidates, 310 commercial map-pin review candidates, 5 intentionally mapless community resources, and 4 online-only candidates. No address, location, or map pin may be invented.

## Protected-review sequence

1. Use the authorized reviewer environment and follow `docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md`.
2. Verify the checksum and stage only `los-angeles-luxury-combined-review-only-candidates.jsonl`.
3. Reconcile every candidate against the current live inventory. Preserve existing records/relationships; do not overwrite or delete listings during enrichment.
4. Keep all 59 `needs_research` candidates out of publication until the concern is resolved. A timeout, network error, or review-required outcome is a review signal—not proof of closure.
5. Verify the evidence source, official customer-facing destination, name/address match, category route, and any explicit ownership/designation evidence. Keep unknowns as `null`.
6. Route regulated candidates through authority/licensing review. Keep community resources and cultural places out of commercial map-pin publication.
7. Use controlled server-side geocoding only for reviewer-approved physical commercial records. Never geocode online-only or intentionally mapless records.
8. Publish only through the protected route. Afterward, verify exact-name, locality/relevance/typo search, listing details, official links, map-pin click-through, and authenticated Kinfolk recommendations before reporting any live count.

## Evidence files

| File or folder | Purpose |
|---|---|
| `los-angeles-luxury-combined-review-only-candidates.jsonl` | Sole manifest for protected staging. |
| `los-angeles-luxury-combined-review-summary.json` | Counts, routes, health outcomes, safeguards, and checksum. |
| `../consolidated/` | Consolidated candidate set, duplicate audit, customer-destination collision report, destination-health report, and reproducibility README. |
| `../source-passes/` | All 11 cumulative source passes. |
| `../source-reports/` | Opened-source evidence ledgers, decisions, and limitations. |
| `../held/` | 368 source leads held outside the manifest. These are not bulk-import candidates. |

## Validation completed

The generated manifest passed JSONL parsing, 24-field package-schema, sequential-row, no-string-`null`, no-coordinate, physical-address, and normalized-duplicate checks. All 416 records retain a source and customer-facing official destination. The package is ready for protected reviewer staging only—not public publication, website deployment, native build, tester release, or store release.
