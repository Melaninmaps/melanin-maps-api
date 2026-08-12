# Same-Day P0: Kinfolk 30-User Reliability Repair

**Priority:** Immediate launch gate.  
**Scope:** Only the eight concurrent Kinfolk HTTP 500 failures found in the final 30-account production audit.  
**Do not touch:** login/auth behavior, Library data/seeding, map rendering, business pages, Safety Hub, mobile UI, prompts/personality, design, or unrelated APIs.

## Verified production evidence

The identical isolated load-test journey passed at 1, 5, and 15 concurrent accounts. At 30 concurrent accounts, the audit stopped automatically when the application pool reached 28 connections. Eight `POST /api/kinfolk/chat` calls returned HTTP 500. After traffic stopped, `/api/readyz` recovered to `total: 1`, `idle: 1`, `waiting: 0`, and `/api/kinfolk/health` returned `{"ok":true}`.

This is a narrow Kinfolk concurrency failure. Do not guess at the fix and do not make a broad rebuild.

## Step 1 — return sanitized evidence first

For each of the eight requests, retrieve the Railway production log entry matching the audit window and return a redacted table containing:

| Field | Required |
|---|---|
| UTC timestamp | Yes |
| request/correlation ID | Yes, anonymized if necessary |
| route and response status | Yes |
| error class and message | Yes, no secrets |
| error stack location | File and line only |
| upstream/provider HTTP status and code, if any | Yes |
| retry count / timeout status | Yes |
| active AI request count / queue depth at failure, if available | Yes |
| database-pool totals and waits at the closest sample | Yes |

Do not include API keys, tokens, cookies, email addresses, raw prompts, or user content.

## Step 2 — implement only the cause proven by the evidence

Apply the smallest correction that matches the logs. These are allowed only when the log evidence supports them:

1. A process-wide bounded Kinfolk generation queue/semaphore that limits concurrent upstream generation calls and exposes queue saturation as a controlled temporary failure rather than an unhandled 500.
2. A bounded retry for documented transient upstream failures (network reset, 429, or 5xx), with exponential delay, request timeout, and a maximum of one retry. Never retry non-transient 4xx errors.
3. Proper `finally` cleanup for every acquired lease, session, pool client, queue permit, and timeout.
4. A temporary classified response for genuine provider overload, with telemetry. Do not silently present a failed request as a successful Kinfolk reply.
5. Reduction of duplicate per-chat database work only where the evidence identifies the duplicate path.

Do not enlarge the database pool again until the logs prove the application has exhausted actual available capacity rather than leaking or amplifying work.

## Required implementation behavior

- Existing successful Kinfolk responses and `libraryAction` behavior remain unchanged.
- Legal, culture, Library, and standard travel routing remain unchanged.
- `is_load_test = true` sessions remain excluded from Library Growth, public feedback, notifications, analytics aggregates, and demand signals.
- The queue/retry path must emit structured redacted telemetry sufficient to investigate any future 5xx response.
- A queued request may wait within a bounded timeout; it must never hang indefinitely.

## Mandatory local/staging tests

Before deployment, run these tests and attach results:

1. 30 concurrent authenticated Kinfolk requests complete without unhandled HTTP 500 under a mock/provider-controlled test.
2. A forced transient provider error retries exactly once and then returns either success or a classified non-500 temporary error.
3. A forced permanent provider 4xx does not retry.
4. Queue permit is released when generation, parsing, persistence, or request cancellation throws.
5. Exact Library prompt returns correct `open_library_node` action for African Diaspora History.
6. No test signal or public side effect is created from an `is_load_test` account.

## Deployment and independent acceptance gate

1. Commit only files required for this P0 repair and synchronise all production-serving artifacts.
2. Push through the normal two-commit deployment process.
3. Return deployment SHA, `built_from_sha`, matching bundle hashes, sanitized eight-error evidence, test output, and a short diff list.
4. Manus will independently run the same 1 → 5 → 15 → 30 isolated-account audit.

**Pass:** zero Kinfolk HTTP 500s, no pool waits, pool remains below the established abort threshold, every required Library action is correct, and the service recovers normally.

**Fail:** any HTTP 500, pool abort, incorrect required Library action, or failed member journey. Do not invite 30 real testers together until the independent gate passes.

## Founder notification

If an active production failure or repeat audit abort occurs, notify the founder first within five minutes with the route, impact, rollback/mitigation status, and next update time.
