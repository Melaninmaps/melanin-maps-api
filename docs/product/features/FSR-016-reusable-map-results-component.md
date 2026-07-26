# FSR-016 — Reusable Map-Results Component

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-016 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Reusable Map-Results Component (Shared by Business and Heritage Categories) |
| **Product Area** | Platform / Architecture / Map |
| **Status** | PROPOSED |
| **Priority** | High |
| **Proposed Phase** | Heritage map implementation phase |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

The same interaction model that enables heritage site browsing on the map — scrollable results list, category filter, search, marker sync, result count, detail tile — should eventually support business categories too. The system should be built as a reusable component, not as separate hard-coded behavior for every category type.

---

## Full Suggestion

A reusable `<MapResultsPanel>` or `<MapBrowseSheet>` component that accepts:
- A data set (businesses OR heritage sites OR any future category)
- A category taxonomy (business categories OR heritage categories)
- A selected category and setter
- A search string and setter
- A selected item and setter (for map pin sync)
- A render function for individual result cards
- A render function for the detail tile

The component handles:
- Horizontal scrollable category chips with selected state and item count
- Search field with debounce
- Vertically scrollable FlatList of results
- Selected-item highlighting in the list (synced from map pin tap)
- Scroll-position preservation when detail tile closes
- Result count display per category
- Safe-area and bottom-nav clearance
- Consistent behavior across iPhone and Android

This would replace the separate, non-reusable implementations currently in:
- `FullMapView.tsx` (business category pills — inline, not separated into a component)
- `cultural-heritage.tsx` (heritage categories, search, FlatList — separate full screen)

---

## User Benefit

The map interaction becomes consistent regardless of whether the user is browsing businesses or heritage sites. New category types can be added without rebuilding the interaction layer.

---

## Community and Cultural Purpose

Consistency across the platform's discovery tools reinforces trust and reduces cognitive load. A member who learns how to browse heritage sites on the map immediately knows how to browse businesses, and vice versa.

---

## Current Implementation Status

**PROPOSED.** Both business and heritage category implementations exist separately but are not shared.

The heritage category results panel that was previously in FullMapView was removed on July 22, 2026 (commit `05e63933`) for stability reasons. The current `cultural-heritage.tsx` screen (1,350 lines) has the full implementation but is not embedded in the map view.

A reusable component would replace both implementations with a single, tested, maintainable one.

---

## Dependencies

- Heritage Sites re-enabled
- Implementation option decision (A, B, or C from the Heritage Map Audit)
- This component is the right architecture for whichever option is chosen

---

## Related Existing Features

- `FullMapView.tsx` (business category pills — lines 523–527)
- `cultural-heritage.tsx` (heritage category tabs, search, FlatList — the full implementation)

---

## Privacy Considerations

None — this is a UI architecture feature.

## Accessibility Considerations

- The reusable component must meet WCAG 2.1 AA across all its modes
- FlatList must support VoiceOver and TalkBack
- Search field must have proper label and focus management

---

## Open Questions

- Should the component be a bottom sheet (slide-up), a side drawer, or a full-screen overlay?
- Should it be in `artifacts/mobile/components/` or in a new `lib/ui` package?

## Founder Decisions Required

- Confirm implementation option (A, B, or C) before this component is designed

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Founder-directed requirement: "The same interaction model should later support business categories, so Replit should build or confirm a reusable map-results component, not separate hard-coded behavior for every category."

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- Part 2 of the audit: Required Immediate Behavior (acceptance tests AT-01 through AT-10)
