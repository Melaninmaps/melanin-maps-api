# FSR-013 — Verified Source Citations Display

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-013 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Verified Source Citations Display |
| **Product Area** | Heritage / Trust / UI |
| **Status** | PARTIALLY BUILT |
| **Priority** | Low–Medium |
| **Proposed Phase** | Post-launch, Phase 1 Heritage expansion |
| **Approved for Implementation** | No — data exists; UI requires separate approval |
| **Implemented** | No |

---

## Original Founder Intent

Members should be able to see where the historical information about a heritage place comes from. Verified sources — National Park Service, Smithsonian, UNCF, National Register of Historic Places — lend credibility and allow interested members to learn more from authoritative records.

---

## Full Suggestion

Display the `verifiedSource` field in the heritage site detail view:
- Shown as a small, clearly labeled "Source:" attribution below the significance or description
- Not prominently displayed (it is supplementary context, not headline information)
- Linked to the external source if a URL is available (currently stored as a text string, not a URL)

All 150 current seed records have verifiedSource populated. Examples:
- "National Park Service"
- "Smithsonian Institution"
- "UNCF"
- "National Register of Historic Places"
- "Equal Justice Initiative"
- "Navajo Nation"

---

## User Benefit

Members who want to learn more can see where the information comes from. Members with reason to question a historical claim can identify the source. Source attribution builds trust in the platform's cultural content.

---

## Community and Cultural Purpose

A platform that cites its sources for historical claims treats its community as intellectually capable adults. It also models the kind of epistemic rigor that protects against misinformation spreading about culturally sensitive history.

---

## Current Implementation Status

**PARTIALLY BUILT.**

- `verified_source` column exists and is populated for all 150 records
- API returns it as `verifiedSource`
- `cultural-heritage.tsx` does not currently display it (confirmed during audit)
- FullMapView tile does not display it

---

## Dependencies

- Heritage Sites re-enabled

---

## Relevant Database Tables and Code

- `lib/db/src/schema/cultural-sites.ts` (`verifiedSource` field)
- `artifacts/mobile/app/cultural-heritage.tsx` (detail modal — where it should appear)

---

## Privacy Considerations

- No privacy concerns — sources are public institutions

## Moderation Considerations

- Source citations should be reviewed when a site record is updated

---

## Open Questions

- Should `verifiedSource` be a clickable link, or just displayed as text?
- If clickable, what URL would it link to? (Currently stored as institution name only, not URL)

## Founder Decisions Required

None at this time — display as text is a safe default.

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Identified as partially built during audit.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-009 (Disputed and Incomplete Content — source citations support dispute resolution)
