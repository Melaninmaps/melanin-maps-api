# Build 98 / Android versionCode 73 — Release Notes
**Date:** 2026-07-27  
**Source commit:** b37c161954f100afa876bf41bf19d0000613fd7a  
**iOS EAS Build ID:** 04eb33b2-bdf5-4d04-aca8-ed24b18d18e5  
**Android EAS Build ID:** 3e309685-851f-466f-9d00-cf44f27f954c  

## What Changed

This is a targeted build fixing the two confirmed defects from Build 97 / VC72
that prevented the founder-approved Map acceptance test from passing.

### Changed files (3)

| File | Change |
|------|--------|
| `artifacts/mobile/components/FullMapView.tsx` | Set `HERITAGE_SITES_ENABLED = true`; add "Historical Sundown Town" to `CATEGORY_STYLES`; add `MAX_HERITAGE_MARKERS = 250` cap; restore Heritage toggle button |
| `artifacts/mobile/app/cultural-heritage.tsx` | Add "Historical Sundown Town" chip to `HERITAGE_CATEGORIES`; add to `heritageInstitutionType` |
| `artifacts/mobile/app.json` | iOS buildNumber 97 → 98; Android versionCode 72 → 73 |

### What was NOT changed

Every other feature is unchanged from Build 97 / VC72:
Apple Sign-In, email login, business listings, Community Feed, KinfolkAI,
Heritage Explorer (Library/Safety Hub), Events, Profile, Saves, Membership,
account deletion, iPad portrait layout, API/database.

## Heritage Marker Crash — Root Cause and Resolution

**Crash (documented in VC71 source comments):**
On Android Fabric (react-native-maps), rendering a `View` containing a
`Text` node (Feather icon — rendered as a font glyph) as a child of
`<Marker>` triggers `view.draw(canvas)` in an unattached-Window context.
This corrupts the native Marker touch descriptor → crash on first tap
interaction.

**Fix (applied in VC71, present in VC72/VC73):**
Android Markers use a plain colored circle (`View`, no `Text`/`Feather`
children). iOS retains Feather icons (iOS was never crashing).

**Why HERITAGE_SITES_ENABLED was still false in Build 97:**
The VC71 code comment stated the fix was an "isolation step" pending
crash-logger evidence from that build. The flag was never re-enabled after
the fix was validated.

**What is NOT known:**
No crash stack trace, device model, or OS version was documented in the
repository. The crash is described only in a source comment.

**Additional safeguards added in Build 98:**
- `MAX_HERITAGE_MARKERS = 250` caps the marker render array regardless of
  API response size (current production total: 170)
- Invalid/NaN coordinates already filtered before the cap is applied
- `isFetchingCulturalSites` ref guards against concurrent fetch/render loops
- `tracksViewChanges = false` on all markers (already present)
- UUID-based marker keys (already present — no duplicates possible)

## Apple Review Notes (Updated)

The app includes a Map tab with two layers:

1. **Business pins** — verified minority-owned businesses
2. **Heritage layer** — culturally significant historical sites including:
   HBCUs, African American Heritage, Civil Rights, Native American Heritage,
   Hispanic & Latino Heritage, LGBTQ+ History, Women's History, Immigrant
   Heritage, Freedom Trails, and Historical Sundown Towns

The Historical Sundown Town layer is a **historical reference layer only**.
Every entry carries the disclaimer: "HISTORICAL RECORD ONLY — These policies
are no longer legally enforceable and do not reflect the current character
of this community." No present-day danger score, safety rating, or unsafe
designation is provided. Sources are documented (Loewen, NAACP, DOJ, state
historical societies, academic archives).

The review account (appstorereview@mappingwithmelanin.com) can access all
visible app features including both map layers.

## Open Issues

**P0:** None remaining in this build scope.

**P1 (requiring founder action, not code):**
- iOS Build 98: IPA must be uploaded via Apple Transporter if EAS Submit
  fails with the same credential issue as Build 97
- Android VC73: Google Service Account key must be regenerated before
  `eas submit` will succeed (see `docs/product/releases/ANDROID_VC72_CREDENTIAL_FIX.md`)
- Physical device testing: iPhone, iPad, Android phone, Android tablet
  cannot be tested from the Replit environment — founder must run the
  Founder Acceptance Test on actual hardware
