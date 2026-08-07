---
name: Railway nixpacks deploy checklist — mandatory steps per push
description: Every api-server push must follow this exact sequence or Railway will serve a stale binary.
---

# Railway nixpacks deploy checklist — MANDATORY every api-server push

## The Problem (root causes — both must be fixed per push)

1. **Stale root dist/index.mjs** — Railway runs from `/dist/index.mjs` at the REPO ROOT (spawned by `static-server.mjs`). The `artifacts/api-server/dist/index.mjs` is a DIFFERENT file. Previous sessions only committed the artifacts path. Always sync root dist after building.

2. **Cached nixpacks build layer** — Railway caches the build step by command string. If the echo token in `nixpacks.toml` doesn't change, Railway reuses the old compiled binary. Must update the token on every push that must deploy clean.

## CRITICAL LESSON — Both web AND api tokens must change every push

The **web build token** (`echo web-build-<token>`) must be updated on **every push that changes web source files**, not just api-server files. If the web token stays the same, Docker caches the web Vite build layer and Railway keeps serving the old bundle — even when the api-server token changes. This caused a React error #310 crash in production (Aug 7 2026): the old web bundle (`index-CWObelCJ.js`) tried to render data shapes from the updated API that it couldn't handle.

**Rule: update BOTH tokens on every push, regardless of what changed.**

## CRITICAL — THREE directories must all be synced on every web push

`static-server.mjs` on Railway serves from ROOT `web-static/` (process.cwd()/web-static). There are THREE separate web-static locations that must all have the fresh build:

1. `artifacts/web/dist/public/` — Vite output (source of truth)
2. `artifacts/api-server/web-static/` — what api-server build.mjs embeds as SPA_HTML
3. `web-static/` (repo root) — what static-server.mjs actually serves in production

**All three must be in sync before committing. If any one is stale, Railway serves the wrong bundle.**

## CRITICAL — web-static must be synced locally before api-server build

Before running `pnpm --filter @workspace/api-server run build` locally, you MUST first copy the fresh web build output into api-server/web-static/:

```bash
pnpm --filter @workspace/web run build
cp -r artifacts/web/dist/public/. artifacts/api-server/web-static/
pnpm --filter @workspace/api-server run build   # now embeds the correct SPA HTML
```

If you skip this step, the committed dist/index.mjs bakes the OLD web bundle hash into the SPA HTML. Railway will serve the stale web bundle even after deploying the latest commit. This caused React error #310 in production (Aug 7 2026) — old bundle tried to render data shapes the new API returned, old bundle didn't know how to handle them.

nixpacks handles this correctly (step 2 copies web→api-server/web-static before step 3), but local builds must do it manually.

## Mandatory Checklist

```bash
# 1. Build
pnpm --filter @workspace/api-server run build

# 2. Sync root dist (Railway serves THIS file, not artifacts/api-server/dist/)
cp artifacts/api-server/dist/index.mjs dist/index.mjs
cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map
cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY

# 3. Update nixpacks token (nixpacks.toml line ~14)
# Change: "echo build-<old-token> && pnpm ..."
# To:     "echo build-<feature>-<mmdd>-<year> && pnpm ..."

# 4. git add ALL of:
git add -f \
  dist/index.mjs dist/index.mjs.map dist/BUILD_IDENTITY \
  artifacts/api-server/dist/index.mjs artifacts/api-server/dist/index.mjs.map \
  nixpacks.toml \
  <all source files changed>

# 5. Commit + push (commit 1 of 2)
git commit -m "feat/fix: <description>"
git push github main

# 6. Rebuild from HEAD (commit 2 of 2 — mandatory two-commit rule)
pnpm --filter @workspace/api-server run build
cp artifacts/api-server/dist/index.mjs dist/index.mjs
cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map
cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY
git add -f dist/index.mjs dist/index.mjs.map dist/BUILD_IDENTITY \
           artifacts/api-server/dist/index.mjs artifacts/api-server/dist/index.mjs.map
git commit -m "build: rebuild from HEAD (<feature>)"
git push github main
```

## Verification (after Railway deploys — ~2-3 min)

```bash
curl -s https://www.mappingwithmelanin.com/api/version | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print('sha:', d['railway_sha'][:12], '| built_from:', d['built_from_sha'][:12])"
```

`built_from_sha` should match the source commit (not the rebuild commit — that's expected).

## Why "stale: False" doesn't mean fresh code
`stale_bundle` checks `bundle_sha256_self === bundle_sha256` (binary self-consistency), NOT whether it matches the latest commit. Always verify `built_from_sha` against the git log.

## Startup migrations pattern
Use `startup-migrations.ts` for one-time DB backfills when Railway's build cache is stale and the admin endpoint isn't reachable. Migrations are idempotent by name — safe to add even if columns already exist (use `IF NOT EXISTS` / `IF NOT EXISTS` guard).
