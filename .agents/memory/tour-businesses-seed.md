---
name: Tour Businesses Seed
description: 556 tour businesses from MWM Cultural Guide PDFs seeded into production via ensureTourBusinesses boot guard; city profiles with brief welcome contexts for 30+ cities.
---

## What was built

- `artifacts/api-server/src/data/tour-businesses-seed.ts` — 556 businesses from 3 Tour Cultural Guide PDFs (East Coast Tour Parts 1-3), extracted and formatted.
- `ensureTourBusinesses()` guard in `startup-migrations.ts` — deduplicates by `LOWER(name)|LOWER(city)|LOWER(state)`, inserts with `listing_status = 'live_unclaimed'`, runs sequentially on every boot.
- `city_profiles_tour_brief_context_v1` migration — UPSERTs `brief_context` (1-2 warm sentences) + `historical_context` (full story) for 30+ cities. Only updates if `brief_context` is NULL or empty (preserves manual edits).

## City welcome architecture (already existed, now populated)

- `city_profiles` table — `brief_context` (1-2 sentence warm welcome) + `historical_context` (full "learn more" story)
- `user_city_welcome_dismissals` table — `(user_id, city_slug)` unique pair; tracks per-user first visit
- `GET /cities/:slug/welcome` — returns brief card + `has_seen` boolean
- `POST /cities/:slug/welcome/dismiss` — marks it seen, never shows again for that user
- KinfolkAI injects `city_profiles.brief_context` via `buildSystemPrompt({ cityContext })`

## Cities with brief_context seeded
Philadelphia, Washington DC, Richmond, Charlotte, Columbia SC, Atlanta, Montgomery, Birmingham, New Orleans, Houston, Baltimore, NYC, Newark, Baton Rouge, Mobile, Las Vegas, Nashville, San Antonio, Phoenix, Portland, Kansas City, Tampa, Tuskegee, Jacksonville, Orlando, Memphis, Cleveland, LA, Denver, Savannah, Chicago, Indianapolis, Milwaukee, Seattle, Columbus, Cincinnati, Norfolk, Dallas, Oakland, Tulsa, Jackson MS, Detroit, St. Louis, Boston, Hartford.

## Deploy note
- Pushed to GitHub (remote `github`) — Railway auto-deploys from `main` branch
- Mandatory two-commit pattern followed: source+dist commit → empty rebuild-from-HEAD commit
- `ensureTourBusinesses` is idempotent on every reboot

**Why:** Boot guard pattern avoids one-time migration failures and ensures data stays present even after Railway redeploys or DB restores.
