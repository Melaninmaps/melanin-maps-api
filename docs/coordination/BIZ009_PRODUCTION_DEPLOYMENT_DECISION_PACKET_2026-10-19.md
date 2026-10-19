# BIZ-009 Production Deployment Decision Packet

**Prepared:** 2026-10-19
**Decision:** **NOT APPROVED FOR REMOTE PUBLICATION OR DEPLOYMENT.**
**Scope:** Results of the founder-authorized read-only production release-binding inspection (Authorization A) and the separately authorized one-query schema inspection (Authorization B).
**Does not authorize:** Git publication, configuration change, deployment, restart, rollback, database proxy creation/use, database mutation/DDL, account or fixture action, provider call, or production business edit.

**Subsequent coordinated disposition:** [BIZ-009 Web/API deployment approval packet](BIZ009_WEB_API_DEPLOYMENT_APPROVAL_PACKET_2026-10-19.md) adds the Web-serving surface and rejects direct publication of the 40-commit local ancestry pending a source-only isolated candidate.

This packet supersedes the earlier preparation-only binding status in [BIZ009_OWNER_DASHBOARD_DEPLOYMENT_AUTHORIZATION_PACKET.md](BIZ009_OWNER_DASHBOARD_DEPLOYMENT_AUTHORIZATION_PACKET.md) and [BIZ009_NO_DEPLOYMENT_RELEASE_BINDING_ADDENDUM.md](BIZ009_NO_DEPLOYMENT_RELEASE_BINDING_ADDENDUM.md). It does not change the controlling `BIZ-009` status: **BLOCKED — production acceptance pending**.

## 1. Inspection disposition

| Authorization | Result | Evidence boundary |
|---|---|---|
| A — production release binding | **Completed read-only.** Production target, current known-successful API deployment, source SHA/branch, service configuration, command inventory, no-staged-change state, and rollback mechanism were read from Railway. Targeted deployed-source retrieval was read-only. | No secret values, Git publication, variable/config mutation, build, deployment, database row access, or browser action occurred. |
| B — one session-read-only `information_schema.columns` query | **PASS — founder-provided authorized private-Console receipt.** One session-read-only query completed in the private Console of canonical production Postgres (`7bb11d12-0e5d-404b-ae77-17450f56d3a4`), visually linked to `api-server`. | Sanitized result only: one `public.businesses.updated_at` row, `timestamp with time zone` / `timestamptz`, precision `6`, `is_nullable = NO`, `has_default = true`; `BEGIN`/`COMMIT` completed. No public proxy, variable, connection string, business/account row, or other command was accessed. |

`public.businesses.updated_at` compatibility is **PASS**: the existing column is present, timezone-aware, non-null, defaulted, and has microsecond precision (therefore at least the required millisecond precision).

## 2. Exact production release binding

| Release item | Verified read-only fact |
|---|---|
| Deployment controller | Railway GitHub-source deployment using NIXPACKS. |
| Project | `melanin-maps-api` — `b98310f8-7bfa-4e43-a574-8819752e9cfe` |
| Environment | `production` — `2292b38f-3d0d-4cad-92a4-ad36cabda629` |
| API service | `api-server` — `a77b49bb-e448-4be8-9d02-de7a3b43136b` |
| Public API/domain binding | `https://api.melaninmaps.com`; `https://www.mappingwithmelanin.com`; Railway service domain exists. |
| Service source configuration | `Melaninmaps/melanin-maps-api`, branch `candidate/kinfolk-current-website-social-verification-20261015`; source is branch-following, not commit-pinned. |
| Build command | `pnpm --filter @workspace/api-server run build` |
| Start command | `pnpm --filter @workspace/api-server run start` |
| Predeploy command | None reported in the live Railway service configuration. |
| Current Railway state | No staged production changes. Railway reports the API service **Online** with two recent failures. |
| Latest attempted API deployment | `c80f9175-f409-44a6-b20e-d5d0ad009924` — **FAILED**, 2026-10-19T02:43:42.592Z, source `3720f1d`. It is not a release candidate or rollback baseline. |
| Most recent successful API deployment | `0add2499-0c78-4b41-abf2-f3ad70cc84e1` — **SUCCESS**, 2026-10-18T02:01:12.278Z, source branch `candidate/kinfolk-current-website-social-verification-20261015`, full source SHA `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`. |

The online service plus failed latest attempts establishes `0add2499…` / `8fd6989…` as the **current known-successful production baseline**. This does not mean it contains BIZ-009; it predates the local BIZ-009 candidate.

## 3. Rollback baseline and procedure

**Known-good rollback deployment:** `0add2499-0c78-4b41-abf2-f3ad70cc84e1` for the API service in the named production environment.

Railway reports that this deployment can be redeployed/rolled back. The approved-path rollback operation, **not executed here**, is one Railway `redeploy` action with all of:

```text
projectId:     b98310f8-7bfa-4e43-a574-8819752e9cfe
environmentId: 2292b38f-3d0d-4cad-92a4-ad36cabda629
serviceId:     a77b49bb-e448-4be8-9d02-de7a3b43136b
deploymentId:  0add2499-0c78-4b41-abf2-f3ad70cc84e1
```

A future deployment approval must name the rollback operator and authorize this action explicitly. After a rollback, only the separately approved technical health check may verify that the API service is settled and Online; no browser/business-record test is implicit.

## 4. BIZ-009 candidate and remote-publication requirement

| Item | Status |
|---|---|
| Locally integrated BIZ-009 candidate | `897910cba14d720276b20bc1011232e68b0d16df`, containing the earlier ordinary-editor commit `9bc54b36e7ad0d3a11b7a53e3e44a8d50d25bb7e`. |
| Candidate deployment availability | **Not deployable.** It exists only in local Git on `refs/heads/staging/kinfolk-full-candidate-20261014`; no remote-tracking ref or Railway-selectable commit was established. |
| Current production source | `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`; it does not establish inclusion of local BIZ-009 work. |
| Required remote-publication decision | A future explicit authorization must name the exact remote ref/tag, target repository, full candidate SHA, approved publication operator, expected remote SHA verification, and prohibition on unrelated merge/rebase/source changes. No ref is invented by this packet. |
| Required deployment-source decision | After authorized publication, a separate approval must state how Railway will select the verified remote candidate (including any source/branch/commit pin change). That configuration change and any resulting deployment are out of scope now. |

## 5. Database compatibility: authorized PASS receipt

The canonical production database is Railway service `Postgres` (`7bb11d12-0e5d-404b-ae77-17450f56d3a4`) with private service endpoint name `postgres`.

The founder completed the exact approved session-read-only catalog query through the logged-in private Railway Console. The Console was visually linked to `api-server`. The only sanitized result was one row:

| Schema object | Result | Compatibility |
|---|---|---|
| `public.businesses.updated_at` | `data_type = timestamp with time zone`; `udt_name = timestamptz`; `datetime_precision = 6`; `is_nullable = NO`; `has_default = true` | **PASS** — present, timezone-aware, and more precise than the required milliseconds. |

`BEGIN TRANSACTION READ ONLY` and `COMMIT` completed. No public proxy was created or used; no variable, DSN, business/account row, or other command was accessed. This clears only the existing-column compatibility sub-blocker. It does not approve a migration, deployment, database write, account action, or startup writer.

## 6. Actual deployed startup-writer disposition

The deployed source at `8fd6989bea317f53dfa6f170c2c5054cf0de74a4` was retrieved read-only for only its API entrypoint, explicit-release helper, migration runner, founder-map worker, and business-deletion hold worker.

### 6.1 What the deployed source proves

1. `MWM_EXPLICIT_FEATURE_RELEASE_MODE` is enabled only when its value is exactly `"true"`. Railway metadata lists the variable name but not the value; no variable values were requested because the service has secrets in its variable set.
2. Before the feature-mode branch, the deployed API awaits multiple `ensure*` helpers. They include `ensureKinfolkPreferredNameSchema`, directory reconciliation ledger, founder-map restoration schema, legacy map-location attestation, international Directory-only visibility receipt, website-cleanup audit, Admin business-profile receipt/Kinfolk Catalog, business-deletion hold, and Kinfolk Current online-presence-review schema helpers. These are pre-traffic schema operations, so an explicit-release setting does **not** prove a zero-DDL/no-schema deployment.
3. Additional pre-traffic helpers are conditional on relevant feature values, including the Kinfolk image and private-places schema helpers. Their active values were not read.
4. If explicit release mode is **off**, the deployed entrypoint additionally runs directory-review bootstrap when its pool is configured, required Safety Report schema, Required Publication schema, and Community Feed read schema before traffic.
5. The founder-map restoration worker is invoked before the explicit-release early return. Its deployed source runs only when `MAP_RESTORATION_WORKER_ENABLED === "1"`; if enabled it starts immediately and can upsert restoration outcomes every three seconds. Railway metadata lists this variable name but not its value.
6. The deployed business-deletion-hold worker is invoked before the explicit-release early return, but its deployed implementation only logs that automatic deletion is disabled and returns a no-op stop function.
7. If explicit release mode is **off**, the deployed API can continue into directory publication/workers, Stripe initialization/backfill, Lehigh Valley publication, `runStartupMigrations`, Library starter seeds, schedulers, cron, and library growth work.
8. Deployed `runStartupMigrations` has **535** named migration entries; **13** account/credential mutation migrations are specifically skipped, but the remainder execute SQL individually. The runner then calls three account/access recovery routines before its seed-guard return. If `ENABLE_STARTUP_SEED_GUARDS === "true"`, it can run further seed/enrichment work.

### 6.2 Decision impact

The actual values of `MWM_EXPLICIT_FEATURE_RELEASE_MODE`, `MAP_RESTORATION_WORKER_ENABLED`, image/private-place flags, and seed guard were not safely observable through the authorized metadata interface. The filtered deploy-log queries returned no attested startup markers.

Therefore, **the actual deployed writer set is not fully verified**. Even if explicit release mode were confirmed true, its pre-traffic schema helpers and conditionally enabled map-restoration worker remain deployment risks. No BIZ-009 deployment may be approved under a “no migration/no writer” assertion.

## 7. Final deployment decision and required next approvals

### Decision today

Do **not** publish or deploy BIZ-009. The source repair remains `SOURCE_INTEGRATED_LOCAL_ONLY`; BIZ-009 remains **BLOCKED**.

### Required before any deployment request

1. **Remote-publication authorization:** name the exact remote ref/tag and full local candidate SHA `897910cba14d720276b20bc1011232e68b0d16df`; authorize no other Git action; return an immutable remote SHA receipt.
2. **Schema compatibility:** **satisfied** by the authorized §5 private-Console receipt; no further database query is authorized or needed for this column.
3. **Startup-writer disposition approval:** either obtain separately authorized non-secret evidence of the actual relevant release-mode/worker values and an attested startup path, or approve a named, complete pre-traffic/post-listener writer inventory. The current record does not support a zero-writer claim.
4. **No-placeholder deployment approval:** after the remaining publication/isolation and writer conditions, name the exact remote candidate, source-selection/configuration operation, production project/environment/service, build/start/no-predeploy facts, explicitly approved writer set, rollback deployment/procedure/operator, technical health checks, and stop conditions.
5. **Separate founder-controlled acceptance approval:** only after successful approved deployment, authorize one exact reversible profile-description save/restore and its limited readbacks. No real business edit or provider-backed Kinfolk test is authorized by this packet.

## 8. External actions completed and expressly not completed

**Completed read-only:** Railway production project/environment/service/deployment/configuration metadata; targeted GitHub read of the existing deployed API startup source; founder-controlled private-Console session-read-only compatibility query for `public.businesses.updated_at`.

**Not completed:** remote publication, deployment, rollback, restart, source/variable configuration change, secret-value access, any additional database session/query, proxy creation or use, DDL/data mutation, account/fixture action, browser business edit, provider call, or release assertion.
