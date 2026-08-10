---
name: Web Profile Parity — Aug 10 2026
description: What was built to close the mobile/web profile parity gap; what remains
---

# Web Profile Parity Status

## What Was Added (Aug 10 2026)
- **Reviews count** — wired to GET /api/reviews/mine (replaces hardcoded —)
- **Activity section** — review count + recent reviews list + post count
- **Network section** — followers/following counts + links to Connections, Circles, Library, Business Dashboard (conditional)
- **Account & Privacy panel** — privacy toggle (live PATCH /api/auth/user/privacy), change password form (POST /api/auth/change-password), delete account link
- **Backend**: GET /api/reviews/mine, POST /api/auth/change-password, PATCH /api/auth/user/privacy

## New Backend Routes
- `GET /api/reviews/mine` — authenticated user's own reviews + count (reviews.ts)
- `POST /api/auth/change-password` — bcrypt-verified password change (auth.ts)
- `PATCH /api/auth/user/privacy` — toggle isPrivate (auth.ts)

## Remaining P1 Gaps (Task #189)
- Cultural Ambassador section (isCommunityOrganizer/isContentCreator)
- Kinfolk personalization settings (user_preferences table)
- Library follows count on profile (GET /api/knowledge/delivery-preferences)
- Saved places with remove capability (currently display-only)
- Activity/post history (link to community posts by user)
- Notification preferences page
- Referrals section
- Safety alert preferences  
- Public profile / shareable URL (/profile/:username)

## Manus Test Readiness Gate
NOT READY until:
- Mobile auth OTA deployed and device-verified
- Remaining P1 profile gaps closed
- Kinfolk reads same data as web updates (verify user_preferences table)
- Saved places persist across sessions verified
