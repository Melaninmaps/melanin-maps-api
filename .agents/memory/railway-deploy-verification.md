---
name: Railway deploy verification — mandatory post-push checklist
description: PERMANENT PROCESS GATE. After every push to GitHub, these 5 steps are required before declaring anything deployed. Skipping them has cost a week of testing time.
---

# Railway Deploy Verification — Mandatory After Every Push

## The Recurring Failure Pattern
Replit commits code → assumes Railway auto-deploys → moves on → user discovers it didn't deploy.

## Why Railway Silently Fails to Deploy

1. **Docker layer cache** — Railway caches build layers. If the cache-bust token isn't updated, Railway serves the old binary.
2. **Build failures** — If the build step fails (missing dependency, TypeScript error, etc.), Railway silently falls back to the last successful deploy. No notification unless you check deploy logs.
3. **Deploy triggers** — Railway may be configured to only deploy from specific branches, may have deploy freezes active, or the webhook may have failed.
4. **Migrations are separate** — Database migrations don't run automatically just because code deploys. They need to be explicitly triggered (startup code, release phase). Push ≠ migrations ran.

## MANDATORY 5-Step Verification After Every Push

1. **Check Railway dashboard** → confirm a new deploy started (not just a restart of old code)
2. **Wait 2–4 minutes** for the deploy to complete
3. **Hit `/api/version`** → confirm `railway_sha` matches the commit SHA just pushed
4. **Hit `/api/readyz`** → confirm `status: ok`
5. **Test the specific feature** that was just deployed

**Never say "pushed and deployed" without completing step 3 (SHA match).**

## Railway API — How to Trigger a True Redeploy (Not Just Restart)

- `serviceInstanceRedeploy` = restarts the current binary in-place. Does NOT pull new code from GitHub.
- To deploy new code, Railway must detect a new GitHub commit and re-pull/rebuild.
- Use `serviceConnect(id, input: {branch:"main"})` to ensure GitHub integration is active.
- Project: `b98310f8-7bfa-4e43-a574-8819752e9cfe` (melanin-maps-api)
- Service: `a77b49bb-e448-4be8-9d02-de7a3b43136b` (api-server)
- Environment: `2292b38f-3d0d-4cad-92a4-ad36cabda629` (production)
- Postgres public URL host: `tokaido.proxy.rlwy.net:10066`

## Critical: Two Separate Databases

- `executeSql({ environment: "production" })` → queries **Replit's** production DB, NOT Railway's
- The production app at mappingwithmelanin.com uses **Railway Postgres** exclusively
- To query Railway Postgres directly, use the public proxy URL via Node.js `pg` client with `ssl: { rejectUnauthorized: false }`

## What Should Be Automated (GitHub Actions CI/CD)

A proper pipeline would:
- Build on push
- Run migrations
- Deploy
- Verify `/api/version` SHA matches
- Fail loudly if any step breaks

This is a one-time ~30-minute setup that eliminates the entire "it didn't actually deploy" failure class permanently.

**Why:** This failure pattern cost a week of testing time. The startup migration for admin promotion ran but Railway was serving old code. Executors must verify SHA before declaring success.
