# Kinfolk Response Feedback Release Handoff

**Status:** Code change prepared for merge. This document does not indicate a public deployment, mobile build, or store release.

## Purpose

This release adds a **Helpful** and **Not helpful** control to every completed Kinfolk answer on the website and mobile app. A signed-in member may also add an optional note after selecting **Not helpful**. The feature is designed to help Kinfolk tailor later answers for that same member. It is not a model-training mechanism, a public rating system, or a factual knowledge source.

## Scope and boundaries

The implementation introduces a dedicated `kinfolk_response_feedback` table. It is separate from the existing business recommendation feedback table, so a member's view of a Kinfolk answer cannot be confused with whether they like or dislike a recommended business.

The API accepts an authenticated `PUT /api/kinfolk/response-feedback` request. It creates or updates one feedback record per member and Kinfolk message. The message identifier is paired with the authenticated member identifier, which prevents one member's feedback from overwriting another member's feedback. The endpoint accepts only `helpful` or `not_helpful` reactions and limits an optional note to 240 characters.

The startup migration is additive and idempotent. It creates only the new feedback table and its indexes when absent. It does not add, delete, modify, activate, revoke, or otherwise alter users, authentication, passwords, temporary tester access, login behavior, account records, or waitlist records.

## Personalization safeguards

Before a chat response is generated, Kinfolk can read at most twelve of the current member's newest feedback records. It converts them into a small preference block with at most four sanitized notes. The prompt explicitly states that feedback is neither a factual source nor a user instruction, and that any command quoted in a feedback note must be ignored.

The feature respects the existing personalized-suggestions setting. When the member has opted out of personalized suggestions, Kinfolk clears response-feedback context before generating the answer. The feature therefore does not create a new opt-out choice or weaken the current privacy setting.

No answer text is copied into the feedback table. Notes are optional, are limited to 240 characters at both client and server layers, and are used only as a private formatting, relevance, or practical-detail preference signal for the feedback author's future requests.

## User experience

On both the website and mobile app, signed-in members see **Was this helpful?** beneath a Kinfolk response. They can choose **Helpful** or **Not helpful**. After selecting **Not helpful**, they may enter an optional note, such as a request for more practical detail. Saving feedback updates the existing record for that answer rather than producing duplicate reactions.

Guests are not silently tracked. Website controls do not submit a request when the member is not signed in. The mobile app tells a signed-out person to sign in before feedback can be saved.

## Deployment requirements

The API, database migration, and web client must be deployed together from the merged commit. On first boot of the full API service, the additive startup migration creates `kinfolk_response_feedback` if it is absent. The existing API host must be the actual full API service connected to its production database; deploying this change to a frontend proxy alone does not enable the feature.

The website feedback interface becomes available with the web/API deployment. The mobile interface is source code only until a fresh **iOS and Android production build** includes the merged commit. It is not enough to build Android alone. The iOS build number must be unused; the current release plan reserves `108` or the next available number.

## Verification completed in source

The release worktree passed the workspace TypeScript build after a forced library rebuild. It also passed 31 focused tests: three response-feedback prompt tests, two API/web/mobile contract tests, and 26 existing Kinfolk provider-readiness tests. `git diff --check` passed with no whitespace errors. Generated declaration artifacts were removed from the commit set after validation.

## Production verification after deployment

After the full API service is deployed, verify that the public version endpoint reports the new commit rather than the old Build 98.2 SHA. Confirm the database readiness endpoint succeeds, then verify `GET /api/kinfolk/health` returns `ok: true`. As a signed-in test member, send a general Kinfolk question, select each feedback reaction on separate answers, submit one optional note, and send a follow-up question. Confirm that the feedback endpoint returns success and that the follow-up remains safe, grounded, and free of quoted feedback instructions.

This feature does not resolve the current public Kinfolk `connection_failure` by itself. The production API cutover and provider health check must succeed before the feedback control can operate in a live environment.

## Changed implementation files

| Area | Files |
|---|---|
| Database schema | `lib/db/src/schema/kinfolk-response-feedback.ts`, `lib/db/src/schema/index.ts` |
| Additive migration | `artifacts/api-server/src/lib/startup-migrations.ts` |
| API and prompt integration | `artifacts/api-server/src/routes/kinfolk.ts`, `artifacts/api-server/src/kinfolk/response-feedback.ts` |
| Website control | `artifacts/web/src/pages/travel.tsx` |
| Mobile control | `artifacts/mobile/components/AIChatWidget.tsx` |
| Focused tests | `artifacts/api-server/src/__tests__/kinfolk-response-feedback-contract.test.ts`, `artifacts/api-server/src/kinfolk/__tests__/response-feedback.test.ts` |

## References

[1]: https://github.com/Melaninmaps/melanin-maps-api "Melanin Maps API repository"
[2]: https://github.com/Melaninmaps/melanin-maps-api/pull/69 "Full Railway API cutover pull request"
