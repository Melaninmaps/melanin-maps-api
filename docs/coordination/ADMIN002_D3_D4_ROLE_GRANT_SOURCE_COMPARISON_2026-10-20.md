# ADMIN-002 — D3/D4 Role and Grant Source Comparison

**Requirement:** `ADMIN-002` — Founder/Admin dashboard, API/Admin
**Status:** **SOURCE COMPARISON ONLY — NOT A ROLE, GRANT, OR ENFORCEMENT DECISION**
**Claim receipt:** `8c306d529fb1744d6072d53afab067a626ee393b`
**Authority base:** `5e24a16e858053392259a3f66bff144e79d5754e`
**Date:** 2026-10-20

## 1. Purpose and current base

This record compares only the static seams in the seven hash-verified packaged files identified in the ADMIN-002 compact base. Its purpose is to make the current source boundary legible for future founder and entitlement-owner decisions: administrator predicates, tester-specific access metadata, general user-control protections, and currently packaged membership/tier evaluation seams.

It does not approve a role, classify a historical grant, establish an audit schema, identify an account, determine effective access for any member, or change enforcement. `ADMIN-002` remains **IN DEVELOPMENT** in the supplied master register. The register records that no permitted non-enforcement roles/grants repair exists without an approved historic ledger/audit/authority contract.

## 2. Evidence limits and unavailable D3/D4 historical audits

The following evidence was available and hash-verified in the compact base:

| Packaged input | SHA-256 | Permitted use in this record |
| --- | --- | --- |
| `artifacts/api-server/src/lib/adminAuth.ts` | `d592d73c5d8daac029e15e924ea7fd4a8f1b7100cd5013ecb0e6cc6153878634` | Static administrator-predicate observation |
| `artifacts/api-server/src/routes/admin-testers.ts` | `c05f8dd5ac26f5c1897d030a52f63640a97c59ac73d80fa03658ba3d014fd677` | Static tester-access/event/reversal-route observation |
| `artifacts/api-server/src/routes/admin-users.ts` | `cfa2bc2c9c14d0a6f1a11769f6cff8d9132c94ed75a2d4b01d83208ca2c090de` | Static administrator user-control and protected-account boundary observation |
| `artifacts/api-server/src/middleware/requireMembership.ts` | `14407e4d76fee9179714102ee37edde52584e28adf3eb05c04cbcd0a21e9ec9d` | Static membership-tier and enforcement middleware observation |
| `artifacts/api-server/src/constants/membershipTiers.ts` | `242209e42cd205330d24023008d5069985e75d17908171d180a059bc24b259f6` | Static tier constants and tester-entitlement helper observation |
| `docs/coordination/MWM_KINFOLK_MASTER_COMPLETION_CHECKLIST.json` | `ab03d54878c437bc293f1fda775087dde309005a11cd68e16707d40303706d44` | Read-only current requirement-status and blocker reference |
| `docs/coordination/MWM_KINFOLK_MASTER_COMPLETION_CHECKLIST.md` | `c2f540091530a600da21abd529c64628bdfa7877f075315eba0cbfba6582fb50` | Read-only current completion-board and requirement-register reference |

The referenced membership audit, D3 reconciliation, D4 reconciliation, audit H2, and historical D3/D4 treatment records are **not packaged in this workspace**. They are unavailable historical evidence. This comparison does not reconstruct, interpret, or substitute for them.

The supplied master register therefore remains controlling for the limits of this observation:

- `MEM-D3` is **BLOCKED** pending an approved additive durable multi-grant ledger, precedence and historic-treatment decision, schema/operations disposition, and safe effective-tier plan.
- `MEM-D4` is **BLOCKED** pending an approved, narrowly scoped canonical enforcement journey; current consumers may not be converted speculatively.
- `MEM-D5` is **BLOCKED** pending founder-approved historic data authorization and per-case rules; its locally integrated preparation packet did not export, query, classify, decide, or mutate historic access.

## 3. Static source inventory and crosswalk

| Static seam | Observed source-only behavior | What this observation does **not** establish |
| --- | --- | --- |
| Administrator predicate (`adminAuth.ts`) | `isAdmin` accepts one of three coded paths: a configured normalized email allowlist, a session user role equal to `admin`, or a configured cron-secret header. `isNamedAdmin` excludes the cron-secret path and requires an identified session user with the `admin` role or a normalized allowlist match. | A general founder-role taxonomy, durable role-authority record, historical grant legitimacy, deployed configuration, or current user authorization. |
| Tester access route (`admin-testers.ts`) | The route declares tester access as an access status rather than a membership tier. It defines a bounded tester-source list, exposes dry-run/apply/revoke route seams, and statically writes event values including email, optional user ID, `granted`/`revoked`, access source, grantor, and entitlement end time. | A general multi-grant ledger, a universal audit contract, a source/scope/tier/provider/status schema, an approved grant policy, or a conclusion about any record. |
| Administrator user controls (`admin-users.ts`) | The route statically guards general controls with `isAdmin`; it restricts generic administrator-role changes and routes protected-administrator access through a founder-owner condition. It also contains lifecycle-event and access-entitlement-event write seams. | That these routes define the approved authority model for all roles/grants, that event fields satisfy D3, or that a runtime audit/reversal has occurred. |
| Membership middleware (`requireMembership.ts`) | The middleware’s `getPersonalTier` and `getTier` paths statically examine testing mode, legacy member types, subscription presence, trial state, and eligible business-owner links, then compare a ranked tier with a required tier. | A canonical additive effective-entitlement resolver across independent grants, an approved precedence policy, or safe conversion of other raw consumers. |
| Tier constants/helpers (`membershipTiers.ts`) | The file defines current tier constants and a helper that recognizes an active, non-expired tester entitlement from `testerStatus` and `testingEntitlementEndsAt`. Its member-type mapper maps current string values to canonical tier labels. | A durable grant ledger, evidence that all enforcement uses this helper, provider-safe expiration semantics, or an approved historic classification. |

## 4. D3/D4 comparison matrix

| Comparison dimension | D3 — additive durable grant model | D4 — centralized effective-tier enforcement |
| --- | --- | --- |
| **Observed role predicate** | The packaged administrator helper provides static administrator and named-administrator predicates. The tester route is guarded by the broader `isAdmin` predicate. This is a route-authorization observation only. | The packaged membership middleware computes a tier from current coded conditions and compares rank to a requested tier. It is not a role predicate and does not establish that all consumers use a single resolver. |
| **Observed independent-grant / audit metadata** | The tester route statically contains tester-source, grantor, end-time, applied/pending, and grant/revoke event seams. The protected-administrator route also writes access-entitlement event values. These are bounded current code observations, not a declared general ledger. | The tier helper recognizes active/non-expired tester status independently of `memberType`; the middleware separately recognizes testing mode and existing legacy fields. The packaged sources do not supply a complete cross-source independent-grant precedence record. |
| **Observed effective-tier / enforcement seam** | The packaged source shows tester access described as an access status rather than a membership tier. It does not show an additive durable multi-grant effective-tier computation with the D3-required general ledger fields. | `requireMembership.ts` exposes a current membership rank/threshold seam using testing mode, member type, subscription/trial state, and approved business links. The master register explicitly warns that current raw consumers cannot be converted safely without an agreed journey, server authority, and free-core/business-owner behavior. |
| **Explicitly unresolved evidence** | The D3 historical audit and approved design are unavailable. No approved general record has been supplied for source, scope, tier, start, end, provider, status, audit semantics, precedence, migration/operations disposition, or no-silent-backfill historic treatment. | The D4 historical audit/inventory is unavailable. No approved canonical resolver contract, complete consumer inventory, exemption list, conversion sequence, independent-grant regression boundary, or runtime/member evidence has been supplied. |

## 5. Precise gap statement

**No approved general roles/grants ledger, audit contract, or authority contract exists in the supplied evidence.**

The packaged source contains localized administrator predicates, tester-access route/event seams, protected-account controls, and membership/tier helpers. Those static seams do not, by themselves, specify or prove:

1. a general role model separate from commercial membership;
2. an additive durable grant ledger with approved source, scope, tier, start, end, provider, status, authority, and audit semantics;
3. approved precedence across legacy, provider, trial, founding, beta, tester, business-owner, manual, and other independent access categories;
4. an approved historical treatment or no-silent-backfill decision; or
5. a canonical effective-tier enforcement contract that can replace or exempt named consumers without changing free-core, business-owner, disclosure, payment, provider, or policy behavior.

Accordingly, this record identifies no safe code change, role classification, grant classification, audit schema, migration, query, or enforcement conversion.

## 6. ADMIN-001 and MEM-D5 handoff boundary

### ADMIN-001 boundary

`ADMIN-001` is a separate, locally integrated documentation-only narrow QA activation/reversal packet. It defines a future approval sequence for one existing consented QA account only. It neither establishes a general administrator-role authority contract nor authorizes a role/grant inventory, general ledger, or enforcement change.

### MEM-D5 boundary

`MEM-D5` is a separate, locally integrated documentation-only historic-access ambiguity and future data-authorization packet. It preserves ambiguity and requires later bounded authorization and per-case rules. It does not export, query, classify, reconcile, or mutate historic access, and it does not supply the missing D3/D4 ledger, audit, or precedence decision.

Neither documentation packet may be treated as evidence of an approved role, a current grant, an account outcome, an audit completion, or a runtime enforcement result.

## 7. Hard no-action exclusion

This is a static source comparison only. It does **not** authorize or perform:

- any source, test, schema, route, UI, configuration, or existing-coordination-file edit;
- access to accounts, data, sessions, credentials, databases, providers, payment rails, catalog data, browser/device state, staging, deployment, or remote Git;
- a grant, revoke, role change, entitlement decision, audit entry, historic classification, effective-tier calculation for a real account, or enforcement change;
- a read-only query, export, data review, migration, provider action, activation, runtime test, or acceptance claim; or
- any inference about historical D3/D4 audit conclusions, prices, benefits, terms, identities, records, or outcomes.

## 8. Future founder decision inputs

Before a future D3/D4 implementation or operational exercise can be scoped, the founder and designated owners would need to decide and record at least:

1. the authoritative role/authority taxonomy and its boundary from commercial subscription data;
2. the general grant record contract, including source, scope, tier/effect, start, end, provider relation where applicable, status, authority, and audit requirements;
3. precedence and preservation rules across existing independent-access categories, including explicit treatment for ambiguity and historic records;
4. the no-silent-backfill rule and any separately authorized historic-data review process;
5. the canonical effective-tier/enforcement contract, its named supported journey, exemptions, free-core and business-owner behavior, and privacy/disclosure boundary;
6. the required schema/migration/operations/security review and separate approval sequence; and
7. separately authorized runtime, staging, Web, iOS, Android, provider, and member-visible acceptance criteria.

These are future decision inputs, not decisions made by this packet.

## 9. Document-only completion boundary

This packet completes only the assigned **read-only source comparison**. It does not advance ADMIN-002, MEM-D3, MEM-D4, or MEM-D5 beyond their supplied status; does not establish staging, Web, device, runtime, release, member-visible, or founder acceptance; and does not authorize a successor implementation claim.
