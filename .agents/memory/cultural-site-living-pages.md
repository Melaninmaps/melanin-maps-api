---
name: Cultural Site Living Pages
description: Web page at /sites/:id for every cultural site on the map — stories, quick facts, share form, support links, back-to-map nav.
---

# Cultural Site Living Pages

## Architecture

- Route: `GET /sites/:id` → `artifacts/web/src/pages/cultural-site-detail.tsx`
- Public — no auth required (so map pins can be shared externally)
- Fetches 3 parallel endpoints on load:
  - `GET /api/cultural-sites/:id` — site detail
  - `GET /api/cultural-sites/:id/stories` — approved community stories
  - `GET /api/cultural-sites/:id/support-links` — curated support links

## Living Stories (heritage_stories table)
- Users can submit a story tied to a relationship type (alumnus, student, faculty, community_member, family, visitor, researcher, other)
- Stories go to `status='pending'` — admin moderates via existing PATCH /cultural-sites/stories/:storyId/moderate
- Ambassador stories get a badge
- Minimum 20 chars, max 2000

## Map Pin Integration
- Map info-window: "View Full Page →" link at bottom → `/sites/:id`
- Map sidebar: "View Full Page →" link under each site card (e.g. all HBCUs)

## Heritage Category Accent Color Map
`HERITAGE_COLORS` object in cultural-site-detail.tsx maps each heritageCategory to a brand color.
HBCU → `#7C3AED` (purple), Civil Rights → `#DC2626` (red), African American Heritage → `#CA922B` (gold), etc.

**Why:** Every map pin needed a destination where community members can read the full story and add their own connection, not just a popup snippet.
