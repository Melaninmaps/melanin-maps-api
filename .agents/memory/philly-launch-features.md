---
name: Philly launch features
description: Status of all 8 session-plan Philly launch tasks — all confirmed fully shipped.
---

All 8 features confirmed fully implemented and typechecked clean:

**T001 DB schema** — reviews has status/ownerResponse/ownerRespondedAt/customerEditedAt; businesses has introVideoUrl/weeklySchedule. Schema pushed.

**T002 Reviews API** — GET /reviews filters pending_video + 6-month expiry; POST auto-assigns status (pending_video / auto_approved / posted) and sends 5★ push to owner; POST /reviews/:id/owner-response; PATCH /reviews/:id (customer edit); POST /reviews/:id/approve-video (admin).

**T003 Compliment chips** — GET /businesses returns topCaptions (max 2); BusinessCard.tsx maps them to chips; mobile discover (tabs)/index.tsx uses BusinessCard.

**T004 Intro video** — POST/DELETE /businesses/mine/intro-video routes in businesses.ts; edit-profile.tsx has upload UI; business/[id].tsx shows introVideoUrl preview.

**T005 Business preview** — app/business-owner/preview.tsx (128 lines); index.tsx links to "/business-owner/preview" as "Preview My Listing".

**T006 Review dialogue** — business/[id].tsx shows ownerResponse; edit button visible on own reviews inside ownerResponse block; PATCH called when editingReviewId set; admin.tsx has "Approve Video Reviews" section calling /reviews/:id/approve-video.

**T007 Move alert** — PATCH /businesses/:id/address calls sendAddressUpdateNotifications which fans out push to all saved-places users.

**T008 Skip → KinfolkAI** — /api/kinfolk/business-action-plan already pulls skip_feedback messages (lines 1103–1113 of kinfolk.ts); business-owner/index.tsx has "Community Skip Insights" card with skipInsights state.
