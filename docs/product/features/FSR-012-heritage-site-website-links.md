# FSR-012 — Heritage Site Official Website Links in Map Tile

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-012 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Heritage Site Official Website Links in FullMapView Tile |
| **Product Area** | Heritage / Map / UI |
| **Status** | PARTIALLY BUILT |
| **Priority** | Low–Medium |
| **Proposed Phase** | Post-launch, Phase 1 Heritage expansion |
| **Approved for Implementation** | No — data exists; tile UI requires separate approval |
| **Implemented** | No |

---

## Original Founder Intent

When a member taps a heritage site marker on the map and sees the bottom tile, they should be able to go directly to the site's official website without needing to navigate to the full detail screen first.

---

## Full Suggestion

Add an official website link/button to the FullMapView heritage site bottom tile, alongside the existing Directions and View Site buttons. The button should:
- Open the external URL in the device browser
- Track the click via the existing `/api/external-clicks` endpoint
- Only appear when `externalUrl` is populated (all 150 current records have it)
- Use the same visual language as the existing Directions button

---

## User Benefit

A member who taps a heritage marker can immediately visit the institution's official website — for tickets, visiting hours, or more information — without navigating through the full detail screen.

---

## Community and Cultural Purpose

Reducing friction between cultural discovery and action (visiting, donating, learning more) serves the platform's mission of connecting members to cultural places.

---

## Current Implementation Status

**PARTIALLY BUILT.**

- `externalUrl` is populated for all 150 seed records
- The API returns `externalUrl` in the cultural sites response
- `cultural-heritage.tsx` shows a "Visit Site" button in the card list view and external click tracking exists
- The FullMapView tile (lines 635–703) does NOT include a website button — only Directions and View Site

---

## Dependencies

- Heritage Sites re-enabled (HERITAGE_SITES_ENABLED = true)
- External click tracking route already exists

---

## Relevant Database Tables and Code

- `artifacts/mobile/components/FullMapView.tsx` (lines 669–700 — tile button row)
- `artifacts/mobile/app/cultural-heritage.tsx` (lines 261–281 — existing Visit Site button pattern)
- `artifacts/api-server/src/routes/external-clicks.ts`

---

## Privacy Considerations

- External click tracking records institution name and URL — no PII

## Safety Considerations

- Only verified, seeded URLs displayed — no user-submitted URLs in the tile

## Moderation Considerations

- URL verification should be part of site onboarding; no on-the-fly moderation needed

## Accessibility Considerations

- External link button must have an accessible label indicating it opens in an external browser

---

## Open Questions

None — this is a straightforward UI addition once heritage sites are re-enabled.

## Founder Decisions Required

None at this time.

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Identified as partially built during audit.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-013 (Verified Source Citations — companion data field for same tile)
