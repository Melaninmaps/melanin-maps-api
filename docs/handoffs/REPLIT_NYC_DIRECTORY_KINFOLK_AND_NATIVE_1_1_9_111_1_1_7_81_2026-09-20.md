# Replit Execution Work Order: NYC Directory, Kinfolk, Web Deployment, and Native Release

**Repository:** `Melaninmaps/melanin-maps-api`  
**Starting source:** fetch the latest `origin/main`; this work order is intentionally SHA-neutral so it cannot accidentally direct a build from an old checkout.  
**Purpose:** deploy the already-merged Kinfolk improvements, stage and automatically reconcile the selected source-backed directory packages in a separate review database, publish only policy-qualified records through the controlled worker, and build **iOS 1.1.9 (111)** plus **Android 1.1.7 (81)** from the same final source. Upload the completed iOS binary to TestFlight after all release gates pass.

> **Non-negotiable preservation rule:** Every change is additive. Do **not** remove, reset, replace, hide, or weaken existing authentication, login, password-reset, temporary tester-password prompts, users, accounts, sessions, approvals, combined waitlist/admin behavior, business-owner functions, profile media, DMs, circles, saves, follows, blocks, Community posts/comments/reviews/approved media, Library, Kinfolk source links/article summaries/answer feedback/memory/reset/voice/modes, map and business search, or payment surfaces. Existing Community content may change visibility only through the existing member, report/safety, or reviewed administrator-moderation pathways. Web and mobile may look different, but they must read and write the same server-side content records.

## 1. What is already merged in source

The following source changes are merged and must be included in this release. They require no replacement implementation by Replit.

| Merge | Included behavior | Preservation boundary |
|---|---|---|
| PR #141 | Kinfolk chooses a **concise, standard, or detailed** answer budget from the question. Complete planning, comparison, explanation, location, and current-information questions receive a useful conclusion plus adequate supporting trade-offs; quick questions remain brief. | Facts, citations, current-information rules, privacy, source links, feedback, and existing modes remain higher-priority. |
| PR #142 | Kinfolk recognizes city-aware language for Philadelphia, NYC, DC, and Baltimore; gives city context without harsh correction, dialect performance, or identity inference. Authenticated members can submit terms; only reviewed administrator approvals can affect answers. | Pending/rejected terms never reach Kinfolk. Community terms cannot support health, legal, financial, safety, political, news, ownership, or business facts. |
| PR #143 | Web Kinfolk preferences and mobile Kinfolk Settings expose the reviewed-language contribution form. Mobile includes a standard back/gesture-safe screen. | Submissions are review-only; they do not alter a response, user profile, or any other member’s experience until an administrator approves them. |

The contribution endpoints are already in source:

```text
POST /api/community-language/proposals             # authenticated member suggestion
GET  /api/community-language/proposals/mine        # submitter’s own status only
GET  /api/community-language/approved              # approved terms only; no submitter identity
GET  /api/admin/community-language/proposals       # existing admin authorization required
PATCH /api/admin/community-language/proposals/:id  # existing admin authorization required
```

Do not bypass the approval route, create an automated approval, add personal identifiers to the prompt, or change the pre-existing Kinfolk private-memory controls. A member may explain a term such as **jawn**, **bodega**, **chopped cheese**, **carryout**, or a local DC reference; Kinfolk may use approved meaning to understand a request, but it must not claim that a user belongs to a group or use imitation.

## 2. Freeze and validate the exact source

Use a fresh checkout. Do not build from an old local worktree or a partially merged branch.

```bash
set -euo pipefail

git fetch origin --prune
git checkout main
git reset --hard origin/main
RELEASE_SHA="$(git rev-parse HEAD)"
printf 'RELEASE_SHA=%s\n' "$RELEASE_SHA"
corepack enable
pnpm install --frozen-lockfile
```

Run the release gate before deploying, staging records, or starting EAS. Stop on a new failure and make only a small additive correction; never work around a failure by deleting a feature or test.

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/web run typecheck
pnpm --filter @workspace/mobile run typecheck

pnpm --dir artifacts/api-server exec vitest run \
  src/kinfolk/__tests__/adaptive-response-depth.test.ts \
  src/kinfolk/__tests__/community-language.test.ts \
  src/kinfolk/__tests__/lean-general-chat.test.ts \
  src/__tests__/directory-publication.test.ts \
  src/__tests__/directory-service-authorization.test.ts \
  src/__tests__/directory-worker-geocoding-contract.test.ts \
  src/__tests__/directory-signed-ingress-utility-contract.test.ts \
  src/__tests__/community-feed.test.ts

pnpm --dir artifacts/web exec vitest run \
  src/__tests__/community-language-preferences.test.ts
pnpm --dir artifacts/mobile exec vitest run \
  __tests__/community-language-attainability.test.ts \
  __tests__/cross-client-social-records.test.ts

pnpm --filter @workspace/web run build
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
git diff --check
```

### Toolchain note (do not alter product behavior to work around it)

A local validation environment resolved the root TypeScript **5.9.3** binary for mobile and therefore rejected the existing mobile compiler setting `ignoreDeprecations: "6.0"`. The mobile package already declares TypeScript `~6.0.3`. Use the correctly scoped mobile package toolchain after the clean install. Do **not** weaken mobile `tsconfig.json`, disable typechecking, or remove tests merely to pass a build. Record the actual TypeScript binary/version used in the release report.

## 3. Synchronize and deploy the website/API from `RELEASE_SHA`

The Railway API serves committed `artifacts/api-server/web-static` files. Rebuild and synchronize them so the deployed public site does not retain an older JavaScript bundle.

```bash
set -euo pipefail
rm -rf artifacts/web/dist artifacts/api-server/web-static
pnpm --filter @workspace/web run build
mkdir -p artifacts/api-server/web-static
cp -R artifacts/web/dist/public/. artifacts/api-server/web-static/
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
git add artifacts/web/dist artifacts/api-server/web-static
git commit -m "build(web): synchronize release assets for ${RELEASE_SHA}"
git push origin main
```

Deploy that exact pushed SHA through the GitHub-connected Railway **api-server** service. After deployment completes, record the deployment ID and verify runtime identity. A GitHub merge or Railway build log alone is not proof that public production is current.

```bash
API='https://api.melaninmaps.com'
WEB='https://www.mappingwithmelanin.com'

curl -fsS "$API/api/version"
curl -fsS "$API/api/healthz"
curl -fsS "$API/api/readyz"
curl -fsS "$API/api/kinfolk/health"
curl -fsS "$WEB/kinfolk" | grep -Eo '/assets/index-[A-Za-z0-9_-]+\.js' | head -1
```

Perform public-safe smoke checks after the runtime SHA matches the deployed source: one factual Kinfolk question, one detailed planning/location question, one answer with sources, a Kinfolk business-card click-through to the Mapping with Melanin detail page, a Library query with summary/source links, map business search, map location permission/nearest-first behavior, and Community feed loading. Confirm that an existing web comment/review/profile-media record still appears in mobile after refresh and vice versa. A temporary error may show retry UI; it must never erase content.

## 4. Separate review database prerequisite — required before any directory stage or publication

The protected pipeline is present in source but must remain off until its **own managed PostgreSQL service** exists in the same Railway project. Create a separate service named `directory-review-postgres` (or equivalent). It is not the primary application database and must not be pointed at the production business database.

Configure only private Railway service references and server-side secret controls. Do not print, paste, copy into Git, add to Expo configuration, screenshot, or chat any URL, signing secret, or token.

| API service variable | Required value/state |
|---|---|
| `DIRECTORY_REVIEW_DATABASE_URL` | Private reference such as `${{ directory-review-postgres.DATABASE_URL }}`; must differ from primary `DATABASE_URL`. |
| `DIRECTORY_REVIEW_ENABLED` | `1` only after the API starts successfully against the separate review database. |
| `DIRECTORY_REVIEW_SIGNING_SECRET` | New server-side high-entropy secret, minimum 32 characters. |
| `DIRECTORY_RECONCILIATION_SERVICE_TOKEN` | A different new server-side high-entropy secret, minimum 32 characters. |
| `DIRECTORY_PUBLICATION_WORKER_ENABLED` | **`0` initially.** |
| `DIRECTORY_PUBLISHER_CONCURRENCY` | `1` exactly. |

Redeploy after configuration, verify `/api/readyz`, and confirm that the review database is distinct before calling ingress. Do not enable the legacy/local-only import route. Do not use an end-user admin password; the narrow reconciliation service token is intentionally limited to directory ingress and receipt summary.

## 5. NYC package ready for protected staging — not live yet

The committed review package is:

```text
data/founder-imports/2026-09-20-nyc-weekend-family-lifestyle-review/
```

Its review-only checksum manifest is:

```text
review-package/nyc-weekend-family-lifestyle-review-only-candidates.jsonl
SHA-256: d53a55d98ed60e59c5ed7808056aeff448e72f4e24683b9e54c81279513f6069
```

The package has **101 raw candidate rows** and **33 raw held leads**. Consolidation preserves source evidence and turns the candidate corpus into **91 review-only canonical records**: 43 commercial businesses, 37 cultural places, and 11 community resources. Nine overlapping raw copies are retained as duplicate evidence rather than deleted. The bounded destination report checked 120 unique customer destinations: 105 were reachable, 11 require review, and 4 had a network error. Those 15 destination outcomes are review gates, not closure findings.

This package contains no coordinates and does not write to a database. It is **not** a live directory count, map-pin count, searchable inventory, or Kinfolk-retrievable inventory until the process below finishes with receipts.

Stage it only after the isolated-review prerequisites succeed:

```bash
set -euo pipefail
API='https://api.melaninmaps.com'
ROOT='data/founder-imports/2026-09-20-nyc-weekend-family-lifestyle-review'

node scripts/ingest-signed-directory-review-manifest.mjs \
  --api "$API" \
  --source-name 'NYC weekend family and lifestyle review — 2026-09-20' \
  --manifest "$ROOT/review-package/nyc-weekend-family-lifestyle-review-only-candidates.jsonl" \
  --summary "$ROOT/review-package/nyc-weekend-family-lifestyle-review-summary.json" \
  --health "$ROOT/review-package/nyc-weekend-family-lifestyle-destination-health.json"

curl -fsS "$API/api/founder/directory-import/service/summary" \
  -H "x-directory-reconciliation-token: $DIRECTORY_RECONCILIATION_SERVICE_TOKEN"
```

Store the returned batch ID, immutable ingress checksum, count breakdown, and receipt output. Never echo environment variables or enable shell tracing. The signed command does not write directly to production businesses; it adds checksum-pinned material to the separate review system.

The DC and Baltimore research sweep is also complete but is **research-only and not yet a committed checksum package**: Washington has 114 candidates / 16 held leads; Baltimore has 109 candidates / 26 held leads. Package, validate, deduplicate, and health-check that corpus separately. Do not append it informally to NYC or stage raw research files.

## 6. Reconcile automatically and publish without founder row-by-row approval

The requested operating model is **automated batch reconciliation with durable receipts**, not hundreds of manual clicks. The protected policy must:

1. retain duplicate, unreachable, network-error, regulated-review, cultural-place, community-resource, ownership-attributed, and needs-research cases in review/hold states;
2. link a confident existing production match rather than overwriting/deleting an existing business, user, history, or detail URL;
3. only permit a policy-qualified commercial physical or online record to move to the outbox;
4. geocode a physical record only when the result exactly agrees with its source-backed numbered street address, city, and state;
5. leave online-only services mapless with their official destination; and
6. run exactly one publisher worker.

After staging receipts and automatic reconciliation counts are recorded, change **only** this variable:

```text
DIRECTORY_PUBLICATION_WORKER_ENABLED=1
```

Redeploy the API, keep `DIRECTORY_PUBLISHER_CONCURRENCY=1`, and allow the worker to process the approved batch. Use the existing pause control to stop work; never delete candidates, outbox rows, receipts, users, or businesses. Do not claim a raw/review/staged row is live until the production receipt says it was created or linked.

For each source package, record: staged; duplicate-within-batch; linked-existing; created; online-only; physically geocoded/pinned; needs-research; resource/cultural/regulated; retry/failed; and immutable receipt IDs. Then verify exact-name search, category/relevance search, typo handling, location-first map results, physical pin click-through, mapless online listing detail, customer destination link, and Kinfolk recommendation card on public production.

## 7. Build both native platforms only after the deployed source is final

The app source includes the latest Kinfolk behavior, reset/memory/modes/voice, direct listing cards, map-search/location fixes, cross-client Community preservation contracts, and the new reviewed-language form. These mobile source changes require a fresh binary. Directory records alone would not require a binary, but this release does.

Confirm the required identifiers immediately before building. Do not silently change them.

```bash
cd artifacts/mobile
jq '{version: .expo.version, iosBuild: .expo.ios.buildNumber, androidVersion: .expo.android.version, androidVersionCode: .expo.android.versionCode}' app.json
# Required output: iOS 1.1.9 / build 111 and Android 1.1.7 / versionCode 81

pnpm run prebuild:ios
pnpm run prebuild:android
pnpm exec eas build --platform ios --profile production --non-interactive
pnpm exec eas build --platform android --profile production --non-interactive
```

After the iOS build succeeds and its ID/URL is recorded, upload **that exact iOS 1.1.9 (111)** build to TestFlight:

```bash
pnpm exec eas submit --platform ios --latest --profile production --non-interactive
```

Build Android **1.1.7 (81)** in the same release but do not submit it to Google Play unless a separate Play submission is explicitly requested. A successful EAS build is not automatically a TestFlight upload, tester distribution, store submission, or store release; record each event separately.

## 8. Required completion report

Return one plain-language report that distinguishes each state clearly:

| State | Required evidence |
|---|---|
| Source merged | GitHub PR links and final merge SHA. |
| Railway deployed | Deployment ID, `/api/version` SHA/source SHA, health/ready/Kinfolk-health responses, and served website asset identity. |
| Directory staged | Separate-review database confirmation, source manifest checksum, signed ingress batch ID, and staging receipt. |
| Directory published | Receipt-backed created/linked/pinned/mapless/held/retry totals, plus public search/map/detail/Kinfolk verification. |
| Native built | iOS and Android EAS build IDs/URLs with their version identifiers. |
| TestFlight | iOS submission ID/status; distinguish upload from tester availability/review/release. |

If the isolated review database is not configured, report exactly that and leave the worker off. If any release gate fails, report the failing command and its output summary; do not remove tests/features or build an unverified binary.

## Related source documents

- [`REPLIT_EXECUTE_DIRECTORY_PUBLICATION_AND_NATIVE_RELEASE_2026-09-19.md`](REPLIT_EXECUTE_DIRECTORY_PUBLICATION_AND_NATIVE_RELEASE_2026-09-19.md) — prior protected-pipeline operating details and selected cumulative packages.
- [`CROSS_CLIENT_CONTENT_PRESERVATION_CONTRACT.md`](../guardrails/CROSS_CLIENT_CONTENT_PRESERVATION_CONTRACT.md) — permanent web/mobile content-preservation requirement.
- [`REPLIT_KINFOLK_VOICE_MEMORY_AND_MODE_RELEASE_2026-09-20.md`](REPLIT_KINFOLK_VOICE_MEMORY_AND_MODE_RELEASE_2026-09-20.md) — prior Kinfolk voice, memory, and mode release guardrails.
