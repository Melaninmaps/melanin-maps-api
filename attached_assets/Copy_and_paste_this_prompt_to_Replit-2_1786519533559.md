# Copy and paste this prompt to Replit

```text
OWNER-APPROVED FUTURE BUILD — GOVERNED KINFOLK LIBRARY GROWTH ENGINE

## Product outcome

Mapping With Melanin’s Library must become a living evidence system. Kinfolk should learn **from aggregate, privacy-safe community need**, not from individual private searches.

The structure must support:

```text
Book → Volume → Chapter → Subchapter → related-topic web
```

Example:

```text
Book: Black Women’s Health
  Volume: Reproductive & Maternal Health
    Chapter: Infertility Support
      Subchapter: New Mexico Providers and Community Resources
  Related web: Insurance Navigation, Mental Health, Local Support
```

A Book, Volume, Chapter, or Subchapter must never be publicly created merely because one person searched for it. Kinfolk may capture a safe, canonical subject signal only when learning is permitted. A candidate requires at least **10 distinct privacy-protected users** over a 90-day window, curator approval, an evidence plan, verified sources, and a publication gate.

## This is a future governed build

Do not combine this release with the current Kinfolk concurrency repair, business-feedback repair, Library evidence-seed validation, login/auth, map, safety, or mobile work. This is a separate migration and worker deployment with its own review and test gate.

## Exact source materials

Implement the attached files as the starting point, adapting only to actual repository/database conventions:

1. `20260812_library_growth_engine.sql`
2. `MWM_Library_Growth_Engine.ts`
3. `MWM_Library_Book_Volume_Chapter_API_Spec.md`

The existing canonical Library tables remain the source of truth:

- `knowledge_topics`
- `topic_relationships`
- `knowledge_sources`

Do not create a parallel public Library hierarchy.

## Strict no-touch boundary

Touch only:

- Library Growth Engine migration(s);
- server-side growth signal capture, aggregation worker, curator/admin endpoints, and publication gate;
- narrowly required Library API types/tests;
- worker/scheduler registration and environment validation;
- the separate Kinfolk structured action contract needed to open a published Library node.

Do NOT touch login/auth/session behavior, current Kinfolk response content/tone/model configuration, Library visual layout, map rendering, business pages, safety feedback, community/social features, mobile UX, or unrelated database data.

## Required implementation

### 1. Migrate safely

1. Inspect actual production ID types for `users.id` and `knowledge_topics.id` before applying foreign keys.
2. Apply the growth migration through the existing migration runner; never paste untracked DDL directly into production.
3. Ensure migration is idempotent and reversible through an explicit rollback plan.
4. Do not copy raw chat text, email, session ID, or direct user ID into growth tables.
5. Ensure `is_load_test = true` signals are excluded.

### 2. Signal capture

Add a call from the Kinfolk/Universal Search routing layer to `captureLibraryGrowthSignal()` only after all of these conditions pass:

- member learning preference permits aggregate learning;
- request has been canonicalized to a safe general subject;
- no personal identifier or raw private text is retained;
- request is not excluded sensitive material;
- no load-test account/session is involved.

Excluded or non-learning eligible classes include at minimum: HIV status, fertility/infertility details, divorce, domestic violence, abuse, immigration status, minors, direct medical records, direct legal case details, and anything that could expose a person’s private crisis.

Professional subjects may create a curator-only candidate only after stricter policy review. They never auto-publish.

### 3. Threshold worker

Register a server-side scheduled worker that runs at a controlled interval (hourly is acceptable) and only aggregates eligible sanitized signals.

Rules:

- use a rotating one-way HMAC fingerprint; never raw user ID in public candidate tables;
- at most one same-subject signal per privacy fingerprint/day;
- require at least 10 distinct users in a rolling 90-day window;
- create/update a `pending_review` candidate only;
- no public Book, Volume, Chapter, Subchapter, route, notification, business signal, community feed, or Kinfolk statement is created by the worker.

### 4. Curator and evidence gates

Implement curator/admin-only candidate decision and node materialization APIs according to the attached API specification.

A curator-approved candidate may create only a `draft`, disabled node. It remains invisible to members until:

1. a valid parent/child structure exists;
2. an evidence plan exists;
3. required active authoritative/professional sources are attached;
4. high-consequence categories receive required domain review;
5. the explicit publication action succeeds.

### 5. Books, volumes, chapters, subchapters, and web relationships

Use `knowledge_topics` for nodes and `topic_relationships` for edges.

- Book, Volume, Chapter, and Subchapter hierarchy uses `contains`.
- Related topic webs use only allowlisted relation types.
- Reject graph cycles, duplicate nodes, invalid parent types, and ambiguous primary-parent replacements.
- All drafts are disabled and hidden from normal member browse/search.

### 6. Kinfolk → Library handoff

Do not build a generic chatbot link. Kinfolk must return a typed action only for a **published** Library node:

```json
{
  "action": {
    "type": "open_library_node",
    "topicId": "published-topic-id",
    "focus": "evidence",
    "label": "Open this topic in the Library"
  }
}
```

The client must route to `/library?topic=<topicId>&focus=evidence`, and the Library must actually pre-open that topic’s evidence panel. If deep-link resolution fails, show a clear fallback—not an empty screen.

### 7. Environment and operational requirements

- Set and validate `LIBRARY_GROWTH_HMAC_SECRET` in Railway; do not reuse an unrelated key.
- Provide a worker health metric: last run time, eligible signals processed, candidates created/updated, errors.
- If the worker fails, log a sanitized error and notify the founder per the existing five-minute policy. Do not retry by reprocessing raw queries.
- Add a kill switch: `LIBRARY_GROWTH_ENABLED=false` disables capture and aggregation without affecting Library read paths.

## Mandatory tests

1. One user search does not create a candidate or public Book.
2. Nine distinct eligible privacy fingerprints do not create a candidate.
3. Ten distinct eligible fingerprints create a `pending_review` candidate but no public node.
4. Same user repeated searches cannot inflate the threshold.
5. Load-test signals never count.
6. Excluded sensitive searches never create a signal or candidate.
7. Curator approval creates only a draft disabled node.
8. Draft node cannot publish with insufficient verified sources.
9. Valid evidence plan and sources permit publication.
10. Invalid hierarchy, cycle, and duplicate relation requests fail safely.
11. Published node appears in Library and direct deep link opens its evidence panel.
12. Kinfolk can link only to published nodes and never reveals candidate/search-demand information.
13. Existing Kinfolk, Library evidence, map, business feedback, login, and mobile tests remain green.

## Required proof back to owner and Manus

Return:

1. exact files and migration names;
2. migration preflight and rollback instructions;
3. Railway environment/worker health proof;
4. automated test output for all 13 cases;
5. sanitized candidate example showing 10+ distinct fingerprints and no raw query/user ID;
6. curator approval → draft node → sources → published node proof;
7. browser proof that a Kinfolk action opens the correct published Library evidence panel;
8. new deployment SHA and a `stale_bundle: false` version response.

Do not call this complete until Manus independently verifies the deployed workflow.
```
