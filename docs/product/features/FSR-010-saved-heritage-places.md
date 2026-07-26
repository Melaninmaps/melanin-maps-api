# FSR-010 — Saved Heritage Places

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-010 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Saved Heritage Places |
| **Product Area** | Heritage / Profile / Favorites |
| **Status** | PROPOSED |
| **Priority** | Medium |
| **Proposed Phase** | Post-launch, Phase 1 Heritage expansion |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

Members should be able to save heritage places they want to visit, remember, or return to — just as they can save businesses. Saved heritage places could feed into trip planning, heritage collections, and community sharing.

---

## Full Suggestion

Member ability to:
- Save a heritage site to a personal list
- Organize saved heritage places into collections (e.g., "HBCU Road Trip," "Civil Rights Trail," "Family Heritage")
- Share a saved collection with other members or publicly
- Receive updates when a saved heritage place has new community stories, events, or preservation news
- Mark a heritage place as "visited"

Future integration:
- KinfolkAI can suggest heritage places based on saved places and travel preferences
- Trip planner can generate an itinerary from a saved collection
- Circles (existing feature) can include heritage places alongside businesses

---

## User Benefit

Members planning heritage travel have a personal map of places they care about. Families tracing their roots can build a private collection of relevant sites. Members who have visited can mark and share their heritage journey.

---

## Community and Cultural Purpose

Heritage travel — visiting HBCUs, civil rights sites, and cultural neighborhoods — is a meaningful act of cultural connection. Giving members tools to plan and remember these journeys serves the platform's mission and deepens member engagement.

---

## Current Implementation Status

**PROPOSED.** The `saved_places` table exists for businesses but is not extended to cultural sites. The Kinfolk Circles feature (existing) already allows a saved-places concept for groups.

---

## Dependencies

- Heritage Sites re-enabled
- `saved_places` table extension to support `cultural_site_id` in addition to `business_id`
- Or a new `saved_heritage_places` table

---

## Related Existing Features

- `saved_places` table (businesses — existing)
- `useFavorites` hook (mobile — existing)
- Kinfolk Circles (existing — circles can include saved places)
- KinfolkAI (existing — can incorporate saved heritage places into recommendations)

---

## Privacy Considerations

- Saved heritage collections should default to private
- Members control visibility of their saved heritage collections
- "Visited" status should be private by default

## Safety Considerations

- No specific safety concerns — saving a heritage place is a passive action

## Moderation Considerations

- No moderation required for saving; collections shared publicly go through the existing community content review

## Accessibility Considerations

- Save action must be accessible via keyboard and screen reader

## Legal and Policy Considerations

- No specific legal concerns

---

## Open Questions

- Should heritage places and businesses share the same saved-places list or have separate lists?

## Founder Decisions Required

- Confirm: should saved heritage place collections be shareable publicly or only with specific members?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Founder-directed input: "Saved heritage places / Lists and trip collections" in future-state list.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-006 (Real-Time Cultural Presence — updates for saved places)
