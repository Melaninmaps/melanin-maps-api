# Mapping with Melanin™: Kinfolk Reset, Current-Events Relevance, Native Release, and Directory Publication Work Order

**Repository:** `Melaninmaps/melanin-maps-api`
**Date:** September 19, 2026
**Release rule:** Perform this work from one clean, recorded `origin/main` SHA after the pull request containing this document is merged. A GitHub merge, Railway deployment, protected directory publication, native build, tester upload, store submission, and public store release are separate events.

## Required outcome

Deliver the existing additive product plus the following **minimal additions**. Do not remove, rewrite, or weaken any existing authentication, password reset, tester temporary-password, account, approval, session, waitlist, Community, DM, circle, save, profile, business-owner, Library, payment, Kinfolk feedback, map, or directory behavior.

1. **Kinfolk current events:** Kinfolk must answer the factual question first with current, impartial, authoritative evidence and sources. It must not alter facts, source choice, uncertainty, or conclusions based on a member profile, politics, identity, income, health, age, or inferred viewpoint. Only after that answer may it show an optional **Explore next** prompt grounded in an explicit question or permitted non-sensitive context. Examples are “Want a gas-price and household-cost breakdown?” and “Want the official military-readiness view?” The prompt must never claim that Kinfolk knows a member’s hidden intent.
2. **Reset Kinfolk for every signed-in member:** Add the confirmed reset control on web and mobile Kinfolk settings. It clears Kinfolk sessions, private Kinfolk memories, business-feedback signals, response-feedback signals, and Kinfolk-only personalization/search fields. It turns Kinfolk memory and personalized suggestions off until the member enables them again. It does **not** delete an account, password, profile, Community content, DMs, circles, saved places, membership, payments, waitlist records, access records, or other Mapping with Melanin data.
3. **Directory publication:** Turn on the existing isolated review database and automated, receipt-based publisher. Stage the named manifests below only through the protected founder ingress; reconcile against the live directory; publish only deterministic policy-qualified commercial and online records; retain `needs_research`, regulated, cultural, resource, ambiguous-duplicate, and destination-health exceptions. Never bulk insert raw JSONL into the live `businesses` table or manufacture coordinates.
4. **Native release:** Build both required native artifacts from the final clean SHA: **iOS 1.1.9 (build 111)** and **Android 1.1.7 (versionCode 81)**.

## Exact source changes already implemented

Use the merged code as-is; do not reimplement its behavior in a different route or screen.

| File | Minimal additive change |
|---|---|
| `artifacts/api-server/src/routes/kinfolk.ts` | Adds the **PRACTICAL CURRENT-EVENT RELEVANCE** contract and `DELETE /api/kinfolk/reset`. The route requires an authenticated member and body `{ "confirmation": true }`; it clears only Kinfolk-owned records transactionally, disables Kinfolk memory/personalization, and invalidates per-user caches. |
| `artifacts/web/src/components/kinfolk/KinfolkMemoryManager.tsx` | Adds the confirmed **Start Kinfolk fresh** control. |
| `artifacts/web/src/pages/travel.tsx` | Clears stale browser-side Kinfolk conversation state after a successful reset. |
| `artifacts/mobile/app/kinfolk-settings.tsx` | Adds a confirmed **Reset Kinfolk** control in signed-in Kinfolk settings. |
| `artifacts/api-server/src/__tests__/kinfolk-reset-and-relevance-contract.test.ts` | Protects the impartiality, privacy, reset authorization, cache invalidation, and web/mobile-control contracts. |

## Clean checkout and release source

Run these commands at the repository root. Record the resulting `RELEASE_SHA` in the Railway deployment record and both native-build records.

```bash
git fetch origin --prune
git checkout main
git reset --hard origin/main
RELEASE_SHA="$(git rev-parse HEAD)"
printf 'RELEASE_SHA=%s\n' "$RELEASE_SHA"
git log -12 --oneline
```

Run the required validation gate before deployment. Any failure stops the release and must be repaired additively.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/web run typecheck
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test
pnpm --dir artifacts/api-server exec vitest run \
  src/__tests__/kinfolk-reset-and-relevance-contract.test.ts \
  src/__tests__/kinfolk-universal-assistant-contract.test.ts
pnpm --filter @workspace/web run build
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
git diff --check
```

## Production web and API deployment

Rebuild committed static assets from the exact clean source rather than using a cached bundle.

```bash
rm -rf artifacts/web/dist artifacts/api-server/web-static
pnpm --filter @workspace/web run build
mkdir -p artifacts/api-server/web-static
cp -R artifacts/web/dist/public/. artifacts/api-server/web-static/
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
```

Deploy `RELEASE_SHA` to the production Railway API service. Then verify the actual runtime and asset, not merely the GitHub merge.

```bash
API='https://api.melaninmaps.com'
WEB='https://www.mappingwithmelanin.com'
curl -fsS "$API/api/version"
curl -fsS "$API/api/healthz"
curl -fsS "$API/api/readyz"
curl -fsS "$API/api/kinfolk/health"
curl -fsS "$WEB/kinfolk" | grep -Eo '/assets/index-[A-Za-z0-9_-]+\.js' | head -1
```

Acceptance must include a signed-in reset confirmation on web and mobile, reset-state verification after reloading Kinfolk, an impartial current-events answer with current sources, and optional neutral Explore-next prompts. No user or account modification is part of this release.

## Protected directory publication configuration

The Railway project already has a separate `directory-review-postgres` service. Configure the **api-server** service, not the primary `Postgres` service.

| API service variable | Required value/state |
|---|---|
| `DIRECTORY_REVIEW_DATABASE_URL` | Select Railway’s autocomplete reference for the review service: `${{ directory-review-postgres.DATABASE_URL }}`. Do not paste a database URL into source, chat, or the primary `DATABASE_URL`. |
| `DIRECTORY_REVIEW_ENABLED` | `1` |
| `DIRECTORY_REVIEW_SIGNING_SECRET` | A new or existing server-side, high-entropy value of at least 32 characters. Keep it protected; do not print, log, or paste it into code or chat. |
| `DIRECTORY_PUBLICATION_WORKER_ENABLED` | `1` only after review-schema health and dry-run reconciliation pass. |
| `DIRECTORY_PUBLISHER_CONCURRENCY` | `1` for the first production batches. |

The review URL must be a database **different** from the existing `DATABASE_URL`. Preserve the original production database and all current user/account/session data. Do not enable the legacy local-only import route in production.

## Approved manifest scope for protected staging

Stage each row below separately through `POST /api/founder/directory-import/ingress` using a signed payload, authenticated founder session, exact JSONL bytes, exact row count, and matching SHA-256. The existing ingress route writes only to the review database and creates a receipt; it is idempotent by checksum. Do **not** treat GitHub paths as live database records.

| Market package | Review manifest path | Candidate records | Manifest SHA-256 |
|---|---|---:|---|
| Northeast fifth-depth core: Philadelphia, PA suburbs, NJ, DE, NYC | `data/founder-imports/2026-09-18-northeast-core-fifth-depth-review/review-package/northeast-core-fifth-depth-combined-review-only-candidates.jsonl` | 401 | `0af7f80a79f9a2b9a5c92700165209ee8505a0990464cd6f7676b580d14b9c4c` |
| Houston cumulative everyday | `data/founder-imports/2026-09-19-houston-cumulative-everyday-review/review-package/houston-cumulative-everyday-combined-review-only-candidates.jsonl` | 396 | `845ad034d8ae00ae7207732734221ac66af4a568af36f9972a9d215a61e4f217` |
| Allentown–Lehigh Valley cumulative everyday | `data/founder-imports/2026-09-19-allentown-cumulative-everyday-review/review-package/allentown-cumulative-everyday-combined-review-only-candidates.jsonl` | 170 | `350bddce16c6d9da92f9bb04b011486b2efb8589220f62d6f3222251a9c4496c` |
| Los Angeles luxury and everyday adult | `data/founder-imports/2026-09-19-los-angeles-luxury-review/review-package/los-angeles-luxury-combined-review-only-candidates.jsonl` | 416 | `57b2961a763c7db9838a5b28e9f5c2b1821a07b32aebad7d98748284b81884f2` |
| Minneapolis–Saint Paul profile-fit | `data/founder-imports/2026-09-19-minneapolis-profile-review/review-package/minneapolis-profile-combined-review-only-candidates.jsonl` | 69 | `76370ede4d3afb6de08525d1d3b7f4013240dd7c2cbaaac97c3e72a2cee4ec7f` |
| Philadelphia and Bucks County sixth-depth | `data/founder-imports/2026-09-19-philly-bucks-sixth-depth-review/review-package/philly-bucks-sixth-depth-combined-review-only-candidates.jsonl` | 80 | `2a5ffcbe9f9470fc602b0f916127801e9099cbcb4a41323b76bd2bdab288ba88` |

These six package rows contain **1,532 review records as rows**, not a valid unique live-business count. Cross-package and live-production reconciliation is mandatory before publication. The publisher must link exact existing records rather than overwrite or delete them and must produce immutable receipt IDs.

### Required publisher sequence

1. Verify the separate review database and both schemas; keep the publisher worker off until this check passes.
2. Submit the six checksum-pinned manifests above through the authenticated, signed protected ingress. Reject any checksum, count, schema, or destination-health mismatch.
3. Perform live-directory reconciliation in dry-run mode. Report exact duplicate groups and canonical links. Never delete a user, business, review, or history record.
4. Enable the worker at concurrency one. It may automatically publish only policy-qualified physical businesses with reviewed addresses and approved online-only businesses. It must route resources, cultural places, regulated records, destination-health exceptions, and ambiguous duplicates to exceptions/holds rather than silently publishing them as ordinary map pins.
5. Verify, from the live API and signed-in Kinfolk, exact-name search, category/relevance search, local search, a typo retry, business detail page, official website/social link, physical map-pin click-through, mapless online listing behavior, and Kinfolk retrieval.
6. Return one batch report for each manifest: received, deduplicated, linked-existing, created, online-only, geocoded/pinned, resource/cultural/regulated/needs-research holds, retry/failed command counts, immutable command/receipt IDs, and final public search verification. Only report live counts from that receipt-backed result.

Directory publication is dynamic: once a receipt-backed listing is published to the production directory, it becomes eligible for web search, mobile business search, map retrieval, and authenticated Kinfolk recommendations without another native build. A native build is still required once for the current mobile code changes below.

## Native build: iOS and Android

The required configuration is already committed. Verify before building:

```bash
cd artifacts/mobile
jq '{version: .expo.version, iosBuild: .expo.ios.buildNumber, androidVersion: .expo.android.version, androidVersionCode: .expo.android.versionCode}' app.json
pnpm run prebuild:ios
pnpm run prebuild:android
```

Expected values are **iOS `1.1.9` / `111`** and **Android `1.1.7` / `81`**. Build both from the same `RELEASE_SHA` only after all validation gates pass.

```bash
pnpm exec eas build --platform ios --profile production
pnpm exec eas build --platform android --profile production
```

A successful build is an artifact, not an upload, tester distribution, App Store/Google Play submission, approval, or public release. Check both storefront consoles for a newer existing build identifier before upload. Do not change payment-routing flags without a current Apple/Google eligibility and policy review.

## Required final report

Return one plain-language report that separately names:

- merged GitHub SHA;
- deployed Railway source SHA, deployment ID, health responses, and served web asset;
- protected review database status and all manifest receipts;
- staged, deduplicated, linked, published, and held counts per manifest;
- iOS and Android EAS build IDs/URLs and tester-distribution state; and
- any unavailable external step.

Do not call a code merge, a data staging receipt, an EAS build, or a store upload a public release unless that exact external action has actually completed.

## Preservation checklist

Do not create, alter, delete, or revoke user records. Preserve email login, password reset, temporary tester-password prompts, sessions, approval behavior, combined website-admin waitlist display, Community content and moderation/privacy, DMs, circles, saves, profile edit/settings/image flows, business-owner flows, Library, Kinfolk source links/article summaries/answer feedback, map locality behavior, payment surfaces, and existing live directory records. Every change in this work order is additive.
