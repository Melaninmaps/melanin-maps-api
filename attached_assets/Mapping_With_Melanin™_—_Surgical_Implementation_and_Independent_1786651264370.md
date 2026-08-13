# Mapping With Melanin™ — Surgical Implementation and Independent Verification Standard

**Standard ID:** `OPS-SURGICAL-CHANGE-001`  
**Status:** Mandatory permanent operating rule  
**Applies to:** Every Replit change to production code, configuration, schema, data, seed, route, prompt, worker, static asset, mobile build, or deployment process.

## Non-negotiable rule

> Replit must not make an open-ended repair, declare a feature complete from source review alone, or change adjacent files “while in there.” Every requested change must have a written **Surgical Implementation Package** before implementation and an **Independent Verification Package** after deployment.

A change is **not complete** when code compiles, a commit is pushed, an API returns one successful response, or an internal audit says green. It is complete only when the independent acceptance checks below pass on the live, non-stale production deployment.

## Surgical Implementation Package — required before Replit changes anything

| Required section | Mandatory content |
| --- | --- |
| Change identifier and intent | One clear user outcome and the exact problem it solves. |
| In-scope files | Exact repository paths allowed to change, with a one-sentence reason for each. |
| Explicit exclusions | Components that must not be touched, including login, map, Kinfolk, Library, claims, database, mobile, or other protected surfaces when outside the request. |
| Data and migration plan | Additive/idempotent migration SQL; forward and rollback behavior; record counts affected; foreign keys and indexes; no destructive statement without founder approval. |
| Exact implementation diff | Patch or copy-ready code for every server, client, worker, configuration, and deployment artifact change. |
| Security and privacy review | Authentication/authorization enforcement, rate limits, RLS where applicable, consent and data-exposure effect, secrets review. |
| Test matrix | Unit, integration, route/API, browser/UI, refresh/persistence, edge-case, and regression tests relevant to the change. |
| Production verification plan | Live URL/endpoint, required response/rendering, required deployment identity, monitoring queries, abort conditions, and expected proof artifacts. |
| Rollback plan | Exact reversible action and criteria for invoking it. |
| Founder impact statement | Whether the change affects live members, data, maps, claims, Library, mobile, pricing, or testing; downtime/notification requirement. |

## Scope-control protocol

Replit may edit only files listed in the approved Surgical Implementation Package. If a new dependency is discovered, work pauses and the package is amended before another file is touched. Rebuild artifacts, bundle identity files, and manifest files may be updated only when necessary to deliver the approved source change; they must be listed as deployment artifacts.

No change may silently bundle unrelated cleanup, refactoring, new product features, content seeding, prompt tuning, or schema changes.

## Independent Verification Package — required after deployment

| Evidence item | Requirement |
| --- | --- |
| Deployment identity | Live `/api/version` response with deployment SHA, matching bundle hashes, and `stale_bundle:false`. |
| Source-to-runtime trace | The deployed asset/bundle or live endpoint confirms the changed code path is actually served. |
| Independent behavior test | A separate audit uses the user-facing screen and/or authenticated production API—not Replit’s own assertion—to verify acceptance criteria. |
| Data proof | Before/after counts and exact query output for any migration, seed, cleanup, archive, moderation, or business/content record change. |
| Security proof | Authenticated, unauthorized, and role-boundary tests for any protected path. |
| Regression proof | Relevant connected features are tested: direct URLs, refresh, navigation handoffs, city aliases, map/list parity, and persistence when applicable. |
| Monitoring proof | Health, pool waiters, error logs, and any queue/provider metrics required by the change. |
| Outcome label | `verified_pass`, `verified_fail`, or `held`. Replit must never use “complete” for an unverified change. |

## Severity and release gate

Any production 500, persistent loading state, stale-bundle state, broken authenticated journey, public test/demo content, unauthorized data access, or failed migration is a **release gate**. Founder notification occurs first within five minutes. The change remains `held` until a surgical repair package is supplied and independently verified.

For performance changes and launches, the sequence is mandatory:

1. Verify deployment identity and one-user smoke test.
2. Verify the repaired user journey.
3. Run the staged 1 → 5 → 15 → 30 isolated production canary only when stages above pass.
4. Invite real testers only after a `verified_pass` canary report.

## Repository placement

Replit must commit this file under `docs/operations/`, link it from `docs/README.md`, preserve it in project-level engineering instructions, and reference it in every pull request/task completion summary.

## Founder-facing completion statement

Every Replit completion message must state:

> **Scope:** [exact files]. **Excluded:** [protected files/surfaces]. **Live identity:** [SHA and stale-bundle state]. **Independent result:** [pass/fail/held]. **Evidence:** [links/files]. **Rollback:** [exact action].

Anything less is a progress update, not a completion claim.
