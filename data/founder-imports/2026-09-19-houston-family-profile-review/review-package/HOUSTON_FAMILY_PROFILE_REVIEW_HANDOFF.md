# Houston Family-Profile Directory Review Handoff

**Package status: NOT PUBLISHED.** This is a protected, source-backed research package. It cannot add records to production, create a public listing or map pin, geocode an address, change Kinfolk retrieval, deploy website/mobile code, or modify any user, account, authentication, password, session, waitlist, membership, or payment behavior.

## Purpose and scope

This package supports stated, voluntary discovery needs for two Houston households: an adult seeking **wellness, spas, date nights, jazz/live music, social experiences, and age-appropriate activities for a child around 10–12**; and a recently moved adult parent of three seeking **child care, family support, resources, education/workforce support, practical services, and family activities**. These needs were used only to prioritize relevant categories and credible sources. They are not a basis to infer any member’s identity, income, health, or personal circumstances.

Research is limited to Houston, Texas. Ownership/designation, language, price, hours, licensing, safety, quality, accessibility, and availability are retained only where directly supported by a source; unknowns remain unknown.

## Review inventory

| Measure | Result |
|---|---:|
| Raw category candidates | 61 |
| Cross-category exact duplicates removed | 4 |
| Cumulative review candidates | 57 |
| Source leads held before consolidation | 15 |
| Preliminary `pending_review` candidates | 49 |
| Preliminary `needs_research` candidates | 8 |
| Unique customer destinations checked | 70 |
| Reachable customer destinations | 61 |
| Timeouts | 3 |
| Review-required destinations | 6 |
| Exact normalized overlap with prior Houston research packages | 0 |

The review manifest SHA-256 is:

```text
99b9c1836dc0d8a2e01112274933629b85f9994b22ba868cfffbe80bb5b43a30
```

Verify that value against the exact manifest before protected staging. The zero-overlap audit covers the earlier Houston source packages, but it is not a substitute for production-record reconciliation.

## Candidate routes

| Review route | Candidates | Required boundary |
|---|---:|---|
| `business` | 13 | Consider only after protected staging, existing-record reconciliation, address review, and controlled geocode approval. |
| `online_business` | 1 | May be searchable after approval but remains intentionally mapless. |
| `regulated_review` | 3 | Requires licensing/authority and scope review before publication. |
| `community_resource` | 28 | Remains outside the commercial map-pin path unless an approved policy changes that route. |
| `cultural_place` | 12 | Remains outside the commercial map-pin path unless an approved policy changes that route. |

The manifest contains **no coordinate fields**. Fifty-five candidates have a physical address. The one online-only candidate has no address and must not receive a fabricated pin. Two same-customer-destination collisions are preserved for manual reconciliation rather than silently merged.

## Required protected-review sequence

1. Use the authorized reviewer environment and follow `docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md`.
2. Confirm the checksum and stage only `houston-family-profile-combined-review-only-candidates.jsonl`.
3. Reconcile every staged candidate against the live inventory and earlier Houston packages. Preserve existing records/relationships; do not overwrite or delete them during enrichment.
4. Do not publish the eight `needs_research` candidates until the concern is resolved. A timeout or non-success result is a review signal—not proof of closure.
5. Verify the source, official customer destination, name/address match, category route, and any explicit designation evidence. Keep unknown data as `null`.
6. Route regulated entries through authority/licensing review. Keep community resources and cultural places out of commercial map-pin publication.
7. Only after explicit approval, use controlled server-side geocoding for approved physical business records. Never geocode online-only records or invent coordinates.
8. Publish only through the protected route; then test public exact-name, locality/relevance/typo search, listing details, official links, map-pin click-through, and authenticated Kinfolk recommendations before reporting any live count.

## Included evidence files

| File | Purpose |
|---|---|
| `houston-family-profile-combined-review-only-candidates.jsonl` | Sole Houston review manifest for protected staging. |
| `houston-family-profile-combined-review-summary.json` | Counts, health outcomes, review routes, safeguards, and checksum. |
| `../consolidated/houston-family-profile-combined-destination-health.json` | Bounded official customer-destination health outcomes. |
| `../source-reports/` | Four source evidence ledgers and opened URLs. |
| `../held/` | Fifteen source leads held outside the manifest; not bulk-import candidates. |
| `../cross-package-audit/houston-prior-package-normalized-exact-overlap.json` | Exact normalized overlap audit against earlier Houston research packages. |
| `../consolidated/houston-family-profile-exact-duplicates-removed.json` | Cross-category duplicate audit. |
| `../consolidated/houston-family-profile-destination-collisions-review.json` | Customer-destination collision review. |

## Validation completed

All source files parsed as JSONL and used the required 23-field source schema, sequential rows, literal JSON `null` values for unknowns, and no coordinate fields. The consolidated manifest has 57 sequential rows and zero normalized name/city/state/country/address duplicates. The package is ready for protected reviewer staging only—not public publication, deployment, native build, or app-store release.
