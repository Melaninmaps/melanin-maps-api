---
name: Railway nixpacks build cache bypass
description: Complete root cause analysis of Railway cache/deployment failures. Updated Aug 10 2026 after 8 consecutive FAILED deploys.
---

# Railway Nixpacks Build Cache — Root Causes

## Root Cause 1 (CONFIRMED): dist/ gitignored → MODULE_NOT_FOUND

**Status**: Fixed Aug 10 2026 (commit 6608d45c)

`.gitignore` had bare `dist` which gitignored ALL `dist/` directories including root `dist/`.

Railway's nixpacks Dockerfile has a final `COPY . /app` step that copies from the **git checkout** context, not from the build stage. Since `dist/index.mjs` was never in the git checkout, it was wiped by this final COPY step.

Runtime error: `Error: Cannot find module '/app/dist/index.mjs'` → server exits 1 → healthcheck fails.

**Fix**: Added `!dist/` and `!dist/**` to `.gitignore` (after the `dist` line). Force-added all dist files. Now dist/ is tracked and Railway's final COPY includes it.

## Root Cause 2: $(git rev-parse HEAD) never busts Docker cache

The echo token approach `echo "api-$(git rev-parse HEAD)"` in nixpacks.toml does NOT bust Docker layer cache because Docker hashes the **text** of the command, not the evaluated output. The literal string `$(git rev-parse HEAD)` never changes.

**Fix**: Use a literal timestamp that changes per push: `echo "pre-manus-1754850000"`. Update this literal every push.

## Root Cause 3 (HISTORICAL): Committed dist/ was stale

Before the gitignore issue, commits sometimes had stale dist/ (built from old source). Railway served stale binary until a real rebuild triggered.

**Fix**: Always build → commit dist → push in the same sequence. The committed dist IS what Railway serves (not a freshly-built one, due to COPY order).

## Key Insight: What Railway Actually Serves

Railway's nixpacks multi-step build:
1. COPY source → /app (including committed dist/)
2. Run nixpacks cmds (builds fresh dist/ in artifacts/api-server/dist/, copies to root dist/)
3. Final COPY from git checkout → /app (OVERWRITES step 2's built dist/ with git's dist/)

So: Railway serves the **git-committed** dist/index.mjs, not the freshly-built one.
This is fine because we commit dist/ explicitly after building.

## Monitoring Railway Deploy Status

See nixpacks-deploy-checklist.md for full API commands.
