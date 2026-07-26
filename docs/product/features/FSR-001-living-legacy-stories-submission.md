# FSR-001 — Living Legacy Stories: Community Submission

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-001 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Living Legacy Stories — Community Memory Submission |
| **Product Area** | Heritage Map / Cultural Storytelling |
| **Status** | PARTIALLY BUILT |
| **Priority** | High |
| **Proposed Phase** | Post-launch, Phase 1 Heritage expansion |
| **Approved for Implementation** | No — infrastructure exists; UI requires separate approval |
| **Implemented** | No |

---

## Original Founder Intent

Community members should be able to submit their personal memories, reflections, and stories connected to a specific heritage place. These submissions should feel alive — not a static encyclopedia. They should honor people, places, traditions, and events through verified history, personal memories, archival material, and present-day voices.

The feature is distinct from FSR-008 (nominating a new place). FSR-001 is contributing a memory or story to an already-catalogued heritage site.

---

## Full Suggestion

Allow members to:
- Submit a written memory or reflection connected to a heritage place
- Attach a short video, photograph, or audio recording
- Identify their relationship to the story (alumni, descendant, community member, historian, etc.)
- Tag their story by topic, decade, or theme
- Invite others to contribute additional memories to the same place

Submissions must go through moderation before becoming public. Stories should display with attribution. Cultural Ambassadors (verified contributors) should be elevated in the display order.

This is NOT an open-edit encyclopedia. Every submission requires attribution, clear source status, and correction procedures.

---

## User Benefit

Members who have a personal or family connection to a heritage site gain a way to contribute their story to the platform. Future visitors to that place find a richer, more human picture of why the site matters — not just official history, but living memory.

---

## Community and Cultural Purpose

Cultural knowledge held by elders, alumni, descendants, and community members is at risk of being lost. This feature creates a dignified, moderated channel for preserving that knowledge in connection with the physical places it concerns.

---

## Current Implementation Status

**PARTIALLY BUILT.** The following exist:

- `heritage_stories` DB table: `siteId`, `userId`, `authorName`, `relationshipType`, `content`, `videoUrl`, `tags` (jsonb), `status` (pending/approved/rejected), `isAmbassador`
- `POST /api/cultural-sites/:id/stories` — accepts submissions, sets status to 'pending'
- `GET /api/cultural-sites/:id/stories` — returns approved stories only, ambassadors first
- `PATCH /api/cultural-sites/stories/:id/moderate` — admin approve/reject/ambassador toggle
- `GET /api/cultural-sites/stories/pending` — admin moderation queue

**Not yet built:**
- Mobile UI for submitting a story from a heritage site screen
- Mobile UI for displaying approved stories within a site's detail view
- Video/photo upload integration
- Member notification on story approval
- Admin moderation UI (API exists; whether admin panel surfaces it is unconfirmed)

---

## Dependencies

- Heritage Sites re-enabled (HERITAGE_SITES_ENABLED = true) — Build 96 must clear Apple review first
- FSR-003 (Cultural Ambassador) — isAmbassador field already in schema; designation workflow needed
- Object storage integration — for photo/audio/video attachments

---

## Related Existing Features

- `heritage_stories` table (lib/db/src/schema/heritage-stories.ts)
- `POST /api/cultural-sites/:id/stories` (artifacts/api-server/src/routes/cultural-sites.ts)
- Community feed (existing moderation pattern to follow)

---

## Relevant Database Tables and Code

- `lib/db/src/schema/heritage-stories.ts`
- `artifacts/api-server/src/routes/cultural-sites.ts` (lines 233–288)
- `artifacts/mobile/app/cultural-heritage.tsx` (detail modal — stories would appear here)

---

## Privacy Considerations

- Submissions are attributed to the author name provided — members may choose to submit anonymously or under a display name
- `userId` is stored internally but is not required (anonymous submissions allowed)
- No personal contact information is displayed publicly
- Video/audio submissions require consent handling before public display

## Safety Considerations

- All submissions require moderation before becoming public (status: 'pending' by default)
- Content must be at least 20 characters and no more than 2,000 characters (server-enforced)
- Reporting mechanism needed for approved stories that later become problematic

## Moderation Considerations

- Admin moderation queue exists at `GET /api/cultural-sites/stories/pending`
- Ambassador designation elevates stories in display order
- Disputed or incomplete stories require a separate handling workflow (see FSR-009)
- Moderation SLA and backlog management process not yet defined

## Accessibility Considerations

- Submission form must be screen-reader accessible
- Audio and video content must include transcript or caption option

## Legal and Policy Considerations

- Contributor retains their story; platform requires a license to display
- Archival photographs may have copyright; upload workflow must prompt for rights confirmation
- Historical claims that could be contested require source attribution and dispute flagging

---

## Open Questions

- What is the content length limit for video submissions?
- Should anonymous submissions be allowed, or must members be logged in?
- What is the moderation SLA target?

## Founder Decisions Required

- Confirm: should members be able to edit or delete their own submitted stories after approval?
- Confirm: should there be a public contributor profile page for members who submit stories?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026. Founder-directed input in attached document: "Pasted-Yes-this-should-be-handled-as-two-connected-tracks."

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-008 (Living Legacy Nominations — creating new place profiles)
- FSR-003 (Cultural Ambassador Program)
