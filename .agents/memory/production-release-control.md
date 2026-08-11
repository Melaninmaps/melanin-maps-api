---
name: MWM Permanent Release Control Policy
description: MANDATORY governing rule — supersedes all previous loose "done/pass/live" interpretations. Every user-facing feature must reach Level 4 or Level 5 before "ready" is reported.
---

# MAPPING WITH MELANIN™ — PERMANENT RELEASE CONTROL POLICY
# FOUNDER DIRECTIVE — GOVERNING RULE
# Installed: 2026-08-11 | Source: Founder directive via production-release-control.md

---

## CORE PRINCIPLE

YOU MAY NEVER DECLARE A USER-FACING FEATURE WORKING SOLELY BECAUSE:

- code exists / compiles / TypeScript passes
- a route exists
- an API returns HTTP 200
- a database row exists / a migration succeeded
- curl works / unit tests pass
- a component renders in dev
- the deployment reports SUCCESS / Railway says ACTIVE
- a bundle exists
- the implementation "should work"

Those are supporting technical checks. They are NOT final user acceptance proof.

**Code proves implementation. API proves connectivity. Production browser proves reality. A real user journey proves release readiness.**

---

## REQUIRED VERIFICATION LEVELS

| Level | Name | Description |
|---|---|---|
| 1 | CODE VERIFIED | Source exists and passes static/build checks |
| 2 | API VERIFIED | Correct deployed production API behaves correctly |
| 3 | PRODUCTION DATA VERIFIED | Production environment contains expected real data |
| 4 | PRODUCTION UI VERIFIED | Deployed website at real production URL visibly performs the feature |
| 5 | REAL USER JOURNEY VERIFIED | Real audit user completes full workflow including persistence |

**DO NOT REPORT "PASS" UNTIL LEVEL 4 OR LEVEL 5 IS ACHIEVED.**

If only Levels 1–3 are available, report the exact level honestly.

---

## PERMANENT PRODUCTION URL

All final website verification must use: **https://www.mappingwithmelanin.com**

Do NOT substitute: localhost, Replit preview, dev environment, direct internal endpoint, Railway direct URL — unless diagnosing an infrastructure problem.

---

## DEDICATED AUDIT USER

Maintain ONE dedicated STANDARD MEMBER account: **MWM Production Audit User**

Requirements:
- Normal member/tester permissions, approved access
- NOT admin, NOT founder, NOT business owner, NOT Cultural Ambassador
- No elevated privileges beyond normal controlled tester experience

**DO NOT print its password in logs, commits, reports, screenshots, Replit chat, or source code.**

The account must be resettable to first-time state for onboarding testing.

---

## REAL BROWSER TESTING REQUIRED

Before declaring production ready: OPEN THE ACTUAL PRODUCTION WEBSITE. Use the audit account. Perform actions by interacting with the UI exactly as a human user would.

API calls may diagnose failures but do NOT replace browser acceptance.

Capture evidence: screenshots, browser screenshots, screen recordings, network evidence, rendered state, persisted state after refresh.

---

## PRE-DEPLOYMENT GATE (20 checks)

Before every production deployment confirm:
1. Exact intended change identified
2. Files changed identified
3. DB/schema changes identified
4. Changes are scoped to the requested issue
5. git diff checked for unrelated modifications
6. TypeScript/static checks pass
7. Build passes
8. Relevant tests run
9. Migrations are additive where possible, idempotent, production-safe
10. No secrets committed
11. Required production environment variables exist
12. Auth middleware not accidentally moved/bypassed
13. Member wall remains protected
14. Apple reviewer route/account requirements remain intact
15. Business/map/library data not being deleted/reseeded unnecessarily
16. No test/demo records being added to production
17. No unrelated package/library/model upgrades occurred
18. Current production SHA recorded
19. Expected new SHA recorded
20. Rollback target = last known GOOD production SHA established

**IF ANY CHECK FAILS: STOP DEPLOYMENT.**

---

## DEPLOYMENT RULE

Deploy the smallest approved change. DO NOT combine unrelated improvements.

After deployment — WAIT FOR RAILWAY TO COMPLETE. Do not assume Git push = production.

Confirm: Railway deployment SUCCESS | Expected SHA = actual SHA | Expected bundle = actual bundle | stale_bundle = FALSE | service healthy | database reachable

---

## IMMEDIATE POST-DEPLOYMENT HEALTH CHECK

Test: Homepage, Login page, API health, Database connection, Kinfolk health, Member wall, Static JS/CSS assets

Confirm: no white screen, no infinite loader, no crash, no 500 loop, no missing JS bundle, no stale bundle, no accidental public member data

---

## MANDATORY TRIPLE CHECK

Every production release must pass THREE independent verification passes.

### CHECK 1 — TECHNICAL PRODUCTION CHECK
deployment | SHA | bundle | health | DB | API | auth/session | critical routes | migrations | logs/errors

### CHECK 2 — REAL USER SMOKE TEST
Use dedicated production audit member. Navigate production website. At minimum:
login → authenticated landing → Profile → Businesses → Map → Library → KinfolkAI → Community → Safety → Events → logout → re-login

### CHECK 3 — CORE JOURNEY REGRESSION

**JOURNEY A — DISCOVERY:** Login → search "Amina" → Philadelphia business appears → open → map correct → save → refresh → persists

**JOURNEY B — DOMESTIC:** Search "Philadelphia restaurants" → geography correct → MWM records → click → detail correct

**JOURNEY C — INTERNATIONAL:** Search "Phuket restaurants" → geography = Phuket → ONLY MWM Phuket data → map centers Phuket → pins visible → save → refresh → persist. Repeat: Bangkok nightlife

**JOURNEY D — LIBRARY:** Library → search topic → open Book → content visible → sources visible → Follow → refresh → persists

**JOURNEY E — KINFOLK:** Open Kinfolk → normal question → response → personalization available → no backend outage banner

**JOURNEY F — COMMUNITY CONTRIBUTION:** Business → Show the Vibe → add social URL → submit → confirmation/moderation state

**JOURNEY G — REVIEW:** Business → submit review → success → persistence

**JOURNEY H — SAFETY:** Safety → forms load → historical info accessible → no broken routes

**JOURNEY I — SESSION:** logout → protected data unavailable → login → user state persists

---

## SEARCH REGRESSION SET

After any search/map/business/location change, always test:
Amina | Hakim's Bookstore | Mother Bethel | church | AME church | braider | OB-GYN | child care | lawyer | Ethiopian restaurant | Philadelphia restaurants | Atlanta restaurant | Bangkok restaurants | Bangkok nightlife | Phuket | Phuket restaurants | Phuket nightlife | Jamaica restaurants | one deliberately nonexistent business

Validate: intent, geography, MWM result, map position, no external business leakage, appropriate empty state

---

## MWM DATA PROVENANCE RULE

External mapping/geocoding: answers "WHERE IS THIS?"
MWM database: answers "WHAT MWM PLACES DO WE HAVE THERE?"

External geocoders MUST NOT inject external businesses into MWM results. Every displayed result must map to a canonical MWM entity record.

---

## KINFOLK HEALTH CHECK

Before declaring production ready verify: OpenAI key available | Kinfolk health endpoint OK | real chat response works | no amber unavailable banner | one personalized query returns successfully

**If Kinfolk is down: PLATFORM STATUS CANNOT BE "FULLY READY."**

---

## VISUAL SCREENSHOT REQUIREMENTS

Capture: authenticated home/member page | business search result | business detail | Philadelphia map | Bangkok map/results | Phuket map/results | Library content | Kinfolk response | Profile | mobile-width representative screen

---

## MOBILE WEB CHECK

Test representative phone width. Look for: clipped navigation, overlapping Kinfolk widget, hidden buttons, horizontal overflow, off-screen modals, unusable forms, keyboard/input issues, map controls hidden by overlays.

---

## DO NOT CHANGE UNRELATED THINGS

During diagnosis DO NOT: upgrade packages, change AI models, rewrite auth, reseed businesses, redesign screens, rename categories, modify unrelated migrations, change pricing, alter memberships, "clean up" unrelated code.

Rule: **DIAGNOSE → CLASSIFY → MINIMAL FIX → VERIFY → STOP**

---

## FAILURE CLASSIFICATION

| Priority | Definition |
|---|---|
| P0 | Platform unavailable, auth broken, core Map/Businesses unusable, data loss, Apple review impossible |
| P1 | Core promise materially broken (international discovery failing, Kinfolk unavailable, Library unusable, review/save flow broken) |
| P2 | User experience issue that does not stop proof-of-concept testing |
| P3 | Polish/future improvement |

Only P0 automatically authorizes emergency production work. P1 must be reported to founder. P2/P3 go to backlog.

---

## AUTOMATIC STOP RULE

If post-deployment verification discovers a NEW P0 or P1: **STOP.**

Return:
```
USER ACTION:
EXPECTED:
ACTUAL:
SCREENSHOT/EVIDENCE:
ROOT CAUSE IF KNOWN:
ROOT CAUSE CONFIDENCE:
PROPOSED FIX:
FILES AFFECTED:
DB IMPACT:
RISK:
ROLLBACK OPTION:
```

Wait for founder authorization unless system is fully unavailable and emergency rollback is required.

---

## ROLLBACK POLICY

Before deployment record: LAST_KNOWN_GOOD_SHA

Roll back immediately if deployment produces: website outage, white screen, auth failure, critical API failure, data corruption, member-wall exposure, Map completely broken, Kinfolk catastrophic failure.

After rollback: verify production URL → verify login → verify core journey → report status.

**A release becomes LAST KNOWN GOOD only after the triple verification completes.**

Lifecycle: Build → deploy → technical check → human-browser check → multi-journey check → promote to LAST KNOWN GOOD.

---

## NO FALSE POSITIVE LANGUAGE

Permitted status labels ONLY:
- CODE VERIFIED
- API VERIFIED
- PRODUCTION DATA VERIFIED
- PRODUCTION UI VERIFIED
- REAL USER JOURNEY VERIFIED
- FAILED
- NOT TESTED

Banned: "should work" | "appears correct" | "route exists so this passes" | "expected to work" | "will work after deploy" | "ready once Railway finishes"

A feature awaiting deployment is: **NOT YET PRODUCTION VERIFIED.**

---

## FINAL RELEASE REPORT FORMAT

```
RELEASE:
PRODUCTION SHA:
LAST KNOWN GOOD SHA:
BUNDLE MATCH:
STALE BUNDLE:
RAILWAY:
DATABASE:
MIGRATIONS:
NEW SERVER ERRORS:

AUTH:
TEST USER:
APPLE REVIEWER:
LOGOUT/RELOGIN:
MEMBER WALL:

BUSINESS SEARCH:
MAP:
PHILADELPHIA:
BANGKOK:
PHUKET:
JAMAICA:

BUSINESS DETAIL:
SAVE:
CHECK-IN:
REVIEW:
VIBES/THE REAL:
MEDIA CONTRIBUTION:

LIBRARY:
KINFOLK HEALTH:
KINFOLK RESPONSE:
KINFOLK PERSONALIZATION:
KINFOLK VOICE:

COMMUNITY:
SAFETY:
EVENTS:
PROFILE:
MOBILE WEB:

P0:
P1:
P2:
P3:

ROLLBACK REQUIRED:
DATA LOSS:
SECURITY REGRESSION:

FINAL STATUS: REAL USER JOURNEY VERIFIED / NOT READY
```

---

## FOUNDER RELEASE STANDARD

The founder should NEVER have to discover the morning after deployment that something reported as "working" was never actually exercised through the website.

The final question before declaring anything ready:

**"Could I hand this URL to a person who knows nothing about the code and have them successfully perform the intended task?"**

If that has not actually been demonstrated: **DO NOT REPORT READY.**

---

## CURRENT BUSINESS PRIORITY

Mapping With Melanin is entering active proof-of-concept testing. The founder must be able to spend time on marketing, content creation, business outreach, partnerships, tour execution, and investor preparation — not repeatedly re-testing engineering claims.

**Reliability now takes priority over adding more features.**
