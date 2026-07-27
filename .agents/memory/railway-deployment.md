---
name: Railway production deployment
description: API server live at www.mappingwithmelanin.com via Railway; key IDs, DNS records, crash fix, and domain verification steps.
---

## Production Architecture Stack

| Layer           | Provider                        |
|-----------------|----------------------------------|
| API server      | Railway (`a77b49bb`)            |
| Production DB   | **Neon** serverless PostgreSQL  |
| Mobile apps     | Expo / EAS                      |
| Web frontend    | Railway (same service)          |
| Object storage  | Replit Object Storage           |

### Neon DB fingerprint (confirmed from production query)
- IP returned by `inet_server_addr()`: `169.254.254.254` (Neon link-local proxy)
- Database name: `neondb`
- PostgreSQL version: 16.14 (aarch64)
- **NOT Railway Postgres** — do not assume Railway internal `.internal` hostname for DB

### Neon cold-start behavior
- Neon suspends compute after ~5 minutes with no active connections
- Wake-up on new connection: 1–5 seconds
- `pg.Pool` default `idleTimeoutMillis: 10000` (10s) was dropping connections constantly → repeated cold starts
- Fix: set `idleTimeoutMillis: 300000` (5 min) + `connectionTimeoutMillis: 10000` + `keepAlive: true`
- Pool config lives in `lib/db/src/index.ts`

## Railway Service IDs
- Project: `b98310f8-7bfa-4e43-a574-8819752e9cfe`
- Service: `a77b49bb-e448-4be8-9d02-de7a3b43136b`
- Environment: `2292b38f-3d0d-4cad-92a4-ad36cabda629`
- Service domain: `api-server-production-a991.up.railway.app`

## GitHub source
- Repo: `Melaninmaps/melanin-maps-api` branch `main`
- Deploys via Dockerfile (auto-detect, null buildCommand, null startCommand)
- NIXPACKS builds FAIL for this repo; always use DOCKERFILE or null builder

## What fixed the crash
- Empty string PORT env var (`""`) was explicitly set in Railway vars
- `index.ts` does `process.env["PORT"] ?? "8080"` — `??` doesn't catch `""`, so `Number("") = 0 → throw`
- Fix: deleted PORT from Railway vars so Railway auto-injects correct PORT

## DNS (GoDaddy mappingwithmelanin.com)
- `www` CNAME → `z306ftl5.up.railway.app` (Railway's CNAME target for this domain)
- `_railway-verify.www` TXT → `railway-verify=bf7f36498aacc71364fc57ec5cf19c7222431cc7801ecb32ecf198e629057e3a`
- Both records are propagated
- GoDaddy Website Builder does NOT block /api traffic — www routes correctly to Railway

## Custom domain IDs
- `www.mappingwithmelanin.com` id: `a7b92ed1-9d50-4002-be66-a50ca4c01125` (re-created after delete+re-add to force verification)
- `api.melaninmaps.com` id: `275a707d-6a5f-4976-a831-7b9959f3ee76`

## Deployment working state
- Builder: NIXPACKS (auto-detect), buildCommand: null, startCommand: null
- Deploy `9b60ab95` is SUCCESS and the active production deploy
- `https://www.mappingwithmelanin.com/api/healthz` → `{"status":"ok"}`
- SSL cert: Let's Encrypt via Railway, verified and valid

## Stripe env var fix (critical for Railway)
- `stripeClient.ts` originally read ONLY from Replit Connectors (`REPLIT_CONNECTORS_HOSTNAME`), which doesn't exist in Railway
- Fix: check `process.env.STRIPE_SECRET_KEY` first; fall back to Replit Connectors if not set
- Also reads `process.env.STRIPE_WEBHOOK_SECRET` as the env-var path for the webhook secret
- Railway env vars `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are now correctly consumed

## Railway smoke suite status (pre-fix deployment)
- PASS: healthz, businesses, stripe/webhook (no-sig→400, invalid-sig→400), register, auth/user, community/posts, kinfolk/preferences, login-email
- FAIL (Stripe key not read): stripe/products (500), membership/plan (500)
- FAIL (Cloudflare WAF blocks POST to /api/revenuecat/webhook): revenuecat/webhook (404 HTML)
- NOTE: RC webhook 404 is acceptable — REVENUECAT_WEBHOOK_AUTH_KEY intentionally omitted for Community Beta 2; Cloudflare WAF blocks /api/revenuecat/webhook POSTs

## membership/plan defensive fix
- family_add_on_seats query wrapped in try/catch; logs warning and defaults to 0 on failure
- Prevents a missing/mismatched table in Railway DB from bringing down the whole plan endpoint

## Domain verification gotcha
- `verified: false` blocks Railway edge routing even if cert is valid and CNAME is propagated
- TXT record `_railway-verify.www` is ALSO required — GoDaddy host value is `_railway-verify.www` (not the full FQDN)
- If domain gets stuck `verified: false`: delete custom domain via GraphQL and immediately re-add it — triggers fresh verification check against already-propagated DNS

## Railway GraphQL API
- Endpoint: `https://backboard.railway.com/graphql/v2`
- Auth: `Authorization: Bearer $RAILWAY_TOKEN`
- Key mutations: `customDomainCreate`, `customDomainDelete`, `customDomainIssueCertificate`, `variableDelete`, `serviceInstanceUpdate`, `serviceInstanceDeploy`, `deploymentRollback`
