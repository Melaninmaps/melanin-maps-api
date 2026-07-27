# Manus Reconciliation Report
## Mapping With Melanin™ — Build 97
**Date:** July 27, 2026
**Manus Finding:** CONDITIONAL GO
**This Report:** Formal reconciliation of every Manus recommendation against the current repository state

---

## RECONCILIATION METHODOLOGY

Each Manus recommendation is evaluated against:
- Direct inspection of `artifacts/mobile/app.json` (iOS/Android config)
- Direct inspection of `artifacts/api-server/src/routes/` (API routes)
- Direct inspection of `lib/db/src/schema/` (database schema)
- Project memory and prior engineering analysis
- Load test results (Replit dev environment — labeled where applicable)

Status codes:
- ✅ **IMPLEMENTED** — Repository already satisfies the recommendation
- 🟨 **PARTIALLY IMPLEMENTED** — Part exists; additional work required
- 🟥 **NOT IMPLEMENTED** — Not yet addressed
- ⚪ **NOT APPLICABLE** — Does not apply to this project
- 🔒 **CANNOT BE IMPLEMENTED BY REPLIT** — Requires external action or third-party dependency

---

## SECTION 1 — ACTIVE BLOCKERS (Apple Rejection Risks)

---

### Blocker A: Deploy Backend to Railway Production
**Manus:** "The fix is implemented but has not been deployed to Railway production. If Apple reviews the app before the deployment and a manual Railway restart, they will hit the same 500 errors."

**Status: 🟥 NOT IMPLEMENTED**

**Current repository state:**
The StripeSync singleton fix (`getStripeSync()` as a promise-cached singleton, `pg.Pool(max:2)`) exists in `artifacts/api-server/src/stripeClient.ts` in the Replit workspace. The `lib/db/src/index.ts` pool has been increased to `max:8` with full resilience config (`idleTimeoutMillis`, `connectionTimeoutMillis`, `maxUses`, `allowExitOnIdle`). `SIGTERM` graceful shutdown drains both pools in `artifacts/api-server/src/index.ts`.

**None of this is deployed to Railway production.** Railway auto-deploys from GitHub, but the Replit workspace has divergent git history from the GitHub remote — the fixes may not be on the remote branch.

**Evidence:**
- `artifacts/api-server/src/stripeClient.ts` — singleton fix present in Replit workspace
- `lib/db/src/index.ts` — pool max:8, resilience config present in Replit workspace
- Git log: HEAD `c9dad580` — divergent from GitHub remote
- `docs/reviews/database/DATABASE_POOL_ROOT_CAUSE.md` — root cause confirmed, fix confirmed undeployed

**Risk if left unchanged:** Apple will encounter the same HTTP 500 failures during review that caused the Build 96 rejection. This is the single highest-probability rejection path.

**Suggested implementation:**
1. Push Replit workspace changes to GitHub remote (resolve divergent history or force push to main)
2. Confirm Railway auto-deploy triggers and completes
3. Manually restart Railway service after deploy
4. Verify `GET /api/readyz` returns `status: ok` from Railway production URL
5. Run 2-hour Stripe webhook stress test

**Estimated effort:** 2–3 hours (deploy + verification + stability window)

**Affects:** Apple approval ✅ | Android ✅ | Web ✅ | iPhone ✅ | iPad ✅ | Android phone ✅

**Build 97:** YES — this is the highest-priority remaining task before any submission

**Founder approval required:** No — this is a deployment action, not a feature decision

---

### Blocker B: Generic iOS Permission Strings (NSFaceIDUsageDescription, NSMotionUsageDescription)
**Manus:** "Your `Info.plist` contains generic template strings for Face ID and Motion detection. Apple frequently rejects apps that request permissions without a specific, user-facing explanation."

**Status: ✅ IMPLEMENTED**

**Current repository state:**
Running `grep -n "NSFaceIDUsage\|NSMotionUsage\|NSLocationAlways" artifacts/mobile/app.json` returns **no results**. Neither `NSFaceIDUsageDescription` nor `NSMotionUsageDescription` appear anywhere in `app.json`.

Since this project uses Expo's managed/bare workflow with EAS, the Info.plist is generated from `app.json` at build time. The static `ios/` folder (gitignored) contains a stale Info.plist from a prior build (CFBundleVersion: 83) — but EAS regenerates this from `app.json` during every build. The EAS-generated Build 97 Info.plist will contain only the permissions declared in `app.json`, which do not include FaceID or Motion.

**Evidence:**
- `grep -n "NSFaceIDUsage\|NSMotionUsage" artifacts/mobile/app.json` → no output
- `docs/reviews/native/IOS_CONFIG.md` → "Removed in Build 97" section confirms these were cleaned
- EAS managed workflow generates Info.plist from app.json, not from the static gitignored file

**Risk if left unchanged:** None — already resolved.

**Manus's finding was valid for a prior build state.** The static Info.plist visible in the repository had these entries, but EAS will not use the static file. The fix was already in place before this review package was prepared.

**Build 97:** No action required

**Founder approval required:** No

---

### Blocker C: Build Number Conflict (Must Be 97, Not 96)
**Manus:** "App Store Connect will reject the binary upload if the `buildNumber` is not incremented from 96 to 97."

**Status: ✅ IMPLEMENTED**

**Current repository state:**
Direct inspection of `artifacts/mobile/app.json` line 13: `"buildNumber": "97"`. Android `versionCode` is `71`.

**Evidence:**
```
grep "buildNumber\|versionCode\|version\":" artifacts/mobile/app.json
→ "version": "1.1.5"
→ "buildNumber": "97"
→ "versionCode": 71
```

**Risk if left unchanged:** None — already resolved.

**Build 97:** No action required

---

## SECTION 2 — DAY 1 PRODUCT INTEGRITY ACTIONS

---

### Day 1.1: Increment Build Number
**Manus:** "Update `app.json` to `"buildNumber": "97"`."

**Status: ✅ IMPLEMENTED** — See Blocker C above.

---

### Day 1.2: Clean iOS Permissions
**Manus:** "Remove `NSFaceIDUsageDescription` and `NSMotionUsageDescription` from `Info.plist`."

**Status: ✅ IMPLEMENTED** — See Blocker B above. These are not present in `app.json`.

**Additional note:** `NSLocationAlwaysUsageDescription` is also confirmed absent from `app.json`. Only `NSLocationWhenInUseUsageDescription` is declared, which is correct — the app never requests background location.

---

### Day 1.3: Deduplicate Android Permissions
**Manus:** "Clean up the 9 duplicate entries in `app.json`."

**Status: ✅ IMPLEMENTED**

**Current repository state:**
Direct inspection confirms 16 Android permissions in `app.json`, **zero duplicates**:
```python
Android permissions count: 16
Duplicates: none
```

**Evidence:** `python3` inspection of `artifacts/mobile/app.json` — all 16 entries are unique.

**Manus's finding was valid for an earlier state.** Either the duplicates existed in an earlier version reviewed by Manus (before this review package was assembled) or were present in the static documentation Manus reviewed. Current `app.json` is clean.

**One outstanding item Manus did not flag:** `android.permission.WRITE_CONTACTS` is declared. If "find friends" only reads contacts (to match emails), `WRITE_CONTACTS` is unnecessary and should be reviewed. This is low-risk for Apple but could prompt Google Play review commentary.

**Build 97:** No action required (already clean). Recommend removing `WRITE_CONTACTS` if the "find friends" feature only reads contacts — low effort, reduces permission surface.

---

### Day 1.4: Deploy Backend to Railway
**Status: 🟥 NOT IMPLEMENTED** — See Blocker A. This is the only Day 1 action not yet complete.

---

## SECTION 3 — FEATURE RECOMMENDATIONS

---

### Feature A: Heritage Places — SHIP NOW
**Manus:** "Fully implemented with a dedicated database schema and map integration. This is the 'soul' of the app. Ensure the 'View Details' deep-links work perfectly."

**Status: ✅ IMPLEMENTED**

**Current repository state:**
- `lib/db/src/schema/cultural-sites.ts` — schema confirmed
- `artifacts/api-server/src/routes/cultural-sites.ts` — full CRUD routes (GET list, GET detail, seed endpoint, category counts, heritage stories join)
- `artifacts/api-server/src/routes/admin.ts` line 1158 — `CREATE TABLE IF NOT EXISTS cultural_sites` seed endpoint for admin console
- `FullMapView.tsx` in mobile — cultural sites rendered on map with 11 category-specific pins, ON by default
- Library tab — 16 heritage site cards (horizontal scroll, confirmed in project memory)

**Evidence:** 350+ lines in `cultural-sites.ts` confirming GET `/api/cultural-sites`, GET `/api/cultural-sites/:id`, heritage stories join at `/api/cultural-sites/:id/stories`, category breakdown, map-ready coordinates.

**Deep-link status:** "View Details" → cultural-heritage screen exists. Deep-link testing against production is still required (Day 3).

**Risk if left unchanged:** None for architecture. Deep-link behavior on physical device must be confirmed (Day 3).

**Build 97:** SHIP — confirmed ready

---

### Feature B: Historical Sundown Towns — SHIP AS "HISTORICAL REFERENCE"
**Manus:** "Ship as a read-only historical layer within the Heritage feature. Use `cultural_sites` model. Mandatory: Tougaloo College attribution and disclaimer 'Historical record only. Does not reflect current safety or demographics.' Do NOT include any danger scores."

**Status: 🟨 PARTIALLY IMPLEMENTED**

**Current repository state — what exists:**
- `lib/db/src/schema/surveys.ts` line 79 — `"sundown"` as a report category in the survey/safety enum
- `artifacts/api-server/src/routes/directions.ts` lines 139, 166, 250 — queries `safety_reports WHERE category = 'sundown'` for live community-submitted safety reports along routes (separate from historical data)
- `artifacts/api-server/src/routes/business-response.ts` line 10 — `sundown: "Community Safety Warning"` as a label mapping
- `artifacts/api-server/src/routes/cron.ts` line 291 — "sundown towns history" referenced as a KinfolkAI knowledge topic
- `artifacts/api-server/src/routes/admin.ts` line 1158 — multicultural seed endpoint exists for `cultural_sites`

**What does NOT yet exist (confirmed):**
- No dedicated historical sundown towns dataset imported to `cultural_sites` or any other table
- No `heritage_category = 'sundown'` data confirmed in the `cultural_sites` table
- No dedicated mobile screen for "Historical Sundown Towns"
- No Tougaloo College attribution anywhere in the codebase

**Critical distinction Manus may not have had full context on:**
The `directions.ts` sundown queries fetch **live community-submitted safety reports**, not **historical Loewen dataset entries**. These are two entirely different data sources. A user can submit a safety report with `category: 'sundown'` today — that is NOT the same as displaying the historical sundown town database as a heritage layer.

Manus's recommendation to use `cultural_sites` as the model is architecturally correct. The mechanism exists. **The data is not there.**

**What is required to implement Manus's recommendation:**
1. Import historical sundown town data (source: Tougaloo College / Loewen dataset) into `cultural_sites` with `heritage_category = 'sundown_town_historical'`
2. Add Tougaloo attribution to every record
3. Add disclaimer copy to the mobile detail screen
4. Ensure no "danger score" or current-conditions language appears
5. Confirm with founder: does the Tougaloo dataset require a data use agreement?

**Risk if shipped without these:** If the "Historical Sundown Towns" screen shows but has no data, testers will see an empty screen — worse than not shipping it. If it shows live safety reports labeled as "historical sundown towns," the data will be wrong and potentially harmful.

**Build 97 recommendation:** **CONDITIONAL** — only ship if data is imported and disclaimer copy is confirmed before Day 3. If data import cannot be completed by Day 3, flag this feature as "coming in Build 98" in Apple review notes. Do NOT ship an empty or misleading screen.

**Founder approval required:** YES — founder must confirm dataset source, licensing, and whether the Tougaloo data use agreement has been addressed.

**Effort to complete:** Medium — 4–8 hours for data import, schema mapping, disclaimer copy, and admin-console seed upload.

---

### Feature C: KinfolkAI — SHIP NOW
**Manus:** "GPT-4o backed with live weather and user preference integration. Monitor OpenAI costs closely during the first 48 hours."

**Status: ✅ IMPLEMENTED**

**Current repository state:**
- `artifacts/api-server/src/routes/kinfolk.ts` — full implementation confirmed
- OpenAI via Replit AI Integrations proxy — no direct API key in client
- Open-Meteo live weather (free, no key, 5s timeout, null fallback) — confirmed in route
- Multi-turn conversation history in `kinfolk_sessions` table
- Monthly quota enforcement via `checkAiPool()` and `TIER_LIMITS` constants
- Voice/TTS via OpenAI audio API with `voice_usage` character tracking
- System prompt built from user preferences, life journey, saved places, tier

**Cost monitoring:**
No automated cost alerting currently exists. OpenAI costs are visible in the Replit AI Integrations dashboard. For 30 testers at ~10 queries/day: estimated $1–5/day — manageable but should be checked manually at 24h and 48h post-launch.

**Risk:** No automated cost cap or circuit breaker. If a tester runs a loop or an unexpected usage spike occurs, costs could escalate before manual intervention.

**Build 97:** SHIP — confirmed ready. Add manual cost check to Day 5–6 monitoring checklist.

---

### Feature D: Community Feed — SHIP NOW + SEED WITH 5–10 POSTS
**Manus:** "Provides the 'social proof' that the app is alive. Seed the feed with 5-10 high-quality posts before the testers arrive so they don't see an empty screen."

**Status: 🟨 PARTIALLY IMPLEMENTED**

**Feed functionality:** ✅ Implemented — `GET /api/community/posts`, `POST /api/community/posts`, likes, comments, reposts all confirmed in routes.

**Seeding content:** 🟥 Not yet done — no pre-launch content has been posted. The `POST /admin/seed-multicultural` endpoint exists and seeds businesses + cultural sites; a similar admin endpoint for seeding community posts may not exist, but the founder can create posts manually via the app.

**Recommendation:** Before tester invitations go out (Day 5), the founder should post 5–10 "welcome" or community-relevant posts from the founder account. This can be done directly through the app — no code change required.

**Build 97:** SHIP — feed is functional. Seeding is a content action, not a code action.

---

## SECTION 4 — DAY 2–6 ACTION PLAN STATUS

| Day | Action | Status | Notes |
|-----|--------|--------|-------|
| 1 | Increment build number | ✅ Done | Already 97 |
| 1 | Clean iOS permissions | ✅ Done | NSFaceID/NSMotion not in app.json |
| 1 | Deduplicate Android permissions | ✅ Done | 16 unique, 0 duplicates |
| 1 | Deploy backend to Railway | 🟥 NOT DONE | Highest priority remaining action |
| 2 | 2-hour Stripe webhook stress test | 🟥 NOT DONE | Requires Railway deployment first |
| 2 | Verify `/api/readyz` on Railway | 🟥 NOT DONE | Requires Railway deployment first |
| 3 | EAS build (iOS + Android binaries) | 🟥 NOT STARTED | Requires deployment verified first |
| 3 | Physical device test (iPhone + iPad) | 🟥 NOT DONE | Requires EAS build first |
| 3 | iPad layout audit (map + KinfolkAI) | 🟥 NOT DONE | Requires EAS build first |
| 4 | Submit to Apple | 🟥 NOT DONE | Requires all Day 3 gates passed |
| 4 | Submit to Google Play | 🟥 NOT DONE | Requires all Day 3 gates passed |
| 5–6 | Invite 30 testers (TestFlight + Play) | 🟥 NOT DONE | — |
| 5–6 | Seed community feed content | 🟥 NOT DONE | Content action only — no code needed |

---

## SECTION 5 — ITEMS MANUS IDENTIFIED THAT WERE MISSED IN PRIOR AUDITS

### Miss #1: Android Duplicate Permissions
**Manus flagged 9 duplicate Android permission entries.** Prior audits documented the 16-permission list in the Android config review but did not specifically run a duplicate check. Whether this was a real issue at the time Manus reviewed or a misread of the configuration is unclear — current state is clean (0 duplicates confirmed).

**Why it was missed:** The prior audit read the permission list descriptively; it did not programmatically check for duplicates. A JSON-aware lint step would catch this automatically.

**Prevention going forward:** Add a `pnpm run lint:config` validation step that includes JSON schema validation of `app.json` permissions (deduplication, unknown-key detection). This should be a pre-build gate.

**Similar issues that may exist elsewhere:** The `app.json` plugins array has not been audited for duplicates. A future audit should run the same check on plugins.

### Miss #2: Community Feed Empty State for Testers
**Manus correctly identified that an empty community feed will undermine the tester experience.** Prior audits focused on technical functionality (routes, schema, features) and did not assess the Day 1 tester content state.

**Why it was missed:** Engineering audits focus on whether features *work*, not on whether the *content state* is appropriate for first-contact users. This is a product/content gap, not a code gap.

**Prevention going forward:** Add a "Day 0 Content State" section to the Submission Release Gate checklist: "Is the community feed seeded with at least 5 high-quality posts from the founder account?"

### Miss #3: Historical Sundown Towns Data/UI Ambiguity
**Manus correctly identified this as "partially planned; data import not confirmed."** Prior review package documentation (Section 15 of the Manus review package) stated this honestly. However, prior audits did not explicitly distinguish between:
- Live community safety reports with `category = 'sundown'` (exists, functional)
- Historical Loewen/Tougaloo dataset as a heritage layer (does not exist in confirmed imported form)

**Why it was missed:** The route code (`directions.ts`) references "sundown" prominently, which could give the impression of a more complete implementation than exists. The architectural model (`cultural_sites`) is correct; the data layer is missing.

**Prevention going forward:** For any feature that appears partially in route code but has no confirmed data, add a "Data Confirmation" gate to the pre-build audit: "Query the production DB and confirm `SELECT COUNT(*) FROM [table] WHERE [feature_condition]` returns >0 rows before listing the feature as implemented."

---

## SECTION 6 — DISAGREEMENTS WITH MANUS

### Disagreement #1: Framing of the Sundown Towns Recommendation

**Manus said:** "Ship this as a read-only historical layer within the Heritage feature."

**My position:** This recommendation is architecturally sound but operationally premature as stated. Manus is recommending shipping something whose data import status is unconfirmed. "Ship as historical reference" implies the data exists and needs only proper framing. **The data may not exist in the production database.**

**Technical reasoning:** The `cultural_sites` table is the correct model. The `POST /admin/seed-multicultural` admin endpoint can seed it. But without a confirmed imported dataset (with Tougaloo attribution, disclaimer text, and legal clarity on data licensing), shipping the UI with an empty or incomplete dataset is worse than not shipping it.

**Risk of Manus's approach:** If the founder acts on "ship now" and the data is not in the DB, testers encounter an empty "Historical Sundown Towns" screen — worse tester experience than omitting the feature. If current safety reports (`category = 'sundown'`) are mistakenly displayed as historical data, the feature contains factual errors that could mislead users.

**Risk of my approach:** Deferring this to Build 98 means a high-value, mission-critical feature doesn't ship with the tour launch. The founder wanted this visible for the 6-day countdown.

**Recommended alternative:** Treat this as a Day 2 go/no-go decision point:
- Day 2 morning: Founder confirms whether historical dataset is imported to Railway production (`SELECT COUNT(*) FROM cultural_sites WHERE heritage_category LIKE '%sundown%'`)
- If count > 0 AND disclaimer copy exists AND attribution is present: SHIP
- If count = 0: Defer to Build 98 and add a placeholder in Apple review notes ("Heritage feature will include historical sundown town data in a future update")
- **Do not ship empty. Do not ship ambiguous.**

**Founder approval required:** YES — the founder must confirm data import status and make the ship/defer call.

---

### Disagreement #2: The 6-Day Timeline Is Aggressive Given What Remains Undone

**Manus said:** Day 4 = Submit to Apple.

**My position:** The timeline is achievable only if Railway deployment succeeds cleanly on Day 1 with no unexpected failures. If the deployment surfaces a new issue (migration failure, unexpected Railway behavior, pool config mismatch), the timeline compresses critically and Day 3 physical device testing may not be possible.

**Technical reasoning:** The current state has zero of the post-deployment tasks complete:
- Railway not deployed
- Stability window not started
- EAS build not run
- Physical device not tested
- RevenueCat products in ASC not confirmed
- Apple review account not created

Each of these has a sequential dependency on the prior step.

**Risk of Manus's approach:** Accepting Day 4 as a fixed submission target creates pressure to skip or compress the 12-hour stability window (which is the main gate that would have caught Build 96's failure before submission).

**My recommended alternative:** Treat Day 4 as the target only if Days 1–3 go cleanly. If any gate fails, do not force the timeline — the cost of a third Apple rejection far exceeds the cost of a one-day delay.

**The submission release gate is non-negotiable.** It exists specifically to prevent the Build 96 situation from recurring.

---

## SECTION 7 — 12-HOUR RELEASE MONITORING

### HONEST ANSWER: I CANNOT PROVIDE AUTONOMOUS MONITORING AFTER YOU LEAVE THE SESSION

Replit Agent runs in a user-initiated session. When the session ends, there is no persistent process that can execute monitoring loops, make HTTP requests, analyze logs, or send alerts. **If you leave the session, monitoring stops.**

**What specifically prevents it:**
- No persistent background process capability in the Replit agent runtime
- No cron scheduler available to the agent between sessions
- No webhook receiver to accept inbound alerts
- No push notification or SMS delivery mechanism for alerting the founder

**What automation IS possible (within this session):**

Before the session ends, I can:
1. Write a monitoring script (`scripts/src/monitor-build97.ts`) that polls all the required endpoints every 60 seconds and writes a structured JSON log to Railway filesystem
2. Set up the existing `/api/readyz/history` endpoint (already built — 12-hour ring buffer, 5-minute intervals) as a passive stability record — **this runs on its own without any agent involvement**
3. Write a cron route (`POST /api/cron/health-snapshot`) that logs pool stats, error counts, and endpoint latencies to a `health_snapshots` DB table — callable externally every 5 minutes

**The closest equivalent to autonomous monitoring:**

| Service | Cost | Setup Time | What It Monitors |
|---------|------|-----------|-----------------|
| **UptimeRobot** (free tier) | $0 | 15 min | HTTP status of `/api/healthz`, `/api/readyz`, auth endpoints — alerts via email/SMS on failure |
| **Better Uptime** | $20/mo | 30 min | HTTP + ping + multi-step checks, incident timeline |
| **Datadog APM** | Free tier | 2 hours | Full APM: latency, error rates, DB pool metrics, traces |
| **Railway native metrics** | Included | 0 | CPU, memory, request count (visible in Railway dashboard — founder must watch manually) |
| **Sentry** (crash reporting) | Free tier | 4–8 hours + EAS rebuild | Mobile crash reports, error rates, performance traces |

**Minimum viable monitoring for Build 97 launch (can be set up today):**

1. **UptimeRobot** (free, 5-min intervals) — monitor these URLs:
   - `https://www.mappingwithmelanin.com/api/healthz`
   - `https://www.mappingwithmelanin.com/api/readyz`
   - `https://www.mappingwithmelanin.com/api/auth/me` (expect 401, not 500)
   - Alerts to founder's email and phone on any non-200/401 response

2. **Railway dashboard** — open during the 12-hour window; watch:
   - Metrics tab: CPU %, memory MB, request volume
   - Logs tab: grep for `ERROR`, `pool`, `timeout`
   - Deployments tab: confirm no unexpected restarts

3. **`/api/readyz/history`** (already built) — passive 12-hour ring buffer
   - Records a synthetic auth + DB check every 5 minutes
   - Accessible at `GET /api/readyz/history` — returns the last 144 check results
   - No agent required — runs automatically as long as the server is up

**What I can build right now:**
I can write a cron endpoint that the founder can call manually (or via a free service like cron-job.org) every 5 minutes to log pool stats, response times, and error counts to a `health_snapshots` table. This creates a permanent audit trail without requiring Sentry or Datadog.

**I will not imply monitoring is occurring if it is not.** After this session, the only monitoring running will be whatever external services the founder configures and the passive `/api/readyz/history` ring buffer.

---

## SECTION 8 — FINAL SUBMISSION DECISION

### Question 1: Based on Manus's report, would I submit Build 97?

**CONDITIONAL YES**

### Question 2: Remaining Blockers

| # | Blocker | Severity | Who Resolves |
|---|---------|----------|-------------|
| 1 | Deploy StripeSync fix + pool config to Railway production | **CRITICAL** | Replit Agent + founder confirms |
| 2 | 12-hour Railway stability window after deployment | **CRITICAL** | Founder watches; `/api/readyz/history` records passively |
| 3 | EAS build run (`eas build --platform all`) | **REQUIRED** | Replit Agent (command only) |
| 4 | Apple Sign-In tested on physical iPhone + iPad against Railway production | **REQUIRED** | Founder (physical device) |
| 5 | iPad layout audit (map, KinfolkAI, community feed) on iPad Air M3 | **REQUIRED** | Founder (physical device) |
| 6 | RevenueCat products confirmed active/Ready to Submit in App Store Connect | **REQUIRED** | Founder (ASC console) |
| 7 | Apple review account (`appstorereview@mappingwithmelanin.com`) created | **REQUIRED** | Founder (ASC console) |
| 8 | Sundown Towns: go/no-go based on DB data confirmation | **CONDITIONAL** | Founder (DB query + decision) |
| 9 | Community feed seeded with 5–10 founder posts | **RECOMMENDED** | Founder (in-app content) |

### Question 3: Single Greatest Technical Risk

**The Railway fix is not deployed.**

If Apple reviews Build 97 before the StripeSync singleton + pool fix is running on Railway production, the exact failure that caused Build 96's rejection will recur. This is not a hypothetical — it is a confirmed root cause with a load-tested fix that has never run in production.

Evidence: Load test demonstrated 100% success at 30 concurrent users **in Replit dev environment** with the fix applied. The same scenario **without the fix** caused `waitingCount > 10`, pool exhaustion, and 10.13-second login timeouts. Railway production currently has neither the fix nor an increased pool ceiling.

### Question 4: Single Greatest Apple Review Risk

**iPad layout on the Apple review device (iPad Air 11-inch M3, iPadOS 26.5.2).**

Build 96 was reviewed on this exact device configuration. All authentication failed due to pool exhaustion — but the reviewer also had the opportunity to see the UI on an iPad. `UIRequiresFullScreen: false` is declared, meaning the app runs in split-screen. If any screen has a layout that breaks or clips at iPad dimensions, or if the map's `FullMapView` renders incorrectly on iPad, it will be visible to the reviewer.

No iPad-specific layout testing has been conducted for Build 97. This is not a hypothetical — it is a confirmed gap.

### Question 5: Single Greatest Tester Experience Risk

**An empty or broken onboarding flow before the community feed exists.**

Thirty testers arriving on a platform where:
- The community feed is empty (no posts from the community yet)
- Heritage sites may need the `POST /admin/seed-multicultural` endpoint to have been triggered
- KinfolkAI works but there's no "first message" prompt or suggested questions

The tester's first 30 minutes will define word-of-mouth for the tour. A functional but empty-feeling app is worse than a slightly delayed but vibrant one.

Manus's "seed the feed" recommendation is the highest-leverage low-effort action remaining. It requires zero code changes and one hour of the founder's time.

### Question 6: What Would Make Me Stop the Release

1. **Railway deployment fails** — any migration error, startup crash, or pool exhaustion event during the Day 2 stability window
2. **Apple Sign-In fails on a physical device** against Railway production after deployment — even a single failure means the root cause is deeper than identified
3. **RevenueCat products are not in "Ready to Submit" state in ASC** — submission will be accepted by EAS but Apple will not review an app with inactive IAP products
4. **iPad layout is broken on any primary screen** (map, KinfolkAI, community feed) — the Apple reviewer is on iPad

### Question 7: What Gives Me Confidence This Build Is Ready

1. **The root cause is fully understood.** It is not a mystery. It is one `new pg.Pool()` call in the wrong place. The fix is deterministic and load-tested.

2. **Three of Manus's four "Day 1" actions are already complete.** Build number is 97. iOS permissions are clean. Android permissions are deduplicated. The only remaining Day 1 task is deployment.

3. **The core features are architecturally complete.** `cultural-sites.ts` is 350+ lines of real implementation. `kinfolk.ts` has live weather, multi-turn memory, tier limits, and TTS. The community feed has reports, moderation, reposts, and hashtags. This is not a demo.

4. **The submission release gate exists precisely for this situation.** The 11-gate checklist was written after Build 96 specifically to catch the gap that caused that rejection. If every gate is checked before submission, the probability of the same failure recurring is low.

5. **Manus agrees the product is compelling.** "It communicates the vision, provides a rich experience, and solves the technical failures of Build 96." The technical work is done. What remains is deployment execution and physical device verification — both straightforward if taken one step at a time.

---

*This reconciliation report is a read-only analysis document. No code changes, Railway deployments, EAS builds, Apple submissions, or Railway restarts were performed during its preparation.*
