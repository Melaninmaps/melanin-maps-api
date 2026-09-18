# Tri-State Source-Backed Directory Review Handoff

**Status:** **Prepared and validated for review only.** Nothing in this package has been staged to a database, published on the website, made visible in iOS or Android, added as a map pin, or used by live Kinfolk recommendations.

## What is ready

This package contains **730 source-backed tri-state candidates** for southeastern Pennsylvania, New Jersey, and Delaware. The package retains businesses, online-only services, community resources, cultural places, and regulated services in separate queues. It does not infer ownership, language, hours, accessibility, licensing, or any community designation from a name, location, chamber membership, or image.

| Queue | Candidates | Publication route |
|---|---:|---|
| Commercial business | 594 | Reviewer may create a commercial listing or enrich an exact existing listing after duplicate and location review. |
| Online-only business | 5 | Reviewer may approve as searchable online listings; these must never receive fabricated map coordinates or directions. |
| Regulated review | 13 | Remains held until the appropriate authority or licensing evidence is reviewed. |
| Community resource | 96 | Resource-only route; do not convert into a commercial map pin. |
| Cultural place | 22 | Cultural/discovery review route; do not convert into a commercial map pin. |
| **Total review candidates** | **730** | **Not published** |

Four records with an invalid or non-customer-facing destination were moved to the separate held file. They are not described as closed. They need an independently confirmed official site or social link before entering the review queue.

## Link verification result

The final manifest contains **719 unique selected customer destinations**. The automated check returned **620 reachable** responses, **51 non-success responses requiring review**, **36 network failures**, and **12 timeouts**. A link timeout or failure is not evidence that the business has closed. It is a review gate only.

The protected staging dry run classified **368 candidates as `pending_review`** and **362 as `needs_research`**. Its `publicationWrites` value was **0**. The 362 held-in-review rows include the 110 candidates with a link-health hold as well as protected regulated, community-resource, cultural-place, ownership-evidence, duplicate, or reconciliation gates.

## Validation completed

The package manifest is SHA-256 pinned as:

```text
a3d9a78ffd41e4b6a42fee8576745fc14d9545d09145f97b2c189fe09b1210a6
```

The final manifest has valid cited source URLs and selected customer destinations. Every physical listing in it has a street-address candidate. Every online-only listing is deliberately addressless and mapless. The review-staging script typecheck and the focused 5-test staging contract suite passed.

## Required publication steps

The next stage must be performed by an authenticated founder/admin who has access to the protected directory-review system and its authorized database environment. The importer deliberately prohibits `--apply` against a production database. This protects the existing businesses and prevents a batch command from silently publishing 730 records.

First, stage this exact checksum-pinned package in an **isolated local review database** using `DIRECTORY_IMPORT_LOCAL_STAGING=1`, `DEPLOYMENT_TIER=local_staging`, and a loopback PostgreSQL database named `mwm_directory_staging_*`. The local stage writes only `directory_import_batches` and `directory_import_candidates`; it writes **zero** public businesses, map pins, resources, users, passwords, sessions, access records, or waitlist records.

Next, use the founder/admin review interface to reconcile existing business matches, inspect the official customer destination, and approve each intended commercial listing. The publication route must geocode a reviewer-confirmed street address server-side before creating a commercial map pin. If the candidate matches an existing business, select the enrichment route rather than creating a duplicate. Only after a reviewer has approved records in the authorized production review environment can the API expose them to web search, mobile search/map, and Kinfolk retrieval.

After a subset is actually published, verify one ordinary business, one exact-name search, one reasonable typo search, one map pin opening its own detail page, one official external link, one online-only result without a pin, and one controlled Kinfolk local request. A website/API update is enough for ordinary approved directory data; an additional iOS/Android binary is not required merely to publish new database listings.

## Files in this package

| File | Purpose |
|---|---|
| `tri-state-review-only-candidates.jsonl` | Checksum-pinned review manifest. |
| `tri-state-review-held-candidates.jsonl` | Four held records lacking a valid customer-facing destination. |
| `tri-state-review-summary.json` | Counts, integrity hash, and review-only status. |
| `tri-state-destination-health.json` | Current raw destination verification results. |
| `tri-state-destination-health-summary.json` | Candidate-level hold breakdown. |

## References

[1]: https://membership.aachamber.com/list "African American Chamber of Commerce of PA, NJ & DE member directory"
[2]: https://business.shccnj.org/list "Statewide Hispanic Chamber of Commerce of New Jersey Business Link directory"
[3]: https://www.hchamber.org/member-directory "Delaware Hispanic Chamber of Commerce member directory"
[4]: https://www.philahispanicchamber.org/membership-directory "Greater Philadelphia Hispanic Chamber of Commerce membership directory"
