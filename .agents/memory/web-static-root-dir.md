---
name: Root web-static directory — what Railway actually serves
description: static-server.mjs serves root /app/web-static/; ALL client bundle updates must go to BOTH artifacts/api-server/web-static/ AND root web-static/ or Railway serves the stale bundle.
---

# Root web-static — Production Serving Rule

## The rule

`static-server.mjs` serves files from the **repository-root `web-static/`** directory:

```js
const cwdPath = path.join(process.cwd(), "web-static");
app.use(express.static(WEB_STATIC, ...));
```

nixpacks also copies root `web-static/` into the server asset directory during build.

## Every web bundle update requires TWO directory updates

1. `artifacts/api-server/web-static/` — updated by Vite cp step
2. **Root `web-static/`** — the directory Railway actually serves — MUST also be updated

```bash
# After cp -r artifacts/web/dist/public/. artifacts/api-server/web-static/:
cp artifacts/api-server/web-static/index.html web-static/index.html
cp artifacts/api-server/web-static/assets/<new-bundle>.js  web-static/assets/<new-bundle>.js
cp artifacts/api-server/web-static/assets/<new-bundle>.css web-static/assets/<new-bundle>.css
git add web-static/index.html web-static/assets/<new-bundle>.js web-static/assets/<new-bundle>.css
```

**Why:** Updating only `artifacts/api-server/web-static/` leaves root `web-static/index.html`
pointing to the OLD bundle name. Browser loads the old JS even though the new one exists.

## Verification before every push

```bash
grep -o '/assets/index-[A-Za-z0-9_-]*.js' web-static/index.html
# Must match the bundle currently in artifacts/api-server/web-static/index.html
```

## Root cause of three consecutive Manus failures (Aug 12 2026)

All three commits (7ff14077, c71e71bd, 7fe9d271) updated `artifacts/api-server/web-static/`
but NOT root `web-static/`. The bundle fix was correct every time — it just never reached
the serving directory. Manus saw `index-BU5DZ52C.js` (the pre-fix bundle) in every round
because that filename was still in root `web-static/index.html`.

Fix applied in `7fe9d271`: copy 3 files (index.html + bundle.js + bundle.css) to root web-static.

## Permanent checklist addition to nixpacks-deploy-checklist.md

After step "sync root dist/":
- ALSO copy root web-static files: index.html + new JS + new CSS
- Verify: `grep 'index-' web-static/index.html` matches new bundle
- Commit ALL changed files in BOTH directories before pushing
