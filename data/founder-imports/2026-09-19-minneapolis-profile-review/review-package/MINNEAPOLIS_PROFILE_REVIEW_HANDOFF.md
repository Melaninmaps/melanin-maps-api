# Minneapolis–Saint Paul Profile-Fit Directory Review Handoff

**Package status: NOT PUBLISHED.** This package was assembled for protected review only. It cannot write to the production database, create a public listing or map pin, geocode an address, change Kinfolk retrieval, deploy the website, or change any user, account, authentication, password, session, waitlist, membership, or payment record.

## Purpose and scope

This package supports an explicit, voluntary discovery profile: an adult traveler seeking elevated **beauty and wellness, dining and social experiences, fitness and shopping, professional-life services, and cultural connection** in Minneapolis–Saint Paul. The profile was used only to prioritize useful categories. It does not establish a member identity, income, medical status, or entitlement to a result.

The evidence scope is Minneapolis, Saint Paul, and clearly Minneapolis–Saint Paul metro records. The package includes only source-backed leads with an official customer-facing destination. It does not infer ownership, demographic identity, price, quality, safety, licensing, availability, hours, accessibility, language, or service details from a business name, neighborhood, imagery, or a directory category.

## Review inventory

| Measure | Result |
|---|---:|
| Raw category candidates | 72 |
| Cross-category exact duplicates removed | 3 |
| Cumulative review candidates | 69 |
| Source leads held before consolidation | 41 |
| Preliminary `pending_review` candidates | 62 |
| Preliminary `needs_research` candidates | 7 |
| Unique customer destinations checked | 79 |
| Reachable customer destinations | 72 |
| Review-required destinations | 6 |
| Network-error destinations | 1 |
| Exact overlap with the prior Minneapolis–Saint Paul review package | 0 |

The manifest SHA-256 is:

```text
76370ede4d3afb6de08525d1d3b7f4013240dd7c2cbaaac97c3e72a2cee4ec7f
```

Verify this checksum against the exact manifest before protected staging. Do not combine this count with the separate earlier Minneapolis–Saint Paul package without an authorized reviewer reconciliation. A normalized exact-name/city/state/country/address comparison found zero overlap with that earlier package, but production reconciliation remains required.

## Candidate routes

| Review route | Candidates | Required boundary |
|---|---:|---|
| `business` | 45 | Eligible only for protected staging, current-record reconciliation, address review, and later controlled geocoding after approval. |
| `online_business` | 2 | Searchable only after approval; intentionally mapless with no fabricated address or pin. |
| `regulated_review` | 6 | Requires authority, scope, and licensing review before publication. |
| `community_resource` | 9 | Remains outside the commercial map-pin path unless a future approved policy says otherwise. |
| `cultural_place` | 7 | Remains outside the commercial map-pin path unless a future approved policy says otherwise. |

There are **no coordinate fields** in this package. The physical-business records have a source-backed numbered street address. The online-only records are deliberately addressless and mapless. A same-customer-destination collision was preserved for manual reviewer reconciliation rather than silently merged.

## Required protected-review sequence

Use the authorized reviewer environment and follow `docs/handoffs/SOURCE_BACKED_INVENTORY_PUBLICATION_RUNBOOK_2026-09-17.md`.

1. Confirm the checksum above and stage only `minneapolis-profile-combined-review-only-candidates.jsonl`.
2. Reconcile staged candidates against live inventory and the prior Minneapolis package. Preserve existing records, ownership links, and relationships; do not overwrite or delete as an enrichment side effect.
3. Keep the seven `needs_research` candidates out of publication until their concern is resolved. A network error or non-success outcome is a review signal, not a closure determination.
4. Review the public source, official customer destination, address/name match, category route, and explicit ownership/designation evidence. Retain unknown facts as `null`.
5. Route regulated records to authority/licensing review. Keep community resources and cultural places outside commercial map-pin publication.
6. After explicit reviewer approval, geocode only approved physical-business records through the controlled server path. Never geocode online-only records or invent coordinates.
7. Publish only through the protected route. Then verify exact-name, relevance, locality, and typo search; listing pages and official links; map-pin click-through; and authenticated Kinfolk recommendations before reporting live counts.

## Included evidence files

| File | Purpose |
|---|---|
| `minneapolis-profile-combined-review-only-candidates.jsonl` | Sole source-backed review manifest for protected staging. |
| `minneapolis-profile-combined-review-summary.json` | Counts, routes, health summary, safeguards, and checksum. |
| `../consolidated/minneapolis-profile-combined-destination-health.json` | Bounded official customer-destination check outcomes. |
| `../source-reports/` | Five category evidence ledgers and source URLs. |
| `../held/` | Forty-one source leads held before consolidation; not bulk-import candidates. |
| `../cross-package-audit/minneapolis-prior-package-normalized-exact-overlap.json` | The zero-overlap audit against the prior Minneapolis package. |
| `../consolidated/minneapolis-profile-exact-duplicates-removed.json` | Cross-category deduplication audit. |
| `../consolidated/minneapolis-profile-destination-collisions-review.json` | Customer-destination collision review. |

## Validation completed

All five source category files parsed as JSONL and had the expected 23-field source schema with sequential rows, literal JSON `null` values for unknown information, no string value equal to `"null"`, and no coordinate fields. The consolidated review manifest has 69 sequential rows, zero normalized name/city/state/country/address duplicates, 51 commercial map-pin-review candidates with physical addresses, and two mapless online-only candidates. These validations support reviewer staging only; they are not public publication, production deployment, native build, app-store release, or live inventory verification.
