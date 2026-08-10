---
name: Permanent Release-Control Rule
description: 22-section mandatory audit that must run after EVERY implementation, build, migration, deployment, Railway push, OTA, or configuration change. Locked by founder Aug 10 2026.
---

## Core Rule

DO NOT use BUILT / CODED / COMPILED / DEPLOYED / PUSHED as synonyms for WORKING IN PRODUCTION.

A change is not complete until the affected production experience has been verified and the existing platform has been checked for regressions.

Use only these maturity statuses:
- CODED
- DEV VERIFIED
- DEPLOYED
- PRODUCTION VERIFIED
- USER ACCEPTANCE VERIFIED

Only tell the founder something is "WORKING" when at least PRODUCTION VERIFIED is true.

## 21-Point Release Checklist (Return After Every Release)

```
DEPLOYMENT PROCEDURE FOLLOWED: YES/NO
PRODUCTION SHA VERIFIED: YES/NO
STALE BUNDLE: TRUE/FALSE
WEBSITE AVAILABLE: YES/NO
PUBLIC/MEMBER WALL VERIFIED: YES/NO
FOUNDER LOGIN VERIFIED: YES/NO
TESTER LOGIN VERIFIED: YES/NO
APPLE REVIEWER VERIFIED: YES/NO
LOGOUT VERIFIED: YES/NO
PROFILE VERIFIED: YES/NO
DIRECTORY VERIFIED: YES/NO
MAP VERIFIED: YES/NO
LIBRARY VERIFIED: YES/NO
KINFOLK VERIFIED: YES/NO
SAVED DATA VERIFIED: YES/NO
COMMUNITY VERIFIED: YES/NO
MOBILE COMPATIBILITY CHECKED: YES/NO
NEW PRODUCTION ERRORS: YES/NO
DATA LOSS DETECTED: YES/NO
REGRESSION DETECTED: YES/NO

FINAL RELEASE STATUS: PASS or FAIL — DO NOT PROCEED
```

## Section-by-Section Obligations

**1. Deployment Procedure** — Confirm web build, web-static sync, API build, dist sync, source commit, rebuild commit, push, Railway pickup, startup migrations, ACTIVE/SUCCESS status, correct SHA, correct bundle, stale_bundle=false.

**2. Website Availability** — VISUALLY open https://www.mappingwithmelanin.com. No white screen, no crash, no blank React root. Capture screenshot evidence for major releases.

**3. Authentication** — Every production deployment: login page loads, email/password works, Apple review path intact, tester entitlement intact, authenticated session created, protected page opens, session persists, logout works, re-login works. Non-negotiable.

**4. Member Wall** — Logged out: only public pages visible, protected routes return 401/403. Logged in + approved: member experience works. Admin: role restricted correctly.

**5. Core Smoke Test** — HOME / LOGIN / PROFILE / BUSINESSES / MAP / LIBRARY / KINFOLKAI / COMMUNITY / EVENTS / SAFETY / SAVED PLACES / LOGOUT. For each: page loads? data loads? primary action works? console error? API error? visible regression?

**6. KinfolkAI Regression** — Minimum: "Where should I eat in Philadelphia?" + one personalization test. Confirm HTTP 200, substantive response, no blank, conversation stays visible. If Knowledge Graph changed, also test a graph-aware question.

**7. Saved Places** — Save entity → refresh → still saved → Profile shows it → logout/login → still saved → unsave → removed. No duplicates.

**8. Business/Directory Search** — Stable regression set: "Churches in Philadelphia PA" / "hair store Philadelphia" / "OBGYN Philadelphia" / "plumber Philadelphia" / "Ethiopian food Philadelphia". Confirm location parsing works, relevant results, no zero state, member wall enforced.

**9. Map** — Loads for auth user, NOT for unauth user, pins render, search works, pin click works, HRE layer works, Google Maps key succeeds.

**10. Library** — Loads, Browse/Collections load, search works, canonical topics remain, Collection→Book drill-down works, Knowledge Graph relationships work. Stable examples: Philadelphia / Philadelphia Black History / Diabetes / Alpha Kappa Alpha / Faith & Spirituality.

**11. Profile Parity** — Identity, preferences, Saved, Kinfolk preferences, Community contributions, tester badge, safety preferences, account/privacy. Check desktop AND mobile-web width.

**12. Community** — Page loads, real posts remain, composer opens, media URL path functional, existing content not lost.

**13. Apple Review Safety** — After any auth/API/membership/profile/networking/sessions/routes/server change: Apple reviewer can authenticate and reach approved experience. State immediately if a new mobile build is required.

**14. Mobile Tester Safety** — Return: iOS CURRENT BUILD COMPATIBLE: YES/NO / ANDROID CURRENT BUILD COMPATIBLE: YES/NO.

**15. Data Integrity** — Expected row counts, no unexpected deletes, no duplicate canonical entities, no orphaned relationships, foreign keys intact, user-generated content preserved.

**16. Error/Log Audit** — Check for 500s, ReferenceError, TypeError, migration errors, missing columns, auth failures, AI provider failures, storage failures, unexpected 404s.

**17. Visual Proof** — Screenshots of homepage, authenticated landing, Profile, Map, Directory, Library, Kinfolk, and any changed feature. From REAL production whenever technically possible.

**18. Regression Matrix** — Return table: FEATURE / BEFORE STATUS / AFTER STATUS / TEST PERFORMED / RESULT / PRODUCTION VERIFIED? / REGRESSION?

**19. Release Status Language** — Only: CODED / DEV VERIFIED / DEPLOYED / PRODUCTION VERIFIED / USER ACCEPTANCE VERIFIED.

**20. Failure Rule** — If any previously working P0/P1 feature breaks after a new implementation: DO NOT CONTINUE ADDING NEW FEATURES. Diagnose the regression first. Regression repair interrupts expansion.

**21. Permanent Release Checklist** — See above 21-point checklist.

**22. This Audit Is Automatic** — The founder should NOT have to ask "Did you check login?" / "Did you check Apple?" / "Did you visually open production?" These checks are automatic after every relevant release.

**Why:** Founder locked this rule Aug 10 2026 after pattern of "Replit celebrates the build → founder discovers three screens later that something older disappeared." Apple reviewer + tester login checks are permanent because breaking the authenticated Apple pathway leads to App Store rejection.

**How to apply:** After EVERY implementation, bug fix, schema change, migration, build, deployment, Railway push, OTA, mobile build, or production configuration change — run applicable sections and return the 21-point checklist. Do not declare work complete without it.
