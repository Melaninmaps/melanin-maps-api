# DIR-003 — Business Benefit and Verification Boundary Matrix

**Status:** `BLOCKED`
**Requirement:** `DIR-003` — Directory/business/verification
**Decision owners recorded by the live requirement:** Founder; business-owner product owner
**Prepared:** 2026-10-20
**Scope:** Source-only decision preparation. This matrix creates no product behavior, business status, entitlement, verification result, public indicator, placement, account change, or release authorization.

## 1. Purpose and non-negotiable boundary

DIR-003 requires a future business matrix that separates registration/direct lookup, operational workflow and eligibility support, merit/evidence-based verification, public indicators, ranking/placement disclosure, and protected benefits. The live requirement states that verification and ownership indicators must be **evidence- and policy-based, not a purchasable trust badge**, and that protected benefits are separate from registration/direct lookup.

**No plan purchase, price, subscription, or membership tier can purchase, create, imply, accelerate, or restore trust or verification.** Payment or membership status must never substitute for verification evidence, a policy decision, reviewer judgment, a public indicator, or ranking treatment.

## 2. Authority and evidence considered

| Input | Status in this preparation | Permitted use in this matrix |
| --- | --- | --- |
| Authority base `48d794e0bde79aa97d23008b72518f74aa4809e4` | Identified in the supplied compact-base manifest | Provenance only; it is not treated as a behavioral, operational, or release verification. |
| Registry/checklist receipt `5ae2610fe7dd3bcbbe829c918fb8b645e40b847d` | Supplied with the assignment | Claim provenance only. |
| Base-transfer receipt `f3b5b01e2cf1ec5b42e22c525bd91abc86ae012f` | Supplied with the assignment | Transfer provenance only. |
| Live DIR-003 requirement record, last verified 2026-10-19 | Present in the compact base | Primary source for the stated requirement, `BLOCKED` status, recorded owners, and missing-decision boundary. |
| Current coordination checklist JSON and Markdown | Present as read-only compact-base inputs; manifest hashes verified | Context that the preparation remains source-only and evidence-layer separation remains required. This matrix does not adopt historical citations embedded in those inputs as inspected evidence. |
| `MWM_MASTER_MEMBERSHIP_PRICING_BENEFITS_ENTITLEMENT_AUDIT_2026-10-17.md` | **UNRESOLVED — unavailable in this workspace** | Not inspected; not evidence. |
| `MWM_COORDINATED_STAGING_RELEASE_MANIFEST_2026-10-17.md` | **UNRESOLVED — unavailable in this workspace** | Not inspected; not evidence. |

No source code, database, account, payment rail, browser/device, provider, deployment, member journey, or fulfillment record was inspected or exercised for this document.

## 3. Known facts and unresolved evidence

### Known from the live DIR-003 requirement record

- The required boundary is that verification and ownership indicators are merit/evidence and policy based rather than purchasable trust badges.
- Protected benefits must be separated from registration/direct lookup.
- The status is `BLOCKED` pending an approved verification/workflow definition and acceptance evidence.
- Founder approval is required for the business benefit/fulfillment definition.
- The live record identifies no authorized staging deployment/member journey, authenticated browser acceptance, iOS physical-device receipt, or Android physical-device receipt.

### Unresolved; do not infer or represent as decided

- The historical membership audit and staging-manifest packets named above are unavailable and were not inspected.
- No approved verification rubric, evidence threshold, reviewer authority, expiration/reverification rule, adverse decision path, correction/appeal path, or revocation rule is supplied.
- No approved operational workflow, eligibility definition, protected-benefit inventory, fulfillment owner, service level, measurement method, or failure/remediation process is supplied.
- No approved member-facing indicator wording, ranking/placement effect, disclosure text, or public explanation is supplied.
- No approved plan, price, tier, catalog, payment, entitlement, promotion, or refund mapping is supplied. This document makes no inference about any of them.
- No source, runtime, accessibility, privacy, security, staging, Web, iOS, Android, member, founder, legal, fulfillment, or release acceptance has been established by this preparation.

## 4. Boundary matrix

| Separate concern | What the live requirement establishes | What remains missing or prohibited | Exact decision / fulfillment evidence still needed |
| --- | --- | --- | --- |
| **Registration and direct lookup** | This is separate from protected benefits and from merit verification. | This record does not establish a registration flow, lookup availability, eligibility, price, entitlement, or verification result. Registration or discoverability must not imply trust. | Define the permitted registration/direct-lookup scope, eligibility, visible labels, owner, privacy boundaries, and measurable completion criteria. |
| **Operational workflow and eligibility support** | Workflow/eligibility support must be evaluated separately from verification and benefits. | No workflow, eligibility rule, role, input/evidence source, reviewer, state transition, or service commitment is approved. A workflow state must not be displayed as verification. | Approve the workflow stages, allowed actors, evidence intake/validation, eligibility rule, audit/review ownership, exception handling, and operational acceptance cases. |
| **Merit/evidence-based verification** | Verification and ownership indicators must be based on evidence and policy—not money, plan status, or membership tier. | No criterion, documentary/evidence standard, reviewer authority, confidence rule, validity period, recheck, correction, appeal, suspension, or revocation process is approved. | Approve a versioned verification policy: qualifying evidence, validation method, authorized decision-maker, decision record, expiry/reverification, correction/appeal, and revocation conditions. |
| **Public indicator wording** | Any future indicator must preserve the non-purchasable, evidence/policy boundary. | No exact public phrase, icon, badge, tooltip, disclosure, scope statement, date/freshness label, or accessibility treatment is approved. Do not use “verified,” “trusted,” ownership language, or an equivalent implication without the approved policy and supporting evidence. | Approve exact member-visible wording and accessible disclosure, including what the indicator does and does not mean, the evidence/policy basis, scope, validity/freshness, and correction path. |
| **Ranking and placement disclosure** | Ranking/placement must be disclosed separately from verification and protected benefits. | No ranking signal, paid-placement treatment, promotion effect, disclosure, ordering policy, or audience/locale rule is approved. Verification must not be silently converted into placement; payment must not purchase trust. | Decide whether verification or any protected benefit has any placement effect. If yes, approve the specific effect, audience scope, disclosure placement/text, auditability, and member/business recourse. If no, record that no effect explicitly. |
| **Protected benefits** | Protected benefits are a distinct category, not a consequence of registration/direct lookup or verification. | No benefit is defined, promised, granted, priced, or fulfilled by this matrix. No plan/tier may purchase trust or verification through a benefit label. | Approve each benefit separately: purpose, eligible population, non-verification basis, owner, delivery mechanism, capacity/limits, fulfillment evidence, support/remediation, measurement, and public disclosure. |
| **Founder decision and fulfillment evidence** | The live record requires founder approval for business benefit/fulfillment definition and remains blocked. | There is no approved bundle tying policy, product, operations, disclosure, and acceptance evidence together. | Record the decisions in Section 5; then assign a separately scoped implementation/acceptance owner and preserve evidence by boundary rather than treating this matrix as approval. |

## 5. Exact founder decision request

The recorded decision owners should approve or reject each item below in one written, versioned decision record. Silence, a payment choice, a registration event, a tier assignment, or an implementation proposal is **not** approval.

1. **Registration/direct lookup boundary:** Specify which neutral registration and direct-lookup actions, if any, are available; who may use them; what they may and may not imply; and the exact public language.
2. **Operational workflow/eligibility boundary:** Define the workflow purpose, actors, eligibility criteria, review checkpoints, evidence handling, audit trail, exceptions, and owner responsible for fulfillment.
3. **Verification policy:** Approve the evidence standard, evaluator authority, decision record, validity period, renewal/recheck, suspension/revocation, correction, and appeal process. Confirm explicitly that no payment, plan, price, or tier influences a verification decision.
4. **Public indicator boundary:** Approve exact indicator wording, icon/label, accessible disclosure, scope, freshness/validity statement, and what a member must not infer from it.
5. **Ranking/placement boundary:** State explicitly whether verification or a protected benefit changes any ranking, ordering, promotion, or placement. If it does, approve the exact disclosed rule, audience/locality scope, audit record, and redress process; otherwise record “no ranking or placement effect.”
6. **Protected benefits and fulfillment:** Enumerate every protected benefit individually and approve its eligibility basis, owner, fulfillment mechanism, capacity/limits, success measure, support/remediation, and member/business disclosure. Confirm that a benefit is not a path to a trust or verification outcome.
7. **Acceptance authorization:** Name the evidence required before any implementation or public use, including policy-review evidence, source contracts, privacy/authorization review, operational fulfillment evidence, and separately authorized staging/device/member testing where applicable.

## 6. Hard no-action boundary pending decisions

Until the decisions and evidence in Section 5 exist, do not:

- issue, remove, display, market, imply, or cache a verification/ownership/trust indicator;
- grant, promise, price, sell, activate, or fulfill a protected benefit;
- alter registration, direct lookup, eligibility, ranking, placement, promotion, search ordering, or public disclosures on the basis of payment, plan, price, tier, or unapproved verification data;
- represent a business as verified, trusted, endorsed, prioritized, eligible, or benefit-entitled;
- use this matrix as authorization for account/data changes, payment activity, provider use, source changes, deployment, feature activation, member communications, or release action; or
- claim that any historical audit, staging manifest, account, record, source path, test, runtime result, legal review, or member acceptance was inspected or passed.

## 7. Future acceptance evidence by boundary

| Evidence layer | Required future evidence | Not established here |
| --- | --- | --- |
| Founder policy | A written, versioned approval resolving all seven decisions in Section 5, including explicit non-purchasable trust/verification language. | Any founder decision or founder acceptance. |
| Product and source | A separately claimed design/source change with tests proving registration, workflow, verification, disclosure, placement, and benefits remain distinct. Tests must prove payment/price/tier cannot grant or imply verification/trust. | Source behavior, source tests, code review, or integration. |
| Privacy, authorization, and accessibility | Boundary-specific review for evidence minimization, role isolation, correction/revocation, public wording, and accessible disclosures. | Privacy/security/accessibility acceptance. |
| Operations and fulfillment | Named owner, documented evidence intake/review, fulfillment record, limits/capacity, support/remediation, and measurable completion criteria for each approved benefit. | Operational readiness or benefit fulfillment. |
| Runtime and member experience | Separately authorized staging and controlled member journeys that verify only the approved policy/implementation, public wording, ranking disclosure, correction/revocation, and benefits. | Database, staging, Web, iOS, Android, browser/device, notification, payment, or member evidence. |
| Release | Central evidence reconciliation plus explicit release authorization after all applicable layers pass. | Release readiness, release approval, or production visibility. |

## 8. Completion and release status

This is a one-file, source-only DIR-003 decision-preparation matrix. It records a `BLOCKED` requirement and a hard boundary against purchasable trust or verification; it does **not** resolve the founder/business-owner decisions, define or fulfill benefits, authorize implementation, or establish any product outcome.

**No member completion, founder completion, release readiness, release approval, or production/member-visible verification is claimed.**
