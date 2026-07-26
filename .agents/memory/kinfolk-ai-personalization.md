---
name: KinfolkAI personalization architecture
description: Full KinfolkAI system architecture — models, routes, context injection, privacy controls, gaps, and audit findings (AUDIT-005, July 26 2026)
---

## Architecture
- `artifacts/api-server/src/routes/kinfolk.ts` — 2,644 lines; single source of all KinfolkAI logic
- Main chat: GPT-4o, `response_format: json_object`, max 1,000 tokens, 25s timeout
- Business plans / expansion analysis / relocation: GPT-4o-mini
- Provider: `@workspace/integrations-openai-ai-server`

## DB Tables
- `user_preferences` — userId PK; 19 fields including favoriteCategories, favoriteCities, avoidCategories, budgetRange, tripStyle, travelCompanion, dietaryNotes, communicationStyle, personalityMode, emojiLevel, humorLevel, culturalInterests, knowBeforeYouGo, regionalFlavor, preferredOwnershipTypes, diasporaCountries, lifestyleServices, searchHistory, aaveLevel (smallint, default 0)
- `kinfolk_sessions` — id (uuid), userId, title, destination, vibes (jsonb), messages (jsonb SessionMessage[]), createdAt/updatedAt
- `kinfolk_feedback` — id (uuid), userId, sessionId, businessName, category, city, reaction ('like'|'dislike'), createdAt
- `user_settings` — kinfolkMemoryEnabled (ephemeral mode), personalisedSuggestions (strips profile from prompt)

## Routes (/api/kinfolk/*)
- GET/PUT `/preferences` — auth required
- POST `/feedback` — like/dislike history
- GET `/sessions`, `/sessions/:id` — session management
- POST `/sessions/:id/share`
- POST `/chat` — optional auth; free tier = 3 queries/month; paid = AI pool via checkAiPool/incrementAiUsage
- GET/POST `/business-action-plan` — auth required, GPT-4o-mini
- POST `/expansion-analysis`, `/relocation` — GPT-4o-mini

## buildSystemPrompt() — 15+ context variables injected
1. User profile (all user_preferences fields)
2. Liked spots (kinfolk_feedback filtered "like", up to 40)
3. Disliked spots (filtered "dislike")
4. Saved places (up to 15)
5. Community Twin Intelligence (SQL collaborative filtering on saved places)
6. User Vibe DNA (search/tagging behavior)
7. Active Life Journey (phases, steps, completion)
8. Cross-City Preference Bridge (saved categories matched to journey destination)
9. Live weather (Open-Meteo, when weather query detected)
10. Lifestyle services (proactive provider-finding)
11. Membership tier depth rules (free/navigator/trailblazer/founding)
12. Smart Promotion Engine (hardcoded contextual cross-sell triggers)
13. AAVE Cultural Guide (injected when aaveLevel > 0)
14. Kinfolk Voices™ mode (community/professional/local/home)
15. Business catalog (up to 25 active businesses in destination city, full identity data)
16. Business owner context (if user owns a listed business)
17. Conversation history (last 12 messages of session)

## Voice / Cultural Intelligence
- 4 voice modes: community (default), professional, local, home
- CITY_VOICES: 37 cities with slang, phrases, cultural touchstones, writing guidance
- Local mode triggered when voiceMode="local" AND destination in registry
- aaveLevel 0-3: 0=standard, 1=cultural terminology, 2=AAVE rhythm, 3=full+casual profanity
- **CRITICAL: aaveLevel has no confirmed mobile UI path — DB field only**
- **CRITICAL: voiceMode is per-request parameter, not a persistent preference**

## Privacy Controls (both exist; UI surface not confirmed)
- `userSettingsTable.kinfolkMemoryEnabled` — false = ephemeral (no session save)
- `userSettingsTable.personalisedSuggestions` — false = strips all profile data from prompt

## Mobile Hooks (pre-audit, may be stale)
- `useKinfolk.ts` — sendMessage, submitFeedback, loadSessions, loadSession, startNewSession
- `useUserPreferences.ts` — load() on mount, update() does PUT; returns null when unauthenticated

## Confirmed Critical Gaps (AUDIT-005, July 26 2026)
- No DELETE routes for sessions (no individual delete, no full history wipe)
- No transparency panel ("what KinfolkAI knows about me")
- No recommendation explainability
- No source attribution (verified listing vs. AI knowledge vs. sponsored)
- No hardcoded crisis intervention block
- No child/minor safety layer connected to Family Mode
- Smart Promotion Engine: 8 of 9 triggers use "Black-owned" (language rule violation — FD-014)
- 7 extension points in code comments (lines 921-929) — none implemented:
  Community Memory, Events Pipeline, Opportunity Engine, Mentorship Engine,
  Scholarship Engine, Circle of Trust, Progressive Assistance
- Cultural heritage sites, safety surveys, events, Knowledge Library, Opportunity Center:
  all NOT connected to KinfolkAI

## Proposed Wave Structure (awaiting "Please implement.")
- Wave 0: Language corrections (3 targeted edits in kinfolk.ts) — FD-014
- Wave 1: Transparency + control (session deletion, transparency panel, voiceMode persistence, AAVE UI, query count)
- Wave 2: Safety (crisis block, family mode extension, safety claim disclosure) — FD-008
- Wave 3: Platform data integration (heritage, safety surveys, events, knowledge library)
- Wave 4: Role-aware intelligence (Ambassador, Organization, Circles, guest conversion)
- Wave 5: Progressive personalization + explainability + prompt governance

## FSR entries from this audit
- FSR-027 through FSR-041 added to FUTURE_STATE_REGISTER.md
- All status: NEEDS FOUNDER CLARIFICATION
- Full spec: docs/product/kinfolk-ai/KINFOLK_AI_COS_AUDIT_AND_SPEC.md (42 sections)

**Why:** Existing memory was written before the full audit. The system is far more capable than previously documented — and far more invisible to members than acceptable for a production platform. The gap between what KinfolkAI can do and what it explains about itself is the platform's primary product readiness risk.
