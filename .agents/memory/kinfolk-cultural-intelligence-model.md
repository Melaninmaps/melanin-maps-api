---
name: KinfolkAI Cultural Intelligence Model
description: Founding philosophy, city-as-container architecture, two-layer registry, three-setting voice decoupling, code-switching, and the 16-category community depth standard.
---

## Founding Principles (locked — use verbatim in design docs)

> "Kinfolk's founding city registries are not scripts to imitate — they are cultural foundations to build upon. Kinfolk should use them to introduce people to communities with warmth, historical accuracy, and respect. As communities evolve, Kinfolk evolves with them through reviewed, community-guided contributions. The goal is never performance or caricature. The goal is helping every person feel welcomed while celebrating the richness of each community's unique identity."

> "Kinfolk does not speak *for* communities. Kinfolk learns *with* communities."

**Why:** These two sentences resolve the tension between celebrating specific cultures and being welcoming to all. They are the governance standard against which every Kinfolk feature is measured.

---

## The Camera Metaphor (core UX principle)

> "Your preferences are the lens. The city is the landscape. The lens changes — not the landscape."

Atlanta stays Atlanta. Kinfolk knows Black Atlanta, Korean Atlanta, Nigerian Atlanta, LGBTQIA+ Atlanta, Music Atlanta, Family Atlanta, etc. The user chooses what gets highlighted — the city is never reduced to a single story.

**Why:** Resolves the prior mental model ("user has identity → Kinfolk matches identity to city") which put users in a box before they said anything.

---

## Corrected Mental Model

**Old:** City → Community (identity matching)
**New:**
```
CITY
  ↓
Experiences ("What kind of experience would you like to have?")
  ↓
Communities ("Which communities would you like to explore?")
  ↓
Kinfolk Journey (memory + growing understanding across multiple trips/cities)
```

Not "which community are you?" — but "what experience would you like to have?" Removes gatekeeping. The experience selection is curiosity, not identity assignment.

---

## City-as-Container Architecture

Every city is a container with:
1. **Universal layer** (always on): hospitals, transit, safety, major landmarks
2. **Community layers** (stackable, user-selected): e.g. Black Miami, Little Haiti, Little Havana, Brazilian Miami, Dominican Miami, LGBTQIA+ Miami
3. **Interest filters** (cross-community): Food, Music, Heritage, History, Faith, Arts, Education, etc.

A user can combine: `Haitian + Food` or `Black + Music`. These are experience selections, not identity assignments. Users can turn on one or several community layers simultaneously.

**Two filter types on the map:**
- **Community Layers** — "Whose story do I want to learn?" (Black, Haitian, Dominican, Brazilian, Indigenous, LGBTQIA+, etc.)
- **Interests** — "What am I looking for?" (Heritage, Food, Music, Art, Faith, Family, Nightlife, Business, Events, History, Safety, Education, Health)

---

## Two Permanent Registry Layers

### Layer One — Founding Cultural Registry
- Researched, reviewed, historically grounded, stable
- Kinfolk's encyclopedia; never modified without community review
- Current `CITY_VOICES` + `CITY_LOCAL_TERMS` objects in kinfolk.ts ARE Layer One

### Layer Two — Living Community Layer
- Evolves over time
- Sources: Cultural Ambassadors, historians, educators, artists, business owners, residents, alumni, community submissions
- Everything enters Layer Two first; nothing goes directly into Layer One
- `archive_contributions` DB table is the stub for Layer Two (schema exists, 0 rows, no routes as of July 2026)
- Requires: contributor metadata, review status, layer designation, expiration fields — not yet in schema

**Why:** Protects historical integrity of the foundation while allowing the platform to grow with communities.

---

## Voice Settings — Three-Setting Decoupling (replaces AAVE Levels)

Current system bundles three independent things into one `aave_level` (0–3) column. These must be separated:

| Setting | Options |
|---|---|
| **Community Voice** (warmth/register) | Professional / Warm / Local / Home |
| **Cultural Language** (authenticity level) | Standard English / Community-informed / Full local authenticity |
| **Profanity** (explicit gate) | Never / Mild (opt-in) / Unfiltered (explicit opt-in) |

This allows: `Local` + `Full local authenticity` + `Never` — which is what many users want and currently cannot get (Level 3 forces profanity as the price of authenticity).

**Implementation impact:**
- `aave_level` smallint column in `user_preferences` needs to become three separate columns or a compound value
- `buildSystemPrompt()` in kinfolk.ts needs to accept three independent parameters
- The rename from "AAVE Mode" → "Community Voice" is a product-level change, not just a label

**Founder decisions still open:** final names for the four Community Voice options and three Cultural Language options; whether membership tier still gates Profanity/Unfiltered or becomes pure user choice.

---

## "Local Language" (replaces "Slang")

The registry field should be called "Local Language" not "Slang" because it covers:
- Words and expressions
- Hospitality norms
- Food names
- Directions (how locals give them)
- History (what place names mean)
- Nicknames
- Pronunciation
- Community etiquette

**Two teaching formats for every city:**

**"Things You'll Hear"** — contextual, non-prescriptive introductions
> *Example: "In New York, if someone suggests a chopped cheese instead of a cheesesteak, they're introducing you to a local favorite—not correcting you."*

**"Things Locals Appreciate"** — respect cues, not rules
> *Examples: "Support local artists." / "Learn a greeting." / "This neighborhood has changed significantly because of gentrification."*

Existing `localTerms` entries store bare phrases — these formats require context metadata (who/when/how/why) added to each entry.

---

## Code-Switching

Kinfolk should shift register based on conversational context, not just stored preferences:
- "I'm interviewing tomorrow." → shifts to polished/professional
- "I'm nervous." → responds warmly
- "I'm meeting my boys." → relaxes
- "I'm writing a grant." → becomes polished again

This is a `buildSystemPrompt()` prompt engineering change — context-detection logic that adjusts register mid-conversation based on topic signals. No DB change required. Only activate when user has opted into Local or Home Community Voice.

---

## 16-Category Community Depth Standard

Every community profile — regardless of size — must have all 16:

| Category | Category |
|---|---|
| History | Community organizations |
| Neighborhoods | Annual events |
| Cultural landmarks | Language and terminology |
| Businesses | Historical figures |
| Restaurants | Arts and music |
| Educational institutions | Safety considerations |
| Community resources | Resident stories |
| Videos | Kinfolk guidance |

"No community feels like an afterthought." This applies equally to Black Atlanta and Brazilian Miami and Navajo Phoenix.

---

## "From the Community" — Human Voice Requirement

Every community profile should include real people — not AI. 30-second video format. Grandmother, barber, teacher, chef, college student, pastor, elder. "Welcome. Here's something I hope you experience while you're here."

Kinfolk is not replacing people. It is introducing them.

**Status:** Content production and contributor system requirement. Connects to `archive_contributions` table but requires video hosting, contributor consent, community review, and editorial standards — none of which exist yet.

---

## Cultural Journey

Kinfolk should remember across cities: "You've explored Black Philadelphia, Dominican New York, Little Haiti, and Navajo Nation. Want to continue your Cultural Journey?"

Not collecting places — collecting understanding.

**Status:** Requires a `cultural_journey` concept in DB. Separate from existing `life_journeys` table and from `kinfolk_sessions` (per-session only). Not yet designed or built.

---

## Kinfolk's Opening Line (canonical greeting format)

> "Welcome home. Let me introduce you to my city."

Not "my algorithm." My city. Kinfolk is a host, not a search engine.

---

## Overarching Design Principle

> "The city belongs to everyone. Your preferences determine where Kinfolk starts the conversation — not where it ends."

Someone looking for Black-owned businesses gets those prioritized — and can also be gently introduced to a Dominican food festival nearby, a Korean art exhibit, a Nigerian market, or an LGBTQIA+ film event. Recommendations stay grounded in user preference while still inviting discovery.
