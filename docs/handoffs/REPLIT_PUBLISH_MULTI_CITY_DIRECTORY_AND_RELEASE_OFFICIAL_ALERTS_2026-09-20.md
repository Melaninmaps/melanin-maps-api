# Replit Execution Order: Publish the Multi-City Directory Batch and Release the Optional Official Alert Update

**Purpose.** Execute the merged source changes without replacing or removing existing behavior. Preserve authentication, passwords and temporary-password prompts, tester access, waitlist data and administration, Community posts and media, profile images, comments, reviews, circles, messages, saves, follows, blocks, business-owner flows, Kinfolk sources and feedback, Library, payment surfaces, and all current content.

This work has two independent outcomes. The **directory batch** is a review-only source package until protected receipts prove publication. The **optional official-alert feature** is merged source code but remains switched off until private API configuration and a controlled check succeed. A GitHub merge, a website deployment, a directory receipt, a native binary, and a store submission are separate states and must be reported separately.

## Exact source state and release boundary

Start from the current clean `origin/main` after this directory package pull request is merged. Do not use a local patched checkout. Verify the exact SHA with `git fetch origin --prune` and `git rev-parse origin/main` before any deployment, ingestion, or EAS build.

The previous iOS **1.1.9 (111)** TestFlight upload and Android **1.1.7 (81)** AAB were built from source `81d6735a…`. The alert feature merged afterward in PR #145, so that already-completed binary cannot include the new mobile alert toggles. Do **not** try to rebuild or upload the same build numbers. After the directory package is merged and the full release gate is green, create the next distinct build identifiers: **iOS 1.1.9 (112)** and **Android 1.1.7 (82)**, unless App Store Connect or Play already requires a higher number. This is an increment-only release requirement, not a removal or replacement of the earlier builds.

## Directory batch to stage

The package is source-backed and **review-only**. It contains **694 new candidates** after consolidating the requested multi-city sweep, excluding exact identity matches that already exist in committed review packages. It also retains **97 held or overlap evidence records** outside the candidate manifest. It contains no latitude, longitude, or fabricated address data.

| Item | Exact value |
| --- | --- |
| Candidate manifest | `data/founder-imports/2026-09-20-multi-city-everyday-living-review/review-package/multi-city-everyday-living-review-only-candidates.jsonl` |
| Candidate rows | 694 |
| Candidate SHA-256 | `4f7160968007ab8667ab928c5e87a962b867ed8b593ae7b5837041f7e6a0381a` |
| Held/overlap evidence | 97 rows; SHA-256 `7a4f4a8a29f92876555660d128fd671a8a0e76c34b2c890a50f1a1d836958f67` |
| Target routing | 352 business, 11 online business, 111 community resource, 114 cultural place, 106 regulated review |
| Destination check | 721 unique official destinations checked: 625 reachable, 85 review-required, 4 network errors, and 7 timeouts |

The `review_required`, `network_error`, and `timeout` outcomes are not evidence that a business is closed. They are a **publication gate**. Keep their evidence and do not silently discard or publish them. Online businesses must remain mapless. Physical records may be geocoded only by the constrained publication worker after approval. No map pin or searchable public record exists until a receipt-backed publication completes.

## Protected directory publication steps

1. Create a **separate managed PostgreSQL service** in the same Railway project, such as `directory-review-postgres`. This database must remain different from the production business database.
2. Privately reference that service’s internal connection string from the API service as `DIRECTORY_REVIEW_DATABASE_URL`. Do not paste a database URL, password, token, or secret into chat, source code, a client, or a public log.
3. Generate and configure the scoped `DIRECTORY_SERVICE_TOKEN` and `DIRECTORY_REVIEW_SIGNING_SECRET` privately. Keep `DIRECTORY_REVIEW_ENABLED=0` and `DIRECTORY_PUBLICATION_WORKER_ENABLED=0` initially. Do not reuse a founder password or general user token.
4. Deploy the exact merged source. Confirm API health, readiness, and database health. Confirm the review database migration and the review database guard. The process must refuse a production business database as its review database.
5. With the worker still off, ingest only the checksum-pinned candidate manifest. Use the current `scripts/ingest-signed-directory-review-manifest.mjs` utility. It now uses the current **Bearer plus HMAC** operator contract, not the retired reconciliation header. Supply the manifest, summary, destination-health ledger, source name, and the production API URL. Never put the private values in the command history visible to other people.
6. Record the ingress receipt. Its candidate count and checksum must match the submitted enriched payload. Run automatic policy classification and reconciliation against the production directory without deleting businesses, user records, history, or duplicate evidence.
7. Review the aggregate automatic receipt and exception counts. The owner does not need to approve hundreds of rows one by one. The governed policy may automatically hold ineligible, duplicate, unverified, or unreachable candidates. Preserve mappings and provenance for every suppressed or linked record.
8. Only after successful ingress, reconciliation, and a green review-database check, set `DIRECTORY_PUBLICATION_WORKER_ENABLED=1` with exactly one worker. Do not run parallel workers. The worker may publish only the approved reconciled portion and must produce durable publication receipts.
9. Verify receipts before declaring results live. Confirm public web search, mobile search, map pin/detail routing for eligible physical records, online mapless routing, business detail pages, and Kinfolk retrieval. Run Kinfolk suggestions only after ordinary discovery and detail retrieval pass.
10. Report four separate numbers: staged, automatically held, linked/deduplicated, and receipt-published. Do not present the 694 research candidate count as the live inventory count.

## Optional official recall and health alerts

The feature is additive and **default-off**. It adds two separate member choices on both web and mobile:

- **Official Product Recalls**; and
- **Official Health Alerts**.

A member receives neither category unless they turn it on. A member can turn either setting off at any time. Device push permission is separate from the preference: with no registered push token, an opted-in member sees an in-app notification only.

The API records exactly-once in-app delivery per `(official alert, user)` pair before attempting a best-effort push. Each notice keeps an official link and states that it is an official source notice, not medical advice. It does not diagnose, triage, infer a health condition, create Kinfolk memory, or alter existing Community safety alerts.

| Official source | Automatic behavior | Safety boundary |
| --- | --- | --- |
| CPSC recall API | Poll only after feature enablement, validate each linked `cpsc.gov` notice, then deduplicate and deliver only to opt-in users | Fail closed on source, parsing, host, or notice verification failure. |
| CDC Health Alert Network | Poll the official CDC notice index, validate each canonical `cdc.gov` notice, then deduplicate and deliver only to opt-in users | Present the current official notice link without individualized health guidance. |
| FDA | Disabled | FDA iRES requires separately configured authority. Do not use openFDA as a public-alert trigger. |

After source deployment and database migration, keep `OFFICIAL_PUBLIC_ALERTS_ENABLED=0`. Verify that users see both new choices off by default and that a disabled refresh makes no network requests. Then set `OFFICIAL_PUBLIC_ALERTS_ENABLED=1` privately and configure a conservative protected server schedule, such as `POST /api/cron/official-public-alerts` every 30 minutes using the existing private cron secret. There is no public browser task, new user password, or client-side key required. CPSC and CDC do not expose the required webhook contract, so this server-side schedule is intentional. [1] [2]

## Required validation and deployment sequence

Run the following from the exact merged source before building either platform:

1. Run API, web, and mobile type checks. Use the repository’s declared TypeScript 6.0.3 for mobile if the default compiler rejects the existing `ignoreDeprecations` setting.
2. Run the focused directory ingress authorization test and package validator. Confirm the 694/97 count reconciliation, candidate and held checksums, zero candidate duplicates, zero coordinates, valid target routing, and completed destination-health ledger.
3. Run the official-alert tests. Confirm default-off consent, trusted-host enforcement, disabled/no-network behavior, CPSC/CDC parsing, exactly-once delivery contract, web controls, and mobile controls.
4. Run production web and API builds. Synchronize the committed website runtime assets only from that exact successful web build.
5. Deploy the web/API source. Confirm `https://api.melaninmaps.com/api/version`, `/api/healthz`, `/api/readyz`, and `/api/kinfolk/health` against the expected SHA before enabling the directory worker or official alert schedule.
6. Run protected directory ingress and receipt checks, separately from the web/API deployment.
7. After all source, production API-origin, directory, and mobile checks pass, build both native platforms from the same clean exact source: **iOS 1.1.9 (112)** and **Android 1.1.7 (82)**. Upload iOS only after confirming the new build is distinct in App Store Connect. Submit Android only if the owner separately asks for Play submission.

## Required final report

Use this exact distinction in the final report: **source merged**, **web/API deployed**, **directory staged**, **directory receipt-published**, **iOS build uploaded to TestFlight**, and **Android AAB built/uploaded/submitted**. Do not collapse these into “done.”

## References

[1]: https://www.cpsc.gov/Recalls/CPSC-Recalls-Application-Program-Interface-API-Information "CPSC Recalls Application Program Interface API Information"

[2]: https://www.cdc.gov/han/php/notices/index.html "CDC Health Alert Network Notices"
