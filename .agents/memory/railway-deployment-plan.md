---
name: Railway deployment plan
description: Full context for migrating API server from Replit to Railway — root causes, what was tried, and exact steps to execute next session.
---

# Railway Deployment — Next Session Plan

## Why Replit deployment is broken (root cause)
`.replit` has `deploymentTarget = "autoscale"` — agent CANNOT edit this file (blocked by platform). Every Replit publish attempt creates an Autoscale service which then fails. Replit support ticket #466180 open; Quinn escalated to a teammate who "can investigate the Autoscale hang directly." May be fixed overnight.

## Code fixes already made (committed)
- `lib/db/src/index.ts` — converted to lazy Proxy; no longer throws at module load time when DATABASE_URL is absent
- `lib/integrations-openai-ai-server/src/client.ts` — same lazy Proxy pattern
- `lib/integrations-openai-ai-server/src/image/client.ts` — same
- `lib/integrations-openai-ai-server/src/audio/client.ts` — same
- `artifacts/api-server/src/app.ts` — added `/healthz` and `/health` endpoints alongside `/api/healthz`
- `artifacts/api-server/.replit-artifact/artifact.toml` — run command uses `bash -c "cd /home/runner/workspace && node ..."`, initialDelaySeconds=10

## Railway account state
- RAILWAY_TOKEN secret is set in Replit (36-char UUID, workspace "melaninmaps's Projects")
- Railway project created: id=`b98310f8-7bfa-4e43-a574-8819752e9cfe`, name=`melanin-maps-api`
- Production environment: id=`2292b38f-3d0d-4cad-92a4-ad36cabda629`
- Railway CLI `whoami` ALWAYS fails (CLI v5.26 bug with account tokens); GraphQL API at `https://backboard.railway.app/graphql/v2` works fine with Bearer token
- `railway up` also fails — CLI auth is completely broken for this token type

## Railway deployment path (to execute next session)
The blocker was getting code TO Railway. Options in order of preference:
1. **GitHub → Railway** (recommended): User creates GitHub PAT with `repo` scope at github.com/settings/tokens → add as GITHUB_TOKEN secret → agent creates repo + pushes → Railway connects to GitHub repo in web UI → auto-deploys
2. **Docker image**: Build image, push to registry, Railway deploys from image (complex)

## Railway env vars needed
All of these must be set in Railway's environment variables UI or via API:
- DATABASE_URL (Replit production DB — get from Replit secrets or reconnect a new Railway DB)
- SESSION_SECRET
- GOOGLE_MAPS_API_KEY
- RESEND_API_KEY
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID
- DOCUSIGN_RSA_PRIVATE_KEY, DOCUSIGN_USER_ID
- REVENUECAT_API_KEY, REVENUECAT_API_KEY_V2
- WMATA_API_KEY
- DEFAULT_OBJECT_STORAGE_BUCKET_ID, PRIVATE_OBJECT_DIR, PUBLIC_OBJECT_SEARCH_PATHS
- REPLIT_DOMAINS (set to mappingwithmelanin.com or the Railway domain)
- Note: AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY are Replit-managed — Railway will need Replit AI integration credentials OR these features won't work

## Build + run commands for Railway
- Build: `pnpm --filter @workspace/api-server run build`
- Start: `node artifacts/api-server/dist/index.mjs`
- Port: 8080 (set PORT=8080 env var in Railway)
- Health check: `/api/healthz`

## DNS
- melaninmaps.com is at GoDaddy
- After Railway deploy succeeds, update GoDaddy DNS: CNAME www → Railway domain, A record @ → Railway IP
- mappingwithmelanin.com is the custom domain (in replit.md)

## IF Replit fixed the issue overnight
Check email from Quinn's team. If fixed, try Republish in Replit before starting Railway migration — it may be much simpler.
