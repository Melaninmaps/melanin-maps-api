# Mapping With Melanin — Kinfolk-to-Library Growth Capability Audit

## Verdict

**Kinfolk does not currently implement the full Library Growth Engine.** The current deployment has useful building blocks, but they are not connected into the privacy-safe, thresholded learning loop requested for Mapping With Melanin.

| Required capability | Current state | Verdict |
|---|---|---|
| Kinfolk records query/search activity | `kinfolk_search_events` exists and is used by Kinfolk intelligence analytics | Partial building block |
| Library can store topics | `knowledge_topics` exists | Present |
| Library can represent topic types | API recognizes types including `collection`, `book`, `subtopic`, `geography`, and `general`; graph code uses nodes | Partial building block |
| Library can represent related topics | `topic_relationships` exists and is read by the graph context | Present building block |
| User can create/follow a topic | `/api/knowledge/topics/search-or-create` can directly create a user-created topic | Present but unsafe as an automatic learning strategy |
| Kinfolk turns searches into privacy-safe aggregate signals | No implemented bridge from the chat/search handler to a governed learning queue | Missing |
| Ten-plus distinct users threshold before learning | No distinct-user threshold worker | Missing |
| Chapter/volume/subchapter placement logic | No governed parent-selection/materialization worker | Missing |
| Curator/evidence approval before a new Book becomes public | No complete candidate → evidence-plan → draft → publish gate | Missing |
| New topic creation from demonstrated need | Existing direct user-create endpoint can create immediately; it is not a governed community-learning flow | Missing required governance |
| Search-to-Brick analytics and audit trail | Not deployed as an end-to-end engine | Missing |

## What exists today

The source contains a `kinfolk_search_events` table with raw query, user, category, city, state, and timestamp fields. Kinfolk Intelligence reads search-event analytics. The Library schema supports topics and the graph code reads `topic_relationships`.

The Library route also contains `POST /api/knowledge/topics/search-or-create`. It lets a single signed-in user create a `knowledge_topics` row using a text classifier. That is not the desired flywheel: it can create a topic from one request, does not require source evidence before publication, does not prove a chapter placement is correct, and should not receive sensitive search content.

## Required model

The correct model is **Books → Volumes → Chapters → Subchapters → related-topic web**, with no automatic public publication from raw search behavior.

Example:

```text
Book: Black Women’s Health
  Volume: Reproductive & Maternal Health
    Chapter: Infertility Support
      Subchapter: New Mexico Providers and Community Resources
      Subchapter: Questions to Ask at a First Appointment
    Chapter: Fibroids and Endometriosis
  Related web: Mental Health, Insurance Navigation, Local Support Groups
```

A user query should not automatically become a Book. Kinfolk first reduces it to a safe general subject; removes identifiers and excluded sensitive topics; waits for thresholded community interest; proposes a candidate; asks a curator/evidence workflow to approve it; then builds a draft node, validates its source plan, and only then publishes it.

## Privacy rules

1. Raw chat text, user identity, private notes, medical details, legal matters, divorce, HIV, fertility, domestic violence, immigration status, and other excluded topics must never become publicly inferable Library demand signals.
2. The initial launch threshold is **10 distinct privacy-fingerprinted users** within a rolling 90-day window. This is a minimum, not a reason to expose an individual topic.
3. The system uses a rotating HMAC fingerprint rather than raw user IDs in its growth tables.
4. Load-test accounts and internal test traffic are excluded.
5. Sensitive/professional topics may create a curator-only candidate with enhanced source requirements, but never auto-publish.
6. Members, business owners, circles, and community groups cannot see a candidate’s source searches, identities, or unapproved status.

## Required lifecycle

```text
Kinfolk conversation/search
  → policy classification and user learning preference
  → sanitized, eligible signal
  → one signal per anonymous rotating user fingerprint/day
  → 10+ distinct-user threshold
  → pending review candidate
  → curator approves evidence plan
  → draft Book/Volume/Chapter/Subchapter + topic relationship
  → real sources are verified and attached
  → node is published
  → Kinfolk and Library can route future members to it
```

## Implementation package

- `20260812_library_growth_engine.sql` creates the sanitized signal, candidate, and decision tables with foreign keys and auditability.
- `MWM_Library_Growth_Engine.ts` implements capture, threshold aggregation, curator decision, draft-node materialization, relationship creation, and evidence-gated publication.

No part of this package should be deployed in the current emergency capacity/business-feedback release without its own review, migration test, and privacy validation.
