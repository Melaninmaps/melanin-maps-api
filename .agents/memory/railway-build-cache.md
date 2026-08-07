---
name: Railway nixpacks build cache — bypass pattern
description: Railway persists its Docker layer cache across deploys; new source commits alone don't bust it. Documents the reliable bust pattern and direct-DB workaround.
---

# Railway nixpacks build cache — bypass pattern

## The Problem
Railway caches Docker build layers. Even when new source files are committed and pushed, Railway may serve an old cached `dist/index.mjs` bundle. Symptoms:
- `/api/version` shows `railway_sha` = new commit, but `built_from_sha` = old commit
- New admin endpoints return 404 even though code was committed
- New routes don't appear despite a "SUCCESS" deployment

## Why It Happens
nixpacks caches at the pnpm install layer. If `package.json` and `pnpm-lock.yaml` haven't changed, Railway reuses the cached layer (including the old built output).

## Reliable Cache-Bust Methods (in order of preference)
1. **Bump `artifacts/api-server/package.json` version** (e.g. 0.0.0 → 0.0.1) — forces pnpm install layer to rebuild, which invalidates all downstream layers including the build step.
2. Touch `pnpm-lock.yaml` with a trivial dep addition/removal — same effect.
3. Adding a `.railway-cache-bust` file with a timestamp does NOT work — Railway caches at the package layer, not file-content level.

## Direct-DB Workaround (for seeding when endpoint is unavailable)
When Railway's cached build doesn't have a new admin endpoint, run seeds directly against Railway Postgres via the public proxy:
- Get public URL from Railway API: `variables` query on Postgres service `7bb11d12`
- Host: `tokaido.proxy.rlwy.net:10066`
- Connection: `ssl: { rejectUnauthorized: false }`
- Run tsx seed scripts from workspace root (not /tmp — needs pnpm packages)
- The `"use impure"` pattern in CodeExecution can fetch Railway service vars and write URL to `/tmp/railway_db_url.txt`

**Why:** This failure pattern has appeared multiple times. The data seeding doesn't need to wait for Railway to fix its cache — seed directly and deploy the code change separately.

## Verification — the ONLY reliable test
Railway shows "Deployment successful" even for cache-served deploys — do NOT trust the dashboard status.
Probe an endpoint that only exists in commits *after* `c278b551` (the persistent stale baseline):
```bash
# Returns 404 = old binary. Returns 401 = new code running.
curl -s -o /dev/null -w "%{http_code}" \
  https://www.mappingwithmelanin.com/api/admin/seed-manus-cultural-sites-pass2
```
Also check `/api/version` — `built_from_sha` must match the commit that introduced the change.

## When version bump still doesn't work
The package.json version bump only busts the pnpm install layer, not the compile layer.
Railway can serve a "Deployment successful" from a cached compile even after a fresh install.
The ONLY guaranteed fix is a manual dashboard action:
- **Deployments → active deploy → Redeploy** with "Clear build cache" toggle ON
- Or **Settings → Danger Zone → Delete and redeploy** (data-safe, forces full nixpacks recompile)

Do NOT waste time on further commit-based workarounds once the dashboard action is available.
