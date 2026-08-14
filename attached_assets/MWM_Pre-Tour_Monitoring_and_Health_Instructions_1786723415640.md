# MWM Pre-Tour Monitoring and Health Instructions

## 1. Configure the mobile alerts

Give Replit `MWM_RAILWAY_MOBILE_ALERT_CONFIG.yaml`. They should import the monitor definitions into the monitoring service they use or reproduce the same configuration in Railway plus their alert provider. The file deliberately uses placeholders for the user’s email, mobile destination, and secret references.

The required alert conditions are:

| Condition | Alert |
|---|---|
| Three consecutive health/root failures | Critical mobile alert |
| Three consecutive 5xx responses | Critical mobile alert |
| Degraded KinfolkAI rate greater than 5% over 15 minutes, minimum 20 requests | Warning; escalate at 15% |
| p95 latency above 3 seconds for three windows | Warning |
| Three consecutive successful checks after outage | Recovery alert |

Replit must return redacted confirmation that the monitors and mobile channel are active. Do not send a phone number, webhook secret, password, token, or cookie to me in the audit output.

## 2. Configure the dedicated monitor account

Create a dedicated non-tester monitoring account and store its credentials only in Railway/Replit Secrets or the monitoring provider’s vault. Do not use the 30 beta accounts for monitoring. Set:

```bash
export MWM_MONITOR_EMAIL='dedicated-monitor@example.com'
export MWM_MONITOR_PASSWORD='stored-in-secret-vault'
export BASE_URL='https://api-server-production-a991.up.railway.app'
```

## 3. Run the pre-tour health gate

From a terminal containing `mwm_pre_tour_health_check.py`, run:

```bash
python3 mwm_pre_tour_health_check.py > mwm-pre-tour-result.json
status=$?
cat mwm-pre-tour-result.json
exit $status
```

The command is successful only when the JSON ends with:

```json
"result": "PASS"
```

The script checks the root, health endpoint, login, business API, map pins, Library topics, Library collections, events, cultural sites, and three KinfolkAI questions. It performs no writes and never prints tokens or response bodies.

## 4. Add degraded fallback telemetry

Apply `MWM_KINFOLK_DEGRADED_TELEMETRY_PATCH.ts` inside the existing KinfolkAI route. The normal successful response records `degraded=false`. The Library fallback records `degraded=true`, `degradedReason=provider_transient_error_library_fallback`, and the provider status without logging the prompt or response.

If Railway can run multiple application instances, replace the in-memory rolling window with the project’s shared metrics/Redis/observability system. Otherwise the 5% calculation is process-local.

## 5. Verify telemetry after deployment

Run at least 20 Kinfolk smoke requests and induce or wait for a controlled provider fallback in staging. Replit must return a redacted event showing:

```json
{
  "requestId": "redacted-or-hash-only",
  "questionClass": "library",
  "status": 200,
  "degraded": true,
  "degradedReason": "provider_transient_error_library_fallback",
  "providerStatus": 503,
  "latencyMs": 1234,
  "tokens_redacted": true
}
```

Production alert history must contain only the request ID or short hash, question class, status, latency, degraded reason, and aggregate rate. It must not contain a token, cookie, password, prompt, raw answer, email, or user ID.

## 6. Travel-day operating rule

Run the health gate immediately before leaving and after any deployment. Keep the JSON result and commit SHA. If a mobile critical alert arrives, check the Railway deployment and health status first; do not run migrations or destructive fixes while traveling. Replit should acknowledge the incident, roll back only if the failure correlates with the latest deployment, and send a recovery alert after three successful checks.
