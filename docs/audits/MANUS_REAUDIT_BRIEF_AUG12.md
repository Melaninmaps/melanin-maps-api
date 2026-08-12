# Manus Re-Audit Brief — KinfolkAI/Library 30-User Handoff
**Date:** August 12, 2026  
**Target:** https://www.mappingwithmelanin.com  
**Audit type:** Same as final_30_member_kinfolk_library_handoff — staged 1→5→15→30 concurrent users

---

## Why a Re-Audit Is Needed

The prior 30-user audit aborted at the 30-user stage with 8 HTTP 500 errors on `kinfolk_chat`.  
All 1-user, 5-user, and 15-user stages passed cleanly (0 failures, correct library actions).

---

## Root Cause — Confirmed from Railway Production Logs

```
2026-08-12T14:27:07 [kinfolk-chat-error] code=rate_limit_exceeded providerStatus=429
429 Rate limit reached for gpt-4o-mini on tokens per min (TPM): Limit 200,000,
Used 200,000, Requested 11,532. Please try again in 3.459s.

2026-08-12T14:27:07 [kinfolk-retry] attempt=2/2 providerStatus=429 backoffMs=1155
err=429 Rate limit reached for gpt-4o-mini...
```

**The problem:** OpenAI's TPM (tokens-per-minute) limit was exhausted by 30 simultaneous  
chat requests (~12,000 tokens each × 30 = 360,000 tokens in <30s = 3.6× the 200k/min limit).

The retry logic was firing — `attempt=2/2` is visible — but the backoff was only **1,155ms**.  
OpenAI declared the window needed **3,459ms** to reset. Both retries fired inside the  
still-exhausted window, so all three attempts failed → HTTP 500.

**This was NOT a DB pool issue.** The pool showed `waiting: 0` throughout the entire  
30-user burst. DB, sessions, library graph, and deeplink steps all passed for all 30 users.

---

## Fix Deployed — commit `8275063f` (Aug 12 2026, ~14:44 UTC)

**File:** `artifacts/api-server/src/routes/kinfolk.ts`

```typescript
function parseRetryAfterMs(errMsg: string): number | null {
  const m = errMsg.match(/(?:try again in|retry after)\s+(\d+(?:\.\d+)?)\s*s/i);
  return m ? Math.ceil(parseFloat(m[1]) * 1000) + 200 : null; // +200ms safety margin
}

// In callOpenAIWithRetry catch block:
const retryAfterMs = parseRetryAfterMs(errMsg) ?? 0;
const exponential  = KINFOLK_RETRY_BASE_MS * Math.pow(2, attempt) + jitter;
const backoffMs    = Math.max(retryAfterMs, exponential);
```

**Verification of parse logic:**
- "Please try again in 3.459s" → 3,659ms ✓ (was 1,155ms before)
- "Please try again in 3.333s" → 3,533ms ✓
- "Please try again in 3.703s" → 3,903ms ✓

With the fix, retries now wait the full declared reset window before re-attempting.  
The first retry at T+3.5s fires after the TPM window has partially reset → expected to succeed.

---

## Additional Change — commit `4eb2973f` (Aug 12 2026, ~14:52 UTC)

**Admin panel TPM visibility (Task #276):**
- `GET /api/admin/health` now includes `kinfolkAI` section:
  - `activeGenerations` — currently active OpenAI calls
  - `queuedGenerations` — callers waiting for a permit
  - `tpmEventsLast60m` — count of 429 rate-limit events in the last 60 minutes
  - `tpmEventsMostRecentAt` — timestamp of most recent TPM event
- Production Health tab in the admin panel shows a KinfolkAI Generation Queue panel
- Amber warning banner fires when `tpmEventsLast60m > 5`
- `recordTpmEvent()` is called inside `callOpenAIWithRetry` on every 429

---

## Production State at Time of Re-Audit Brief (14:56 UTC)

| Endpoint | Status |
|---|---|
| `GET /api/healthz` | `{"status":"ok"}` |
| `GET /api/readyz` | `{"status":"ok","db":"ok","pool":{"total":3,"idle":1,"waiting":0}}` |
| `GET /api/kinfolk/health` | `{"ok":true}` |
| DB pool waiting | 0 (no starvation) |
| Recovery from 30-user burst | Clean (1 idle connection, 0 waiting after traffic stopped) |

---

## What to Expect in the Re-Audit

### All 4 stages should pass (0 failures each):

**1-user baseline:**  Same as before — instant pass.

**5-user warm:**  Same as before — all 5 pass.

**15-user mid:**  Same as before — all 15 pass. Pool peaked at 26 connections but waiting=0.

**30-user burst (the previously failing stage):**
- All 30 users hit `kinfolk_chat` within a ~5ms window after sequential setup steps
- 10 slots fill immediately (KINFOLK_CONCURRENCY_CAP=10), 20 queue
- First 10 calls land on OpenAI; some trigger 429 TPM limit
- **With the fix:** retry waits 3.5-4s before re-attempting → TPM window resets → success
- Expected: all 30 users return HTTP 200 with `has_reply: true`
- Pool: should remain `waiting: 0` (DB issue was not the cause)

### Library action check (carried over from prior audit):
- Users asking about Black history/diaspora/culture should receive `open_library_node` action
- `topic_id: "fbfbc161-5121-4eca-a0a4-c35731b010f6"` (African Diaspora History)
- `focus: "evidence"` with 3 sources confirmed live

### Web deep-link (r4b confirmed live):
- `GET /api/knowledge/graph/fbfbc161...?surface=library` → `source_count: 3, topic_name: "African Diaspora History"`
- Library deeplink route → HTTP 200

---

## Sanitized Railway Error Records — 8 HTTP 500 Events from Prior Audit

All 8 errors occurred during the `full_30` phase between 14:27:06–14:27:09 UTC:

```
2026-08-12T14:27:07 [kinfolk-chat-error] code=rate_limit_exceeded providerStatus=429
  isOverload=false isTimeout=false active=7 queued=0
  "429 Rate limit reached for gpt-4o-mini ... Please try again in 3.459s."

2026-08-12T14:27:07 [kinfolk-retry] attempt=2/2 providerStatus=429 backoffMs=1155
  err=429 Rate limit reached... Please try again in 3.459s.

2026-08-12T14:27:07 KinfolkAI chat failed  [→ HTTP 500 to user]

2026-08-12T14:27:08 [kinfolk-chat-error] code=rate_limit_exceeded providerStatus=429
  isOverload=false isTimeout=false active=4 queued=0
  "429 Rate limit reached for gpt-4o-mini ... Please try again in 3.333s."

2026-08-12T14:27:08 KinfolkAI chat failed  [→ HTTP 500 to user]

2026-08-12T14:27:08 [kinfolk-chat-error] code=rate_limit_exceeded providerStatus=429
  isOverload=false isTimeout=false active=3 queued=0
  "429 Rate limit reached for gpt-4o-mini ... Please try again in 3.703s."

2026-08-12T14:27:08 KinfolkAI chat failed  [→ HTTP 500 to user]
```

**Pattern:** All 8 errors share `code=rate_limit_exceeded, providerStatus=429`.  
No DB errors, no timeout errors, no ECONNRESET, no auth failures.

---

## GO / NO-GO Criteria for Handoff Clearance

| Check | Required | Notes |
|---|---|---|
| 1-user baseline | 1/1 pass | Expected: same as before |
| 5-user warm | 5/5 pass | Expected: same as before |
| 15-user mid | 15/15 pass | Expected: same as before |
| 30-user burst | 30/30 pass | **The fix target** |
| Pool `waiting` throughout | 0 | DB was never the cause |
| Library action on culture query | ≥1 `open_library_node` | `fbfbc161` confirmed |
| Kinfolk health post-burst | `{"ok":true}` | Recovery confirmed |

**Verdict: GO if 30/30 pass with 0 kinfolk_chat HTTP 500s.**
