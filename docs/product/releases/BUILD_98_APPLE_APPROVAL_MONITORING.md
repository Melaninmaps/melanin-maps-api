# Build 98 — Apple Approval Autonomous Monitoring
**Release:** iOS Build 98 · Android versionCode 73 · version 1.1.5  
**Monitoring start:** 2026-07-27T23:01:16Z (carried forward from Build 97 monitoring window)  
**Evidence file created:** 2026-07-28T13:00:00Z  
**Monitoring class:** Condition-based (not time-limited)  

---

## Monitoring Mechanism

| Field | Value |
|---|---|
| Mechanism | `setInterval` inside always-on Railway API process (`build97Monitor.ts`) |
| Process | `node static-server.mjs` → spawns `dist/index.mjs` (Railway service) |
| Survives Replit chat closure | **YES** — Railway keeps the process running 24/7 independent of Replit |
| Frequency | Every 5 minutes |
| Ring buffer capacity | 288 entries (24 h at 5-min intervals) |
| Evidence retrieval | `GET /api/monitoring/build97` with `x-cron-secret` header |
| Railway log stream | Every cycle emitted as `BUILD98_MONITOR` JSON log line |
| KinfolkAI synthetic | Every 12th cycle (≈ once/hour) when `REVIEW_ACCOUNT_PASSWORD` is set |

**This is NOT a Replit conversational session.** The monitoring loop runs as a Railway-hosted `setInterval` inside the always-on API server. Results accumulate in a 288-entry ring buffer and are logged to Railway's persistent log stream.

---

## Stop Condition

**NOT time-based.** Monitoring continues until ALL of the following are simultaneously true:

1. `APPLE_REVIEW_STATUS` env var = `approved` or `ready_for_sale`
2. Zero P0 incidents recorded in the ring buffer
3. 144 consecutive stable cycles (12 h) after Apple approval with no P0

**If Apple rejects:**
- Monitor continues — does not stop
- Rejection recorded as P0 flag `apple_rejected` or `apple_metadata_rejected`
- Evidence window preserved
- Founder must be notified immediately
- Monitor ends only when founder explicitly sets `APPLE_REVIEW_STATUS=monitoring_ended`

**If Apple review remains pending for multiple days:** monitoring remains active throughout.

---

## Current Apple Status

| Field | Value |
|---|---|
| Status | `waiting_for_review` (manual — no App Store Connect API access) |
| Direct ASC monitoring | **NOT available** — no App Store Connect API integration |
| Founder action required | Report Apple status changes by setting `APPLE_REVIEW_STATUS` Railway env var |
| Review account | `appstorereview@mappingwithmelanin.com` · UUID `e57bc8de` · tier `founding` |

Apple review status values accepted by the monitor:
- `waiting_for_review`
- `in_review`
- `approved`
- `ready_for_sale`
- `rejected`
- `metadata_rejected`
- `developer_action_needed`
- `pending_developer_release`
- `monitoring_ended` (founder-authorized shutdown only)

---

## P0 Incident — Pool Exhaustion (2026-07-28)

| Field | Value |
|---|---|
| Detected | 2026-07-28T12:47:13Z |
| Duration | ~9+ hours (105 of 111 prior cycles affected) |
| Root cause | `Promise.race` + `pool.query("SELECT 1")` leaked a pg client per timeout cycle. Each cycle where SELECT 1 took >3s abandoned the pg Promise externally — the pg library's internal `.then()` chain continued holding the checked-out client until `maxLifetimeSeconds` (1800s) expired. Over time all 8 pool slots were consumed by leaked clients. |
| Evidence | `latest_pool: {"total":8,"idle":0,"waiting":2}` · `db_query_failed` · `readyz=503` · all DB-backed endpoints timing out (status 000) |
| Fix shipped | `pool.connect()` + explicit `client.release()` in `finally` block in both `build97Monitor.ts` and `healthMonitor.ts`. Connection is now always returned to the pool regardless of how the Promise chain resolves. |
| Recovery | Railway service redeployed on git push `HEAD` → process restart clears all leaked connections |
| Commit | Deployed with monitor extension changes |
| Status | **RESOLVED** — pending Railway redeploy confirmation |

---

## Monitoring Categories

### A. Service Health (every cycle)
- `GET /api/healthz` → expect 200
- `GET /api/version` → expect current SHA
- `readyz` derived from internal DB probe (avoids concurrent pool saturation)

### B. Authentication (every cycle)
- Review-account email login via `POST /api/auth/login-email`
- Uses `REVIEW_ACCOUNT_EMAIL` + `REVIEW_ACCOUNT_PASSWORD` Railway env vars
- P0 alert on any login failure once credential is configured

### C. Database & Infrastructure (every cycle)
- Pool: total / idle / waiting
- DB latency (SELECT 1 via explicit `pool.connect()` → always released)
- Active session count from `sessions` table
- P0: `db_query_failed`, `pool_waiting > 0`

### D. Core Features (every cycle)
| Endpoint | Alert level |
|---|---|
| `GET /api/businesses?limit=1` | P1 if error |
| `GET /api/cultural-sites?limit=1` | P1 if error |
| `GET /api/cultural-sites?heritageCategory=Historical%20Sundown%20Town&limit=1` | P0 if empty · P1 if error |
| `GET /api/community/posts?limit=1` | P1 if error |
| `GET /api/community/guidelines` | P1 if error |
| `GET /api/events?limit=1` | P1 if error |
| `GET /api/kinfolk/health` | P1 if unavailable |
| `GET /login` | P0 if error |
| `GET /privacy` | P1 if error |
| `GET /terms` | P1 if error |
| `GET /delete-account` | P1 if error |

### E. Capacity Signals (every cycle)
- Pool trend (monotonic connection growth = P1)
- HTTP 500 count per cycle
- Timeout count per cycle

### F. KinfolkAI Synthetic Prompt (every 12th cycle ≈ hourly)
- Authenticated session (review account)
- Prompt: "Tell me briefly about Philadelphia."
- Pass criteria: status 200, coherent response (>10 chars), no raw provider error exposed
- Cost-controlled: never runs every 5 minutes

---

## Alert Destinations

Railway log stream — `BUILD98_MONITOR` JSON event with `p0` / `p1` arrays.  
Evidence retrieval: `GET https://www.mappingwithmelanin.com/api/monitoring/build97` with `x-cron-secret`.

P0 conditions logged at `console.error` · P1 at `console.warn` · clean cycles at `console.info`.

---

## P0 Alert Conditions

| Condition | Action |
|---|---|
| DB query fails | Log error · document in this file |
| `pool_waiting > 0` | Log error · document in this file |
| Review-account login fails | Log error · notify founder |
| Historical Sundown Towns endpoint empty | Log error · evaluate Apple review pause |
| Apple rejects build | Log error (p0 flag) · notify founder immediately · continue monitoring |
| Sensitive data or secret exposure | Immediate halt |
| API service restart during active review | Log error · note cycle gap |

## P1 Alert Conditions

| Condition | Action |
|---|---|
| KinfolkAI health unavailable | Log warning |
| KinfolkAI synthetic prompt fails | Log warning |
| Community posts / businesses endpoint error | Log warning |
| Legal pages (privacy/terms/support) unavailable | Log warning |
| Repeated timeouts | Log warning |
| Pool connections growing monotonically | Log warning |

---

## Review Account Status

| Field | Value |
|---|---|
| Email | appstorereview@mappingwithmelanin.com |
| UUID | e57bc8de |
| Tier | founding |
| Auth monitoring | Active when `REVIEW_ACCOUNT_PASSWORD` is set as Railway env var |

---

## Founder Actions Required

1. **Apple status updates:** When Apple changes review status (In Review, Approved, Rejected, etc.), set Railway env var `APPLE_REVIEW_STATUS` to the corresponding value. The monitor tracks the stop condition against this value.

2. **Activate auth monitoring (if not already set):** Confirm `REVIEW_ACCOUNT_PASSWORD` is set in Railway Variables for `melanin-maps-api` service. This enables automated login testing on every 5-minute cycle.

3. **Report tester incidents:** For any crash, freeze, or authentication failure reported by testers, provide: timestamp, platform, build number, device/OS, screen, last action, first failing event.

---

## Cumulative Evidence Log

| Period | Cycles | P0 Cycles | P1 Cycles | DB Avg (ms) | Notes |
|---|---|---|---|---|---|
| 2026-07-27T23:01Z – 2026-07-28T~03:30Z | ~6 (est.) | ~0 | ~6 | ~2 | P1s from Replit→prod network timeouts (non-critical) |
| 2026-07-28T~03:30Z – 2026-07-28T12:47Z | 111 | 105 | 107 | — | **P0: pool exhaustion from Promise.race leak** |
| 2026-07-28T12:47Z+ | ongoing | TBD | TBD | TBD | Post-fix monitoring after Railway redeploy |

---

## Post-Approval Monitoring Gate

When Apple approves:
- `approvalDetectedAt` timestamp recorded
- `postApprovalStableCycles` counter starts
- Must reach 144 (12 h) with zero P0 to satisfy stop condition
- Any P0 during this window resets the counter to 0

---

## Final GO / NO-GO

| Criterion | Status |
|---|---|
| API continuously available for 12h post-approval | PENDING |
| Zero P0 incidents post-approval | PENDING |
| DB connections stable (no growth, no waiting) | PENDING — pool exhaustion incident resolved |
| Review-account login verified | PENDING — requires `REVIEW_ACCOUNT_PASSWORD` |
| KinfolkAI synthetic prompt passing | PENDING |
| All core endpoints returning 200 | PENDING — post-redeploy |
| Historical Sundown Towns non-empty | PENDING — post-redeploy |
| Apple status = approved or ready_for_sale | PENDING — in review |

---

*Do not include credentials, tokens, private user content, or secrets in this file.*  
*This file is the permanent evidence record for the Build 98 Apple approval monitoring window.*
