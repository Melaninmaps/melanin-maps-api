# FSR-009 — Disputed and Incomplete Content Handling

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-009 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Disputed and Incomplete Content Handling for Heritage Content |
| **Product Area** | Heritage / Moderation / Trust |
| **Status** | PROPOSED |
| **Priority** | Medium |
| **Proposed Phase** | Post-launch, Phase 2 |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

Community-submitted historical content will sometimes be disputed, incomplete, or based on oral tradition rather than documented records. This is not a failure — it is a feature of living cultural memory. The platform must be able to represent this complexity honestly, without either suppressing disputed content or presenting it as verified fact.

---

## Full Suggestion

Content labels for heritage stories and place profiles:
- **Verified** — confirmed against a named, credible source
- **Community-sourced** — submitted by community members, not independently verified
- **Oral tradition** — based on oral history that may not have documentary confirmation
- **Disputed** — the claim is contested by another community member or source
- **Incomplete** — key information is missing but the record has cultural value
- **Awaiting sources** — contributor has been asked to provide supporting information

Dispute workflow:
- Any member can flag a story or historical claim as disputed
- The flag triggers a review — it does not immediately remove the content
- Both the original contribution and the dispute are preserved
- The platform does not adjudicate the dispute — it labels it and presents both perspectives
- Corrections may be submitted by the original contributor or another member
- The dispute is resolved when a moderator updates the status, not automatically

Preservation rule:
- No content is silently deleted because it is disputed
- Prior wording is preserved as historical reference even when a newer version is accepted
- Superseded claims show the prior version with a note about what changed and why

---

## User Benefit

Members see an honest representation of what is known, what is remembered, and what is debated about a heritage place. They are not misled by unverified content presented as fact, nor are they robbed of community memory because it cannot be formally verified.

---

## Community and Cultural Purpose

African American, Indigenous, and immigrant community histories are disproportionately under-documented in official archives. Many facts of cultural importance exist only in oral tradition or community memory. A platform that treats "unverified" as equivalent to "worthless" reproduces the same institutional erasure those communities have faced. This feature preserves community knowledge while being honest about its evidentiary status.

---

## Current Implementation Status

**PROPOSED.** No dispute or incomplete content infrastructure exists for heritage content.

The `heritage_stories` table has a `status` field (pending/approved/rejected) but no dispute or incomplete label. The `cultural_sites` table has no dispute mechanism.

---

## Dependencies

- FSR-001 (Living Legacy Stories — dispute applies to story submissions)
- FSR-008 (Living Legacy Nominations — dispute applies to nomination content)
- Admin moderation panel

---

## Related Existing Features

- Content reports (existing — general platform reporting)
- `heritage_stories.status` (partial — approved/rejected but no dispute state)

---

## Privacy Considerations

- Dispute submissions must not expose the identity of the person whose account submitted the original content without their consent

## Safety Considerations

- Dispute mechanism must not be weaponized for harassment — rate limiting and review required
- Disputed content about living individuals must be prioritized for quick resolution

## Moderation Considerations

- Moderators need a clear workflow: receive dispute → review both claims → update status → notify parties
- "The platform does not adjudicate historical disputes" must be stated explicitly in the UI and in policy

## Accessibility Considerations

- Content labels (Verified, Disputed, etc.) must be visually distinct and have accessible text equivalents

## Legal and Policy Considerations

- Disputed content that is defamatory must be removed immediately regardless of dispute status
- Platform's role as a passive host (Section 230) vs. an active content curator must be reviewed with legal counsel

---

## Open Questions

- Should dispute status be visible to all members or only to authenticated members?
- How long can a dispute remain unresolved before it is escalated?

## Founder Decisions Required

- Confirm: should the platform allow members to see the full dispute history (who flagged, when, what was said) or only the current status label?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-001 (Living Legacy Stories)
- FSR-008 (Living Legacy Nominations)
