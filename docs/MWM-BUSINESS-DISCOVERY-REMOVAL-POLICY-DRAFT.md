# Mapping With Melanin Business Discovery and Removal Policy — Draft for Legal Review

**Status:** Draft for founder and legal review. This document is an operating proposal, not legal advice or a final set of terms.

## Purpose

Mapping With Melanin may list businesses that members add, owners claim, or administrators curate. A listing or a designation is not a guarantee of a business’s conduct. The platform should preserve useful community discovery while responding carefully when members report discrimination, safety concerns, misrepresentation, or other material harm.

The policy has two independent goals. First, it prevents the platform from promoting a business merely because it has a minority-ownership designation. Second, it provides a fair, documented, reversible way to limit or remove public discovery when the evidence supports that action.

## Discovery, promotion, and verification

A business may be eligible for ordinary Kinfolk, Directory, and Map promotion when it has a recorded minority-ownership designation. A designation may originate from a business owner, an administrator, or a community submission. The platform must never infer ownership from a name, cuisine, imagery, geography, or a member’s identity.

**Verification is not the default gate for promotion.** A member may choose a verified-only preference. When that preference is not selected, recorded ownership designations may support promotion, subject to the safety and conduct rules below. The application must identify verification separately from a designation and must not imply that an unverified designation is false.

A report does not automatically remove a designation, hide a business, or prove discriminatory conduct. Reports open a review process. The outcome may be no action, a request for clarification or verification, a temporary promotion restriction, a public-discovery removal, or restoration.

## Reporting and review workflow

Members may report a business or a community comment. The report form should offer clear reasons, including **possible ownership misrepresentation**, **discrimination or exclusionary treatment**, **safety concern**, **harassment or hate**, **fraud or impersonation**, and **other**. It should allow a concise description and optional supporting material where the law and product rules allow it.

Reports are visible only to authorized reviewers. The reporter’s identity and supporting material are not published to the business by default. A reviewer records the allegation category, relevant context, evidence received, the decision, the decision maker, and the date. The business is given a fair opportunity to provide a response when appropriate and safe to do so. The platform should avoid contacting a business when that contact could expose a reporter to retaliation or compromise an ongoing safety matter.

A report about a comment is a moderation matter. A report about a business may also affect discovery and promotion. These are separate decisions and should be recorded separately.

## Graduated actions

| Review outcome | Effect on public discovery and promotion | Record treatment |
|---|---|---|
| No action or insufficient evidence | Listing remains available. | Keep the report and decision in the restricted review record. |
| Verification requested | Listing may remain available. The platform may label verification as pending. | Keep the designation and review history. |
| Temporary promotion restriction | The listing is not promoted by Kinfolk, Directory, or Map recommendations while review continues. Deliberate-name access may remain if counsel approves. | Preserve the listing, reports, rationale, and review deadline. |
| Remove from public discovery | The listing leaves public search, map pins, and Kinfolk promotion immediately. | Do not delete the business row, historical reports, ownership claims, media, or audit history. |
| Restore public discovery | The reviewer restores the listing after a documented decision. | Preserve both removal and restoration reasons. |

## Administrator removal control

The administrator dashboard uses **Remove from public discovery**, not a destructive delete. Before removal, an administrator must provide a reason and confirm the action. The application archives the listing, suspends it, turns off promotion eligibility, clears featured placement, and records the prior state in an internal audit event.

Restoration also requires an administrator reason. The control restores the recorded prior state where possible. The audit history must remain restricted to authorized administrators and must not appear on public business pages.

## Fairness and safety safeguards

The platform should apply the same evidence and review standards regardless of a business’s ownership designation, size, relationship to the platform, or revenue value. Reports should not be used to retaliate against a business, a community member, or a competitor. A reviewer should recuse themself when they have a direct personal, financial, or organizational conflict.

The platform should maintain an appeal or reconsideration path before the final public terms are published. Counsel should determine the required notice, record-retention period, local consumer-protection obligations, defamation and anti-discrimination considerations, emergency escalation rules, and the exact conditions under which a report may be shared with a business or government authority.

## Implementation requirements

The production system must keep these distinctions enforceable in code. A recorded ownership designation supports ordinary promotion unless a member selects verified-only discovery. A verification badge reflects evidence status rather than community popularity. A report is a review input, not an automatic verdict. An administrator removal must be reversible, reasoned, access-controlled, and auditable.

The public interface should avoid publishing allegations as fact. It should show only an authorized, carefully reviewed safety or availability status when counsel approves that disclosure. It must not expose reporter identities, internal notes, moderation evidence, or dispute history.

## Legal review questions

Counsel should approve the final definitions for discrimination, safety concerns, evidence sufficiency, urgent action, business notice, appeal rights, restoration, retention, privacy, and any user-facing disclosures. Counsel should also review the report taxonomy and the language for community submissions, owner claims, verified-only filtering, and any public safety status before launch.

## References

[1]: https://www.ftc.gov/business-guidance/resources/advertising-marketing-internet-rules-road "Federal Trade Commission: Advertising and Marketing on the Internet — Rules of the Road"
