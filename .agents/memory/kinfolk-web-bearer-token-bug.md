---
name: KinfolkAI web Bearer token 401 bug + Railway env var mismatch
description: Two root causes of 100% KinfolkAI failure on production. Both fixed 2026-08-11.
---

# KinfolkAI Production Failure — Root Causes (Both Resolved 2026-08-11)

## Root Cause 1 — Wrong Railway OpenAI env vars
`AI_INTEGRATIONS_OPENAI_BASE_URL` was set to `http://localhost:1106/modelfarm/openai` — a Replit-internal proxy unreachable from Railway.
`AI_INTEGRATIONS_OPENAI_API_KEY` was set to `_DUMMY_API_KEY_` placeholder.

**Fix:** Use Railway GraphQL `variableCollectionUpsert` to sync real values from Replit process.env to Railway. Set BASE_URL to `https://api.openai.com/v1`.

## Root Cause 2 — Wrong model name `gpt-5-mini`
The health check used `gpt-4o-mini` (real, passes). All chat routes used `gpt-5-mini` (doesn't exist → 404).
Health check said "OK" while every actual chat returned 500.

**Fix:** Replace all `gpt-5-mini` with `gpt-4o-mini` in kinfolk.ts.

## Root Cause 3 — Home-city catalog injected for destination queries
When geo-radius found 0 Phuket businesses, home-city fallback fired and injected Philadelphia businesses.
Kinfolk then recommended "Earle's on Crenshaw" for a Phuket birthday dinner.

**Fix:** `if (!businessCatalog.length && req.user?.id && !destination)` — only load home city when no destination is set.

## Lesson
Railway env vars must be explicitly synced from Replit. `AI_INTEGRATIONS_OPENAI_BASE_URL` is localhost inside Replit, `https://api.openai.com/v1` on Railway.
Model name in health check must match model names in all chat routes — divergence creates false "all OK" signals.
