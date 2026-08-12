# Final Website Launch Completion Ticket — One Controlled Repair Sweep Before the 30-User Audit

**Priority:** P0 launch completion  
**Production website:** `https://www.mappingwithmelanin.com`  
**Current audited deployment:** `8623e5f10628c72d8e35347e30fcb3074d1cbf63`  
**Owner:** Replit engineering  
**Independent final verifier:** Manus  
**Release policy:** Targeted website repair mode; native iOS/Android submission branch remains separately frozen pending the iPad sign-in repair.

> **Objective:** Complete the defined website blockers in one controlled repair sweep, deploy one website release candidate, provide one complete Railway proof package, and then let Manus run the single staged 1 → 5 → 15 → 30 concurrent production audit. Do not send piecemeal “ready for audit” messages before the full proof package is complete.

## 1. The decision and the boundaries

The website does **not** need a broad Apple freeze now that Apple rejected Build 102. Website production may receive only this controlled repair sweep. The mobile submission branch must remain separate and frozen until its iPad sign-in bug is reproduced and repaired; it must not be mixed into the website release.

The following work is the complete website scope before the final concurrent audit. It includes every currently verified item that can make the 30 testers experience crashes, wrong-city results, missing map pins, or a broken cross-feature journey.

| Workstream | Launch effect | Must complete before final 30-user audit? |
| --- | --- | --- |
| A. Concurrent authenticated bootstrap reads | Previous 30-user run returned 503s from preferences, sessions, and Library evidence/graph reads. | **Yes — P0** |
| B. Coordinate integrity and map coverage | Tour sites, recurring events, community organizations, and some cultural sites cannot reliably be pinned. | **Yes — P0** |
| C. Strict city filtering and truthful result contracts | Wrong-city Houston event and Washington hair result leak into city-bound searches. | **Yes — P0** |
| D. Directory-to-map handoff | `/map?q=restaurant in Phuket` opens Philadelphia rather than Phuket results. | **Yes — P0** |
| E. Existing feature regression gate | Login, Kinfolk, Library deep link, business pages, and Safety must remain working while repairs deploy. | **Yes — P0** |
| F. Business/event inventory reconciliation | Live totals differ from claimed totals: businesses 2,433 vs 2,639; live events show one, not 514. | **Yes for truthfulness; no fabricated backfill** |
| G. Shawn Hill Homes | A real, verified Los Angeles listing is missing. | **Complete in this sweep only with verified business source details; does not justify fake data or delay capacity proof.** |
| H. Native iPad sign-in rejection | Apple rejected Build 102 after demo sign-in. | **Separate native-only track; not part of website release.** |

### Absolute change prohibition

Do **not** change authentication flow, login pages, cookie/session format, password flows, profile schema, Kinfolk model/provider/prompt behavior, Library content/editorial data, Safety Hub, business feedback, Community Vibes, mobile code, global styling, Google Maps API key loading, package versions, or unrelated deployment configuration.

No synthetic businesses, events, reviews, ratings, feedback, quotes, coordinates, Library sources, or user activity may be seeded to make dashboards look complete.

## 2. Allowed file scope

The release may touch only the files below, associated targeted tests, and generated production artifacts/build identity. Any additional source file requires explicit founder approval before editing.

| File | Exact permitted purpose |
| --- | --- |
| `artifacts/api-server/src/lib/auth.ts` | Add short-lived, invalidation-safe session read single-flight/cache only. Preserve session format and credentials behavior. |
| `artifacts/api-server/src/middlewares/authMiddleware.ts` | Add/instate a bounded role/is-load-test cache to avoid per-request user DB reads; preserve authorization decisions and immediate invalidation on role change. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Reduce bootstrap preference reads from three queries to one query; add per-user read coalescing/cache with write invalidation; cache session-list reads only with mutation invalidation. Do not change Kinfolk chat semantics. |
| `artifacts/api-server/src/routes/knowledge-graph.ts` | Add public graph/evidence response single-flight and bounded TTL caching keyed by topic/surface only. Do not cache user identity or private state. |
| `artifacts/api-server/src/lib/startup-migrations.ts` | Register one idempotent coordinate verification/backfill migration and no unrelated migration. |
| `artifacts/api-server/src/data/tour-cultural-sites-seed.ts` | Add source-verified coordinates only for existing stable IDs. |
| `artifacts/api-server/src/data/recurring-events-seed.ts` | Add source-verified coordinates only for existing stable IDs. |
| `artifacts/api-server/src/data/community-organizations-seed.ts` | Add source-verified coordinates only for existing stable IDs. |
| `artifacts/api-server/src/routes/tour-cultural-sites.ts` | Preserve valid coordinate output. |
| `artifacts/api-server/src/routes/recurring-events-route.ts` | Select and return persisted `latitude`/`longitude`. |
| `artifacts/api-server/src/routes/community-orgs.ts` | Select and return persisted `latitude`/`longitude`. |
| `artifacts/api-server/src/routes/cultural-sites.ts` | Ensure map-ready returned records have valid coordinate pairs; no editorial-data rewrite. |
| `artifacts/api-server/src/routes/events.ts` | Apply city/state filters; return a truthful total after active/upcoming filtering. |
| `artifacts/api-server/src/routes/businesses.ts` | Make fuzzy fallback retain all restrictive filters and maintain a truthful `total`. |
| `artifacts/api-server/src/routes/maps.ts` or one new narrowly named map adapter | Expose valid non-business discoverability pins only. |
| `artifacts/api-server/src/routes/index.ts` | Register only the new map adapter if it cannot reside in `maps.ts`. |
| `artifacts/web/src/pages/map.tsx` | Consume directory `?q=` handoff, run the existing search once, pan to the target geography, and render valid adapter pins. |
| Focused tests only | Verify the named acceptance cases in §7. |

## 3. Workstream A — fix the authenticated bootstrap 503s

### A.1 Reproduced failure

The previous staged production run passed at 1, 5, and 15 users, but failed at the 30-user stage when simultaneous post-login reads returned HTTP 503 from preferences, sessions, and Library evidence/graph. This was separate from the previously repaired Kinfolk token limit. The production service recovered once load stopped.

### A.2 Required root-cause instrumentation before changing behavior

For the three bootstrap paths below, add structured measurements for the duration of this repair and production proof:

```text
GET /api/kinfolk/preferences
GET /api/kinfolk/sessions
GET /api/knowledge/graph/:topicId?surface=library
```

Every measurement must include endpoint, request ID, user ID hash (never email), cache state (`hit`, `miss`, `coalesced`), database query count, duration milliseconds, pool `total`, `idle`, and `waiting`, plus response status. Log only metadata; never log a session token, cookie, prompt, sensitive search, or personal preference content.

### A.3 Session read coalescing — `lib/auth.ts`

`getSession(sid)` currently executes a database read on every authenticated request. Add a tiny in-process cache with an in-flight promise map keyed by **session ID**, subject to all of these rules:

1. Maximum TTL: **5 seconds** for a valid session read.
2. Concurrent callers for the same session ID must await the same in-flight query rather than issue duplicate reads.
3. `updateSession`, `deleteSession`, `clearSession`, and any explicit logout path must evict the session key before returning.
4. Expired or missing sessions must not be cached as valid sessions.
5. No session data may be written to logs or shared between keys.
6. This is a read-coalescing optimization only; it must not change session authentication, expiry, cookie semantics, or login behavior.

### A.4 Role/is-load-test cache — `authMiddleware.ts`

The role refresh must not query `users` on every request during a startup burst. Use a cache keyed by user ID with a **60-second TTL**, storing only `role` and `is_load_test` (if it is used by suppression logic).

The cache must be invalidated synchronously in the narrow code path that changes a user's role or test flag. If the cache misses or the database check fails, preserve the existing safe behavior: use the signed/session role already present for that request and never log the member out merely because a refresh lookup failed.

### A.5 Preferences query consolidation and cache — `routes/kinfolk.ts`

`GET /kinfolk/preferences` currently reads the same user through a Drizzle query and two additional SQL queries. Replace that with **one parameterized query** joining `user_preferences` to `kinfolk_delivery_profiles`, including `kinfolk_voice`, then perform the existing normalization in memory.

Use a per-user cache/single-flight keyed by `userId` with a maximum TTL of **30 seconds**. Invalidate the key before responding successfully from both:

```text
PUT /api/kinfolk/preferences
PUT /api/kinfolk/preferences/response-style
```

The exact existing response envelope must remain compatible:

```json
{
  "preferences": { "...": "..." },
  "responseStyle": "conversational|concise|detailed|professional",
  "deliveryProfile": { "detailLevel": "...", "tonePreference": "..." }
}
```

Do not alter the Conversational ↔ Friendly compatibility bridge, Taste Profile hydration behavior, or preference privacy.

### A.6 Sessions-list cache — `routes/kinfolk.ts`

`GET /kinfolk/sessions` can use a maximum **15-second** per-user cache and single-flight. Invalidate it immediately after any route that creates, updates, deletes, or shares a Kinfolk session. Never cache one member's sessions under another member's key.

### A.7 Library evidence/graph cache — `routes/knowledge-graph.ts`

Cache only the fully resolved **public, non-personalized** graph/evidence payload using a key shaped as:

```text
library-graph:{topicId}:{surface}
```

Use a five-minute TTL and an in-flight promise map. The cache must:

- store no user ID, session ID, save state, private annotation, growth signal, or preference;
- be invalidated when Library node/evidence publication or source verification changes;
- not cache errors;
- preserve source order and exact response shape; and
- return `Cache-Control: private, max-age=0` to browsers unless the current privacy model has separately approved public browser caching.

### A.8 Capacity guardrails

Retain the working Kinfolk token bucket exactly as deployed. Do not raise OpenAI concurrency as a way to hide database-pool problems.

Keep application-pool maximum at the approved value only after confirming Railway/Postgres headroom. The release must expose pool health in `/api/readyz` as total, idle, waiting, and configured maximum. During final test, abort on either of the following:

```text
waiting > 0 for two consecutive 15-second samples
OR total connections >= 80% of the configured safe application pool ceiling
```

## 4. Workstream B — repair coordinate-backed discovery and map visibility

### B.1 Required production truth

The authenticated 21-city audit showed the following live state:

| Collection | Audited live result | Required repair outcome |
| --- | --- | --- |
| Businesses | City-query results were coordinate-valid, but global count was 2,433 not claimed 2,639. | Keep only real listings; reconcile count transparently. |
| Tour cultural sites | 45/599 coordinate-valid. | Backfill only source-verified pairs; map-render valid rows. |
| Recurring events | 0/85 map-usable in live response. | Persist and return valid pairs; map-render valid rows. |
| Community organizations | 0/61 map-usable in live response. | Persist and return valid pairs; map-render valid rows. |
| Cultural sites | Coordinate gaps in every audited city. | Exclude unlocated entries from map pins until verified. |

Coordinates must be numeric, nonzero, within latitude/longitude ranges, linked to the stable existing record ID, and supported by a verified address/source. **Never substitute a city centroid for a venue or organization address.**

### B.2 Idempotent coordinate migration

Add one transaction-backed migration in `startup-migrations.ts`. It must validate the approved seed entries, update only missing/invalid stored pairs, leave valid stored pairs untouched, and log per collection: examined, repaired, already valid, skipped for missing source coordinate, rejected for invalid source coordinate.

The migration must stop before writing if any seed has duplicate stable IDs or invalid coordinate pairs. It must create a timestamped rollback artifact containing entity, stable ID, prior pair, new pair, migration ID, and timestamp.

`GET /recurring-events` and `GET /community-orgs` must explicitly select and return `latitude` and `longitude`. Do not convert missing values to `0` or an empty coordinate.

### B.3 Map adapter

Add one read-only endpoint:

```http
GET /api/maps/discoverability-pins
```

It must return only coordinate-valid active rows from `tour_cultural_sites`, `recurring_events`, and `community_organizations`, with this stable contract:

```json
{
  "pins": [{
    "id": "stable-id",
    "sourceType": "tour_cultural_site|recurring_event|community_organization",
    "name": "Real record name",
    "city": "City",
    "state": "State",
    "latitude": 0,
    "longitude": 0,
    "description": "Optional existing real description",
    "detailPath": "/real-existing-path"
  }]
}
```

The map must consume these pins. Tour sites belong under the existing Cultural Sites legend; recurring events under Community Events; organizations under Cultural Sites or a clearly labeled organization filter in the same component. No fake map pin, rating, or description is permitted.

## 5. Workstream C — make city-scoped results honest and local

### C.1 Events

`events.ts` must parse and apply `city` and `state` filters to its existing query conditions before fetching records. The response must provide `total: upcoming.length` after the existing active/upcoming filtering. Do not globally fall back if a selected city has no event.

**Required regression cases:**

```text
/api/events?city=Philadelphia never includes an event whose city is not Philadelphia
/api/events?city=Phuket never returns the Houston event
/api/events?city=Houston may return Houston records only
```

### C.2 Business fuzzy fallback

The ordinary business query carries the caller's city restriction. Its raw fuzzy fallback currently drops that restriction, producing the reproduced nonlocal `Hair by Kamaria (Washington)` result for `city=Phuket&search=hair` while reporting `total: 0`.

Both fuzzy SQL branches must retain every supplied restrictive scope: listing eligibility, city, state, country, category, subcategory, ownership, and geographic bounds. Parameterize every value. If constrained fallback has no local result, return:

```json
{ "businesses": [], "total": 0, "searchScope": "local" }
```

Do not inject a global result without a future explicit user-controlled `expandRadius` request.

Standard pagination may have `total > returned list length`; that is valid. The defect is that any returned fuzzy fallback row must belong to the same constrained result universe as `total`.

### C.3 Inventory reconciliation

Run production counts by status and provide the factual result. If 206 alleged business rows or 513 alleged event rows are not actually active and published in Railway, do not claim they are discoverable. Reconcile them through verified data source/status rules, not by creating placeholder records.

## 6. Workstream D — repair directory-to-map handoff

The directory correctly produces a link such as:

```text
/map?q=restaurant%20in%20Phuket
```

`map.tsx` must reactively read `q` with Wouter `useSearch()`, set the map search field, and invoke the existing universal search exactly once for each distinct query after map readiness.

The existing search should then extract Phuket as geography, pan/zoom to Phuket, pass its coordinates to universal search, and show only the matching MWM business markers. It must not center on the signed-in member's Philadelphia home city after a Phuket handoff.

**Required web proof:** `/businesses` search for `restaurant in Phuket` returns the local results; selecting **Search on Map** opens the map centered in Phuket with matching MWM pins and a visible Suay Restaurant result/pin when included by search ranking.

## 7. Workstream E — regression and integrity gate

Do not add new features. Verify these existing paths after the single deployment:

| Path | Required live outcome |
| --- | --- |
| Email/password member sign-in | HTTP 200 and an authenticated website session; no password-change loop. |
| Kinfolk | Basic calculation and city/business prompt return a response; no 401/5xx. |
| Kinfolk Taste Profile | Detailed save persists across a hard refresh and exposes the correct pressed state. |
| Library deep link | `/library?topic=fbfbc161-5121-4eca-a0a4-c35731b010f6&focus=evidence` opens African Diaspora History evidence, not the browse grid. |
| Business exact search | Hakim's Bookstore is reachable from the real web directory. |
| Phuket directory discovery | Restaurant search returns real named Phuket records, including Suay when data/ranking includes it. |
| Community Vibes/Community Says | Existing persisted feedback behavior remains unchanged; no seeded counts or quotes appear. |
| Map base rendering | Google map loads and existing business/cultural pins still display without console errors. |

### Shawn Hill Homes

Do not fabricate this listing. In the same data-only sweep, add it only after the founder provides or Replit verifies legal business name, public address/service area, website, phone/email, category, ownership/claim status, and a source link. The listing must be a normal real record, not a demo or seeded review. If this evidence is not yet available, log it as pending and do not block the capacity audit on it.

## 8. Workstream F — separate native Apple repair track

This item is not permitted in the website release. Assign it to the native iOS/Android branch after the website audit is clean.

Apple rejected Build 102 because the demo **Sign in** action errored on an iPad Air 11-inch (M3), iPadOS 26.6. Before resubmission, reproduce the reviewer route exactly: clean install, no prior app data, enter approved demo credentials, press sign-in, inspect native network/log error, and test the same build on iPad layout. The native fix must not be presented as complete from a browser test.

## 9. Required focused tests

| ID | Required assertion |
| --- | --- |
| `BOOT-01` | Thirty concurrent reads for the same valid session produce one session-storage read while active; all responses retain authentication. |
| `BOOT-02` | Thirty concurrent `GET /kinfolk/preferences` requests per distinct users complete without 5xx, and writes invalidate only that user's cached profile. |
| `BOOT-03` | Thirty concurrent graph reads for the same topic/surface coalesce and preserve the exact evidence payload. |
| `BOOT-04` | Cache invalidation after session logout, role update, preference save, Kinfolk session mutation, and Library evidence publication is correct. |
| `DISC-01` | Tour, recurring-event, and organization APIs expose coordinate fields; adapter never returns missing/invalid pairs. |
| `DISC-02` | Events never leak Houston to Philadelphia or Phuket city queries. |
| `DISC-03` | Phuket `hair` search never returns Hair by Kamaria/Washington when local total is zero. |
| `MAP-01` | `/map?q=restaurant%20in%20Phuket` starts one search, centers in Phuket, and limits business markers to the matching result set. |
| `REG-01` | Login, Kinfolk, Library deep link, Taste Profile persistence, business exact search, and basic map loading remain green. |

## 10. One required Railway proof package

Replit must submit this package as one final response after the release is live; do not ask Manus to audit before it is complete.

1. **Exact changed-file list** and commit SHA, demonstrating no out-of-scope files changed.
2. **`/api/version`** response showing the deployed SHA, matching bundle hashes, and `stale_bundle: false`.
3. **`/api/readyz`** response showing database healthy plus pool total, idle, waiting, and configured max.
4. **Coordinate counts** from Railway production: active, coordinate-valid, missing, invalid for tour sites, recurring events, community organizations, and cultural sites.
5. **City filtering proof** for Philadelphia, Houston, and Phuket events; Phuket hair business lookup; and page-limit/pagination semantics for a city restaurant search.
6. **Map adapter proof**: counts by `sourceType`, with zero invalid coordinate pairs.
7. **Browser evidence** that directory → Search on Map → Phuket centers and shows local matching pins.
8. **Bootstrap load proof** from Replit's own 30-account staged run: latency/status counts for the three bootstrap endpoints; pool samples; cache hit/miss/coalesced metrics; no 5xx; no waiting threshold breach.
9. **Regression test results** for §7 and §9.
10. **Rollback artifact location** and exact migration identifier.

## 11. Release procedure — no more back-and-forth

1. Replit branches from the verified current production source.
2. Replit implements every workstream in this ticket only; no new features or cleanups.
3. Replit runs focused local tests plus an internal staged 1 → 5 → 15 → 30 synthetic-read rehearsal.
4. Replit deploys one website release candidate with required compiled artifact and build identity synchronized.
5. Replit waits for Railway readiness, executes the full §10 proof package against production, and sends it in **one** response.
6. Manus independently verifies deployment identity, source outcomes, representative website journeys, and then runs the final staged 1 → 5 → 15 → 30 production audit.
7. Tester invitations are sent only if that final audit passes.

### Final audit pass standard

The final production audit passes only if all 30 accounts can log in and complete the agreed read journey without 5xx; no pool waiting threshold is breached; Kinfolk remains within its token guardrails; city-constrained discoverability is truthful; map handoff works for Phuket; and all regression paths in §7 remain green.

If any gate fails, stop the audit, notify the founder within five minutes, preserve the exact error/metric evidence, and issue a narrow follow-up only for that failing gate. Do not reopen unrelated files.

## References

[1]: https://www.mappingwithmelanin.com/api/version "Production deployment identity"
[2]: https://www.mappingwithmelanin.com/api/readyz "Production readiness probe"
[3]: https://www.mappingwithmelanin.com/businesses "Live business directory"
[4]: https://www.mappingwithmelanin.com/map?q=restaurant%20in%20Phuket "Required Phuket map-handoff outcome"
[5]: https://www.mappingwithmelanin.com/library?topic=fbfbc161-5121-4eca-a0a4-c35731b010f6&focus=evidence "Verified Library deep-link regression gate"
