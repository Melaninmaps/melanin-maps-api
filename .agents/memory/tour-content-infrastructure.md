---
name: Tour Content Infrastructure
description: All data tables, seed files, API routes, and boot guards added for the MWM East Coast Tour PDFs (Parts 1–2). Covers businesses, orgs, events, cultural sites, edit suggestions.
---

# Tour Content Infrastructure

## What was built (August 8, 2026)

### Data seeded from tour PDFs

| Entity | Count | Table | Seed file |
|---|---|---|---|
| Tour businesses | 556 | businesses (live_unclaimed) | tour-businesses-seed.ts |
| Community organizations | 60 | community_organizations | community-organizations-seed.ts |
| Recurring events | 31 | recurring_events | recurring-events-seed.ts |
| Tour cultural heritage sites | 177 | tour_cultural_sites | tour-cultural-sites-seed.ts |
| City welcome contexts | 30+ cities | city_profiles | migration: city_profiles_tour_brief_context_v1 |

### New tables created

- `community_organizations` — name/city/state/category/mission/website/instagram/facebook/phone/address/is_active/has_pending_edit/tour_source
- `recurring_events` — name/city/state/venue/address/description/frequency/day_of_week/start_time/end_time/category/is_active/has_pending_edit/tour_source
- `tour_cultural_sites` — name/city/state/address/description/latitude/longitude/is_active/has_pending_edit/tour_source
- `edit_suggestions` — entity_type/entity_id/entity_name/field_name/current_value/suggested_value/reason/user_id/status/admin_notes/reviewed_by/reviewed_at/created_at

### New columns added

- `city_profiles.neighborhood_timing JSONB` — column added, NOT YET POPULATED (see pending task)
- `city_profiles.has_pending_edit BOOLEAN`
- `cultural_sites.has_pending_edit BOOLEAN`

### API routes

- `GET /community-orgs?city=&state=&category=` — list orgs, filterable
- `GET /community-orgs/:id` — single org
- `GET /recurring-events?city=&state=&category=` — list recurring events
- `GET /recurring-events/:id` — single event
- `GET /tour-cultural-sites?city=&state=` — list heritage landmarks
- `GET /tour-cultural-sites/:id` — single heritage landmark
- `POST /edit-suggestions` — auth required; any user can suggest edits
- `GET /edit-suggestions/my` — user's own submitted suggestions
- `GET /edit-suggestions/admin` — admin review queue (isAdmin gate)
- `GET /edit-suggestions/admin/:id` — single suggestion detail
- `PATCH /edit-suggestions/admin/:id` — approve (applies change) or reject

### Boot guards in startup-migrations.ts

Sequential guard loop includes:
1. HBCUs
2. Cultural sites (existing)
3. Festivals (existing)
4. Sundown towns (existing)
5. Directory businesses (existing)
6. Tour businesses (existing)
7. **Community organizations** ← new
8. **Recurring events** ← new
9. **Tour cultural sites** ← new
10. Knowledge topics (existing)

All guards deduplicate by LOWER(name)|LOWER(city)|LOWER(state).

## Content completed August 8, 2026 (Tasks 144/145/146)

| Content | Status |
|---|---|
| Cultural phrases | ✅ cultural_phrases table + 46 phrases across 10 groups seeded via boot guard |
| Neighborhood timing | ✅ 13 cities UPSERTed into city_profiles.neighborhood_timing JSONB |
| Geocoding boot guard | ✅ Runs each boot, geocodes up to 60 tour_cultural_sites + community_orgs + recurring_events missing lat/lng via Google Maps API |
| Mobile map layers | ✅ 3 new toggles (Orgs/purple, Gatherings/teal, Heritage/amber) + detail cards + edit-suggestion screen |
| KinfolkAI cultural phrases | ✅ Injected into buildSystemPrompt as COMMUNITY LANGUAGE TOOLKIT block |
| Cultural phrases API | ✅ GET /cultural-phrases, GET /cultural-phrases/groups, GET /cultural-phrases/sensitivity |

## Geocoding architecture

- Runs as async boot guard: `geocodeTourContent()` in startup-migrations.ts
- Caps at 60 geocode calls per boot (100ms sleep between calls)
- Priority: tour_cultural_sites → community_organizations → recurring_events
- Items with no lat/lng are silently skipped by map layer fetch (filter: `o.latitude != null`)
- Map pins populate automatically across reboots as geocoding runs

## Map layer architecture (FullMapView.tsx)

Three new opt-in layers (off by default):
- `showCommunityOrgs` → purple `#7C3AED` pins → `selectedOrg` detail card
- `showTourEvents` → teal `#0D9488` pins → `selectedTourEvent` detail card  
- `showTourSites` → amber `#D97706` pins → `selectedTourSite` detail card

Each card has a "Suggest Edit" button routing to `app/edit-suggestion.tsx` with `entityType`, `entityId`, `entityName` params.

## Content Opportunities

HIDDEN by design — never show to users

## Key architecture rules

- All seeded content: `is_active = true`, `tour_source = true`
- Edit suggestions: user submits → admin reviews → approved edit writes directly to target table
- Content Opportunities: NEVER seeded — hidden from all user-facing surfaces
- Any paragraph starting "The founder could…" is also hidden

## Edit suggestion allowed fields per entity type

```
business: name, address, city, state, phone, website, instagram, facebook, description, hours, latitude, longitude
community_org: name, mission, address, phone, website, instagram, facebook
recurring_event: name, venue, address, description, day_of_week, start_time, end_time, frequency
cultural_site: name, address, description, website, phone
city_profile: brief_context, historical_context, why_mwm_here
```
