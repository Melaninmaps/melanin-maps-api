# How to Execute the Full Library Evidence Seed in the Current Replit/Railway Environment

## What this does—and does not do

The full Library evidence seed is a **production data operation**. It fills verified evidence behind the Library’s existing Books. It is not a website redesign, a new feature launch, or a blanket database migration.

The current production API source uses:

- `knowledge_topics` for canonical Library Books/topics;
- `knowledge_sources` for evidence records; and
- `knowledge_sources.topic_id` as the active direct link between a source and its topic.

The active graph API is the truth of whether the Library is populated. A topic card’s `trustedSources` metadata alone does not count.

## Before you begin

The owner should send Replit these two documents together:

1. `MWM_Replit_Full_Library_Evidence_Seeding_Prompt.md` — the work instruction.
2. `20260812_library_evidence_fk_preflight.sql` — the required read-only production preflight.

Do not run this work in a Replit preview, local database, dev database, or a separate Railway service. It must target the same production database used by the Railway API service that serves `www.mappingwithmelanin.com`.

## Step 1 — Create a narrow branch and deployment plan

In Replit, create a branch/task named something like:

```text
library/full-evidence-seed
```

State in the task description:

> This is a data-only Library evidence operation. Do not combine it with the Kinfolk capacity repair, UI work, map work, login work, mobile work, or any other feature.

If a helper script is needed, place it in a clearly named Library seed location. Do not modify startup migrations to auto-seed unknown content on every deployment.

## Step 2 — Establish the production database target safely

From the Railway API service configuration, identify the database connection used by the currently deployed API. Replit should report only:

- Railway service/environment name;
- current deployment SHA;
- redacted database hostname or database name/fingerprint;
- confirmation that the API service and seed runner use the same target.

Do **not** paste a connection string, password, API key, session cookie, or database credentials into chat.

## Step 3 — Run the read-only foreign-key preflight

Run `20260812_library_evidence_fk_preflight.sql` against the production target.

Replit must return the results for these decisions before inserts begin:

| Check | Expected current result | Required action if different |
|---|---|---|
| Canonical topic table | `knowledge_topics` exists | Stop; identify the actual graph route/model before writing |
| Direct evidence link | `knowledge_sources.topic_id` exists | Stop; adapt the seed job only to the active graph model |
| Graph source table | `knowledge_sources` exists | Stop; do not create a parallel source table |
| Orphan source rows | Zero | Stop and investigate before bulk inserts |
| Duplicate topic/source URLs | Zero or documented duplicates | Deduplicate safely before calling coverage complete |
| Published topics with zero active sources | Current backlog | Use as the baseline coverage report |
| Foreign-key constraints | Returned by `pg_constraint` | Follow their real creation/deletion order; never assume |

If production schema differs from this expected model, Replit must stop and report the actual table/constraint output. They must not “fix” it by creating an extra `knowledge_nodes` or `knowledge_topic_sources` system.

## Step 4 — Build the source manifest before inserts

Create a reviewable source manifest with one proposed row per topic-source relationship. At minimum, each row needs:

```text
topic_id
topic_name
category
source_name
canonical_source_url
authority_tier
status
confidence_or_provenance
is_primary
last_verified_or_retrieved_at
brief_relevance_note
```

The manifest must contain real canonical URLs. Replit must open/verify every URL before it is marked active. A source that fails verification remains in a failed/research-needed report; it is not inserted as verified.

Start with the seven visible diaspora Books. For African Diaspora History (`fbfbc161-5121-4eca-a0a4-c35731b010f6`), the first three approved institutional URLs are:

```text
https://www.unesco.org/en/general-history-africa
https://festival.si.edu/past-program/1976/african-diaspora
https://nmaahc.si.edu/explore/nmaahc-digital-resource-guide
```

## Step 5 — Implement the idempotent direct-source seed job

The job must use the source relationship the live graph reads:

```text
knowledge_sources.topic_id → knowledge_topics.id
```

The safe order for each manifest row is:

1. Confirm `topic_id` exists and its topic is `published`.
2. Normalize the canonical URL for duplicate detection.
3. Check for an existing source for the same `topic_id` plus normalized URL.
4. Insert only if no equivalent source exists.
5. Reuse/update only the supported provenance fields if the same source already exists; do not overwrite community contribution content.
6. Mark the source `active` only after URL/relevance verification.
7. Record the action: inserted, reused, skipped, duplicate, or failed.

A safe pattern is an explicit transaction per small batch—not one unbounded transaction for all 256 topics. Do not delete existing sources as part of normal seeding. If a bad new seed row must be rolled back, delete only the IDs recorded by this seed run after review.

## Step 6 — Execute in controlled batches

Run the batches in this order:

| Batch | Scope | Gate before continuing |
|---|---|---|
| A | 7 diaspora Books visible in Library | Live graph and hard-refreshed UI show real sources |
| B | Health, legal, financial, recovery, housing, employment, education, relocation | Domain source standards and source counts pass |
| C | Travel, country, geography, diaspora, history, culture, faith, family | Official/cultural authority standards pass |
| D | Business, community, community_culture, digital, entertainment, lifestyle, home, skills_trades | Category standards pass |

After every batch, produce a coverage delta. If more than a small documented verification failure occurs, stop the batch and report it to the founder. Do not “fill” gaps with unreviewed links merely to make the percentage look complete.

## Step 7 — Verify through the same API and UI members use

Run the full `MWM_Library_Evidence_Seeding_Verification_Checklist.md`.

At a minimum, verify:

```text
GET /api/knowledge/graph/fbfbc161-5121-4eca-a0a4-c35731b010f6?surface=library
```

The response must contain at least the three expected African Diaspora History sources in `sources`.

Then log into the production website, hard refresh, open `/library`, open African Diaspora History, and confirm the side panel shows real clickable evidence—not “We’re building this Book.” Repeat for health, legal, financial, travel/country, home/housing, and community/culture samples.

## Step 8 — Return the completion package

Replit must provide:

1. deployment SHA and redacted production database fingerprint;
2. full source coverage manifest for all enabled/published topics;
3. baseline and final coverage report by category;
4. list of incomplete/exempt topics with a real reason;
5. inserted/reused/skipped/failed/duplicate totals;
6. duplicate report;
7. exact files changed;
8. graph payload samples;
9. hard-refresh screenshots or browser evidence;
10. the seed-run identifier and inserted source IDs for limited rollback.

## Step 9 — Independent confirmation

Once Replit supplies the completion package, the owner should reply **“Library seed ready to verify”**. Manus will independently test the live Library API and interface before the work is called complete.

## Emergency stop and rollback

Stop immediately if any foreign-key error, wrong database target, unexpected UI/feature change, duplicated source explosion, or source verification issue occurs.

Rollback does not mean deleting all Library evidence. Replit must use the recorded seed-run IDs to remove or deactivate only source records created by the failed run, then rerun coverage checks.
