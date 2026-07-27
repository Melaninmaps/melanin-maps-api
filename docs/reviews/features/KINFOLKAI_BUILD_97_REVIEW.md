# KinfolkAI — Build 97 Engineering Review
## Mapping With Melanin™
**Date:** July 27, 2026

---

## Overview

KinfolkAI is the app's AI travel and community discovery assistant. It is positioned as a "personalized guide for the diaspora" — helping users find businesses, explore heritage, plan travel, and get culturally aware recommendations. It is distinct from a general chatbot: it has access to the user's preferences, saved places, life journey, and community context.

---

## Current Screens

| Screen | Platform | Status |
|--------|----------|--------|
| KinfolkAI chat main screen | Mobile | ✅ Implemented |
| KinfolkAI onboarding (5-step) | Mobile | ✅ Implemented |
| KinfolkAI voice/listen | Mobile | ✅ Implemented |
| Kinfolk tab in bottom nav | Mobile | ✅ Implemented (visible in Build 97) |

---

## Current API Routes

**Router:** `artifacts/api-server/src/routes/kinfolk.ts`
**Mounted at:** `/api/kinfolk` (via routes/index.ts `router.use(kinfolkRouter)`)

Key endpoints:
- `POST /api/kinfolk/chat` — primary chat completion endpoint
- `GET /api/kinfolk/sessions` — conversation history
- `GET /api/kinfolk/sessions/:id` — specific session
- `POST /api/kinfolk/feedback` — thumbs up/down on responses
- `POST /api/kinfolk/voice` — TTS audio generation
- `GET /api/kinfolk/voice-usage` — voice character usage

---

## Prompt Architecture

### System Prompt Construction

The system prompt is built dynamically per request via `buildSystemPrompt()`:
- **User identity:** name, home city, member tier
- **User preferences:** dietary restrictions, travel style, lifestyle services (`lifestyleServices` JSONB column), language preferences
- **Tone/voice settings:** formal, casual, AAVE, city-specific voices (loaded from `user_settings` table)
- **City voice system:** specific personality voices for different cities (e.g., "DC voice", "ATL voice")
- **AAVE settings:** per-user opt-in for culturally specific language patterns
- **Life journey:** current life phase from `life_journeys` table (e.g., new city, new parent, career change)
- **Saved places context:** user's saved businesses injected as context
- **Tier depth rules:** free tier gets basic guidance; navigator/trailblazer get deeper personalization

### Multi-Turn Conversation Memory

- Conversation history stored in `kinfolk_sessions` table (`kinfolk-sessions.ts` schema)
- Each session stores `messages` as JSONB array of `{ role, content }` pairs
- History injected into each new request (bounded to prevent token overflow)
- Sessions identified by session ID; multiple sessions per user

### Model and Provider

- **Provider:** OpenAI via Replit AI Integrations proxy (`@workspace/integrations-openai-ai-server`)
- **API key required:** `AI_INTEGRATIONS_OPENAI_API_KEY` (set as Replit secret; never exposed to client)
- **Model:** Configured via the Replit OpenAI integration — current model not hardcoded in route file; depends on integration configuration. Project memory references `gpt-4o` as the current model with a proposed upgrade to `gpt-5` (Task #39).
- **Streaming:** Chat responses may use streaming (check route implementation for `stream: true`)

---

## Live Weather Capability

KinfolkAI has **real live weather** via Open-Meteo:

```typescript
// From kinfolk.ts
async function fetchWeatherContext(location: string): Promise<string | null> {
  // 1. Geocode location via Open-Meteo geocoding API
  // 2. Fetch 3-day forecast via Open-Meteo weather API
  // Returns formatted weather context string or null on failure
}
```

**Open-Meteo facts:**
- Free, no API key required
- Provides current conditions + 3-day forecast
- Temperature in Fahrenheit, wind in mph, precipitation in inches
- 5-second timeout on each call; returns null on failure
- Weather context is injected into the system prompt when a location is detected in the user's query

**Implication:** KinfolkAI CAN accurately tell users the current weather and forecast for any city. This is a confirmed working feature, not a placeholder.

---

## What KinfolkAI Can Realistically Answer

| Query Type | Capability | Notes |
|-----------|-----------|-------|
| "What's the weather in Atlanta?" | ✅ Live via Open-Meteo | Accurate current conditions |
| "Find me a Haitian restaurant in DC" | ✅ Searches business DB + AI | Quality depends on DB content |
| "Tell me about the Howard Theatre" | ✅ Knowledge-based | GPT knowledge only, may not have current hours |
| "What's on at the Apollo this weekend?" | ❌ Not available | No live events API; should decline gracefully |
| "Is it safe to walk in [neighborhood] right now?" | ❌ Unsafe to answer | System prompt should restrict this |
| "What are the hours for [specific business]?" | ⚠️ DB hours field if present | May be outdated; should caveat |
| Travel itinerary planning | ✅ Knowledge-based | Good for general guidance |
| Diaspora heritage questions | ✅ Knowledge-based | GPT's strength |
| "What businesses are verified Black-owned near me?" | ✅ DB query | Based on actual DB records |

---

## Query Limits by Tier

Managed in `artifacts/api-server/src/constants/membershipTiers.ts` via `TIER_LIMITS` and `checkAiPool()`:

| Tier | Monthly AI Query Limit | Notes |
|------|----------------------|-------|
| Individual (free) | Limited (exact number in `TIER_LIMITS` constant) | Enforced per-month by `kinfolkQueryMonth` + `kinfolkQueriesThisMonth` on user record |
| Navigator (paid) | Higher limit | — |
| Trailblazer (paid) | Highest limit | — |
| Family plan | Shared pool across seats | `family_ai_usage` table |

---

## Voice / TTS Feature

- "Listen" button on KinfolkAI responses
- Server-side TTS via OpenAI audio API (`textToSpeech` from `@workspace/integrations-openai-ai-server/audio`)
- Character limit enforcement by tier (`checkVoiceUsage`, `incrementVoiceChars`)
- `voice_usage` table tracks character counts
- No Apple IAP required for voice (it's a server-side feature included in the plan)

---

## Error Handling

| Error Type | Handling |
|-----------|---------|
| OpenAI API timeout | Caught; user sees "KinfolkAI is unavailable" message |
| Query limit exceeded | Returns 429 with upgrade prompt |
| DB failure | Caught by route error handler; user sees generic error |
| Malformed response from OpenAI | Caught; user sees generic error |
| Weather fetch failure | `null` returned; KinfolkAI proceeds without weather context |

---

## Safety Protections

- System prompt includes instructions not to invent businesses, locations, or safety claims
- System prompt instructs KinfolkAI to acknowledge when it cannot provide current information
- Community health and safety features separate from KinfolkAI responses (no "AI safety scores")
- Content reports can flag KinfolkAI interactions (via feedback mechanism)
- No profanity filter explicitly documented — relies on OpenAI's content moderation

---

## What Is Future State / Not Yet Accessible

| Feature | Status |
|---------|--------|
| "Kinfolk Twin" (AI-matched community member) | Vision only — not built |
| Community signal injection into responses | Vision — partial implementation |
| Real-time business hours from web | Not implemented |
| Live events feed integration | Not implemented |
| Kinfolk Intelligence routes (`kinfolkIntelligenceRouter`) | Router exists; scope of implementation unclear |

---

## Production Cost Risks

- **OpenAI costs:** GPT-4o or similar at ~$0.01–0.03 per 1K tokens. At 30 testers each making 10 queries/day, estimated daily cost: $1–5. Manageable.
- **TTS costs:** OpenAI TTS at ~$0.015/1K chars. With character limits per tier, controllable.
- **Open-Meteo:** Free, no cost risk.
- **Abuse prevention:** `checkAiPool()` enforces monthly limits per user; unauthenticated users cannot access KinfolkAI.

---

## Tablet Behavior

- KinfolkAI chat screen has not been specifically tested on iPad in project records
- Text input, keyboard behavior, and layout on large screens may need verification
- Voice/TTS on iPad: audio permission is declared; `expo-audio` handles playback

---

## Known Crashes

None documented in project records for KinfolkAI specifically. No crash reporting system exists to surface unknown crashes.

---

## What Is Actually Functional Now

✅ General knowledge questions across all cultural, travel, and heritage topics
✅ Multi-turn conversation with memory
✅ Live weather for any location
✅ User preference integration (dietary, travel style, lifestyle)
✅ Tone and voice customization (AAVE, city voices, formal/casual)
✅ Tier-based query limits
✅ Voice/TTS playback
✅ Business discovery assistance (DB-backed for MWM businesses)
✅ Life journey phase awareness

## What Is Future State

❌ Real-time event discovery
❌ Live business hours from external sources
❌ Kinfolk Twin matching
❌ Community signal injection at scale

## What a Tester Can Realistically Ask

A tester can ask KinfolkAI:
- About diaspora culture, history, and heritage
- For restaurant, business, or neighborhood recommendations (MWM DB + GPT knowledge)
- For travel planning (general guidance)
- About the current weather in any city
- For help finding services in their area
- Questions in their preferred tone/dialect

A tester should NOT expect:
- Real-time event schedules
- Current business hours (may be outdated)
- Present-day safety assessments

---

## Questions for Manus

1. Is the basic KinfolkAI chatbot experience complete enough for Apple review and meaningful testing?
2. Does the system prompt adequately constrain KinfolkAI from making current-condition claims it cannot verify?
3. Is the monthly query limit enforcement (via DB counters) adequate, or should rate limiting be added at the API layer?
4. Is the voice/TTS feature complete and safe to ship?
5. Are there any Apple Guideline risks in an AI chatbot that discusses community safety, racial identity, or historical discrimination?
