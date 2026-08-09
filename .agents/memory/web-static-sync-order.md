---
name: Web-static sync order — MANDATORY sequence
description: The exact order for syncing web build outputs; wrong order embeds stale bundle and static-server.mjs serves the root web-static/index.html from the filesystem (not from the Express bundle).
---

# Web-static sync order — MANDATORY sequence

**Why:** static-server.mjs serves HTML from the FILESYSTEM at root `web-static/index.html` — NOT from the embedded `spaHtml.ts` inside `dist/index.mjs`. If `web-static/index.html` references an old bundle hash, users get the old bundle even when a fresh api-server bundle is deployed.

**How to apply:** After every web source change, run steps in this exact order:

```bash
# 1. Build web SPA
pnpm --filter @workspace/web build
# → artifacts/web/dist/public/index-{HASH}.js

# 2. Sync NEW web build → api-server/web-static (BEFORE building api-server)
cp -r artifacts/web/dist/public/. artifacts/api-server/web-static/

# 3. Build api-server (now reads the NEW web bundle from web-static/)
pnpm --filter @workspace/api-server build

# 4. Sync api-server outputs to all commit targets
cp artifacts/api-server/dist/index.mjs dist/index.mjs
cp artifacts/api-server/dist/index.mjs.map dist/index.mjs.map
cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY
cp -r artifacts/api-server/dist/public/. artifacts/api-server/web-static/
cp -r artifacts/api-server/dist/public/. artifacts/web-static/
cp -r artifacts/api-server/dist/public/. web-static/   # ← ROOT web-static — what Railway serves

# 5. Commit everything and push
```

**Three `web-static` directories that must all match:**
- `artifacts/api-server/web-static/` — input to api-server build
- `artifacts/web-static/` — secondary artifact ref
- `web-static/` (root) — **what static-server.mjs actually serves in production**

**WRONG order (caused the Safari crash):** running api-server build BEFORE step 2 embeds the old web bundle into dist, which then gets committed as both `dist/index.mjs` and root `web-static/index.html`.

**Railway cache note:** nixpacks step 5 (`cp -r artifacts/api-server/dist/public/. web-static/`) overwrites root `web-static/` on a fresh Railway build. But if Railway caches layers, it serves the committed `web-static/index.html` directly. Always commit root `web-static/index.html` with the correct bundle hash.

**`pg`/`drizzle` in the web bundle:** caused by any workspace package imported by the web that transitively depends on `@workspace/db`. Fixed by `@workspace/constants` (pure-data package, no Node deps). Confirmed clean bundle `index-BXPio9ZN.js`: normalizeQueryConfig=false, dataTypeID=false, DrizzleError=false.
