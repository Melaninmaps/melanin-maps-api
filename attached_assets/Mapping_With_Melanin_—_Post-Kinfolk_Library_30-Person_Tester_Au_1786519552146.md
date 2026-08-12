# Mapping With Melanin — Post-Kinfolk/Library 30-Person Tester Audit Gate

## When to run this test

Run the 30-person tester audit **only after** all of the following are true:

1. Replit has deployed the Kinfolk concurrency/reliability repair and provided its SHA.
2. Replit has deployed the governed Library Growth Engine and provided its SHA, migration preflight, worker health proof, and privacy test evidence.
3. The Kinfolk-to-Library and Kinfolk-to-Map action contract is deployed and the client opens the intended destination.
4. The Library full-coverage manifest is available and any zero-source topic is either repaired or explicitly suppressed from member-facing claims.
5. Business feedback work is either independently passed or excluded from the load scenario; no fake public scores remain.
6. Production readiness, health, deployment identity, and stale-bundle checks pass.
7. The owner explicitly approves a time-bounded production canary window and Replit opens Railway/database monitoring.

Do not run this audit merely because Replit says code is complete. The prerequisite evidence must be available first.

## Objective

Confirm that thirty simultaneous website members across the launch-city roster plus Phuket can use Kinfolk, search the Library, open a published Library topic, navigate to a real map/business destination, and browse the site without service failure, unsafe Library learning, pool exhaustion, or silent fallbacks.

## Account isolation

Use the existing production load-test account pattern only:

```text
mwm-loadtest-01@loadtest.mwm.internal through mwm-loadtest-30@loadtest.mwm.internal
is_load_test = true
```

Test accounts must remain excluded from:

- public Library Growth Engine signals/candidates;
- business feedback, safety score, Vibe, Community Says, and review aggregates;
- community posts, notifications, demand signals, analytics intended for product decisions, business alerts, and recommendations;
- public map/business rank changes;
- any member-visible feed or Circle output.

## Scenario roster

| Cohort | Purpose | Required actions |
|---|---|---|
| 1–5 | Baseline | Login, browse Library, open one sourced Book, one Kinfolk chat query |
| 6–15 | Multi-city concurrency | Same actions plus map/business discovery and a Kinfolk Library handoff |
| 16–22 | Travel/city coverage | Domestic launch cities and Phuket; source-grounded travel prompts and map handoff where a real entity exists |
| 23–30 | Full capacity | Repeat concurrent journeys with mixed culture, professional, travel, and Library requests |

No tester simulation may submit a real safety response, Vibe, Community Says, review, post, business claim, source contribution, or raw sensitive topic.

## Kinfolk queries

Use only safe query fixtures. Do not use individual medical, legal, fertility, HIV, divorce, immigration, or domestic-violence facts in load traffic.

Examples:

```text
- Tell me about African diaspora history and open the Library sources.
- What are reputable sources about healthy aging?
- Show me Black-owned bookstores on the map in Philadelphia.
- Tell me about visiting Phuket and show a real matching destination if available.
- Open the Library topic for African Diaspora History.
- What are the official sources for consumer fraud prevention?
```

## Required per-phase evidence

At 1, 5, 15, and 30 users, record:

| System | Evidence |
|---|---|
| Website and API | HTTP success rate, p50/p95/p99 latency, client errors, explicit error payloads |
| Kinfolk | completion success rate, classification, no unintended 500/429, correct structured actions |
| Database | total/active/idle/waiting connections, pool max, long-running queries, error count |
| OpenAI/provider | request count, rate-limit/timeout/error count, retries/queue wait time |
| Library | graph response time, source rendering, no empty panel for the selected sourced topic |
| Growth engine | zero load-test growth signals/candidates; worker health stable |
| Map/business handoff | selected real business ID routes to correct page/pin; no fake placeholder record |
| Railway | CPU, memory, restart count, logs, readiness status |

## Original aborts remain in effect

Abort immediately if any condition occurs:

```text
- database waiting > 0 for two consecutive monitoring checks;
- total production pool connections reaches the agreed danger threshold;
- /api/readyz returns non-200 or pool_exhausted;
- Kinfolk returns HTTP 500 for any safe fixture;
- error rate exceeds 1% within a phase;
- provider rate limit/timeout is not safely handled;
- a load-test signal enters Library Growth Engine candidate data;
- a load-test action changes any public feedback/review/map/business aggregate;
- any deployment, bundle, auth, or safety regression appears.
```

Stop further traffic. Preserve logs and recovery evidence. Do not retry blindly.

## Pass criteria

The 30-person audit passes only if all conditions hold:

1. Every planned user journey completes without an unhandled error.
2. Readiness remains 200; no pool waits or exhaustion occur.
3. Kinfolk produces responses and safe structured navigation actions; no HTTP 500.
4. The Library opens a sourced topic and active evidence links render.
5. Map/business actions resolve to canonical real business IDs only.
6. Library Growth Engine stores zero load-test signals/candidates.
7. No test data reaches public members, feedback aggregates, demand signals, or businesses.
8. Production recovers to baseline metrics after the test.
9. Replit and Manus independently agree on the result.

## Real tester launch after a pass

A passing canary authorizes a monitored phased invitation—not an unmonitored blast.

1. Invite 5 real website testers.
2. Observe the same health, pool, Kinfolk, and error metrics for 15 minutes.
3. Invite the next 10 if stable.
4. Invite the remaining 15 only if the second cohort remains stable.
5. Pause immediately if a P0/P1 issue occurs. Founder is notified first within five minutes.

## Owner decision format

After the audit, Manus should return exactly one outcome:

- **GO — invite the first 5 testers now**;
- **CONDITIONAL GO — invite first 5 after the listed monitoring adjustment**; or
- **NO-GO — do not invite testers; fix the listed reproducible blocker.**
