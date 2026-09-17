# KinfolkAI core-chat production handoff

**Prepared by:** Manus AI  
**Repository:** `Melaninmaps/melanin-maps-api`  
**Release branch:** `fix/kinfolk-core-chat-readiness-20260917` until merged  
**Date:** 2026-09-17  
**Deployment owner:** Replit or the authorized hosting owner

## The required outcome

This release makes **KinfolkAI behave as a dependable general chatbot for signed-in members**, while retaining its governed local-business capability. A member can ask an ordinary, stable question such as “What is photosynthesis?” and receive a direct, concise answer. A member can still ask “Find a braider near me” or “I need a daycare in Houston with later hours”; those requests remain on the existing governed business-discovery path, which may only recommend published listings with real, reviewed data.

The change does **not** make Kinfolk public or bypass authentication. It deliberately preserves the existing sign-in requirement, sessions, password reset, Apple/OIDC sign-in, claims, users, subscriptions, and waitlist behavior. It does not add, update, delete, seed, bulk-create, bulk-delete, or synchronize a single user or waitlist row.

> The website and native apps can be built only after the deployed API returns HTTP 200 with `{"ok":true}` from `/api/kinfolk/health`. At the time this handoff was prepared, both public hostnames returned HTTP 503 with `{"ok":false,"reason":"connection_failure"}`. A generic `/api/healthz` success is not a Kinfolk success.

## Exact source changes in this handoff

The implementation is intentionally small and isolated to the Kinfolk backend.

| File | Change | What it does **not** change |
|---|---|---|
| `artifacts/api-server/src/kinfolk/lean-general-chat.ts` | Adds a strict eligibility function and a compact, JSON-only general-chat prompt. | Authentication, database schema, directory rows, users, waitlist, client API contract. |
| `artifacts/api-server/src/routes/kinfolk.ts` | Routes only ordinary stable questions to the compact prompt and short bounded history. Retains the full governed path for local search, current information, safety, health, legal, financial, image, Library, entity, Circle, VIBES, and travel questions. Changes public health to probe core text chat only. | Existing member wall, business retrieval, recommendations, password/session routes, waitlist routes. |
| `artifacts/api-server/src/kinfolk/provider-readiness.ts` | Adds a core fallback-chat probe for the public health gate. The existing full diagnostic still tests web research, TTS, transcription, embeddings, and optional Tavily separately. | Provider credentials, provider URL, models, audio behavior, telemetry privacy. |
| `artifacts/api-server/src/routes/index.ts` | Clarifies the public health boundary’s core-chat semantics. | Routing order: `/api/kinfolk/chat` remains after `requireAuth`. |

### Core prompt contract

The new ordinary-question path accepts only `general_knowledge` turns that have **no** location, VIBES, images, current-information requirement, named entity resolution, Library grounding, Circle context, travel plan, or business request. It requires a valid JSON response with this stable shape:

```json
{
  "reply": "A complete, helpful answer in plain text.",
  "recommendations": null,
  "followUpSuggestions": [],
  "smartPromotion": null,
  "taskAction": null
}
```

This keeps basic chat fast and readable. It also prevents an ordinary answer from inventing a listing, pin, address, source, promotion, or user characteristic. The complete governed path remains active for questions that need local evidence, current information, safety handling, personal context, or structured business recommendations.

## Replit’s exact production configuration task

Replit must set the following values **in the production API service’s secret/environment settings only**. Do not commit values to Git, insert them into `app.json`, `eas.json`, mobile JavaScript, build logs, screenshots, or a public `.env` file.

| Variable | Required value or rule |
|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | A valid server-only credential for the selected OpenAI-compatible provider. |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | The selected provider’s HTTPS OpenAI-compatible API base, including the API version path when its provider requires one. It must be reachable from the deployed API service. |
| `KINFOLK_FALLBACK_MODEL` | An exact text-chat model identifier that this credential and base URL support. Use the same model for basic member chat and the public core health probe. |
| `KINFOLK_STAFF_DEMO_MODEL` | The same known-working model identifier during this release, unless Replit verifies a different configured model with the same provider. |

The present source allowlists `gpt-5`, `gpt-5-mini`, `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, and `gpt-4o-mini` for chat. If the selected provider supports `gpt-5-mini`, use it for both model variables. It is the currently tested fast general-chat choice. If it does not, Replit must use an identifier returned by that provider’s own authenticated model catalog; guessing a model name is not acceptable.

After entering the secrets, Replit must redeploy the API and call:

```bash
curl -i https://api.melaninmaps.com/api/kinfolk/health
curl -i https://www.mappingwithmelanin.com/api/kinfolk/health
```

The required result on both hosts is HTTP `200` and exactly:

```json
{"ok":true}
```

If either host returns `missing_configuration`, add the missing server-only variable. If either returns `connection_failure`, do **not** build a public demo binary yet. Replit must check the provider credential, API base URL, egress/network access, model availability, and its support for non-streaming JSON-object Chat Completions. The existing protected development-only diagnostic may be used with an authorized existing administrator in non-production to identify optional web/audio capability gaps; it must not disclose or change secrets.

## Required deployment sequence

### 1. Freeze the source and preserve protected data

Replit must deploy the merged `main` commit containing this handoff change. It must record the exact API commit SHA and web commit SHA in its deployment record. Before deploying the broader release, take a production database backup and confirm a restore procedure.

Replit must not run a seed, cleanup, tester bootstrap, user migration, waitlist migration, user deletion, city-access action, bulk-access action, or directory-publishing script. It must not edit the existing `waitlist_signups` rows. The website administrator dashboard may display the existing combined web and mobile submissions from that table, but that display is read-only for this release.

### 2. Deploy API first

Build the API from the repository workspace:

```bash
pnpm --filter @workspace/api-server build
```

Deploy that generated API artifact through Replit’s normal production service configuration. The source’s `railway.toml` continues to use `/api/healthz` as its process liveness check; Replit must independently use `/api/kinfolk/health` as the release readiness gate.

Run the two public core-health calls shown above. Do not proceed until both succeed. Then, using an **existing approved test account**, perform this authenticated test against the deployed API or web interface:

```text
What is photosynthesis? Answer in two short sentences.
```

The result must be a direct answer. It must not demand a city, produce a business card, or attach an invented source. Repeat with a continuity turn such as “Can you make that simpler?”; the answer should retain the recent context.

### 3. Validate governed local discovery separately

Using only existing published test data, test these distinct requests:

```text
Find [known existing business name] in [its confirmed city].
Find a braider in [city with a known published braider].
I need a daycare in [city with a known published daycare].
```

The result must use published governed records only. It may ask one necessary location or preference follow-up. A result card/pin must open the existing listing page. An unreviewed candidate may not appear, receive a pin, or be represented as verified.

### 4. Build and deploy the website

After API readiness and the two smoke tests pass, create the website build:

```bash
pnpm --filter @workspace/web build
```

Deploy the web artifact against the same production API origin. As an administrator, inspect the dashboard’s existing waitlist display only. Do not click any mutation control for users, access, waitlist, or directory publication during the release validation.

### 5. Build iOS and Android release candidates

From `artifacts/mobile`, use the existing production profile after checking that it resolves `EXPO_PUBLIC_API_ORIGIN=https://api.melaninmaps.com`:

```bash
pnpm prebuild:ios
pnpm prebuild:android
pnpm exec eas build --platform ios --profile production
pnpm exec eas build --platform android --profile production
```

Install the new builds on representative devices. Validate normal sign-in, ordinary Kinfolk chat, a known listing search, map pin deep-link, keyboard-safe chat input, forgotten-password flow, Check-In recipient selection, web-only administrator restriction, Android 15 edge-to-edge behavior, and Android 16 tablet/foldable layout. Apple and Google must distribute approved new binaries before users with old store builds receive the native changes.

## Required no-change boundaries

Replit must verify these boundaries in review and after deployment:

| Boundary | Required result |
|---|---|
| Authentication and sessions | Existing email/password, Apple/OIDC, session renewal, and ordinary sign-out behavior work exactly as before. `/api/kinfolk/chat` remains signed-in only. |
| Password reset | Existing users can still use forgotten-password and reset-password flows. No temporary password is exposed in logs or UI. |
| Users | No account is added, changed, deleted, deactivated, merged, or seeded by deployment. |
| Waitlist | Website and mobile continue to use the one existing `waitlist_signups` source. No existing row is added, changed, moved, duplicated, or deleted. |
| Claims and subscriptions | Existing business claims, subscriptions, and member entitlements retain their existing schema and behavior. |
| Directory data | No review-only candidate enters the public database. Existing listings are never removed by this deployment. |

## Directory inventory is not a build blocker, but it is not live

The committed review evidence contains **705 raw candidates**. Of these, **217** passed a strict initial gate into a review-only manifest: 92 commercial business candidates, 98 regulated-service candidates, 22 community resources, and five cultural places. The remaining 488 candidates are held. The work has made **zero** production database writes. It does not represent 37,000, 12,500, 10,000, or 217 newly published listings.

Replit does not need to wait for that review work to build and validate the application. However, it must not claim that the review-only data is searchable in Kinfolk, the web directory, mobile search, or map pins. Publication requires local staging, a named reviewer, checksum and link-health validation, live duplicate/address reconciliation, geocoding confidence, and regulated-service evidence where applicable. This preserves real map pins and prevents a demo from inventing businesses, services, hours, social links, or addresses.

## Completion evidence Replit must return

The release is complete only when Replit returns a short record containing the production API SHA, production website SHA, iOS build number, Android versionCode, both successful Kinfolk health responses, the ordinary-chat transcript result, the governed business recommendation result, and the device test result. It must record any failed acceptance item rather than presenting it as released.

## References

[1]: https://api.melaninmaps.com/api/healthz "Mapping With Melanin API liveness endpoint"
[2]: https://api.melaninmaps.com/api/kinfolk/health "Mapping With Melanin Kinfolk core chat readiness endpoint"
[3]: https://github.com/Melaninmaps/melanin-maps-api "Melaninmaps API and application release repository"
