---
name: Railway deployment plan
description: Full context for Railway API deployment — what's live, what's blocked, exact next steps.
---

# Railway Deployment — Current State (July 15 2026)

## STATUS: API IS LIVE ON RAILWAY ✅ — v1.1.3 deployed July 15 2026

**Railway API URL:** `https://api-server-production-a991.up.railway.app/api/healthz` → returns `{"status":"ok"}`
**Vibe search confirmed live:** `GET /api/vibes/list` returns full vibe list ✅

## Railway project details
- Project ID: `b98310f8-7bfa-4e43-a574-8819752e9cfe`
- Service ID: `a77b49bb-e448-4be8-9d02-de7a3b43136b`
- Environment ID: `2292b38f-3d0d-4cad-92a4-ad36cabda629`
- Railway domain: `api-server-production-a991.up.railway.app`
- Railway CLI auth always fails (CLI v5 bug) — use GraphQL API only
- `serviceInstanceDeploy` with `latestCommit:true` = fresh build; `serviceInstanceRedeploy` = restart only (does NOT pull new code)

## How to redeploy
1. Build: `pnpm --filter @workspace/api-server run build` (from Replit workspace root)
2. Push dist to GitHub: clone `Melaninmaps/melanin-maps-api`, copy dist/, commit, push (requires PAT — password auth disabled)
3. Trigger Railway: `curl -X POST https://backboard.railway.app/graphql/v2 -H "Authorization: Bearer RAILWAY_TOKEN" -d '{"query":"mutation { serviceInstanceDeploy(serviceId: \"a77b49bb-e448-4be8-9d02-de7a3b43136b\", environmentId: \"2292b38f-3d0d-4cad-92a4-ad36cabda629\", latestCommit: true) }"}'`
4. Verify: `curl https://api-server-production-a991.up.railway.app/api/vibes/list`

## Custom domains registered in Railway
- `api.melaninmaps.com` — registered, waiting for DNS CNAME
- `www.mappingwithmelanin.com` — registered, waiting for DNS CNAME

## Build details
- GitHub repo: `Melaninmaps/melanin-maps-api` (public)
- Bundle: pre-built `dist/index.mjs` (~17.8MB) — esbuild ESM bundle
- @google-cloud/storage is BUNDLED (removed from externals) — no npm install needed for it
- @resvg/resvg-js uses dynamic import() — server boots without it
- Dockerfile in repo: copies dist/ only, no npm install (everything bundled)
- All 17 env vars set in Railway Variables tab

## DNS status (GoDaddy)
- `melaninmaps.com`: CNAME `api` → Railway added ✅
- `mappingwithmelanin.com`: BLOCKED — GoDaddy website builder has locked `www` CNAME
  - FIX: Call GoDaddy 1-480-505-8877, say "disconnect mappingwithmelanin.com from website builder"
  - OR: GoDaddy dashboard → Website → disconnect domain from website builder

## Mobile app API URL
- `EXPO_PUBLIC_DOMAIN=www.mappingwithmelanin.com` (baked into EAS build via eas.json)
- Mobile app calls `https://www.mappingwithmelanin.com/api/...`
- Once www CNAME is added → mobile app works without a new build

## Website (melaninmaps.com / mappingwithmelanin.com)
- Replit deployment broken (autoscale issue, .replit uneditable)
- Replit support (Deval) said: shut down Autoscale deployment → create new Reserved VM deployment
- mappingwithmelanin.com @ A records: 15.197.225.128 + 3.33.251.168 (old Replit IPs, broken)
- Railway has no fixed IPs (CDN) so can't use A record for root domain
- Fix: shut down current Autoscale → new Reserved VM deployment OR deploy artifacts/web to Railway as second service
