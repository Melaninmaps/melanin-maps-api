# Upstream API recovery and production cutover

**Prepared by:** Manus AI
**Date:** September 17, 2026
**Launch objective:** Make Mapping with Melanin’s real website, Android app, iPhone app, map pins, directory search, and KinfolkAI use the same current production API and approved directory database.

## Current fact pattern

The Railway deployment reported as successful is **not the application API service**. It runs `static-server.mjs`, a database-disabled public frontend proxy. That source explicitly forwards `/api` requests to `https://mwm-staging.35.196.78.19.nip.io` and logs `database_access=disabled`.

The upstream host is a Google Cloud external IP. Its public `/api/version` endpoint reports `a0329a77453b2619123df18bf5bd9dc8d1c47285`, release `Build-98.2`, environment `development`, and a September 9 build timestamp. It is not current GitHub `main`. Its KinfolkAI health endpoint returns HTTP 503 with `{"ok":false,"reason":"connection_failure"}`.

> **Do not publish the Android build in progress and do not call the release live yet.** It is configured to use `https://api.melaninmaps.com`, which currently routes to the old upstream API. The build can be retained as an unsigned/unsubmitted candidate, but it must pass the final live API checks before Google Play submission.

## Required owner

The owner needed now is the person or team with permission to manage the Google Cloud project that owns the Compute Engine external IP `35.196.78.19` and the service behind `mwm-staging.35.196.78.19.nip.io`.

They need permission to inspect the VM or managed Google Cloud service, access its current production database configuration, deploy current GitHub `main`, set server-side environment variables, restart the API process, and take a backup before additive schema work. Railway access alone is insufficient because Railway is only the public proxy in the present architecture.

## Recovery path — deploy the real API without moving data

The upstream owner must first identify the workload serving `35.196.78.19` in Google Cloud Console. Search Compute Engine VM instances and related load balancers/managed services by that external IP. Do not create a new blank database and do not repoint the public proxy to an unreviewed new API.

After identifying the workload, take a verified backup of the **existing production database**. Keep the existing database connection and existing non-AI environment configuration. This preserves users, login, sessions, password reset, waitlist data, listings, and other live records.

Deploy current `main` from `Melaninmaps/melanin-maps-api` to the existing API workload. The current GitHub `main` commit at this handoff is `eaf931aff63ce78b8bd66da088d6fe7056f8af1b`. Use the real API entry point in `artifacts/api-server`, not `static-server.mjs`.

The API service process must use the existing production `DATABASE_URL` and the normal production environment. Before restart, run the repository’s release database verification from the API workspace against the backed-up production database. The release script verifies required publication schema. Do not run manual SQL, reset the database, seed users, or use a raw JSONL insert.

The owner must configure these server-only environment values in the actual upstream API runtime. Use the existing approved provider values; do not print them, commit them, add them to client code, or place them in `app.json` or `eas.json`.

```text
AI_INTEGRATIONS_OPENAI_API_KEY
AI_INTEGRATIONS_OPENAI_BASE_URL
KINFOLK_FALLBACK_MODEL
KINFOLK_STAFF_DEMO_MODEL
```

Restart the actual API process after configuring the values. The public Railway proxy can stay in place only if it continues to forward `/api` to the repaired upstream API.

## Required proof after cutover

The owner must provide the following evidence from **both** `https://api.melaninmaps.com` and `https://www.mappingwithmelanin.com`:

| Check | Required result |
| --- | --- |
| `/api/healthz` | HTTP 200 |
| `/api/version` | Current release commit, not `a0329a77453b2619123df18bf5bd9dc8d1c47285` |
| `/api/kinfolk/health` | HTTP 200 with `{"ok":true}` |
| Signed-in general question | KinfolkAI answers `What is photosynthesis? Answer in two short sentences.` |
| Signed-in business question | KinfolkAI recommends only an approved, published directory business |
| Website search | A known approved business appears in relevant/location search |
| Map pin | The same business’s verified pin opens its listing |
| Outbound links | The listing opens the business’s own official website or social account |

No user, password, authentication, session, role, access, tester, or waitlist data should be changed as part of this cutover.

## Directory publication follows the API repair

After the upstream API is current and KinfolkAI health is green, use the already prepared review-only package through the guarded directory workflow. The package has 1,235 candidates: 925 commercial businesses, 250 regulated-review records, 38 community resources, and 22 cultural places. It must be reviewed against the live database for duplicates and enrichment. Commercial listings need confirmed coordinates before map pins. Regulated records remain under credential review. Resources and cultural places remain separate from commercial map pins.

## Mobile build decision

The Android production build `d37de1aa-32ab-429f-9b69-053bbb2640a9`, version 1.1.6 / versionCode 80, is currently unsubmitted. Keep it unsubmitted. It can move forward only after the repaired API passes the evidence checks above and a physical device verifies search → map pin → listing → official business link → KinfolkAI recommendation.

The iPhone build number needs a metadata-only correction because build 106 is already used and a completed build 107 exists. Do not create or submit an iPhone candidate until the API cutover succeeds and the corrected build number is reviewed.

## What this resolves

This cutover returns the product to one live chain: current GitHub code → existing production API/database → approved directory listings → shared web/mobile search and pins → KinfolkAI recommendations. Once that chain is deployed and verified, ordinary business additions go through the database review/publish process and do **not** require a new iPhone or Android build.

## References

[1]: https://github.com/Melaninmaps/melanin-maps-api "Melanin Maps API production source repository"
