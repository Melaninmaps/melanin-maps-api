---
name: Web build pipeline — web-static sync required
description: How web Vite source changes get into Railway production; THREE paths must be synced before committing or Railway serves a stale frontend.
---

## The pipeline (ALL steps required — skipping any one causes stale deploy)

1. `pnpm --filter @workspace/web run build` → outputs to `artifacts/web/dist/public/`
2. Sync to ALL THREE paths Railway reads from:
   ```sh
   rm -rf web-static/assets && cp -r artifacts/web/dist/public/. web-static/
   rm -rf dist/public && mkdir -p dist/public && cp -r artifacts/web/dist/public/. dist/public/
   rm -rf artifacts/api-server/web-static/assets && cp -r artifacts/web/dist/public/. artifacts/api-server/web-static/
   ```
3. `pnpm --filter @workspace/api-server run build` → embeds web static + builds dist/index.mjs
4. `cp artifacts/api-server/dist/index.mjs dist/index.mjs` (+ .map + BUILD_IDENTITY)
5. Commit everything: web-static/, dist/public/, artifacts/api-server/web-static/, dist/index.mjs

## Why THREE paths, not one

Railway serves frontend from root `/app/web-static/` (what `static-server.mjs` mounts).
nixpacks step 5 (`cp -r artifacts/api-server/dist/public/. web-static/`) overwrites this at build time.
But if the nixpacks web build layer is CACHED, `artifacts/api-server/dist/public/` is stale.
Result: Railway overwrites `web-static/` with the OLD build, even though it deployed the right SHA.

By committing the fresh build to ALL THREE locations, Railway serves the right files regardless
of whether nixpacks rebuilds or hits cache. Both paths converge on correct output.

## Root cause of the recurring stale-frontend bug (Aug 7 2026)

- nixpacks web build layer was cached (old `index-DGJYG9lx.js` served)
- api-server backend rebuild DID run (admin seed endpoints worked — seeds returned 200 OK)
- `stale_bundle: true` and `built_from_sha` two commits behind HEAD were the signals
- `bundle_sha256_self === bundle_sha256` (stale_bundle: false) confirms clean deploy
- New `deploymentId` (not reused) confirms Railway created a fresh deployment

**Why:** nixpacks caches individual build steps based on file hash of inputs. When web
source file hashes didn't change enough to bust the layer, it reused the old web output.
Committing the fresh build to all three paths makes the committed state correct regardless.

## Verification checklist after every web push

```sh
# 1. SHA matches HEAD
curl -s https://www.mappingwithmelanin.com/api/version | python3 -m json.tool
# Expect: railway_sha=HEAD, stale_bundle=false, bundle_sha256_self===bundle_sha256

# 2. Live JS bundle contains the new code
LIVE_JS=$(curl -s https://www.mappingwithmelanin.com/ | grep -oP '/assets/index-[^"]+\.js' | head -1)
curl -s "https://www.mappingwithmelanin.com${LIVE_JS}" | grep -c "YOUR_NEW_STRING"
# Expect: 1 (or more)
```

## nixpacks.toml token update rule

Update BOTH tokens (`ship-YYYYMMDD-HHMMSS-web` AND `ship-YYYYMMDD-HHMMSS-api`) on every push
that touches web source. But do NOT rely on these alone — always commit to all three paths.

## Binary file contamination

`cp -r artifacts/web/dist/public/` will copy any `.zip`/`.ipa`/`.apk` files if they exist
in the web public directory. Always strip them after the sync. The `.gitignore` in
`artifacts/api-server/web-static/` blocks them at the git level as a safety net.
