# BIZ-009 Source-Only Candidate Isolation — Exact Dependency Blocker

**Date:** 2026-10-19
**Disposition:** **RESOLVED IN LOCAL SOURCE-ONLY RECONCILIATION — seven-path candidate validated locally; remote publication and deployment remain unapproved.**
**Controlling requirement:** `BIZ-009`
**Authorization applied:** Founder-authorized source-only candidate isolation under §2.3 of [BIZ009_WEB_API_DEPLOYMENT_APPROVAL_PACKET_2026-10-19.md](BIZ009_WEB_API_DEPLOYMENT_APPROVAL_PACKET_2026-10-19.md).

No original BIZ-009 implementation was changed. No remote publication, deployment, configuration change, database action, provider call, account action, browser action, or production edit occurred.

## 1. Fresh verified non-failed baseline

| Item | Evidence |
|---|---|
| Remote repository | `Melaninmaps/melanin-maps-api` |
| Isolated baseline | `8fd6989bea317f53dfa6f170c2c5054cf0de74a4` |
| GitHub read-only verification | Commit subject `Merge pull request #314 from Melaninmaps/integrate/map-directory-kinfolk-discovery-20261017`; committed `2026-10-18T02:01:10Z`; parent `cf11e3482b8e6ebd7d4142ce1365e3741ca142f0`. |
| Release status used for selection | Railway’s current known-successful API/Web deployment baseline, not the later failed `3720f1d…` attempt. |
| Local construction | The commit was fetched read-only and checked out in a disposable detached worktree. Main authority remained clean at `0c5ab3f0852101923484e7b5b1af4dac17aafbde`. |

## 2. Exact intended seven-path delta

The final BIZ source commit is `897910cba14d720276b20bc1011232e68b0d16df`. Its net BIZ delta was generated from source parent `c7c597fc6a124030e5d4c045fd3352d4994bb265` with only these paths:

1. `artifacts/api-server/src/routes/businesses.ts`
2. `artifacts/api-server/src/routes/__tests__/business-owner-multi-business-contract.test.ts`
3. `artifacts/api-server/src/businesses/__tests__/adminBusinessProfilePolicy.test.ts`
4. `artifacts/web/src/pages/business-dashboard.tsx`
5. `artifacts/web/src/__tests__/business-dashboard-managed-access.test.ts`
6. `artifacts/web/src/components/AdminEditBusiness.tsx`
7. `artifacts/web/src/__tests__/admin-business-edit-preservation.test.ts`

The raw, ANSI-free net patch hash was:

```text
1f80db5634f99486b78c0ed629d45bdb5a469f404263def1173a6aaf383d81bc
```

Its path list was exactly seven paths. `git apply --check --whitespace=error` against the verified baseline failed before any source was applied.

## 3. Exact missing dependency and incompatibility evidence

The failure is not a whitespace or patch-packaging issue. The successful production baseline predates the required Owner editor contract:

| Baseline gap | Evidence | Consequence |
|---|---|---|
| Selected Owner managed-profile PATCH route is absent | Baseline `artifacts/api-server/src/routes/businesses.ts` has no `router.patch("/businesses/mine/managed/:businessId/profile"` seam. | The BIZ stale-write delta is a modification of a later Owner profile route, not a standalone addition against this baseline. |
| Dashboard still has the claim-page detour | Baseline `artifacts/web/src/pages/business-dashboard.tsx` routes Edit Profile to `/for-business-owners?claim=…`. | The in-dashboard managed profile transport expected by BIZ-009 does not exist on the baseline. |
| Owner route regression file is absent | `artifacts/api-server/src/routes/__tests__/business-owner-multi-business-contract.test.ts` is absent. | The focused Owner regression contract cannot be applied or run as named. |
| Dashboard managed-access regression file is absent | `artifacts/web/src/__tests__/business-dashboard-managed-access.test.ts` is absent. | The focused Dashboard regression contract cannot be applied or run as named. |
| Existing path contexts differ | `businesses.ts`, `business-dashboard.tsx`, and `AdminEditBusiness.tsx` hunks do not apply to baseline contexts. | Reconciliation would require importing pre-BIZ Owner editor functionality, not merely applying the final seven-path stale-write delta. |

The exact local prerequisite history identified by path-level Git tracing is:

- `1b98da471e1d0a6e9ab3d56a977804104ad56a07` — `fix(owner): target permitted edits by business id`; introduces the Owner managed-profile PATCH seam and its route-contract lineage.
- `2ed1ba6dffd6fa88a33698eb9e1c4aceb1698bcb` — `fix(owner): use managed list in dashboard`; introduces the Dashboard managed-access test lineage.
- `d55674a5def78dee29d3e18a0eed5d709b1e2889` — `fix(owner): bypass cached dashboard auth`; extends that Dashboard managed-access test lineage.

Those prerequisites are not established in the chosen successful remote baseline. Adding them silently would violate the authorized final-seven-path scope.

## 4. Validation disposition

| Check | Result |
|---|---|
| Fresh remote baseline verification | Passed — `8fd6989…` verified read-only. |
| Detached isolation worktree | Passed — clean at `8fd6989…`. |
| Seven-path patch scope | Passed — exactly seven paths. |
| ANSI-free patch integrity | Passed — raw patch regenerated after detecting local forced color output. |
| Baseline apply check | **Blocked** — missing Owner route/test seams and incompatible existing contexts. |
| Focused API/Web tests | **Not run** — no valid isolated source tree exists. |
| API/Web TypeScript no-emit | **Not run** — no valid isolated source tree exists. |
| Combined production build | **Not run** — no valid isolated source tree exists. |
| Candidate commit / immutable ref | **Not produced.** |

## 5. Required next decision

No direct publication or deployment request is valid from this attempt.

The founder must select one explicitly bounded source-only path before isolation can resume:

1. **Alternative-baseline path:** provide or authorize discovery of a named, non-failed remote baseline that already contains the exact Owner managed-profile route, Dashboard managed-access contract, and related source seam; or
2. **Explicit prerequisite-expansion path:** authorize a new, exact source-path claim that includes the named prerequisite contracts as a reviewable release slice, with a fresh path/commit inventory and validation plan.

Either option must still yield a final candidate whose tree diff is explicitly reviewed before publication. It must not use the 40-commit local ancestry or the failed production deployment as a default baseline.

## 6. Cleanup and preservation

The disposable worktree and transient patch should be removed only after this receipt is committed. The main authority and completed original BIZ-009 commits remain unchanged.


## 7. Authorized prerequisite-expansion resolution

The founder subsequently authorized the exact prerequisite-expansion path, still limited to the same seven BIZ paths. The detached worktree stayed parented to the verified successful base `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`. The reconciliation did not import the 40-commit local ancestry, alter the central authority product tree, or add any path outside the seven-path inventory.

| Check | Result |
|---|---|
| Local detached candidate | **Passed** — `046eb767326c6d87d9dc41b29572eb26c759b9a4` is parented directly by `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`. |
| Exact tree diff | **Passed** — exactly the seven paths listed in §2; `git diff --check` passed. |
| Focused API contracts | **Passed** — 2 files / 19 tests. |
| API no-emit | **Passed** — `pnpm exec tsc -p tsconfig.json --noEmit`. |
| Focused Web contracts | **Passed** — 2 files / 11 tests. |
| Web no-emit | **Passed** — `pnpm exec tsc -p tsconfig.json --noEmit`. |
| Coupled API/Web build | **Passed** — `pnpm --filter @workspace/api-server run build`; rebuilt after commit with `built_from_sha` `046eb767326c6d87d9dc41b29572eb26c759b9a4` and bundle SHA-256 `4a09e356ba1448971dacb2b708f1a99accbfb23ce3a5f6af4647e75d6a1f3d25`. |

The first attempted temporary dependency link incorrectly resolved workspace packages into the central authority rather than the detached baseline and produced false missing-export diagnostics. Those diagnostics are superseded, not candidate failures. The final validation used package-level workspace shims that resolve `@workspace/constants` and `@workspace/db` to the detached baseline itself; an offline `pnpm install --ignore-scripts --offline` was attempted but stopped before any network request because `nanoid@3.3.12` was absent from the local store. No download was attempted.

No remote Git action, configuration read/change, deployment, migration, database session, provider call, account/fixture action, browser/device action, or production business edit occurred. Generated build outputs were restored/removed before the detached candidate was left clean.

## 8. Current required decision

The initial dependency blocker is resolved for source isolation. The remaining next authorization is the exact publication request in [BIZ009_REMOTE_PUBLICATION_AUTHORIZATION_REQUEST_2026-10-19.md](BIZ009_REMOTE_PUBLICATION_AUTHORIZATION_REQUEST_2026-10-19.md). It is limited to collision checks and atomic creation of the named branch/tag at `046eb767326c6d87d9dc41b29572eb26c759b9a4`. Publication remains separate from Railway source selection, startup-writer disposition, deployment, rollback, and founder-controlled acceptance.
