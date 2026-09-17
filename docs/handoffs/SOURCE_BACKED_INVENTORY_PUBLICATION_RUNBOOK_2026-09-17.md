# Source-backed directory inventory publication runbook

**Prepared by:** Manus AI
**Date:** 2026-09-17
**Applies to:** Mapping With Melanin / KinfolkAI website, iOS, Android, API, and the shared PostgreSQL directory database

## Purpose

This runbook takes the prepared source-backed business research bundle through controlled review and publication so approved commercial businesses appear in the shared API. After publication, those businesses are available to website directory search, mobile map search and pins, and KinfolkAI business retrieval. This process does not create, delete, or edit users. It does not change login, password reset, sessions, access entitlements, or the waitlist.

The bundle contains **624 review-only candidates** consolidated from existing domestic and international research. It includes 453 commercial-business candidates, 133 regulated-service candidates, 23 community-resource candidates, and 15 cultural-place candidates. The regulated, resource, and cultural records remain separated from ordinary commercial map pins.

## Proven facts and remaining gates

Official-destination verification checked 985 unique official website/social destinations associated with the 624 candidates. It found 949 reachable destinations. The remaining 36 non-reachable or inconclusive destinations must remain in the review queue; a timeout or non-200 response is not proof that a business closed.

There are 197 commercial candidates with no automated pre-stage hold. This number is not approval to publish them. A founder/admin reviewer must still resolve production duplicate matches and confirm the server-suggested location before publication. The importer will not publish candidates automatically.

## Required package

Copy the attached `source-backed-inventory-review-bundle-2026-09-17.tar.gz` into the repository root and verify its SHA-256 checksum before use. The archive expands to:

```text
data/founder-imports/2026-09-17-source-backed-inventory-review/
  source-backed-inventory-review-only-candidates.jsonl
  source-backed-inventory-held-candidates.jsonl
  source-backed-inventory-review-summary.json
  destination-health.json
  destination-health-summary.json
```

The review-only manifest is checksum-pinned by `source-backed-inventory-review-summary.json`. Do not edit the manifest after link verification. Rebuild it and re-run link verification if research records need correction.

## Adding a later city-research batch

The city research collector writes one candidate file per market. Audit every city file before combining it with the baseline bundle. The audit rejects rows that lack a physical address, a source URL, a social destination, or an allowed record kind. The filter places rejected rows in a separate held manifest and never alters the original city files.

```bash
pnpm --filter @workspace/scripts run audit-55-city-social-recovery -- \
  --batch-dir "$PWD/data/founder-imports/2026-09-17-55-city-social-recovery"
pnpm --filter @workspace/scripts run filter-55-city-social-recovery -- \
  --batch-dir "$PWD/data/founder-imports/2026-09-17-55-city-social-recovery"

pnpm --filter @workspace/scripts exec tsx ./src/prepare-source-backed-inventory-review.ts \
  --input "$PWD/data/founder-imports/2026-09-17-10k-expansion/source-backed-domestic-candidates.jsonl" \
  --input "$PWD/data/founder-imports/2026-09-17-international-2500-expansion/source-backed-international-candidates.jsonl" \
  --input "$PWD/data/founder-imports/2026-09-17-55-city-social-recovery/strict-city-candidates.jsonl" \
  --output-dir "$PWD/data/founder-imports/2026-09-17-all-source-backed-review"
```

Run the official-destination health verifier against the newly generated combined manifest. Then use that new manifest, summary, and health report in the same dry-run and local-review staging procedure below. Do not append raw city files directly to the production database.

## Required release code

Merge the implementation that adds these files before staging the package:

```text
scripts/src/prepare-source-backed-inventory-review.ts
scripts/src/check-source-backed-review-destinations.mjs
scripts/src/summarize-source-backed-review-health.mjs
scripts/src/__tests__/prepare-source-backed-inventory-review.test.ts
scripts/src/__tests__/summarize-source-backed-review-health.test.ts
scripts/package.json
```

The existing `scripts/src/stage-global-review-manifest.ts` and guarded API directory-import routes are the publication controls. They must remain enabled.

## Preflight

Run the following from the repository root after checking out the production release branch. These commands validate only the scripts and review bundle; they do not connect to the production database or write public listings.

```bash
pnpm install --frozen-lockfile
pnpm --filter @workspace/scripts run typecheck
pnpm --filter @workspace/scripts exec vitest run \
  src/__tests__/prepare-source-backed-inventory-review.test.ts \
  src/__tests__/summarize-source-backed-review-health.test.ts \
  src/__tests__/stage-global-review-manifest.test.ts

sha256sum -c /path/to/source-backed-inventory-review-bundle-2026-09-17.tar.gz.sha256
node scripts/src/summarize-source-backed-review-health.mjs

pnpm --filter @workspace/scripts exec tsx ./src/stage-global-review-manifest.ts \
  --manifest "$PWD/data/founder-imports/2026-09-17-source-backed-inventory-review/source-backed-inventory-review-only-candidates.jsonl" \
  --review-summary "$PWD/data/founder-imports/2026-09-17-source-backed-inventory-review/source-backed-inventory-review-summary.json" \
  --link-health "$PWD/data/founder-imports/2026-09-17-source-backed-inventory-review/destination-health.json" \
  --created-by "authorized-directory-reviewer"
```

The last command is a dry run. It must report `publicationWrites: 0`. The expected dry-run inventory is 624 rows: 453 `business`, 133 `regulated_review`, 23 `community_resource`, and 15 `cultural_place`.

## Local review staging

The staging command rejects a production database URL. This is intentional. Create an isolated local review database with a loopback connection and a name beginning with `mwm_directory_staging`, for example `mwm_directory_staging_release_20260917`.

Run startup migrations against the isolated review database using the project’s normal local startup procedure. Then stage the review batch:

```bash
DIRECTORY_IMPORT_LOCAL_STAGING=1 \
DEPLOYMENT_TIER=local_staging \
NODE_ENV=test \
DATABASE_URL='postgresql://USER:PASSWORD@127.0.0.1:5432/mwm_directory_staging_release_20260917' \
pnpm --filter @workspace/scripts exec tsx ./src/stage-global-review-manifest.ts \
  --apply \
  --manifest "$PWD/data/founder-imports/2026-09-17-source-backed-inventory-review/source-backed-inventory-review-only-candidates.jsonl" \
  --review-summary "$PWD/data/founder-imports/2026-09-17-source-backed-inventory-review/source-backed-inventory-review-summary.json" \
  --link-health "$PWD/data/founder-imports/2026-09-17-source-backed-inventory-review/destination-health.json" \
  --created-by "authorized-directory-reviewer"
```

The output returns a `batchId`. Save it. The stage command writes only `directory_import_batches` and `directory_import_candidates` in the isolated review database. It writes zero businesses, zero map pins, zero resources, and zero user/auth/waitlist records.

## Review and publication rules

Use the founder/admin directory-import review interface or its protected API routes to process the staged batch. The API requires a signed-in founder/admin user and uses optimistic revision controls and idempotency controls to avoid accidental duplicate decisions.

| Candidate kind | Allowed disposition | Required evidence before publication |
| --- | --- | --- |
| `business` | Create a new business or link/enrich an existing business | Reviewer-confirmed current official link evidence, duplicate resolution, and signed server-generated coordinate evidence from the published street address. |
| `regulated_review` | Hold or publish only after regulated review | All ordinary business evidence plus current licensing/authority verification. |
| `community_resource` | Publish only as a Resource | Current official or verified organization evidence. Do not create a commercial map listing. |
| `cultural_place` | Keep in the cultural/discovery review queue | Do not publish through the commercial-business route. |
| Any candidate with a link-health hold | `needs_research` until resolved | Recheck its official website/social destination. Do not treat a failure as a closure without corroboration. |
| Any matching existing business | `link_existing` | Preserve the business record. Add confirmed address/contact evidence as enrichment rather than creating a duplicate or overwriting facts. |

A support designation appears only if the individual business was expressly described as such by an official business statement or a reliable cited directory. The reviewer must confirm the linked evidence. Never infer a designation from a person’s name, a business name, cuisine, neighborhood, language, or image. Do not hide, remove, or block existing listings based solely on a protected trait. Members may voluntarily use the supported filter controls to narrow their results.

## Production deployment and verification

After the authorized reviewer approves records in the production review environment, deploy the API and web release from the same Git commit. The mobile apps use the same API, so no separate directory database exists for iOS or Android.

Verify the following before announcing the inventory as live:

```bash
curl -fsS https://api.melaninmaps.com/api/healthz
curl -fsS https://api.melaninmaps.com/api/kinfolk/health
```

The Kinfolk health probe must return an available status before a live demonstration. The hosting owner must provide the configured `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL` in the deployed API environment. This is a deployment-secret requirement and should never be placed in source code.

For three approved commercial businesses, verify all of the following against the live API and both clients:

1. Search by an exact business name and a reasonable misspelling.
2. Search by category/service and city.
3. Tap the map pin and confirm it opens that exact listing.
4. Ask KinfolkAI for the business need and local city. Confirm the resulting recommendation contains an approved listing and opens its detail page.
5. Confirm that an approved regulated business is shown only after its regulated evidence was completed.
6. Confirm that a resource/cultural candidate did not become a commercial map pin.

## Explicitly protected boundaries

This release must not run any account bootstrap/seed logic in production. It must not alter any user, role, password, password-reset code, session, waitlist signup, access entitlement, or access-ledger record. The only existing waitlist behavior retained is the website dashboard’s combined view of website and app waitlist submissions from the shared `waitlist_signups` table.

## References

[1]: https://github.com/Melaninmaps/melanin-maps-api "Melanin Maps API source repository"
