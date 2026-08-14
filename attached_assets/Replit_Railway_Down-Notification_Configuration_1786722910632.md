# Replit/Railway Down-Notification Configuration

Copy the following request to Replit exactly. Replace only the notification destinations and secret placeholders. Do not place passwords, bearer tokens, cookies, or raw response bodies in logs or alerts.

## Deployment to monitor

```text
Production base URL:
https://api-server-production-a991.up.railway.app

Application:
Mapping With Melanin — MWM production

Environment:
production
```

## Required monitors

| Monitor | Method | URL/path | Interval | Timeout | Failure condition |
|---|---|---|---:|---:|---|
| Railway health | GET | `/api/healthz` or the actual documented health endpoint | 60 sec | 10 sec | Any non-2xx, DNS failure, TLS failure, or timeout |
| Application root | GET | `/` | 60 sec | 10 sec | Any 5xx, redirect to a mockup route, DNS/TLS failure, or timeout |
| Tester authentication | POST | `/api/auth/login-email` | 5 min | 15 sec | Any non-200, invalid JSON, or missing token field |
| Business API | GET | `/api/businesses?limit=1` | 2 min | 15 sec | Any non-200 or invalid JSON |
| Library API | GET | `/api/library/topics?limit=1` | 2 min | 15 sec | Any non-200 or invalid JSON |
| Kinfolk smoke | POST | `/api/kinfolk/chat` | 5 min | 45 sec | Any 5xx, timeout, or missing reply |

The tester authentication and Kinfolk smoke checks must use dedicated monitoring credentials stored in Railway/Replit Secrets or the monitoring provider’s secret vault. Do not reuse the 30 public beta accounts.

## Secrets

Create these as secrets, never as source code or plain-text configuration:

```text
MWM_MONITOR_EMAIL=<dedicated-monitor-account-email>
MWM_MONITOR_PASSWORD=<dedicated-monitor-account-password>
MWM_MONITOR_KINFOLK_PROMPT=What can I learn from the Divine Nine library topic?
```

The monitoring job may retain only a boolean result, HTTP status, latency, and timestamp. It must discard tokens immediately after each check.

## Alert thresholds

Trigger a **warning** when any endpoint has three consecutive failures or five consecutive responses above 3,000 ms. Trigger a **critical outage** when any of the following occurs:

```text
- Three consecutive health failures within five minutes.
- Any DNS or TLS failure confirmed by two independent checks.
- Any five consecutive 5xx responses.
- Login returns non-200 three times in a row.
- Kinfolk returns 5xx or times out three times in a row.
- Railway reports the service as crashed, stopped, or unreachable.
```

Do not alert on one isolated failure. Use a second independent probe where possible so a monitoring-provider outage is not mistaken for an MWM outage.

## Notification channels

Configure at least two channels:

```text
Primary: email — <user email>
Secondary: mobile-capable channel — SMS, push, Slack, or Discord destination
```

Send a warning to the primary channel. Send a critical outage to both channels. Send a recovery notification after three consecutive successful checks. Include a link to the Railway deployment and the incident dashboard if available.

## Alert message format

Use this exact redacted format:

```text
MWM PRODUCTION ALERT
Severity: CRITICAL
Monitor: <health|root|login|business-api|library-api|kinfolk>
URL: <path only; no query secrets>
Detected UTC: <timestamp>
HTTP status: <status or DNS/TLS/TIMEOUT>
Latency ms: <number or null>
Consecutive failures: <number>
Deployment/commit: <commit SHA if available>
Action: Check Railway deployment, logs, health, and rollback status.
```

Never include:

```text
- Authorization headers
- Session IDs or cookies
- Passwords
- Raw response bodies
- User email addresses except the dedicated monitor identifier in a private dashboard
- User prompts if they can contain personal information
```

## Railway deployment notifications

Enable Railway notifications for:

```text
- Deployment failed
- Deployment rolled back
- Service crashed or restarted repeatedly
- Health check failed
- Database unavailable
- Environment variable/configuration change
- CPU or memory saturation if available
```

Route these alerts to the same primary and secondary notification channels. Configure a recovery message when the service returns to healthy status.

## Weekly notification test

Run one scheduled synthetic test every week. It must produce a clearly labeled test alert and recovery alert:

```text
MWM MONITORING TEST — NOT AN OUTAGE
The scheduled uptime and notification path test is functioning.
```

Replit must retain only the test timestamp, monitor name, status, and notification-delivery confirmation.

## Required proof from Replit

Return a redacted screenshot or JSON export showing:

```text
- All monitor names and paths
- Check intervals and timeouts
- Warning and critical thresholds
- Primary and secondary channels configured
- Last successful check for each monitor
- Recovery notification enabled
- Weekly test alert scheduled
- Dedicated monitoring credentials stored as secrets
- No tester tokens or raw response bodies in alert history
```

## Incident response

When a critical alert fires, Replit must first confirm whether Railway is down, the API is unhealthy, or only one provider such as KinfolkAI is failing. If the application is down, they should acknowledge the incident, inspect the latest deployment, roll back to the last known-good commit if necessary, and send a recovery message after three successful checks.

For a Kinfolk-only failure, the website should remain available and the Kinfolk feature should return a clear degraded response rather than taking down the application. For a database failure, Replit must not run destructive migrations during the incident; they should restore service or roll back using the documented backup procedure.
