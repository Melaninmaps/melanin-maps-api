# Mapping with Melanin — Location-First Discovery and Kinfolk Flywheel Patch

This package corrects the core discovery problem shown in the Map, Businesses, Explore, and Events screens: **the platform is showing a global inventory when the member is viewing Charlotte, and the page surfaces are not sharing one location-aware result contract.**

The implementation changes the governing rule from “show everything in a category” to:

> **Show what Mapping with Melanin has in the member’s selected location. If there is no exact local match, acknowledge the gap and let the member choose to expand, view the nearest city, or help add the missing record.**

## What the screenshots reveal

| Observed screen behavior | Root condition to correct | Fix in this package |
|---|---|---|
| Charlotte map viewport with a Markets side list containing Philadelphia, Mobile, Birmingham, Baton Rouge, and New Orleans. | The map/list query is category-global while the visual viewport is local. | `LocationFirstMap.tsx` queries the selected layer and left list together through `/api/discovery/query` using one explicit location context. |
| Businesses map layer appears empty when selected. | Selected map layer, entity type, API query, and map/list render state are not one typed flow. | A `business` layer sends `recordTypes: ["business"]`; the map pins and sidebar use the same returned `records` array. |
| Business Directory reports a global “200 businesses in directory.” | Directory inventory count is presented before local availability is determined. | `LocationFirstBusinessDirectory.tsx` shows **“X verified businesses in [location]”** and asks for an area rather than silently returning national inventory. |
| Barbers are not clearly selectable. | Barber is hidden under broad beauty categorization. | `business_specialties` and first-class **Barbers** filter chips are included. |
| Explore repeats business categories and ownership filtering. | Explore and Businesses share the same job. | `LocationFirstExplore.tsx` focuses on heritage, culture, neighborhoods, HBCUs, living culture, family, nightlife, and faith/community. |
| Events defaults to Philadelphia and ends with a blank no-events state. | Events lacks shared location context and a useful coverage fallback. | `LocationFirstEvents.tsx` uses the same location state and offers nearest city, all cities, and add-event paths. |

## Required product behavior

| Surface | Its one job | Local-first fallback |
|---|---|---|
| **Map** | Show where things are. | No local map pins means an explicit gap state; never global category pins. |
| **Businesses** | Find a business, provider, professional, or organization. | Offer nearest/expanded search or adding a listing. |
| **Explore** | Discover cultural places, heritage, neighborhoods, and experiences. | Offer nearby cultural exploration or a Guide. |
| **Events** | Discover time-specific happenings. | Offer nearby events, another date window, or adding an event. |
| **Kinfolk** | Help decide what fits across the entire ecosystem. | Reads the same approved location result and gap state; it does not operate a duplicate inventory. |

## Data rule: canonical record, many views

A business, cultural site, event, community place, resource, or community tag must be stored once. `canonical_record_locations` is a **location index**, not a duplicate profile. It allows each canonical record to appear correctly in Map, Businesses, Explore, Events, Guides, and Kinfolk based on context.

| Data object | Purpose |
|---|---|
| `canonical_record_locations` | Associates one canonical record with a real city/neighborhood and coordinates where available. |
| `business_specialties` | Adds searchable provider facets such as `barber`, `natural-hair-specialist`, `dermatologist`, and `attorney` without duplicating a business. |
| `discovery_coverage_gaps` | Aggregates unmet local demand by city/category/specialty. It does not store private prompts, precise device movement, or member identity. |
| `discovery_flywheel_daily_signals` | Privacy-bounded daily counts of search, layer selection, empty result, expansion, save, and directions activity. |

## Replit installation sequence

### 1. Apply the dependency migration first

Before this package, apply the schema compatibility repair from the earlier production package. The API must no longer fail on `reviews.author_id` or `business_identity.age_restriction_reasons`. A broken schema will make location-first data look empty even if the front-end logic is correct.

### 2. Apply this migration

Copy `db/migrations/20260818_02_location_first_discovery.sql` into the API project migration directory and run it through the existing locked migration process:

```bash
pnpm db:migrate
pnpm db:verify
```

The migration creates the location index, business specialties, coverage-gap table, and aggregate flywheel table. It seeds `barber` for businesses already categorized as Barber/Barbershop/Barbers.

### 3. Backfill canonical record locations

The migration cannot safely guess every legacy source-table location column. Replit must backfill `canonical_record_locations` from the production canonical records using the project’s existing location data. The expected end state is:

```sql
-- Example shape; map legacy columns to this schema rather than duplicating rows.
INSERT INTO canonical_record_locations (
  record_type, record_id, city_name, state_code, neighborhood_name,
  latitude, longitude, is_primary, verified_at
)
SELECT
  'business', b.id, c.name, c.state_code, b.neighborhood,
  b.latitude, b.longitude, TRUE, b.verified_at
FROM businesses b
JOIN cities c ON c.id = b.city_id
WHERE b.is_active = TRUE
ON CONFLICT DO NOTHING;
```

Create equivalent backfills for canonical cultural sites, events, and community places. Do not insert a Philadelphia or national fallback row for a Charlotte record. If the source record has no reliable location, leave it out of the local Map until it is verified.

### 4. Register the shared location provider

Wrap all discoverability routes in `LocationContextProvider` from `client/src/features/discovery/LocationContext.tsx`.

```tsx
<LocationContextProvider initialLocation={memberSavedLocation}>
  <AppRoutes />
</LocationContextProvider>
```

An explicit city/neighborhood wins over a saved location. Device coordinates are used only after the member chooses **Use my location**. The backend should reverse-geocode device coordinates into a city/state before local inventory lookup.

### 5. Register one discovery endpoint

Register `registerLocationFirstDiscoveryRoutes(app, repository)` in the API bootstrap. Replace independent category-global calls from Map, Businesses, Explore, and Events with `POST /api/discovery/query`.

The repository behind the route must enforce these conditions:

```sql
-- The essential business branch of findExact(query):
SELECT b.id, b.name, b.category, l.city_name, l.state_code, l.neighborhood_name
FROM businesses b
JOIN canonical_record_locations l
  ON l.record_type = 'business' AND l.record_id = b.id
LEFT JOIN business_specialties bs ON bs.business_id = b.id
WHERE b.is_active = TRUE
  AND b.is_verified = TRUE
  AND LOWER(l.city_name) = LOWER($city)
  AND ($state IS NULL OR UPPER(l.state_code) = UPPER($state))
  AND ($specialty IS NULL OR bs.specialty_slug = $specialty);
```

The endpoint must never fall back from an empty exact-city result to all records. It returns a `coverageGap` and optional actions instead.

### 6. Replace the page implementations

| Existing route | Replace/mount component | Required result |
|---|---|---|
| `/map` | `LocationFirstMap` | Pins and side-panel rows come from the same location-scoped query. Selecting Businesses or Barbers populates both together. |
| `/businesses` | `LocationFirstBusinessDirectory` | Local count, search, category, ownership, specialty, and Barbers filtering. |
| `/explore` | `LocationFirstExplore` | Cultural/experience discovery; no global ownership-filtered business grid. |
| `/events` | `LocationFirstEvents` | Shared location and time filters, plus nearby/add-event fallback. |

### 7. Stop stale dynamic cache results

The production logs showed `304` responses for dynamic map/listing endpoints. Use `sendDynamicJson` from the schema-repair package, or apply equivalent headers to every location-sensitive response:

```ts
response.setHeader("Cache-Control", "private, no-store, max-age=0");
response.setHeader("Vary", "Authorization, Cookie, X-Community-Location");
```

Use this during repair. Do not reintroduce caching until the cache key contains both the location context and a data revision.

## Kinfolk flywheel rules

Kinfolk should read the same `LocationFirstResponse` returned to the page. This lets it understand whether a category is available locally or is an honest community gap. It does not require Kinfolk to silently harvest private behavior.

| Page event | Aggregate signal | Allowed Kinfolk behavior |
|---|---|---|
| Member searches Charlotte barbers | `search` + city + specialty=barber | “I found local barbers. Would you like to narrow by neighborhood or community context?” |
| No Charlotte barber result | `zero_result` + coverage gap | “We do not have a listed local barber yet. Would you like the nearest verified options or to help add one?” |
| Member chooses nearest city | `nearest_city_selected` | Retrieve that city only after the member’s choice. |
| Member saves a business | `record_saved` | Improve future local ranking in the same requested category; do not infer a sensitive identity. |
| No local event | `event_empty_state` + city/time window | Offer nearby or add-event options and help operations recognize a genuine event gap. |

## Acceptance tests

| Test | Pass condition |
|---|---|
| Charlotte Map → Markets | The side panel and pins contain only Charlotte-area markets. No Philadelphia, Mobile, Birmingham, Baton Rouge, or New Orleans item appears. |
| Charlotte Map → Businesses | A local business result set appears. Switching to **Barbers** fetches only Charlotte barber records. |
| Charlotte with no local specialty | Shows “not listed nearby yet” with nearest/expand/add choices. It does not silently display a global dump. |
| Businesses page | Heading is location-specific, not “200 businesses in directory.” |
| Explore page | Main filters are cultural/experience lenses. Businesses only appear as contextual parts of an experience. |
| Events page with no local events | Shows nearby/time-window/add-event choices, not an empty dead end. |
| Flywheel tables | A search or zero result increments only aggregate daily/location/category signals. No raw member prompt or exact travel history appears. |
| API request headers | Dynamic map/directory responses are `200` with `Cache-Control: no-store` during the repair period, not stale `304` responses. |
