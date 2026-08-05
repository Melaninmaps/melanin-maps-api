---
name: Railway dist-commit pattern
description: Why dist/index.mjs must be committed to git on every push, and how to do it correctly.
---

## The Rule

After every `pnpm build` that changes the api-server, you MUST commit the compiled `dist/index.mjs` and `dist/BUILD_IDENTITY` to git alongside the source files. Do NOT push source-only.

## Why

`dist/index.mjs` is already tracked by git (force-added historically — even though `dist` is in `.gitignore`, git continues tracking tracked files). When Railway receives a new commit, it checks out the repo, which delivers whatever `dist/index.mjs` is in git. Nixpacks then runs the build steps, but the build step for api-server (`pnpm build`) uses Docker layer caching. If the Docker layer cache hits, it does NOT rebuild `artifacts/api-server/dist/index.mjs`, and the nixpacks cp step (step 4) copies the CACHED old bundle — overwriting the correctly checked-out dist with the old one.

Committing the freshly built `dist/index.mjs` directly to git means Railway always has the correct bundle in the checkout, making it resilient to nixpacks cache hits.

## How to apply

On every push that changes api-server source code:

```bash
# 1. Update buildIdentity.ts with current HEAD
CURRENT_SHA=$(git rev-parse HEAD)
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
# (build.mjs does this automatically during pnpm build)

# 2. Rebuild
cd artifacts/api-server && pnpm build && cd ../..

# 3. Sync to root dist
cp artifacts/api-server/dist/index.mjs dist/index.mjs
cp artifacts/api-server/dist/BUILD_IDENTITY dist/BUILD_IDENTITY

# 4. Force-add (gitignore covers dist/ but these files are already tracked)
git add -f dist/index.mjs dist/BUILD_IDENTITY artifacts/api-server/src/generated/buildIdentity.ts

# 5. Commit source + dist together, then push
git commit -m "Your message" && git push github main
```

## Signal to check

After a Railway deploy, hit `/api/version`:
- `railway_sha` should match the latest git SHA
- `built_from_sha` should match the same commit (or the one before if you committed dist separately)
- `stale_bundle` should be `false`

If `built_from_sha` is older than `railway_sha`, Railway is serving a cached bundle — use this pattern to fix it.

**Why stale_bundle: false is misleading:** stale_bundle only compares the bundle's SHA256 against itself (the running file vs the baked-in hash). It will always be false as long as the file isn't replaced at runtime. It does NOT indicate whether the bundle matches the current git commit.
