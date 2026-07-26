# FSR-003 — Cultural Ambassador Program

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-003 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Cultural Ambassador Program |
| **Product Area** | Heritage / Community Recognition |
| **Status** | PARTIALLY BUILT |
| **Priority** | Medium |
| **Proposed Phase** | Post-launch, Phase 2 Heritage expansion |
| **Approved for Implementation** | No — data field exists; designation workflow requires separate approval |
| **Implemented** | No |

---

## Original Founder Intent

Certain members who contribute deeply verified, high-quality stories and memories about heritage places should receive a recognized designation — Cultural Ambassador — that elevates their contributions and signals their trusted status to other members of the community.

---

## Full Suggestion

Cultural Ambassadors are members whose heritage story submissions have been verified, curated, and elevated by the platform. Their stories appear first in a site's community memory section. Their contributor profile shows their Ambassador status. They may receive special recognition in the app.

Cultural Ambassadors are not self-declared — they are designated by the moderation/editorial team after demonstrated high-quality contributions. The designation is tied to specific places, not global.

Future considerations:
- Place-specific or region-specific ambassadors
- Cultural Ambassador "features" (short profile videos, spotlights)
- Ambassador-led guided heritage experiences

---

## User Benefit

High-quality contributors receive recognition and visibility. Other members see whose voices are most trusted on a given site. The platform maintains quality without discouraging participation.

---

## Community and Cultural Purpose

Community knowledge-holders — local historians, descendants, elders, long-time residents — deserve acknowledgment. The Ambassador designation is a form of institutional recognition of lived cultural authority.

---

## Current Implementation Status

**PARTIALLY BUILT.**

- `isAmbassador` boolean field exists on `heritage_stories` table
- `PATCH /api/cultural-sites/stories/:id/moderate` accepts `isAmbassador: boolean`
- Approved ambassador stories sort first in `GET /api/cultural-sites/:id/stories`

**Not yet built:**
- Member-facing Ambassador badge or display
- Admin UI for designating Ambassadors
- Ambassador profile section
- Notification to member when they are designated an Ambassador
- Place-specific vs. global Ambassador scoping

---

## Dependencies

- FSR-001 (Living Legacy Stories submission UI must exist first)
- Admin moderation panel story review workflow

---

## Related Existing Features

- `heritage_stories.isAmbassador` (lib/db/src/schema/heritage-stories.ts)
- Story moderation route (artifacts/api-server/src/routes/cultural-sites.ts)

---

## Privacy Considerations

- Ambassador status is platform-designated, not self-declared — no privacy risk from claiming
- Ambassador profile visibility should respect member's overall privacy settings

## Safety Considerations

- Designation is editorial, not algorithmic — human review required before granting Ambassador status
- Ability to revoke Ambassador status must be available

## Moderation Considerations

- Ambassador designations require a clear editorial standard
- Standard should be documented before the program launches publicly

## Accessibility Considerations

- Ambassador badge must have a text label, not icon only

## Legal and Policy Considerations

- "Cultural Ambassador" is a platform designation, not a professional certification
- Messaging must make clear that Ambassadors are community contributors, not platform employees or paid endorsers

---

## Open Questions

- Is the Ambassador designation per-place, per-heritage-category, or platform-wide?
- Should Ambassadors receive any platform benefits (e.g., premium features)?

## Founder Decisions Required

- Confirm: what are the criteria for Cultural Ambassador designation?
- Confirm: should Ambassador status be publicly visible on the member's profile?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-001 (Living Legacy Stories — stories are the primary input for Ambassador evaluation)
- FSR-007 (Place-Linked Videos — Ambassador features may include short video spotlights)
