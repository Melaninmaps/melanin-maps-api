---
name: Launch Readiness Lessons
description: Critical navigation and discoverability gaps found during pre-launch audit — what to check before every release.
---

# Launch Readiness — What to Verify Before Every Build

## The Rule
"Does the screen exist?" is NOT the same as "Can a real user find it?" Always verify the full navigation path from cold launch, not just that a file exists.

**Why:** Two launch-blocking bugs were found the night before a press tour because screens existed but had no accessible entry points.

## Critical Gaps Found (now fixed)

### 1. Onboarding CTA routed to waitlist, not signup
- `onboarding/join.tsx` primary button said "Join the Waitlist" → `router.replace("/waitlist")`
- No "Create Account" / "Sign Up" button anywhere in the onboarding flow
- New users could not create an account from the primary CTA
- **Fix:** Primary button now "Create Account — It's Free" → `/signup`

### 2. Business categories gated as "Coming Soon"
- Only 3 of 18 categories had `liveAtLaunch: true` in `constants/categories.ts`
- Food & Beverage, Shopping & Retail, Beauty & Personal Care were live
- Everything else (Health, Real Estate, Legal, Finance, Fitness, etc.) showed waitlist wall
- **Fix:** All 18 categories set to `liveAtLaunch: true`

### 3. Business listing had no entry point from Discover
- `list-business.tsx` existed but was only reachable 4+ taps deep in Profile settings
- A business owner browsing businesses had no path to list their own
- **Fix:** "Own a Black-Owned Business? List Free" banner added to Discover feed and top of Profile

### 4. Map "Safety Insights" routed to wrong screen
- MapTabView "Safety Insights" button went to `/safety-info` (single tip) not `/safety-hub` (full hub)
- **Fix:** Now routes to `/safety-hub`

### 5. Smart Search was unreachable
- `smart-search.tsx` existed but had zero entry points in any tab
- **Fix:** ✨ AI Smart Search banner added to Discover header

## Pre-Launch Checklist (run before every app store submission)

1. **Onboarding cold start** — delete app, reinstall, go through all 5 onboarding screens. Primary CTA must reach signup.
2. **Business listing path** — from Discover tab, can a new user find and complete business listing without help?
3. **All categories open** — verify no "Coming Soon" walls for categories you intend to be live
4. **Core API endpoints live** — POST /api/businesses (201), GET /api/businesses (200), GET /api/alerts (200)
5. **Website waitlist** — visit mappingwithmelanin.com, fill the waitlist form, confirm submit works

## Version History
- 1.0.0 → versionCode 2, buildNumber 3 (initial submission)
- 1.0.1 → versionCode 3, buildNumber 4 (launch readiness fixes, June 2026)

## How to Apply
Run this checklist before calling `eas build`. Don't rely on typechecks alone — TypeScript passing does not mean navigation paths are correct.
