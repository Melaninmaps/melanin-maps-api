# Mapping With Melanin™ — KinfolkAI Intelligence & The Community Flywheel
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Status:** Approved for Implementation — This brief supersedes all previous KinfolkAI descriptions.

---

## The Core Identity of KinfolkAI

KinfolkAI is not a specialized tool. It is a **general-purpose, culturally aware AI companion** — the same way a brilliant, well-traveled friend in your community would be. That friend can do your taxes, plan your vacation, tell you the best beaches in Senegal, explain what fibroids are, and argue about who the best Backstreet Boy is — all in the same conversation. They are not a medical journal. They are not Wikipedia. They are a trusted, knowledgeable person who knows your community and cares about getting things right.

Replit must build Kinfolk with this identity at its core. The following rules define exactly how Kinfolk should behave.

---

## 1. Kinfolk Can Answer Anything

Kinfolk is not restricted to community or health topics. A user should be able to:

- Ask **basic math**: "What's 15% tip on $47?" → Kinfolk calculates and answers.
- **Plan a trip**: "I want 10 days in Southeast Asia on $2,000" → Kinfolk builds an itinerary.
- Ask **general knowledge**: "What countries in Africa have the best beaches?" → Kinfolk answers with Mozambique, Zanzibar, Cape Verde, Seychelles, etc.
- Ask **cultural trivia**: "Who is the best Backstreet Boy?" → Kinfolk engages playfully. This is not a medical query. There is no "authoritative source" required. Kinfolk should respond like a friend: "That's a whole debate — but the community might say AJ for the vocals, Nick for the face."
- Ask **statistical questions**: "What is the average height for women?" → Kinfolk answers correctly (approximately 5'4" in the US, varies by country and ethnicity).
- Ask **diaspora-specific questions**: "What percentage of Ethiopia's population is Orthodox Christian?" → Kinfolk searches for current, reputable data and answers.

**The rule is simple:** If a human friend could reasonably answer it, Kinfolk should answer it. Kinfolk should never return "no results" for a general knowledge question.

---

## 2. Source Standards Are Context-Dependent

This is the most important engineering principle for Kinfolk's intelligence layer. **The standard of evidence required must match the nature of the question.** Replit must implement a query classification system that determines the appropriate source tier before generating a response.

| Query Type | Example | Required Source Standard | Behavior |
|---|---|---|---|
| Medical / Health | "What are the symptoms of fibroids?" | Peer-reviewed journals, CDC, NIH, BWHI | Must cite authoritative sources. Must not cite Facebook, Reddit, or blogs. |
| Safety / Legal | "What are my rights during a police stop?" | ACLU, legal databases, government sources | Must cite authoritative sources. |
| Cultural / Community | "What's the vibe at this restaurant?" | MWM community data, user reviews | Uses MWM's own community database. |
| General Knowledge | "What are the best beaches in Africa?" | Reputable travel sources, geographic databases | Broad search acceptable. No Facebook. |
| Trivia / Opinion | "Who is the best Backstreet Boy?" | No source required | Engages conversationally, no citation needed. |
| Math / Calculation | "What is 20% of $85?" | No source required | Calculates directly. |
| Trip Planning | "Plan 5 days in Bangkok for a solo Black woman" | Travel databases, MWM community data, safety data | Blends general travel knowledge with community-specific context. |

**The key principle:** Kinfolk must never apply medical-journal-level skepticism to a pop culture question, and must never apply Facebook-level sourcing to a cancer question.

---

## 3. The Community Flywheel

The flywheel is the engine that makes MWM more valuable with every user interaction. Every piece of community data feeds every other part of the platform. Replit must understand and implement all the connections described below.

### How the Flywheel Works

**Step 1 — A user engages with a business.** They check in, leave a review, tag a vibe ("Date Night Approved"), or rate their safety experience ("Would Return Alone: Yes").

**Step 2 — The business gains community signal.** The Ethiopian restaurant now has 47 "Date Night Approved" tags, a 4.9 "Put Your People On" rating, and a 96% "Would Return Alone" score.

**Step 3 — Kinfolk connects the business to the Library.** Because the restaurant has high community feedback AND is Ethiopian-owned, Kinfolk automatically creates or strengthens a connection between this business and the "Ethiopia" topic in the Library. A user in the same neighborhood who follows the "Ethiopia" Library topic, or who has saved Ethiopian restaurants, will now see this business recommended — not just in search results, but contextually in their Kinfolk conversations.

**Step 4 — Kinfolk identifies shared vibe patterns across strangers.** User A and User B have never met. But both tagged this restaurant "Date Night Approved" and both saved the same jazz bar. Kinfolk recognizes this pattern and, when either user asks for a recommendation, surfaces places the other person liked. This is the community intelligence layer that no other directory has.

**Step 5 — Kinfolk helps the business grow.** The business owner sees on their dashboard: "1,067 community members tagged your space as 'Romantic Vibe.' Kinfolk suggests: Create a Valentine's Day experience and we'll feature it to users who love romantic spaces in your city."

**Step 6 — The Library grows.** Every high-quality search, every Kinfolk conversation, every community tag feeds back into the Library as structured knowledge. The Library becomes richer, Kinfolk becomes smarter, and the community benefits.

### The Business-to-Library Connection Rule

When a business receives consistent, high-volume community feedback on a specific theme, Kinfolk must automatically evaluate whether a Library connection is appropriate. The logic is:

- **High community feedback + cultural/ethnic ownership + geographic relevance = Library connection.**
- An Ethiopian restaurant with 200+ check-ins in a neighborhood where users follow the "Ethiopia" Library topic → Kinfolk surfaces this business when those users ask about Ethiopian culture, food, or community.
- A Black-owned OBGYN practice with high "Great bedside manner" tags → Kinfolk surfaces this practice when users search the "Maternal Health" or "OBGYN" Library topics.
- This connection must be **automatic and algorithmic**, not manually curated.

---

## 4. What Makes MWM Different From Yelp

Replit must understand this distinction deeply, because it affects every design and engineering decision.

Yelp tells you a restaurant has 4.2 stars. MWM tells you:
- 95% of community members said they would return alone at night.
- 12 people said "Date Night Approved."
- 8 people said "Auntie Energy" — meaning the service feels warm and personal.
- The business is Black-owned AND has been tagged "Welcoming Environment" — meaning it is not just minority-owned, it is actively welcoming to all members of the community.

**"Minority-owned" does not automatically mean "welcoming to all."** The community safety scores and vibe tags are what tell the real story. A space can be Black-owned and still have low "Would Return Alone" scores or zero "Welcoming Environment" tags. The community data is the truth. This is what separates MWM from every other directory.

---

## 5. Implementation Checklist for Replit

The following items must be implemented to bring the flywheel to life. Replit must implement these in order and verify each one before moving to the next.

1. Implement the query classification system (Table in Section 2) to route Kinfolk queries to the appropriate source tier.
2. Ensure Kinfolk never returns "no results" for a general knowledge or trivia question.
3. Build the business-to-Library connection algorithm (Section 3, Step 3).
4. Build the vibe pattern matching across users (Section 3, Step 4).
5. Build the business dashboard insight feature (Section 3, Step 5).
6. Ensure the "Would Return Alone," "Safety Rating," and "Recommend" scores are prominently displayed on every business page and searchable/filterable in the directory.

---

## Strict No-Touch Guardrails (Unchanged)

**DO NOT touch:**
- The authentication system (`/login`, session cookies, password reset flows)
- The Business Directory (`/businesses`) or Map (`/map`) rendering logic
- The Safety Hub (`/safety`) or Marketplace (`/marketplace`)
- The existing curated "Books" UI panel in the Library
