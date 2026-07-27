# FSR-015 — Freedom Trail Category in Map Chip Row

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-015 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Freedom Trail Category Chip in FullMapView Heritage Layer |
| **Product Area** | Heritage / Map / UI |
| **Status** | PARTIALLY BUILT |
| **Priority** | Low |
| **Proposed Phase** | Post-launch, Phase 1 Heritage expansion |
| **Approved for Implementation** | No — requires separate approval |
| **Implemented** | No |

---

## Original Founder Intent

The Freedom Trail heritage category exists in the database (3 seed records) and in the cultural-heritage.tsx screen, but does not have a chip in FullMapView's heritage layer CATEGORY_STYLES map. Users tapping the heritage layer on the map cannot filter to Freedom Trail sites.

---

## Full Suggestion

Add "Freedom Trail" to FullMapView's `CATEGORY_STYLES` object so that:
- A "Freedom Trail" category chip appears in the heritage chip row on the map
- Tapping it filters map markers to the 3 Freedom Trail sites
- The chip is visually consistent with other heritage category chips

Proposed style (matching existing pattern):
- Color: #B45309 (amber/brown — matches the cultural-heritage.tsx definition)
- Icon: "navigation" (matches cultural-heritage.tsx)
- Label: "Freedom Trail"

---

## Current Implementation Status

**PARTIALLY BUILT.**

- 3 Freedom Trail records exist in `cultural_sites` seed data
- "Freedom Trail" category is in `cultural-heritage.tsx`'s HERITAGE_CATEGORIES array
- "Freedom Trail" is NOT in FullMapView.tsx's CATEGORY_STYLES — no map chip, no marker color/icon assignment

---

## Dependencies

- Heritage Sites re-enabled (HERITAGE_SITES_ENABLED = true)

---

## Relevant Database Tables and Code

- `artifacts/mobile/components/FullMapView.tsx` (CATEGORY_STYLES object — needs "Freedom Trail" entry)
- `artifacts/mobile/app/cultural-heritage.tsx` (HERITAGE_CATEGORIES line 105 — already has it)

---

## Privacy Considerations

None.

## Safety Considerations

None.

## Moderation Considerations

None.

---

## Open Questions

None — this is a small, targeted addition.

## Founder Decisions Required

- Confirm: should Freedom Trail be visible in the map chip row? (3 records may be too few for a prominent chip)

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Identified as missing from FullMapView CATEGORY_STYLES during audit.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
