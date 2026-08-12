---
name: KinfolkAI TPM retry-after backoff fix
description: Root cause and fix for 8/30 HTTP 500s in 30-user burst — OpenAI TPM rate limit exhaustion with insufficient retry backoff
---

# KinfolkAI TPM Retry-After Backoff Fix

**Root cause (Aug 12 2026 — 30-user burst audit):**
OpenAI TPM 429 error: "Rate limit reached for gpt-4o-mini on tokens per min (TPM): Limit 200000, Used 200000, Requested 11532. Please try again in 3.459s."

The prior exponential backoff peaked at `500ms × 2^attempt ≈ 1.1s max`. Both retries fired inside the still-exhausted TPM window → all 3 attempts failed → 8/30 users got HTTP 500.

**NOT a DB pool issue** — `waiting: 0` throughout the burst. NOT a connection reset. NOT a timeout.

**The fix** (commit `8275063f`, `kinfolk.ts`):
- `parseRetryAfterMs()` — extracts "try again in Xs" from 429 error message → returns milliseconds + 200ms safety margin
- `backoffMs = Math.max(retryAfterMs, exponential)` — floors every retry wait to the provider-declared reset window

**Key numbers:**
- TPM limit: 200,000 tokens/minute for gpt-4o-mini
- Per-request usage: ~11,000–12,300 tokens
- OpenAI's declared retry window: 3.3–3.7 seconds (varies by request size)
- Prior backoff: 1.1s (insufficient)
- Fixed backoff: 3.5s+ (respects TPM window)

**Why:**
KINFOLK_CONCURRENCY_CAP=10 allows up to 10 simultaneous OpenAI calls. With 30 users, 30 × 12,000 = 360,000 tokens in <30s = 720,000 TPM rate → 3.6× the limit. The retry-after backoff fix lets the TPM window partially reset before each subsequent attempt.

**How to apply:**
Any future changes to the Kinfolk generation path must preserve `parseRetryAfterMs()` and the `Math.max(retryAfterMs, exponential)` backoff pattern. Do NOT reduce this to a simple exponential backoff.
