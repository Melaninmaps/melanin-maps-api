# Mapping With Melanin™ — KinfolkAI Uptime & Silent Failure Prevention
**Prepared by:** Manus AI
**Date:** August 11, 2026
**For:** Replit Engineering Team
**Priority:** CRITICAL — Must be implemented before Apple Review and campaign launch.

---

## The Problem

KinfolkAI is currently returning "Kinfolk is having trouble answering that right now" on 100% of queries. The root cause is a `401 Unauthorized` response from the AI backend — meaning the API key or authentication token has expired, been rotated, or is missing from the deployment environment.

This is the second time KinfolkAI has gone silently offline. The first time was discovered during an audit. Both times, the platform continued to look functional — the UI loaded, the chat box accepted input — but the AI was dead. Users and the founder had no way to know.

This must never happen again, especially during Apple Review, where a reviewer encountering a broken AI feature will reject the app.

---

## Part 1: Fix the Current Outage (Do This First)

1. Log into the Railway (or Replit) deployment dashboard.
2. Navigate to Environment Variables.
3. Locate the `OPENAI_API_KEY` (or equivalent LLM provider key).
4. Verify it is present, correctly formatted (starts with `sk-`), and has not been rotated or deleted.
5. Check the OpenAI billing dashboard to confirm the account has available credits and has not hit a usage limit.
6. If the key is missing or expired: generate a new key, add it to the environment variables, and redeploy.
7. After redeployment, send a test query through the KinfolkAI chat interface and confirm a response is received before closing this ticket.

---

## Part 2: Prevent Silent Failures — The Health Check System

The core problem is that KinfolkAI fails silently. The UI looks fine. The platform looks fine. But the AI is dead. You must build a health check system that catches this immediately.

### Step 1 — Internal Health Check Endpoint

Create a backend endpoint at `/api/health/kinfolk` that:
- Sends a minimal test query to the LLM provider (e.g., "ping" or "respond with OK")
- Returns `{ status: "ok", latency_ms: 123 }` if the AI responds
- Returns `{ status: "error", reason: "401 Unauthorized" }` if it fails

This endpoint must be unauthenticated (no login required) so monitoring services can call it.

```javascript
// Example Express route
app.get('/api/health/kinfolk', async (req, res) => {
  const start = Date.now();
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 5
    });
    res.json({ status: 'ok', latency_ms: Date.now() - start });
  } catch (err) {
    res.status(503).json({ status: 'error', reason: err.message });
  }
});
```

### Step 2 — External Uptime Monitor

Set up a free external uptime monitor to ping `/api/health/kinfolk` every 5 minutes and alert immediately if it fails. Recommended free services:

- **UptimeRobot** (uptimerobot.com) — free, monitors every 5 minutes, sends email/SMS/Slack alerts
- **Better Uptime** (betteruptime.com) — free tier, phone call alerts on critical failures
- **Freshping** (freshping.io) — free, 1-minute check intervals

Configure the alert to go to the founder's email AND the Replit team's Slack/email the moment the health check fails.

### Step 3 — In-App Status Banner

When the health check fails, the app must display a visible status banner to users instead of silently failing:

```
⚠️  KinfolkAI is temporarily unavailable. Our team has been notified and is working on a fix. Business search and all other features are working normally.
```

This banner must:
- Appear automatically when the health check endpoint returns an error
- Disappear automatically when the health check recovers
- Never show a generic "try again" message without explaining that the team has been notified

---

## Part 3: Prevent API Key Expiration

The most common cause of a `401` error is an expired or rotated API key. Prevent this with the following:

### Key Rotation Alerts
- Set a calendar reminder (or automated alert) to review the OpenAI API key 30 days before any expected expiration.
- If using a key with no expiration, set a quarterly reminder to verify the key is still active and the billing account is in good standing.

### Billing Threshold Alerts
- In the OpenAI dashboard, set a billing alert at 75% of the monthly budget limit. This gives time to add credits before the key stops working.
- Set a hard limit that is higher than expected usage to prevent unexpected cutoffs.

### Environment Variable Audit
- Before every deployment, run a pre-deploy check that verifies all required environment variables are present. If `OPENAI_API_KEY` is missing or empty, the deploy must fail with a clear error message — not silently deploy a broken build.

```bash
# Add to pre-deploy script
if [ -z "$OPENAI_API_KEY" ]; then
  echo "ERROR: OPENAI_API_KEY is not set. Deployment aborted."
  exit 1
fi
```

---

## Part 4: Apple Review Specific Protections

During Apple Review, a reviewer will test KinfolkAI. If it fails, the app will be rejected. The following protections are required:

1. **Dedicated review account:** Create a separate Apple Review test account with a pre-seeded Taste Profile and conversation history. This ensures the reviewer sees a fully functional, personalized experience rather than a blank first-time state.
2. **Review period freeze:** During the Apple Review window, freeze all deployments. No code changes, no environment variable changes, no dependency updates until the review is complete. If a critical fix is required, deploy to a staging environment first and verify KinfolkAI works before promoting to production.
3. **Pre-review smoke test:** Before submitting to Apple Review, run the following test sequence and confirm all pass:
   - KinfolkAI responds to "Where should I eat in Philadelphia?" ✅
   - KinfolkAI responds to "Best beaches in Phuket" ✅
   - KinfolkAI responds to "What is 15% of $47?" ✅
   - Business search for "church" returns results ✅
   - Safety Hub loads and police report form opens ✅
   - Login, logout, and return login all work ✅

---

## Summary

The platform is strong. The business search is excellent. The UI is beautiful. But KinfolkAI is the heart of the product, and it has gone offline twice without anyone knowing. The fix is simple: a health check endpoint, an external uptime monitor, an in-app status banner, and a pre-deploy environment variable check. These four things together mean KinfolkAI will never go silently offline again.
