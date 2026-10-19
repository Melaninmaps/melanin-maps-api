# BIZ-009 Coordinated Web/API Deployment Approval Packet

**Prepared:** 2026-10-19
**Decision:** **NOT YET APPROVABLE FOR PUBLICATION OR DEPLOYMENT.** This is a deployment-ready decision packet, not a deployment authorization.
**Controlling requirement:** `BIZ-009` in `MWM_KINFOLK_MASTER_COMPLETION_CHECKLIST.{md,json}`.
**Supersedes for coordinated-surface planning:** [BIZ009_PRODUCTION_DEPLOYMENT_DECISION_PACKET_2026-10-19.md](BIZ009_PRODUCTION_DEPLOYMENT_DECISION_PACKET_2026-10-19.md).
**No action performed by this packet:** no Git publication, source/configuration change, deployment, rollback, restart, database session, public-proxy use, migration, account/fixture action, provider call, or business edit.

## 1. Coordinated production surface

There is no separate Railway Web service for the `www` surface. The production **API service is also the production Web-serving service**.

| Surface | Verified read-only binding |
|---|---|
| Railway project | `melanin-maps-api` — `b98310f8-7bfa-4e43-a574-8819752e9cfe` |
| Environment | `production` — `2292b38f-3d0d-4cad-92a4-ad36cabda629` |
| Combined Web/API service | `api-server` — `a77b49bb-e448-4be8-9d02-de7a3b43136b` |
| Domain binding | The same service owns both `https://www.mappingwithmelanin.com` and `https://api.melaninmaps.com`. |
| Repository source configuration | `Melaninmaps/melanin-maps-api`, branch `candidate/kinfolk-current-website-social-verification-20261015`; branch-following, not commit-pinned. |
| Build / start | `pnpm --filter @workspace/api-server run build` / `pnpm --filter @workspace/api-server run start`; no predeploy command is configured. |
| Web build coupling | Deployed API package build runs `node ./build.mjs`; its deployed build script copies the current Web build into API `dist/public`. Therefore a BIZ-009 Web/API release is one coupled service build/deployment. |
| Current known-successful baseline | Deployment `0add2499-0c78-4b41-abf2-f3ad70cc84e1`, source `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`, created 2026-10-18T02:01:12.278Z. |
| Latest attempt | `c80f9175-f409-44a6-b20e-d5d0ad009924`, source `3720f1d23b2e3e3d64d3e3cafc15221fb57425fe`, **FAILED**. The service is Online with no staged production changes. |

The BIZ-009 repair changes both of the coupled surfaces: five Web paths and two API-test paths plus the canonical API route and Admin policy/test paths, totaling the seven source paths committed by `897910cba14d720276b20bc1011232e68b0d16df`.

## 2. Publication containment decision

### 2.1 Local BIZ-009 source commit

`897910cba14d720276b20bc1011232e68b0d16df` is the final local stale-write source commit. Its own exact scope is seven files:

1. `artifacts/api-server/src/routes/businesses.ts`
2. `artifacts/api-server/src/routes/__tests__/business-owner-multi-business-contract.test.ts`
3. `artifacts/api-server/src/businesses/__tests__/adminBusinessProfilePolicy.test.ts`
4. `artifacts/web/src/pages/business-dashboard.tsx`
5. `artifacts/web/src/__tests__/business-dashboard-managed-access.test.ts`
6. `artifacts/web/src/components/AdminEditBusiness.tsx`
7. `artifacts/web/src/__tests__/admin-business-edit-preservation.test.ts`

It includes the earlier ordinary-editor source receipt `9bc54b36e7ad0d3a11b7a53e3e44a8d50d25bb7e` in its ancestry.

### 2.2 Direct immutable publication is rejected

The current local remote-tracking base is `12e0b7268a4148ce3e948400af79cf6280b893cf`. Commit `897910cb…` is **40 commits ahead** of that base, with unrelated API, Web, mobile, constants, and coordination work in its ancestry.

The current Railway-tracked remote branch instead resolves to `3720f1d23b2e3e3d64d3e3cafc15221fb57425fe` and is the source of the latest failed deployment. The local BIZ-009 commit is not established as an ancestor of that remote head.

A proposed tag `refs/tags/biz009-owner-editor-897910cb` is currently available on the remote repository. It must **not** be created: a tag or deployment pinned directly to `897910cb…` would deploy its entire 40-commit tree, not only the seven BIZ-009 paths.

**Result:** there is no safe direct immutable publication request for `897910cb…` itself. This is a release-containment stop condition, not a request to reopen or reimplement BIZ-009.

### 2.3 Authorized isolation attempt — stopped at exact dependency boundary

The founder authorized the source-only candidate-isolation step. It used the freshly verified, non-failed remote baseline `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`; the final seven-path net patch was ANSI-free, exact in scope, and failed its clean apply check before any source was applied.

That baseline lacks the Owner managed-profile PATCH route and Dashboard managed-access test seam that the final BIZ-009 delta modifies. The baseline dashboard still uses the claim-page detour, and two named focused regression paths are absent. The local prerequisite history is named in [BIZ009_SOURCE_ISOLATION_BLOCKER_2026-10-19.md](BIZ009_SOURCE_ISOLATION_BLOCKER_2026-10-19.md).

No isolated candidate SHA, build, focused regression, no-emit result, or remote-ref proposal exists. The attempt stops here under the founder's exact-dependency rule. A future explicit decision must select either a named non-failed baseline that already contains the prerequisite Owner editor contract, or a fresh bounded prerequisite-expansion claim. Neither is implicit in this packet.

## 3. Exact eventual immutable-publication approval shape

After the prerequisite in §2.3 succeeds, the founder’s publication approval must state, without placeholders:

```text
Repository:        Melaninmaps/melanin-maps-api
Source commit:     <new isolated full 40-character SHA>
Remote immutable ref: refs/tags/<approved unique immutable BIZ-009 release tag>
Content proof:     tree diff is exactly the seven BIZ-009 source paths
Publication action: create that one ref only; no force, merge, rebase, branch update,
                    tag move, or unrelated ref operation
Verification:      returned remote ref resolves to the approved full SHA
```

The approval must also separately authorize how Railway selects the returned remote SHA. The current service follows a branch and is not commit-pinned; changing that source selection is a production configuration/deployment action and remains out of scope.

## 4. API startup-writer disposition

The deployed baseline source `8fd6989bea317f53dfa6f170c2c5054cf0de74a4` was reviewed read-only. The following disposition is the smallest safe one without changing production configuration or disabling any feature globally.

### 4.1 Existing operations that occur before the explicit-release branch

These pre-traffic schema helpers are called before `MWM_EXPLICIT_FEATURE_RELEASE_MODE` can skip later work:

- `ensureKinfolkPreferredNameSchema`
- `ensureDirectoryReconciliationLedgerSchema`
- `ensureFounderMapRestorationSchema`
- `ensureLegacyMapLocationAttestationSchema`
- `ensureInternationalDirectoryOnlyVisibilitySchema`
- `ensureBusinessWebsiteCleanupAuditSchema`
- `ensureAdminBusinessProfileReceiptsAndCatalogSchema`
- `ensureBusinessDeletionHoldSchema`
- `ensureKinfolkCurrentOnlinePresenceReviewSchema`

They are existing schema operations; some conditional feature helpers can also run before traffic for Kinfolk image/private-place features. Consequently, **explicit release mode is not a zero-DDL/no-startup-schema mode**.

Before the same early-return branch, `startFounderMapRestorationWorker` is invoked. Its deployed code begins writes only when `MAP_RESTORATION_WORKER_ENABLED === "1"`. The business-deletion worker is invoked but its deployed implementation only logs that automatic deletion is disabled and returns a no-op.

### 4.2 Optional normal-mode operations

If `MWM_EXPLICIT_FEATURE_RELEASE_MODE !== "true"`, the deployed service can additionally run directory-review/Safety/Publication/Community schema helpers, directory publication work, Stripe initialization/backfill, Lehigh Valley publication, health/cron/growth workers, and `runStartupMigrations`.

The deployed migration runner has **535** named migration entries and excludes only **13** specifically listed account/credential mutation migrations. After the runner, deployed code calls account/access recovery routines; if `ENABLE_STARTUP_SEED_GUARDS === "true"`, additional seed/enrichment operations are eligible.

### 4.3 Safe disposition today

- No variable will be changed and no feature will be disabled globally.
- No deployment may claim “no migration” or “no writer.”
- The relevant feature/worker values have not been read because the available metadata method would expose a service-wide variable set that includes secrets, and filtered deploy logs yielded no attested startup markers.
- A deployment approval must either expressly approve this named startup effect inventory for the isolated candidate or be preceded by a separately authorized, non-secret, narrowly captured effective-mode/worker-state attestation. No broader configuration read is implied.

## 5. Production schema inspection remains pending

The exact schema query remains approved but unexecuted. It must wait for an active founder-controlled private Railway Console session:

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

Do not use the existing public Postgres TCP proxy, create a proxy, expose a DSN, read business/account rows, or substitute another database connection method.

## 6. Coordinated rollback procedure

The same `api-server` service owns both Web and API surfaces; rollback is one Railway deployment action, not separate Web/API actions.

**Known-good baseline deployment:** `0add2499-0c78-4b41-abf2-f3ad70cc84e1`.

A future explicit rollback authorization must permit exactly this Railway `redeploy` target:

```text
projectId:     b98310f8-7bfa-4e43-a574-8819752e9cfe
environmentId: 2292b38f-3d0d-4cad-92a4-ad36cabda629
serviceId:     a77b49bb-e448-4be8-9d02-de7a3b43136b
deploymentId:  0add2499-0c78-4b41-abf2-f3ad70cc84e1
```

The authorization must name the rollback operator and allow only the post-rollback technical health confirmation. Browser/member/business-record acceptance is not included.

## 7. Stop conditions and final decision

Stop before publication or deployment if any of these remains unresolved:

1. an isolated seven-path BIZ-009 candidate is absent or includes unrelated ancestry;
2. the exact remote immutable SHA/ref is missing or does not tree-match the isolated candidate;
3. the production `public.businesses.updated_at` catalog result is absent or incompatible;
4. any unapproved pre-traffic schema operation, worker, migration, recovery, seed, publication, Stripe effect, or configuration change would run;
5. the target project/environment/service, rollback baseline, or public-domain binding differs from this packet;
6. service health is not settled/Online, a pending configuration change exists, or an unexpected deployment failure occurs; or
7. a later acceptance proposal lacks the exact account, controlled business, reversible description values, restoration plan, and founder-controlled Take Control scope.

**Final decision:** BIZ-009 is not deployable yet. The next smallest safe milestone is founder authorization of the source-only seven-path candidate-isolation step—not direct publication of `897910cb…`, deployment, or production editing.
