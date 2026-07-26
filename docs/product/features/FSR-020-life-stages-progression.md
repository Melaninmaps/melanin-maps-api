# FSR-020 — Life Stages Progression System

| Field | Value |
|-------|-------|
| **ID** | FSR-020 |
| **Title** | Life Stages — KinfolkAI Evolves Alongside the Member |
| **Area** | KinfolkAI / Member Experience |
| **Status** | NEEDS FOUNDER CLARIFICATION |
| **Source** | Advisor strategic review — July 26, 2026 |
| **Authorization required** | "Please implement." |

---

## The Idea

People don't stay the same. KinfolkAI should evolve alongside them.

The advisor's proposed life stage progression:

Student → Graduate → Young Professional → Entrepreneur → Business Owner → Employer → Mentor → Community Leader

Each stage carries different needs, different resources, different connections, and different opportunities. KinfolkAI should understand where a member is in this arc and what they need next.

---

## Relationship to Existing Platform

The platform already has:
- `life_journeys` table (built) — tracks destinations and milestones
- `entity_connections` table (built) — connects places, businesses, and journeys
- `isBusinessOwner`, `isContentCreator`, `isCommunityOrganizer` flags on users (built)
- `industry`, `jobTitle` fields on users (built)

What does not exist:
- A life stage field on the user record
- KinfolkAI awareness of life stage transitions
- Proactive support for life stage transitions ("You mentioned you're growing your business — here are three resources for employers")
- A member-visible life stage indicator

---

## Life Stage Examples

| Stage | What KinfolkAI might surface |
|-------|------------------------------|
| Student | HBCU events, internships, study spaces, student discounts |
| Graduate | Entry-level opportunities, professional networks, relocation support |
| Young Professional | Career resources, professional organizations, mentors |
| Entrepreneur | Grants, incubators, suppliers, chamber organizations |
| Business Owner | Hiring, marketing, community partnerships, business mentors |
| Employer | Workforce resources, HR networks, community investment opportunities |
| Mentor | Mentee connections, speaking opportunities, Cultural Ambassador path |
| Community Leader | Legacy opportunities, institutional partnerships, FSR-001 Living Legacy Stories |

---

## Relationship to Progression Levels

Life Stages are separate from but connected to the Community Member progression:
- Progression levels = platform contribution (Community Member → Cultural Ambassador)
- Life stages = member's life situation (Student → Community Leader)

A person can be a Community Leader in their real life while still being a new Community Member on the platform, or vice versa.

---

## Founder Decisions Required

1. Should life stage be a member-set field, inferred from activity, or both?
2. Should KinfolkAI acknowledge life stage transitions — e.g., "It looks like you've recently started a business. Want me to adjust what I surface for you?"
3. Should the life stage progression be visible to the member on their profile?
4. Is this list of stages the right one, or should it be expanded, simplified, or made non-linear?

---

## Prior Wording Preserved

The advisor's exact framing (July 26, 2026):

> "People don't stay the same. Kinfolk should evolve. [...] Kinfolk should evolve alongside them."

---

*Documented: July 26, 2026 — Status: NEEDS FOUNDER CLARIFICATION — No code changes made*
