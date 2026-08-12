# P0 Surgical Repair Ticket — Production Coordinates, City-Scoped Search, and Directory-to-Map Handoff

**Priority:** P0 before the 30-member production canary  
**Production target:** `https://www.mappingwithmelanin.com`  
**Audited deployment:** `8623e5f10628c72d8e35347e30fcb3074d1cbf63`  
**Owner:** Replit engineering  
**Independent verifier:** Manus

> **Change only the data-coordinate path, the city-scoped fallback logic, the events city filter, and the directory-to-map query handoff. Do not touch login/authentication, session middleware, Kinfolk prompts or routing, Library UI, Safety Hub, business-feedback flows, Google Maps initialization, or any unrelated files.**

## 1. Production defects reproduced

The failures below were reproduced against the live authenticated website and APIs. They are not inferred from source code alone.

| Area | Verified production behavior | Required result |
| --- | --- | --- |
| Tour cultural sites | `GET /api/tour-cultural-sites?limit=1000` returns 599 rows, but only 45 have usable coordinates. Twenty domestic city queries returned either no sites or `0` coordinate-valid sites. | Every active, map-eligible tour site has valid coordinates and can render on the map. |
| Recurring events | `GET /api/recurring-events?limit=1000` returns 85 rows without coordinate fields in its response; the prior audit therefore observed 0/85 map-usable rows. | The route must return persisted `latitude` and `longitude`; every active map-eligible recurring event must be coordinate-valid. |
| Community organizations | `GET /api/community-orgs?limit=1000` returns 61 rows without coordinate fields in its response; the prior audit therefore observed 0/61 map-usable rows. | The route must return persisted `latitude` and `longitude`; every active map-eligible organization must be coordinate-valid. |
| Cultural sites | All 21 audited city/region queries had at least one returned site with a missing coordinate. | No map-eligible returned cultural site may have a missing or invalid coordinate. |
| Events city filter | `GET /api/events?city=Philadelphia`, `?city=Atlanta`, and even `?city=Phuket` returned the same Houston event. | A supplied `city` filter must be respected; no other city may leak into the list. |
| Fuzzy city search | `GET /api/businesses?city=Phuket&search=hair` reported `total: 0` while returning `Hair by Kamaria (Washington)`. The same leak occurred for Memphis, Dallas, Miami, Charlotte, Oakland, Richmond, and Nashville. | A city-filtered request must never return a nonlocal fallback. Returned count and `total` must use the same result set semantics. |
| Directory-to-map | The directory correctly returned four Phuket restaurants. Its **Search on Map** link opened `/map?q=restaurant%20in%20Phuket`, but the map stayed centered on Philadelphia and did not show the Phuket result set. | The `q` query must automatically run the map search, pan to the resolved location, and show only matching on-map business pins. |

The prior authenticated audit report contains the full 21-city evidence matrix. [1]

## 2. Strict file scope

Replit may change **only** the following files, plus one narrowly named migration/test file if required. Any additional file requires written owner approval before editing.

| File | Allowed change |
| --- | --- |
| `artifacts/api-server/src/lib/startup-migrations.ts` | Register one idempotent, production-safe coordinate verification/backfill migration. |
| `artifacts/api-server/src/data/tour-cultural-sites-seed.ts` | Add or correct verified source coordinates only if an authoritative source is available for the existing stable record ID. No synthetic coordinates. |
| `artifacts/api-server/src/data/recurring-events-seed.ts` | Add or correct verified source coordinates only if authoritative source data exists. |
| `artifacts/api-server/src/data/community-organizations-seed.ts` | Add or correct verified source coordinates only if authoritative source data exists. |
| `artifacts/api-server/src/routes/tour-cultural-sites.ts` | Preserve and validate coordinate output; do not change unrelated filters. |
| `artifacts/api-server/src/routes/recurring-events-route.ts` | Include coordinates in the selected response columns. |
| `artifacts/api-server/src/routes/community-orgs.ts` | Include coordinates in the selected response columns. |
| `artifacts/api-server/src/routes/cultural-sites.ts` | Correct only the select/filter contract necessary to exclude invalid map records or return repaired coordinates. |
| `artifacts/api-server/src/routes/events.ts` | Add city/state filtering, truthful totals, and no cross-city fallback. |
| `artifacts/api-server/src/routes/businesses.ts` | Keep fuzzy fallback inside all supplied filters and return a truthful `total`. |
| `artifacts/api-server/src/routes/maps.ts` **or one new route file mounted by it** | Add one read-only map-discoverability pin adapter for the three non-business map collections. |
| `artifacts/api-server/src/routes/index.ts` | Register the one new read-only map pin route only if a new file is used. |
| `artifacts/web/src/pages/map.tsx` | Consume `?q=`, run the existing universal search once, pan to the result geography, and render data-adapter pins. |
| One focused server test and one focused web/component test | Cover the acceptance tests in §8. |

### Explicitly prohibited

Do **not** modify any auth/login/session code, `requireAuth`, browser storage behavior, membership code, Kinfolk, Library, Safety, community feedback, prompts, mobile code, base Google Maps key/loading code, or global visual styles. Do not reseed fake businesses, events, ratings, feedback, quotes, or coordinates. Do not perform broad refactors, package updates, or formatting-only rewrites.

## 3. Coordinate data rules

Coordinates are product data, not placeholders. The only allowed values are coordinates supported by an existing authoritative address/source record or a verified geocoding result retained with provenance. Use the existing stable IDs; never delete and recreate rows simply to attach coordinates.

A coordinate is valid only when both fields are present, numeric, nonzero, and within geographic ranges.

```sql
latitude  BETWEEN -90  AND 90
longitude BETWEEN -180 AND 180
NOT (latitude = 0 AND longitude = 0)
```

Do not silently map city names to a city-centroid coordinate. A city centroid may be used for map centering after a user searches a city, but it is **not** a valid replacement for a venue, organization, or event location.

### 3.1 Mandatory production preflight queries

Run these against the Railway production database before any update. Capture the output in the deployment record.

```sql
-- Confirm the actual columns before changing any route or seed logic.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'tour_cultural_sites',
    'recurring_events',
    'community_organizations',
    'cultural_sites',
    'events'
  )
  AND column_name IN ('id', 'name', 'city', 'state', 'address', 'latitude', 'longitude', 'is_active', 'status')
ORDER BY table_name, ordinal_position;

-- Truthful baseline: total active rows, complete coordinates, missing coordinates, and invalid coordinates.
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
  COUNT(*) AS active_rows,
  COUNT(*) FILTER (
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND latitude::numeric BETWEEN -90 AND 90
      AND longitude::numeric BETWEEN -180 AND 180
      AND NOT (latitude::numeric = 0 AND longitude::numeric = 0)
  ) AS coordinate_valid,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS coordinate_missing,
  COUNT(*) FILTER (
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND (
        latitude::numeric NOT BETWEEN -90 AND 90
        OR longitude::numeric NOT BETWEEN -180 AND 180
        OR (latitude::numeric = 0 AND longitude::numeric = 0)
      )
  ) AS coordinate_invalid
FROM inventory
GROUP BY entity
ORDER BY entity;
```

If the preflight shows that `recurring_events` or `community_organizations` does not have `latitude` and `longitude` columns, add only those nullable numeric/text columns through the existing migration pattern before proceeding. Do not introduce unrelated schema changes.

### 3.2 Idempotent coordinate backfill

Implement a single migration named similarly to `ensureDiscoverabilityCoordinatesV1()` in `startup-migrations.ts`. It must run once per production database, not on every request.

The migration must follow this contract:

1. Create a temporary in-memory list from the existing approved seed data, keyed by the record's stable `id`.
2. Validate every seed coordinate before any update.
3. Update an existing row only when its stored coordinate pair is missing or invalid **and** the seed pair is valid.
4. Never overwrite a valid existing coordinate with a different value without an explicit reviewed correction list and a log entry.
5. Log row counts separately for `tour_cultural_sites`, `recurring_events`, `community_organizations`, and `cultural_sites`: examined, repaired, already-valid, skipped-no-source-coordinate, and rejected-invalid-coordinate.
6. The migration must throw and stop before partial writes if the supplied source list contains duplicate IDs or invalid coordinate values.
7. All database updates must use parameterized SQL or the existing query builder and run in a transaction.

Use this validation helper or an equivalent tested helper.

```ts
function isValidCoordinatePair(latitude: unknown, longitude: unknown): boolean {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat)
    && Number.isFinite(lng)
    && lat >= -90 && lat <= 90
    && lng >= -180 && lng <= 180
    && !(lat === 0 && lng === 0);
}
```

> If source data does not provide a verified address/coordinate for a record, leave the pair null, exclude it from map pins, and include it in the `skipped-no-source-coordinate` proof count. Never invent a pin.

## 4. Endpoint repair requirements

### 4.1 Preserve coordinates in recurring-event and organization responses

`recurring-events-route.ts` currently selects no coordinate columns. `community-orgs.ts` currently selects no coordinate columns. Both routes must include the persisted fields in list responses.

Make the list selects include the coordinate pair:

```sql
-- recurring-events-route.ts list selection must include
latitude, longitude

-- community-orgs.ts list selection must include
latitude, longitude
```

The JSON response shape remains backward compatible:

```json
{
  "events": [{ "id": "...", "latitude": 39.9526, "longitude": -75.1652 }],
  "total": 85
}
```

```json
{
  "organizations": [{ "id": "...", "latitude": 39.9526, "longitude": -75.1652 }],
  "total": 61
}
```

Do not convert a null coordinate to `0`, an empty string, or a city centroid.

### 4.2 Tour and cultural site API contract

`tour-cultural-sites.ts` already selects `latitude` and `longitude`; retain those fields and add no fallback coordinates in the route. After the migration, map-eligible active rows must return valid pairs.

For `cultural-sites.ts`, preserve existing public fields while ensuring map-eligible results either have a valid pair or are excluded by an explicit `mapReady=true` filter. The default directory/list experience may retain coordinate-less editorial entries only if they are clearly **not** advertised as map pins. The map client itself must consume only validated coordinate pairs.

### 4.3 Fix `GET /api/events?city=X`

In `artifacts/api-server/src/routes/events.ts`, line 12 currently destructures `category`, `search`, and `featured`, but it does not read or apply `city` or `state`. Add those two optional query parameters and apply them to the same `conditions` array before the database query.

```ts
const { category, search, featured, city, state } = req.query;

if (city && typeof city === "string" && city.trim()) {
  conditions.push(ilike(eventsTable.city, `%${city.trim()}%`));
}
if (state && typeof state === "string" && state.trim()) {
  conditions.push(ilike(eventsTable.state, `%${state.trim()}%`));
}
```

The response must expose a truthful count after the existing upcoming-date filter:

```ts
res.json({ events: upcoming, total: upcoming.length });
```

Do not add an implicit global fallback when a city result set is empty. The user may choose an explicit wider search in a future user-interface change; this P0 repair must preserve the city constraint.

### 4.4 Fix `GET /api/businesses?city=X&search=Y` fuzzy fallback

The primary query correctly adds `city` to the Drizzle `conditions` array. The fuzzy fallback at `businesses.ts` lines 303–360 then runs raw SQL with only `b.status = 'active'`, discarding city/state/country/listing filters. That is the direct cause of a city-filtered query reporting `total: 0` while returning `Hair by Kamaria (Washington)` for Phuket and other cities.

Implement this non-negotiable contract:

1. Exact query and fuzzy query must share all caller-supplied restrictive filters: `city`, `state`, `country`, `category`, `subcategory`, ownership/listing eligibility, and any geographic bounds.
2. A fuzzy fallback must never broaden from a supplied city/state/country/geo filter to another geography.
3. If the constrained fuzzy query returns zero rows, return `businesses: []`, `total: 0`, and an optional machine-readable `searchScope: "local"`. Do not inject a global result.
4. The response `total` must represent the exact result list being returned. When fuzzy fallback is used, use its constrained result count; do not retain `totalCount` from the failed exact query.

Use a parameterized scope builder. The following shape is required; adapt the query-builder syntax but preserve the guarantees.

```ts
const fuzzyScope: string[] = ["b.status = 'active'"];
const fuzzyScopeParams: unknown[] = [];

if (!isTester) {
  fuzzyScope.push("b.listing_status IN ('live_unclaimed', 'live_claimed')");
}
if (city && typeof city === 'string' && city.trim()) {
  fuzzyScope.push(`LOWER(b.city) LIKE LOWER($${nextParam()})`);
  fuzzyScopeParams.push(`%${city.trim()}%`);
}
if (state && typeof state === 'string' && state.trim()) {
  fuzzyScope.push(`LOWER(b.state) LIKE LOWER($${nextParam()})`);
  fuzzyScopeParams.push(`%${state.trim()}%`);
}
if (country && typeof country === 'string' && country.trim()) {
  fuzzyScope.push(`LOWER(b.country) LIKE LOWER($${nextParam()})`);
  fuzzyScopeParams.push(`%${country.trim()}%`);
}

// Use `AND ${fuzzyScope.join(' AND ')}` in BOTH fuzzy SQL branches.
// The helper must compute placeholders from the actual existing search params;
// do not interpolate city, state, country, or user input into SQL text.
```

Set an explicit flag only when fallback succeeds:

```ts
let usedFuzzyFallback = false;
// ... set true only if finalResults is replaced by constrained fuzzy rows
const responseTotal = usedFuzzyFallback ? finalResults.length : Number(totalCount);
res.json({ businesses: withDistance, total: responseTotal, page: { offset, limit: pageLimit }, featuredCount, usedFuzzyFallback });
```

The fallback must not bypass the standard non-tester `listing_status` gate.

## 5. Make all map-ready content actually map-renderable

The current web map fetches businesses, cultural sites, events, and sundown towns. It does **not** fetch tour cultural sites, recurring events, or community organizations. A successful data backfill alone therefore does not make those collections map-ready.

Add one read-only map adapter in `routes/maps.ts`, or a single new route registered in `routes/index.ts` if that module has no suitable home.

### 5.1 Required endpoint

```http
GET /api/maps/discoverability-pins
```

Response contract:

```json
{
  "pins": [
    {
      "id": "stable-row-id",
      "sourceType": "tour_cultural_site",
      "name": "Example landmark",
      "city": "Philadelphia",
      "state": "PA",
      "latitude": 39.9526,
      "longitude": -75.1652,
      "description": "Optional truthful source description",
      "detailPath": "/tour-cultural-sites/stable-row-id"
    }
  ]
}
```

The adapter must perform a parameterized `UNION ALL` (or equivalent three small queries) over only valid, active rows:

```sql
-- Required eligibility pattern for every source collection
WHERE is_active = true
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND latitude::numeric BETWEEN -90 AND 90
  AND longitude::numeric BETWEEN -180 AND 180
  AND NOT (latitude::numeric = 0 AND longitude::numeric = 0)
```

Return the three source types exactly as `tour_cultural_site`, `recurring_event`, and `community_organization`. Do not duplicate these entries in the business pins endpoint and do not alter its payload.

### 5.2 Map client changes

In `artifacts/web/src/pages/map.tsx`:

1. Add a `DiscoverabilityPin` type and one `useEffect` to fetch `/api/maps/discoverability-pins` after the Google map is ready.
2. Create markers only from valid adapter pins. Use the existing diamond marker style for tour cultural sites, the existing orange community-event style for recurring events, and a visually distinct but existing brand-consistent marker style for community organizations.
3. Put tour cultural sites under the existing Cultural Sites legend, recurring events under Community Events, and organizations under Cultural Sites or an explicitly named Community Organizations filter only if the filter label is added in the same component. Do not alter other map filters.
4. On marker click, show name, entity label, city/state, optional short truthful description, and its `detailPath`. The marker must not use dummy copy or an invented rating.
5. Do not show map markers for null, `0,0`, or out-of-range coordinates.

## 6. Fix the directory-to-map query handoff

`businesses.tsx` correctly generates `/map?q=restaurant%20in%20Phuket`. `map.tsx` initializes `search` to `""` and never reads `window.location.search` or Wouter's query-string state. The existing `runUniversalSearch` function is otherwise designed to extract geography, pan, and constrain results.

Make only the following focused change in `artifacts/web/src/pages/map.tsx`.

### 6.1 Parse `q` reactively

```ts
import { Link, useSearch } from "wouter";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const locationSearch = useSearch();
const handoffQuery = useMemo(
  () => new URLSearchParams(locationSearch).get("q")?.trim() ?? "",
  [locationSearch],
);
const appliedHandoffQueryRef = useRef<string | null>(null);
```

### 6.2 Permit a query override in the existing search function

```ts
const runUniversalSearch = useCallback(async (queryOverride?: string) => {
  const q = (queryOverride ?? search).trim();
  if (!q || q.length < 2) return;
  // Keep the existing geographic extraction and universal-search logic unchanged.
}, [search, userCoords]);
```

### 6.3 Apply the query exactly once after the map is ready

Place this effect **after** `runUniversalSearch` is declared. It must run only once for a given query string, then allow a changed `q` query to run once again.

```ts
useEffect(() => {
  if (!handoffQuery || !ready || isLoading || !mapRef.current) return;
  if (appliedHandoffQueryRef.current === handoffQuery) return;

  appliedHandoffQueryRef.current = handoffQuery;
  setSidebarOpen(true);
  setLegendFilter("business");
  setSearch(handoffQuery);
  void runUniversalSearch(handoffQuery);
}, [handoffQuery, ready, isLoading, runUniversalSearch]);
```

The existing universal-search behavior must then do all of the following for `/map?q=restaurant%20in%20Phuket`:

- show `restaurant in Phuket` in the map search input;
- geocode the geography only and pan/zoom to Phuket;
- request the existing universal search with the resolved Phuket coordinates;
- show only the resulting MWM business pins, including Suay Restaurant when it remains in the result set;
- keep the browser back button functional; and
- not create a loop, duplicate markers, or fall back to Philadelphia.

## 7. Required tests

Add focused tests only for the changed behaviors.

| Test ID | Layer | Required assertion |
| --- | --- | --- |
| `DISC-COORD-01` | migration/unit | Invalid/missing source coordinates are skipped; valid source pairs update only rows with missing/invalid stored pairs. |
| `DISC-COORD-02` | API | Tour, recurring-event, and organization list responses contain `latitude` and `longitude` for valid rows. |
| `DISC-COORD-03` | API | No map adapter pin has null, `0,0`, or out-of-range coordinates. |
| `DISC-CITY-01` | API | `GET /api/events?city=Philadelphia` never contains a non-Philadelphia city. |
| `DISC-CITY-02` | API | `GET /api/events?city=Phuket` never returns the Houston event. |
| `DISC-CITY-03` | API | `GET /api/businesses?city=Phuket&search=hair` returns zero local rows and `total: 0`; it never returns Hair by Kamaria/Washington. |
| `DISC-CITY-04` | API | `GET /api/businesses?city=Philadelphia&search=restaurant&limit=20` has an internally consistent total/pagination contract. A `total` over 20 is valid only when the response documents standard pagination; a fuzzy fallback must not return a different count than `total`. |
| `DISC-MAP-01` | web component/E2E | Loading `/map?q=restaurant%20in%20Phuket` initializes the search input, calls universal search once, and pans the map to Phuket instead of Philadelphia. |
| `DISC-MAP-02` | web component/E2E | The resulting map marker set includes matching Phuket business IDs and excludes unrelated Philadelphia business pins while the handoff search is active. |
| `DISC-MAP-03` | web component/E2E | A valid tour-site, organization, and recurring-event adapter pin can open its own truthful popup/detail path. |

## 8. Mandatory Railway production proof

Do not mark this task complete from source review, local development, or a Replit preview. Post all of the following from **Railway production** after one narrow deployment.

```sql
-- Required post-deploy coordinate proof. Expected values must reflect real rows,
-- not hard-coded claims.
WITH inventory AS (
  SELECT 'tour_cultural_sites' AS entity, latitude, longitude FROM tour_cultural_sites WHERE is_active = true
  UNION ALL SELECT 'recurring_events', latitude, longitude FROM recurring_events WHERE is_active = true
  UNION ALL SELECT 'community_organizations', latitude, longitude FROM community_organizations WHERE is_active = true
)
SELECT
  entity,
  COUNT(*) AS active_rows,
  COUNT(*) FILTER (
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND latitude::numeric BETWEEN -90 AND 90
      AND longitude::numeric BETWEEN -180 AND 180
      AND NOT (latitude::numeric = 0 AND longitude::numeric = 0)
  ) AS coordinate_valid,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS coordinate_missing
FROM inventory
GROUP BY entity
ORDER BY entity;

-- Prove city filtering.
SELECT city, COUNT(*)
FROM events
WHERE status = 'active'
GROUP BY city
ORDER BY city;
```

Provide these live authenticated API results, preserving IDs/names/cities/coordinates but redacting credentials:

| Endpoint | Required evidence |
| --- | --- |
| `/api/tour-cultural-sites?city=Philadelphia&limit=100` | Total, valid coordinate pairs, and three sample rows. |
| `/api/tour-cultural-sites?city=Phuket&limit=100` | Big Buddha and Wat Chalong still present with valid coordinate pairs. |
| `/api/recurring-events?limit=100` | Coordinate fields visibly present in the response. |
| `/api/community-orgs?limit=100` | Coordinate fields visibly present in the response. |
| `/api/events?city=Philadelphia` and `/api/events?city=Phuket` | No wrong-city event. |
| `/api/businesses?city=Phuket&search=hair&limit=20` | `businesses: []`, `total: 0`; no Washington listing. |
| `/api/maps/discoverability-pins` | Counts by `sourceType`; all returned rows coordinate-valid. |
| Web `/map?q=restaurant%20in%20Phuket` | Screenshot or short screen recording showing map centered in Phuket, matching pins, and a visible Suay Restaurant result/pin. |

Also provide `/api/version` confirming a non-stale production bundle, and the exact commit SHA. [2]

## 9. Rollback and deployment discipline

Use one focused feature commit and one deployment/rebuild commit only. Include all modified server source, compiled production artifact, and build identity together. Do not piggyback any unrelated fixes.

Before deployment, snapshot the affected coordinates to a timestamped audit table or JSON artifact containing `entity`, `id`, prior latitude, prior longitude, new latitude, new longitude, migration identifier, and timestamp. Rollback must restore only rows changed by this migration identifier; it must not delete businesses, sites, events, organizations, or community content.

If coordinate proof does not meet the claimed all-active-row standard, deploy the route-filter and map-handoff fixes if safe, but report the coordinate shortfall honestly as **incomplete**. Do not claim that an unpinned record is map-ready.

## 10. Completion definition

This ticket is complete only when all of the following are independently verified on Railway production:

1. Live coordinate counts show 599/599 active tour sites, 85/85 active recurring events, and 61/61 active community organizations valid **only if those figures are factually true in the production database**. Otherwise report the real count and the authoritative-data exceptions.
2. The listed APIs return coordinate fields for coordinate-backed collections.
3. City filters do not leak nonlocal events or businesses.
4. `total` values are truthful and stable under pagination/fuzzy fallback.
5. The web directory-to-map journey for Phuket visibly pans and filters to Phuket results.
6. The live map renders the repaired, valid coordinate collections without fake pins.
7. No auth, Library, Kinfolk, Safety, feedback, or unrelated map behavior regresses.

Only after Manus independently verifies these points should the capacity team proceed to the separate 1 → 5 → 15 → 30 concurrent user canary.

## References

[1]: https://www.mappingwithmelanin.com "Live website audit target"
[2]: https://www.mappingwithmelanin.com/api/version "Production deployment identity"
[3]: https://www.mappingwithmelanin.com/businesses "Live business directory and Search on Map origin"
[4]: https://www.mappingwithmelanin.com/map?q=restaurant%20in%20Phuket "Required directory-to-map handoff target"
