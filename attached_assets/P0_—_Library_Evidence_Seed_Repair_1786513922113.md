# P0 — Library Evidence Seed Repair

## Why the Library says “We’re building this Book”

This is a **real production data gap**, not a browser issue and not a misunderstanding of how the panel works.

The live Library graph API for **African Diaspora History** returned HTTP 200 and correctly identified the published topic, but it returned:

```json
{
  "node": {
    "id": "fbfbc161-5121-4eca-a0a4-c35731b010f6",
    "topic_name": "African Diaspora History",
    "category": "diaspora",
    "status": "published"
  },
  "sources": [],
  "articles": []
}
```

The front end is doing exactly what that data tells it to do: show **“We’re building this Book.”**

The topic-list payload makes the defect clearer. It contains a `trustedSources` metadata field with three names—Smithsonian NMAAHC, UNESCO, and the Library of Congress—but these are only topic-card metadata. They were **not created as actual active source records and topic-to-source evidence mappings** that the Library graph reads.

> The Library taxonomy and descriptions were seeded. The evidence layer that makes a Book useful and trustworthy was not.

## Scope verified live

All seven visible `diaspora` topics have the same split between topic metadata and graph evidence:

| Topic | `trustedSources` metadata | Live graph sources | Live articles |
|---|---:|---:|---:|
| African Diaspora History | 3 | **0** | 0 |
| Black & Diaspora Foodways | 1 | **0** | 0 |
| Cultural Etiquette & Customs | 1 | **0** | 0 |
| Cultural Preservation & Oral History | 3 | **0** | 0 |
| Festivals & Cultural Celebrations | 2 | **0** | 0 |
| Genealogy & Family History | 3 | **0** | 0 |
| Heritage Language Learning | 1 | **0** | 0 |

The prior database coverage inventory also identified **126 published Travel/regional topics** without active direct source mappings. This is therefore a systematic evidence-seeding failure, not a one-book omission.

## Strict no-touch boundary

This repair touches only Library evidence data and the production-safe source-to-topic mapping job. Do **not** alter login, KinfolkAI behavior, map rendering, Safety Hub, business pages, mobile app, UI layouts, topic descriptions, user follows, or any unrelated feature.

## Required repair sequence

### 1. Verify the production evidence tables

From the Railway API service’s **production** database, identify the exact topic, source, and mapping tables/columns using the read-only schema query in `MWM_Library_Source_Mapping_SQL.md`. Do not use a preview, local, or dev database.

### 2. Seed actual evidence records—not only display metadata

For every approved source:

1. Create or upsert an active source record with the source name, canonical URL, institutional authority tier, and `last_verified` timestamp.
2. Create one active direct mapping to the correct published topic with scope `verified_topic`, not merely a destination-context link.
3. Avoid duplicate source URLs and duplicate mappings.
4. Record a concise, factual relevance note. Do not fabricate a claim or article summary.

### 3. First production seed: African Diaspora History

Seed these verified institutional sources first, all mapped directly to topic ID `fbfbc161-5121-4eca-a0a4-c35731b010f6`:

| Source | Canonical URL | Evidence role |
|---|---|---|
| UNESCO — *General History of Africa* | https://www.unesco.org/en/general-history-africa | High-authority synthesis; UNESCO describes the project’s history, African perspectives, diasporas, and the Global Africa volume. |
| Smithsonian Folklife Festival — *African Diaspora* | https://festival.si.edu/past-program/1976/african-diaspora | Smithsonian archival/interpretive source documenting cultural connections among African, Caribbean, Latin American, and Black American communities. |
| Smithsonian NMAAHC — *Digital Resource Guide* | https://nmaahc.si.edu/explore/nmaahc-digital-resource-guide | Curated museum resources and primary/interpretive digital materials for African American history and the global diaspora context. |

These are beginning sources, not the finished Book. The goal of this P0 is to make the Book truthful, usable, and evidence-backed instead of empty.

### 4. Seed the remaining six visible diaspora topics in the same deployment

Each topic must receive at least **two** active, distinct, directly mapped authoritative sources before the UI is called ready. Use institutional, archival, university, museum, or official cultural-heritage sources appropriate to the subject. Source selection must be reviewed by topic—not copied mechanically from `trustedSources` metadata.

### 5. Repair the systematic backlog through a controlled data job

Create an idempotent, data-only seeding job/runbook for the remaining published topics lacking direct sources. It must:

- use canonical URLs and upsert/deduplicate by normalized URL;
- create mappings with `status='active'` and direct verified scope;
- never overwrite user content or community evidence;
- output inserted, reused, skipped, duplicate, and failed counts by topic;
- be run first on the seven diaspora topics, then in reviewable batches for the 126-topic backlog;
- never change product code or UI merely to hide an empty evidence state.

## Required proof before declaring this fixed

1. Run the live graph endpoint for African Diaspora History:

```text
GET /api/knowledge/graph/fbfbc161-5121-4eca-a0a4-c35731b010f6?surface=library
```

It must return `sources.length >= 3`, with the three verified institutional URLs above.

2. For every visible diaspora topic, the graph endpoint must return at least two active source records.

3. The Library slide-over must render those sources after a hard refresh. It must **not** show “We’re building this Book” for a topic that has been declared seeded.

4. Return a redacted production query output showing source counts, source names, canonical URLs, authority tiers, mapping scope, and mapping status for the seven topics.

5. Return the batch coverage report for the remaining published no-source topics. Do not claim that the Library is complete until each listed topic has actual graph evidence.

## What the founder should expect after the first repair

When a member opens **African Diaspora History**, they should see real, labeled, clickable, verified institutional sources—not only a beautiful title and a request for the community to contribute. Community evidence should remain an additional layer, not the substitute for the platform’s promised evidence layer.
