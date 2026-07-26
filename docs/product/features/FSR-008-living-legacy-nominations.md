# FSR-008 — Living Legacy Stories: Nominations (New Place Profiles)

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-008 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Living Legacy Stories — Nominations (Creating New Place Profiles) |
| **Product Area** | Heritage / Cultural Preservation |
| **Status** | PROPOSED |
| **Priority** | Medium |
| **Proposed Phase** | Post-launch, Phase 2–3 Heritage expansion |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

Members should be able to nominate a person, place, neighborhood, institution, tradition, or cultural event for preservation on the platform — even if it does not yet have a heritage site profile. The platform should be a living system where community knowledge expands the cultural map, not just a static directory.

This is distinct from FSR-001, which is contributing a memory to an already-catalogued site. FSR-008 is creating a new heritage profile from scratch through community nomination.

---

## Full Suggestion

Nomination flow:
- Member nominates a person, place, institution, neighborhood, tradition, or cultural event
- Explains why it matters to the community
- Uploads a memory, photograph, audio recording, or short video
- Connects the nomination to a map location (if applicable)
- Identifies their relationship to the story (resident, descendant, community member, historian)
- Submits sources or supporting information
- Invites others to contribute additional memories to the same nomination

After submission:
- Other members can co-contribute memories to the nomination
- Multiple contributions create a timeline from different perspectives
- Editorial team reviews and verifies before the place is added to the map
- Disputed, incomplete, or community-sourced information is marked clearly
- Contributor relationships and sources are preserved in the final profile

Types of things that can be nominated:
- A specific building, neighborhood, or landmark
- A person (ancestor, current community leader, cultural figure)
- An institution (church, school, business, organization)
- A neighborhood or district (lost to gentrification, urban renewal, or disaster)
- A tradition (annual celebration, cultural practice, food tradition)
- A cultural event (historical or recurring)

This is NOT an open-edit encyclopedia. Submissions have attribution, moderation, source status, and correction procedures. The platform is the final arbiter of what appears on the public map.

---

## User Benefit

Members can ensure that places and people that matter to their community — especially those at risk of being forgotten — are preserved and recognized. The cultural map grows with the community's knowledge.

---

## Community and Cultural Purpose

Gentrification, urban renewal, and institutional neglect have erased many culturally significant places from the physical landscape. This feature creates a mechanism for communities to reclaim the historical record of those places before living memory is lost.

---

## Current Implementation Status

**PROPOSED.** No nomination infrastructure exists.

The `cultural_sites` table exists and could receive records from the nomination pipeline. The `heritage_stories` table could serve as the contribution layer for nominations. Admin review would be needed to publish a nomination as an official heritage site record.

---

## Dependencies

- FSR-001 (Living Legacy Stories submission — nominations build on the same contribution model)
- FSR-009 (Disputed and Incomplete Content — nominations may be disputed)
- Map coordinate entry UI — members must be able to pin a location on a map

---

## Related Existing Features

- `cultural_sites` table (nomination's destination once approved)
- `heritage_stories` table (contributions to a nomination before it is published)
- Community Reference feature (existing — similar concept for businesses; pattern to reference)

---

## Privacy Considerations

- Nominations about living individuals require their consent before the profile goes public
- Contributor identity can be anonymous in the nomination but must be on record for editorial review

## Safety Considerations

- Nominations about living individuals must not expose personal details (address, contact info) in the public profile
- Community reporting tool must be available on all nomination profiles

## Moderation Considerations

- Nominations require editorial review before appearing on the public map
- Disputed historical claims must be flagged clearly — the platform does not adjudicate historical disputes
- Correction and appeal process needed for rejected nominations

## Accessibility Considerations

- Map location picker must be accessible to members who cannot use touch-based map interaction
- All nomination fields must have accessible labels and keyboard navigation

## Legal and Policy Considerations

- Content about living individuals requires specific consent and defamation protections
- Platform should not accept nominations of private individuals without demonstrable public cultural significance
- Community-sourced historical claims must be distinguished from verified historical records

---

## Open Questions

- What is the minimum information required to submit a nomination?
- Should nominations be visible to the public as "pending" or only after editorial approval?
- How long can a nomination stay in pending status before being resolved?

## Founder Decisions Required

- Confirm: can members nominate living individuals (not just places and institutions)?
- Confirm: should rejected nominations be visible to the nominator with an explanation?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Founder language: "nominate a person, place, neighborhood, institution, tradition, or event."

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-001 (Living Legacy Stories submission — the contribution model FSR-008 builds on)
- FSR-009 (Disputed and Incomplete Content Handling)
- FSR-017 (Living Legacy Stories — approved platform terminology)
