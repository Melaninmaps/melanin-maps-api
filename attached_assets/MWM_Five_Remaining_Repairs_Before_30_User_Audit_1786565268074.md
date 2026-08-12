# Final Corrective Audit — The Five Remaining Repairs Before the 30-User Staged Audit

**Production website:** `https://www.mappingwithmelanin.com`  
**Current verified deployment:** `665c94d388f1b91a40c588c60174b61fd7d13d6c`  
**Status:** **Do not start the final 30-user audit until all five items below pass in production.**  
**Owner:** Replit engineering  
**Independent verifier:** Manus

> **You are not missing anything.** The delay is not because there are dozens of unknown problems. There are now exactly five defined launch gates. Several source changes are deployed, but a feature is not complete until it works in the live website and its production data proves the required state.

## What is already independently passing — do not reopen it

| Verified production item | Status | Do not touch it except regression test |
| --- | --- | --- |
| Railway deployment identity | SHA `665c94d3`; bundle hashes match; `stale_bundle: false`. | Pass |
| Idle production health | Database healthy; pool has no waiting connections while idle. | Pass, not a capacity proof |
| Member login | Isolated test account logs in; no forced-password-change wall. | Pass |
| Event city filtering | Philadelphia and Phuket event queries no longer leak the Houston event. | Pass |
| City-constrained fuzzy business search | Phuket `hair` returns no Washington business and truthful zero result. | Pass |
| Basic single authenticated reads | Preferences, sessions, and African Diaspora History Library graph each return HTTP 200 singly. | Pass, not a capacity proof |
| Phuket seed sites | Big Buddha and Wat Chalong are still returned with valid coordinates. | Pass |

**Do not change login, session format, Kinfolk model/prompt behavior, Library content, Safety, Community Vibes, mobile code, global styles, or unrelated map initialization.**

---

# Repair 1 of 5 — Make the directory-to-map handoff execute in the live map

## Verified failure

The live authenticated URL retains `?q=restaurant%20in%20Phuket`, but the visible map search is not populated, the map remains centered on Philadelphia, the page does not show Phuket, and no universal-search request runs. Query parsing alone is not enough; the running effect is not producing the required behavior.

## Permitted files

```text
artifacts/web/src/pages/map.tsx
one focused map component or E2E test only
compiled web artifact and BUILD_IDENTITY only
```

## Exact repair

1. Use Wouter `useSearch()` to derive `handoffQuery` reactively from `q`.
2. Keep a `useRef<string | null>` named similarly to `appliedHandoffQueryRef`, so each distinct query runs once—not zero times and not repeatedly.
3. Ensure the handoff effect runs only after the Google map object is ready **and** the existing `runUniversalSearch` callback has been declared. Do not place it in an effect with stale/incomplete dependency closure.
4. Change `runUniversalSearch` to accept an optional `queryOverride` rather than relying on asynchronous `setSearch()` state.
5. The effect must call `runUniversalSearch(handoffQuery)`, not merely set the input value.
6. Inside the existing search function, preserve the target city parsed from the query. It must not silently revert to the signed-in member’s home city or current browser coordinate.

Required shape:

```ts
const locationSearch = useSearch();
const handoffQuery = useMemo(
  () => new URLSearchParams(locationSearch).get("q")?.trim() ?? "",
  [locationSearch],
);
const appliedHandoffQueryRef = useRef<string | null>(null);

const runUniversalSearch = useCallback(async (queryOverride?: string) => {
  const query = (queryOverride ?? search).trim();
  if (query.length < 2) return;
  // Preserve existing classification/geography logic.
  // It must geocode/resolve Phuket from this exact query before searching.
}, [search, /* existing stable dependencies only */]);

useEffect(() => {
  if (!handoffQuery || !mapRef.current || !mapReady) return;
  if (appliedHandoffQueryRef.current === handoffQuery) return;

  appliedHandoffQueryRef.current = handoffQuery;
  setSidebarOpen(true);
  setLegendFilter("business");
  setSearch(handoffQuery);
  void runUniversalSearch(handoffQuery);
}, [handoffQuery, mapReady, runUniversalSearch]);
```

Adapt identifiers to the real component, but keep the behavior exactly.

## Required live acceptance test

```text
1. Sign in to website.
2. Go to /businesses.
3. Search: restaurant in Phuket.
4. Click Search on Map.
5. URL remains /map?q=restaurant%20in%20Phuket.
6. Search input visibly shows restaurant in Phuket.
7. Map centers/zooms to Phuket—not Philadelphia.
8. One search runs and matching local MWM pins are rendered.
9. Browser Back works and changing q to a new value runs exactly once again.
```

**Pass evidence:** authenticated screen recording plus browser network list showing the single search request and no Philadelphia fallback.

---

# Repair 2 of 5 — Mount the non-business discoverability pin layer in the active map lifecycle

## Verified failure

`GET /api/maps/discoverability-pins` exists and returns 82 valid tour-site pins, but the live map never requests it. The observed map lifecycle fetches business pins, cultural sites, events, and sundown towns only. Therefore the endpoint is dead code from a member’s point of view.

## Permitted files

```text
artifacts/web/src/pages/map.tsx
one focused map test only
```

No route, API, seed, style-system, or Google Maps loader rewrite is allowed for this item.

## Exact repair

1. Define a local `DiscoverabilityPin` type matching the deployed endpoint:

```ts
type DiscoverabilityPin = {
  id: string;
  sourceType: "tour_cultural_site" | "recurring_event" | "community_organization";
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  description?: string | null;
  detailPath?: string | null;
};
```

2. In the **same authenticated map data-load lifecycle** that fetches existing map layers, fetch:

```text
GET /api/maps/discoverability-pins
```

3. Store only rows whose coordinate pair is finite, nonzero, and within latitude/longitude range. Do not repair coordinates in the browser.
4. Render these pins after the map object is ready. Use existing brand marker conventions:

| Source type | Legend surface | Marker behavior |
| --- | --- | --- |
| `tour_cultural_site` | Cultural Sites | Existing cultural/diamond treatment |
| `recurring_event` | Community Events | Existing event/orange treatment |
| `community_organization` | Cultural Sites or a clearly labeled organization control | Existing brand-consistent non-business treatment |

5. Pin popup must show only actual API data: name, source label, city/state, optional existing description, and valid detail path. No fabricated score, review, quote, or marketing copy.
6. A failed adapter request must show no fake pins and must not break existing business/cultural/event pins.

## Required live acceptance test

```text
Authenticated /map load triggers /api/maps/discoverability-pins exactly once.
Every returned pin has a valid coordinate pair.
Tour sites appear under Cultural Sites.
After Repair 3 completes, a recurring event and a community organization appear on-map and can open a real popup/detail path.
Existing business, cultural, event, and sundown-town layers still load.
```

**Pass evidence:** browser network capture contains `/api/maps/discoverability-pins`; screenshot shows at least one pin from each available source type after verified coordinate work.

---

# Repair 3 of 5 — Replace the unsafe coordinate job and complete real, provenance-backed coordinate coverage

## Verified failure

Live production is still incomplete:

| Collection | Rows examined | Valid coordinates now | Missing/invalid now |
| --- | ---:| ---:| ---:|
| Tour cultural sites | 599 | 95 | 504 |
| Recurring events | 85 | 0 | 85 |
| Community organizations | 61 | 0 | 61 |
| Cultural sites | 1,000 API rows returned | 624 | 376 |

The public OSM Nominatim approach described by Replit—745 background/boot requests at 100 ms each—is not acceptable for this task. Official OSM policy allows an absolute maximum of one request per second, strongly discourages periodic bulk geocoding, and requires appropriate caching; routine scripts have stricter limits. [1]

## Permitted files

```text
artifacts/api-server/src/lib/startup-migrations.ts
artifacts/api-server/src/data/tour-cultural-sites-seed.ts
artifacts/api-server/src/data/recurring-events-seed.ts
artifacts/api-server/src/data/community-organizations-seed.ts
artifacts/api-server/src/routes/tour-cultural-sites.ts
artifacts/api-server/src/routes/recurring-events-route.ts
artifacts/api-server/src/routes/community-orgs.ts
artifacts/api-server/src/routes/cultural-sites.ts
one focused migration/API test file only
```

## Exact repair

1. **Disable the unbounded/boot-triggered public-Nominatim batch immediately.** Do not retry it on every Railway boot and do not issue public-Nominatim traffic at 10 requests per second.
2. Use one compliant alternative chosen and documented by Replit:
   - a licensed commercial geocoder using server-side credentials, request limits, cache, retry/backoff, and provenance;
   - a self-hosted or provider-operated Nominatim instance governed by its own contract; or
   - an approved one-time source dataset containing authoritative coordinates tied to the stable record ID.
3. Store coordinate provenance at least in the migration audit artifact: `entity`, stable `id`, source URL/provider, normalized address, latitude, longitude, resolution timestamp, and confidence/match reason.
4. Do not place city-centroid coordinates on venue/event/organization records. If the address cannot be verified, leave it null and keep it out of map pins.
5. The migration must be idempotent and transaction-safe:
   - validate source input before any write;
   - reject duplicate stable IDs and invalid coordinate pairs;
   - update only missing/invalid pairs;
   - never overwrite an existing valid pair without an explicit reviewed correction record;
   - write a rollback artifact of every changed row.
6. Keep the new recurring-event and community-organization coordinate response fields. They are correct, but null values do not count as completion.
7. Cultural sites with missing pairs may remain browseable only if excluded from map pin placement until sourced; do not claim they are map-ready.

## Required production count query

Run this after migration completion and include raw output in the proof package:

```sql
WITH inventory AS (
  SELECT 'tour_cultural_sites' AS entity, id, latitude, longitude
  FROM tour_cultural_sites WHERE is_active = true
  UNION ALL
  SELECT 'recurring_events', id, latitude, longitude
  FROM recurring_events WHERE is_active = true
  UNION ALL
  SELECT 'community_organizations', id, latitude, longitude
  FROM community_organizations WHERE is_active = true
  UNION ALL
  SELECT 'cultural_sites', id, latitude, longitude
  FROM cultural_sites
)
SELECT
  entity,
  COUNT(*) AS examined,
  COUNT(*) FILTER (
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND latitude::numeric BETWEEN -90 AND 90
      AND longitude::numeric BETWEEN -180 AND 180
      AND NOT (latitude::numeric = 0 AND longitude::numeric = 0)
  ) AS coordinate_valid,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS coordinate_missing,
  COUNT(*) FILTER (
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND (latitude::numeric NOT BETWEEN -90 AND 90
        OR longitude::numeric NOT BETWEEN -180 AND 180
        OR (latitude::numeric = 0 AND longitude::numeric = 0))
  ) AS coordinate_invalid
FROM inventory
GROUP BY entity
ORDER BY entity;
```

## Pass standard

The repair passes only when every actual map adapter pin is valid and the count output truthfully documents the state. The aspirational `599/599`, `85/85`, and `61/61` figures may be marked passed only if production data actually proves them. Otherwise, publish the documented exception list and keep those records off the map.

---

# Repair 4 of 5 — Prove, not merely claim, that concurrent member bootstrap reads are fixed

## Verified gap

Single reads now return HTTP 200. That does not prove the previous 30-user P0 is fixed. The required 30-user internal metrics were not provided, and `/api/readyz` does not expose configured pool maximum.

## Permitted files

```text
artifacts/api-server/src/lib/auth.ts
artifacts/api-server/src/middlewares/authMiddleware.ts
artifacts/api-server/src/routes/kinfolk.ts
artifacts/api-server/src/routes/knowledge-graph.ts
artifacts/api-server/src/routes/readyz.ts
one focused load/integration test script only
```

No login visual/flow change is permitted.

## Exact repair and proof requirements

### A. Verify the actual cache paths

The repaired live paths must be the paths called during member bootstrap:

| Endpoint | Required behavior |
| --- | --- |
| `GET /api/kinfolk/preferences` | One joined preferences/delivery-profile read on cache miss; 30-second per-user cache plus single-flight; invalidate after preference PUTs. |
| `GET /api/kinfolk/sessions` | 15-second per-user cache plus single-flight; invalidate after every session mutation. |
| `GET /api/knowledge/graph/:topicId?surface=library` | Five-minute public graph/evidence cache keyed by topic and surface; cache errors never; invalidate after evidence/node publication. |
| Session middleware | Five-second per-SID single-flight/cache only; evict on update/logout/delete/expiry. |
| Role refresh | 60-second per-user role/is-load-test cache; immediate targeted invalidation on a role/test-flag change. |

The Library cache must protect the **actual `/knowledge/graph` route**, not only a context helper used by a different Kinfolk chat path.

### B. Instrument safely

For preferences, sessions, and Library graph, log metadata only:

```text
endpoint, requestId, userIdHash, cacheState(hit|miss|coalesced), dbQueryCount,
durationMs, poolTotal, poolIdle, poolWaiting, responseStatus
```

Never log cookie, token, prompt text, sensitive search, email, or preference payload.

### C. Make pool capacity observable

`GET /api/readyz` must return:

```json
{
  "status": "ok",
  "db": "ok",
  "pool": { "total": 0, "idle": 0, "waiting": 0, "max": 50 }
}
```

Use the real configured maximum, not a hard-coded display value.

### D. Replit internal staged proof before Manus test

Use the existing isolated `is_load_test=true` accounts. Execute the exact sequence below against production only after Repairs 1–3 pass:

```text
Stage 1: 1 account
Stage 2: 5 concurrent accounts
Stage 3: 15 concurrent accounts
Stage 4: 30 concurrent accounts
```

Every account must perform the same realistic bootstrap read journey:

```text
login → preferences → sessions → African Diaspora History graph → business search → map-pin adapter
```

Do not call Kinfolk chat in this specific bootstrap proof; its separate token bucket has already been tested and would obscure database-read results.

Abort internally and report immediately if:

```text
any endpoint response is 5xx
OR poolWaiting > 0 on two consecutive 15-second samples
OR poolTotal >= 80% of actual pool.max
```

## Pass evidence

One table with each stage’s account count, requests, 2xx/4xx/5xx counts, p50/p95 endpoint latency, cache hit/miss/coalesced totals, pool samples including `max`, and an explicit `0` for all 5xx. Without this table, this repair remains **not proven**.

---

# Repair 5 of 5 — Submit one deploy-complete proof package with regression results; do not request another partial audit

## Why this is a repair gate

The last package reported a geocoder “running” rather than providing completed production counts, said the map was wired while the live browser never fetched the endpoint, and said caches were deployed without the required ramp metrics. The missing step is release verification discipline.

## Permitted files

```text
No product-code change for this item.
Only focused test files, compiled artifact, BUILD_IDENTITY, and deployment metadata if required by the normal pipeline.
```

## Required one-response proof package

After a single narrowly scoped deployment containing Repairs 1–4, Replit must provide **all** of the following together:

| # | Required evidence |
| ---:| --- |
| 1 | Exact commit SHA and complete changed-file list, proving no out-of-scope file changed. |
| 2 | `/api/version` with SHA, matching hashes, and `stale_bundle: false`. |
| 3 | `/api/readyz` with real pool `total`, `idle`, `waiting`, and `max`. |
| 4 | Production coordinate-count SQL output from Repair 3 and migration identifier/rollback artifact location. |
| 5 | Authenticated raw API samples for tour sites, recurring events, organizations, cultural sites, and map pin adapter. |
| 6 | City-filter API samples: Philadelphia/Houston/Phuket events and Phuket hair. |
| 7 | Authenticated browser recording for directory → Search on Map → Phuket; it must show search text, Phuket viewport, and matching pins. |
| 8 | Browser network list proving exactly one handoff search and one discoverability-pin endpoint fetch. |
| 9 | Replit’s complete staged 1 → 5 → 15 → 30 bootstrap table from Repair 4. |
| 10 | Regression results: login, Kinfolk basic reply, Taste Profile hard refresh, Library evidence deep link, Hakim’s Bookstore exact search, Phuket directory discovery, Community Vibes persistence, and base map render. |
| 11 | Explicit statement that no fake data, Nominatim policy violation, broad refactor, mobile change, or auth-flow change was used. |

## Final audit entry condition

Manus begins the independent staged 30-user audit **only** after all five items show completed production evidence. The next audit then validates the actual member journey, beginning at one user and stopping immediately if any stage produces a 5xx or pool-waiting breach.

---

## One-line instruction Replit must follow

> **Do not send another partial “ready” message. Complete Repairs 1–4 in the strictly allowed files, deploy one narrow website release, submit the entire Repair 5 proof package, and then Manus will run the final staged 30-user audit.**

## References

[1]: https://operations.osmfoundation.org/policies/nominatim/ "Official OpenStreetMap Foundation Nominatim usage policy"
[2]: https://www.mappingwithmelanin.com/api/version "Live production deployment identity"
[3]: https://www.mappingwithmelanin.com/api/readyz "Live production readiness probe"
[4]: https://www.mappingwithmelanin.com/map?q=restaurant%20in%20Phuket "Required authenticated Phuket map-handoff route"
