---
name: Railway nixpacks deploy checklist
description: MANDATORY per push. Root cause of 8 consecutive FAILED deploys (Aug 10 2026) documented here.
---

# Railway Nixpacks Deploy Checklist — MANDATORY per push

## Root Cause of Aug 10 2026 Railway Failures (8 consecutive FAILED deploys)

**Discovery**: `.gitignore` had bare `dist` on line 4, gitignoring ALL `dist/` directories.

Railway's nixpacks generates a final `COPY . /app` Dockerfile step that copies from the **git checkout** (not the build stage). Since `dist/index.mjs` was gitignored, it was never in the checkout. Railway's nixpacks DID build `dist/index.mjs` during the build phase, but the final COPY overwrote it with the git source that had no `dist/` → `MODULE_NOT_FOUND` on startup → healthcheck fails → `FAILED` deploy.

**Fix applied**: Added `!dist/` and `!dist/**` exceptions to `.gitignore`, then `git add -f dist/index.mjs` (and all other dist files), committed, pushed.

**The `$(git rev-parse HEAD)` echo token** also never worked: Docker layer hashing is based on the **text** of the command, not its output. The literal `$(git rev-parse HEAD)` never changes between commits, so Docker always reused the cached layer. Fix: use a literal timestamp token (`echo "pre-manus-XXXXXX"`) that changes per push.

## MANDATORY Sequence Per Push

1. **Build api-server**: `cd artifacts/api-server && pnpm build`
2. **Sync root dist/**: `cp artifacts/api-server/dist/index.mjs dist/index.mjs` (+ pino workers + BUILD_IDENTITY)
3. **Update echo token in nixpacks.toml**: change literal string (e.g. `"pre-manus-1754851000"`) — new literal per push
4. **Stage all dist/ files** (they ARE now tracked after the gitignore fix, no need for `-f`):
   `git add dist/index.mjs dist/pino-worker.mjs dist/pino-file.mjs dist/pino-pretty.mjs dist/thread-stream-worker.mjs dist/BUILD_IDENTITY`
   ⚠️ CRITICAL: `dist/BUILD_IDENTITY` MUST be committed in the same commit as `dist/index.mjs`.
   Omitting it leaves the old hash → Railway serves new bundle but BUILD_IDENTITY has old hash → stale_bundle:true.
   The version endpoint check is: bundle_sha256_self === bundle_sha256 AND stale_bundle:false.
5. **Commit source + dist + nixpacks.toml together**
6. **Push**: `git push github main`
7. **Trigger Railway deploy**: `environmentTriggersDeploy` mutation (Railway auto-deploy webhook may not be reliable)
8. **Verify**: poll `https://www.mappingwithmelanin.com/` for new bundle hash; confirm `/api/version` SHA matches

## Railway API — Manual Deploy Trigger

```bash
RAILWAY_TOKEN=$(printenv RAILWAY_ACCOUNT_TOKEN)
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"mutation { environmentTriggersDeploy(input: { projectId: \"b98310f8-7bfa-4e43-a574-8819752e9cfe\", environmentId: \"2292b38f-3d0d-4cad-92a4-ad36cabda629\", serviceId: \"a77b49bb-e448-4be8-9d02-de7a3b43136b\" }) }"}'
```

Returns `{"data":{"environmentTriggersDeploy":true}}` on success.

## Checking Railway Deploy Status

```bash
RAILWAY_TOKEN=$(printenv RAILWAY_ACCOUNT_TOKEN)
curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" -H "Content-Type: application/json" \
  -d '{"query":"{ deployments(first: 5, input: { projectId: \"b98310f8-...\", serviceId: \"a77b49bb-...\" }) { edges { node { id status createdAt } } } }"}'
```

## Why Railway Auto-Deploy May Not Fire

Railway's GitHub webhook may not reliably trigger on every push. Always use `environmentTriggersDeploy` manually after pushing important changes.

## Build Logs vs Deployment Logs

- **Build logs** (`buildLogs` query): show nixpacks build output — use to diagnose build failures
- **Deployment logs** (`deploymentLogs` query): show runtime crash output — use to diagnose startup failures
- deployment ID needed for both; get via `deployments(first: N, input: {...})` query
