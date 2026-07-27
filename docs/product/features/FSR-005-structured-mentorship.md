# FSR-005 — Structured Mentorship

| Field | Value |
|-------|-------|
| **Reference ID** | FSR-005 |
| **Date Recorded** | July 26, 2026 |
| **Feature Name** | Structured Mentorship |
| **Product Area** | Community / Opportunity / Safety |
| **Status** | PROPOSED |
| **Priority** | High |
| **Proposed Phase** | Post-launch, Phase 2 |
| **Approved for Implementation** | No |
| **Implemented** | No |

---

## Original Founder Intent

Mentorship should be structured rather than allowing unrestricted access to people. The platform should facilitate meaningful guidance connections while enforcing safety boundaries, age controls, consent, and privacy at every step.

---

## Full Suggestion

Mentor opt-in:
- Members choose to make themselves available as mentors
- They define areas of support (career, relocation, early-career, business, alumni, student)
- They specify availability and communication preferences
- They may require group mentoring before one-to-one access

Mentee experience:
- Members request guidance from a mentor through a structured intake (topic, context, goals)
- Group mentoring sessions available before private access is granted
- Communication boundaries enforced — no personal contact info shared

Safety controls:
- Age controls on all student-facing mentorship pathways
- Verified organizational or alumni affiliations when claimed
- Reporting and blocking tools available at all times
- No public display of personal contact information

Types of mentorship:
- Student mentorship (academic and early career)
- Early-career mentorship (first 1–5 years in profession)
- Business mentorship (for community business owners)
- Relocation guidance (moving to a new city, safety and community orientation)
- Alumni mentorship (HBCU-specific, see FSR-004)

---

## User Benefit

Members gain access to community wisdom from people who share their cultural context, without the risks of unstructured access to strangers. Mentors contribute meaningfully without becoming overwhelmed by direct messages.

---

## Community and Cultural Purpose

Culturally-specific mentorship is materially different from generic professional networking. A mentor who understands the experience of being a minority professional in a new city provides guidance that generic platforms cannot. This feature serves the platform's core mission of community support.

---

## Current Implementation Status

**PROPOSED.** The Opportunity Center (existing feature) has a `mentorship_profiles` table with fields for specialties, state, isRemote, sessionType, and calendlyUrl. This is the closest existing infrastructure. It was not built with the safety and structural requirements described here.

---

## Dependencies

- Platform messaging system
- Age verification controls (for student pathways)
- FSR-004 (Alumni Profiles — alumni mentorship is a specific use case)
- Community Guidance Rating system (existing) — may apply to mentorship content

---

## Related Existing Features

- `mentorship_profiles` table (Opportunity Center)
- `/api/mentorship` routes (Opportunity Center)
- Community Guidance Rating system (existing family safety controls)

---

## Privacy Considerations

- Mentor availability and areas of expertise are public within the platform
- Personal contact information (email, phone, social handles) is never displayed
- Mentorship communication stays within the platform
- Members can control their mentor profile visibility

## Safety Considerations

- Age controls required for any pathway connecting adults to students under 18
- Group mentoring gateway before private access is a safety requirement, not optional
- Reporting and blocking tools must be prominent and easy to use
- Platform must have a clear escalation path for safety reports involving mentorship interactions

## Moderation Considerations

- Mentor profiles require a review step before appearing in search results
- Reported mentors should be suspended from new connections pending review
- Mentorship communication logs may need to be retained for safety investigation purposes (must be disclosed in Terms of Service)

## Accessibility Considerations

- Mentorship request intake form must be fully accessible
- All communication tools must meet screen-reader standards

## Legal and Policy Considerations

- Platform is a facilitator, not a party to the mentorship relationship
- Terms of Service must clearly state platform's limited liability for mentorship outcomes
- Any paid mentorship must comply with applicable consumer protection regulations
- COPPA compliance required if students under 13 can access the platform

---

## Open Questions

- What is the maximum number of active mentees a mentor can have at once?
- Should mentorship be free, premium-gated, or available by mentor's choice?

## Founder Decisions Required

- Confirm: is group mentoring a hard requirement before 1:1 access, or can mentor opt out?
- Confirm: should mentorship be available to all members or Navigator/Trailblazer tier only?

---

## Source of Suggestion

Heritage Map audit and future-state session, July 26, 2026.

## Related Prompts and Specifications

- Heritage Map Audit (July 26, 2026)
- FSR-004 (Alumni Profiles — alumni mentorship use case)
