---
name: Railway deployment plan
description: Full context for Railway API deployment — what's live, what's blocked, exact next steps.
---

# Railway Deployment — Current State (July 13 2026)

## STATUS: API IS LIVE ON RAILWAY ✅

**Railway API URL:** `https://api-server-production-a991.up.railway.app/api/healthz` → returns `{"status":"ok"}`

## Railway project details
- Project ID: `b98310f8-7bfa-4e43-a574-8819752e9cfe`
- Service ID: `a77b49bb-e448-4be8-9d02-de7a3b43136b`
- Environment ID: `2292b38f-3d0d-4cad-92a4-ad36cabda629`
- Railway domain: `api-server-production-a991.up.railway.app`
- Railway CLI auth always fails (CLI v5 bug) — use GraphQL API only
- `serviceInstanceDeploy` with `latestCommit:true` = fresh build; `serviceInstanceRedeploy` = restart only (does NOT pull new code)

## Custom domains registered in Railway
- `api.melaninmaps.com` — registered, waiting for DNS CNAME
- `www.mappingwithmelanin.com` — registered, waiting for DNS CNAME

## Build details
- GitHub repo: `Melaninmaps/melanin-maps-api` (public)
- Bundle: pre-built `dist/index.mjs` (17.3MB) — esbuild ESM bundle
- @google-cloud/storage is BUNDLED (removed from externals) — no npm install needed for it
- @resvg/resvg-js uses dynamic import() — server boots without it
- Dockerfile in repo: copies dist/ only, no npm install (everything bundled)
- All 17 env vars set in Railway Variables tab

## DNS status (GoDaddy)
- `melaninmaps.com`: 22→23 records — CNAME `api` → Railway added ✅ (waiting propagation)
- `mappingwithmelanin.com`: BLOCKED — GoDaddy website builder has locked `www` CNAME
  - www A record (34.111.179.208) was deleted but `www` still conflicts
  - GoDaddy website builder (Draft site at mappingwithmelanin.godaddysites.com) controls www
  - FIX: Call GoDaddy 1-480-505-8877, say "disconnect mappingwithmelanin.com from website builder"
  - OR: GoDaddy dashboard → Website → disconnect domain from website builder

## Mobile app API URL
- `EXPO_PUBLIC_DOMAIN=www.mappingwithmelanin.com` (baked into EAS build via eas.json)
- Mobile app calls `https://www.mappingwithmelanin.com/api/...`
- Once www CNAME is added → mobile app works without a new build

## Website (melaninmaps.com / mappingwithmelanin.com)
- Web app (artifacts/web) IS running on Replit dev server
- Replit dev domain: `ac64a230-72f5-4194-b8b4-3ca827a772f9-00-ufj5aspnoap8.riker.replit.dev`
- Replit deployment broken (autoscale issue, .replit uneditable)
- Replit support (Deval) said: shut down Autoscale deployment → create new Reserved VM deployment
- mappingwithmelanin.com @ A records: 15.197.225.128 + 3.33.251.168 (old Replit IPs, broken)
- Railway has no fixed IPs (CDN) so can't use A record for root domain

## Next steps after www DNS is fixed
1. Test: `https://www.mappingwithmelanin.com/api/healthz` → should return `{"status":"ok"}`
2. Mobile app should work immediately (no new build needed)
3. For website: Follow Replit support advice — shut down Autoscale, create Reserved VM deployment
   OR deploy artifacts/web to Railway as a second service

## Why Replit deployment is broken
`.replit` has `deploymentTarget = "autoscale"` — cannot be edited by agent (platform-blocked).
Every publish creates Autoscale which fails. Replit support ticket #466152 open.
Fix per Replit support: shut down current deployment → new deployment → select Reserved VM.
