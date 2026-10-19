# BIZ-009 Owner Dashboard — No-Deployment Release-Binding Addendum

**Prepared:** 2026-10-19
**Status:** Preparation only. This document authorizes **nothing**: no remote publication, database connection/query, deployment, build, configuration change, browser action, fixture/account action, provider call, or production write.
**Controlling requirement:** `BIZ-009` in `MWM_KINFOLK_MASTER_COMPLETION_CHECKLIST.{md,json}`.
**Related source receipts:** `BUSINESS-OWNER-002` (`9bc54b36e7ad0d3a11b7a53e3e44a8d50d25bb7e`) and `BUSINESS-OWNER-003` (`897910cba14d720276b20bc1011232e68b0d16df`).

This addendum supplements, and does not replace, [the BIZ-009 deployment and rollback authorization packet](BIZ009_OWNER_DASHBOARD_DEPLOYMENT_AUTHORIZATION_PACKET.md).

## 1. Exact local candidate and remote-reference result

| Fact | Locally verifiable result |
|---|---|
| BIZ-009 source candidate | `897910cba14d720276b20bc1011232e68b0d16df` (`fix(owner): prevent stale profile writes`) |
| Local source chain | Includes the ordinary-editor source receipt `9bc54b36e7ad0d3a11b7a53e3e44a8d50d25bb7e`; the current local coordination head is `b2708a0b1313740a3ad855ee413a4456226e0b70`. |
| Local branch containing candidate | `refs/heads/staging/kinfolk-full-candidate-20261014` only. |
| Local remote-tracking ref containing candidate | **None.** This was determined from local Git metadata only; no remote contact occurred. |
| Deployable immutable remote source ref | **Cannot be formed under the current authorization.** A remote branch/tag/object that byte-matches this candidate requires a separately authorized remote publication and subsequent release-binding inspection. A local branch name is not a deployable immutable remote ref. |

No remote publication or remote verification was attempted.

## 2. Production target, current release, and rollback

| Required release fact | Evidence-bounded status |
|---|---|
| Public acceptance origin | Historical read-only browser evidence identifies `https://www.mappingwithmelanin.com` as the public web origin. It is not a deployment-service binding. |
| Production project/service/environment/deployment controller | **Unknown.** No current production binding was read in this action. |
| Current production release SHA | **Unknown.** Historical preflight notes only reported that a separate production service was then online on last-success `8fd6989`, while `cd27764` and `3720f1d` were failed attempts. That observation is stale, lacks a verified service/ref/timestamp in the permitted local record, and must not be called the current release or a rollback target. |
| Rollback deployment/ref and operator procedure | **Unknown.** No source, deployment, or rollback operation was inspected in this action. |

Therefore, neither `8fd6989` nor any other known local commit may be named as a production rollback candidate today.

## 3. Candidate source-side compatibility: what is established

The BIZ-009 source candidate changes exactly seven application/test paths for owner/Admin stale-write protection. It adds no migration path, API entrypoint, `startup-migrations.ts`, Dockerfile, Railway configuration, or other deployment configuration path.

It reuses the existing canonical `businesses.updated_at` declaration in `lib/db/src/schema/businesses.ts`, which maps the column as `timestamp(..., { withTimezone: true })`. Its profile writers use only standard PostgreSQL `clock_timestamp`, `GREATEST`, `date_trunc`, and `INTERVAL` expressions on that existing revision column.

This is source compatibility evidence only. It does **not** establish that any production database has the column, timestamp precision, grants, trigger behavior, or deployment-startup behavior required by the candidate.

## 4. Production catalog fact required before a deployment decision

One production catalog fact is necessary to establish the candidate's narrow existing-column prerequisite: the `public.businesses.updated_at` column must exist as a timestamp-with-time-zone column with at least millisecond precision. No business row, owner, address, description, credential, or secret needs to be read.

If the founder later separately authorizes exactly one production database session, it must be session-read-only and execute **only** this sanitized catalog query:

```sql
BEGIN TRANSACTION READ ONLY;

SELECT
  table_schema,
  table_name,
  column_name,
  data_type,
  udt_name,
  datetime_precision,
  is_nullable,
  (column_default IS NOT NULL) AS has_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'businesses'
  AND column_name = 'updated_at';

COMMIT;
```

**Compatible sanitized result:** exactly one row for `public.businesses.updated_at`; `data_type = 'timestamp with time zone'`; `datetime_precision >= 3`. The other returned metadata is recorded only as schema shape, not row data.

This query has **not** been authorized or executed. It must remain separate from index preflight, account remediation, fixture work, DDL, deployment, and all data changes. No proxy may be created, and no credential/DSN may be printed, copied, retained, or stored.

## 5. Startup-writer inventory and release-mode limitation

The source candidate introduces no startup changes, but its normal API process does contain pre-existing startup side effects. That prevents any honest blanket statement of “no startup writer” without an exact deployment configuration and a separately approved writer inventory.

| Startup path | Source-established behavior | Release consequence |
|---|---|---|
| `MWM_EXPLICIT_FEATURE_RELEASE_MODE === "true"` | Its current local helper makes the mode an exact opt-in. Actual production value is unknown and was not read. | It skips the later broad startup runner, automatic publishers, seeds, Stripe initialization, and most post-listener workers. It does **not** erase earlier pre-traffic schema work. |
| Pre-traffic API entrypoint helpers | Before the explicit-mode branch, `index.ts` awaits a broad set of `ensure*` schema helpers for Kinfolk delivery/preferred name/current chapters, member activation, owner-link lifecycle, public business detail, directory/map audit controls, Admin profile/catalog, safety, Community, contributions/HBCU, Living Library, and governed discovery. Some are conditionally enabled, but all are potential schema DDL paths. | A BIZ-009 deployment cannot be described as no-migration/no-writer under this entrypoint. Every invoked helper must be enumerated from the exact remote candidate and either avoided or expressly approved. |
| Founder-map restoration worker | The entrypoint starts `startFounderMapRestorationWorker` before the explicit-release early return. | The exact worker behavior and production enablement must be inspected before approval; explicit release mode is not a blanket no-write proof. |
| Optional broad runner | In normal mode, `runStartupMigrations()` executes each of **546** named `MIGRATIONS` entries except its limited disabled user/credential-mutation set. The source includes DDL, seeds, upserts, updates, deletes, and account-recovery-related routines. | Normal-mode deployment is incompatible with a no-DB-mutation authorization. |
| Post-run recovery and seed guard | After the broad runner, the local source invokes private-place schema helpers and three account/access recovery routines. If `ENABLE_STARTUP_SEED_GUARDS === "true"`, it then invokes additional non-production seeding/enrichment functions. | These are unapproved mutation risks; they must not be used as an implicit BIZ-009 account or data remedy. |
| Normal post-listener work | Outside explicit mode, the source can start publication/workers, Stripe initialization/backfill, Library seed work, and schedulers. | These remain out of scope for a narrow owner-dashboard release and require separate release review. |

The current source therefore supports this conclusion only: **the BIZ-009 diff itself adds no startup writer; the application startup process still has pre-existing writers and side-effect paths.** A no-deployment decision remains mandatory until their exact remote-candidate behavior and configuration are independently bound and approved.

## 6. Required stop conditions

Stop before any remote publication, database session, deployment, or browser acceptance if any of the following is unresolved or occurs:

1. No immutable remote candidate exactly containing BIZ-009 source commit `897910cba14d720276b20bc1011232e68b0d16df` can be selected.
2. The exact production service/environment, active source/deployment SHA, or known-good rollback procedure is missing or differs from the approval payload.
3. The candidate's `public.businesses.updated_at` catalog result is absent or incompatible, or obtaining it would require anything beyond the separately approved read-only query.
4. Any pre-traffic schema helper, founder-map restoration worker, normal startup migration, account recovery, seed, publication, Stripe action, provider action, or scheduler would run without specific approval.
5. Any build/deploy health issue, target mismatch, unexpected authentication state, configuration change, secret exposure, fixture/account action, or source mismatch appears.
6. The founder has not separately approved one exact business/context, account, original description, temporary value, restore value, and founder-controlled Take Control session.

## 7. Founder-controlled reversible description acceptance sequence — not yet authorized

The existing BIZ-009 packet defines the required sequence. The literal original, temporary, and restore values are intentionally unavailable in the authorized local evidence and must not be invented.

Only after a separately approved deployment and a separate, exact browser/write approval may the following occur:

1. Confirm the named account, selected controlled business, eligible `description` field, exact original value, exact temporary value, and immediate restore value.
2. Use the founder-controlled Take Control session; do not expose or retain credentials.
3. Load the Dashboard selected-business GET state and record the original value/timestamp.
4. Save only the approved temporary description through the authorized profile editor; require the Dashboard's fresh re-read before showing `Saved`.
5. Refresh/relog and verify the same canonical profile value. Public profile/Directory/Map/Kinfolk checks require their own explicit scope and must not be inferred from the dashboard result.
6. Immediately restore the exact original description through the same controlled path; require fresh re-read and refresh/relog restoration evidence.
7. Stop and preserve evidence on stale-write `409`, failed or pending/moderated state, wrong account/business/context, unexpected field/state change, propagation failure, or any authentication issue.
8. Record timestamps and a restoration receipt. Do not perform a provider-backed Kinfolk prompt unless separately approved.

## 8. Next authorization, if the founder wants to proceed

The smallest next action is **not deployment**. It is either:

- a read-only release-binding inspection with no database access, to identify the exact production service/environment, current source/deployment SHA, immutable rollback source/procedure, and command/writer inventory; or
- separately, the one sanitized `information_schema.columns` query in §4, if the founder wants the actual production `updated_at` compatibility fact before considering a deployment.

Each requires its own explicit approval. `BIZ-009` remains **BLOCKED — production acceptance pending**. Later specialties, services, images, moderated-field work, and broader dashboard work remain outside this addendum.
