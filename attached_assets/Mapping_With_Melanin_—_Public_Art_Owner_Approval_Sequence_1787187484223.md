# Mapping With Melanin — Public Art Owner Approval Sequence

## Why approval happens in three gates

Do not approve the entire public-art program in one message. The evidence manifest, route/staging check, and first public seed batch are different decisions. Three gates ensure that a correct research manifest cannot become an unreviewed nationwide import, that a valid route design cannot become a broken map experience, and that a successful staging import cannot publish records you have not seen.

| Gate | What you are deciding | What remains prohibited |
|---|---|---|
| **1. Evidence manifest** | Which researched candidate records are evidence-complete enough to move to controlled staging. | No code, schema, route, database, media, map, or public changes. |
| **2. Route and staging check** | Whether the minimum schema/import/route proposal may be tested in staging for specified record IDs. | No production import or public visibility. |
| **3. First seed batch** | Whether the exact reviewed staging records may be published as a small production batch. | No additional records, cities, sources, images, or automatic expansion. |

## Gate 1 — Approve the evidence manifest only

Before sending Gate 1, review the manifest and evidence matrix. For every record you approve, confirm that its title/work label, artist credit or explicit unconfirmed status, exact local location, access status, source links, and cultural-context evidence are present. African American, Caribbean, Indigenous, Hispanic/Latine, and intersecting context must be documented by the cited source; never inferred.

Do not approve every candidate simply because it appears in the manifest. Mark only the external candidate IDs you want advanced. A small first set is safer; use at most **30 high-confidence candidates total** across Atlanta, Philadelphia, and Chicago for the first controlled batch.

> **Owner approval — Gate 1: evidence manifest only.**
>
> I have reviewed the Stage 1 public-art evidence manifest, evidence matrix, deduplication report, and coverage-gap report. I approve **only** the following external candidate IDs for controlled staging consideration:
>
> ```text
> [PASTE ONLY THE REVIEWED CANDIDATE IDs HERE]
> ```
>
> This approval is limited to the candidate IDs above. It confirms that their submitted evidence is sufficiently complete to proceed to a route/staging proposal; it does **not** authorize database import, source changes, schema/migration changes, media reuse, map visibility, public publication, build, or deployment.
>
> All other candidates remain non-public and `in_review`. Do not add or substitute records, cities, sources, cultural tags, or images. Return the exact minimum implementation proposal, changed-file list, migration need (if any), staging plan, canonical-route dry run, and rollback plan for the approved IDs only. Stop and ask if any additional source/data/code/configuration change is needed.

### Required Replit response before Gate 2

| Required item | Must show |
|---|---|
| Approved-ID inventory | Only the owner-approved IDs; no substitutions. |
| Proposed source/data changes | Exact file names, SQL/migration file if required, and row count. |
| Schema fit | Whether the existing universal non-business entity schema stores provenance, access, review state, artist credit, and cultural-context evidence. |
| Canonical routes | Exact expected route for every approved ID; no 404 on refresh. |
| Location result | Exact local coordinates/address and map placement; no city-level pinning unless explicitly approved. |
| Dedupe result | No duplicate/conflicting entity for every approved ID. |
| Rights result | No image download/hotlink/reuse; source URL and rights note only. |
| Rollback | Exact process to remove the staging records if a review fails. |

## Gate 2 — Approve staging and route verification only

Use Gate 2 only when Replit has supplied every required item above. If the proposal contains a migration, approve only the exact migration file and only after you have reviewed it. If Replit has no staging environment, do not use production as a substitute; ask it to provide a non-public dry-run/export instead.

> **Owner approval — Gate 2: staging and canonical-route verification only.**
>
> I approve the minimum staging-only implementation described in Replit’s Gate 2 proposal for these exact external candidate IDs:
>
> ```text
> [PASTE THE SAME APPROVED CANDIDATE IDs HERE]
> ```
>
> Replit may make only the source/data/schema changes explicitly listed in its approved proposal. Load the approved records as non-public staging records with `review_status = in_review`; do not set them to published and do not expose them in the production map, directory, search, Kinfolk, Living Library, API response, mobile app, or public route.
>
> Do not import any other candidate. Do not download, hotlink, or reuse source images. Do not change map ranking, global fallback behavior, previews, mobile, Kinfolk, API behavior unrelated to the non-public staging records, build settings, or deployment settings.
>
> Return staging-only proof for each approved ID: exact stored fields/provenance, canonical slug, refresh-safe detail route result, local coordinate validation, duplicate result, access-status display, and a complete changed-file/data-row list. Also return the exact rollback command or migration reversal. Do not publish, build, deploy, or release anything.

### Required Replit response before Gate 3

| Required item | Must show |
|---|---|
| Staging record IDs | One-to-one match with Gate 1 approved IDs. |
| Record fields | Artist credit/status, location, access, source URLs, rights note, cultural-context tag/display/relationship/evidence. |
| Route check | Every future canonical detail route resolves after refresh in non-public/staging context. |
| Map check | Correct local coordinates and category; no business route and no global fallback. |
| Search check | Public Art filter returns only staging/test records in the approved environment. |
| Visibility check | No staging record is publicly accessible or in production. |
| Rollback check | Exact deletion/reversal tested without affecting other cultural sites. |
| Scope check | Complete changed-file list and data-row list match Gate 2 authorization. |

## Gate 3 — Approve the first controlled public seed batch

Only use this gate after you personally review the staging records and route/map proof. You are not approving a nationwide collection; you are approving the specific records below and nothing else. Start with **no more than 30 records total** and keep each record’s original verified source/cultural-context evidence intact.

> **Owner approval — Gate 3: publish the first controlled public-art seed batch.**
>
> I approve publication of only the following reviewed staging records:
>
> ```text
> [PASTE THE FINAL STAGING RECORD IDs AND/OR EXTERNAL CANDIDATE IDs HERE]
> ```
>
> Publish these records only as universal non-business entities in the Public Art category. Preserve their exact artist-credit status, location, access notes, provenance, rights note, review metadata, documented cultural-context tags/display terms, and canonical detail routes.
>
> Do not publish any additional candidate, city, source batch, image, or media item. Do not alter the business directory, local map ranking, closest-two local-result policy, route patterns, preview, Kinfolk, mobile, API behavior outside these entities, database records outside this batch, configuration, build, or deployment settings.
>
> Immediately after publication, verify every approved record’s canonical URL with a refresh-safe request, validate its map coordinate and Public Art category, confirm it does not appear as a business, and confirm it appears only when locally relevant or through explicit expansion. Return the public record list, URLs, source citations, route/map checks, complete changed-file/data-row list, and exact rollback process. If any result is incorrect, remove only this seed batch and report the failure.

## Stop conditions that override any approval

Replit must stop and request new owner approval if any of the following occurs:

```text
A candidate lacks an exact local location, source URL, artist-credit status, access status, or documented cultural-context basis.
A cultural/identity tag is inferred rather than source-supported.
An Indigenous Nation/Tribe/community name, Hispanic/Latine term, African American context, or Caribbean context is guessed or normalized without source support.
A source requires credentials, payment, license acceptance, or prohibits the planned extraction/reuse.
Any image is to be copied, hotlinked, downloaded, or generated without rights clearance.
Any candidate would expose a private/sensitive location.
A proposed change touches an unapproved file, migration, table, route, map behavior, API, mobile app, preview, Kinfolk, build, configuration, or deployment setting.
A published public-art pin would have a 404 detail route or appear as a business.
A nearby-search query would show a distant record as local or introduce global fallback behavior.
```

If any stop condition occurs, the correct result is a report and no further change—not a workaround.
