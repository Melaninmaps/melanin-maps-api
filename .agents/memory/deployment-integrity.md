---
name: Deployment integrity — BUILD_IDENTITY and Railway env-var pattern
description: How MWM verifies what code is actually running on Railway, and the proven pattern for doing so reliably.
---

# Deployment Integrity — BUILD_IDENTITY

## Problem
`RAILWAY_GIT_COMMIT_SHA` is set by Railway at DEPLOY TRIGGER TIME (webhook event), not from what was actually compiled. A failed build can leave production running an older bundle while `RAILWAY_GIT_COMMIT_SHA` shows the latest SHA. This is the "deployment integrity gap" identified by the Manus audit.

## Solution (implemented)

### build.mjs
After building `dist/index.mjs`, writes `artifacts/api-server/dist/BUILD_IDENTITY` containing:
- `bundle_sha256` — SHA-256 of the compiled `dist/index.mjs`
- `built_from_sha` — git SHA at build time (`git rev-parse HEAD`)
- `built_at` — ISO timestamp

### nixpacks.toml
Copies `artifacts/api-server/dist/BUILD_IDENTITY` → `dist/BUILD_IDENTITY` as part of build cmds.

### static-server.mjs
Reads `dist/BUILD_IDENTITY` at startup, passes values to the spawned API process as env vars:
- `BUILD_BUNDLE_SHA256`
- `BUILD_FROM_SHA`
- `BUILD_AT`

**Why env vars and not file read inside the bundle?**
esbuild bundles `import.meta.url` as the entry point file's URL, but in some
configurations this doesn't resolve to the expected `dist/` directory. Passing via env vars
from static-server.mjs (which knows its own `__dirname` reliably) is more robust.

### app.ts
`/api/version` returns:
- `railway_sha` — from `RAILWAY_GIT_COMMIT_SHA` (Railway runtime env var)
- `bundle_sha256` — from `BUILD_BUNDLE_SHA256` (build-time embedded)
- `built_from_sha` — from `BUILD_FROM_SHA` (build-time embedded)
- `built_at` — from `BUILD_AT` (build-time embedded)

If `built_from_sha !== railway_sha`, the running bundle is stale vs. what Railway
thinks it deployed. This is the deployment integrity gap indicator.

## How to Verify Provenance
```bash
# 1. Check what production says
curl https://www.mappingwithmelanin.com/api/version

# 2. Compute what the local build produced
sha256sum dist/index.mjs  # or: shasum -a 256 dist/index.mjs

# 3. Compare bundle_sha256 from step 1 with step 2
# They must match for the deployment to be trusted.
```

## Railway Deployment Model (confirmed)
- Auto-deploys on push to `main` via GitHub webhook (usually within 10 minutes)
- Build: nixpacks reads `nixpacks.toml [phases.build] cmds` in sequence
- The `serviceManifest.build.buildCommand` field shows only the first cmd (display only)
- Start: `node static-server.mjs` → spawns `node dist/index.mjs` with env vars
- Health check: `GET /api/readyz` must return 200 within 30s for deploy to be SUCCESS
- Service ID: `a77b49bb-e448-4be8-9d02-de7a3b43136b`
- Project ID: `b98310f8-7bfa-4e43-a574-8819752e9cfe`
- Production env ID: `2292b38f-3d0d-4cad-92a4-ad36cabda629`

## Triggering Manual Redeploy
```bash
curl -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer ${RAILWAY_ACCOUNT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceInstanceRedeploy(serviceId: \"a77b49bb-e448-4be8-9d02-de7a3b43136b\", environmentId: \"2292b38f-3d0d-4cad-92a4-ad36cabda629\") }"}'
```

**Why:** If auto-deploy doesn't trigger (webhook missed), use this. Returns `{"data":{"serviceInstanceRedeploy":true}}`.

## Important: artifacts/api-server/dist/ is gitignored
The directory is in .gitignore but the files are tracked (force-added in bc6438e9).
Railway nixpacks REBUILDS from source — the committed dist/ is just a snapshot for
local reference. Never rely on committed dist/ matching what Railway runs.
