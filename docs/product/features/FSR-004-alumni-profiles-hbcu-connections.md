# FSR-004 — Alumni Profiles and HBCU Connections

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-004 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Alumni Profiles and HBCU Connections |
| **Product Area** | Heritage / HBCU / Community |
| **Status** | PROPOSED |
| **Priority** | High |
| **Proposed Phase** | Post-launch, Phase 2 Heritage expansion |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

HBCU alumni carry enormous cultural capital and community loyalty. The platform should let alumni identify their school and graduation year, connect with fellow alumni by city, profession, or mentorship interest, and find resources connected to their institution. Alumni chapters should be able to maintain a verified institutional presence.

---

## Full Suggestion

Alumni profile features:
- Members can add their HBCU affiliation and graduation year to their profile (private or public)
- Members can browse alumni from the same institution filtered by city, profession, or industry
- Alumni chapters can request a verified chapter profile linked to the HBCU heritage site
- Members can follow an institution and receive meaningful updates (events, news, community alerts)
- Alumni videos can be tagged by topic, decade, campus tradition, career path, or location (see FSR-007)

Connection features:
- Members can find other alumni available for informal career or relocation guidance
- Alumni can volunteer for office hours, campus visit support, or community events
- Students (current) can request guidance from alumni in specific fields
- Alumni-to-alumni and student-to-alumni matching based on shared geography, industry, or mentorship interest

Safety boundaries:
- All connections are opt-in
- No personal contact information is shared publicly
- Communication happens within the platform's messaging system, not via personal email or phone
- Age controls apply to all alumni-to-student interactions

---

## User Benefit

Alumni who move to a new city can find their Bison, Aggie, Rattler, or Spelman family immediately. Students gain access to a structured alumni network. The institution's cultural influence extends beyond graduation.

---

## Community and Cultural Purpose

HBCU alumni networks are among the most culturally loyal and economically engaged networks in the country. Giving them a home inside Mapping With Melanin™ directly serves the HBCU community and the broader diaspora while reinforcing the platform's role as infrastructure for cultural connection.

---

## Current Implementation Status

**PROPOSED.** No infrastructure exists yet.

The Opportunity Center (FSR-005 related) has partial mentorship infrastructure that may be relevant. The HBCU heritage sites (44 records) are fully seeded and ready to serve as the institutional anchor.

---

## Dependencies

- Heritage Sites re-enabled
- FSR-005 (Structured Mentorship) — alumni mentorship is a subset of the broader mentorship system
- Platform messaging system (if connections communicate within the app)
- Member profile extension (HBCU affiliation fields)

---

## Related Existing Features

- HBCU heritage sites in `cultural_sites` table (44 records, all with verified data)
- Opportunity Center mentorship infrastructure (`mentorship_profiles` table, `/api/mentorship` routes)
- KinfolkAI (can leverage alumni affiliation data for personalized recommendations)

---

## Relevant Database Tables and Code

- `lib/db/src/schema/cultural-sites.ts` (HBCU records are the institutional anchor)
- `artifacts/api-server/src/routes/mentorship` (existing mentorship pattern to extend)

---

## Privacy Considerations

- Alumni affiliation and graduation year are optional and should default to private
- Members control visibility of their HBCU connection on their public profile
- Alumni directory browsing requires member authentication
- No personal contact information visible to other members

## Safety Considerations

- Student-alumni interactions require age verification controls
- All communication within platform messaging only — no external contact info shared
- Reporting and blocking tools must apply to all alumni connection features

## Moderation Considerations

- Alumni chapter profiles require verification before display
- Claims of alumni affiliation are self-declared — platform does not verify graduation records
- Clear disclaimer that affiliation is self-reported

## Accessibility Considerations

- Alumni directory must be screen-reader accessible
- Filter and search UI must meet WCAG 2.1 AA

## Legal and Policy Considerations

- Platform does not verify alumni status — display of alumni affiliation is member-asserted
- FERPA (Family Educational Rights and Privacy Act) does not apply to the platform, but messaging must not imply academic record access
- Alumni chapter profiles are community presences, not official institutional accounts unless explicitly verified with the institution

---

## Open Questions

- Should graduation year be displayed publicly or only used for matching?
- Should alumni chapters be able to post content under their institutional identity?
- How would current students be identified separately from alumni?

## Founder Decisions Required

- Confirm: should HBCU affiliation extend to other institutional types (HBCUs only, or also PWI Black alumni chapters, HBCU graduate programs, etc.)?
- Confirm: is direct member-to-member messaging part of this feature, or does it route through KinfolkAI or the community feed?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-005 (Structured Mentorship — alumni mentorship is a key use case)
- FSR-007 (Place-Linked Videos — alumni video stories tagged to HBCU sites)
