# Replit Execution Work Order: Directory Publication and Native Release

**Repository:** `Melaninmaps/melanin-maps-api`  
**Purpose:** Stage, reconcile, and publish the selected source-backed directory packages without personal administrator credentials, then build both native platforms from the same verified source.  
**Non-negotiable rule:** This work is additive. Do not delete, replace, reset, or otherwise alter user accounts, authentication, password-reset flows, tester temporary-password flows, sessions, approvals, waitlist records, existing businesses, Community records, comments, reviews, profile media, DMs, circles, saves, follows, blocks, Library, Kinfolk feedback, or payment surfaces.

## What this changes—and what it does not

The implementation adds a **narrow, server-side directory reconciliation token**. It is accepted only by two protected endpoints: signed directory-ingress and directory receipt-summary. It is not an administrator password and does not authorize access to users, passwords, Community content, waitlist data, payments, general founder routes, or Railway configuration. Every submitted payload must still pass checksum validation, HMAC validation, review-database isolation, deterministic policy classification, duplicate reconciliation, controlled physical-address geocoding, exactly-once production receipts, and concurrency-one publication.

This means Replit can run the batch process without asking the founder to click through hundreds of records or reveal a personal Mapping with Melanin password. The process must retain exceptions rather than force them live. A record that has a verified customer destination but cannot be exact-matched to its street address is held for research; it never receives an invented map pin.

The website and native clients may have different layouts, but they must read and write the **same server-side records**. The permanent requirements are in [`CROSS_CLIENT_CONTENT_PRESERVATION_CONTRACT.md`](../guardrails/CROSS_CLIENT_CONTENT_PRESERVATION_CONTRACT.md). A successful mobile profile image, comment, review, or Community post must appear on the web after refresh, and vice versa. A deployment or feed-ranking failure is not a reason to remove eligible Community content. Only an existing authorized member action, report/safety pathway, or reviewed administrator moderation action may change content visibility.

## 1. Freeze the exact release source

```bash
git fetch origin --prune
git checkout main
git reset --hard origin/main
RELEASE_SHA="$(git rev-parse HEAD)"
printf 'RELEASE_SHA=%s\n' "$RELEASE_SHA"
corepack enable
pnpm install --frozen-lockfile
```

Run this validation gate. Stop and repair additively if any command fails.

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/web run typecheck
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test
pnpm --dir artifacts/api-server exec vitest run \
  src/__tests__/directory-publication.test.ts \
  src/__tests__/directory-service-authorization.test.ts \
  src/__tests__/directory-worker-geocoding-contract.test.ts \
  src/__tests__/directory-signed-ingress-utility-contract.test.ts \
  src/__tests__/community-feed.test.ts
pnpm --dir artifacts/mobile exec vitest run __tests__/cross-client-social-records.test.ts
pnpm --filter @workspace/web run build
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
git diff --check
```

## 2. Deploy the API and web bundle from that SHA

Refresh the committed/static web payload before the Railway deployment so the public site does not serve a stale JavaScript bundle.

```bash
rm -rf artifacts/web/dist artifacts/api-server/web-static
pnpm --filter @workspace/web run build
mkdir -p artifacts/api-server/web-static
cp -R artifacts/web/dist/public/. artifacts/api-server/web-static/
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
```

Deploy `RELEASE_SHA` through the existing GitHub-connected Railway **api-server** deployment. Verify runtime identity after the deployment completes; a GitHub merge by itself is not proof of live behavior.

```bash
API='https://api.melaninmaps.com'
WEB='https://www.mappingwithmelanin.com'
curl -fsS "$API/api/version"
curl -fsS "$API/api/healthz"
curl -fsS "$API/api/readyz"
curl -fsS "$API/api/kinfolk/health"
curl -fsS "$WEB/kinfolk" | grep -Eo '/assets/index-[A-Za-z0-9_-]+\.js' | head -1
```

## 3. Configure the protected directory worker in Railway

Configure these variables on the **api-server** service only. Do not paste secret values into Git, mobile configuration, browser screenshots, or chat. Generate token values in Railway’s secret-value control or through the approved Replit/Railway server environment. Replit must not print them in logs.

| Variable | Required state |
|---|---|
| `DIRECTORY_REVIEW_DATABASE_URL` | Railway reference to the existing separate review service: `${{ directory-review-postgres.DATABASE_URL }}`. It must not equal the primary `DATABASE_URL`. |
| `DIRECTORY_REVIEW_ENABLED` | `1` |
| `DIRECTORY_REVIEW_SIGNING_SECRET` | New high-entropy server-side secret, at least 32 characters. Used only to bind exact ingress bytes to an HMAC. |
| `DIRECTORY_RECONCILIATION_SERVICE_TOKEN` | New different high-entropy server-side secret, at least 32 characters. Used only for the two narrowly scoped directory operator endpoints. |
| `DIRECTORY_PUBLICATION_WORKER_ENABLED` | Start at `0`. Set to `1` only after all staged batch receipts and dry-run counts are recorded. |
| `DIRECTORY_PUBLISHER_CONCURRENCY` | `1` |

Redeploy the API service after saving these variables. Confirm that `/api/readyz` is healthy. Do not enable the legacy local-only import route in production.

## 4. Stage the selected source packages through signed ingress

The seven selected packages contain **1,597 source-review rows**, not a promise of 1,597 new live businesses. The protected pipeline must first reconcile them with one another and with current production records. The two cumulative packages already represent the latest known cumulative work for their markets. Do not also stage their earlier component packages.

| Package | Source rows | Original manifest SHA-256 |
|---|---:|---|
| Northeast fifth-depth core: Philadelphia, PA suburbs, NJ, DE, NYC | 401 | `0af7f80a79f9a2b9a5c92700165209ee8505a0990464cd6f7676b580d14b9c4c` |
| Houston cumulative everyday | 396 | `845ad034d8ae00ae7207732734221ac66af4a568af36f9972a9d215a61e4f217` |
| Allentown–Lehigh Valley cumulative everyday | 170 | `350bddce16c6d9da92f9bb04b011486b2efb8589220f62d6f3222251a9c4496c` |
| Los Angeles luxury and everyday adult | 416 | `57b2961a763c7db9838a5b28e9f5c2b1821a07b32aebad7d98748284b81884f2` |
| Minneapolis–Saint Paul profile-fit | 69 | `76370ede4d3afb6de08525d1d3b7f4013240dd7c2cbaaac97c3e72a2cee4ec7f` |
| Philadelphia and Bucks County sixth-depth | 80 | `2a5ffcbe9f9470fc602b0f916127801e9099cbcb4a41323b76bd2bdab288ba88` |
| Philadelphia caregiver/faith support and Harrisburg reentry | 65 | `978b849284bfe69fcc9c47a016bbec1e39a4f4308976a346b143302c253e4efd` |

The new committed command `scripts/ingest-signed-directory-review-manifest.mjs` performs all of the following before it sends a request: it checks the original review-summary checksum and row count; checks the destination-health report count; carries the original manifest checksum forward as provenance; marks a customer destination reachable only when the existing bounded health report says `reachable`; HMAC-signs the exact enriched payload; and verifies that the returned receipt matches the submitted payload. It does **not** write directly to the live `businesses` table.

Run each package separately from the same clean checkout in the protected Replit/Railway operator environment where the two server-side secret values are available. Do not echo the environment variables or turn on shell tracing.

```bash
set -euo pipefail
API='https://api.melaninmaps.com'

stage() {
  local root="$1" name="$2" stem="$3"
  node scripts/ingest-signed-directory-review-manifest.mjs \
    --api "$API" \
    --source-name "$name" \
    --manifest "$root/review-package/${stem}-combined-review-only-candidates.jsonl" \
    --summary "$root/review-package/${stem}-combined-review-summary.json" \
    --health "$root/review-package/${stem}-combined-destination-health.json"
}

stage 'data/founder-imports/2026-09-18-northeast-core-fifth-depth-review' \
  'Northeast fifth-depth core review' 'northeast-core-fifth-depth'
stage 'data/founder-imports/2026-09-19-houston-cumulative-everyday-review' \
  'Houston cumulative everyday review' 'houston-cumulative-everyday'
stage 'data/founder-imports/2026-09-19-allentown-cumulative-everyday-review' \
  'Allentown cumulative everyday review' 'allentown-cumulative-everyday'
stage 'data/founder-imports/2026-09-19-los-angeles-luxury-review' \
  'Los Angeles luxury and everyday review' 'los-angeles-luxury'
stage 'data/founder-imports/2026-09-19-minneapolis-profile-review' \
  'Minneapolis–Saint Paul profile review' 'minneapolis-profile'
stage 'data/founder-imports/2026-09-19-philly-bucks-sixth-depth-review' \
  'Philadelphia and Bucks sixth-depth review' 'philly-bucks-sixth-depth'
stage 'data/founder-imports/2026-09-19-philly-harrisburg-support-review' \
  'Philadelphia and Harrisburg support review' 'philly-harrisburg-support'
```

Store the seven command outputs as the staging receipts. Then obtain the receipt-only count view using the same protected operator environment. Do not use an end-user browser session.

```bash
curl -fsS "$API/api/founder/directory-import/service/summary" \
  -H "x-directory-reconciliation-token: $DIRECTORY_RECONCILIATION_SERVICE_TOKEN"
```

## 5. Reconcile and publish without manual row-by-row approval

The ingress policy automatically retains `needs_research`, regulated, ownership-attributed, resource, cultural-place, manual-review, unreachable-destination, and within-batch duplicate records. It can only create work for policy-qualified commercial or online-service records. Existing-production matches are linked through the exactly-once production receipt; they are not overwritten or deleted.

For physical businesses, the single-concurrency worker uses the existing strict address matcher and only adds coordinates when the returned result agrees with the submitted numbered address, city, and state. It writes that location evidence into the signed publication payload before production publication. A non-match is marked `needs_research` and parked for review rather than retried as a fabricated pin. Online-only services are published mapless with their official customer destination.

After all seven staging receipts are present and the staging counts are sensible, set only this variable to enable the worker:

```text
DIRECTORY_PUBLICATION_WORKER_ENABLED=1
```

Redeploy the API service, retain `DIRECTORY_PUBLISHER_CONCURRENCY=1`, and let the worker process the queue. Do not run multiple copies of the worker. If a batch needs to stop, use the existing founder batch pause control; do not delete candidate, outbox, or production records.

## 6. Verify public search, maps, Kinfolk, and shared content

Use receipt-backed counts rather than promising a row count as a live count. For each batch, report: staged, duplicate-within-batch, linked-existing, created, online-only, physically geocoded/pinned, needs-research, resource/cultural/regulated, failed/retry, and immutable receipt IDs.

Test at least one published record from every intended type through the shared production API and both user interfaces: exact-name business search, category/relevance search, location-first map search, typo clarification, business detail page, official website/social link, physical map-pin click-through, mapless online listing, and signed-in Kinfolk recommendation. The Kinfolk business cards must navigate to the Mapping with Melanin listing page, not merely display text.

Confirm a mobile profile-image update, a mobile review, and a mobile Community comment appear on web after refresh; then confirm the reverse direction. Confirm existing Community posts remain visible to eligible viewers after the deployment. A transient feed/API failure must show a retry state and must not erase Community content.

## 7. Build both native platforms from the same final SHA

Use the final deployed `RELEASE_SHA` after the API/web deployment and directory worker configuration are recorded. Confirm the existing version values before build.

```bash
cd artifacts/mobile
jq '{version: .expo.version, iosBuild: .expo.ios.buildNumber, androidVersion: .expo.android.version, androidVersionCode: .expo.android.versionCode}' app.json
pnpm run prebuild:ios
pnpm run prebuild:android
pnpm exec eas build --platform ios --profile production
pnpm exec eas build --platform android --profile production
```

Required identifiers are **iOS 1.1.9 (build 111)** and **Android 1.1.7 (versionCode 81)**. Record both build URLs/IDs. A build is not a TestFlight upload, Google Play upload, tester distribution, store submission, or store release; report those events separately and only after they actually happen.

## Required completion report

Return one plain-language report with the GitHub merge SHA, deployed Railway SHA and deployment ID, health outputs, served web asset identity, review-database readiness, all seven ingress receipts, reconciliation/publication/hold counts by package, live search/map/Kinfolk checks, cross-client social-content checks, and iOS/Android build IDs plus distribution status. Do not claim that raw research, a GitHub merge, a staging receipt, or an EAS build is live directory data or a store release.

## References

[1]: https://docs.railway.com/variables "Railway documentation: Using Variables"
