# BIZ-009 Remote Publication Authorization Request

**Prepared:** 2026-10-19
**Controlling requirement:** `BIZ-009`
**Decision requested:** authorize the exact publication sequence below, or decline it. This document does **not** publish, tag, deploy, alter configuration, open a database session, or edit a business record.

## 1. Validated local-only candidate

| Item | Exact value / evidence |
|---|---|
| Repository | `Melaninmaps/melanin-maps-api` |
| Verified non-failed base | `8fd6989bea317f53dfa6f170c2c5054cf0de74a4` |
| New isolated candidate | `046eb767326c6d87d9dc41b29572eb26c759b9a4` |
| Parent relationship | Candidate parent is exactly `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`. |
| Candidate tree scope | Exactly seven BIZ-009 source/test paths; no migrations, schemas, startup/configuration, mobile, Kinfolk, Directory/Map, membership/payment, coordination, or generated build output. |
| Focused API evidence | `business-owner-multi-business-contract.test.ts` and `adminBusinessProfilePolicy.test.ts`: **2 files / 19 tests passed**; API `tsc -p tsconfig.json --noEmit` passed. |
| Focused Web evidence | `business-dashboard-managed-access.test.ts` and `admin-business-edit-preservation.test.ts`: **2 files / 11 tests passed**; Web `tsc -p tsconfig.json --noEmit` passed. |
| Combined build | `pnpm --filter @workspace/api-server run build` passed from the isolated candidate. Its generated identity recorded `built_from_sha` `046eb767326c6d87d9dc41b29572eb26c759b9a4` and bundle SHA-256 `4a09e356ba1448971dacb2b708f1a99accbfb23ce3a5f6af4647e75d6a1f3d25`. Build output was restored/removed and is not part of the candidate tree. |

### Exact seven-path tree diff

1. `artifacts/api-server/src/routes/businesses.ts`
2. `artifacts/api-server/src/routes/__tests__/business-owner-multi-business-contract.test.ts`
3. `artifacts/api-server/src/businesses/__tests__/adminBusinessProfilePolicy.test.ts`
4. `artifacts/web/src/pages/business-dashboard.tsx`
5. `artifacts/web/src/__tests__/business-dashboard-managed-access.test.ts`
6. `artifacts/web/src/components/AdminEditBusiness.tsx`
7. `artifacts/web/src/__tests__/admin-business-edit-preservation.test.ts`

## 2. Exact action requested for approval

Approve these actions **only**, in order, from the local detached candidate containing SHA `046eb767326c6d87d9dc41b29572eb26c759b9a4`.

1. Read-only collision preflight:

   ```bash
   git ls-remote --exit-code origin \
     refs/heads/candidate/biz009-owner-editor-20261019 \
     refs/tags/biz009-owner-editor-rc-20261019-046eb767
   ```

   The normal expected outcome is that neither proposed ref exists. If either ref exists, stop without writing any remote ref, even if its target appears compatible.

2. If and only if the collision preflight establishes that neither ref exists, publish exactly this candidate commit under the one branch and one commit-addressed tag:

   ```bash
   git push --atomic origin \
     046eb767326c6d87d9dc41b29572eb26c759b9a4:refs/heads/candidate/biz009-owner-editor-20261019 \
     046eb767326c6d87d9dc41b29572eb26c759b9a4:refs/tags/biz009-owner-editor-rc-20261019-046eb767
   ```

3. Read-only post-publication verification:

   ```bash
   git ls-remote origin \
     refs/heads/candidate/biz009-owner-editor-20261019 \
     refs/tags/biz009-owner-editor-rc-20261019-046eb767
   ```

   Require both returned refs to resolve to `046eb767326c6d87d9dc41b29572eb26c759b9a4`.

The commit SHA is the source identity. The tag is commit-addressed and must remain protected/no-force-move under repository policy; this request does not assert that a Git tag alone is cryptographically immutable.

## 3. Explicitly excluded from this authorization

This authorization request does **not** include:

- changing Railway source selection, variables, feature flags, startup behavior, or configuration;
- a Railway deployment, rollback, restart, staging operation, database session, proxy, migration, seed, account/fixture action, provider call, or browser/device acceptance;
- merging into any existing branch, rebasing, force-pushing, force-tagging, updating another ref, or publishing any commit other than `046eb767326c6d87d9dc41b29572eb26c759b9a4`;
- a production save, reversible description test, public readback, Directory/Map verification, or governed Kinfolk query.

## 4. Stop conditions

Stop without publication if any of the following occurs:

1. either proposed remote ref already exists;
2. the local detached `HEAD` or either remote verification target differs from `046eb767326c6d87d9dc41b29572eb26c759b9a4`;
3. the candidate’s parent is no longer `8fd6989bea317f53dfa6f170c2c5054cf0de74a4`;
4. a fresh local exact-diff check yields anything other than the seven paths listed above;
5. the remote rejects atomic publication or reports a policy/protection mismatch; or
6. any request extends to deployment, configuration, data, account, provider, or browser work.

## 5. Still-required later approvals

If publication succeeds, a separate approval is still needed before production deployment. It must explicitly select the returned remote ref, authorize or reject the named startup-writer disposition, name the existing combined Web/API Railway target and rollback deployment, and separately authorize any founder-controlled reversible business-edit acceptance. Publication alone is not staging, production, or member-visible validation.
