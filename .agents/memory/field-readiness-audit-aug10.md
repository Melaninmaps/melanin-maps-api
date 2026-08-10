---
name: Field Readiness Audit — Aug 10, 2026
description: Comprehensive 42-phase real-user audit findings and fixes before 4-day founder tour
---

## Audit Findings (Aug 10, 2026)

### Fixes Applied This Session
1. **Search subcategory gap** — `GET /api/businesses` now includes `subcategory` in single-token AND multi-token search paths
2. **suggest-place listing_status** — new member-submitted places now set `listing_status = 'live_unclaimed'`; without this, submitted places were invisible to regular members
3. **15 Bangkok businesses seeded** — Issaya Siamese Club, Paste (Michelin), Bo.lan, Blue Elephant, Vertigo & Moon Bar, Sirocco Sky Bar, Saxophone Pub, Chatuchak Market, Asiatique Riverfront, Jim Thompson House, MOCA, Lhong 1919, Mandarin Oriental Spa, Roots Coffee, Soul Food Mahanakorn; via `ensureBangkokBusinesses()` in startup-migrations.ts
4. **discover.tsx category mismatch** — VIBES/categories were using "Restaurants & Nightlife", "Cultural Landmarks" etc. which return 0 results; fixed to "Food", "Arts & Culture", "Travel & Hospitality", "Beauty", "Education", "Entertainment & Recreation", "Faith & Spirituality"

### Platform State (confirmed in dev DB)
- 709 businesses visible to approved members (all `live_unclaimed`)
- 493 Food businesses (strongest category)
- 26 Thailand businesses (all Phuket, all `live_unclaimed`)
- 0 Bangkok businesses (15 seeding on next Railway restart)
- 44 international businesses total
- 254 active Library topics
- 711 cultural sites
- 514 active events (503 upcoming)
- 29 safety reports
- 5 businesses with community vibes
- 0 reviews, 0 THE REAL taps, 0 endorsement taps (pre-launch expected)

### Architecture Decisions (BY DESIGN, not bugs)
- ALL API routes require auth — member wall established 2026-08-10 per routes/index.ts comment
- Business detail `/api/businesses/:id` requires auth — intentional
- Map/Library/Safety redirect anon users to waitlist — intentional
- `useListBusinesses({})` on map page loads ALL 709 businesses — then category filter is client-side

### Map Page Category Behavior (confirmed)
- Map page: `useListBusinesses({})` — no category param — loads ALL businesses client-side
- "International" filter: checks `country !== "USA"` client-side — works correctly
- "Beauty" filter: `category.includes("beauty")` — finds both "Beauty" and "Beauty & Personal Care"
- Phuket businesses: all `live_unclaimed`, all have lat/lng coordinates, show on map when "International" selected

### Data Gaps (not code bugs)
- Faith/church: only 2 businesses (both Philadelphia)
- Braiding: 0 businesses with "braid" in name/subcategory/description
- Jamaica businesses: 0 (Add a Place flow allows member submission)
- Cancun businesses: 0 (Add a Place flow allows member submission)

**Why:** These are data collection gaps, not implementation failures.

### Report
Full report: `docs/audits/FIELD_READINESS_REPORT_2026-08-10.md`
