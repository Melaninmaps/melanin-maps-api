# KinfolkAI complete release handoff — website, iOS, Android, API, and directory review

**Prepared by:** Manus AI  
**Repository:** `Melaninmaps/melanin-maps-api`  
**Application release source:** `main` through `78193d60d77efe15aca30b671ab7c9309cff7193` (merged PR #51); later commits in this handoff-only series do not alter application behavior
**Handoff date:** 2026-09-17  
**Deployment owner:** Replit or the hosting owner with the production database, deployment, Expo Application Services (EAS), Apple, and Google Play credentials

## Release decision

The merged source contains the requested cross-platform product work listed below. **It is not yet a verified live release.** The current public API process is reachable, but KinfolkAI’s readiness endpoint returns `503 {"ok":false,"reason":"connection_failure"}` on both production hostnames. The hosting owner must correct the production provider configuration and deploy the pinned source before the website or a store build can truthfully be called demo-ready. [1] [2]

The protected operating rule for this deployment is strict: **do not add, delete, seed, bulk-create, bulk-delete, or modify users or waitlist rows.** Do not use the administrator grant, revocation, password, bulk-access, or city-access controls during this release. The only waitlist requirement in scope is read-only: the website administrator dashboard must show the existing website and mobile waitlist submissions from the single existing `waitlist_signups` data source.

> **Do not deploy to production while `/api/kinfolk/health` returns HTTP 503.** A successful generic health check does not prove that KinfolkAI can answer a live demo question.

## What is in merged source

The following changes are already merged into `main`. They are source-complete and passed the stated automated validation. They still require deployment and device validation.

| Area | Merged source behavior | Pull requests |
|---|---|---|
| Protected release boundaries | Startup no longer performs automatic tester/user grants. Tester access operations no longer write a waitlist record. Existing login, password reset, Apple/OIDC sign-in, sessions, and public waitlist intake are not replaced. | [#34](https://github.com/Melaninmaps/melanin-maps-api/pull/34) |
| Tester password safety | An administrator-issued temporary password is marked for one forced private password change. The completion transition is atomic. Standard password reset clears the flag and remains available. | [#32](https://github.com/Melaninmaps/melanin-maps-api/pull/32) [#33](https://github.com/Melaninmaps/melanin-maps-api/pull/33) |
| Nearby business discovery | API, website, and mobile use relevance-first, location-aware business discovery; Kinfolk recognizes braider and child-care intent; map pins route to the existing listing detail page. | [#30](https://github.com/Melaninmaps/melanin-maps-api/pull/30) |
| Optional personal context | Members can voluntarily save communities, cultures, and language context. KinfolkAI and the Library use it to rank results, not to automatically exclude essential businesses or resources. | [#31](https://github.com/Melaninmaps/melanin-maps-api/pull/31) |
| Support discovery controls | Search supports factual, voluntary, evidence-backed combinations of designations. Filters never infer an identity or hide a business by default. | [#30](https://github.com/Melaninmaps/melanin-maps-api/pull/30) |
| VIBES and search | A canonical VIBES taxonomy, workbook generator, aliases, business-search matching, Kinfolk request matching, and owner editing flow are in the merged source. Public `Community/founder-listed` wording is removed from the affected web/mobile discovery presentations. | [#37](https://github.com/Melaninmaps/melanin-maps-api/pull/37) |
| Kinfolk recommendation presentation | Mobile Kinfolk responses can show a listing recommendation card/sheet with the governed listing’s address and a tap-through to its listing. The chat input uses keyboard-avoiding behavior. | [#38](https://github.com/Melaninmaps/melanin-maps-api/pull/38) |
| Directory presentation | Web directory cards use a safe, approved listing cover when supplied. Mobile and web can rerun and remove individual or all recent business searches. Mobile category selection is a compact picker rather than a permanent horizontal strip. | [#44](https://github.com/Melaninmaps/melanin-maps-api/pull/44) [#45](https://github.com/Melaninmaps/melanin-maps-api/pull/45) |
| Resources | Financial-resource provider discovery stays inside the app and presents loading, empty, error, and unknown states rather than ejecting the member to an external empty search. | [#36](https://github.com/Melaninmaps/melanin-maps-api/pull/36) |
| Check-In safety alerts | A member may choose eligible in-app trusted profiles as Check-In alert recipients. The server checks relationship state, blocks, privacy, opt-out, and ownership before a recipient is saved or notified. | [#35](https://github.com/Melaninmaps/melanin-maps-api/pull/35) |
| Safety location and language | Precise location is requested only after a member deliberately starts a safety action. Safety labels are aligned, and Cultural Heritage is available from Discover rather than Safety. | [#40](https://github.com/Melaninmaps/melanin-maps-api/pull/40) |
| Community | The Community interface removes the Events and Circles tabs, gives post authors comment audience controls, and repairs authenticated vote, report, and block client calls. | [#39](https://github.com/Melaninmaps/melanin-maps-api/pull/39) [#43](https://github.com/Melaninmaps/melanin-maps-api/pull/43) |
| Profiles, DMs, and Circles | Private profile visibility, direct-message preferences, block enforcement, Circle membership checks, mobile profile-to-Circle entry, and mobile profile-to-message entry are merged. The website now has protected member-profile and message-center pages; Community authors link to those profiles. | [#41](https://github.com/Melaninmaps/melanin-maps-api/pull/41) [#42](https://github.com/Melaninmaps/melanin-maps-api/pull/42) [#46](https://github.com/Melaninmaps/melanin-maps-api/pull/46) [#49](https://github.com/Melaninmaps/melanin-maps-api/pull/49) |
| Web-only administration | The mobile administrator interface and shortcuts are disabled. The web dashboard remains the sole administration surface, including the read-only Access Ledger view. | [#47](https://github.com/Melaninmaps/melanin-maps-api/pull/47) |
| Review-only directory staging | A distinct global-manifest adapter requires the manifest checksum, review-row count, link-health file, named reviewer, loopback staging database, and local-staging environment flags. It can never publish a listing. International state/province values may be absent. Cultural places are visible to review but explicitly blocked from Business or Resource publication. | [#48](https://github.com/Melaninmaps/melanin-maps-api/pull/48) [#50](https://github.com/Melaninmaps/melanin-maps-api/pull/50) |
| iOS and Android release configuration | Android edge-to-edge/adaptive layout source is merged. An explicit EAS `production` profile now builds iOS store output and Android App Bundles against `https://api.melaninmaps.com`; existing staging profiles remain unchanged. | [#30](https://github.com/Melaninmaps/melanin-maps-api/pull/30) [#51](https://github.com/Melaninmaps/melanin-maps-api/pull/51) |

## Exact release limitations

This section is intentionally direct so that no demo is built around behavior that is only proposed, staged, or locally tested.

**No newly researched candidate is public yet.** The global evidence package contains 705 raw candidates. The strict gate accepted 217 review-only candidates and held 488. The accepted set contains 92 commercial business candidates, 98 regulated-service candidates, 22 community resources, and 5 cultural places. It does not contain 37,000, 12,500, 10,000, or 217 newly published businesses. It has made zero production database writes.

The destination evidence check reached 374 of 392 distinct website/social destinations. Fourteen required review, three timed out, and one had a network error. Those results are evidence for reviewers, not a claim that a business closed. The 18 affected destinations remain review-only. A record needs a human decision, live duplicate/address reconciliation, verified coordinates, and—when applicable—current licensing or resource evidence before it becomes searchable or gets a map pin.

**Business sharing as a structured direct-message attachment is not included.** Existing messages can be sent through the protected conversation API, but the source does not yet have a reviewed `businessId` message attachment, shared-business card, or business picker inside a conversation. Do not represent that specific feature as live.

**AI-generated short and long Library summaries are not fully surfaced as the requested website-and-native product flow.** There is server-side extractive Library writing support, but the completed cross-platform experience of a concise Kinfolk summary plus a longer Library summary should be treated as a follow-up release item until it is integrated, tested, and deployed.

The Community composer still supports intentional media and audience controls. It is simplified relative to the earlier interface, but it is not a claim that every social-feed ranking, profile-media section, mention workflow, or Circle itinerary/recommendation behavior has been individually device-validated. All features must be verified using the acceptance checklist below.

## Required production configuration

The hosting owner must configure the following **only in the production API service**. Do not put secret values in Git, EAS public environment variables, client source, screenshots, or this handoff.

| Variable | Required state | Purpose and validation |
|---|---|---|
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Present and non-empty | Production credential for the already configured OpenAI-compatible integration. |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Present, non-empty HTTPS base URL, reachable from the API process | Must point to the API-compatible provider that accepts the configured models and audio endpoints. |
| `DATABASE_URL` | Existing production PostgreSQL URL | Preserve the existing database and authentication/session tables. Back up before deploying. |
| `DIRECTORY_REVIEW_SIGNING_SECRET` | Existing protected value where directory review is used | Needed only for signed evidence/decision safeguards. It does not authorize bulk publication. |

Kinfolk’s readiness route performs real but small provider checks for chat, web research, Library research, speech-to-text, and text-to-speech. It reports only `ok`, `missing_configuration`, or `connection_failure`; it must never return a provider key or raw provider error. The current `connection_failure` means the host must verify the configured base URL, provider credential, outbound reachability, model compatibility, and required audio/web-research capabilities. The relevant source is `artifacts/api-server/src/kinfolk/provider-readiness.ts`.

## Required deployment order

### 1. Freeze and verify the release input

Replit must deploy the reviewed current `main`, which contains the application source through `78193d60d77efe15aca30b671ab7c9309cff7193` (PR #51) plus this documentation. It must record the exact deployed API and web commit SHA. It must not substitute a local workspace, an unreviewed open pull request, a generated prototype, or an older mobile branch.

Before any migration, take a production database backup and verify restoration procedures. The deployment must preserve all existing users, Replit/Auth-compatible tables, sessions, OAuth/Apple identities, password-reset records, `waitlist_signups`, claims, subscriptions, and existing business records. No user or waitlist backfill, cleanup, seed, deletion, or bulk mutation is authorized.

### 2. Deploy the API and run only additive schema checks

Deploy the API first. The release uses startup migrations for additive schema compatibility. Verify the API startup log and then run the repository verification command from the API package only if the hosting owner understands that it invokes the repository’s existing startup migration set:

```bash
pnpm --filter @workspace/api-server release-db:verify
```

This release does not authorize manually running seed scripts, user/tester bootstrap helpers, direct SQL against user or waitlist tables, or a global-directory publication script. The directory adapter is intentionally local-only and must fail under production settings.

After deployment, verify these public checks:

```bash
curl -fsS https://api.melaninmaps.com/api/healthz
curl -fsS https://api.melaninmaps.com/api/kinfolk/health
curl -fsS https://www.mappingwithmelanin.com/api/healthz
curl -fsS https://www.mappingwithmelanin.com/api/kinfolk/health
```

The required result is HTTP 200 and `{"ok":true}` for each Kinfolk health endpoint. Do not proceed to a production mobile build or a demo announcement until that result is present.

### 3. Deploy the website from the same source

Build and deploy the web workspace after the API readiness check passes:

```bash
pnpm --filter @workspace/web build
```

Verify that the deployed web build reaches the same API origin. As an administrator, open `/admin` and confirm that the Access Ledger reads the existing unified `waitlist_signups` records. Do **not** click grant access, revoke, delete, bulk action, city preview/apply, or any user-account mutation in this release.

### 4. Create the native release candidates

From `artifacts/mobile`, run the prebuild checks and create store builds with the new production profile:

```bash
pnpm prebuild:ios
pnpm prebuild:android
pnpm exec eas build --platform ios --profile production
pnpm exec eas build --platform android --profile production
```

The profile explicitly sets `EXPO_PUBLIC_API_ORIGIN=https://api.melaninmaps.com`, `EXPO_PUBLIC_DOMAIN=www.mappingwithmelanin.com`, and `APP_RELEASE_CHANNEL=production`. Replit must verify those resolved values in the build logs. It must not use the `preview` or `testflight-staging` profile for a production App Store/Google Play release.

Native source changes do not reach people who have an old installed store binary until Apple and Google accept and distribute a new binary. The web deployment can go live after its checks pass; the iOS and Android changes require their respective store/review process.

### 5. Stage, review, and publish directory records separately

The research package is not part of the live deployment. It must not be copied into a production database, even if the source files are available to Replit.

The only supported first step is a local review database whose name begins with `mwm_directory_staging`, hosted on loopback, with `DIRECTORY_IMPORT_LOCAL_STAGING=1`, `DEPLOYMENT_TIER=local_staging`, and a named reviewer. It requires the manifest, matching summary, and link-health report:

```bash
DIRECTORY_IMPORT_LOCAL_STAGING=1 \
DEPLOYMENT_TIER=local_staging \
DATABASE_URL='postgres://...@127.0.0.1:5432/mwm_directory_staging_release' \
pnpm --filter @workspace/scripts exec tsx src/stage-global-review-manifest.ts \
  --apply \
  --manifest /secure/review/global-review-only-candidates.jsonl \
  --review-summary /secure/review/global-review-summary.json \
  --link-health /secure/review/destination-health.json \
  --created-by 'named-reviewer-id'
```

That command stages a review queue only. It has no public business/resource/map insertion code. The existing founder review interface must make a per-record, source-backed decision. An existing business match is an enrichment/reconciliation review, not a duplicate. An address must be confirmed and geocoded with adequate confidence before a commercial listing gets a map pin. Regulated services need current credential evidence. Resources and cultural places must stay in their separate queues.

## Acceptance checklist

The release owner must record the date, tester, build identifier, API SHA, and result for every row. A failure is a release blocker, not a reason to substitute a fabricated answer or manual database edit.

| Surface | Controlled test | Required result |
|---|---|---|
| API readiness | Call `/api/healthz` and `/api/kinfolk/health` on both public hostnames. | Generic health is HTTP 200 and Kinfolk readiness is HTTP 200 with `{"ok":true}`. |
| Kinfolk recommendation | Use an existing approved staging account and a known published listing. Ask for the known listing by name and an applicable service near its confirmed city. | Kinfolk returns governed published business data only. Mobile shows a readable recommendation card/sheet; opening it navigates to the existing listing. |
| Empty/gap behavior | Ask for a service or location that has no published result. | Kinfolk says that it lacks a verified local result or asks one necessary follow-up. It does not invent a business, address, hours, identity designation, availability, or pin. |
| Web/mobile search | Search exact name, partial name, service term, typo, city, and a VIBES alias. | Results use relevance and the voluntarily supplied location context. Recent searches can be removed individually or all at once. |
| Map | Tap a known confirmed existing listing pin on iOS, Android, and web. | The existing listing page opens. A review candidate without approved coordinates has no public pin. |
| Support designations | Select multiple sourced designations, then clear them. | Each filtered result has every requested designation. Clearing restores broad discovery. No designation is inferred or used as a blanket exclusion. |
| Temporary password | In staging with an existing test account: sign in with a valid temporary credential, set a private password, sign in again, then use the ordinary forgotten-password flow. | The first sign-in requires a new private password. Standard reset still works and clears the temporary-password requirement. Apple/OIDC login is not wrongly redirected. |
| Waitlist display | Inspect the web admin dashboard without submitting or modifying a record. | Existing web and mobile submissions appear through one unified `waitlist_signups` data source. No rows are created, changed, or deleted. |
| Check-In | Use an existing staging member relationship and block/privacy scenarios. | Only eligible trusted profiles can be selected; blocked or ineligible profiles cannot receive an alert. No placeholder email is required. |
| Privacy and messages | View a public profile, private profile, blocked profile, DM-disabled profile, and an allowed DM. | Private activity stays hidden until permitted. The Message action obeys recipient preference and blocks. Only conversation participants can read/send. |
| Resources | Select Financial Literacy and a category with no listed provider. | Navigation remains in-app and clearly shows an empty, error, or retry state rather than ejecting the member. |
| Safety | Open Safety, submit a deliberately consented report in staging, and decline location permission once. | Precise location is requested only after a deliberate safety action. The app still provides a safe non-location path. |
| Android devices | Test Android 15 phone, Android 16 tablet/foldable or equivalent, keyboard-open Kinfolk chat, orientation/resizing, split screen, and safe areas. | No forced portrait/resizability failure, unreadable keyboard overlap, clipped input, or deprecated app-owned system-bar behavior. |
| iOS devices | Test iPhone and iPad/supported large screen, keyboard-open Kinfolk chat, listing pin navigation, Safety consent, and temporary password. | Controls remain visible and flows target the production API. |
| Website social | From Community, open a member profile and an allowed direct message. | Profile and message center load only for approved signed-in members; blocked/privacy/DM rules are enforced by the API. |

## Automated validation evidence

The latest production mobile-profile branch passed `pnpm run typecheck` across all workspaces. The production-profile contract test passed. The international/cultural directory boundary branch passed 76 directory-review/publication tests and the full workspace typecheck. The global-manifest adapter completed a dry run against the 217-record evidence package: 81 records were `pending_review`, 136 were `needs_research`, and the adapter reported zero publication writes. The website member-profile/message branch passed seven focused privacy and authorization tests plus the workspace typecheck.

These are necessary source checks. They do not replace a production database backup, provider readiness check, hosted web smoke test, actual iOS/Android binaries, store review, or device QA.

## Responsibilities and handoff outcome

Manus completed the source review, implemented and merged the listed changes, validated the local typechecks and focused contracts, and produced review-only directory evidence. Manus does not have production Railway/Replit deployment credentials, production database authorization, Apple App Store Connect authority, Google Play Console authority, or permission to set production secrets. GitHub merge is therefore **not** proof of a live deployment.

Replit/hosting owns the deployment, secret configuration, database backup/migration approval, web release, EAS build invocation, TestFlight/App Store/Play Console submission, and post-deployment evidence. Replit can create a **staging preview build now** using the staging profile and existing approved test accounts. Replit should **not** create or announce a production demo build until the Kinfolk health gate passes. Replit does not need to wait for a 37,000-listing upload to validate the application code, but it must not claim that the review-only inventory is searchable or available in Kinfolk until each record has passed the governed publication process.

## References

[1]: https://www.mappingwithmelanin.com/api/healthz "Mapping With Melanin public API health"
[2]: https://www.mappingwithmelanin.com/api/kinfolk/health "Mapping With Melanin KinfolkAI readiness health"
[3]: https://github.com/Melaninmaps/melanin-maps-api "Melaninmaps KinfolkAI release repository"
[4]: https://developer.android.com/develop/ui/views/layout/edge-to-edge "Android edge-to-edge layout guidance"
[5]: https://developer.android.com/about/versions/16/behavior-changes-16 "Android 16 large-screen orientation and resizability behavior changes"
