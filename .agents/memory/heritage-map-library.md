---
name: Heritage Sites on Map + Library
description: How cultural heritage sites surface on the map tab and library tab in the mobile app
---

## Map Tab

`map.tsx` now imports `FullMapView` (not `BusinessMapView`).

**Why `FullMapView` instead of `BusinessMapView`:**  
`BusinessMapView.native.tsx` and `.android.tsx` were mini-map variants that Metro picked up on native platforms, bypassing the full-featured `.tsx` file. Creating `FullMapView.tsx` (no platform extension) forces Metro to use it on all platforms.

## FullMapView.tsx (components/FullMapView.tsx)

- `showCulturalSites` defaults to `true` — heritage pins visible on first open
- `CATEGORY_STYLES` map provides color + Feather icon per heritage category (HBCU=purple/book-open, Civil Rights=red/flag, African American=gold/star, etc.)
- Pin legend scrollable strip shown when layer is active
- Tapping a heritage pin shows a bottom card with "View Details" button → navigates to `/cultural-heritage?initialCategory=<category>`
- Business pins use gold circle with briefcase icon (distinct from heritage pins)

## Library Tab (Cultural Heritage section)

Horizontal scroll of 16 live site cards (fetched from `/api/cultural-sites` on mount, sliced to 16) added before "Explore Community Resources" section. Each card: category color dot, name, city/state, category pill. "See All" → /cultural-heritage. "View All Sites" end tile.

**How to apply:** Cultural Heritage Explorer card still exists in Resources section — both remain in place.

## Cultural Heritage Screen deep-link

`useLocalSearchParams<{ initialCategory?: string }>()` — pass `initialCategory` as route param to pre-filter the explorer to a specific heritage category.
