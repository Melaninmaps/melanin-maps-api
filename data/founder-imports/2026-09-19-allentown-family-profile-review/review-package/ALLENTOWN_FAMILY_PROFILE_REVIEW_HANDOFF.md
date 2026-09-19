# Allentown–Lehigh Valley Family-Profile Directory Review Handoff

**Package status: NOT PUBLISHED.** This is a protected, source-backed research package. It cannot add a production record, public listing, map pin, or geocode; change Kinfolk retrieval; deploy website/mobile code; or modify users, accounts, authentication, passwords, sessions, waitlist, memberships, or payments.

## Purpose and scope

This package supports stated, voluntary discovery needs in Allentown/Lehigh Valley: **wellness and survivor-support resources, social dining and drinks, music/date-night connection, family/everyday resources, college-access and financial-aid education, basketball programs/courts, and youth-to-college transition support**. These needs guide category selection only. They do not establish or infer any member’s demographic identity, health status, finances, family circumstances, or personal preferences.

Research is limited to Allentown, Bethlehem, Easton, Center Valley, and clearly Lehigh Valley records. Source attribution is preserved. No ownership, language, price, hours, safety, accessibility, licensing, availability, quality, or health claim is inferred from names, imagery, neighborhoods, or directory categories.

## Review inventory

| Measure | Result |
|---|---:|
| Raw category candidates | 58 |
| Cross-category exact duplicates removed | 1 |
| Cumulative review candidates | 57 |
| Source leads held before consolidation | 20 |
| Preliminary `pending_review` candidates | 44 |
| Preliminary `needs_research` candidates | 13 |
| Unique customer destinations checked | 60 |
| Reachable customer destinations | 46 |
| Review-required destinations | 8 |
| Network-error destinations | 6 |
| Prior Allentown/Lehigh Valley source-pass package located in current repository | 0 |

The review manifest SHA-256 is:

```text
94262471ce656ad93928ac6e69400b2a895816fd9005399d631a55f161de70f7
```

Verify this checksum against the exact manifest before protected staging. The repository discovery did not find a prior city-scoped source-pass package, but that is **not** proof that current production has no matching records; protected reviewer reconciliation remains mandatory.

## Candidate routes

| Review route | Candidates | Required boundary |
|---|---:|---|
| `business` | 14 | Consider only after protected staging, existing-record reconciliation, address review, and controlled geocode approval. |
| `online_business` | 1 | May be searchable after approval but remains intentionally mapless. |
| `regulated_review` | 2 | Requires licensing/authority and scope review before publication. |
| `community_resource` | 33 | Remains outside commercial map-pin publication unless approved policy changes the route. |
| `cultural_place` | 7 | Remains outside commercial map-pin publication unless approved policy changes the route. |

There are **no coordinate fields**. Fifty-six candidates have a physical address. The online-only candidate has no address and may not receive an invented pin. A same-customer-destination collision remains available for manual reconciliation, not automatic merging.

## Required protected-review sequence

1. Use the authorized reviewer environment and follow `docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md`.
2. Confirm the checksum and stage only `allentown-family-profile-combined-review-only-candidates.jsonl`.
3. Reconcile staged candidates against current production records. Preserve existing records and relationships; do not overwrite or delete while enriching.
4. Keep the 13 `needs_research` candidates out of publication until the review concern is resolved. A network error/non-success outcome is a review gate, not evidence of closure.
5. Verify source, official customer destination, name/address match, category route, and explicit designation evidence. Keep unknowns as `null`.
6. Route regulated entries through authority/licensing review. Keep resources/cultural places out of commercial map-pin publication.
7. Only after reviewer approval, geocode approved physical business records through the controlled server path. Never geocode online-only records or invent coordinates.
8. Publish only through the protected route; afterward verify exact-name, locality/relevance/typo search, listing details, official links, map-pin click-through, and authenticated Kinfolk recommendations before reporting live counts.

## Included evidence files

| File | Purpose |
|---|---|
| `allentown-family-profile-combined-review-only-candidates.jsonl` | Sole Allentown/Lehigh Valley review manifest for protected staging. |
| `allentown-family-profile-combined-review-summary.json` | Counts, health outcomes, review routes, safeguards, and checksum. |
| `../consolidated/allentown-family-profile-combined-destination-health.json` | Bounded official customer-destination health outcomes. |
| `../source-reports/` | Four source evidence ledgers and opened URLs. |
| `../held/` | Twenty source leads held outside the manifest; not bulk-import candidates. |
| `../cross-package-audit/ALLENTOWN_PRIOR_PACKAGE_DISCOVERY.md` | Path-level audit of prior city-scoped research packages; live-data reconciliation still required. |
| `../consolidated/allentown-family-profile-exact-duplicates-removed.json` | Cross-category duplicate audit. |
| `../consolidated/allentown-family-profile-destination-collisions-review.json` | Customer-destination collision review. |

## Validation completed

All source files parsed as JSONL with the required 23-field source schema, sequential rows, literal JSON `null` values for unknowns, and no coordinate fields. The consolidated manifest has 57 sequential rows and zero normalized name/city/state/country/address duplicates. This package is ready for protected reviewer staging only—not public publication, deployment, native build, or store release.
