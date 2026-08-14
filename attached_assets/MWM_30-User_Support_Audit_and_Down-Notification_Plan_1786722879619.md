# MWM 30-User Support Audit and Down-Notification Plan

## Decision

The Railway deployment supports the tested 30-user proof-of-concept workload for concurrent authentication and read-only core traffic.

The main audit used the existing 30 tester accounts, created no new users, performed no writes, and executed 210 authenticated read requests after the 30-user login burst. All 210 requests returned HTTP 200.

| Measurement | Result |
|---|---:|
| Existing tester accounts used | 30 |
| Concurrent login success | 30/30 |
| Authenticated read requests | 210/210 HTTP 200 |
| Total burst time | 5.6 seconds |
| Cross-account identity matches | 30/30 |
| Tokens printed or stored in output | 0 |
| Writes performed | 0 |

Median/max response times during the read-only burst were:

| Endpoint | Median | Maximum |
|---|---:|---:|
| `/api/auth/user` | 141 ms | 821 ms |
| `/api/businesses?limit=20` | 181 ms | 782 ms |
| `/api/businesses/map-pins` | 221 ms | 1,113 ms |
| `/api/library/topics?limit=20` | 364 ms | 1,055 ms |
| `/api/library/collections` | 236 ms | 409 ms |
| `/api/events?limit=20` | 122 ms | 1,897 ms |
| `/api/cultural-sites?limit=20` | 129 ms | 244 ms |

## Scope limitation

This proves support for the tested 30-user, read-heavy proof-of-concept pattern. It does not prove unlimited sustained traffic, write-heavy concurrency, image uploads, simultaneous KinfolkAI generations, or business-owner/admin operations. Those should be tested separately with dedicated load-test accounts and a controlled schedule.

A separate identity check initially encountered HTTP 429 responses when run immediately after the first burst. The corrected check used bounded concurrency and retry handling and verified 30/30 account-to-session identity matches. Replit should document the rate-limit policy and monitor whether real testers encounter 429s during onboarding.

## Message to Replit: enable down notifications

> Please configure production uptime and down notifications for `https://api-server-production-a991.up.railway.app` and the critical API endpoints. I will be traveling and need to know promptly if the app becomes unavailable.
>
> Configure checks for:
>
> 1. `GET /api/healthz` or the actual production health endpoint.
> 2. `POST /api/auth/login-email` using a disposable monitoring account, with the password stored only in the monitoring provider's secret store.
> 3. `GET /api/businesses?limit=1` after authentication if the monitor supports a secure token flow.
> 4. The public application root and the Railway deployment health status.
>
> Alert when there are three consecutive failures, when the response is 5xx, when DNS/TLS fails, or when latency exceeds 3 seconds for five consecutive checks. Send alerts through at least email and one mobile-capable channel such as SMS, push, Slack, or Discord. Include the check name, UTC timestamp, HTTP status, latency, and Railway deployment identifier. Do not include passwords, bearer tokens, cookies, full response bodies, or personal user data.
>
> Configure a recovery notification when three consecutive checks succeed again. Add a weekly test alert so we know the notification path still works. Return a redacted screenshot or JSON confirmation showing the monitors, interval, thresholds, notification destinations, and last successful check.

## Recommended production safeguards

Replit should also enable Railway deployment notifications, error-rate alerts, database availability alerts, and a daily backup confirmation. The monitoring account must be dedicated and excluded from ordinary tester metrics. Rotate all previously exposed audit sessions and never attach raw login response bodies to future reports.
