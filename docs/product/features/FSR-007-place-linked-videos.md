# FSR-007 — Place-Linked Videos

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-007 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Place-Linked Videos |
| **Product Area** | Heritage / Media / Cultural Storytelling |
| **Status** | PROPOSED |
| **Priority** | High |
| **Proposed Phase** | Post-launch, Phase 2 Heritage expansion |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

Videos should be linked to a specific place, not simply added to a general video feed. The cultural weight of a video — an elder describing their memory of a civil rights march at that exact location, a homecoming celebration at an HBCU — belongs in the context of the place it concerns.

---

## Full Suggestion

Video types that should be linkable to heritage places:
- Alumni reflections (personal memories of time spent at the place)
- Student and faculty stories (current and historical)
- Elder oral histories (lived memory of an era connected to the place)
- Local historian presentations
- Cultural Ambassador feature videos (short "Why this place matters" format)
- Archival photographs paired with present-day footage (then/now comparison)
- Community memories connected to specific locations
- Homecoming, reunion, commemoration, and festival footage
- Preservation and restoration progress documentation

Video metadata for each place-linked video:
- Title
- Type (alumni reflection, oral history, Cultural Ambassador, archival, community)
- Decade or era (if historical)
- Contributor name (optional — may be anonymous)
- Tags (topic, tradition, career path, location within the site)
- Heritage site ID (the place it belongs to)
- Verification status (community-submitted pending review, or verified)

---

## User Benefit

A member viewing Howard University's heritage profile finds a video of a 1965 alumnus describing their time on the yard — context that no official history page provides. Future generations preserve the lived experience of these places.

---

## Community and Cultural Purpose

Oral history and community memory are primary vehicles of cultural transmission in many African American, Indigenous, and immigrant communities. Video is the most accessible format for capturing and sharing that memory. Tying it to a physical place creates an archive that is geographically and culturally navigable.

---

## Current Implementation Status

**PROPOSED with partial schema support.**

- `heritage_stories.videoUrl` field exists — a URL can be stored per story submission
- No video playback, upload, or tagging UI exists in the mobile or web app
- No video-to-place indexing beyond the story's `siteId`
- Object storage integration (existing platform feature) could support uploads

---

## Dependencies

- FSR-001 (Living Legacy Stories) — video is one attachment type for story submissions
- FSR-003 (Cultural Ambassador Program) — Ambassador features are a video type
- Object storage integration (existing)
- Heritage Sites re-enabled

---

## Related Existing Features

- `heritage_stories.videoUrl` (lib/db/src/schema/heritage-stories.ts)
- Object storage (existing platform feature)
- KinfolkAI Voice Feature (existing TTS — separate from video but related media infrastructure)

---

## Privacy Considerations

- Contributors may choose to submit video anonymously (no face/name required)
- Videos of identifiable individuals require consent from those individuals
- Elder contributors may need assisted submission pathways (not all are mobile-native)

## Safety Considerations

- All community-submitted videos require moderation review before public display
- Content depicting trauma, violence, or sensitive historical events must be handled with content warnings
- Videos of children require parental consent

## Moderation Considerations

- Moderation queue for video submissions must include preview playback
- Cultural sensitivity review — not just standard content policy — required for historical content
- Archival footage may have rights attached; upload flow must prompt for rights confirmation

## Accessibility Considerations

- All videos must support captions or transcripts
- Audio description for visually significant content
- Videos must not autoplay (user must initiate)

## Legal and Policy Considerations

- Archival photographs and footage may be under copyright — platform must not display without rights confirmation
- Platform should not claim ownership of community-submitted video content
- Licensing terms must be clear at time of submission (platform license to display vs. contributor ownership)

---

## Open Questions

- Should place-linked videos be part of a member's public profile, or only visible within the heritage site context?
- What is the maximum video length and file size for community submissions?
- Should professional archival organizations (museums, universities) be able to upload verified archival footage directly?

## Founder Decisions Required

- Confirm: should place-linked videos eventually be accessible without a platform account (public-facing heritage archive)?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-001 (Living Legacy Stories — video is an attachment type)
- FSR-003 (Cultural Ambassador Program — Ambassador feature videos)
- FSR-006 (Real-Time Cultural Presence — recent videos appear in presence feed)
