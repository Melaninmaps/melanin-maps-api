---
name: KinfolkAI Voice Feature
description: TTS "Listen" button on AI messages, gated by monthly character allowance per tier, tracked server-side with no Apple subscription changes.
---

## Architecture

- **Voice available to ALL tiers** — not paywalled, just limited by character allowance
- **Character allowance by tier:**
  - Free: 10,000 chars/month → "Kinfolk Voice Preview"
  - Navigator: 100,000 chars/month → "Kinfolk Voice"
  - Trailblazer: 300,000 chars/month → "Extended Kinfolk Voice"
  - Community Builder: 750,000 chars/month → "Kinfolk Voice Plus"
  - Legacy Member: unlimited → "Kinfolk Voice — Unlimited"

## DB

- Table: `voice_usage` (userId, yearMonth TEXT, charsUsed INTEGER)
- Schema file: `lib/db/src/schema/voice-usage.ts`
- Uses UPSERT pattern (ON CONFLICT DO UPDATE) for char increments

## Backend

- `POST /api/kinfolk/speak` — takes `{ text }`, gates by char limit, calls `textToSpeech(text, "onyx", "wav")`, returns `{ audio: base64, format, charsUsed, charsLimit, percentRemaining, tierName }`
- `GET /api/kinfolk/voice-usage` — returns `{ charsUsed, charsLimit, tierName, percentRemaining }`
- Helpers in `membershipTiers.ts`: `checkVoiceUsage`, `incrementVoiceChars`, `getVoiceUsage`
- TTS capped at 600 chars per call (cost control — Kinfolk speaks concise summaries, not full dumps)

## Mobile

- `speakMessage(msgId, text)` in AIChatWidget.tsx — POSTs to /kinfolk/speak, writes base64 WAV to `FileSystem.cacheDirectory`, sets `listenUri` state
- `useAudioPlayer(listenUri)` hook from expo-audio — plays when `player.isLoaded`
- Listen button rendered below each non-user bubble (Feather "volume-2" → "volume-x" when playing)
- Voice meter bar in modal header (only shown when limit isn't -1) — thin 3px bar + "TierName — X% remaining" text
- 429 response → Alert "Voice Time Used" (no upgrade push, just informs)
- 401 response → Alert "Sign In Required"

**Why:** No Apple IAP complexity. Character tracking is entirely server-side. Text stays available at all times when voice allowance is exhausted.
