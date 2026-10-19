# BIZ-009 Owner Dashboard — Deployment and Rollback Authorization Packet

**Prepared:** 2026-10-19
**Status:** Preparation only — **not** authorization to publish, deploy, migrate, access staging/production databases, create a fixture, sign in, or edit a business record.
**Controlling requirement:** `BIZ-009` in `MWM_KINFOLK_MASTER_COMPLETION_CHECKLIST.{md,json}`.
**Related minimum editor acceptance:** `BIZ-006`; staging authentication checkpoint: `BIZ-008`.

## 1. Exact locally integrated source candidate

Both bounded BIZ-009 source receipts are locally integrated into this one minimal local candidate:

| Item | Exact value |
|---|---|
| Candidate SHA | `897910cba14d720276b20bc1011232e68b0d16df` |
| Local ref | `refs/heads/staging/kinfolk-full-candidate-20261014` |
| Candidate subject | `fix(owner): prevent stale profile writes` |
| Parent source chain | Includes `9bc54b36e7ad0d3a11b7a53e3e44a8d50d25bb7e` (`fix(owner): wire dashboard profile save receipt`) |
| Ordinary-editor coordination receipt | `5f0666372aa332a021bcaca15ad999ec9ac20d9b` |
| Stale-write allocation receipt | `0f113013786530eb05541e60c40cab109a831c1c` |
| Candidate source paths | Exactly seven: `artifacts/api-server/src/routes/businesses.ts`; `artifacts/api-server/src/routes/__tests__/business-owner-multi-business-contract.test.ts`; `artifacts/api-server/src/businesses/__tests__/adminBusinessProfilePolicy.test.ts`; `artifacts/web/src/pages/business-dashboard.tsx`; `artifacts/web/src/__tests__/business-dashboard-managed-access.test.ts`; `artifacts/web/src/components/AdminEditBusiness.tsx`; `artifacts/web/src/__tests__/admin-business-edit-preservation.test.ts` |
| Final focused validation | API: 2 files / 17 tests passed; API `tsc -p tsconfig.json --noEmit` passed. Web: 2 files / 11 tests passed; Web `tsc -p tsconfig.json --noEmit` passed. Exact seven-path scope and `git diff --check` passed. |

The candidate is **local only**. It has not been published to a remote or deployed to any environment.

### Included source behavior

The candidate provides the existing owner Dashboard with selected-business GET → narrow PATCH (`description`, `phone`, `website`, `hours`) → fresh selected-record re-read before `Saved`; explicit `Saving`, `Saved`, and bilingual draft-preserving `Failed` behavior; and no claim-page detour.

It also protects the same canonical profile record from stale full-form writes by Owner or Admin. Both generic profile writers require `expectedUpdatedAt`; stale saves return HTTP 409 with `BUSINESS_PROFILE_STALE_WRITE` before profile/receipt/audit writes. Both current Web editors carry the loaded canonical revision, preserve the entered draft on 409, and require a fresh read before showing success.

### Explicit exclusions

This candidate does **not** add or change address/city/state editing, map coordinates, publication, public Directory eligibility, Map eligibility, governed Kinfolk eligibility/freshness, Kinfolk Current, specialties, media, ownership, verification, suspension, archive/delete queues, payment, provider behavior, mobile clients, or field-level last-approved/Pending Approval moderation.

It must not be presented as completion of broader Business Owner editing.

## 2. Source-side database compatibility review — no database access

This review is limited to current local source declarations. It is **not** proof that any deployed production database has the required schema or behavior.

| Source contract | Review result |
|---|---|
| Existing canonical revision column | `lib/db/src/schema/businesses.ts` already declares `businesses.updated_at` as `timestamp(..., { withTimezone: true })`, mapped as `updatedAt`, with default/update behavior. No new column is introduced. |
| Owner writer | Uses the existing `businesses.updated_at` field as the revision only. It conditionally compares `date_trunc('milliseconds', updated_at)` with the loaded canonical timestamp and advances the revision with `GREATEST(clock_timestamp(), updated_at + INTERVAL '1 millisecond')`. |
| Admin writer | Uses the same existing `updated_at` field while retaining its existing lock, validation, receipt, and audit sequence; it advances the revision with the same monotonic PostgreSQL expression. |
| PostgreSQL features introduced in this path | Only standard PostgreSQL `clock_timestamp`, `GREATEST`, `date_trunc`, and `INTERVAL` expressions inside the existing canonical profile `UPDATE` operations. |
| Migration/schema/startup delta | Candidate range contains **no** migration path, `startup-migrations.ts`, API entrypoint, Dockerfile, or Railway configuration change. The candidate adds no new pre-traffic writer. |
| Actual production DB contract | **UNVERIFIED AND NOT ACCESSED.** Current database version, table shape, column precision, grant behavior, and deployment startup inventory cannot be inferred from local source and must not be claimed. |

The source side is compatible only if the named target already has the existing `businesses.updated_at` column and supports normal PostgreSQL timestamp functions. A deployment remains blocked until this condition and every pre-existing startup writer are explicitly reviewed under separate authorization.

## 3. Production target and rollback status

| Release fact | Current evidence | Status |
|---|---|---|
| Public production-domain acceptance URL | `https://www.mappingwithmelanin.com` was observed read-only in prior founder-controlled browser evidence. | Identified only as the public acceptance URL. |
| Deployment environment/service binding | No current production service, project, environment ID, deployment mechanism, or deployed SHA was read in this source-only action. | **UNVERIFIED — do not infer target.** |
| Exact deployable remote ref | Candidate ref is local-only `refs/heads/staging/kinfolk-full-candidate-20261014`; no remote object/ref was checked or published. | **UNAVAILABLE UNTIL SEPARATELY AUTHORIZED.** |
| Current successful production release | Not inspected. | **UNVERIFIED.** |
| Rollback SHA and procedure | Not inspected or inferred from old evidence. | **UNVERIFIED — no deployment approval may omit this.** |

## 4. Required authorization sequence

### Step A — read-only release-binding inspection, required before any deployment request

Authorize one narrowly scoped **read-only release-binding inspection** of the intended production release mechanism. It must not read secret values, query a database, open a database console, create a proxy, modify variables, build, deploy, invoke a provider, or access an authenticated browser session.

The inspection must return only:

1. exact environment/service/deployment target and expected application URL;
2. the current successful production deployment SHA/ref and timestamp;
3. one known-good, retrievable rollback SHA/ref and exact rollback procedure;
4. build, start, predeploy, and pre-traffic command names plus a sanitized inventory of existing startup/database writers;
5. whether the exact remote candidate that byte-matches local `897910cba14d720276b20bc1011232e68b0d16df` can be selected without unapproved schema/data/fixture/account writes.

If any result requires a broader or secret/database operation, stop and request that separately. Do not substitute stale staging evidence or the public URL for a production deployment binding.

### Step B — separate, no-placeholder deployment authorization

Only after Step A has an independently observable result may the founder approve a deployment. The approval must name all of the following without placeholders:

- exact **remote** candidate SHA/ref, proven to contain the seven-path `897910cb…` content;
- exact environment/service target and public URL;
- exact known-good rollback SHA/ref, step-by-step rollback procedure, and operator;
- an explicit inventory of every build/start/predeploy/pre-traffic writer; the deployment is forbidden unless each writer is either absent or expressly approved;
- explicit confirmation that no migration, DDL, database data, fixture/account, provider, feature-flag, or unrelated release behavior is included;
- technical-health checks only until browser acceptance is separately approved;
- stop conditions: wrong candidate, wrong target, unavailable rollback, unexpected writer, health failure, unexpected authentication state, or any need for secret/database/account access.

No source-only receipt authorizes remote publication or deployment.

### Step C — separately approved founder-controlled reversible description acceptance

A production edit is not included in Step B. After a successful Step B deployment, a second explicit acceptance approval must name:

1. the exact authenticated account, intended business/context, and founder-controlled Take Control session;
2. one exact eligible description field, original value, temporary test value, and immediate restore value/procedure;
3. Dashboard selected-business GET load; PATCH; fresh Dashboard re-read before Saved; refresh/relogin readback; canonical public-profile readback; and only separately authorized Directory/Map/Kinfolk reads;
4. stop conditions for a stale-write 409, failed/pending/moderated state, wrong business/context, unauthenticated state, stale propagation, or any unrelated field/state change;
5. a timing record and auditable restoration receipt.

No exact original/temporary/restore description values are present in the authorized local coordination or acceptance records. They must be supplied in the Step C approval; this packet does not invent or authorize them. No provider-backed Kinfolk prompt or real business correction is implicit.

## 5. Approval payload template — intentionally not yet actionable

> Authorize one read-only release-binding inspection for the intended production service. It may return only target/service identity, current production source/deployment metadata, a known-good rollback source/procedure, command names, and a sanitized startup-writer inventory. It must not access database values, perform DDL/data/account/fixture actions, invoke providers, build, deploy, publish Git, or use a browser.

After that inspection, any deployment request must be regenerated with the exact remote candidate, target, rollback, and approved writer inventory. This packet cannot be converted into a deployment command before then.

## 6. Current status

- `BUSINESS-OWNER-002-ORDINARY-PROFILE-SAVE-RECEIPT`: `SOURCE_INTEGRATED_LOCAL_ONLY` at `9bc54b36…`.
- `BUSINESS-OWNER-003-STALE-PROFILE-WRITE-PROTECTION`: `SOURCE_INTEGRATED_LOCAL_ONLY` at `897910cba14d720276b20bc1011232e68b0d16df`.
- `BIZ-009`: source receipts complete locally; production acceptance, production database compatibility, release binding, rollback, last-approved/Pending Approval design, and public propagation proof remain pending or blocked.
- `BIZ-008`: staging authentication checkpoint remains failed and distinct.
- No staging, production, member-visible, Directory/Map/Kinfolk, or founder-accepted status is asserted.
