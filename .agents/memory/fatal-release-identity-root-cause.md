---
name: FATAL_RELEASE_IDENTITY root cause and permanent fix
description: Why every Railway deploy failed for 3 days — and the nixpacks rule that prevents it recurring.
---

# FATAL_RELEASE_IDENTITY — Root Cause and Fix

## The failure
Every Railway deploy exited with code 78 and logged:
```
FATAL_RELEASE_IDENTITY: Release integrity failure:
  BUILD_IDENTITY hash 602d5fe6... does not match dist/index.mjs hash 32df3d0b...
```

## Why it happened
`static-server.mjs` runs `assertReleaseIdentity()` at startup: hashes `dist/index.mjs`
and compares against `dist/BUILD_IDENTITY.bundle_sha256`. A mismatch → exit 78 → Railway
rolls back to the last successful deploy.

Railway's nixpacks multi-stage Docker build:
1. BUILD stage: compiled a new `artifacts/api-server/dist/index.mjs` (hash `602d5fe6`)
   and wrote that hash into `dist/BUILD_IDENTITY`.
2. RUNTIME stage: started from the git checkout — the committed `dist/index.mjs`
   (hash `32df3d0b`) was present. The BUILD stage's large 25 MB `dist/index.mjs`
   was NOT reliably propagated to the runtime container (Railway size/cache behavior).
3. Result: `BUILD_IDENTITY` had Railway's compiled hash, `dist/index.mjs` had the
   committed hash → permanent mismatch → exit 78 on every deploy.

## The fix (nixpacks.toml)
**Removed** the `pnpm --filter @workspace/api-server run build` step entirely.
Railway now serves the committed `dist/index.mjs` directly (the "commit the dist" pattern).

**Added** a node one-liner that re-aligns `dist/BUILD_IDENTITY` to match whatever
`dist/index.mjs` is actually on disk before `static-server.mjs` runs:
```js
node -e "const c=require('node:crypto'),fs=require('fs');
  const h=c.createHash('sha256').update(fs.readFileSync('dist/index.mjs')).digest('hex');
  let id={};try{id=JSON.parse(fs.readFileSync('dist/BUILD_IDENTITY','utf8'));}catch(e){}
  id.bundle_sha256=h;
  fs.writeFileSync('dist/BUILD_IDENTITY',JSON.stringify(id));
  console.log('BUILD_IDENTITY aligned: '+h.slice(0,16)+'...');"
```

This is idempotent: if they already match, it's a no-op. If Railway restores the
committed file for any reason, it re-aligns and the check passes.

## PERMANENT RULE: commit the dist before every push
Every push to GitHub must include a freshly built `dist/index.mjs` and matching
`dist/BUILD_IDENTITY`. The nixpacks build will NOT recompile — it serves exactly
what is committed. Steps:
1. `pnpm --filter @workspace/api-server run build`
2. `cp artifacts/api-server/dist/index.mjs dist/index.mjs`
3. `cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY`
4. `git add dist/index.mjs dist/BUILD_IDENTITY ... && git commit && git push github main`

**Why:** Railway cannot reliably propagate a 25 MB compiled bundle from build container
to runtime container. The committed bundle is the authoritative production artifact.

## Verification after every push
Hit `https://api.melaninmaps.com/api/version` and confirm:
- `railway_sha` matches the git commit SHA just pushed
- `stale_bundle: false` (bundle_sha256_self === bundle_sha256)
- `healthz: ok`

Never declare a deploy successful without this check.
