---
name: Admin Business Entry Tool + Media Upload
description: Admin-only business creation form with photo/video upload and social link attachment; tour workflow
---

## What was built

### API Endpoints (artifacts/api-server/src/routes/businesses.ts)
- `POST /admin/businesses` — admin creates business; raw SQL insert (listing_status/data_source/email/zip not in Drizzle schema); auto-geocodes with Google Maps; defaults to listing_status='staged'
- `GET /admin/businesses/check-duplicate` — fuzzy name+city match before save (pg_trgm % with ILIKE fallback)
- `POST /admin/businesses/:id/photos/upload` — multer.array("photos", 10); goes direct to photos[] (no pending queue); sets imageUrl to photos[0]; max 20 photos total
- `POST /admin/businesses/:id/photos/delete` — remove single photo by URL
- `POST /admin/businesses/:id/social-link` — paste YouTube/TikTok/Instagram/Facebook/Pinterest/Vimeo link into videos[]

### Feedback API (artifacts/api-server/src/routes/feedback.ts)
- `PATCH /admin/feedback/:id/status` — mark feedback open or resolved

### Startup Migration (artifacts/api-server/src/lib/startup-migrations.ts)
- `businesses_email_zip_cols` — ADD COLUMN IF NOT EXISTS email VARCHAR(255), zip VARCHAR(20)

### Auth (Task #149 — artifacts/api-server/src/routes/auth.ts)
- `setSessionCookie(res, sid)` called in login-email handler after creating session
- Web clients now get HttpOnly cookie automatically; mobile continues using Bearer token
- `getSessionId(req)` already read cookies as fallback (lib/auth.ts line 90) — infrastructure was already there

### Web Components
- `AdminAddBusiness.tsx` — 5-step form: Basic Info / Social / Identity / Discovery / Review; then flows to media step after save; uses BUSINESS_CATEGORY_TAXONOMY, VIBES_BY_CATEGORY, VIBE_ELIGIBLE_CATEGORIES, OWNERSHIP_DESIGNATIONS from @workspace/db; duplicate check before submit; staged/live_unclaimed publish options
- `AdminBusinessMediaStep.tsx` — post-save media step: Take Photo (camera capture), Choose from Library (multi-select), social link paste with platform detection; "Copy link → paste here" mobile tip
- `AdminFeedbackTab.tsx` — beta feedback triage: type+status filter chips, resolve toggle, timestamps

### Admin.tsx wiring
- "feedback" added to Tab type
- "+ Add Business" button next to Export CSV in businesses tab header
- AdminAddBusiness modal + success toast (shows business name, View link, auto-closes after 8s)
- AdminFeedbackTab rendered in feedback tab
- `showAddBusiness`, `addBizSuccess` state vars

## Key architecture decisions
- `listing_status` and `data_source` are NOT in the Drizzle businesses schema — use pool.query raw SQL for inserts that need these columns
- `email` and `zip` columns added via startup migration (not in Drizzle schema either)
- Admin-uploaded photos bypass the pending queue and go straight to photos[] (pre-approved)
- Social media links stored in businesses.videos[] (same field as owner video links)
- `PATCH /admin/businesses/:id/profile` already covers editing all main fields post-creation — no new edit endpoint needed for those

## Canonical vocabulary sources for the admin form
- Categories: BUSINESS_CATEGORY_TAXONOMY from @workspace/db
- Vibes: VIBES_BY_CATEGORY, VIBE_ELIGIBLE_CATEGORIES from @workspace/db
- Ownership designations: OWNERSHIP_DESIGNATIONS from @workspace/db (90 designations)
- Professional tags: THE_REAL (not in admin form — earned by community, not assigned)

## What's NOT built (for follow-up)
- Edit existing business modal in admin panel (PATCH /admin/businesses/:id/profile exists but no web UI for it yet)
- Video upload (hosted on platform, not social link) for admin-added businesses
- Social media embed rendering on business profile page
- "Add from Social Media" for business owners and Cultural Ambassadors (future)
