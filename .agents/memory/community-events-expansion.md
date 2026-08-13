---
name: Community events expansion — #100 (509 events on map)
description: How the 126-event multi-city expansion seed works and where coordinates come from
---

# Community Events Expansion

## Files
- `artifacts/api-server/src/data/community-events-expansion-seed.ts` — 126 events across 20+ cities
- Wired into `startup-migrations.ts` in the `ensureRecurringEvents()` function immediately after `RECURRING_EVENTS_SEED` guard
- City-centroid coordinate fallback: `ensureRecurringEventsCityCoords()` — runs after expansion guard

## Coverage
Events cover: DC, Atlanta, Houston, Chicago, LA (Leimert Park, Watts, Compton, Inglewood), NYC (Harlem, Brooklyn, Bronx), Miami, Detroit, Charlotte, New Orleans, Baltimore, Richmond, Nashville, Memphis, Dallas/Fort Worth, Columbia SC, Raleigh/Durham, Jacksonville, Las Vegas, Birmingham, Jackson MS, Tallahassee.

20+ HBCU homecomings: Howard, Spelman/Morehouse/Clark AUC, Hampton, Tuskegee, Prairie View, Grambling, Bethune-Cookman, Xavier, Fisk, NC A&T, Morgan State, FAMU, TSU, JCSU, Benedict/Allen.

National Juneteenth events for 6+ cities.

## Coordinate Fallback
`CITY_CENTROIDS` map in `startup-migrations.ts` — 40+ city centers with slight jitter per event so events in same city don't stack on one pixel.

## Current State (as of Aug 13, 2026)
- Total recurring_events in DB: 210 (85 original + 125 from expansion; 1 had wrong state "GA" for Houston)
- Coordinates: 209/210 valid (1 remaining has Washington DC state/GA mismatch — typo now fixed in seed)
- Original national festivals (in `cultural_sites` with pin_type=heritage_festival): 63

## Task Status
Task #100 asks for 509 festivals/markets/gatherings. Current map has:
- 209 recurring events with coordinates
- 63 national heritage festivals in cultural_sites
Total: ~272 event-type pins. Still below 509 — future seed expansions needed for more cities.
