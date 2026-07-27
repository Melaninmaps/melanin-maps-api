# Maps, Heritage, and Historical Sundown Towns — Engineering Review
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026

---

## A. MAPS IMPLEMENTATION

### Mobile Map Component

**Primary component:** `FullMapView.tsx` (no platform extension)
- Replaced `BusinessMapView` on the map tab
- Cultural sites ON by default when the map loads
- 11 category-specific map pins
- Business pins cluster using `react-native-maps` clustering
- Heritage/cultural site pins use distinct markers
- "View Details" deep-links to the cultural-heritage detail screen

**Library:** `react-native-maps@1.27.2` (patched: `patches/react-native-maps@1.27.2.patch`)
**Patch purpose:** Required Podfile fix — the `withRnMapsPodfileFix` plugin handles iOS pod injection. Setting `ios.config.googleMapsApiKey` in `app.config.js` would trigger a conflicting pod injection from Expo's own Maps.js; the key is intentionally excluded from iOS config and the plugin handles native initialization instead.

**iOS pod status:** `withRnMapsPodfileFix` plugin is listed in `app.json` plugins. This is the correct and verified configuration.

**Known historical bug (resolved):** `StyleSheet.absoluteFillObject` was removed in React Native 0.86. Previous code using it caused `MapView` to get zero size; `onMapReady` never fired; screen stayed black. Fixed by using explicit position coordinates or `StyleSheet.absoluteFill`.

### Web Map Component

**Technology:** Google Maps JavaScript API
**Key delivery:** `GET /api/maps/js-key` (server-side, key not embedded in client bundle)
**Fallback:** `gm_authFailure` event triggers a user-visible fallback message
**Layout:** Split-pane (sidebar with search/category filter/business cards + map)

### Google Maps API Key Configuration

| Environment | Key Source |
|-------------|-----------|
| EAS preview | `GOOGLE_MAPS_API_KEY` in eas.json `env` block |
| EAS production | `GOOGLE_MAPS_API_KEY` in eas.json `env` block |
| API server | `GOOGLE_MAPS_API_KEY` env var → `GET /api/maps/js-key` |
| iOS native | NOT in `ios.config.googleMapsApiKey` (intentional — avoids pod conflict) |

**Risk:** The Google Maps API key is embedded in EAS build env vars (visible in eas.json in this package with values). This is the standard EAS approach for public env vars. The key should be restricted in Google Cloud Console to the app's bundle identifier and API server domain.

---

## B. HERITAGE PLACES (CULTURAL SITES)

### Database

**Table:** `cultural_sites` (in `lib/db/src/schema/cultural-sites.ts`)

**Status:** ✅ Table exists. Data is populated (seeded or imported — exact count not confirmed in this document; check `SELECT COUNT(*) FROM cultural_sites` on Railway Postgres).

### API Routes

**Router:** `artifacts/api-server/src/routes/cultural-sites.ts`
**Mounted at:** `/api/cultural-sites` (via `router.use(culturalSitesRouter)` in routes/index.ts)

Key endpoints (inferred from route file existence and map integration):
- `GET /api/cultural-sites` — list/search cultural sites
- `GET /api/cultural-sites/:id` — site detail

### Mobile Integration

- Heritage pins appear on `FullMapView.tsx` by default
- "View Details" navigates to the cultural-heritage detail screen
- Library tab includes a horizontal scroll of heritage site cards (16 live cards confirmed in project memory)

### Risk Assessment

| Risk | Level | Notes |
|------|-------|-------|
| Content accuracy | Low | Sites are sourced from cultural/historical records |
| Permission requirements | None | Heritage viewing requires no special permissions |
| Apple rejection risk | Low | Educational/cultural content is generally unproblematic |
| Data completeness | Unknown | Exact record count not confirmed |

---

## C. HISTORICAL SUNDOWN TOWNS

### Implementation Status: **PARTIALLY PLANNED, DATA NOT CONFIRMED IMPORTED**

This is the most important section for Manus to assess. The honest status is:

| Component | Status |
|-----------|--------|
| `sundown` category in `reports.category` enum | ✅ Exists in schema |
| `sundown` in `businesses` profile fields | ✅ Reference field exists |
| `sundown` in `directions` / safety context | ✅ Referenced |
| `cultural_sites` table as architectural model | ✅ Identified as correct model |
| Dedicated sundown towns table | ❓ Not confirmed in schema inspection |
| Data imported to production DB | ❌ **NOT CONFIRMED** |
| Dedicated Sundown Towns screen | ❓ Not confirmed as built |
| State browsing UI | ❓ Not confirmed as built |
| Map markers for sundown towns | ❓ Not confirmed |
| Source attribution and disclaimers | ❓ Not confirmed as implemented |

### Audit History

A 12-section audit was conducted (see `docs/product/BUILD_97_HISTORICAL_SUNDOWN_TOWNS_AUDIT.md`). That audit documented:
- 9 pre-implementation gates
- 6 open founder questions
- Clear instruction: **no implementation until all gates clear**

### Data Source

The project references historical sundown town data. The authoritative public dataset is the Sundown Towns database compiled by Dr. James Loewen (now maintained at tougaloo.edu / sundown.tougaloo.edu). Any use must:
- Credit the source explicitly
- Clearly label data as **historical** (towns listed were historically exclusionary; current status varies significantly)
- Include a clear disclaimer: "Historical record only. Does not indicate current conditions, resident demographics, or safety."
- Never present a "safety score" or danger rating for current conditions

### Licensing / Reuse Status

**Not confirmed in project documentation.** Manus should determine: what dataset is being used, under what license, and whether attribution requirements are met.

### Minimum Viable Presentation (if shipped)

If Historical Sundown Towns ships in Build 97, it MUST have:
1. Clearly labeled as "Historical Sundown Towns" — not a current safety warning
2. Data source credited (e.g., "Source: Sundown Towns Project, Tougaloo College")
3. Disclaimer on every entry: "This location was historically documented as a sundown town. This is a historical record and does not reflect current conditions."
4. No present-day danger scores, risk ratings, or safety warnings derived from historical status
5. "Current vs. Historical" distinction on every screen showing this data

### Recommendation to Manus

Given the uncertain implementation state, Manus is asked to recommend one of:
- **Ship as full feature** (if data is confirmed imported, UI is confirmed built, all disclaimers in place)
- **Ship with a feature flag** (hidden behind an admin toggle until confirmed ready)
- **Defer entirely to Build 98** (safest option if any gates are uncleared)

---

## D. TABLET LAYOUTS

### iOS iPad
- `supportsTablet: true` in `app.json`
- iPad supports all four orientations (portrait, portrait-upside-down, landscape-left, landscape-right — confirmed in Info.plist `UISupportedInterfaceOrientations~ipad`)
- `UIRequiresFullScreen: false` — split-screen multitasking permitted
- Map and heritage views: not specifically tablet-optimized in project records. **iPad layout testing has not been confirmed as completed.**

### Android Tablet
- `targetSdkVersion: 36` — required for Play Store large-screen guidelines compliance
- `withChromebookSupport` plugin listed in app.json — adds ChromeOS/Android tablet support
- Specific large-screen layout adaptations: not confirmed in project documentation

---

## E. PERFORMANCE RISKS

| Risk | Assessment |
|------|-----------|
| Large business dataset on map | Medium — viewport-based loading mitigates, but not confirmed for all data volumes |
| Heritage site clustering | Low — standard react-native-maps clustering |
| Sundown Towns data volume | Unknown — depends on dataset size |
| Google Maps API rate limits | Low for tester scale |
| Open-Meteo (weather) latency | Low — free tier, no rate limits for reasonable use |

---

## F. QUESTIONS FOR MANUS

1. Based on the information in this package, is Maps ready to ship?
2. Is Heritage Places ready to ship?
3. **What is the actual implementation status of Historical Sundown Towns?** Manus should ask the founder directly: has the data been imported? Has the UI been built beyond schema planning?
4. Are the data source, disclaimers, and historical/current distinction sufficient for Apple review if Sundown Towns ships?
5. Is the Google Maps API key configuration (in EAS env, not iOS native config) appropriate and secure?
6. Should the Sundown Towns feature be deferred entirely to a later build?
