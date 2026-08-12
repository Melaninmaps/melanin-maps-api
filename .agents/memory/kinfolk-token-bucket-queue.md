---
name: KinfolkAI Token-Bucket Queue + Prompt Optimization
description: Rolling 60-second token ledger replaces concurrency-only gate; prompt trimmed from ~12k to ~2,500 tokens system prompt; KINFOLK_BUSY client UX.
---

## Why
Manus 30-user burst audit (Aug 12 2026): 30 × ~12k tokens = ~360k TPM against 200k ceiling. 9/30 users got KINFOLK_RATE_LIMITED 503. Fix has two prongs: reduce per-request token budget, and gate on rolling TPM not just concurrency.

## Token Bucket (KinfolkTokenBucket class — kinfolk.ts)
- Replaces `KinfolkQueue` (concurrency-only semaphore)
- Rolling 60-second ledger of token expenditures (`_LedgerEntry[]`); entries expire after 60s
- `acquire(userId, estimatedTokens)` checks: `totalActive < MAX_ACTIVE_GENERATIONS` AND `rollingTpm + tokens ≤ TOKEN_BUCKET_TARGET`
- `MAX_ACTIVE_GENERATIONS = 4` (was 10), `TOKEN_BUCKET_TARGET = 160,000` (80% of 200k)
- `MAX_IN_FLIGHT_PER_USER = 1` — one active request per user; immediate KINFOLK_BUSY if violated
- On deadline: `KINFOLK_BUSY` (was `KINFOLK_QUEUE_TIMEOUT`); Retry-After: 20s (was 5s)
- `kinfolkQueue.run(userId, estimatedTokens, fn)` — new signature (was `run(fn)`)
- Token estimation: `estimateTokens(text) = ceil(text.length / 4)` (chars/4 ≈ GPT-4o-mini tokens)

**Why:** old concurrency cap (10) didn't prevent TPM spikes — 10 × 12k = 120k TPM was still dangerous; token bucket is the only correct protection.

**How to apply:** any future change to queue constants (MAX_ACTIVE_GENERATIONS, TOKEN_BUCKET_TARGET) must be re-validated against Manus burst audit at target user count.

## Prompt Optimization (buildSystemPrompt — kinfolk.ts)
- **Operating philosophy**: 44 lines → 3 lines
- **Smart promo section**: gated by intent (`SMART_PROMO_INTENTS` set); omitted for medical/legal/safety/knowledge (~300 tokens saved)
- **Business catalog**: cap at 8 entries (was 25); compact 2-line format (description + vibe/badges/audience); ~80 tokens/entry vs ~200
- **Array inputs**: `likedSpots`, `dislikedSpots`, `savedPlaces` capped to 3 each in function body
- **Heritage map**: trimmed from 7 lines to 1 line
- **International travel**: trimmed from 20 lines to 1 line
- **Extension points block**: removed entirely
- **Compassionate intelligence**: removed (~200 tokens)
- **Discovery section**: removed (~200 tokens)  
- **Conversation style**: 6 lines → 1 line
- **Language rules**: 18 lines → 1 line
- **Task management**: 14 lines → 1 line
- **Added `intentClass?: string | null`** to buildSystemPrompt opts so callers can gate smart promo
- History: `.slice(-12)` → `.slice(-8)` + 400-char ceiling per message
- `max_tokens`: 1,000 → 600 (`NORMAL_MAX_OUTPUT_TOKENS` constant)

**Target budget per request:** system prompt ~2,500 tokens + history ~400 + catalog ~640 (8×80) + message ~100 + completion 600 = ~4,240 tokens ≤ 4,500 limit.

## KINFOLK_BUSY Client UX
**Error code**: `KINFOLK_BUSY` replaces `KINFOLK_OVERLOADED`/`KINFOLK_QUEUE_TIMEOUT`
**Message**: "Kinfolk is helping a few people right now. Your question is saved — try again in about 20 seconds."
**Retry-After header**: 20s

**Web (travel.tsx):** on 503 KINFOLK_BUSY/KINFOLK_RATE_LIMITED, `setInput(trimmed)` restores the question so user can re-submit without retyping.

**Mobile (useKinfolk.ts):** 
- `ChatMessage` extended with `retryable?: boolean; retryText?: string`
- On 503 busy: sets both fields + `setPendingRetryText(text)` state
- Hook exports: `pendingRetryText`, `clearPendingRetryText`
- `pendingRetryText` cleared to null on any successful response

## Error Classification (kinfolk.ts catch block)
```
isQueueFull = errCode === "KINFOLK_QUEUE_FULL"
isKinfolkBusy = errCode === "KINFOLK_BUSY"
isOverload = isQueueFull || isKinfolkBusy  → 503 KINFOLK_BUSY, Retry-After: 20
isProviderRateLimit = providerStatus === 429 → 503 KINFOLK_RATE_LIMITED, Retry-After: 4
```

## Deployed
Commit `ac54b71d` + `2b36e30d` (rebuild marker) pushed Aug 12 2026. Production healthy at /api/healthz.
