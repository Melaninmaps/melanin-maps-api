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

## Content NOT yet extracted from PDFs

| Content | Status | Task |
|---|---|---|
| Cultural phrases glossary (30+ phrases, 8 groups) | ❌ Not built | Task #144 |
| Neighborhood timing data (13 cities) | ❌ Column exists, data not seeded | Task #145 |
| Content Opportunities | HIDDEN by design — never show to users |

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
