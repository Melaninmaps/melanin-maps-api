# FSR-019 — Conversational Onboarding

| Field | Value |
|-------|-------|
| **ID** | FSR-019 |
| **Title** | Conversational Onboarding — Belonging, Values, Contribution, Goals |
| **Area** | Onboarding / Community Member Experience |
| **Status** | NEEDS FOUNDER CLARIFICATION |
| **Source** | Advisor strategic review — July 26, 2026 |
| **Authorization required** | "Please implement." |

---

## The Idea

Onboarding should become a conversation, not a survey. The current 5-screen onboarding (Welcome, Safety, Travel, Identity, Join) asks who you are. The proposed onboarding also asks:

- What are you hoping to find?
- What matters to you?
- How would you like to contribute?
- What are your goals?

Each answer tells KinfolkAI how to help.

---

## Current Onboarding (5 Screens)

| Screen | Content |
|--------|---------|
| Welcome | "Map Your Life. Connect Deeper. Live With Purpose." |
| Safety | Community safety scores |
| Travel | KinfolkAI itineraries |
| Identity | 10 business designation preferences (who to support) |
| Join | Create Account / Login / Waitlist |

**Current gap:** Onboarding asks who you want to support but not what you're hoping to find, how you want to contribute, or where you're trying to go.

---

## Proposed Onboarding Structure

### Screen: "What brings you here today?" (Belonging)

Single-select or multi-select:

- "I'm new here."
- "I'm looking for community."
- "I'm relocating."
- "I'm starting over."
- "I want to support minority-owned businesses."
- "I travel often."
- "I'm raising children."
- "I'm a student."
- "I'm building my business."
- "I'm retired."
- "I'm looking to give back."

---

### Screen: "What matters to you?" (Values)

Select up to 5:

Safety, Community, Food, Travel, History, Arts, Business, Faith, Education, Nightlife, Family, Accessibility, Sports, Wellness, Entrepreneurship, Mentorship, Volunteering, Culture, Hidden Gems

---

### Screen: "How would you like to contribute?" (Contribution)

Multi-select:

- Recommend great businesses
- Share local events
- Write reviews
- Share stories
- Volunteer
- Mentor
- Welcome newcomers
- Preserve history
- Support local businesses
- Become a Cultural Ambassador someday

---

### Screen: "What are your goals?" (Dreams)

Multi-select:

- Travel more
- Find community
- Support minority-owned businesses
- Relocate
- Grow my business
- Meet people
- Volunteer
- Learn local history
- Discover opportunities

---

## What This Enables

Each set of answers becomes input for KinfolkAI:
- Belonging answers → personalize the home screen and first-month experience
- Values answers → shape the discover feed and business results
- Contribution answers → surface opportunities to contribute, not just consume
- Goals answers → enable proactive KinfolkAI stewardship (FSR-024)

---

## Relationship to Existing Platform

- Replaces or extends the current identity screen (which asks who to support)
- Feeds the existing `user_preferences` table (which already has a jsonb column)
- Feeds the existing KinfolkAI personalization system (buildSystemPrompt)
- Enables FSR-024 (proactive opportunity notices)
- Enables FSR-025 (member goals and dreams system)

---

## Founder Decisions Required

1. Should the onboarding be redesigned as a 4-question conversational flow for Community Members?
2. Are these the right questions? Are there questions missing or questions that don't belong?
3. Should contribution intent ("How would you like to contribute?") appear in first-time onboarding, or after the member has been active for 30 days?
4. Should existing members be offered a re-onboarding option to answer these questions?

---

## Prior Wording Preserved

The advisor's exact framing (July 26, 2026):

> "I think onboarding should become much more conversational. Not a survey. A conversation."

> "Those answers tell Kinfolk how to help."

---

*Documented: July 26, 2026 — Status: NEEDS FOUNDER CLARIFICATION — No code changes made*
