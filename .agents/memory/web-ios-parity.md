---
name: Web iOS parity — completed pages
description: Pages added to web to match iOS Build 102 feature set; pool increase; nav update
---

## Status (Aug 8, 2026)
All 7 previously-iOS-only features now have web pages:

| Route | File | API |
|-------|------|-----|
| /circles | pages/circles.tsx | /api/circles |
| /collections | pages/collections.tsx | /api/collections |
| /financial-hub | pages/financial-hub.tsx | /api/financial/goals + /api/financial/resources |
| /marketplace | pages/marketplace.tsx | /api/marketplace |
| /wellness | pages/wellness.tsx | /api/wellness/meetings + /api/wellness/crisis-resources |
| /connections | pages/connections.tsx | /api/connections |
| /guides | pages/guides.tsx | /api/guides |

## Nav changes (layout.tsx memberNavItems)
Added: Library, Circles, Guides, Marketplace, Connections to desktop nav.

## Pool change
POOL_MAX raised from 20 → 35 in lib/db/src/index.ts.

## Remaining iOS features not yet on web
- Hashtag feed (/hashtag-feed.tsx) — no web page; API: /api/hashtags/*
- Library delivery preferences tab — web library.tsx has 3 tabs but missing "delivery prefs" tab
- Guide detail page (/guides/[id].tsx) — route links exist, page not built
- Circle detail page (/circles/[id].tsx) — route links exist, page not built
- Collection detail page (/collections/[id].tsx) — route links exist, page not built

**Why:** Permanent founder rule — nothing on iOS that isn't on web. New iOS features must go to web same session.
