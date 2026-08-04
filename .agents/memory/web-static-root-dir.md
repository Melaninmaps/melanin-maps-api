---
name: Root web-static directory — what Railway actually serves
description: static-server.mjs serves from /app/web-static/ (repo root), NOT artifacts/api-server/web-static/ or dist/public/. Must be kept in sync on every Railway deploy.
---

# Root web-static Directory

## The Rule
`static-server.mjs` looks for `web-static/` in `__dirname` or `process.cwd()`. On Railway, this resolves to `/app/web-static/` — the `web-static/` directory **at the repo root**, not `artifacts/api-server/web-static/`.

**Why:** `artifacts/api-server/web-static/` is used by the API server's `build.mjs` to embed the SPA HTML and copy to `dist/public/`. But `static-server.mjs` serves from the root-level `web-static/` which is a separate path.

## What Goes Wrong Without This
- Root `web-static/` stays frozen at whatever was last committed to it
- Railway's nixpacks build correctly regenerates `artifacts/api-server/dist/public/` with new bundle hashes, but the root `web-static/` never updates
- Users see old JavaScript bundles (e.g., new routes like `/preview` are missing)

## The Fix (already in nixpacks.toml)
nixpacks.toml step 5 now syncs on every deploy:
```
cp -r artifacts/api-server/dist/public/. web-static/
```

## Standalone Pages at Clean URLs
`express.static()` requires `extensions: ['html']` to serve `preview.html` at `/preview` (without the `.html` extension). Without this option, `/preview` falls through to the SPA index.html fallback.

```javascript
app.use(express.static(WEB_STATIC, { extensions: ["html"] }));
```

**How to apply:** Any time a standalone HTML file needs to be accessible at a clean URL (e.g., `/preview`, `/landing`), this option must be set AND the file must be in the root `web-static/` directory.
