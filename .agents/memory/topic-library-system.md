---
name: Topic Library System
description: Comprehensive topic subscription, delivery preferences, follow-an-issue, and admin topic management console built on top of the existing knowledge infrastructure.
---

## What was built

### DB tables added to `lib/db/src/schema/knowledge.ts`
- `knowledgeTopicsTable` — added columns: `keywords text[]`, `synonyms text[]`, `trustedSources jsonb`, `notificationPriority varchar`, `parentCategory varchar`
- `userDeliveryPreferencesTable` — userId PK, digestMode (daily/weekly/breaking/immediate), scope (local/national/global/all), includeSavedCities bool, includeSavedBusinesses bool
- `topicIssuesTable` — id, name, description, category, keywords text[], isActive, timestamps
- `userIssueFollowsTable` — userId + issueId with unique constraint

### API routes
- New file: `artifacts/api-server/src/routes/knowledge-delivery.ts` (registered in index.ts)
  - `GET/PUT /api/knowledge/delivery-preferences`
  - `GET /api/knowledge/issues` — public, with isFollowing flag if authed
  - `POST/DELETE /api/knowledge/issues/:id/follow`
  - `GET /api/knowledge/digest` — AI-generated personalized KinfolkAI briefing via OpenAI
- Admin routes added to `artifacts/api-server/src/routes/admin.ts`:
  - `GET/POST /api/admin/topics`
  - `PUT /api/admin/topics/:id`
  - `POST /api/admin/topics/seed` — seeds 70+ topics with trusted sources + keywords (idempotent)
  - `GET/POST /api/admin/topics/issues`
  - `PUT /api/admin/topics/issues/:id`
  - `POST /api/admin/topics/issues/seed` — seeds 20 followable issues (idempotent)

### Mobile
- `artifacts/mobile/app/(tabs)/library.tsx` — rewrote to 3-tab UI:
  - **My Library**: KinfolkAI digest banner, following pills (topics + issues), Smart Delivery prefs section (4 digest modes, 4 scope modes, saved-city/business toggles), feed cards, experts
  - **Browse Topics**: search, follow/unfollow topics
  - **Issues**: issue search + follow/unfollow issues
- `artifacts/mobile/app/admin.tsx` — added "Topics Library" tab with `TopicsTab` component:
  - Seed All Topics / Seed All Issues buttons
  - Topic list with enable/disable toggles + follow counts
  - Issue list with active/inactive toggles
  - Add Topic modal + Add Issue modal

### Trusted sources principle
Each topic has `trustedSources jsonb` — an array of `{name, domain}` objects from reputable institutions:
- Health → CDC, NIH, Black Women's Health Imperative, Office of Minority Health
- Business → SBA, SCORE, Black Enterprise, NMSDC
- Civil Rights → NAACP, ACLU, Equal Justice Initiative
- Education → UNCF, US Dept of Education, HBCU Digest
- Safety → FEMA, FDA, FTC Consumer Info, CISA
- Government → Congress.gov, Brennan Center, SCOTUS Blog

**Why:** Trusted sources prevent misinformation by anchoring each topic to reputable, domain-specific institutions.

## Important patterns
- Seed endpoints are idempotent: they check `lower(topicName)` before inserting, so running twice is safe.
- The admin console seed buttons live in admin.tsx → TopicsTab; run seed from admin panel before users can browse topics.
- `GET /api/knowledge/digest` uses OpenAI but explicitly instructs the model NOT to fabricate specific news events — it generates a "watch for" briefing only.
