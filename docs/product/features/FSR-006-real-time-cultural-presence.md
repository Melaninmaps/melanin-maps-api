# FSR-006 — Real-Time Cultural Presence

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-006 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Real-Time Cultural Presence at Heritage Sites |
| **Product Area** | Heritage / Events / Community |
| **Status** | PROPOSED |
| **Priority** | Medium |
| **Proposed Phase** | Post-launch, Phase 3 |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

Heritage places should feel alive, not like a historical archive. Members should be able to see what is happening at a place right now — upcoming events, restoration efforts, community gatherings, volunteer opportunities — alongside the historical record.

"Real time" means recent and culturally relevant, not unmoderated livestreaming by default.

---

## Full Suggestion

Each heritage site detail page should eventually surface:
- Upcoming cultural events connected to this specific location
- Homecoming and alumni gatherings (for HBCUs)
- Restoration and preservation efforts currently underway
- Volunteer opportunities at or for this place
- Community alerts involving the location
- Recent verified community stories or videos
- Calls for photographs, oral histories, or historical information
- What is happening at the place now (recent activity, not livestream)

Content should be:
- Curated or moderated, not open-submission without review
- Connected to the specific place (not a general events feed)
- Updated on a meaningful cadence — not stale

---

## User Benefit

A member visiting a heritage site profile sees it as a living community hub, not a static informational page. They can find a reason to visit, contribute, or get involved today.

---

## Community and Cultural Purpose

Heritage institutions — especially those facing funding or awareness challenges — benefit from visibility of their current activities. Connecting present-day events to the historical record creates a narrative continuity: this place mattered then, and it matters now.

---

## Current Implementation Status

**PROPOSED.** No real-time presence infrastructure is connected to heritage sites.

The platform has an events system (`events` table, `/api/events` routes) that is not yet linked to heritage sites. Community alerts exist but are geography-based, not place-specific. These could serve as the foundation.

---

## Dependencies

- Heritage Sites re-enabled
- Events system (existing) — needs a `heritage_site_id` foreign key to support place-linked events
- FSR-007 (Place-Linked Videos) — recent verified videos are part of real-time presence
- Community alerts system — needs place-specific filtering capability

---

## Related Existing Features

- Events system (`events` table, `/api/events`)
- Community alerts (`community_alerts` table)
- Heritage sites (`cultural_sites` table)

---

## Privacy Considerations

- Event organizer contact information should not be displayed without consent
- Location precision for events must respect organizer's privacy preferences

## Safety Considerations

- Community alerts at a heritage location must be verified before display
- Volunteer opportunity listings require vetting before appearing on platform

## Moderation Considerations

- "What's happening now" content cannot be unmoderated — requires a review or trusted-source model
- Distinction needed between platform-curated content and community-submitted content

## Accessibility Considerations

- Real-time content must degrade gracefully when no current events exist (no blank states)

## Legal and Policy Considerations

- Volunteer opportunity listings may need a disclaimer that the platform does not vet the organizations

---

## Open Questions

- Should real-time presence be platform-curated (editorial) or community-submitted (moderated)?
- What is the content freshness threshold — how old can "recent" content be?

## Founder Decisions Required

- Confirm: should heritage institutions be able to claim their listing and post their own current events and updates?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-007 (Place-Linked Videos)
- FSR-004 (Alumni Profiles — homecoming events are a primary use case)
