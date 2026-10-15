# Kinfolk Interest Intelligence — Completion-Stage Handoff

**Branch:** `feature/kinfolk-interest-intelligence-20261015`  
**Baseline:** `staging/kinfolk-full-candidate-20261014`  
**Status:** Feature implementation is ready for controlled merge with the separate repair work. This branch does **not** merge, deploy, submit, or activate a new paid provider.

## What this completion-stage commit adds

| Area | Delivered behavior |
|---|---|
| Source-backed opportunities | A member-controlled endpoint uses the existing citation-only Kinfolk web-research adapter only after the member enables it and requests a city/state check. A card is created only for an approved organizer/ticketing, `.gov`, or `.edu` source with an explicit future date. Every external card is labeled **source-confirmed, not MWM-verified** and links to the original source. No uncited fallback exists. |
| Cost and frequency protection | External research defaults to `manual`; optional `daily` and `weekly` limits are persisted per member and city/state. Each check is bounded to three confirmed, non-temporary interests and 15 citation rows. No scheduler, notification, background collector, or provider activation is introduced. |
| Hard requirements | Members can set quiet/low-sensory, wheelchair-accessible, and maximum documented price requirements in the web control center. Candidate businesses must have matching documented public fields; unknown data fails closed. Existing account-age policy remains in effect. The API supports service-animal, sensory, all-ages, and explicit excluded-category constraints as well. |
| Actionable feedback | `More like this` boosts the documented category; `Hide category` blocks that category; `Stop topic` blocks the matching topic from future recommendation matching; `Wrong assumption`, `Not interested`, and `Hide` dismiss that one shown recommendation. These scopes are stored separately from the member's broad profile. |
| Circle follow-through | A member can explicitly choose a Circle from a For You card. The approved card is written to the existing `circle_suggestions` table, so the established Circle voting and planning flow receives it. Automatic Circle sharing remains prohibited. |
| Transparency and privacy | The feature continues to store only reviewable broad, non-sensitive interest labels. It does not store raw chat/search text, private memory, inferred identity, family/caregiving, health, disability, third-party, exact-location, or relationship information. Source URL and freshness information are stored only for externally shown source-backed cards. |

## Required controlled merge order

1. Finish and publish the separate repair branch/task.
2. Create a fresh integration branch from the designated repair commit.
3. Merge this feature commit **after** the repair commit, resolve only real overlaps, then run the validation matrix below.
4. Let the API start once against staging so `ensureKinfolkInterestIntelligenceSchema()` applies the additive v1 and v2 tables/columns. Do not run ad-hoc destructive SQL.
5. Test with one non-production member. Enable external opportunity research only for that tester, then request a city/state check. Verify that a source-backed card links to its source and states that it is not MWM-verified.
6. Verify the Circle action creates one Circle suggestion and that existing voting/planning sees it.
7. Promote only after the integration branch validation is green and the deployed API smoke check succeeds.

The existing [`KINFOLK_INTEREST_INTELLIGENCE_MERGE_AND_RELEASE_RUNBOOK.md`](./KINFOLK_INTEREST_INTELLIGENCE_MERGE_AND_RELEASE_RUNBOOK.md) remains the command-level merge and release checklist. Update its feature commit variable to this commit after the commit is created.

## Validation performed in this worktree

```text
API TypeScript:       PASS
Web TypeScript:       PASS
Native TypeScript:    PASS
API focused tests:    PASS (11 tests / 3 files)
Web focused tests:    PASS (2 tests / 1 file)
Git whitespace check: pending final commit review
```

Focused API coverage includes:

- approved future-dated source acceptance;
- rejection of unapproved or date-free external citations;
- fail-closed documented constraints for price, crowd, access, age, and excluded category;
- the pre-existing opt-in/non-sensitive signal safeguards and request-schema contract.

## Operator expectations and truthful limits

- **No external card is an MWM catalog listing.** Source-confirmed means a citation passed this feature's source and future-date gates; it does not certify availability or MWM verification.
- **No alert is sent by this change.** `interestNotificationsEnabled` remains a stored setting only. A notification implementation would need its own user-visible delivery choice, provider authorization, and verification.
- **No background polling is enabled.** The user presses **Check now**; frequency settings cap repeated requests if selected.
- **Missing public evidence means no recommendation** when the member turns on a hard requirement. This is intentional safety behavior, not an error.
- **Do not treat a passing local test suite as deployment proof.** The staging smoke steps above are the release gate.
