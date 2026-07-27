# Build 97 — Apple 12-Hour Autonomous Monitoring
**Release:** iOS Build 97 · Android versionCode 72 · version 1.1.5
**Monitoring start trigger:** Founder confirms Apple submission
**Evidence file created:** 2026-07-27T23:15:00Z

---

## Monitoring Mechanism

| Field | Value |
|---|---|
| Mechanism | `setInterval` inside the always-on Railway API process (`build97Monitor.ts`) |
| Process | `node static-server.mjs` → spawns `dist/index.mjs` (Railway service `a77b49bb`) |
| Survives Replit chat closure | YES — Railway keeps the process running 24/7 |
| Frequency | Every 5 minutes |
| Duration | 12 hours (144 cycles) |
| Evidence retrieval | `GET /api/monitoring/build97` (x-cron-secret header required) |
| Railway log stream | Every cycle emitted as `BUILD97_MONITOR` JSON log line |

**Note:** This is NOT a Replit conversational session. The monitoring loop runs as a Railway-hosted `setInterval` inside the always-on API server. It continues regardless of whether the Replit chat is open or closed. Results accumulate in a 150-entry ring buffer and are logged to Railway's persistent log stream.

---

## Alert Destinations

Railway log stream (`BUILD97_MONITOR` event with `p0` or `p1` arrays populated).
Retrieve full monitoring state: `GET /api/monitoring/build97` with `x-cron-secret`.

P0 conditions logged at `console.error` · P1 conditions at `console.warn`.

---

## Start-of-Monitoring Baseline (2026-07-27T23:01:16Z)

| Endpoint | Status |
|---|---|
| `GET /api/healthz` | 200 |
| `GET /api/readyz` | 200 |
| `GET /api/version` | SHA `583eec42` |
| Pool: total / idle / waiting | 3 / 0 / 0 |
| `GET /api/businesses?limit=3` | 200 · 3 returned |
| `GET /api/cultural-sites?limit=3` | 200 · 3 returned |
| Historical Sundown Towns | 200 · 3 returned |
| `GET /api/community/posts` | 200 |
| `GET /api/community/guidelines` | 200 · 6 guidelines |
| `GET /api/events` | 200 |
| `POST /api/kinfolk/chat` (availability) | 200 |
| `GET /login` | 200 |
| `GET /privacy` | 200 |
| `GET /terms` | 200 |
| `GET /delete-account` | 200 |
| `POST /api/admin/emergency-token` | 404 (removed) |
| Archive files (zip, ipa) | 404 (blocked) |

---

## Security Status at Monitoring Start

| Item | Status |
|---|---|
| `POST /api/admin/emergency-token` | REMOVED — 404 |
| SESSION_SECRET rotated | YES — 2026-07-27T22:57:00Z |
| Railway redeployed after rotation | YES — `583eec42` confirmed live 22:58:32Z |
| Prior sessions invalidated | YES — cookie signatures from old secret now invalid |
| Zip/archive files blocked | YES — middleware returns 404 before express.static |

---

## Monitoring Categories

### A. Service Health (every cycle)
- `GET /api/healthz` → expect 200
- `GET /api/readyz` → expect 200
- `GET /api/version` → expect SHA `583eec42`

### B. Authentication (every cycle)
- Review-account email login via `POST /api/auth/login-email`
- Gated by `REVIEW_ACCOUNT_PASSWORD` Railway env var
- Status: `skip` until founder adds `REVIEW_ACCOUNT_PASSWORD` to Railway env vars
- P0 alert fires if login returns non-200 once credential is configured

### C. Database & Infrastructure (every cycle)
- Pool: total / idle / waiting counts
- DB latency (SELECT 1 timing)
- P0: `db_query_failed`, `pool_waiting > 0`
- P0: `readyz` non-200

### D. Core Features (every cycle)
- Businesses, cultural sites, Historical Sundown Towns, community posts,
  community guidelines, events, KinfolkAI availability, `/login`, `/privacy`
- P0: Sundown Towns endpoint empty or unavailable
- P1: KinfolkAI unavailable, community posts error, businesses error

### E. Stripe (passive)
- No live charges created during monitoring
- Pool exhaustion from Stripe webhooks is covered by category C pool monitoring
- Stripe singleton fix (StripeSync pool leak) confirmed deployed

---

## P0 Alert Conditions

| Condition | Action |
|---|---|
| `/api/readyz` unavailable | Log error · notify founder · evaluate Apple review pause |
| DB query fails | Log error · notify founder |
| `pool_waiting > 0` persistent | Log error · notify founder |
| Review-account login fails (once credential configured) | Log error · notify founder |
| Historical Sundown Towns endpoint empty | Log error · notify founder |
| Sensitive data or secret exposure | Immediate halt |
| API service restart during ordinary use | Log error · note cycle gap |

## P1 Alert Conditions

| Condition | Action |
|---|---|
| KinfolkAI unavailable | Log warning |
| Community posts endpoint error | Log warning |
| Businesses endpoint error | Log warning |

---

## Review Account Status

| Field | Value |
|---|---|
| Email | appstorereview@mappingwithmelanin.com |
| ID | e57bc8de |
| memberType | founding |
| emailVerified | true |
| approved | true |
| Password known programmatically | NO — set by founder at account creation |
| Authentication monitoring status | `skip` — awaiting `REVIEW_ACCOUNT_PASSWORD` Railway env var |

**Founder action required:** To enable automated login testing, add `REVIEW_ACCOUNT_PASSWORD` as a Railway service env var. This triggers login tests on every monitoring cycle.

---

## Founder Actions Required Before Authentication Monitoring Is Active

1. Go to Railway dashboard → melanin-maps-api service → Variables
2. Add: `REVIEW_ACCOUNT_PASSWORD` = [the password set for appstorereview@mappingwithmelanin.com]
3. Railway will redeploy; monitoring will begin testing login on every subsequent 5-minute cycle

---

## Monitoring Completion

At the end of 12 hours, retrieve the full evidence:

```
GET https://www.mappingwithmelanin.com/api/monitoring/build97
Header: x-cron-secret: [CRON_SECRET value]
```

The response includes:
- `cyclesCompleted` / `cyclesExpected`
- `successRate`
- `p0EventCount` / `p1EventCount`
- `avgDbLatencyMs` / `p95DbLatencyMs`
- `peakPoolTotal` / `peakPoolWaiting`
- Full history ring buffer (last 150 cycles)
- `latest` cycle snapshot

Final verdict (GO / CONDITIONAL GO / NO-GO) will be reported after 144 cycles complete.

---

## Expected Monitoring End

12 hours after Apple submission confirmation (founder to record exact time).

---

*This file is the permanent evidence record for the Build 97 Apple 12-hour monitoring window.*
*Do not include credentials or secret values in this file.*
