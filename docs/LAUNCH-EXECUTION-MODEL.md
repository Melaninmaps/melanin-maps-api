# LAUNCH EXECUTION MODEL
## Apple Remediation Release — Delivery Plan
### Created: July 29, 2026

---

## SECTION 1 — BRANCH STRUCTURE

Three workstreams are now permanently separated. No future work may enter the release branch without explicit written authorization.

| Branch | Purpose | Status |
|---|---|---|
| `release/apple-remediation` | Apple submission only | **Created — pushed to GitHub** |
| `develop/next-build` | Approved roadmap continuing in parallel | **Created — pushed to GitHub** |
| `main` | Source of both branches; receives merges after Apple approval | Active |

### `release/apple-remediation` contains only:
- PostgreSQL connection-leak corrections (pool pressure guard, StripeSync singleton)
- `member_agreements` table and server-side agreement recording
- Community Agreement onboarding screen
- Private membership onboarding copy and navigation order
- Map timeout fixes (BusinessMapView, FullMapView)
- Events member-attribution filter
- Business detail community signal strip
- App Review metadata and notes
- Connection pool instrumentation (audit capability, not a feature)

**Nothing else may enter this branch.**

### `develop/next-build` rules:
- All incomplete features behind server-side and client-side feature flags, default OFF in production
- No migrations that touch auth, session, navigation, or Maps
- No merges into `release/apple-remediation` before Apple approval
- Approved features assigned to this track listed in Section 11

---

## SECTION 2 — REQUIRED DELIVERY PLAN

### 2.1 — Task owner matrix

| Task | Owner | Tool Required |
|---|---|---|
| Pool instrumentation live in production | Replit Agent | ✅ Code complete — Railway redeploy needed |
| Pool stability evidence (65-min sustained test) | Founder | Railway dashboard — watch `/api/readyz/history` |
| Apple Sign-In 50-attempt test | Founder | Physical iPhone + production app |
| Email login 50-attempt test | Founder | Physical iPhone + production app |
| Session persistence (close/reopen/background) | Founder | Physical iPhone + production app |
| Demo account creation and population | Founder | App Store Connect + physical device |
| Demo account — DB agreement record | Replit Agent | Can insert via DB tool after account creation |
| EAS build | Founder | EAS CLI with Apple credentials |
| Fresh iPhone install test | Founder | Physical device |
| Fresh iPad install test | Founder | Physical device + separate Apple ID |
| App Review submission | Founder | App Store Connect |
| App Review notes (submitted with build) | Replit Agent | ✅ Draft at `docs/apple-review-notes.md` |
| Production Railway redeploy | Founder | Railway dashboard |
| Git tag the release commit | Replit Agent | Can execute |

---

### 2.2 — What Replit can complete directly

✅ **Complete — no founder action needed:**
- Pool pressure guard middleware (deployed)
- `member_agreements` schema, API routes, DB table (deployed)
- Community Agreement screen, onboarding copy, navigation order
- Map GPS timeout fixes
- Events member-attribution filter
- Business detail community signal strip
- Pool instrumentation code (ready — needs Railway redeploy to activate)
- App Review notes draft
- `release/apple-remediation` and `develop/next-build` branches pushed to GitHub
- Git tag on release commit (execute on command)
- Demo account DB agreement record (execute after account is created)

---

### 2.3 — What requires Railway dashboard access

**Founder must do:**
1. Redeploy the production Railway service to pick up pool instrumentation and pressure guard changes. This is a single "Deploy" click on the current commit in Railway.
2. Watch Railway logs during the sustained pool stability test — 65+ minutes of real traffic with pool stats visible.
3. If pool exhaustion recurs, use Railway's "Restart" button (not just "Redeploy") — the pressure guard will shed load instantly on restart.

---

### 2.4 — What requires App Store Connect access

**Founder must do:**
1. Create the Apple review demo account in App Store Connect under "Review Information → Demo Account."
2. Submit the build with the App Review notes from `docs/apple-review-notes.md` pasted into the "Notes" field.
3. If Apple requests a video call, accept via Resolution Center.

---

### 2.5 — What requires founder action

**Ordered by sequence:**

| Step | Action | Hours |
|---|---|---|
| 1 | Redeploy Railway production (pick up instrumentation) | 0.25 |
| 2 | Create demo account on a physical iPhone | 1.5 |
| 3 | Populate demo account (feed, reviews, circles, events, KinfolkAI, saves) | 4.0 |
| 4 | Run 65-minute pool stability test and collect `/api/readyz/history` evidence | 1.25 |
| 5 | Run Apple Sign-In production test (50 consecutive attempts) | 0.5 |
| 6 | Run email login production test (50 consecutive attempts) | 0.5 |
| 7 | Run session persistence test (close, reopen, background/foreground) | 0.5 |
| 8 | Fresh iPhone install from App Store Connect TestFlight (internal) | 0.5 |
| 9 | Fresh iPad install from TestFlight | 0.5 |
| 10 | Confirm account deletion works end-to-end | 0.25 |
| 11 | EAS build: `eas build --platform ios --profile production` | 0.25 (wall time: ~25 min) |
| 12 | Submit via App Store Connect | 0.5 |

**Total founder hours: ~10.5 hours of active work**

---

### 2.6 — Estimated engineering hours (Replit)

| Work | Hours |
|---|---|
| Pool instrumentation implementation | 3 |
| `member_agreements` schema + routes + mobile integration | 2.5 |
| Community Agreement screen + onboarding | 1.5 |
| Pool pressure guard + events filter + map timeouts | 1 |
| Branch creation + delivery plan documentation | 1 |
| Demo account DB record (post-creation) | 0.25 |
| Git tag on release commit | 0.1 |
| **Total** | **~9.3 hours** |

---

### 2.7 — Parallel vs. sequential dependencies

```
PARALLEL BLOCK A (Replit — complete)
  ├─ Pool instrumentation
  ├─ member_agreements
  ├─ Agreement screen + onboarding
  ├─ Pool pressure guard
  └─ Branch structure

         ↓ (Railway redeploy — Founder, 0.25h)

PARALLEL BLOCK B (Founder)
  ├─ Demo account creation + population (4h)
  │      ↓
  │   Replit: insert DB agreement record (0.25h after account created)
  │
  ├─ Pool stability test 65+ min (1.25h — runs while demo account is populated)
  ├─ Apple Sign-In 50x test (0.5h)
  └─ Email login 50x test (0.5h)

         ↓ (all PARALLEL BLOCK B must complete)

SEQUENTIAL: Fresh iPhone install test
SEQUENTIAL: Fresh iPad install test
SEQUENTIAL: Session persistence test
SEQUENTIAL: Account deletion test

         ↓ (all pass)

EAS BUILD — eas build --platform ios --profile production
  Record: Git commit SHA, EAS build number, Railway deployment ID, DB migration (v1: member_agreements)

         ↓ (build arrives in App Store Connect, ~25 min)

SUBMIT — paste App Review notes, enter demo credentials, submit
```

---

### 2.8 — Earliest technically responsible EAS build point

**The EAS build must not be started until all of the following are true:**

1. Railway has been redeployed on the `release/apple-remediation` commit
2. Pool stability test has run for ≥65 minutes (the length of the previous failure window) with no growth events logged to `/api/pool/audit`
3. Apple Sign-In has succeeded on 50 consecutive production attempts without a 500 or 401
4. Email login has succeeded on 50 consecutive production attempts without a 500 or 401
5. Demo account exists, has a `member_agreements` DB record, and passes the content checklist
6. Fresh iPhone install confirms no empty screens, no setup prompts
7. Fresh iPad install confirms layout is correct at iPad viewport
8. Session persistence test passes (reopen after 24 hours, background/foreground)
9. Account deletion test passes end-to-end

**If any item fails: build stops. The failure is investigated and fixed before restarting the checklist.**

A build that skips this checklist is a repeat of the July 28 failure mode.

---

### 2.9 — Exact GO/NO-GO criteria

**GO requires all of the following — no exceptions:**

| Gate | Pass condition | Evidence |
|---|---|---|
| Pool stability | Zero POOL_GROWTH_DETECTED warnings in `/api/pool/audit` over 65+ minutes | Screenshot of audit endpoint |
| Pool idle | Pool returns to `idle >= 1` within 60s after test traffic stops | Pool stats log |
| Apple Sign-In | 50/50 successful authentications in production | Log showing 50 `AUTH_APPLE` success events |
| Email login | 50/50 successful authentications in production | Log showing 50 `AUTH_REGISTER` and `AUTH_LOGIN` success events |
| Session persistence | Session survives 24h + background/foreground + airplane mode | Manual test documented |
| Map timeout | Map spinner stops ≤8s on degraded GPS — never infinite | Screen recording |
| Demo account | Fresh iPhone: no empty screens, no setup prompts, all 7 surfaces populated | Checklist signed off |
| iPad | Fresh iPad: layout correct on all screens | Screenshot set |
| Agreement DB | Demo account has a `member_agreements` row with `active=true` | DB query result |
| Account deletion | Deletes session, account visible as anonymized in DB within seconds | DB query before/after |
| Source match | Railway deployment ID matches commit SHA on `release/apple-remediation` | Railway deploy detail |
| Binary match | EAS build number matches app.json `buildNumber` | EAS build detail |

**NO-GO if any gate fails. The release does not proceed. The failure is fixed, the gate is re-run.**

---

### 2.10 — Rollback plan

**Railway (API server):**
- Railway retains the last N deployment snapshots. In the Railway dashboard → Deployments → select a previous deployment → "Redeploy." Takes ~60 seconds.
- No database rollback is needed for this release. The only migration (`member_agreements`) is additive and backward-compatible. Prior code runs fine against the new schema — the table is just not used.

**iOS binary:**
- App Store Connect → "Phased Release" should be used for the submission. If critical issues emerge after approval and during phased rollout, Apple allows pulling a build before 100% rollout.
- Worst case: submit the previous approved binary as a new build. The previous binary (VC93/build 93) is already accepted by Apple and can be resubmitted with a corrected description.

**Database:**
- `member_agreements` table is additive only. No rollback needed.
- If the pool pressure guard causes false positives (503s during normal traffic), it can be disabled by redeploying with the guard commented out — a 3-minute code change and 3-minute Railway deploy.

---

### 2.11 — Next-build features continuing in parallel on `develop/next-build`

These features are approved and may continue without delaying the release branch:

| Feature | Status | Flag required |
|---|---|---|
| GPT-5 / GPT-5-mini upgrade (Tasks #39, #40) | Pending | Yes — server-side model name env var |
| CSV export for admin leads (Task #35) | Pending | Yes — admin-only |
| Export CSV row count chip (Task #36) | Pending | Yes — admin-only |
| Refresh button spinner (Task #41) | Pending | Yes — client-side |
| Stale role prevention (Task #32) | Pending | No flag needed — defensive code |
| Role in OpenAPI spec (Task #33) | Pending | No flag needed — additive only |
| Nudge send date in admin (Task #50) | Pending | Yes — admin-only |
| Business detail API type fix (Task #52) | Pending | No flag needed |
| Type error prevention (Task #54) | Pending | No flag needed — CI/build |
| Auto-reload for pitch deck (Task #17) | Pending | N/A — slides only |
| Email domain update (Task #18) | Pending | Yes — config only, no migration |
| Privacy Policy page (Task #19) | Pending | No flag needed |
| E2E test automation (Task #29, implemented) | Complete | N/A |
| Broken API route detection (Task #53) | Pending | No flag needed |

**Constraint:** None of these may touch authentication, session handling, navigation (tab order, initial route), Maps, or the connection pool until `release/apple-remediation` is approved by Apple.

---

### 2.12 — Future work will not delay the release branch

The branch separation enforces this structurally: `develop/next-build` and `release/apple-remediation` are now independent git branches on GitHub. Work on `develop/next-build` cannot enter `release/apple-remediation` unless a merge PR is explicitly opened and approved. No merge PR will be opened until Apple approves the submission.

The release branch is frozen to its current content. Replit work on approved tasks continues on `develop/next-build`. The two workstreams are permanently parallel until Apple approval.

---

## SECTION 3 — CONNECTION POOL AUDIT RESULTS

Completed July 29, 2026.

### Pattern audit — all 9 patterns searched

| Pattern | Instances | Risk | Status |
|---|---|---|---|
| `pool.connect()` without `finally` | **0** | Critical | ✅ Clean |
| `new Pool()` outside singleton | **0** | Critical | ✅ Clean |
| `Promise.race` around DB operations | **0** | Critical | ✅ Clean — explicitly prohibited in comments |
| `db.transaction()` with external API calls inside | **0** | High | ✅ Only 1 transaction found (points redemption, DB-only) |
| Streaming queries | **0** | Medium | ✅ Clean |
| `pool.on()` / LISTEN/NOTIFY holding connections | **0** | Medium | ✅ Clean |
| Per-request pool creation | **0** | Critical | ✅ Clean — StripeSync per-request bug fixed |
| Session store creating its own pool | **N/A** | Low | Session is stateless JWT — no session store |
| Long `pool.connect()` without timeout | **0** | High | ✅ All 5 uses have AbortSignal or timeoutMillis |

### `pool.connect()` locations — all verified safe

1. `app.ts:100` — `/api/readyz` public health route — `finally { client?.release() }` ✅
2. `healthMonitor.ts:96` — 5-minute background monitor — `finally { client?.release() }` ✅
3. `db-probe.ts:35` — internal diagnostic — `finally { rawClient?.release() }` ✅
4. `readyz.ts:39` — internal readiness route — `finally { rawClient?.release() }` ✅
5. `users.ts:507` — account deletion transaction — `finally { client.release() }` ✅

### `new Pool()` locations — both singletons

1. `lib/db/src/index.ts:62` — main application pool, lazy-init singleton, `max: POOL_MAX` ✅
2. `stripeClient.ts` — `StripeSync` internal pool, promise-based singleton with `max: 2`, drained on `SIGTERM` ✅

### Pool pressure guard (new — deployed)

Added July 29, 2026 to `app.ts`. Rejects any `/api/*` request immediately with HTTP 503 when `total >= POOL_MAX AND idle === 0 AND waiting >= 2`. Prevents request queue cascade during saturation. Logs `POOL_GROWTH_DETECTED` event.

### Pool instrumentation (new — deployed, Railway redeploy needed)

`lib/db/src/pool-instrumentation.ts` — attaches to pg.Pool events (`connect`, `remove`, `error`) and wraps `pool.query()` to time every query. Sweeps every 60s for growth signals. 500-event ring buffer. Accessible via `/api/internal/pool-audit`.

---

## SECTION 4 — PERMANENT RELEASE GATES

These gates apply to every future EAS submission, not just this one.

The release fails automatically if any of the following is true:

| Failure condition | Detection method |
|---|---|
| Any login fails during 50-attempt test | Auth event log in Railway |
| Pool connections grow without returning to idle | `/api/pool/audit` sweep events |
| Waiting connections remain after traffic stops | `/api/readyz/history` |
| A 401 produced by a dependency failure (not auth) | Error log scan |
| Map spinner runs beyond 8s | Screen recording |
| Any required review screen is empty | Device checklist |
| Source, deployment, and binary fingerprints do not match | Documented at build time |

### Gate checklist template (copy for each submission)

```
EAS BUILD GATE CHECKLIST
Date: _______________
EAS Build Number: _______________
Git Commit SHA: _______________
Railway Deployment ID: _______________
DB Migration version: _______________

[ ] Railway redeployed on release branch commit
[ ] Pool stability test: _____ minutes, zero POOL_GROWTH events
[ ] Pool idle after test: idle=___ total=___
[ ] Apple Sign-In: ___/50 successful
[ ] Email login: ___/50 successful
[ ] Session close/reopen: PASS / FAIL
[ ] Background/foreground: PASS / FAIL
[ ] Network failure without token deletion: PASS / FAIL
[ ] Map: allowed GPS PASS / denied GPS PASS / slow GPS PASS
[ ] iPhone fresh install: PASS / FAIL
[ ] iPad fresh install: PASS / FAIL
[ ] Demo account content checklist: PASS / FAIL
[ ] Community Agreement DB record: PASS / FAIL
[ ] Account deletion: PASS / FAIL
[ ] Production rollback test (Railway): PASS / FAIL

GO / NO-GO: _______________
Authorized by: _______________
```

---

## SECTION 5 — RECORD AT BUILD TIME

When the EAS build is started, record:

| Field | Value |
|---|---|
| Git commit SHA | `git rev-parse HEAD` on `release/apple-remediation` |
| EAS build number | From `app.json` `buildNumber` + `versionCode` |
| Railway deployment ID | From Railway dashboard → current deployment |
| DB migration | `member_agreements` v1 (applied July 29, 2026) |
| Pool instrumentation version | v1 (applied July 29, 2026) |
| Pool pressure guard version | v1 (applied July 29, 2026) |
| Apple review notes version | v1 at `docs/apple-review-notes.md` |

These values must match each other. A build that cannot trace its source to a specific tagged commit on `release/apple-remediation` is not submitted.
