# KinfolkAI minimal protected production-release handoff

**Prepared by:** Manus AI  
**Prepared:** 2026-09-17  
**Repository:** `Melaninmaps/melanin-maps-api`  
**Release base:** `origin/main` at `fed74cec`  
**Required boundary patch:** `fix/protected-release-boundaries-20260917`  

## Release decision

This handoff is the **minimal production path** for the current website, iOS, and Android release. It is deliberately conservative. It preserves existing accounts, passwords, authentication flows, sessions, waitlist records, and current business records. It does **not** claim that all desired product redesign items or the requested large business inventory are already live.

The code already merged into `main` includes the governed Kinfolk location-first retrieval work, optional member context, voluntary support-designation filtering, mobile map/pin behavior, Android layout configuration, and the temporary-password completion flow. GitHub `main` contains PRs #30, #31, #32, and #33, ending at merge commit `fed74cec`. [1]

Before any hosting deployment, merge the small boundary patch identified above. It removes automatic account/test-account mutation at startup and prevents tester-access grants from inserting rows into the waitlist. Account deletion is not a deployment action and is excluded from the release procedure. Those protections implement the current release instruction exactly:

> Do not add or delete users. Do not change the waitlist. The dashboard may show one combined waitlist from web and mobile submissions.

## Non-negotiable protected boundaries

Replit or the hosting operator **must not** alter, replace, clear, migrate destructively, or bulk-update any of the following while preparing this release:

| Protected area | Required release behavior |
|---|---|
| `users`, sessions, password hashes, Apple/OIDC identity data | Do not add, delete, seed, reset, promote, demote, or modify user records as part of deployment. |
| Sign-up, login, Apple sign-in, OIDC, email login, and password reset | Keep existing routes and response contracts intact. The one existing temporary-password completion feature is additive and remains limited to a flagged, already-authenticated account. |
| `waitlist_signups` | Do not import, clear, seed, delete, change statuses, or create rows from tester access. Website and mobile submissions must remain in this one existing table. |
| Business inventory | Do not run legacy startup business seeds or bulk-import research manifests. Do not publish a candidate without staging, live-database duplicate matching, address/coordinate verification, reviewer approval, and a recorded publication decision. |
| Live database | Take a verified backup/snapshot before applying additive schema work. Do not use `DROP`, `TRUNCATE`, blanket `DELETE`, or a fresh database replacement. |

The dashboard’s **combined waitlist** requires no merge or record reconciliation when both clients are configured to call the same production API: it is one `waitlist_signups` table with a unique email. The existing web dashboard reads `GET /api/admin/waitlist`; the operator should verify that both the website and mobile app use the same production API origin before release. The dashboard is a view of existing records, not a second waitlist and not an import operation.

## Required boundary-patch changes

The following patch is intentionally narrow. It should be reviewed and merged as a separate pull request before deployment.

| File | Minimal change | Reason |
|---|---|---|
| `artifacts/api-server/src/lib/startup-migrations.ts` | Disable legacy user-account migrations and remove automatic guards that create, update, promote, reset, or revoke user/test accounts during process startup. | A production restart must never create accounts, modify roles/handles/credentials, or revoke sessions. The additive `must_change_password` column remains permitted because it is schema-only. |
| `artifacts/api-server/src/routes/admin-testers.ts` | Remove `ensureUnifiedWaitlistEntry()` and its call in `POST /admin/testers/apply`. | Granting tester access no longer inserts a `waitlist_signups` row. Existing waitlist data is untouched. |
| `artifacts/api-server/src/__tests__/tester-roster-source-guard.test.ts` | Replace legacy account-seeding assertions with checks that startup does not execute user/tester mutation guards. | Prevents future maintenance from re-enabling an automatic account creation, promotion, reset, or pending-access seed unintentionally. |

The patch retains the read-only Access Ledger. It can show existing accounts, pre-approved access emails, and current/recent access events. It does not need to create a user or a waitlist row to display that information. Existing account-deletion controls are unchanged by this patch, but they must not be invoked during this release deployment.

## Validation completed for the boundary patch

The release worktree installed successfully with `pnpm install --frozen-lockfile`. The full workspace TypeScript check completed successfully, including API, web, mobile, shared libraries, and scripts. The focused tester-roster source guard passed with five tests, and the mobile authentication/navigation guard passed with eleven tests.

The complete API test suite was also attempted. It cannot be used as a green production signal in this sandbox because 23 of 90 test files, containing 74 tests, stop during import when `DATABASE_URL` is absent. The remaining 67 files and 1,096 tests passed. Replit must run the complete suite in a **non-production, production-like database environment** with a safe test `DATABASE_URL`; never point the test suite at the live production database.

### Do not reintroduce a universal tester password

The temporary-password feature should remain only for an **existing account** to which an administrator deliberately assigns a one-time temporary password through an approved operational process. Its expected behavior is as follows:

1. A successful email/password login returns `mustChangePassword: true` only for a record that already has `users.must_change_password = true`.
2. The iOS/Android client routes that authenticated session to `/set-initial-password` without placing any password in route parameters or local storage.
3. `POST /api/auth/complete-initial-password` requires the authenticated session, hashes the new password, and clears the flag atomically.
4. The established forgot-password flow remains available to all email-password accounts. A successful reset clears `must_change_password`, resets lock counters, and does not alter waitlist membership.
5. Apple/OIDC sign-in is not forced through this email-password screen unless an operator has explicitly flagged that account through a separate, approved process.

Do **not** enable any legacy migration or per-boot routine that creates known accounts, assigns a shared password, repairs a tester password hash, marks an existing user as a tester/admin, or seeds audit/monitor/load-test accounts. Do not put any temporary password in source code, deployment logs, configuration files, or a support message.

## Database and deployment procedure

### 1. Create the release branch from the verified base

```bash
git fetch origin --prune
git switch main
git pull --ff-only origin main
git rev-parse HEAD  # must resolve to fed74cec or a reviewed descendant
git switch fix/protected-release-boundaries-20260917
```

Review the patch diff carefully. Its expected effect is to reduce automatic writes and destructive operations; it should not modify the authentication route contract, the public waitlist route, the business-page layout, or existing business data.

### 2. Use production secrets; do not copy them into GitHub

Configure secrets in the actual production host only. Existing required production variables remain in effect, including the database URL, Replit/OIDC settings, session/cookie settings, Apple credentials if Apple sign-in is enabled, and email delivery configuration. Do not rotate or delete working secrets merely to deploy this patch.

Kinfolk has one known, release-blocking production configuration issue. The public service responds successfully at `/api/healthz`, but `/api/kinfolk/health` currently responds `503 {"ok":false,"reason":"connection_failure"}` on both mapped domains. [2] [3] The operator must configure and validate these existing server-only variables in the service that serves the API:

```text
AI_INTEGRATIONS_OPENAI_API_KEY=<production provider key>
AI_INTEGRATIONS_OPENAI_BASE_URL=<production OpenAI-compatible HTTPS base URL>
```

The base URL must be the provider’s correct API base, reachable from the deployment environment, and compatible with the installed integration package. Do not expose either value to web/mobile clients. A non-empty value is insufficient: the service must make a successful provider probe.

### 3. Apply only additive schema work

Create a point-in-time backup first. Run only the normal, repository-controlled startup/schema verification process after the boundary patch is merged. Inspect deployment logs for failures and confirm the following additive structures are present before enabling directory publication features:

```text
users.must_change_password
access_entitlement_events
directory_import_batches
directory_import_candidates
directory_import_decision_events
directory_import_publications
business_publication_identities
```

No database command in this release may create or delete a user, update user roles in bulk, reset passwords, create waitlist signups, delete waitlist signups, or run an unreviewed directory manifest directly against `businesses`.

**Do not run** `pnpm --filter @workspace/api-server run release-db:verify` against production until the boundary patch has been merged and audited. That command calls the general startup routine, which is why the patch must come first.

### 4. Build and deploy the API, then the web application

Use the repository lockfile. A minimal validation sequence is:

```bash
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/web run build
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/api-server test
```

Deploy the API before the web client. Confirm that the API has started with the expected production database and has completed only reviewed additive schema actions. Then deploy the web application against that API.

The repository’s Railway configuration checks only `/api/healthz`; a successful Railway health check therefore does **not** prove that Kinfolk is usable. The public health endpoint is currently healthy, so the remaining required gate is the independent Kinfolk provider health endpoint. [2] [3]

### 5. Build iOS and Android from the same reviewed commit

The mobile release must use the same API origin as the deployed website. Create EAS/App Store Connect/Google Play release builds only after the API gate passes. Native code changes require a new native build; later approved business data published through the shared API does not require another mobile binary.

The Android configuration currently includes edge-to-edge mode and the Android manifest plugin that removes `screenOrientation`, `resizeableActivity`, and aspect-ratio restrictions from the main activity. Keep that plugin enabled, preserve `edgeToEdgeEnabled: true`, and test Android 15 plus an Android 16 tablet/foldable or equivalent emulator. Android explains that large-screen devices ignore orientation/resizability restrictions beginning with Android 16, so responsive layouts must be verified rather than relying on a portrait lock. [4]

Do not claim that an Android warning is resolved only because the configuration is present in source. Confirm the generated Android manifest from the release build does not contain `android:screenOrientation="PORTRAIT"` or the unwanted resizability/aspect-ratio restrictions for `com.melaninmaps.app.MainActivity`. Review Android vitals/pre-launch results after uploading the build because some deprecated system-bar calls can originate in third-party React Native or Material dependencies rather than application code.

## Functional capabilities that are ready after deployment gates pass

The following capabilities are represented by merged source and should be release-tested after the API is live. They are not assertions that production already serves the merged version.

| Capability | Release expectation |
|---|---|
| Location-first business search | Search by business name, specialty, category, or typo-tolerant terms. Relevance ranks first; a voluntarily supplied nearby location acts as a distance tie-breaker. |
| Kinfolk business requests | “Find a braider near me” uses the governed published directory rather than inventing a business. “Houston daycare with later hours” must state when published hours are unavailable. |
| Map pins | Only a published business with reviewed coordinates receives a pin. Tapping the pin opens the existing business-detail route. |
| Listing presentation | Existing business-page format remains. Internal/founder provenance wording is not shown publicly; unclaimed status remains clear. |
| Support designations | Member-selected filters can combine explicit, attributable designations. Filters are voluntary and evidence-backed. A clear/expand option restores broad discovery. The app must not infer, hide, or remove businesses based on protected traits. |
| Optional member context | First visit can ask purpose first. Community/culture/language context is optional, editable, and used for ranking rather than automatically hiding essential services or resources. |
| Administrator website | The website may read the combined existing waitlist and Access Ledger. Any grant/revoke/status action must show explicit confirmation and be tested separately. Account deletion is an existing manual operation and is not part of this deployment. |

## Directory data: exact status and publication gate

No newly researched businesses have been added to the production database by this work. The current global manifest contains **705 raw leads**, of which **217** passed conservative pre-gates into a **review-only** queue and **488** remain held. The review-only queue has 92 commercial-business candidates, 98 regulated-review candidates, 22 community resources, and 5 cultural places. It is not a set of live listings, map pins, or Kinfolk recommendations. [5]

The supplied city/chamber/directory lists are appropriate discovery leads. They are not a license to copy their listings into the production database. A candidate can be staged only after it has all of the following:

1. An exact physical address suitable for a real map location.
2. A public discovery-source URL.
3. An attributable official, active social destination; an official website is preferred but may be absent.
4. Only official-source-backed optional facts, such as published hours, phone, specialties, languages, accessibility, audiences, and official website/social URLs.
5. A match/deduplication review against the live database. A match becomes an enrichment review, never an automatic replacement or duplicate.
6. Verified coordinates before a business-map pin is created.
7. An additional credential/licensing review for regulated health, legal, child-care, financial, or similar services.
8. Founder/reviewer approval through the guarded staging and publication process.

Resources and cultural places must remain outside commercial business-map pins. A social-only physical business may receive an ordinary business page with that official social destination once it passes the same address, duplication, and review gates. No numerical target such as 10,000, 12,500, or 37,000+ should be represented as completed, queued for automatic publication, or live.

## Production acceptance checklist

The hosting operator should record each result with the release SHA, build number, environment, and timestamp. Do not ship a public demo as “live and ready” until every required gate has passed.

| Gate | Procedure | Required result |
|---|---|---|
| Boundary patch | Review the API diff; inspect production logs on first boot. | No automatic user creation/deletion/update, password reset, tester seeding, audit account, monitor account, or waitlist insert occurs. |
| Waitlist | Submit one new test entry through the deployed web form and one through the deployed mobile form, using approved test emails only. | Both appear exactly once in the same web-admin waitlist view; no separate app waitlist exists; no tester access action adds a row. |
| Password safety | Use a designated non-production test account in the production-equivalent/staging environment. Test normal email login; flagged temporary-password login; forced private-password completion; forgot-password reset; Apple/OIDC login. | Normal and Apple/OIDC users are not forced unexpectedly. Flagged email-password user must change password. Reset remains available and clears the flag. No temporary credential appears in logs or UI state. |
| Kinfolk provider | Call both public endpoints after API deployment. | `/api/healthz` returns 200 and `/api/kinfolk/health` returns `200 {"ok":true}`. A 503 is a release blocker. |
| Discovery | Search a published, controlled test business by exact name, service phrase, and a reasonable typo; then ask Kinfolk for a nearby braider. | Results are published records only, with relevance/location behavior and no fabricated listing. |
| Map | Tap a controlled published business pin on web, iOS, and Android. | Pin opens the existing listing route. No candidate lacking verified coordinates appears as a pin. |
| Filters/context | Select multiple evidence-backed support filters, clear them, and use optional profile context. | Combined filters require all selected values. Clearing restores broad discovery. Context ranks results without blanket exclusion. |
| Android | Create a production-like Android release build and test phone/tablet/foldable orientation plus Android 15/16 edge-to-edge UI. | No portrait-lock usability failure, clipping, hidden input, or unreadable keyboard overlap. |
| iOS | Build from the same SHA and test sign-in, password reset, map pin, Kinfolk chat, and safe-area keyboard behavior. | The app uses the production API and maintains readable, tappable controls on supported devices. |

## Items intentionally outside this minimal release

This handoff does not certify that the broader social-profile, DMs, Circle planning, feed redesign, resource-content summaries, safety-flow redesign, individual comment controls, VIBES data migration/search, or large-scale directory acquisition work has been fully integrated and tested in the production repository. Those proposals should be delivered in separately reviewed feature branches with focused acceptance tests. Do not represent prototype packages or research files as live app behavior.

## Release ownership

The hosting owner, Replit operator, or Railway operator who holds the authorized production database, deployment, Apple, and Google Play credentials is responsible for deployment and store submission. A GitHub merge does not deploy web code, update a production database, or publish an iOS/Android build. The current session has no configured Replit/Railway deployment connector or production database credential, so it cannot execute those production actions.

After the operator has deployed, provide the deployment SHA, web release URL, API health output, and iOS/Android build identifiers for an independent final acceptance review.

## References

[1]: https://github.com/Melaninmaps/melanin-maps-api/commit/fed74cec0e36ed4636e54a4e859928be7f403871 "Melaninmaps main release merge commit fed74cec"

[2]: https://www.mappingwithmelanin.com/api/healthz "Mapping With Melanin public API health endpoint"

[3]: https://www.mappingwithmelanin.com/api/kinfolk/health "Mapping With Melanin KinfolkAI provider health endpoint"

[4]: https://developer.android.com/about/versions/16/behavior-changes-16 "Android 16 behavior changes for large screens"

[5]: https://github.com/Melaninmaps/melanin-maps-api/tree/main/data/founder-imports/2026-09-17-global-review "Review-only global directory inventory manifest"
