# Kinfolk Entertainment Controlled Integration Approval Packet — 2026-10-17

This packet records the bounded approval decision. The controlling status records remain the [cumulative integration inventory](../../replit/combined-release/KINFOLK_CUMULATIVE_INTEGRATION_INVENTORY_2026-10-16.md) and [acceptance matrix](../../replit/combined-release/ACCEPTANCE_MATRIX.md); this document does not replace either one.

## Actual current state

- **Authoritative candidate at reconciliation:** `origin/candidate/kinfolk-current-website-social-verification-20261015` at `cc39bd4aa84da5b0b90320d514edc3ae0b008f2e`. The active integration owner, task `yINBiovLIPiFnyQCFfSycn`, is still completing independently owned safety and sharing repairs. No later stable owner-candidate commit was identified at this checkpoint.
- **Prepared source-integration branch:** `integration/kinfolk-entertainment-current-authority-20261017`, based on `cc39bd4a`. It selectively carries the ten Entertainment commits from the preserved source history through cited-availability implementation `57f8da7093dd4ee347f897b5c2688f7b9368dfff`; the documentation source head remains `fbd792088906e3816a443be4066745413e0f7704`.
- **Deliberately excluded:** Regional Dialect commits `6c73614a`, `d9af3463`, and `7f2cc447`; they are preserved on their own source branch and have not been silently pulled into this candidate.
- **Status:** **SOURCE COMPLETE** and **INTEGRATION PREPARED**. The moving owner candidate has **not** adopted this branch, so it is not **INTEGRATED**, staging-verified, Web-verified, iOS-verified, Android-verified, or founder-accepted.

## Bound changes

Entertainment preserves consent-controlled streaming preferences, selected country/service controls, the no-extra-cost rule, current-session-only unambiguous title follow-up, visible citations, and a provider abstraction. A direct streaming or cinema statement is permitted only when a cited supported official source verifies exact title, relevant country, current wording, and—only for exact showtimes—city, ISO date, and local time. Stale, generic, uncited, ambiguous, contradictory, non-official, or geography-mismatched evidence fails closed to a limitation and legitimate source links. No ticket link is created or inferred.

The prepared branch now also contains `69980538cd49f8dfb44ec8e36516dab44ba7c4d7`, a narrow first-use continuity hardening. It rejects a decision-less continuity update for an undecided/legacy member and displays the required accept/decline disclosure in the standalone Web Memory Manager. Existing native chat, memory, and Settings routes already render the disclosure; the native Settings control now routes every undecided change through it. This preserves the earlier schema-lag persistence repair in `cc39bd4a` and does not alter unrelated safety preferences.

## Focused source evidence

All checks below ran on the prepared branch after the consent hardening:

| Check | Result |
|---|---|
| `git diff --check` | Pass |
| DB, API, and Web TypeScript | Pass |
| Native TypeScript | Pass with the established `--ignoreDeprecations 6.0` compatibility flag |
| API focused suite | 39 passed across 9 files; 5 database-backed persistence tests skipped because no authorized `KINFOLK_CONTINUITY_TEST_DATABASE_URL` was supplied |
| Web focused suite | 26 passed across 4 files |
| Native focused suite | 13 passed across 4 files |

The skipped database-backed tests are not a failure. They also are not authenticated application proof: no database migration, staging database write, production write, deployment, mobile build, provider activation, or live Entertainment lookup occurred.

## Controlled real-world acceptance to authorize later

The existing matrix owns **KIN-ENT-01 through KIN-ENT-08**. In one authenticated controlled application/staging session using the existing cited-web configuration, validate:

1. **Jessica Jones / United States** direct answer only with complete cited official evidence.
2. **Luke Cage / Disney+** rejects generic Disney+ text and answers only with exact current U.S. support.
3. **The Woman King** follows the same title/country/currentness rule.
4. **Disney+ no-extra-cost** allows only explicit included-with-subscription evidence, never an inferred entitlement.
5. **Single-title follow-up** resolves “Where can I watch it?” only from one unambiguous current private session.
6. **Ambiguous follow-up** asks for clarification without lookup or title assumption.
7. **Reliability failures**—stale, geographic mismatch, same-provider conflict, unavailable search, and no trustworthy evidence—fail closed.
8. **Named-city showtimes** state only exact cited official cinema details; no invented theater, date, time, availability, or ticket URL.

These scenarios require actual returned citations and application behavior. Injected fixtures and offline unit tests do not establish current availability.

**KIN-13** is the separate continuity acceptance boundary: test a new account and an undecided legacy account; accepted and declined accounts after relaunch; and a choice made on Web read back on iOS/Android and vice versa. Each undecided account must receive the disclosure, accepted continuity remains enabled, declined continuity remains off, and neither choice may change unrelated safety settings. A fresh-account production acceptance remains pending and is not authorized or claimed here.

## Precise approvals needed

1. **Source-only integration approval:** once the active owner reports a stable current authoritative SHA, authorize a controlled rebase/cherry-pick of this prepared branch onto that SHA, with conflict review and the same focused regressions. This is not a final release merge, deployment, migration, mobile build, or provider activation.
2. **Controlled staging approval:** separately authorize the required non-production schema readiness/migration and authenticated real-world KIN-ENT-01–08 plus KIN-13 save/readback. Existing cited-web configuration may be used within its existing limits; no paid provider, trial, account, subscription, or charge is requested.
3. **Fresh-account production acceptance approval:** separately authorize observation-only verification on the already available Web, iOS, and Android surfaces after staging passes. No production data modification or new mobile build is included.

Until those approvals, the safe next action is for task `yINBiovLIPiFnyQCFfSycn` to preserve this branch while it completes its owned safety repairs, then reconcile against its newly stable candidate rather than overwriting it.
