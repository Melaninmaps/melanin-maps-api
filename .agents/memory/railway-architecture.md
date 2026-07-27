---
name: Railway production architecture — definitive
description: How Railway actually runs this app; confirmed by deployment logs and debug endpoint. Critical for every future deploy.
---

## Confirmed start command
Railway service manifest: `startCommand: "node static-server.mjs"` (set in Railway dashboard, overrides nixpacks.toml `[start]`).

## What static-server.mjs does
- Listens on Railway's `PORT`
- Spawns `dist/index.mjs` from `cwd /app` with `PORT=3001` (i.e., runs ROOT `/app/dist/index.mjs`, NOT `artifacts/api-server/dist/index.mjs`)
- Proxies `/api/*` to `localhost:3001`
- Proxies `/privacy`, `/terms`, `/delete-account`, `/support` to port 3001
- Serves static files from `/app/web-static/` via `express.static`
- SPA fallback: `app.use(...)` sends `web-static/index.html`

## Critical: TWO dist/index.mjs files
- `artifacts/api-server/dist/index.mjs` — built by esbuild but NOT run by Railway
- `dist/index.mjs` (root `/app/dist/index.mjs`) — THIS is what static-server.mjs spawns

**Every source code change must be followed by:**
1. `pnpm --filter @workspace/api-server run build` (builds artifacts/api-server/dist/)
2. `cp artifacts/api-server/dist/index.mjs dist/index.mjs` (syncs to root)
3. Commit root `dist/index.mjs` (force: it's gitignored but Railway needs it from git)

## Railway build command
Service-level override (set via Railway API, overrides nixpacks.toml): `pnpm --filter @workspace/api-server run build`

nixpacks.toml `[phases.build].cmds` now also includes the cp step as belt-and-suspenders.

Root build script `pnpm run build` = `typecheck + pnpm -r build` — NEVER use this as Railway build command; mobile typecheck has pre-existing TS errors that break the build.

## Railway GraphQL IDs (confirmed)
- projectId: `b98310f8-7bfa-4e43-a574-8819752e9cfe`
- serviceId: `a77b49bb-e448-4be8-9d02-de7a3b43136b`
- environmentId: `2292b38f-3d0d-4cad-92a4-ad36cabda629`

Redeploy mutation: `serviceInstanceRedeploy(serviceId, environmentId)`

## SPA catch-all fix
`app.get("/{*path}", ...)` silently fails in some Railway Express contexts.
Fix: `app.use(...)` as the catch-all — works in Express 4 and 5.

## Zip/archive blocking
Railway Docker layer cache can serve deleted files even after git deletion.
Fix: middleware in static-server.mjs blocks `.zip/.ipa/.aab/.tar.gz` before express.static.

**Why:** Docker COPY layer is cached; deleted files can persist until a cache-busting redeploy fully rebuilds from scratch.
