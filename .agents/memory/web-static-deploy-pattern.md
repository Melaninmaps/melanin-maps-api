---
name: Web-static deploy pattern — MANDATORY for any library.tsx / frontend change
description: Every frontend change requires building the web and committing web-static/ to git. Railway does NOT rebuild the web from source — it serves committed files. Missing this step causes the live site to serve stale frontend code silently.
---

## Rule

Any change to `artifacts/web/src/**` MUST also commit updated `web-static/` files or Railway serves the old frontend forever, with no error or warning.

**Why:** nixpacks.toml documents this explicitly: "Railway does NOT rebuild the web from source — it uses the committed web-static/ directory." The `stale_bundle` health check only covers the api-server bundle, NOT the web frontend. There is no equivalent signal for stale web-static.

**How to apply:** After any frontend change, before committing:

```bash
pnpm --filter @workspace/web run build
# CRITICAL: source is dist/public/, not dist/ — one level deeper
cp -r artifacts/web/dist/public/. web-static/
git add web-static/
# then add api-server dist files and commit all together
```

Sync path: `artifacts/web/dist/public/.` → `web-static/`  
NOT: `artifacts/web/dist/` (one level too high — assets land in wrong subdirectory)

## What went wrong (Aug 12 2026)

Four consecutive P0 repair rounds (r1–r4) fixed `library.tsx` source code correctly, built the web locally for TS checks, but never committed `web-static/`. Railway served the original broken frontend in every round. Manus independently confirmed the live site failed the web deep-link check each time despite correct source code and correct api-server bundle. The `stale_bundle: false` signal from `/api/version` gave false confidence — it only validates the api-server JS bundle, not the web frontend assets.

## Signals that web-static is stale

- Frontend bug persists after a confirmed "correct source + stale_bundle:false" deploy
- `/api/version` says `built_from_sha` matches feature commit, but behavior is unchanged
- `git diff --cached --name-only | grep web-static` returns nothing after a frontend change
