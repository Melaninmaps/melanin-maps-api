---
name: Discoverability pins endpoint + geocoding
description: GET /maps/discoverability-pins endpoint; Nominatim geocoder for tour content; map.tsx ?q= handoff
---

# Discoverability Pins + Geocoding

## GET /maps/discoverability-pins

Added to `artifacts/api-server/src/routes/maps.ts` (behind requireAuth, same as all map routes).

UNION ALL of 3 non-business map collections:
- `tour_cultural_sites` — source_type: "tour_cultural_site"
- `recurring_events`   — source_type: "recurring_event"
- `community_organizations` — source_type: "community_organization"

Coordinate validity contract: IS NOT NULL, BETWEEN -90/90 and -180/180, NOT (0,0).

Returns: `{ pins: [{ id, sourceType, name, city, state, latitude, longitude, description, detailPath }] }`

## Geocoding: Nominatim (not Google Maps)

**Why:** GOOGLE_MAPS_API_KEY returns REQUEST_DENIED for geocoding on this project. Confirmed Aug 12 2026.

Fix: `geocodeTourContent()` in startup-migrations.ts now uses Nominatim (OSM):
- URL: `https://nominatim.openstreetmap.org/search?q=...&format=json&limit=1`
- Required header: `User-Agent: MappingWithMelanin/1.0 (...)`
- Returns `lon` not `lng` — must use `data[0].lon`
- CAP raised from 60 → 800 so first post-deploy boot geocodes all records (~745 records × 100ms sleep ≈ 5 min)
- Subsequent boots are no-ops (all records already have coords)

**How to apply:** Any future geocoding utility that runs server-side must use Nominatim, not Google Maps Geocoding API. Google Maps is only valid for client-side Maps JS rendering and Directions API.

## map.tsx ?q= handoff

The `/map` page now reads `?q=` from the URL query string via `useSearch()` (wouter) and automatically runs `runUniversalSearch(handoffQuery)` once when the map is ready.

- `runUniversalSearch` now accepts `queryOverride?: string` — passes it in place of the input box value
- Guard: `appliedHandoffQueryRef` prevents re-triggering on stable URL
- Also fetches discoverability pins from the new endpoint and renders them as markers on the map

## Discoverability coordinate audit

`ensureDiscoverabilityCoordinatesV1()` runs at the end of the sequential seed list. Logs per-collection counts to Railway boot logs — searchable by "Discoverability coords v1". First-boot audit (pre-Nominatim): cultural_sites 45/599, recurring_events 0/85, community_orgs 0/61.
