---
name: Web build pipeline — web-static sync required
description: How web Vite source changes get into Railway production; a manual sync step is required before committing.
---

## The pipeline (4 steps, all required)

1. `pnpm --filter @workspace/web run build` → outputs to `artifacts/web/dist/public/`
2. `cp -r artifacts/web/dist/public/. artifacts/api-server/web-static/` then strip binaries:
   `find artifacts/api-server/web-static -name '*.zip' -o -name '*.ipa' -o -name '*.apk' | xargs rm -f`
3. `pnpm --filter @workspace/api-server run build` → copies web-static → api-server/dist/public + builds dist/index.mjs
4. Force-commit `dist/index.mjs`, `dist/BUILD_IDENTITY`, `artifacts/api-server/dist/public/`, `artifacts/api-server/web-static/`

## nixpacks.toml now runs all 4 steps automatically
Railway's nixpacks pipeline now includes the web Vite build as step 1.
The prebuild cache-bust SHA must be updated on every push that touches web source.

## Why this exists
Railway's nixpacks build previously only ran `pnpm --filter @workspace/api-server run build`.
Web source changes (pages, content, components) were never reflected in production unless
manually rebuilt locally and the output committed. This caused a Build 99 regression where
Philadelphia content (home.tsx) was invisible in production because the old Vite bundle
(with Charlotte) was still being served.

**Why:** `artifacts/api-server/build.mjs` copies from `artifacts/api-server/web-static/` — NOT
from `artifacts/web/dist/public/` directly. The web-static directory is the bridge.

## How to apply
Any time `artifacts/web/src/**` changes:
1. Run the full 4-step pipeline locally
2. Verify: `grep -o "YourNewContent" artifacts/api-server/dist/public/assets/index-*.js`
3. Commit all output files and push
4. Railway will serve the committed bundle immediately (nixpacks rebuild also works now)

## Binary file contamination
`cp -r artifacts/web/dist/public/` will copy any `.zip`/`.ipa`/`.apk` files if they exist
in the web public directory. Always strip them after the sync. The `.gitignore` in
`artifacts/api-server/web-static/` blocks them at the git level as a safety net.
