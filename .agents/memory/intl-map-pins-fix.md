---
name: International map pins — root cause and fix
description: Why Bangkok/Phuket/Jamaica businesses were invisible on the web map, and what fixed it.
---

# International map pins — root cause and fix

## The root cause
`useListBusinesses` called `GET /api/businesses` which has a hard cap of `Math.min(200, limit)`. With 1,260+ businesses ordered by `confidence_score DESC`, international businesses (seeded later, lower confidence) were always beyond position 200 and never returned. The map loaded once on mount with no viewport-based re-fetch.

**Why:** `map.tsx` line 237 used `useListBusinesses({})` — a paginated endpoint never designed for "load everything".

## The fix
- New `GET /api/businesses/map-pins` endpoint in `businesses.ts` — returns ALL active geolocated businesses with minimal fields (id/name/lat/lng/category/city/country/listing_status). No row cap.
- `map.tsx` now uses a direct `fetch` to this endpoint (with `credentials: "include"`) instead of `useListBusinesses`.
- Endpoint is behind `requireAuth` (member wall policy: business locations must not be readable by unauthenticated callers).

**How to apply:** Any future map data source that needs to show global coverage must NOT use the paginated `/api/businesses` endpoint. Use `/api/businesses/map-pins` or a bounds-based variant.

## Next architectural step
Viewport-based loading: add `?swLat=&swLng=&neLat=&neLng=` to map-pins and re-fetch on map idle event. Current all-at-once approach works at 1,260 but will degrade at scale.
