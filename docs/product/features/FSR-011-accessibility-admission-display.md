# FSR-011 — Heritage Site Accessibility and Admission Information Display

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-011 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Heritage Site Accessibility and Admission Information Display |
| **Product Area** | Heritage / UI / Accessibility |
| **Status** | PARTIALLY BUILT |
| **Priority** | Medium |
| **Proposed Phase** | Post-launch, Phase 1 Heritage expansion |
| **Approved for Implementation** | No — data exists; UI requires separate approval |
| **Implemented** | No |

---

## Original Founder Intent

Members planning to visit a heritage site need practical information alongside the cultural description: Is it accessible? Is admission free? Is it family-friendly? Is there an audio guide? These details help members actually get to the places the platform celebrates.

---

## Full Suggestion

Display in heritage site detail view:
- Wheelchair accessibility status (is_accessible)
- Family-friendly status (is_family_friendly)
- Free admission badge (admission_free)
- Audio guide availability (audio_guide)

These should appear as clear visual badges or indicators — not buried in a text description.

---

## User Benefit

A member with mobility needs can immediately see if a site is accessible before making travel plans. A family with young children can filter for family-friendly sites. A budget traveler can prioritize free sites.

---

## Community and Cultural Purpose

Accessibility information is a form of inclusion. Ensuring that members with disabilities, families, and members with budget constraints can plan heritage visits confidently is consistent with the platform's mission of making cultural spaces accessible to all.

---

## Current Implementation Status

**PARTIALLY BUILT.**

Database fields all exist and are populated for all 150 seed records:
- `is_accessible` (boolean)
- `is_family_friendly` (boolean)
- `admission_free` (boolean)
- `audio_guide` (boolean)

The API returns all four fields. `cultural-heritage.tsx` has a `freePill` component in the site card (`admissionFree` badge shown in the card list view). Full display in the detail modal and in the FullMapView tile is not yet implemented.

---

## Dependencies

- Heritage Sites re-enabled

---

## Relevant Database Tables and Code

- `lib/db/src/schema/cultural-sites.ts` (all four fields)
- `artifacts/mobile/app/cultural-heritage.tsx` (freePill rendered in site cards — lines 231–235)
- `artifacts/mobile/components/FullMapView.tsx` (tile does not show these fields)

---

## Privacy Considerations

- No privacy concerns — this is factual site information

## Safety Considerations

- Accessibility information should note when it is unverified or self-reported by the institution
- Incorrect accessibility information could harm members with disabilities — verification process needed

## Moderation Considerations

- Accessibility data should be reviewed when a site is added or updated — not crowdsourced without verification

## Accessibility Considerations

- Accessibility badges must use both an icon and a text label — icon alone is insufficient for screen readers
- Color alone must not be the only signal for accessibility status

## Legal and Policy Considerations

- Platform should note that accessibility information is provided for informational purposes and visitors should confirm with the site directly

---

## Open Questions

- Should members be able to report incorrect accessibility information?

## Founder Decisions Required

None — implementation is straightforward once heritage sites are re-enabled.

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Identified as partially built infrastructure during audit.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
