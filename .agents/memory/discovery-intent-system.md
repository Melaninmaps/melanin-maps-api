---
name: Discovery Intent & Mood Filter System
description: Approved product architecture for the 14-layer discovery intent system. "What are you in the mood for?" entry point built on map page. Full spec in attached_assets.
---

# Discovery Intent & Mood Filter System

## Source of Truth
Full spec: `attached_assets/Pasted-Yes-this-makes-complete-sense-and-it-identifies-an-impo_1786177415434.txt`

## 14 Architecture Layers (approved, not all built)
1. Business / Place Category — what is this place?
2. Cultural / Experience Vibes — how does it FEEL? (131 canonical vibes — DO NOT simplify)
3. Discovery Intent — why is the user searching RIGHT NOW?
4. Atmosphere / Energy — what energy do they want?
5. Audience — All Ages / Family Friendly / Teens Welcome / Adults 18+ / Adults 21+ / Unknown (objective metadata, not a Vibe)
6. Crowd / Life-Stage Fit — Grown Folks / Mature Crowd / Young Adult Energy / etc. (experience matching, NOT exclusion)
7. Price Range — $ / $$ / $$$ / $$$$ + Budget Friendly / Everyday / Moderate / Treat Yourself / Splurge / Luxury
8. Travel Experience / Trip Mood — Relaxing / Adventurous / Romantic / Cultural Immersion / etc.
9. KinfolkAI Contextual Intelligence — intent interpretation from authorized context (future/planned)
10. Combined filters — all layers work together simultaneously
11. UX — "What are you in the mood for?" entry point, then deeper filters underneath
12. Business Data Entry — OWNER / COMMUNITY / SYSTEM DERIVED / AI INFERRED / MULTI-SOURCE fields
13. Professional Services — separate endorsement/trust framework, NOT Vibe terminology
14. CRITICAL PRINCIPLE — "Where should I go for the experience I want, with the people I'm with, at the price I want to spend, where I will feel comfortable?"

## Built (map page mood rail)
- 8 mood chips on map sidebar: Romantic · Chill · Turn Up · Grown Folks · Family Time · Culture · Live Music · Eat Good
- `matchesMood()` in map.tsx: maps each mood → category + keyword logic on live business data
- Mood state layers on top of existing search + category filters (all work together)
- Clear button appears when mood is active
- Position: between search bar and category chips in sidebar

## NOT YET BUILT (future phases)
- Price range as a filterable field in API + UI
- Audience field as filterable in discovery (only exists as business metadata)
- Atmosphere / Energy filter layer
- Crowd / Life-Stage Fit signals
- Travel mood / trip intent (KinfolkAI preferences partially exist)
- Combined multi-layer filter panel (deeper filters below mood chips)
- KinfolkAI contextual intelligence using life events / anniversaries
- Natural language intent search

## Critical Rules (permanent)
- DO NOT treat all discovery descriptors as one generic "Vibes" list
- DO NOT force professional services (lawyers, doctors, etc.) into Vibe terminology — use THE REAL endorsement framework
- DO NOT remove culturally meaningful language because two terms are semantically similar
- DO NOT make the language corporate
- Audience is OBJECTIVE BUSINESS METADATA — not a Vibe
- A parent searching with children must not accidentally receive a 21+ recommendation

**Why:** This is the intended product experience — answering "Where should I go for the experience I want, with the people I'm with, at the price I want to spend, where I will feel comfortable?" not just "what businesses are near me?"
