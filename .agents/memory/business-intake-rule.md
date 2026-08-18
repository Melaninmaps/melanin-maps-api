---
name: Community Business Intake — permanent rule + packages
description: PERMANENT rule + implementation status for community business submission pipeline
---

# Community Business Intake — Permanent Rule

## The Rule (PERMANENT FLOOR)
Community submissions always start as `pending_review` and are invisible in ALL public surfaces (map, directory, Kinfolk search, Community Vibes, mobile) until the founder explicitly approves them.

- `listing_status = 'pending_review'` gates them out of all public views (public views filter on `IN ('live_unclaimed', 'live_claimed')`)
- Browser never publishes directly — only the server-side `publishFromSubmission` adapter creates the canonical business record
- Three lanes:
  - **Community member** → `community_business_submissions` table, `pending_review`, NOT in `businesses` until approved
  - **Founder/admin** → direct `POST /api/admin/businesses`, `listing_status = 'live_unclaimed'`, immediately public
  - **Business owner claim** → `business_claim_requests` table, listing stays public while pending

## Implementation Status (Aug 18 2026 — IMPLEMENTED)

### Database (created by startup migrations)
- `community_business_submissions` — submission queue, never touches `businesses` until approved
- `business_submission_audit_events` — full audit trail per submission
- `media_assets` — tracks uploaded files (URL, uploader, purpose, MIME type)
- `entity_media_assets` — attaches media to any entity (business, submission, etc.)
- `business_claim_requests` — ownership claim requests (pending_verification / approved / rejected)
- `businesses` columns added: `owner_claim_status`, `claimed_owner_member_id`, `added_by_member_id`, `added_via`, `published_at`

### Server Routes
- `POST /api/community/business-submissions` — public; accepts submission; reads ?source=&campaign= attribution
- `GET /api/founder/business-submissions` — admin only; returns queue filtered by status
- `POST /api/founder/business-submissions/:id/decision` — admin only; approve calls `publishFromSubmission` which geocodes + creates canonical business with `listing_status='live_unclaimed'`
- `POST /api/media/upload?purpose=...` — authenticated; multer memory → GCS → {url, assetId, type}; 10MB image / 50MB video / strict MIME allow-list
- `POST /api/admin/businesses` — admin only; direct publish, live immediately
- `POST /api/businesses/:id/claim` — authenticated; creates `business_claim_requests` record
- `POST /api/admin/business-claims/:id/decision` — admin only; approve/reject claim

### Files
- `artifacts/api-server/src/businessIntake/types.ts` — validateSubmission() guard
- `artifacts/api-server/src/businessIntake/submissionRepository.ts` — SubmissionRepository class
- `artifacts/api-server/src/businessIntake/registerSubmissionRoutes.ts` — 3 routes + publishFromSubmission adapter
- `artifacts/api-server/src/media/registerMediaRoutes.ts` — media upload route
- `artifacts/api-server/src/businesses/registerAdminPublishAndClaimRoutes.ts` — admin publish + claim routes
- Registered in `artifacts/api-server/src/app.ts` (3 calls after registerReleaseStatusRoutes)

### Web Pages
- `/submit-business` — public intake form; reads ?source=&campaign= for social attribution
- `/founder/business-submissions` — admin-gated review queue with approve/decline/needs-info
- `/founder/businesses/new` — admin-gated direct-publish form (live immediately)
- `/businesses/:id/claim` — authenticated standalone claim page with document upload

### MediaUploader Component
- `artifacts/web/src/components/MediaUploader.tsx` — shared upload component
- Used in: submit-business, founder-businesses-new, business-claim pages
- Community composer (`community.tsx`) — real photo/video upload buttons now wired to `POST /api/media/upload`

### Footer Link
- "Submit a Business" added to footer Discover column

**Why:** Community tips must go through editorial review before going live to prevent spam, misinformation, and duplicate listings from degrading map quality.

**How to apply:** Any new feature that adds businesses to the directory must route through either the community submission queue (pending_review) or the admin direct-publish path. Never set listing_status to live_unclaimed from browser code.
