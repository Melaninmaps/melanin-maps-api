# FSR-025 — Member Goals and Dreams System

| Field | Value |
|-------|-------|
| **ID** | FSR-025 |
| **Title** | Member Goals and Dreams — Where Are You Trying to Go? |
| **Area** | Member Experience / KinfolkAI |
| **Status** | NEEDS FOUNDER CLARIFICATION |
| **Source** | Advisor strategic review — July 26, 2026 |
| **Authorization required** | "Please implement." |

---

## The Idea

The platform knows where people are. It should also know where they're trying to go.

Capturing member goals and dreams transforms KinfolkAI from reactive to proactive. A member who has shared their dreams gives KinfolkAI the context to surface opportunities before the member knows to ask.

---

## The Advisor's Examples of Member Dreams

- "I'm building my first business."
- "I'm opening a restaurant."
- "I'm buying my first home."
- "I'm trying to relocate."
- "I'm trying to travel internationally."
- "I'm saving for college."
- "I'm looking for investors."
- "I want to become a Cultural Ambassador."
- "I want to mentor."
- "I want to build generational wealth."

---

## How This Transforms the Platform

Without dreams: A member searches for "business grants" when they think to look.

With dreams: KinfolkAI knows the member wants to start a business and surfaces grant deadlines, incubator events, mentor availability, and peer connections before the member thinks to ask.

Without dreams: A member who wants to become a Cultural Ambassador has no path visible to them.

With dreams: KinfolkAI can trace the path ("Here's what Cultural Ambassadors do. Here's how other members became one. Here's a first step you could take this week.") and surface FSR-003 (Cultural Ambassador Program) directly.

---

## Six Legacy Dimensions

The advisor identified six categories of legacy people build. These could become the top-level dreams categories:

- Business (building a business or empire)
- Family (providing for and strengthening family)
- Community (strengthening a neighborhood or community)
- Culture (preserving and passing on cultural heritage)
- Education (learning and teaching)
- Travel (experiencing and documenting the world)
- Philanthropy (giving back and funding others)

---

## Relationship to Existing Platform

The platform currently has:
- `life_journeys` table — tracks travel and location milestones
- `user_preferences` table — stores lifestyle and preference data
- `lifestyleServices` jsonb column — stores lifestyle preferences

What does not exist:
- A goals or dreams field on the user record
- KinfolkAI awareness of member aspirations
- A member-facing "My Goals" section

---

## Relationship to Other FSR Entries

- FSR-019 (Conversational Onboarding) — Goals is one of the four onboarding question categories
- FSR-018 (KinfolkAI as Intelligence Layer) — Goals feed the intelligence layer
- FSR-020 (Life Stages) — Goals may trigger life stage transitions
- FSR-024 (KinfolkAI Stewardship) — Goals are the context for proactive notices

---

## Founder Decisions Required

1. Should goals/dreams be captured during onboarding (FSR-019), after signup, or both?
2. Should goals be a fixed list (select from options), free text, or both?
3. Should goals be visible on the member profile, or private to the member and KinfolkAI?
4. Should members be able to update their goals as they evolve? (A member who achieved "relocate" may now have "grow my business.")
5. Should goal achievement be celebrated — e.g., "You said you wanted to relocate. It looks like you've settled in DC. Congratulations. What's next?"

---

## Prior Wording Preserved

The advisor's exact framing (July 26, 2026):

> "The platform knows where people are. It should also know: Where are you trying to go?"

> "Now Kinfolk becomes proactive."

> "What legacy are you trying to build? That changes recommendations dramatically."

---

*Documented: July 26, 2026 — Status: NEEDS FOUNDER CLARIFICATION — No code changes made*
