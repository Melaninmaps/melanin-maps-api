---
name: Web-static committed bundle pattern
description: Why we commit the Vite build output to git instead of rebuilding on Railway
---

## The Rule

The compiled Vite frontend output (web-static/) MUST be committed to git on every web change.
Railway's nixpacks build must NOT rebuild the web from source — it uses the committed files.

## Why

Railway's Docker BuildKit layer cache stales the web build step even when the echo-token
string in nixpacks.toml changes. Evidence: Aug 10 2026 audit — Library still showed
"Feed/Articles coming soon" and KinfolkOnboarding never appeared even though the correct
source files were committed and the api-server rebuilt correctly.

## How to apply on every web change

1. Edit web source files
2. `pnpm --filter @workspace/web build`
3. `rm -rf web-static && cp -r artifacts/web/dist/public/. web-static/`
4. `git add -f web-static/ && git add artifacts/api-server/dist/ dist/`
5. Commit source + web-static + api-server dist together

## nixpacks.toml approach (post-fix)

cp committed web-static → artifacts/api-server/web-static, then build api-server only.
No web rebuild step. The api-server build step uses git rev-parse HEAD in its echo so
its Docker layer is unique per commit (immune to BuildKit cache).
