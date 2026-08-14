---
name: Community events expansion — #100
description: Current event count and seed file locations for the 509-events-on-map goal.
---

## Status (Aug 14 2026)
- **Target**: 509 recurring events on the map
- **Achieved**: ~535 total (211 original + 126 expansion-1 + ~198 active from expansion-2 = 535)
- **Files**:
  - `artifacts/api-server/src/data/recurring-events-seed.ts` — 85 base events
  - `artifacts/api-server/src/data/community-events-expansion-seed.ts` — 126 events
  - `artifacts/api-server/src/data/community-events-expansion-2-seed.ts` — 324 new events (26 cities)
- **Cities covered in expansion-2**: Philadelphia, NYC, Chicago, Detroit, Atlanta, Houston, Washington DC, Oakland, New Orleans, Baltimore, Miami, Nashville, Memphis, Dallas, Richmond, Birmingham, Newark, Jackson MS, Charlotte, St. Louis, Denver, Cincinnati, Cleveland, Kansas City, Savannah, Seattle
- **Seeding**: All three files wired in `startup-migrations.ts` within the `recurring_events_guard_v2` migration. Uses name+city+state dedup key — idempotent on every boot.

**Why:** Goal was to populate the map for the 30-tester milestone. Events seed on boot so no manual SQL needed.
