---
name: Pre-Build Audit Standard
description: Mandatory process that must run before implementing any Build N. Covers 11 audit categories the agent must confirm or plan before "Please implement." takes effect. See also SUBMISSION_RELEASE_GATE.md for the separate gate required before EAS submission.
---

# Pre-Build Audit Standard

**Why:** The Build 97 session established that implementation failures are avoidable when the right audit questions are asked before writing code — not during QA after the fact. This is now a permanent process gate for every build.

**Companion gate:** Before any EAS submission (not just before implementation), a separate Submission Release Gate must be completed. See `docs/product/SUBMISSION_RELEASE_GATE.md`. The pre-build audit covers code correctness before implementation. The submission release gate covers production stability and Apple-specific requirements before submission. Both are required — neither substitutes for the other.

**How to apply:** When a new build (Build 97, 98, etc.) is authorized with "Please implement.", before touching any code, run or confirm all audit categories below. If any category has not been planned, stop and produce the plan first.

---

## Required Audit Categories Before Any Build Implementation

### 1 — Static Crash-Risk Audit
Before running the app or writing new code, scan for:
  Null / undefined property access, missing optional chaining
  Unhandled promise rejections, async errors without catch
  State updates after unmount, infinite render loops
  Missing React error boundaries
  Navigation to nonexistent routes, invalid deep-link targets
  Requests without timeouts or cancellation, duplicate request triggers
  JSON parsing without validation, missing-field assumptions
  Unbounded or non-virtualized lists
  Map marker overload
  Platform-specific code without guards
  Permission handling without denial states
  Retry loops without limits, session-renewal loops, auth redirect loops
  Upload flows without cleanup
  DB writes without idempotency

### 2 — HTTP Failure Coverage
Every critical workflow must handle all of:
  400, 401, 403, 404, 409, 413, 422, 429, 500, 502, 503
  Timeout, invalid JSON, empty response, incomplete response, slow response
Critical workflows: registration, login, session renewal, business search,
  map, community feed, KinfolkAI, image upload, notifications, saved items.

### 3 — 404 Inventory
Before shipping, verify:
  All API routes exist (no renamed route with old client)
  Record 404s show "This item is no longer available" — no stack traces
  Navigation 404s (deep links, notifications) land gracefully
  Asset 404s (images, avatars) show placeholder — no layout collapse
  Web 404 shows branded not-found page

### 4 — Auth Fault Injection
Simulate before every build:
  Wrong password, expired code, expired session, corrupt token
  Network loss during login, rapid repeated taps
  Logout while requests active
  Apple Sign-In cancellation, invalid nonce
  Returning member after reinstall
Verify: no redirect loops, no blank screens, no false success messages.

### 5 — Map and Location Fault Injection
  Location permission denied, GPS timeout, null/invalid coordinates
  Map provider failure, map tiles unavailable
  Thousands of markers, layer isolation (one layer fails, others continue)
  App backgrounded during map load

### 6 — KinfolkAI Failure Testing
  Provider timeout, rate limit, malformed response, empty answer
  Memory unavailable, personalization unavailable
  Screen closed mid-response, duplicate message submission
Verify: KinfolkAI never invents a result to cover a failure.
Verify: core app remains usable if KinfolkAI is fully unavailable.

### 7 — Write Safety Testing
Every create/update action:
  Double tap, network retry, timeout after server write, app close mid-submit
  Duplicate webhook, conflicting update, partial upload, DB rollback
Verify: no duplicate posts/reviews/events, no orphaned uploads,
  idempotency where required.

### 8 — Device Stress Testing
Minimum: small iPhone, standard iPhone, standard Android.
Simulate: 50 navigation cycles, rapid tapping, large lists, map open/close,
  offline/reconnect, background/resume.
Track: crashes, memory growth, CPU spikes, navigation failures.

### 9 — Synthetic User Journey Checklist
All of the following must pass before release candidate is declared:
  1. New member signup
  2. Email verification
  3. Login and session restore
  4. Personalization
  5. Business discovery
  6. Map category selection
  7. Heritage category selection
  8. Historical context layer (when applicable)
  9. Community post submission
  10. Event discovery
  11. Resource discovery
  12. KinfolkAI question
  13. Profile update
  14. Logout and login again

### 10 — Signal Strength Audit (Community Intelligence Constitution)
Before shipping any feature that surfaces insights, signals, or community data:
  Apply all 5 dimensions: Prevalence, Volume, Momentum, Relevance, Confidence
  Confirm denominator is correct (not national when question is local)
  Confirm minimum sample threshold is met for the sensitivity category
  Confirm unique people vs. repeated actions are distinguished
  Confirm seasonal baseline is considered
  Confirm KinfolkAI will not invent an insight where data is insufficient

### 11 — Purposeful Collection Gate
Before any new DB column, survey field, or tracking event is added:
  What member or community benefit does this create?
  What decision could responsibly change because of it?
  Can the same result be achieved with less personal information?
  When should the information expire or stop affecting results?
If team cannot answer all four, do not add the field.

---

## Staging Environment Requirement

Before fault injection (Sections 4–7 above) is run:
  Confirm a staging or Replit dev environment is available
  Confirm test accounts, test DB, and test object storage exist
  Production receives only non-destructive smoke tests after staging passes
  Never run destructive tests against production data

---

## Full Testing Plan Reference
docs/product/BUILD_97_PROACTIVE_FAILURE_TESTING_PLAN.md
