---
name: Safety Experience Submissions Architecture
description: business_safety_submissions table, POST route, mobile onSubmit wire-up, dynamic confidence_score computation — all shipped Aug 11 2026
---

## What exists now

**DB table:** `business_safety_submissions`
- Columns: id (UUID PK), business_id, user_id, overall_safety (1-5), return_alone (1-5), would_recommend (1-5), belonging_rating, time_of_day, group_type, incident_occurred, incident_categories (text[]), incident_severity, comments, submitted_at
- Unique constraint: (user_id, business_id, DATE(submitted_at)) — one update per user per business per calendar day
- Created in startup-migrations.ts MIGRATIONS array (runs every boot, idempotent)

**API route:** `artifacts/api-server/src/routes/safety-experience.ts`
- POST `/businesses/:id/safety-experience` (requireAuth) — stores submission, recomputes `safety_rating` / `would_return_alone` / `recommendation_rate` live from all submissions, recomputes `confidence_score`
- GET `/businesses/:id/safety-experience/summary` (public) — returns live aggregate stats

**Confidence score formula (5 factors, 0-100):**
- Verification: 0 or 20 pts
- Avg safety rating: 0-25 pts (scales from 1-5 → 0-25)
- Recommendation rate: 0-20 pts (% of submissions where would_recommend >= 4)
- Review count: 0-20 pts (log10 scaled, caps at 101 reviews)
- Recency: 0-15 pts (falls off linearly over 60 days since last submission)

**Mobile wire-up:** `artifacts/mobile/app/business/[id].tsx`
- `handleSafetySubmit` function added at line ~215 (after `submitCaptionVotes`)
- POSTs to `/api/businesses/${id}/safety-experience`
- Calls `addLocal(10, "Shared safety experience")` on success
- Passed as `onSubmit` prop to `SafetyExperienceSurvey` at line ~2003

**Why:** Before this, `SafetyExperienceSurvey` collected data but no `onSubmit` was wired in business/[id].tsx — the data was discarded. The `businesses.safety_rating` / `would_return_alone` / `recommendation_rate` columns existed but were never updated from user surveys.

**How to apply:** When debugging safety stats showing 0 or not updating — check submissions in `business_safety_submissions` table first. The displayed stats on the business page come from this live table, not from the static `businesses` columns (those are now just the cached aggregates updated by the route).
