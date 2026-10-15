# Organization Transparency — Cumulative Completion Checklist

**Scope:** Keep implementation and release status explicit across P0 and later approved work.
**Status convention:** `Complete` means delivered and independently validated at the stated scope. `Not complete` means it must not be represented as available, active, or release-approved.

## P0: Separate Organization Transparency foundation

| Requirement | Status | Boundary / evidence |
|---|---|---|
| Additive organization profile and location model | **Source implementation complete; activation not approved** | Approval-required migration only; no execution, data seed, or backfill |
| Separate factual, search, map, Kinfolk, promotion, and experience gates | **Source implementation complete; activation not approved** | Every surface starts separately ineligible or review-required |
| Structured employee/customer/patient/caregiver experiences | **Source implementation complete; activation not approved** | No star rating, universal score, ranking, treatment claim, or medical-quality score |
| Moderation, private/pseudonymous choices, appeals, owner claims/actions, and audit receipts | **Source implementation complete; activation not approved** | Owner requests cannot delete, suppress, overwrite, or alter community experiences |
| Web/native member paths and named-admin reviewer queue | **Source implementation complete; activation not approved** | API and web feature flags default off; native path has no build or release approval |
| Kinfolk boundary for unsupported organization and healthcare claims | **Source implementation complete; activation not approved** | Policy prevents this P0 model from becoming unsupported Kinfolk assertions |

## Broader cumulative requirements — retain as open

| Requirement | Status | Definition of done before marking complete |
|---|---|---|
| **Kinfolk experience retrieval** | **Not complete** | Approved retrieval/orchestration that retrieves only moderation-approved, scope-appropriate Organization Transparency experience evidence; applies member-context authorization; represents source, location, privacy, and uncertainty correctly; avoids scores, sensitive data, and unsupported safety/treatment/quality claims; has dedicated regression and staging evidence. |
| **Employer comparisons** | **Not complete** | A separately approved comparison design with disclosed comparison criteria, evidence receipts, minimum-data and recency rules, uncertainty/coverage labeling, anti-defamation and privacy review, no composite or universal employer score, reviewer controls, Kinfolk boundary tests, and isolated-staging validation. P0 structured themes are not a comparison feature. |
| **Source-backed clinical research** | **Not complete** | A separately approved research workflow that uses authoritative clinical/facility sources, preserves source URL/publisher/date/observation receipts, distinguishes sourced facts from community experiences, requires healthcare/privacy/legal review, clearly labels uncertainty, and prevents patient/caregiver/staff narratives from becoming medical-quality, treatment, safety, or provider-performance claims. The P0 source table alone is not completed clinical research. |

## Required gates before any activation

1. Approve the migration, data-retention policy, moderator SOP, owner-verification criteria, appeals process, evidence-receipt standard, and rollback plan.
2. Execute and verify the migration only in an approved isolated staging plan with backups, synthetic test data, and an explicit rollback exercise.
3. Enable `ORGANIZATION_TRANSPARENCY_ENABLED=true` and `VITE_ORGANIZATION_TRANSPARENCY_ENABLED=true` only in that approved isolated environment after server, reviewer, and privacy checks pass.
4. Independently approve native build and real-device testing before creating a mobile artifact.
5. Keep map placement, Kinfolk retrieval, promotion, recommendations, comparisons, and clinical research behind their own later approvals.

## Prohibited completion claims

Do not claim that P0 delivers a replacement directory, active public release, automated external verification, Kinfolk experience retrieval, employer comparisons, clinical research, ratings, rankings, healthcare quality conclusions, map placement, recommendations, promotion, or owner control of member experiences.
