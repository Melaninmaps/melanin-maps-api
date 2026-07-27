---
name: Member Journey Testing Standard
description: Permanent release requirement — no feature may be called "working" or "launch-ready" based on API tests or code review alone. The user journey through the real interface is the final authority.
---

# Member Journey Testing Standard

## The Rule

No feature — especially authentication, safety, location sharing, emergency alerts, billing, or moderation — may be reported as "passed," "working," or "launch-ready" based solely on:
- curl requests
- isolated route tests (`POST /api/...` returning 200)
- code inspection / source review

**Why:** API checks prove the plumbing. They do not prove the member journey. The real journey includes: browser form → password manager/autofill → React code → network transport → API → database → session/token storage → authenticated-user refresh → routing → visible screen. Any layer can fail while the API call passes.

The login crash investigation proved this: curl said auth worked; the real browser journey had a crash on `/profile` that made users believe the whole thing was broken.

## The Evidence Ladder (all applicable levels must pass)

| Level | Label | Tool |
|---|---|---|
| 1 | Code reviewed | Source inspection |
| 2 | API test passed | curl / direct HTTP |
| 3 | Browser end-to-end test passed | Playwright (`runTest`) |
| 4 | Mobile end-to-end test passed | EAS build + manual or Detox |
| 5 | Human acceptance test passed | Founder / tester on exact build |
| 6 | Failure and recovery test passed | Network drop, missing data, bad input |

A launch-critical workflow is not complete until all applicable levels pass on the exact production or tester-distributed build.

## How to Apply

- When a feature is implemented, run `runTest()` (Playwright) against the running app — not just curl.
- When reporting status, use precise labels: "API test passed" is NOT "working." "Browser e2e passed" is closer.
- For safety features, also document:
  - What happens if delivery fails
  - How uncertainty is shown to the member
  - How stale information expires
  - How corrections reach affected members
  - What fallback is available
  - What the platform explicitly does not guarantee

## Safety-Specific Language Constraint

Until real-interface tests pass for safety workflows, do not use language implying guarantees:
- ❌ "Stay safe wherever you go."
- ❌ "Receive reliable real-time alerts."
- ❌ "Know whether a neighborhood is safe."

Responsible framing: the platform provides **community safety information and decision-support signals**, with appropriate limitations.

**Why:** Safety features must be verified at the member-journey level, not the API level. A member who receives stale, missing, or misleading safety information is worse off than one who receives nothing.
