# BIZ-009 / BIZ-003 — Consolidated Isolated-Staging Authorization Request

**Prepared:** 2026-10-20
**Status:** Execution scope authorized by the 2026-10-20 `AUTONOMOUS COMPLETION AUTHORIZATION — Business Owner / BIZ-009 / BIZ-003`; **no staging action has yet been executed**.
**Controlling records:** `BIZ-009` and `BIZ-003` in `MWM_KINFOLK_MASTER_COMPLETION_CHECKLIST.{md,json}`; Business Owner board `EXP-BUSINESS-OWNER-EDITOR-ANALYTICS-AND-PUBLICATION`.

This packet supersedes neither a production deployment decision nor a mobile-device/build approval. It requests one future, controlled **isolated staging** exercise only. Until the founder explicitly approves an exact payload, no staging or production access, remote Git action, schema/data action, storage action, sign-in, browser/device test, deployment, provider call, or credential use may occur.

## 1. Exact local candidate to bind before any future action

| Item | Required value / boundary |
| --- | --- |
| Product-source candidate SHA | `b7c91eac18d0fd420f492891e56f67af8ec2ed16` — final reviewed local authority candidate; its last application-source commit is `58b5ba376aa1eaac52c3dbe745a2f4f08e0d3839` (`fix: isolate owner vibe and preview context`) and this documentation descendant records all accepted source receipts. |
| Local coordination snapshot | `8935ac7a854cd4fa11026e6c04a5b999968c23d3` — latest local registry/checklist receipt. It is a documentation descendant, not a deployed identity. |
| Local ref | `refs/heads/staging/kinfolk-full-candidate-20261014`. |
| Remote availability | **Unverified.** No fetch, push, remote inspection, tag, branch, or deployment action has been performed or is implied. A future approval must separately require a byte-matching candidate selection before staging execution. |
| Local deterministic matrix | API: **10 files / 95 tests**; native: **13 files / 81 tests**; Web: **3 files / 21 tests**; API, native, and Web `tsc --noEmit` all passed. This is source evidence only. |

The future operator must stop before any action if the intended staging artifact cannot be proven to contain the product-source candidate above, or if its source/build/startup writer inventory differs from the reviewed request.

## 2. Exact isolated target requested for approval

The requested target is the existing isolated staging database identity previously named for this program:

- **Environment/service:** `mwm-owner-staging-20261014` / `staging` / `Postgres`.
- **Scope:** only a separately designated isolated staging application and its explicitly identified staging storage namespace.
- **Prohibited targets:** production; any shared development database; any production bucket/object; any personal/member account; any unidentified service, environment, proxy, or deployment.

Before the exercise, an approved operator must confirm the target identifiers, the application URL, the staging database identity, the storage bucket/prefix, the deployment/rollback mechanism, and the exact candidate selected. If any identifier is missing, ambiguous, or points outside this isolated target, stop without substitution.

## 3. Narrow Business Voice schema-readiness operation requested

This request asks for only the following bounded staging schema work, after a catalog-only preflight:

1. Inspect the object-level shape of **only** `business_kinfolk_voice_profiles` and its required columns/indexes against the existing source definition `business_kinfolk_voice_profiles_v1`.
2. If and only if that table/shape is missing or incompatible, apply the existing table-specific, idempotent Business Voice readiness treatment for that one relation.
3. Re-run the same object-level compatibility check and capture sanitized results.

The operation must not invoke broad `runStartupMigrations`, create or alter unrelated relations, run a generalized migration command, seed business/profile/owner data as a side effect, alter entitlement/policy tables, or activate a provider. It must fail closed on an unexpected shape or writer. The current local helper and pre-traffic wiring are source-only evidence; this request does not claim that the table exists in staging or production.

## 4. Controlled fixture plan

All accounts, businesses, owner links, feedback, media, and cleanup identifiers must be created only after explicit approval and recorded in a temporary run sheet that is not committed to source control. The requested minimal fixture set is:

| Fixture alias | Controlled role | Required state |
| --- | --- | --- |
| `stg-owner-a` | Current approved owner / manager for `stg-business-a` | Active `owner`, `approved`, `revokedAt IS NULL`. |
| `stg-owner-b` | Current approved owner / manager for `stg-business-b` | Active `owner`, `approved`, `revokedAt IS NULL`; never authorized for A. |
| `stg-owner-former` | Former/revoked owner for `stg-business-a` | Revoked or otherwise non-current; must be denied. |
| `stg-member-feedback` | Member submitting opted-in feedback | No owner entitlement. |
| `stg-business-a` | Exactly-one-owner feedback/profile/media target | Opted into feedback; used for save, media, Voice, and owner inbox assertions. |
| `stg-business-b` | Cross-business isolation target | Separate owner and media/profile state. |
| `stg-business-multi` | Ambiguous-owner feedback target | Exactly two current approved unrevoked owner links; feedback must persist without private delivery. |

No existing staging or production user/business may be repurposed. Use an approved, unique run prefix; store only minimal synthetic text/media; and delete/revoke only fixtures created for this run. Actual account IDs, login method, and credential handling must be named in the approval rather than inferred from this packet.

## 5. Staging API and browser acceptance requested

The approved exercise should execute the following only against the isolated fixtures, using sanitized receipts. Browser steps require a separate explicit indication that browser interaction is included; no browser operation is authorized by this draft.

1. **Managed selection and profile revision.** Verify zero/one/multiple managed-list responses behave as designed; verify A cannot read or mutate B; save A with the loaded `updatedAt`; simulate a second authorized stale save and require `409 BUSINESS_PROFILE_STALE_WRITE` with no unintended mutation; refresh the selected A record before reporting success.
2. **Selected media isolation.** On A, upload one benign fixture image only within the approved staging bucket/prefix; set its cover; attempt a B URL/cross-owner action and require neutral failure/no mutation; remove the A image and verify persistence precedes best-effort cleanup. Verify no arbitrary first business is selected. Do not use production storage or retain an object beyond the run.
3. **Featured Video.** Verify selected-business route binding and failure recovery using either a pre-approved harmless staging object or a non-provider-backed external-link fixture. Do not activate a video provider or use production media.
4. **Business Voice Profile.** Verify the table-ready profile GET/PUT journey for A no longer fails because the relation is absent, and that unauthorized/revoked/B contexts are denied neutrally. Do **not** invoke a Kinfolk/AI draft generation, provider model call, OAuth flow, or automated post/send/reply under this request.
5. **Private feedback privacy.** Submit one opted-in synthetic member feedback item for `stg-business-a`; verify exactly the active owner A—not `stg-owner-former`, B, or a submitter/provenance identity—can receive the private inbox record after a controlled refresh. For `stg-business-multi`, verify feedback persistence and normal submit response without any private conversation/message mutation. Verify revoked/former and cross-business reads are denied.
6. **Directory/Kinfolk readbacks.** After the selected fixture changes, perform only the explicitly approved staging readbacks for the public-directory/business-profile/Kinfolk discovery surfaces. No production publication claim, provider-backed generation, or real member account is included.
7. **BA-002 and sensitive controls.** Retain existing permission, owner-only, and no-unauthorized-write behaviors in each scenario; stop on any unexpected disclosure or role bypass.

A pass means only that the approved isolated staging scenario completed with the named fixtures. It does not imply production readiness, member acceptance, release readiness, or founder acceptance.

## 6. Storage, privacy, and evidence safeguards

- Identify one staging-only bucket and unique object prefix before upload. Do not use an inferred, default, production, or shared prefix.
- Use a benign synthetic image/video/link fixture without personal data. Avoid logs, screenshots, or receipts that expose tokens, cookies, raw database records, private messages, or full object URLs beyond what is necessary for a sanitized audit.
- Verify object ownership/path belongs to the selected staging business before each deletion. On a failed persistent update, do not claim cleanup succeeded.
- Capture only scenario outcome, selected fixture alias, sanitized HTTP/result code, timestamp, and cleanup outcome in the final receipt.

## 7. Required stop conditions

Immediately stop the approved exercise and request a new decision if any of these occur:

- candidate SHA/ref cannot be proven to match the local source candidate;
- target, storage namespace, rollback target, fixture identity, or authenticated context is ambiguous;
- a broad migration, unexpected startup writer, provider/OAuth/payment behavior, production target, or non-fixture record would be touched;
- schema shape differs from the table-specific expected contract;
- cross-business/private-feedback disclosure, role bypass, stale-write mutation, or unexpected media persistence occurs;
- browser/device/mobile-build action is needed but is not explicitly approved;
- credentials, secret values, personal data, or production records would need inspection.

## 8. Rollback and cleanup requested

Before beginning, the future approval must name a known-good staging rollback artifact/procedure and the responsible operator. The requested cleanup is:

1. remove only the approved run-prefixed fixture media from the identified staging bucket/prefix;
2. remove only feedback/conversation/profile/media fixtures created for this run, then revoke/remove only the run-created owner/member fixture accounts/links;
3. record a sanitized cleanup receipt;
4. if the Voice table was newly created, do **not** automatically drop it. Any destructive DDL rollback requires a separate explicit decision after confirming whether the table has received data. If it pre-existed, do not alter or drop it;
5. if an application rollback is needed, use only the pre-approved staging rollback mechanism and capture the outcome.

## 9. Explicitly excluded future work

This request does **not** approve:

- any production action, remote Git publication, deployment, release, or founder acceptance;
- broad migrations, unrelated DDL/data changes, entitlement/pricing/payment changes, or live provider/OAuth/AI activation;
- mobile app build, TestFlight/Play delivery, physical iOS/Android device validation, or device-account interaction;
- use of personal accounts, member-visible production data, or real customer communications.

A later, distinct authorization is required for mobile build/device validation and another distinct founder decision is required for production/release/founder acceptance.

## 10. Approval payload required before execution

A valid future founder approval must explicitly provide or confirm all of the following:

> Authorize the isolated staging exercise for final reviewed local authority candidate `b7c91eac18d0fd420f492891e56f67af8ec2ed16` (application-source tip `58b5ba376aa1eaac52c3dbe745a2f4f08e0d3839`), after byte-matching candidate selection. Target only `mwm-owner-staging-20261014 / staging / Postgres` and one named staging-only storage bucket/prefix. Permit the catalog-only Business Voice table preflight and, only if required, the table-specific `business_kinfolk_voice_profiles_v1` readiness operation—never broad migrations. Permit only the named synthetic fixtures and scenarios in this packet, the named staging rollback/cleanup procedure, and sanitized evidence capture. No production, remote Git publication, provider/OAuth/payment activation, mobile build/device, or founder/release acceptance is included.

The authorization is limited by its explicit target/candidate/rollback/fixture stop conditions. If any named target, rollback procedure, storage namespace, synthetic-fixture identity, candidate match, or credential workflow is ambiguous, stop and request a decision; this packet does not itself record external execution.
