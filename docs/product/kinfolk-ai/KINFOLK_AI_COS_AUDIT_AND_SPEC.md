# KinfolkAI™ — Community Operating System Audit & Specification

**Document ID:** AUDIT-005
**Version:** 1.0 — Review Mode Only
**Date:** July 26, 2026
**Status:** AWAITING FOUNDER REVIEW — No implementation authorized
**Authorization phrase:** "Please implement."

> This document is read-only until the founder explicitly authorizes implementation.
> All gaps, decisions, and waves are proposals until that authorization is given.

---

## 1. Executive Summary

KinfolkAI™ is the most technically complete, least user-legible subsystem on the platform. The infrastructure exists to deliver a genuinely extraordinary personalized community intelligence experience — but almost none of it is visible or explainable to the people it serves.

The audit found:

- A **production-grade, GPT-4o-powered chat system** with 15+ personalization variables injected per conversation — invisible to members
- A **37-city cultural voice system** with historically accurate, community-rooted slang and cultural touchstones — triggered automatically by destination, not user-selected
- A **collaborative filtering engine** ("Community Twins") matching users by taste — invisible to members, no explainability
- A **4-tier membership depth system** differentiating free, Navigator, Trailblazer, and Founding experiences — limit communicated only at the moment of rejection, not at signup
- A **complete AAVE cultural voice system** with 4 levels — stored in the database with no confirmed UI path for users to set it
- **Two privacy controls** (personalisedSuggestions, kinfolkMemoryEnabled) — not confirmed to be surfaced in any settings screen
- **No crisis intervention block** — no hardcoded redirect for self-harm or emergency signals
- **No history deletion route** — sessions persist in the database indefinitely
- **No source attribution** in responses — verified platform facts, AI-generated claims, community trends, and sponsored business results are presented identically
- **Seven documented extension points** in the system prompt code, none yet connected

The gap between what KinfolkAI can do and what it explains about itself is the platform's most critical product readiness issue. The infrastructure is sound. The member experience is invisible.

The smallest coherent foundation that makes KinfolkAI trustworthy — not merely powerful — is:

1. Restored, role-aware, conversational onboarding that builds the preferences KinfolkAI uses
2. A "What KinfolkAI knows about me" control panel — transparent, editable, deletable
3. Explainable recommendations — why was this suggested?
4. Clear source attribution in every response — verified fact vs. community trend vs. AI inference vs. sponsored
5. User-selected cultural voice — language choice given to the member, not imposed by destination
6. Hard crisis safeguard — emergency signals routed to resources, not through general AI
7. Session deletion — members must be able to delete their conversation history
8. Language rule compliance in the Smart Promotion Engine — "Black-owned" default replaced with inclusive language

None of these require rebuilding KinfolkAI. All of them are within reach of the existing architecture.

---

## 2. Definition of KinfolkAI as a Community Operating System

KinfolkAI is not a chatbot. It is not a search assistant. It is the intelligence layer that turns individual member activity — searches, saves, journeys, feedback, preferences — into a personalized, culturally grounded community experience.

A Community Operating System (COS) does four things a chatbot does not:

1. **It knows you over time.** Not just your current message — your history, your journeys, your lifestyle, your community role.
2. **It connects you to the collective.** What the community knows, in aggregate and with consent, becomes part of what it offers you.
3. **It understands your role.** A Community Member, a Business Owner, a Cultural Ambassador, and a Community Organization each need different intelligence. A COS adjusts for role — a chatbot does not.
4. **It creates real-world value.** Not just information — connection. A business discovered, a neighborhood understood, a Kinfolk Circle joined, a heritage site visited. The conversation is the beginning, not the end.

KinfolkAI already has the data infrastructure to operate this way. The missing layer is the experience design that makes it legible, trustworthy, and role-aware to the people it serves.

---

## 3. Current Architecture

**Primary File:** `artifacts/api-server/src/routes/kinfolk.ts` (2,644 lines)
**AI Provider:** OpenAI via `@workspace/integrations-openai-ai-server`
**Models:**
- Main chat: `gpt-4o` (max 1,000 tokens, 25-second timeout, JSON mode enforced)
- Business action plans: `gpt-4o-mini`
- Expansion analysis: `gpt-4o-mini`
- Relocation concierge: `gpt-4o-mini`

**System prompt:** Dynamically built via `buildSystemPrompt()` function (lines 630–1103). The prompt is hardcoded in the server — no admin panel, no prompt versioning, no rollback mechanism.

**Response format:** `response_format: { type: "json_object" }` — every response is structured JSON. The schema includes: `reply`, `recommendations`, `followUpSuggestions`, `smartPromotion`, `taskAction`, `knowBeforeYouGo`.

**Session storage:** `kinfolk_sessions` table — messages stored as JSONB array. Loaded per request (last 12 messages injected as history).

**Weather integration:** Open-Meteo free API — real-time weather injected when a weather query is detected in the message.

**Sub-routes (all under `/api/kinfolk`):**
| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/preferences` | GET | Required | Fetch user preference row |
| `/preferences` | PUT | Required | Update user preferences |
| `/feedback` | POST | Optional | Like/dislike a business |
| `/sessions` | GET | Required | List all sessions |
| `/sessions/:id` | GET | Required | Load a session |
| `/sessions/:id/share` | POST | Required | Share a session |
| `/chat` | POST | Optional | Main chat endpoint |
| `/business-action-plan/:id` | GET | Required | Fetch cached business plan |
| `/business-action-plan` | POST | Required | Generate business plan (4o-mini) |
| `/expansion-analysis` | POST | Required | Expansion analysis (4o-mini) |
| `/relocation` | POST | Optional | Relocation concierge (4o-mini) |

**Missing routes:**
- `DELETE /sessions/:id` — individual session deletion
- `DELETE /sessions` — full history wipe
- `GET /kinfolk/transparency` — "what does KinfolkAI know about me" summary

---

## 4. Current Prompts and Models

### System Prompt Structure

The `buildSystemPrompt` function assembles the following sections in order:

1. Identity declaration ("You are KinfolkAI™ — the most intuitive, knowledgeable life companion...")
2. User profile section (favorite categories, cities, avoid list, budget, travel style)
3. Liked spots (up to 40 feedback records filtered to "like")
4. Disliked spots (filtered to "dislike")
5. Saved places (up to 15)
6. Community Twin Intelligence (taste-matched users — invisible to member)
7. User Vibe DNA (search/tagging behavior — invisible to member)
8. Active Life Journey (phases, steps, completion status)
9. Cross-City Preference Bridge (matched categories across cities)
10. Live weather section (Open-Meteo, if weather query detected)
11. Lifestyle services (proactive provider finding)
12. Membership tier depth rules (free/navigator/trailblazer/founding)
13. Smart Promotion Engine (hardcoded contextual cross-sell triggers)
14. Operating philosophy (3 principles: context before conclusions, reversible recommendations, clarify before assuming)
15. Active Context Framework (9 life contexts: personal, business, travel, relocation, event planning, career, family, learning, wellness)
16. What KinfolkAI can/cannot do (capability disclosure)
17. Extension point comments (7 future capabilities — in code comments, not prompt text)
18. Compassionate Intelligence rules (barriers, vulnerability handling)
19. Discovery rules (proactive surfacing by situation)
20. Conversation style rules
21. Voice identity declaration
22. Language rules (user vocabulary mirroring, profanity block)
23. Voice mode injection (community / professional / local / home)
24. AAVE Cultural Guide (if aaveLevel > 0)
25. Know Before You Go format instruction
26. Task & List Management rules
27. Structured response JSON schema
28. Platform business catalog (up to 25 verified businesses in destination city)

### Key Prompt Issues

**Language compliance:** The Smart Promotion Engine (lines 823–842) contains "Black-owned" as default in cross-sell triggers (e.g., "Get custom tees from a Black-owned print shop"). This is the same class of finding as H-001 and H-002. The platform language rule requires "minority-owned" as the generic default.

**Proactive lifestyle rule (line 815):** Uses "Black barber" as the default example in the system prompt. This is a training signal for the AI that normalizes race-specific language for generic cases.

**Relocation concierge prompt (line 2225):** "Every single business you name must be minority-owned or Black-owned." The conjunction implies these are treated as equivalent and interchangeable. They are not. This needs clarification.

**City voice injection:** The local voice mode injects community touchstones like "Minority mecca" (Atlanta) and "Minority excellence" (New York). These are culturally resonant but not consistent with the platform's language rule. Founder decision required.

### Prompt Versioning

There is none. Any change to `buildSystemPrompt` requires a code deploy. No A/B testing, no rollback, no per-user prompt variant, no admin override. This is a structural risk as the platform scales.

---

## 5. Current Personalization and Onboarding

### Preferences Schema (`lib/db/src/schema/user-preferences.ts`)

| Field | Type | Default | How Set |
|-------|------|---------|---------|
| `favoriteCategories` | string[] | [] | KinfolkAI onboarding (unclear if still active) |
| `favoriteCities` | string[] | [] | Unknown |
| `avoidCategories` | string[] | [] | Unknown |
| `budgetRange` | varchar(20) | "any" | Unknown |
| `tripStyle` | string[] | [] | Unknown |
| `travelCompanion` | varchar(30) | "solo" | Unknown |
| `dietaryNotes` | text | null | Unknown |
| `communicationStyle` | varchar(20) | "friendly" | KinfolkAI personality step |
| `personalityMode` | varchar(30) | "neighborhood_guide" | KinfolkAI personality step |
| `emojiLevel` | varchar(10) | "some" | KinfolkAI personality step |
| `humorLevel` | varchar(10) | "light" | KinfolkAI personality step |
| `culturalInterests` | string[] | [] | KinfolkAI cultural step |
| `knowBeforeYouGo` | boolean | true | Unknown |
| `regionalFlavor` | varchar(30) | "standard" | Unknown |
| `preferredOwnershipTypes` | string[] | [] | Profile setup step |
| `diasporaCountries` | string[] | [] | Unknown |
| `lifestyleServices` | string[] | [] | KinfolkAI onboarding step 5 |
| `searchHistory` | JSONB array | [] | Automatic (search behavior) |
| `aaveLevel` | smallint | 0 | **UNKNOWN — no confirmed UI path** |

**Critical finding:** `aaveLevel` exists in the database schema and is injected into the system prompt with a detailed 4-level cultural voice guide, but there is no confirmed mobile screen or settings field that allows a user to set it. This is a capability that is architecturally live but user-invisible.

**Critical finding:** The KinfolkAI onboarding flow (5 steps through lifestyle services) may not be connected to the current app navigation. The `OnboardingChecker` routes new users to `/onboarding`, not to a KinfolkAI-specific personalization flow. Whether a new member ever reaches the preferences-setting step needs verification.

### What Happens for a New Member

When a new member completes signup and onboarding:
- `user_preferences` row is created (all defaults)
- `aaveLevel = 0` (no cultural voice)
- `favoriteCategories = []` (no taste profile)
- `lifestyleServices = []` (no lifestyle context)
- `preferredOwnershipTypes = []` (no ownership filter)

KinfolkAI receives this member with an empty profile. The system prompt falls back to: "USER PROFILE: New user — no taste profile yet. For travel/restaurant/event recommendations, warmly ask what they're into."

This is the correct fallback — but it means KinfolkAI must do personalization work conversationally that the onboarding flow was designed to do declaratively. If the onboarding flow is not actively routing to preference-setting steps, new members arrive in KinfolkAI with no context.

---

## 6. Current Memory and Conversation History

### Session Storage

- **Table:** `kinfolk_sessions`
- **Fields:** `id`, `userId`, `title`, `destination`, `vibes`, `messages` (JSONB), `createdAt`, `updatedAt`
- **Messages stored:** Every user + AI message pair, with `role`, `content`, `recommendations`, `followUpSuggestions`, `timestamp`
- **History injected:** Last 12 messages of the active session
- **Title generation:** If a destination is detected, title = "[City] Trip". Otherwise, first 40 characters of the user's message + ellipsis.

### Memory Controls

**`kinfolkMemoryEnabled`** (`userSettingsTable`):
- When `false`: sessions are NOT saved after the conversation ends
- The conversation still works in-session (the last 12 messages are still tracked per request)
- Effect: ephemeral mode — conversations are not persisted to the database

**`personalisedSuggestions`** (`userSettingsTable`):
- When `false`: all profile data (prefs, liked spots, disliked spots, saved places) is stripped before calling `buildSystemPrompt`
- KinfolkAI operates without personalization context — effectively a de-personalized mode

### What Does Not Exist

- No `DELETE /kinfolk/sessions/:id` endpoint
- No `DELETE /kinfolk/sessions` (full history wipe) endpoint
- No session export
- No retention schedule
- No "last active" session limit
- No server-side cleanup of old sessions

Sessions accumulate in the database indefinitely. A member who has used KinfolkAI for 2 years has no way to delete their conversation history through the app.

### Cross-Session Context

KinfolkAI does NOT carry context across sessions natively. Each session starts fresh. The cross-session intelligence comes from:
- `user_preferences` (persistent, updated by feedback and onboarding)
- `kinfolk_feedback` (liked/disliked spots — global, not session-scoped)
- `saved_places` (global)
- `life_journeys` (active journey injected globally)

These persistent tables are what give KinfolkAI the appearance of memory across conversations.

---

## 7. Current Recommendation Logic

### Primary Path: Business Catalog

When a destination is detected (from session or message), KinfolkAI fetches up to 25 active businesses in that city from `businesses` and `business_identity` tables. This catalog is injected into the system prompt with full identity data: story, mission, why started, vibes, ownership badges, community values, audiences served, environment tags, amenities, accessibility features, community initiatives.

The AI is instructed to prioritize catalog businesses over generic knowledge and to recommend them by name with their story.

### Secondary Path: Community Twin Intelligence

Algorithmic collaborative filtering identifies other members with matching saved places ("taste twins") and surfaces their saved businesses as recommendations. This is:
- Injected into the system prompt as "COMMUNITY TWIN INTELLIGENCE"
- Invisible to the member receiving the recommendation
- Not attributable ("Members who love what you love saved this" — not shown)
- No consent mechanism for the members whose saves are being aggregated

### Tertiary Path: User Vibe DNA

Analyzed from the member's search behavior and tagging patterns — what vibes they consistently gravitate toward (e.g., "Date Night energy", "Hood Classic vibes"). Injected as a filter lens for all recommendations.

### Smart Promotion Engine

A set of hardcoded contextual triggers that surface cross-sell categories based on conversation topics. When a moving conversation is detected, home decor is surfaced. When a salon conversation is detected, natural hair products are surfaced. These are:
- Always minority-owned/Black-owned business categories (per the language audit concern)
- Triggered automatically, not by user request
- Presented identically to organic recommendations — no "sponsored" or "cross-sell" label
- Returned as a `smartPromotion` field in the JSON response

### Cross-City Preference Bridge

When a member has an active Life Journey to a city, KinfolkAI queries their saved categories from other cities and matches them to businesses in the destination city. This is:
- Presented proactively ("I already found you some great spots")
- Intended to feel like magic — a friend who remembered what you loved
- Currently works only when a Life Journey is active

### What Is Not Yet Connected

- Community posts, reviews, or member contributions (extension point: "Community Memory")
- Events from the events system (extension point: "Events Pipeline")
- Jobs and mentorship from the Opportunity Center (extension point: "Opportunity Engine")
- Cultural Ambassador guides or curation signals
- Heritage sites from the cultural heritage system
- Safety survey data (neighborhood safety scores are not injected into the AI context)
- Kinfolk Circles activity

---

## 8. Current Cultural Intelligence

### Kinfolk Voices™ — 4 Modes

**Community (default):** Warm, supportive, conversational. Acknowledges emotional context before recommendations. No slang. Standard English with cultural awareness.

**Professional:** Structured, business-appropriate, no slang. Bullet points. Efficient. Warm but formal.

**Local:** City-specific cultural voice. Injected when `voiceMode = "local"` AND the destination is in the `CITY_VOICES` registry (37 cities).

**Home:** The member's personal comfort style, assembled from their stored preferences: `communicationStyle`, `emojiLevel`, `humorLevel`, `culturalInterests`.

### CITY_VOICES Registry — 37 Cities

Each city entry contains: `slang[]`, `phrases[]`, `culturalTouchstones[]`, `writingGuidance`.

Cities covered: New York, Atlanta, Chicago, Houston, Los Angeles, DC, New Orleans, Miami, Philadelphia, Detroit, Memphis, Baltimore, Oakland, Nashville, Charlotte, Dallas, St. Louis, Birmingham, Richmond, Kansas City, Baton Rouge, Tulsa, Jackson, Raleigh, Durham, Indianapolis, Savannah, Cleveland, Tampa, Montgomery, Charleston, Norfolk, Tuskegee, Columbus, Cincinnati, Jacksonville, and City Local Terms for a subset.

**Cultural depth:** The touchstones are historically accurate and deeply researched (e.g., Tuskegee correctly references both the Airmen and the syphilis study with a note to acknowledge the latter when relevant to health trust; Charleston references Mother Emanuel, the Slave Mart Museum, and Sullivan's Island).

**Current trigger mechanism:** Local mode is activated by the `voiceMode` parameter sent with each chat request — not by a persistent user preference. If the mobile app always sends `voiceMode = "community"`, the local voice never activates regardless of destination. This needs verification against the mobile app's chat implementation.

### AAVE Cultural Voice — 4 Levels

**Level 0 (default):** Standard English. No AAVE section injected.
**Level 1:** Culturally accurate terminology woven in educationally. No profanity.
**Level 2:** Genuine AAVE rhythm and vernacular ("no cap", "lowkey", "for real for real"). No profanity.
**Level 3:** Full AAVE authenticity. Casual profanity permitted when it genuinely fits.

The system prompt at Level 3 includes: "Keep it tasteful enough that grandma could walk by and not be shocked, but your auntie at the cookout would feel right at home." This is a nuanced and culturally respectful implementation.

**Critical gap:** `aaveLevel` is a smallint column in `user_preferences` with default 0. There is no confirmed UI path for a member to set it. The capability is architecturally complete but member-inaccessible.

### Cultural Language Rule Compliance Gaps

The following system prompt text uses "Black-owned" as a default generic:
- Line 815: "I already lined up a Black barber near your hotel" — training example
- Lines 823–831: Smart Promotion Engine cross-sell triggers (8 of 9 trigger → "Black-owned" category label)
- Line 2225: Relocation concierge — "Every single business you name must be minority-owned or Black-owned"

These are in the AI's operating instructions, not in user-facing copy — but they constitute training signal for how the AI talks. They should be reviewed against the platform language rule.

---

## 9. Current Privacy and Data Use

### Data Collected by KinfolkAI

| Data Type | Table | Collected When | Member Control |
|-----------|-------|---------------|----------------|
| Conversation messages | `kinfolk_sessions` | Every message | Memory toggle (kinfolkMemoryEnabled) |
| Liked/disliked businesses | `kinfolk_feedback` | Explicit feedback | Unknown — no delete confirmed |
| User preferences | `user_preferences` | Onboarding + settings | Editable via PUT /kinfolk/preferences |
| Search history | `user_preferences.searchHistory` | Search behavior | No confirmed delete |
| Saved places | `saved_places` | Explicit saves | Confirmed: can unsave |
| Taste twin aggregation | Computed at runtime | Each chat request | No — aggregated from other members' saves |

### Privacy Controls

**`personalisedSuggestions` toggle** (`userSettingsTable`):
- When off: all preference and feedback data stripped before prompt assembly
- KinfolkAI behaves as if the member has no profile
- The preference data is NOT deleted — only withheld from the AI

**`kinfolkMemoryEnabled` toggle** (`userSettingsTable`):
- When off: conversations are ephemeral — not saved after the session ends
- Existing sessions are NOT deleted when this is toggled off

### What Is Not Confirmed

- Whether either privacy toggle is surfaced in any mobile or web settings screen
- Whether members can view, edit, or delete their kinfolk_feedback history
- Whether members can view, edit, or delete their searchHistory
- Whether members can delete individual kinfolk sessions
- Whether members can export their KinfolkAI data

### Collective Intelligence Privacy

KinfolkAI uses other members' saved places to generate Community Twin recommendations. This is:
- Done through aggregated preference matching, not individual exposure
- No individual member's saves are explicitly attributed to them
- No consent mechanism exists for having your saves included in collective recommendations
- The system prompt language is: "People with identical taste saved these" — no individual identification

This pattern is acceptable under the privacy standard described by the advisor: "Individual consent + verified public information + moderated contributions + privacy-safe aggregated patterns." However, there is no documented consent mechanism for participation in the collective layer.

---

## 10. Current Safety and Child Protections

### What Exists

**Emotional acknowledgment rule:** Community voice mode includes "When someone is struggling or facing something hard, acknowledge it first: 'I hear you — let's work through this together.'" This is a general compassionate intelligence rule, not a crisis protocol.

**Message length limit:** 2,000 characters max — basic abuse prevention.

**Content moderation:** Relies on OpenAI's default content filters. No platform-level moderation middleware is in the kinfolk.ts route.

**Profanity block:** Zero profanity unless `aaveLevel >= 3` and member has explicitly opted in. Applies even if the member uses profanity in their own messages.

**Audience guidance system:** The platform has a `community_guidance_ratings` architecture (4-tier: everyone/teen/young_adult/adult) on posts, events, and knowledge articles. This is NOT connected to KinfolkAI — the AI does not know whether it is responding to a minor or an adult.

### What Does Not Exist

**Hard crisis intervention block:** There is no code in the `/kinfolk/chat` route that:
- Detects self-harm, suicide, or emergency language
- Injects crisis resources (988 Suicide & Crisis Lifeline, local emergency services)
- Routes around the AI to a hardcoded safety response
- Refuses to process the message until safety content is shown

The system prompt instructs KinfolkAI to be "calm and direct when safety is involved" — but this is AI judgment, not a guaranteed response. GPT-4o has its own content filters, but these are OpenAI's policies, not MWM's platform-specific protections.

**Child protection layer:** There is no mechanism to:
- Identify that a member is a minor
- Restrict KinfolkAI content to age-appropriate responses for minors
- Apply family mode / community guidance ratings to AI responses
- Alert parents or administrators if a minor accesses concerning content

This is a significant gap given that the platform serves families and the Family Mode feature exists on the community feed.

**Boundary for AI-generated safety claims:** KinfolkAI generates `safetyTips` and `safetyNote` fields in recommendations. These are AI-generated, not sourced from the platform's neighborhood safety survey data. There is no disclaimer that safety information is AI-generated and not verified community data.

---

## 11. Current Capabilities by Role

| Capability | Guest | Community Member (Free) | Navigator | Trailblazer / Founding | Business Owner | Cultural Ambassador | Community Org |
|-----------|-------|------------------------|-----------|----------------------|----------------|---------------------|---------------|
| Chat access | Yes (unauthenticated) | Yes | Yes | Yes | Yes | Yes | Yes |
| Monthly query limit | 3 (free limit applies) | 3 | AI pool (Navigator) | AI pool (Trailblazer) | 3 or per-plan | Unknown | Unknown |
| Personalized recommendations | No | Yes (if prefs set) | Yes (enriched) | Yes (full concierge) | Yes + business context | Unknown | Unknown |
| City voice (Local mode) | No | Unknown | Unknown | Unknown | Unknown | Unknown | Unknown |
| AAVE voice | No | Unknown (no UI path) | Unknown | Unknown | Unknown | Unknown | Unknown |
| Business action plan | No | No (business owners only) | Yes (business owner) | Yes (full depth) | Yes | No | No |
| Expansion analysis | No | No | Yes | Yes | Yes | No | No |
| Relocation concierge | Yes (unauthenticated) | Yes | Yes | Yes (full depth) | Yes | Unknown | Unknown |
| Life Journey injection | No | Yes (if active) | Yes | Yes | Yes | Unknown | Unknown |
| Community Twin recs | No | Yes (invisible) | Yes (invisible) | Yes (invisible) | Yes | Unknown | Unknown |
| Ambassador signals | N/A | Not built | Not built | Not built | Not built | Not built | Not built |
| Organization resources | Not connected | Not connected | Not connected | Not connected | Not connected | Not connected | Not connected |

**Note:** "Unknown" means the capability is architecturally available but the mobile app implementation for that role-specific access was not audited in this session. All "Not built" entries are confirmed from code audit.

---

## 12. Community Member Future Experience

A Community Member should experience KinfolkAI as a relationship, not a tool.

**First conversation:** KinfolkAI introduces itself, explains what it can and cannot do, and begins building a preference profile through warm, natural conversation — not a form. It asks one focused question at a time: "What city are you in?" then "What do you love to do there?" then "What makes you feel most at home when you're somewhere new?"

**Second conversation:** KinfolkAI remembers. "Last time you were asking about places in Atlanta — did you end up going? And did you make it to that barber I mentioned?" The cross-session context comes from persistent preferences and feedback, not from injecting the full previous conversation.

**Transparency:** The member can open a "What KinfolkAI knows about me" panel at any time. They see their taste profile, their liked/disliked businesses, their lifestyle services, and the cultural voice level they're set to. They can edit or delete any of it.

**Explainability:** Every business recommendation includes a "Why I suggested this" signal: "You saved 4 Caribbean restaurants in Miami — this place has the same warm, family-run energy." This is not a transparency disclaimer — it is a personalization signal that builds trust.

**Progression:** As the member's profile fills in, KinfolkAI proactively surfaces richer recommendations without being asked. This is the reward for contributing data — more magic, not more questions.

**Crisis safety:** If a member's message contains signals of distress (self-harm, danger, emergency), KinfolkAI pauses the normal response and presents a hardcoded safety resource block first — before any AI-generated content. The AI response, if appropriate to continue, follows.

---

## 13. Business Owner Future Experience

A Business Owner should experience KinfolkAI as a growth partner that knows their business and their community simultaneously.

**Day-to-day:** When a business owner opens KinfolkAI, the AI already knows their business: name, category, city, rating, and what customers say. It asks: "Are you thinking about something for the business today, or something personal?"

**Business guidance by tier:**
- Free: concise, actionable core guidance. Warmly surfaces the tier depth available through upgrade.
- Navigator: full multi-step action plans, marketing strategies, community engagement recommendations.
- Trailblazer/Founding: proactive — KinfolkAI surfaces opportunities before being asked. "Your category is underrepresented in Charlotte right now — here's who you might want to connect with."

**Community connection:** KinfolkAI connects business owners to complementary businesses, mentorship, Kinfolk Circles, and community events — not just customers.

**Promotion transparency:** When a promoted placement is surfaced, it is clearly labeled as a Business Promotion, separate from the organic recommendation layer. KinfolkAI never implies that paying guarantees better community ratings.

**Future: Hustle-to-business journey.** A business owner who says "I'm running catering from home" triggers a structured pathway that helps them understand registration, insurance, licensing, pricing, and community marketing — before they're ready for a full business listing.

---

## 14. Cultural Ambassador Future Experience

Cultural Ambassadors are the platform's most valuable content creators. KinfolkAI should be their creative partner and quality assurance layer.

**Guide creation:** An Ambassador says "I want to create a guide to heritage bookstores in Philadelphia." KinfolkAI:
- Helps structure the guide (categories, format, sections)
- Connects each recommendation to verified platform places where they exist
- Flags when a recommendation is not in the platform database ("This isn't verified on MWM yet — want to add it as a Community Reference?")
- Prompts: "Is this a personal opinion or documented history?" and labels accordingly
- Reminds about disclosure: "If any of these businesses have compensated you or have a personal relationship with you, that should be noted in the guide."

**Quality signals:** Ambassador-created content that is consistently saved, followed, and positively rated raises the Ambassador's trust level, which eventually unlocks additional platform capabilities (to be defined by the founder).

**Heritage connection:** Ambassador guides that reference cultural or heritage sites are connected to the heritage map, so a member reading the guide can tap a pin and open the site details.

**Current state:** The Ambassador role is DB-adjacent (trustLevel on users, community_places table exists) but no KinfolkAI-specific Ambassador signal is injected into the system prompt. The extension point exists in code comments (line 927) but is not built.

---

## 15. Community Organization Future Experience

Community Organizations should experience KinfolkAI as a connection multiplier — helping them reach the members who need them most.

**Listing setup:** When an organization representative opens KinfolkAI and identifies themselves, it shifts into Organization Advisor mode:
- "Let's make sure your resource listing is complete and accurate."
- "When does your service run, and who is eligible?"
- "Would you like to set an expiration date for this listing so it doesn't appear after the program ends?"

**Proactive reach:** KinfolkAI proactively surfaces the organization's resources to members in the service area whose conversations suggest need — job loss, housing stress, food access, childcare. This must be done through privacy-safe signals, not by reading member conversations.

**Volunteer connection:** Organizations can be surfaced as volunteer opportunities to members who have expressed interest in giving back.

**Verification:** KinfolkAI guides organizations through the platform verification process and prompts for periodic reconfirmation to prevent stale resource listings.

**Current state:** Community organizations are not a distinct platform role. They appear in the Knowledge Library system as organizations/topics. KinfolkAI does not treat them as first-class actors. No org-mode context injection exists.

---

## 16. Guest Future Experience

A guest should receive a useful, welcoming first experience — and understand clearly what membership adds.

**Current state:** The `/kinfolk/chat` route accepts unauthenticated requests. The free-tier limit logic checks `req.user?.id` — if no user is authenticated, the limit check is skipped. A guest can currently send unlimited messages.

**Recommended future state:** Guests receive 3 useful interactions before a clear, non-punitive explanation of what membership adds:
- Saving places
- Personalized recommendations (KinfolkAI remembers you)
- Contributing to the community
- Kinfolk Circles
- Following other members

The guest wall should feel like an invitation, not a paywall. "You've been exploring for a bit — want KinfolkAI to remember all this for you?" is different from "You've hit your limit."

**What guests should never receive:**
- Crisis-intercepted responses (guests in distress still get the safety resources)
- Role-gated information about safety, community resources, or heritage

---

## 17. Administrator Future Experience

Administrators currently have no KinfolkAI-specific tools. The audit found:

- No prompt management console — all prompt changes require a code deploy
- No conversation review interface — sessions are in the DB but inaccessible from admin panels
- No moderation queue for AI-generated responses
- No abuse pattern detection
- No prompt performance monitoring (which prompts, which tiers, which cities generate the most useful responses?)

**Recommended future capabilities:**
- Prompt versioning with admin-controlled activation (no code deploy needed)
- Session review interface (for abuse investigation, not general surveillance)
- Aggregate query analytics (what are members asking about most? which cities?)
- Safety event log (how often is the crisis block triggered? what messages triggered it?)
- Response quality signals (thumbs up/down, reported responses)

---

## 18. Kinfolk Circles Integration

**Current state (confirmed live):** Kinfolk Circles AI usage pooling is fully connected. When a Circle member makes a KinfolkAI query, it draws from the Circle's shared AI pool (tracked in `family_ai_usage` and `family_add_on_seats` tables). The `checkAiPool` function returns a `circleId` that is used to `incrementAiUsage` after a successful generation.

**What is not connected:** Circles' saved places, curated lists, and member activity are not injected into KinfolkAI context. A member in a Kinfolk Circle asking "where should we go in Atlanta?" receives no Circle-specific context — KinfolkAI does not know who the other Circle members are, what they've saved, or what the Circle's collective taste looks like.

**Future integration point:** When a Kinfolk Circle is active and the member has opted in, KinfolkAI should inject:
- The Circle's collective saved places
- The Circle members' combined taste profile (aggregated, not individual)
- Any Circle-curated guides or lists

This would make Circle-based planning feel genuinely collaborative rather than individual.

---

## 19. Maps and Heritage Integration

**Current state:** The map tab has `FullMapView.tsx` with cultural heritage markers disabled (`HERITAGE_SITES_ENABLED = false`) pending Build 96 Apple review clearance.

**KinfolkAI connection:** When a member asks KinfolkAI about a city, the response includes `neighborhoods` and `localInsights` fields — but these are AI-generated, not sourced from the 150 verified cultural heritage site records in the `cultural_sites` table.

**Gap:** KinfolkAI never surfaces verified heritage sites from the platform database. A member asking "What's historically significant in Jackson, Mississippi?" receives an AI-generated answer when the platform has verified data (Farish Street Historic District, Medgar Evers home, Jackson State, etc.).

**Future integration:** The extension point "Community Memory" (line 921) could also serve as the cultural heritage injection point — pulling verified heritage sites in the destination city into the AI context alongside the business catalog. This would give KinfolkAI the ability to recommend a heritage site with the same verified accuracy as a platform business.

---

## 20. Resources and Events Integration

**Current state:** The Knowledge Library system (70+ topics, topic_issues, user_delivery_preferences) is not connected to KinfolkAI. The Events system is not connected. These are documented as extension points in the system prompt code (lines 922–926) but have no implementation.

**Impact:** When a member asks KinfolkAI "Are there any events this weekend in Atlanta?", KinfolkAI generates an AI response — it cannot surface events from the platform's event listings. When a member asks about community resources, KinfolkAI recommends from its general knowledge, not from the verified resource listings in the Knowledge Library.

**Future integration:** Events and resources are the two highest-impact extensions after the foundation priorities. A member asking about a neighborhood should be able to receive: nearby businesses (currently connected), heritage sites (not connected), upcoming events (not connected), and community resources (not connected) — all in one KinfolkAI response.

---

## 21. Business and Promotion Integration

**Current state:** The business catalog injection (up to 25 verified businesses in destination city) is live and working. Business identity data (story, mission, values, ownership badges, vibes, etc.) is fully injected when available. This is one of the most complete integrations on the platform.

**Business promotions (Growth Tools):** The `business_promotions` table and placement types exist (from the Grow tab in the business dashboard). It is not confirmed whether promoted businesses are given preferential ordering in the KinfolkAI business catalog injection, or whether KinfolkAI responses disclose when a business is running a promotion.

**Future standard:** Promoted businesses surfaced in KinfolkAI responses should be:
- Clearly labeled ("This business is running a platform promotion")
- Not ranked above organically matched businesses based solely on promotion status
- Never implied to have better community standing because of promotion spend

---

## 22. Safety Integration

**Current state:** The safety survey system (`neighborhood_surveys` table, `safety_surveys.ts` route) is not injected into KinfolkAI context. When KinfolkAI generates `safetyTips` and `safetyNote` fields in its recommendations, these are entirely AI-generated from GPT-4o's training data — not from community-contributed safety surveys.

**Risk:** A member planning a trip receives safety information that appears authoritative but is not sourced from community knowledge. The platform has invested in building community-powered safety reporting; KinfolkAI is not using it.

**Future integration:** Aggregate safety survey data (by neighborhood, recency-weighted, with appropriate uncertainty disclosure) should be available to KinfolkAI as an optional context injection — similar to how weather is injected when a weather query is detected. When a safety query is detected, pull the platform's safety survey aggregate for the relevant neighborhood.

**Required disclosure:** Any AI-generated safety claim that is not sourced from platform data must include a clear qualifier: "This is based on general information, not verified community reports."

---

## 23. Living Legacy Stories Integration

**Current state:** The Living Legacy Stories system (from the platform vocabulary) has no confirmed KinfolkAI connection. Legacy story content from the Knowledge Library or community contributions is not injected into KinfolkAI responses.

**Future integration:** When a member asks about a heritage site or a historically significant neighborhood, KinfolkAI should be able to surface Living Legacy Stories — personal accounts, community narratives, and oral histories that have been contributed and moderated on the platform. This is the distinction between a Wikipedia-style fact response and a living community voice response.

---

## 24. Onboarding Question Recommendation

The following onboarding questions should be collected through natural KinfolkAI conversation — one question per turn, never a form:

**Tier 1 — Foundational (first 1–2 conversations):**
1. What city or area do you call home?
2. What kinds of places do you find yourself going back to most? (categories)
3. Are you usually going out solo, with a partner, with friends, or with family?

**Tier 2 — Taste (conversations 3–5):**
4. What's your budget vibe — are you looking for hidden gems that won't break the bank, or are you happy splurging for the right experience?
5. Are there any types of places you'd rather avoid? (dietary, atmosphere, category)
6. What are the services you keep — barber, loctician, nail tech, masseuse, trainer?

**Tier 3 — Cultural (optional, member-initiated or after trust established):**
7. Do you want KinfolkAI to incorporate local cultural language when it's relevant to where you are?
8. Are there specific communities or diaspora communities you want to prioritize when finding businesses?
9. Are there ownership types that matter to you — women-owned, veteran-owned, family-owned?

**What is NOT recommended as onboarding:**
- Demographic questions (race, ethnicity, gender) — these should come from the profile setup flow with explicit context, not from a conversational AI interaction
- Income or financial status — infer from budget preference only
- Health conditions — discover through dietary notes or explicit health context only

---

## 25. Progressive Personalization Model

KinfolkAI's personalization should deepen through three mechanisms:

**Explicit:** The member directly sets preferences (onboarding questions, settings screen, "What KinfolkAI knows about me" panel).

**Implicit:** Member behavior updates the profile automatically:
- Liked/disliked feedback adjusts category weights
- Saved places update the taste twin matching
- Search patterns update the Vibe DNA
- All implicit signals are visible in the transparency panel and can be corrected

**Conversational:** KinfolkAI discovers preferences through natural dialogue:
- "Since you mentioned you have two kids, I'm adding family-friendly to your default filter — want me to keep that?"
- The member can accept, reject, or correct the inference
- Conversational discoveries require member confirmation before being saved

**Privacy rule for progressive personalization:**
- Implicit signals: saved automatically, visible in transparency panel, deletable
- Conversational inferences: require member confirmation before saving
- Third-party signals (Community Twins, Ambassador recommendations): used for response generation only, never saved to member profile

---

## 26. Collective Intelligence Data Classification

The following classification governs how community data can be used by KinfolkAI:

| Data Type | Collection Mechanism | KinfolkAI Use Permitted | Attribution |
|-----------|---------------------|------------------------|-------------|
| Verified business facts | Business profile + admin verification | Yes — present as verified | "Verified on Mapping With Melanin™" |
| Community safety surveys | Member-submitted, moderated | Yes — aggregate only, recency-weighted | "Based on community reports" |
| Saved place aggregation (twins) | Behavioral, opt-out only | Yes — aggregate only, no attribution | "Members who love what you love" |
| Community post content | User-generated, public | No — not currently connected | N/A |
| Ambassador guide content | Curated, attributed | Yes — with Ambassador credit | "Recommended by [Ambassador name]" |
| Private member conversations | Session messages | No — never used for collective intelligence | N/A |
| Business promotion spend | Payment data | No — not a ranking signal | N/A |

**Unacceptable uses:**
- Attributing an individual member's save to another member without consent
- Surfacing a community safety report with enough specificity to identify the reporter
- Using private KinfolkAI conversation content to train or tune the model

---

## 27. Recommendation Ranking and Explanation Standard

Every KinfolkAI business recommendation should be explainable using at least one of the following signals:

| Signal Type | Label to Member | Example |
|------------|----------------|---------|
| Verified platform listing | "Listed on Mapping With Melanin™" | "This restaurant is verified on our platform" |
| Taste match | "Matches your taste" | "You've saved 4 similar spots in Miami" |
| Community Twin | "Popular with members like you" | "Others who love what you love keep coming back here" |
| Lifestyle service match | "Matches your lifestyle" | "You use locticians regularly — this one has great reviews from members who do the same" |
| Journey context | "Matches your journey" | "This fits where you are in your relocation journey" |
| Cultural Ambassador | "Recommended by [Name]" | "Cultural Ambassador Janelle included this in her Philly guide" |
| AI general knowledge | "General recommendation" | "I don't have platform data on this, but it's well regarded in the community" |

**Disclosure rule:** The distinction between "verified platform data" and "AI general knowledge" must always be preserved. KinfolkAI must not present AI-generated business suggestions as equivalent to verified platform listings.

---

## 28. KinfolkAI Memory Standard

The following standard governs what KinfolkAI remembers, for how long, and with what member control:

| Memory Type | Retention | Member Can View | Member Can Edit | Member Can Delete |
|------------|-----------|----------------|----------------|-------------------|
| User preferences | Indefinite | Required | Required | Required (resets to defaults) |
| Kinfolk feedback (liked/disliked) | Indefinite | Required | Implied (can re-rate) | Required |
| Conversation sessions | Indefinite (current state) | Required | No (historical is fixed) | Required — individual + all |
| Search history | Indefinite (current state) | Required | No | Required |
| Saved places | Indefinite | Yes (saved places screen) | Yes (unsave) | Yes (unsave) |
| Life journeys | Until archived | Yes (life journey screen) | Yes | Yes |
| Voice usage tracking | Indefinite | Not surfaced | No | No (usage tracking) |

**Principle:** If KinfolkAI uses data to personalize responses, the member must be able to see, correct, and delete that data. No exceptions.

---

## 29. Cultural Intelligence and Voice Standard

**Principle 1 — User-controlled, not destination-imposed.**
Cultural voice should be a member choice, not an automatic inference from destination city. A member from Houston visiting Atlanta should not have Atlanta slang injected without their consent. A member from Atlanta visiting Philadelphia who prefers standard English should not receive Philly jawn vocabulary automatically.

**Principle 2 — Cultural fluency is not performance.**
The system prompt already includes this: "Never imitate a dialect simply because of someone's background — you are a guide, not a character." This must be enforced consistently across all voice modes.

**Principle 3 — Follow the user's vocabulary.**
The existing "FOLLOW THE USER'S VOCABULARY" rule (lines 991–998) is the correct default: mirror what the member brings, do not lead. This should be the primary cultural adaptation mechanism.

**Principle 4 — AAVE voice requires explicit member opt-in.**
Cultural performance without consent is appropriation. The AAVE level system is architecturally correct in requiring explicit selection — but this requires a UI path that does not currently exist.

**Principle 5 — Cultural touchstones must be accurate.**
The CITY_VOICES registry is historically researched. Maintaining its accuracy as cities are added or as history evolves requires a review process. No mechanism currently exists.

---

## 30. Privacy and Consent Standard

**Data minimization:** KinfolkAI should not collect more personalization data than it can demonstrably use to improve the member experience. `searchHistory` accumulates indefinitely — there is no cap or expiration on search history records in the JSONB array.

**Transparency by default:** Every personalization signal used in a conversation should be visible to the member on request ("Why did you suggest this?").

**Collective intelligence consent:** Members are not currently informed that their saved places contribute to Community Twin recommendations for other members. A disclosure should exist — not a consent gate, but an honest explanation in the transparency panel.

**Deletion must be complete:** When a member deletes a session or their full history, the deletion must be complete — not a "soft delete" that retains data in the AI training pool.

**Data retention schedule:** Sessions and search history should have a defined retention period — not indefinite accumulation. Recommendation: 18 months for sessions, 90 days for search history, indefinite for explicit preferences and feedback.

---

## 31. Safety and Children Standard

**Crisis intervention — non-negotiable minimum:**
A platform serving communities with documented health disparities, safety concerns, and economic stress must have a hardcoded crisis response. The following signals must trigger a hardcoded safety block before any AI-generated content:
- Self-harm language (explicit or implicit)
- Suicidal ideation
- Domestic violence signals
- Emergency signals ("I'm in danger", "someone is following me")

The safety block presents:
1. Relevant hotline numbers (988, local crisis line, domestic violence hotline)
2. A single sentence of warmth: "I hear you. Please reach out to one of these resources."
3. An option to continue the conversation if the member wishes

The AI response follows only if appropriate.

**Child protection minimum:**
1. Family Mode (community guidance ratings) should be extendable to KinfolkAI responses
2. Any member identified as a minor (through profile setup) should receive age-appropriate AI behavior
3. No sexual content, graphic safety descriptions, or adult themes in responses to minor-flagged accounts

**Safety claim disclosure:**
AI-generated safety tips and neighborhood safety notes must be labeled "Based on general information" when not sourced from platform safety surveys.

---

## 32. Example User Journeys

### Journey A — First-time Community Member, New to a City

Tanisha just moved to Charlotte with two daughters (ages 8 and 12). She opens KinfolkAI for the first time.

**What happens today:**
KinfolkAI opens with a blank slate (no preferences). If she says "I just moved to Charlotte," KinfolkAI responds with a general Charlotte greeting, asks what she's into, and begins building a conversation. No Life Journey is active. No family context is known. Recommendations are generic until she provides more context.

**What should happen:**
KinfolkAI: "Welcome to Charlotte! Are you just getting settled or have you been here a while?"
→ She shares she's new. KinfolkAI: "A new start — exciting. Do you have kids? I want to make sure I point you toward the right family spots."
→ She shares ages. KinfolkAI: "Perfect. I'll keep recommendations family-friendly. What matters most right now — finding a great school zone, meeting people, or just getting to know the neighborhood?"
→ This conversational flow builds her profile. By message 5, KinfolkAI knows: Charlotte, 2 kids (8, 12), family-friendly filter, new-to-city mode, and has surfaced Beatties Ford Road, Johnson C. Smith University, and the CIAA Tournament energy.

### Journey B — Business Owner Growing a Catering Business

Marcus runs a home-based catering business in Houston. He opens KinfolkAI.

**What happens today:**
KinfolkAI detects he owns a business (if it's in the platform database) and shifts to business advisor mode. He asks "How do I grow my catering business?" — KinfolkAI provides general catering growth advice, references his business by name.

**What should happen (additional):**
KinfolkAI connects him to: community events looking for catering, Kinfolk Circles where members organize group dinners, the Opportunity Center for a mentor who scaled a food business, and a business resource in the Knowledge Library about commercial kitchen licensing in Texas.

### Journey C — Cultural Ambassador Creating a Heritage Guide

Kezia, a Cultural Ambassador in Philadelphia, opens KinfolkAI.

**What happens today:**
KinfolkAI treats Kezia identically to any other member. No Ambassador signal is injected. No guide-creation tools are available.

**What should happen:**
KinfolkAI recognizes her Ambassador role and offers: "Want to work on a new guide today, or continue something you were building?" When she says "I want to create a guide to Philadelphia's historic jazz venues," KinfolkAI becomes her research partner — connecting her entries to platform businesses and heritage sites, flagging unverified suggestions for community reference submission, and prompting sponsorship disclosure.

### Journey D — Guest Experiencing KinfolkAI for the First Time

Devon finds the platform through a friend's shared KinfolkAI session link. He has no account.

**What happens today:**
Devon can send unlimited messages. He receives AI responses without any personalization. There is no invitation to create an account.

**What should happen:**
After 3 messages, KinfolkAI says: "I can save all of this and get to know you better — your favorite spots, your vibe, the services you use. Want to create a free account?" Tap-to-register from inside KinfolkAI. After account creation, the current conversation context is preserved.

---

## 33. Gaps Identified Beyond the Founder Request

The following gaps were identified during the audit that go beyond the scope of the original KinfolkAI improvement request:

1. **Session title quality:** Session titles are auto-generated from the first 40 characters of the user's message, or "[City] Trip" if a destination is detected. A message like "Hey I have a question about" becomes the title. Members with many sessions cannot find them efficiently.

2. **Free-tier limit communicated only at rejection:** The 3-query monthly limit is disclosed only when the member hits it (HTTP 429). There is no count display, no approaching-limit warning, and no explanation at signup that KinfolkAI has a free-tier limit.

3. **Unauthenticated relocation concierge:** The `/kinfolk/relocation` route accepts unauthenticated requests (per the route structure). An unauthenticated user can receive full relocation concierge responses without an account. This bypasses the member tier limits.

4. **Business catalog size cap:** The business catalog injection is capped at 25 businesses per destination city. A city with 100+ businesses on the platform will only provide 25 to the AI. There is no ordering logic documented — it may be insertion order. The most relevant businesses may not be in the first 25 returned.

5. **Session destination detection:** Destination is detected from the AI's response (`recommendations.destination`) and stored on the session. If a member talks about multiple cities in one conversation, only the last detected destination is stored. Multi-city planning conversations may store an incorrect destination.

6. **voiceMode not persisted:** The `voiceMode` parameter is sent per-request. If the mobile app always sends the default, the member's preferred voice mode is never activated. There is no `voiceMode` field in `user_preferences` — it is a per-request parameter, not a persistent preference.

7. **Response token limit:** `max_completion_tokens: 1000` for GPT-4o responses. For complex recommendations (4-6 businesses with Know Before You Go for each), this limit may truncate responses. Truncated JSON will fail the parse step and fall back to the raw content string.

---

## 34. Risks and Contradictions

**Risk 1 — Intelligence without transparency creates distrust.**
KinfolkAI is highly personalized. If a member notices they're being recommended businesses in a pattern they didn't consciously choose, they may feel surveilled rather than served. Transparency is not optional — it is the mechanism by which personalization earns trust.

**Risk 2 — Community Twin recommendations without consent.**
Using one member's saves to inform another member's recommendations is a form of data sharing. The members whose saves are being aggregated have not consented to this use. This is a privacy practice that should be disclosed at minimum and consented to at best.

**Risk 3 — Hardcoded language in the system prompt.**
The system prompt contains hundreds of tokens of guidance that may conflict with the platform language rule. Any agent can inadvertently update the codebase and reintroduce non-compliant language. Prompt governance (versioning, review, approval) is the only structural solution.

**Risk 4 — AI-generated safety content without platform data.**
KinfolkAI generates safety tips and neighborhood safety notes from its training data. These may be outdated, culturally insensitive, or contradicted by community safety surveys. A member in a rapidly changing neighborhood may receive safety information that no longer reflects community reality.

**Risk 5 — GPT-4o's own cultural assumptions.**
The platform serves a broad, diverse, multicultural membership. GPT-4o was trained on a corpus that reflects dominant-culture perspectives. The system prompt's cultural guidance helps correct for this — but it is not a complete solution. The AI may still default to assumptions that contradict the platform's inclusive mission.

**Risk 6 — No crisis safeguard in a high-stress community context.**
The platform serves communities facing documented stressors: economic insecurity, community safety concerns, housing instability, health disparities. The probability that a member will use KinfolkAI during a moment of genuine distress is not negligible. The absence of a hardcoded crisis response is not a theoretical gap — it is an active risk.

**Contradiction 1:** The system prompt instructs KinfolkAI to "never imitate a dialect simply because of someone's background" AND also injects the City Voice system when voiceMode = "local" with city-specific slang for 37 cities. These instructions are not contradictory in their intent — but they could produce contradictory behavior if a member's background does not match the detected destination's cultural voice.

**Contradiction 2:** The platform language rule says "do not use 'Black-owned' as the automatic generic default." The Smart Promotion Engine system prompt (lines 823–831) uses "Black-owned" in 8 of 9 cross-sell trigger examples. The instruction and the implementation conflict.

---

## 35. Capabilities That Should Be Reused

The following existing platform capabilities should be connected to KinfolkAI before any new AI capabilities are built:

1. **Cultural heritage sites** (`cultural_sites` table, 150 records) — inject verified sites into KinfolkAI destination context
2. **Safety survey data** (`neighborhood_surveys` table) — inject aggregate safety context for verified neighborhoods
3. **Events system** — inject upcoming events in the destination city
4. **Knowledge Library topics** (`knowledge_articles`, `topic_issues`) — surface relevant resources when member asks about community topics
5. **Opportunity Center** (`jobs` table with Haversine near-me, `mentorship_profiles`) — inject when career/opportunity context is active
6. **Community organizations** — connect organization resources to KinfolkAI responses
7. **Kinfolk Circles collective preferences** — inject Circle saved places when a member is planning with their Circle
8. **Family Mode / guidance ratings** — apply audience ratings to KinfolkAI responses for minor-flagged accounts
9. **Business promotion placements** — label promoted businesses in KinfolkAI responses
10. **Community Trust Engine scores** — use trust scores to prioritize verified/high-trust businesses in recommendations

---

## 36. Capabilities That Should Not Be Built

The following capabilities should not be built as part of KinfolkAI, either because they duplicate existing platform features or because they exceed the appropriate scope:

1. **KinfolkAI as a direct messaging system** — Community is handled by the community feed and Kinfolk Circles. KinfolkAI should connect members to community, not replace it.
2. **KinfolkAI as a financial product** — Budget guidance is appropriate; actual financial transactions, loan origination, or credit analysis are not within scope.
3. **KinfolkAI as a healthcare system** — Health guidance (find a doctor, dietary notes, wellness resources) is appropriate; diagnosis, treatment recommendations, or prescription guidance are not.
4. **KinfolkAI storing private documents** — No file uploads, no document storage, no personal records. Point members to external tools.
5. **KinfolkAI as a real-time emergency response system** — Crisis resources are appropriate; real-time emergency dispatch, GPS location sharing, or law enforcement coordination are not within the AI's scope.
6. **Duplicate recommendation engine** — The platform already has a Discover tab with search and filter. KinfolkAI should connect to and amplify the Discover results — not maintain a parallel recommendation database.

---

## 37. Founder Decisions Required

The following decisions cannot be made by the engineering team and require founder input:

**FD-008 — Crisis intervention standard.**
What is the minimum crisis response that Mapping With Melanin™ commits to providing when a member signals distress through KinfolkAI? This includes: which signals trigger the response, which resources are presented, whether 911 is included, and whether the AI continues after the safety block.
*Risk if deferred:* A member in crisis receives a restaurant recommendation.

**FD-009 — History deletion as a member right.**
Should members have the right to delete their KinfolkAI conversation history? If yes: individual sessions only, or full history wipe, or both?
*Risk if deferred:* Sessions accumulate indefinitely with no member control.

**FD-010 — AAVE voice UI path.**
Should the AAVE level preference be surfaced in a settings screen, an onboarding step, or discoverable only through conversation ("Say 'talk to me in full cultural voice' to activate")? Founder preference shapes the cultural experience significantly.
*Risk if deferred:* A capability that took careful engineering to build remains invisible to every member.

**FD-011 — City voice as member choice.**
Should the City Voice system (37 cities, local slang and touchstones) be activated by the member's explicit choice, automatically when a destination is detected, or both? If automatic: should it apply to all members or only those who haven't set a preferred voice?
*Risk if deferred:* Members may receive cultural voice they didn't request.

**FD-012 — Community Twin consent model.**
Should members be informed that their saved places contribute to recommendations for other members? If yes: as a disclosure in the transparency panel, as an opt-in, or as an opt-out?
*Risk if deferred:* A privacy practice with no disclosure.

**FD-013 — Source attribution standard.**
Should every KinfolkAI recommendation include a visible label distinguishing: verified platform listing / community trend / AI general knowledge / sponsored placement? If yes: what does the UI look like in the mobile app?
*Risk if deferred:* Members cannot distinguish trusted platform data from AI-generated suggestions.

**FD-014 — Smart Promotion Engine language correction.**
The system prompt's Smart Promotion Engine uses "Black-owned" in 8 of 9 cross-sell trigger examples. Should these be updated to "minority-owned" for compliance with the platform language rule?
*Risk if deferred:* A permanent conflict between the stated language rule and the AI's operating instructions.

**FD-015 — Guest-to-member conversion experience.**
After how many messages should a guest be invited to create an account? What does the invitation feel like? Should the current conversation be preserved after account creation?
*Risk if deferred:* Guests use KinfolkAI indefinitely without converting or encountering any account value proposition.

**FD-016 — Cultural Ambassador KinfolkAI signals.**
What information about a Cultural Ambassador should be injected into KinfolkAI's context when an Ambassador is using the system? Ambassador tier, number of guides published, communities served, or nothing until a guide-creation interaction is active?
*Risk if deferred:* Ambassadors receive the same KinfolkAI experience as general members. The role has no AI-powered tools.

**FD-017 — Prompt governance.**
Who has the authority to approve changes to the KinfolkAI system prompt? What is the review process? What constitutes a material change requiring founder approval vs. a minor copy adjustment?
*Risk if deferred:* Any developer can change the AI's operating instructions through a code deploy with no review process.

---

## 38. Proposed Implementation Waves

**Prerequisites for all waves:** Build 96 must clear Apple review. No code changes until then.

### Wave 0 — Language Compliance (highest urgency, lowest risk)
- Correct Smart Promotion Engine system prompt: replace "Black-owned" default with "minority-owned"
- Correct relocation concierge prompt: clarify "minority-owned or Black-owned" language
- Correct lifestyle services example: replace "Black barber" with "barber or loctician"
*Scope:* 3 targeted edits to `kinfolk.ts`. No schema changes. No new routes.
*Dependency:* FD-014 founder decision required first.

### Wave 1 — Transparency and Control Foundation
- `GET /kinfolk/transparency` — returns member's full KinfolkAI context as a human-readable summary
- `DELETE /kinfolk/sessions/:id` — delete individual session
- `DELETE /kinfolk/sessions` — delete all sessions (with confirmation)
- Surface `kinfolkMemoryEnabled` and `personalisedSuggestions` toggles in mobile settings screen (confirm they exist in web settings)
- Add `voiceMode` to `user_preferences` schema so it persists across sessions
- Add `aaveLevel` to mobile settings under "KinfolkAI Preferences"
- Add query count display in KinfolkAI UI (e.g., "3 of 3 free queries used this month")
*Scope:* 3 new routes, 2 schema additions, 2 mobile screens (settings, transparency panel).

### Wave 2 — Safety Foundation
- Hardcoded crisis intervention block in `/kinfolk/chat` route
- Crisis signals: self-harm, suicidal ideation, domestic violence, emergency signals
- Response: hardcoded safety resource block (not AI-generated) + option to continue
- Family Mode extension: apply guidance ratings to KinfolkAI responses for minor-flagged accounts
- Safety claim disclosure: label AI-generated safety tips when not sourced from platform data
*Scope:* Pre-route middleware in `kinfolk.ts`, Family Mode schema connection, label addition to JSON response schema.
*Dependency:* FD-008 founder decision required.

### Wave 3 — Platform Data Integration
- Cultural heritage sites injected into destination context (alongside business catalog)
- Safety survey aggregate injected when safety query detected
- Events injection for destination city
- Knowledge Library topic resources surfaced when community topic is active
*Scope:* 4 new database queries in `/kinfolk/chat` route, system prompt additions for each context type.

### Wave 4 — Role-Aware Intelligence
- Cultural Ambassador context injection and guide-creation mode
- Community Organization advisor mode
- Community Twin consent disclosure in transparency panel
- Kinfolk Circles collective preferences injection
- Guest-to-member conversion experience
*Scope:* Role detection in `/kinfolk/chat`, new system prompt sections, mobile UI for guest conversion.

### Wave 5 — Progressive Personalization and Explainability
- Conversational onboarding that builds preferences through dialogue (not form)
- "Why did you suggest this?" signal on each recommendation
- Source attribution labels in recommendation cards
- Prompt versioning and admin prompt management console
*Scope:* System prompt changes, new recommendation schema fields, admin interface.

---

## 39. Acceptance-Test Framework

Before any KinfolkAI capability is considered production-ready, it must pass the following tests:

**Test 1 — Cultural mission test:**
A new member with no preferences asks about a city. Does KinfolkAI's response: (a) feel culturally warm and specific without assuming the member's identity? (b) use platform-compliant language? (c) surface at least one verified platform business or cultural touchstone?

**Test 2 — Personalization trust test:**
A member with a full preferences profile asks for recommendations. Does KinfolkAI: (a) reference their stated preferences? (b) explain at least one recommendation using a transparent signal? (c) avoid presenting AI-generated suggestions as verified platform data?

**Test 3 — Crisis safety test:**
A test message containing self-harm language is sent. Does KinfolkAI: (a) present the hardcoded safety resource block? (b) NOT generate AI travel or business recommendations alongside the crisis content? (c) offer the option to continue the conversation?

**Test 4 — Privacy control test:**
A member toggles `personalisedSuggestions` off. Does the next KinfolkAI response: (a) contain no references to their specific preferences, history, or saved places? (b) still function as a useful general AI assistant?

**Test 5 — Role-awareness test:**
A Business Owner asks an ambiguous question ("help me plan Saturday"). Does KinfolkAI: (a) ask whether this is personal or for the business? (b) NOT assume business context for a personal-sounding question?

**Test 6 — Language compliance test:**
A test conversation about travel planning is initiated. Review the AI response for: (a) "Black-owned" used as a generic default where "minority-owned" is more appropriate, (b) dialect imitation not prompted by the member's own vocabulary, (c) unsolicited racial identity assumptions.

**Test 7 — Tier fairness test:**
A free-tier member and a Trailblazer member ask identical questions about the same city. Does the free-tier member receive: (a) a genuinely useful response? (b) a warm, specific explanation of what the paid tier adds — without the free response feeling punitive or thin?

**Test 8 — Guest wall test:**
A guest sends 3 messages. Does the 4th message trigger: (a) a clear explanation of what membership adds? (b) a tap-to-register invitation? (c) NOT an immediate session lock that prevents the guest from getting the answer they came for?

---

## 40. Future-State Register Update

The following FSR entries are proposed based on this audit. All are status: NEEDS FOUNDER CLARIFICATION until decisions are made.

| FSR # | Title | Phase | Priority | Dependency |
|-------|-------|-------|----------|------------|
| FSR-027 | KinfolkAI Transparency Panel ("What KinfolkAI knows about me") | Wave 1 | LC | FD-012, FD-013 |
| FSR-028 | KinfolkAI Session Deletion (individual + full history) | Wave 1 | LC | FD-009 |
| FSR-029 | Crisis Intervention Block | Wave 2 | LC — immediate | FD-008 |
| FSR-030 | AAVE Voice UI Path | Wave 1 | S | FD-010 |
| FSR-031 | voiceMode as Persistent Member Preference | Wave 1 | S | FD-011 |
| FSR-032 | Cultural Heritage → KinfolkAI Injection | Wave 3 | PL | AUDIT-001 complete |
| FSR-033 | Safety Survey → KinfolkAI Injection | Wave 3 | PL | Safety survey system |
| FSR-034 | Events → KinfolkAI Injection | Wave 3 | PL | Events system |
| FSR-035 | Cultural Ambassador KinfolkAI Mode | Wave 4 | GR | FD-016, Ambassador role |
| FSR-036 | Community Organization KinfolkAI Mode | Wave 4 | GR | Org role system |
| FSR-037 | Prompt Governance and Versioning | Wave 5 | GR | FD-017 |
| FSR-038 | Guest-to-Member Conversion in KinfolkAI | Wave 1 | S | FD-015 |
| FSR-039 | Recommendation Source Attribution | Wave 5 | S | FD-013 |
| FSR-040 | KinfolkAI Query Count Display (free tier) | Wave 1 | S | — |
| FSR-041 | Smart Promotion Engine Language Correction | Wave 0 | LC | FD-014 |

*Priority codes: LC = launch-critical, S = significant, PL = post-launch, GR = growth roadmap*

---

## 41. Exact Files, Tables, Routes, Prompts, and Components Reviewed

### Server Files
- `artifacts/api-server/src/routes/kinfolk.ts` — 2,644 lines (complete review)

### Database Schema Files
- `lib/db/src/schema/user-preferences.ts` — complete review
- `lib/db/src/schema/auth.ts` — referenced for trustLevel, memberType, role fields

### Database Tables Referenced
- `kinfolk_sessions` — session storage
- `kinfolk_feedback` — liked/disliked history
- `user_preferences` — all 19 preference fields
- `user_settings` — personalisedSuggestions, kinfolkMemoryEnabled
- `users` — memberType, kinfolkQueryMonth, kinfolkQueriesThisMonth, trialEndsAt
- `businesses` — name, category, city, description, verified, tags, status
- `business_identity` — story, mission, values, vibes, ownership badges
- `life_journeys` — active journey injection
- `saved_places` — saved business IDs
- `family_ai_usage` — Circle AI pool tracking
- `business_ai_plan_cache` — cached business plans
- `neighborhood_surveys` — confirmed NOT connected to KinfolkAI

### Routes Confirmed Existing
- GET, PUT `/kinfolk/preferences`
- POST `/kinfolk/feedback`
- GET `/kinfolk/sessions`, `/kinfolk/sessions/:id`
- POST `/kinfolk/sessions/:id/share`
- POST `/kinfolk/chat`
- GET, POST `/kinfolk/business-action-plan`
- POST `/kinfolk/expansion-analysis`
- POST `/kinfolk/relocation`

### Routes Confirmed Missing
- DELETE `/kinfolk/sessions/:id`
- DELETE `/kinfolk/sessions`
- GET `/kinfolk/transparency`

### System Prompt Functions
- `buildSystemPrompt()` — lines 630–1103 (complete review)
- `fetchWeatherContext()` — lines 41–118
- `extractLocationFromMessage()` — lines 120–134
- `isWeatherQuery()` — line 136–138
- `getCityVoice()` — lines 182–188
- `getCityLocalTerms()` — lines 190+ (partial review)
- `CITY_VOICES` registry — lines 143–180 (all 37 cities reviewed)

### Documents Previously Created (not duplicated by this audit)
- `docs/product/features/FSR-018-kinfolk-as-intelligence-layer.md`
- `docs/product/features/FSR-024-kinfolk-stewardship-proactive.md`

---

## 42. Confirmation That No Code or Schema Changes Were Made

This document is the sole output of AUDIT-005.

**No code was modified.** No files in `artifacts/`, `lib/`, or `scripts/` were created or edited as part of this audit.

**No schema changes were made.** No migrations or `pnpm --filter @workspace/db run push` commands were executed.

**No configuration changes were made.** No environment variables, secrets, workflow configurations, or artifact registrations were modified.

**No routes were added or removed.**

All findings, gaps, and proposed waves in this document are recommendations awaiting founder review and authorization. The authorization phrase to proceed with any implementation is: **"Please implement."**

---

*Document prepared by: Replit Agent (Build Mode)*
*Authorized by: Pending founder review*
*Next action: Founder reviews Sections 37 (Founder Decisions Required) and 38 (Proposed Implementation Waves) and provides direction on which decisions to make and which waves to authorize.*
