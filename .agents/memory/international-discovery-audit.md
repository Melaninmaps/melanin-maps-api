---
name: International Discovery Pilot — Bangkok/Phuket audit
description: Full audit of US-only assumptions; what was fixed; what remains; how to add international places via admin
---

# International Discovery Pilot — Audit Results (Aug 10 2026)

## CONFIRMED NO BLOCKERS for Bangkok/Phuket admin entry

All geo assumptions audited:

| Check | Status | Detail |
|---|---|---|
| state required in DB | ✅ CLEAN | state is nullable; migration applied |
| ZIP required | ✅ CLEAN | optional in form + API |
| US-only geocoder | ✅ CLEAN | Google Maps Geocoding API, no country restriction |
| US-only phone validation | ✅ CLEAN | no format validation; placeholder updated to intl |
| US-only country default | ✅ CLEAN | country col exists, NULL = US; form shows intl hint |
| US-only map bounds | ✅ CLEAN | Haversine formula; fitToCoordinates fires on any lat/lng |
| US-only distance logic | ✅ CLEAN | Haversine works globally |
| province support | ✅ CLEAN | province col on businesses + tour content tables |

## Bugs Fixed This Session

1. **adminNotes privacy bug** — adminNotes was being appended to public `description`. Fixed: now stored in `admin_notes` TEXT column (migration: businesses_admin_notes_col_v1).

2. **Batch geocoder country gap** — `geocodeTourContent()` in startup-migrations.ts was passing only (address, city, state) — would fail for international tour content. Fixed: now passes (address, city, province||state, country). Migration `tour_content_intl_cols_v1` adds province+country to tour_cultural_sites, community_organizations, recurring_events.

3. **Admin form placeholders** — phone was "(555) 555-5555"; city was "Philadelphia". Both updated to show intl format.

4. **Admin form labels** — description relabeled to "Description & Why MWM Recommends (public)"; adminNotes relabeled to "Source & Provenance (internal — never shown publicly)".

## How Admin Adds a Bangkok/Phuket Business Today

1. Go to Admin panel → Add Business
2. Name + Category (required) + City (e.g. "Bangkok") — no state/ZIP needed
3. Country: "Thailand" — form adapts; state field becomes province
4. Address (optional) — if provided, geocoder uses address+city+province+country
5. Description: Why this place matters to community (public)
6. Source & Provenance: How the founder found it (internal, never shown to users)
7. Phone: Any format (+66 XX XXX XXXX)
8. Status: "staged" (not public until reviewed) or "live_unclaimed"

## What "Province" Maps To for Thailand
- Bangkok → province = "Bangkok" (or "Krung Thep Maha Nakhon")
- Phuket → province = "Phuket Province"
- Form automatically routes to province field when country ≠ US/USA/United States

## Remaining International Work (not yet built)
- Mobile map DEFAULT_REGION is US-centered (37.0, -95.0, delta 32/52) — Bangkok businesses appear only after fitToCoordinates fires from loaded business data
- KinfolkAI has no Bangkok/Phuket cultural context (Task #183 — deferred)
- Search does not auto-suggest city names for international cities (city_profiles table is US-focused)
- Business card address rendering: uses "city, state" format — for international shows "city, province, country" only if province/country columns are populated correctly
