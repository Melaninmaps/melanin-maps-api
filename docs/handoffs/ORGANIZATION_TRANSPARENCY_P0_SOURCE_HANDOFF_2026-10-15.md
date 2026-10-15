# Organization Transparency P0 — Source-Only Handoff

**Date:** 2026-10-15
**Branch:** `feat/organization-transparency-foundation-20261015`
**Pull request:** #293
**Base:** `integration/kinfolk-interest-intelligence-source-candidate-20261015`

## Delivery boundary

This delivery is **source-only and intentionally disabled**. It did not execute a migration, seed a database, deploy an API or web/mobile application, invoke a provider, modify production or staging data, create a build, or alter any existing directory, Kinfolk, review, member, billing, or deployment path.

The additive routes are registered only when:

```text
ORGANIZATION_TRANSPARENCY_ENABLED=true
```

The corresponding web routes are rendered only when:

```text
VITE_ORGANIZATION_TRANSPARENCY_ENABLED=true
```

Both values remain off by default. `app.ts` keeps the API registration behind the server flag; `App.tsx` keeps all Organization Transparency web routes behind the client flag.

## P0 workflow delivered

| Area | Delivered behavior | Safety boundary |
|---|---|---|
| Organization identity | Member duplicate check, factual organization intake, exact name/location identity key, and reviewer-gated factual state | No automatic directory backfill, publication, map pin, Kinfolk use, or promotion |
| Profiles and locations | Additive organization profile and primary-location model | Existing business/directory models remain unchanged |
| Member experiences | Relationship-specific structured themes for employee, customer, patient, and caregiver contexts | No stars, universal scores, rankings, or medical-quality claims |
| Privacy and moderation | Pseudonymous-or-private choice, pre-storage direct-identifier screening, audit events, reviewer reason, receipt URLs, and appeal recovery | Pending, private, held, rejected, withdrawn, and unidentified records remain non-public |
| Owner participation | Human-verification claim, limited access status, factual-correction requests, moderated public responses, and dispute requests | Owners cannot delete, suppress, alter, overwrite, rate, or erase member experiences |
| Owner response display | Moderated response appears beside the original pseudonymous experience after a reviewer publishes it | Response never replaces the original content or moderation decision |
| Web member journey | Directory search, public factual profile, structured experience submission, factual-correction resubmission, status recovery, appeal, owner participation | Routes are feature-flagged and authenticated |
| Native member journey | Native intake, profile, experience form, status/appeal recovery, owner claim/action controls, and owner response display | No EAS build or app-store action performed |
| Reviewer workspace | Unified queue for organization submissions, experiences, experience appeals, owner claims, and owner requests | Named administrator check, mandatory reason, optional validated public HTTPS evidence-receipt URLs, audit events |
| Kinfolk boundary | Existing Organization Transparency turn policy remains in the Kinfolk orchestration path | No unsupported organization, treatment, safety, ownership, or quality claim is generated from this workflow |

## Additive data model (approval required)

`artifacts/api-server/migrations/20261015_organization_transparency.approval-required.sql` creates only new `organization_*` tables and indexes:

- `organization_profiles`
- `organization_profile_identity_claims`
- `organization_locations`
- `organization_experiences`
- `organization_experience_appeals`
- `organization_owner_claims`
- `organization_owner_actions`
- `organization_owner_responses`
- `organization_clinical_information_sources`
- `organization_transparency_audit_events`

The migration has an explicit **APPROVAL REQUIRED — SOURCE ONLY** header. It is not run at application startup and must not be executed until a separately approved migration plan, backup/rollback plan, reviewer process, and release gate exist.

## Explicit non-goals

This P0 does **not**:

- create a second consumer directory or backfill the existing directory;
- publish an organization by default;
- set map pin, Kinfolk eligibility, promotion, or recommendation eligibility by default;
- let a member self-assert `verified_minority_owned`;
- create a universal trust, quality, safety, treatment, or employer score;
- synthesize healthcare quality claims from patient/caregiver or staff experiences;
- erase, alter, suppress, or replace a community experience following an owner request;
- collect clinical records, personnel records, passwords, government IDs, addresses, or other sensitive personal data;
- enable external verification, crawlers, enrichment, billing, deployment, migration, or provider activation.

## Validation completed

All validation below ran locally only, with no deployment, build, migration, or external service action:

```text
API focused regressions: 5 files / 24 tests passed
  - organization transparency policy
  - experience privacy screening
  - route boundaries and owner decision routes
  - P0 organization → moderation → experience path
  - Kinfolk organization-research turn policy

API typecheck: passed
Web typecheck: passed
Native Organization Transparency UI regressions: 7 passed
Native typecheck: passed
Native source configuration gate: passed on clean commit 3a30aaf655680a0df78aa1e62bb44e0f87e48d68
Git diff --check: passed
Working tree: clean
```

The native source gate explicitly confirms that no EAS build request, artifact upload, TestFlight action, Play action, or record update was performed.

## Required founder decisions before any activation

1. **Data governance and release approval:** Approve the additive migration, retention policy, moderator SOP, reviewer authorization model, member appeal SLA, evidence-receipt standard, and rollback plan.
2. **Privacy review:** Confirm approved public response rules, owner verification evidence requirements, reviewer-note visibility, content escalation process, and legal/privacy treatment for workplace and healthcare-context narratives.
3. **Surface policy:** Decide whether a factually approved P0 profile should be member-searchable initially. Map placement, Kinfolk use, promotion, recommendations, and other surfaces must remain separately governed.
4. **Staging-only execution:** Review SQL in a disposable/isolated staging plan first; use a backup, migration review, explicit data seed plan, and a rollback procedure. Do not run against production under this handoff.
5. **Environment gates:** Set the server and web feature flags only in the approved isolated environment after migration verification, then test with synthetic accounts. No flag should be enabled before the server model and reviewer process are operational.
6. **Native delivery:** If mobile routes are to be exercised outside source validation, separately approve a staging build and the corresponding Device Farm or internal-distribution test plan.

## Suggested reviewer acceptance checks after approved activation

1. Submit a synthetic organization; ensure it is not searchable before factual approval.
2. Approve factual identity only; confirm map pin, Kinfolk, and promotion remain ineligible.
3. Submit employee, customer, patient/caregiver, and private experiences; verify categories are context-bounded and no ratings exist.
4. Confirm direct contact/clinical/personnel identifier screening blocks unsafe narrative before persistence.
5. Publish one pseudonymous experience; verify its author identity is absent from public output.
6. Submit an owner claim without attestation (must fail), then with attestation (must enter verification).
7. Approve limited owner access; submit a public response and verify it appears beside—not instead of—the selected member experience only after moderation.
8. Verify rejected/held experience appeal and correction-recovery paths remain limited and audit-recorded.
9. Verify reviewer actions require a rationale and accept only public HTTPS evidence receipt URLs.
10. Verify no existing business, directory, Kinfolk, map, user, or production records changed.
