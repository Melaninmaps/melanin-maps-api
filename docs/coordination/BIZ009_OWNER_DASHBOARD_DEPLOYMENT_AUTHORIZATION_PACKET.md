# BIZ-009 Owner Dashboard — Deployment and Rollback Authorization Packet

**Prepared:** 2026-10-19  
**Status:** Preparation only — **not** an authorization to publish, deploy, migrate, access a database, create a fixture, sign in, or edit a business record.  
**Controlling requirement:** `BIZ-009` in `MWM_KINFOLK_MASTER_COMPLETION_CHECKLIST.{md,json}`.  
**Related minimum editor acceptance:** `BIZ-006`; staging authentication checkpoint: `BIZ-008`.

## 1. Exact source receipt in scope

The bounded ordinary owner-editor repair is locally source-integrated only:

| Item | Exact value |
|---|---|
| Source commit | `9bc54b36e7ad0d3a11b7a53e3e44a8d50d25bb7e` |
| Commit subject | `fix(owner): wire dashboard profile save receipt` |
| Coordination receipt | `5f0666372aa332a021bcaca15ad999ec9ac20d9b` |
| Carrier archive SHA-256 | `61bf3b51c485bc7ea81ef70d8fa519591f7ade99b59ccf68bbb80db45ecf2239` |
| Carrier patch SHA-256 | `892b8d5bfbe4f47d359cd026bbf08a6ecdc25de92ea30c5f399274d7e7a91324` |
| Changed source paths | `artifacts/web/src/pages/business-dashboard.tsx`; `artifacts/web/src/__tests__/business-dashboard-managed-access.test.ts` |
| Local validation | Focused Web contract: 1 file / 5 tests passed; Web `tsc -p tsconfig.json --noEmit` passed; `git diff --check` passed. |

### Included behavior

The repair replaces the Dashboard’s existing `Edit Profile` claim-page detour with a selected-owner editor that uses only existing managed-profile GET/PATCH endpoints. It limits the payload to `description`, `phone`, `website`, and `hours`; uses credentialed requests; shows `Saving`, `Saved`, and safe bilingual `Failed` states; preserves entered draft values on a failed save; and requires a successful PATCH plus fresh selected-record re-read before reporting `Saved`.

### Explicit exclusions

This candidate does **not** implement or change address/city/state editing, map coordinates, publication, public Directory eligibility, Map eligibility, governed Kinfolk eligibility/freshness, Kinfolk Current, specialties, media, ownership, verification, suspension, archive/delete queues, payment, provider behavior, mobile clients, or field-level last-approved/Pending Approval moderation.

`BUSINESS-OWNER-003-STALE-PROFILE-WRITE-PROTECTION` is a separately claimed local source-only revision-conflict repair. It is **not included** in this two-path deployment candidate unless a future central acceptance explicitly names a later integrated candidate SHA and repeats this packet’s release gates.

## 2. What the source receipt does and does not prove

The local receipt proves only source compatibility and the named focused checks. It does not prove that the current production dashboard contains the repair, that a save is durable, or that a saved profile is publicly readable or fresh in Directory/Map/Kinfolk surfaces.

A founder-authorized read-only production observation established the pre-repair visible defect: Dashboard `Edit Profile` navigated to `/for-business-owners?claim=c678e359-0000-4000-8000-000000000001`, a public marketing/claim/submit page rather than an authorized editor. That observation involved no write and must not be used to infer the current deployment’s database binding, release source SHA, rollback source, or propagation behavior.

## 3. Release facts deliberately unresolved

The exact deployable remote Git SHA, environment/service deployment target, current successful deployment, and verified rollback deployment SHA are **not named in this packet**. The local source commit has not been remotely published or deployed under the source-only boundary.

The known staging authentication checkpoint is failed (`BIZ-008`), and staging is not an accepted substitute for production editor acceptance. Current local startup sources also include pre-traffic database-writer helpers. No deployment may assume those helpers are harmless or run them implicitly.

Therefore, this packet must not be converted into a deployment command, provider action, or release claim.

## 4. Smallest safe authorization sequence

### Step A — optional but required before an exact deployment request

Authorize one **read-only release-binding inspection** limited to the intended environment/service and release metadata. It must not read secret values, open a database console, create a proxy, modify variables, build, deploy, or access a browser session.

The inspection must return only:

1. named environment and service/deployment target;
2. current successful source revision and deployment timestamp;
3. named known-good rollback revision and confirmation it is retrievable by the approved release mechanism;
4. build/start/predeploy commands and a sanitized inventory of any candidate startup/pre-traffic database writers;
5. whether a deployment can be configured to avoid unapproved schema/data/fixture/account writers.

If that information cannot be collected without a broader operation, stop. Do not infer it from old staging or production observations.

### Step B — separate founder deployment authorization, only after Step A

The final authorization request must contain no placeholders. It must name:

- **exact deployable remote candidate SHA** that contains `9bc54b36e7ad0d3a11b7a53e3e44a8d50d25bb7e` and the two-path content fingerprint;
- **exact environment/service target** and expected application URL;
- **exact known-good rollback SHA** and rollback command/mechanism;
- a zero-ambiguity DDL/schema/data/fixture/account/startup-writer inventory, with every allowed writer explicitly approved or the deployment blocked;
- success checks limited to unauthenticated technical health and deployed-source/deployment metadata until browser testing is separately approved;
- abort conditions, including deployment failure, wrong source SHA, missing rollback, unexpected writer, health failure, or any need for secret/database/account action.

No database migration, fixture/account provisioning, provider call, feature flag change, or user-data mutation is authorized by a deployment approval unless named as a separate action in that approval.

### Step C — separate founder acceptance authorization after a successful approved deployment

Only after Step B succeeds may the founder consider a separately bounded production acceptance request. The request must specify:

- the exact authenticated account/context and Take Control session;
- one founder-approved low-risk description field and reversible test value;
- the captured prior value and an immediate verified restoration procedure;
- the exact authorized readback surfaces: Dashboard refresh/relogin, canonical public profile, and any separately allowed Directory/Map/Kinfolk reads;
- timing limits and a stop rule if propagation is stale, a pending/moderated state appears, or any response exposes a different business/context;
- an auditable result and restoration receipt.

No provider-backed Kinfolk prompt, real business correction, or broader dashboard editing is implicitly authorized. Directory/Map/Kinfolk freshness remains separate from the ordinary dashboard persistence check.

## 5. Approval payload template — not yet actionable

> Authorize exactly one deployment of remote candidate `<candidate SHA containing 9bc54b36…>` to `<named environment/service/URL>`, using rollback `<verified rollback SHA/mechanism>`. The approved pre-traffic writer inventory is `<explicit list or none>`. No database schema/data, fixture/account, provider, browser, production-record, or feature-flag action is included. Stop and report if source, target, rollback, writer inventory, or technical health differs from the approved values.

This template is intentionally incomplete until Step A is explicitly authorized and produces independently observable release metadata.

## 6. Current status

- `BUSINESS-OWNER-002-ORDINARY-PROFILE-SAVE-RECEIPT`: `SOURCE_INTEGRATED_LOCAL_ONLY`.
- `BIZ-006`: `BLOCKED` pending the staging/account/deployment/fixture/browser gates.
- `BIZ-009`: `IN DEVELOPMENT`; the two-path ordinary editor is source-integrated locally, while cross-role stale-write protection, field moderation/last-approved/Pending Approval design, and all live acceptance evidence remain separate.
- No release, member-visible, staging, production, Directory/Map/Kinfolk, or founder-accepted status is asserted.
