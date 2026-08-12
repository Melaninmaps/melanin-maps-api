# P0 — KinfolkAI Concurrent 500 Hotfix and Final 30-User Retest

## Verified state

The database-capacity repair improved the full 30-user canary: no database waiters and no readiness `503 pool_exhausted` occurred. However, the launch is still **not approved** because the same 30-user phase produced **five `POST /api/kinfolk/chat` HTTP 500 responses**.

The five failures occurred after login and authenticated reads had completed successfully. The route currently maps unclassified OpenAI/provider or other thrown errors to a generic HTTP 500 response:

```ts
res.status(isTimeout ? 504 : 500).json({ error: /* generic message */ });
```

This ticket addresses only that concurrent KinfolkAI reliability path.

## Strict no-touch boundary

Modify only the KinfolkAI server request-execution/error-handling path and its focused tests/telemetry. Do **not** change UI, prompts/content policy, response style, model selection, auth rules, user-facing product features, map, Safety Hub, Library, business pages, mobile app, database schema, or test-account isolation logic.

## First action: obtain the exact failed error

Before guessing, extract the Railway log records for the five failed requests from the retest window, using the existing log signature:

```text
[kinfolk-chat-error]
KinfolkAI chat failed
```

For every record, capture the sanitized error type, provider HTTP status/code, `request_id` if available, route, duration, and deployment SHA. Do not expose API keys, cookies, prompts containing sensitive user data, or user email addresses.

The root-cause category must be recorded as one of:

| Category | Example |
|---|---|
| Provider capacity/rate limit | 429, provider 5xx, transient upstream error |
| Provider timeout | abort/timeout at the configured request cap |
| Application concurrency issue | internal shared-state/stream/usage issue under parallel calls |
| Database or dependency regression | query or write error after the capacity hotfix |
| Unexpected | any error not captured above |

## Required minimal reliability fix

### 1. Add a bounded KinfolkAI generation queue

Apply a small server-side concurrency limiter **only around the outbound `openai.chat.completions.create` call** in `POST /api/kinfolk/chat`.

It must:

1. Use a configurable, conservative concurrency cap suitable for the provider/runtime. Start with a measured value and document it; do not hardcode an unexplained magic number.
2. Queue excess generations in memory, preserving a short bounded wait rather than sending a 30-call simultaneous burst upstream.
3. Have a strict maximum queue size and a deterministic overload response (`503` plus `Retry-After`) if the queue is full. Never return a generic 500 for expected temporary overload.
4. Release the permit in `finally`, including provider errors, client disconnects, and request timeouts.
5. Record only safe telemetry: active generations, queued generations, queue wait time, provider status/code, and final route status.
6. Leave all health/readiness routes untouched and nonblocking.

### 2. Retry only documented transient provider failures

Inside the same bounded generation operation, retry a provider **429, 500, 502, 503, or 504** at most twice, with short exponential backoff and jitter, as long as the total route deadline remains below the existing user-facing timeout. Never retry 401, 403, malformed request, policy rejection, or schema errors.

If the exact Railway error proves a different application defect, fix that defect instead of applying blind retries. The final implementation must state why the selected remedy matches the actual error.

### 3. Improve the error response classification

- Preserve `504` for actual provider timeout.
- Use `503` and `Retry-After` for bounded-queue/provider-capacity overload.
- Reserve `500` for genuine unexpected server defects.
- Include a safe `code` field for observability; do not expose provider credentials, internal stack traces, or user data.

## Focused tests required

1. Thirty simultaneous generation requests cannot exceed the limiter cap.
2. A simulated provider 429/5xx succeeds when a permitted retry succeeds.
3. A persistent provider capacity error returns the documented 503/Retry-After response—not a generic 500.
4. Permits release after success, error, timeout, and client close.
5. Existing legal/cultural Kinfolk routing and Taste Profile tests remain green.

## Final production gate

After the narrow patch deploys, Manus will perform:

1. Build/health/authentication preflight.
2. The identical 1 → 5 → 15 → 30 user scenario with the same 30 isolated accounts.
3. Live pool, readiness, and Kinfolk result capture.

**Pass criteria:** all 30 journeys return successful login, preferences, sessions, travel, and Kinfolk chat responses; no HTTP 5xx; no readiness 503; no database waiters; no unbounded queue growth; and post-test health is green.

No real tester invitation should be sent until this final gate passes.
