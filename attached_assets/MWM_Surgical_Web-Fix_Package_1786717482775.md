# MWM Surgical Web-Fix Package

## Purpose

This package is for repairing the existing Mapping With Melanin Railway deployment. It does not replace the application. Replit must apply the patches to the current source, deploy them to Railway, and return the proof artifacts listed below.

## Verified live failures and partial passes

| Area | Live result | Required disposition |
|---|---|---|
| 30 tester login burst | 30/30 HTTP 200 | Preserve and rerun after every deployment. |
| Map pins API | HTTP 200, 743 pins | Preserve API; connect it to a real rendered map. |
| Map UI | Shows `Interactive map coming soon` | Critical fix. Remove placeholder branch when API key is unavailable and render a usable list plus an explicit map-key error; with a valid Google Maps key, render pins. |
| Map phrase search | `Black-owned grocery stores in Atlanta` → `0 results` | Critical fix. Parse category, ownership phrase, and city; return verified results or a review/empty-state explanation. |
| Exact Wadada search | 0 results | Fix canonical search/name indexing and add an exact-name regression test. |
| Library | 11 categories, 142 topics; Divine Nine cards render | Preserve; add follow persistence and source-link tests. |
| KinfolkAI food/pop culture | API HTTP 200 | Preserve; test browser rendering and 30-user queue behavior. |
| KinfolkAI Library topic | HTTP 500 | Critical fix below. |
| Business detail | Renders; brighter brown/cream/gold style visible | Preserve; complete contact fields where data exists. |
| Save/check-in | Both succeeded; check-in awarded +5 points | Preserve; add idempotency tests. |
| Events | `/api/community/events` 404, while route exists as `/api/events` | Fix route compatibility or all callers; do not leave a broken public route. |
| Business owner | Supplied account returned 401 | Either provide a valid disposable owner account or clearly disable owner claim for beta. Do not claim this passed. |
| Billing | 404 | Out of scope for free beta; feature-flag payment UI and remove billing from startup critical path. |

## Exact failing KinfolkAI request

The audit harness sent this authenticated request to the Railway API:

```http
POST https://api-server-production-a991.up.railway.app/api/kinfolk/chat
Content-Type: application/json
Authorization: Bearer <REDACTED>

{"message":"What can I learn from the Divine Nine library topic?"}
```

The redacted live result was:

```json
{
  "http_status": 500,
  "elapsed_ms": 833.4,
  "body": {
    "code": "KINFOLK_ERROR",
    "error": "Kinfolk is having trouble answering that right now. Please try again in a moment."
  }
}
```

No token or session identifier may appear in logs or evidence.

## Patch order

1. Apply `01_kinfolk_library_topic_patch.ts` to the current Kinfolk route.
2. Apply `02_map_production_patch.tsx` to the current map component and ensure the Google Maps key is present in Railway. The fallback must remain useful when the key is absent.
3. Apply `03_events_route_compatibility.ts` or update all frontend callers from `/api/community/events` to `/api/events`.
4. Apply `04_claim_payload_compatibility.tsx` so the existing claim form and backend agree on field names.
5. Apply `05_beta_safety_sql.sql` to confirm public duplicate visibility and beta-safe indexes.
6. Run `06_surgical_regression_tests.ts` and the redacted 30-user gate. Deploy only after all critical assertions pass.

## No-guessing implementation rules

Every business write must pass through one dedupe-aware upsert service. Every public business query must use one shared predicate that excludes `is_duplicate=true`, `permanently_hidden`, archived, and inactive records. A review Merge must mutate the business row transactionally before marking the review item merged. Search must preserve the user’s phrase, normalized tokens, source evidence, and a reason when zero results are returned.

KinfolkAI must return HTTP 200 for a successful Library-topic question even if optional Library enrichment fails. A Library lookup failure must never turn a valid generated answer into HTTP 500. If no exact topic is found, return `libraryAction: { type: "suggest_to_library", subject, category }` or `libraryAction: null` while preserving the answer and source array.

## Required evidence from Replit

Return the deployed commit SHA, Railway deployment ID, migration output, redacted HTTP request/response for the three Kinfolk questions, browser screenshots of the map and Library topic, the exact-name Wadada query result, event endpoint result, and the final 30-user login/concurrency JSON with no tokens or response bodies.

A task is not complete when code is written. It is complete only when the deployed Railway URL returns the expected status and the proof artifacts are attached.
