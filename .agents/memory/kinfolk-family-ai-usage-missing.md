---
name: KinfolkAI family_ai_usage missing table crash
description: family_ai_usage and voice_usage tables were absent from Railway DB and startup migrations, causing instant "KinfolkAI chat failed" for all non-free, non-legacy users.
---

## The Rule
`family_ai_usage` and `voice_usage` tables MUST exist before `checkAiPool()` or `checkVoiceUsage()` are called. Both are now in startup migrations (`family_ai_usage_table_v1`, `voice_usage_table_v1`). Never add a pool.query() call to a route without either (a) ensuring the table is in startup migrations or (b) wrapping with try/catch.

## Why
`checkAiPool()` queries `family_ai_usage` for any tier with a finite monthly AI quota (navigator=30, trailblazer=100, business_referral=300). The table was never added to startup migrations. With no individual try/catch on that call in kinfolk.ts, the throw propagated directly to the outer catch block → every non-free, non-legacy chat request returned "KinfolkAI chat failed" within milliseconds, before the OpenAI call was ever attempted.

`voice_usage` had the same gap for TTS.

## How to Apply
- Any new `pool.query()` call that references a table not seeded in the main DB schema must be added to startup migrations with `CREATE TABLE IF NOT EXISTS`.
- In any route handler, wrap DB calls that are "enrichment" (prefs, feedback, saved places, quota checks) in individual try/catch — graceful degradation is always better than a 500.
- The Railway log viewer hides pino JSON payloads. To surface actual error details, add a `console.error("[tag]", errMsg)` call alongside `req.log.error()`.
