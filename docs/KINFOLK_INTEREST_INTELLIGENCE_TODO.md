# Kinfolk Interest Intelligence — Isolated Implementation Checklist

**Worktree:** `feature/kinfolk-interest-intelligence-20261015`

**Integration boundary:** Do not merge, deploy, migrate the shared staging database, or run a TestFlight build until the separate repair workstream is complete and both branches are deliberately merged.

## Delivery scope

- [x] Isolate implementation in a dedicated worktree and branch.
- [x] Map existing Kinfolk, discovery, Circle, preference, and audience-policy boundaries.
- [x] Add the governed interest, recommendation ledger, feedback, and explicit Circle-share schema/migration.
- [x] Add consent-gated API endpoints for setting controls, explicit interest lifecycle, feedback, and Circle shares.
- [x] Add a deterministic, evidence-bound recommendation builder using governed public listings and upcoming active events.
- [x] Wire only the safe non-sensitive repeated-topic signal path; retain no message/query text and exclude third-party, family, health, and sensitive contexts.
- [x] Repair the existing `For You` endpoint/card to use the governed response and meaningful actions.
- [x] Add member controls on native and web, including review, pause, confirm, remove, and delete.
- [x] Add focused API, web, and native contract/unit coverage for the required safeguards.
- [x] Run focused tests and typechecks; document any pre-existing failures separately.
- [ ] Commit the feature branch and prepare a merge/runbook for the combined repair + feature build.

## Non-negotiable safety and release rules

1. **No silent permanent profile.** Conversation/discovery signals remain tentative or temporary until the member confirms them.
2. **No sensitive inference.** Health, disability, relationship, caregiving, family, protected characteristics, exact location, finance, and “for someone else” contexts are excluded.
3. **No raw conversation/search retention.** The feature keeps only a controlled category label, source, count, and expiry.
4. **No external recommendation source.** Recommendations use only already-governed MWM listings and active upcoming MWM events; no scraping, external browsing, provider call, or auto-booking.
5. **No automatic Circle sharing.** Circle use requires a member-selected, confirmed interest item and an explicit Circle share action.
6. **No production mutation during feature work.** The startup migration is source-only until the merged build is deployed to the isolated staging environment.
