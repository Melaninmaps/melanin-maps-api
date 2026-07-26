# FSR-014 — Heritage Site Images

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-014 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Heritage Site Images |
| **Product Area** | Heritage / Media / UI |
| **Status** | DEFERRED |
| **Priority** | Medium |
| **Proposed Phase** | Phase 2 Heritage expansion |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

Heritage site profiles should include an image that helps members visually recognize the place — a photograph of the building, campus, memorial, or neighborhood.

---

## Full Suggestion

Each heritage site card and detail view should show a representative image:
- Displayed as a header image in the detail view
- Displayed as a thumbnail in the list card
- Must be appropriately licensed (Creative Commons, institutional permission, or original)
- Should reflect the present-day appearance of the site, not only historical images

---

## User Benefit

Visual recognition helps members identify places they have visited or want to visit. Images make the heritage explorer feel like a travel guide rather than a historical text.

---

## Community and Cultural Purpose

Visual representation of cultural places is part of how communities claim and celebrate their heritage. A photograph of an HBCU campus, a civil rights memorial, or a cultural neighborhood communicates the reality and beauty of these spaces in ways that text alone cannot.

---

## Current Implementation Status

**DEFERRED.** Schema is ready; no images are seeded.

- `image_url` column exists in `cultural_sites` table
- API returns `imageUrl` in the response
- No seed data includes images
- No image upload or sourcing workflow exists
- UI components in `cultural-heritage.tsx` do not yet render images (no `imageUrl` is available to render)

The schema is ready. The blocker is image sourcing — each of the 150 records needs a properly licensed image.

---

## Dependencies

- Image sourcing workflow (institutional partnerships, Creative Commons, or original photography)
- Object storage for images
- Rights management / licensing confirmation per image

---

## Relevant Database Tables and Code

- `lib/db/src/schema/cultural-sites.ts` (`image_url` field)
- `artifacts/mobile/app/cultural-heritage.tsx` (would receive `imageUrl`)

---

## Privacy Considerations

- Historical photographs may include identifiable individuals — rights and consent must be considered

## Legal and Policy Considerations

- All images must have confirmed licensing (Creative Commons, institutional permission, or platform-original)
- Copyright clearance must happen before any image is added to seed data
- Images from Smithsonian, National Park Service, and other public institutions may be freely available

---

## Open Questions

- Should the platform partner with institutions to receive authorized images, or source from public-domain archives?
- Can members submit photographs of heritage places they have personally taken?

## Founder Decisions Required

- Confirm: is there a budget or partnership strategy for image sourcing?
- Confirm: should member-submitted photographs eventually serve as site images after review?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Identified as schema-ready but deferred during audit.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-007 (Place-Linked Videos — related media infrastructure)
