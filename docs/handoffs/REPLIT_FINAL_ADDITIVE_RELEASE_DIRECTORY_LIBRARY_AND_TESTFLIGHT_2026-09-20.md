# Replit Final Additive Release Order — Directory, Library, Map, Kinfolk, and TestFlight

**Purpose.** This is the single execution order for the next release. It is intentionally additive: preserve all existing authentication, tester temporary-password prompts, accounts, waitlist behavior, approved Community posts and social links, DMs, circles, saves, follows, blocks, business-owner flows, Library links, Kinfolk sources and answer feedback, payment routes, and existing records. Do **not** replace a page, reset a table, delete a post, bulk-delete a listing, or use a fresh database.

## Frozen source and native identifiers

Build from the final clean `origin/main` only, after this handoff is merged. Do not build from a local checkout with uncommitted work.

| Platform | Version | Build identifier | Reason for this binary |
|---|---:|---:|---|
| iOS | `1.1.9` | `112` | Adds post-111 native Kinfolk, listing, Library, HBCU, map, media, and historical-context behavior. |
| Android | `1.1.7` | `82` | Adds post-81 native Kinfolk, listing, Library, HBCU, map, media, and historical-context behavior. |

The previously completed iOS `111` and Android `81` must not be overwritten. This is the next sequential pair. A website/API deployment is needed for the server and web changes. Directory records added later remain API-driven and do **not** require another native binary.

## Non-negotiable preservation contract

Before touching deployment or EAS, confirm the working tree is clean and run a diff review. The release must retain the following behavior.

- Web and mobile share API-backed profile images, reviews, comments, Community posts, and approved public social-video contributions. Existing content can be removed only through the existing report/moderation/admin process.
- Kinfolk remains an everyday-life assistant with sources, article summaries, answer-level Helpful/Not Helpful feedback, explicit private memory controls, mode persistence, voice input/output, general chat, cultural context, and direct listing cards.
- Kinfolk facts remain factual and source-linked first. Private preferences may frame an optional next-step prompt, but never change the facts or override the current request.
- A remembered companion is separate from the primary member, is saved only after explicit consent, can be forgotten independently, and never overrides the member’s present request.
- Keep login, password-reset, tester temporary-password, waitlist, approval, payment, Community, Library, map, business-owner, and existing public-safe media behavior intact.
- Do not expose, copy, print, rotate, or request secrets, signing credentials, database URLs, HMAC values, service tokens, Apple credentials, or Expo credentials.

## Included product changes

### 1. Kinfolk

The API and both clients include adaptive answer depth, Big Cousin/Professor mode persistence, private companion memory consent and separate forget control, direct listing navigation, voice status/permission feedback, governed community language proposals, and current cultural routing.

For culturally specific questions, Kinfolk must interpret an ordinary phrase such as “Who won the beef?” as a music/public-culture conflict question, ask a useful clarification when the artists are missing, and answer a specific Kendrick Lamar/Drake question with a measured consensus. The answer must distinguish documented outcomes from opinion, cite the Grammy and chart-impact evidence it uses, and offer current-artist follow-up sources. It must not produce a false “which person or work?” prompt after the artists are already named.

### 2. Map and profile navigation

The crowded category, shortcut, and legend strips are removed from web and mobile map surfaces. **Search remains.** Members can search city/locality and search businesses, services, HBCUs, markets, heritage, and other supported records without a wall of tabs.

Sundown-town information is preserved. It appears only after the member selects the compact **Show nearby sundown-town history** control. The copy must state that it is documented historical context, **not a current safety rating**. Do not reintroduce the large shortcut strip to provide this control.

Every geocoded business or cultural pin with an MWM detail profile must lead to that internal MWM profile. This includes unclaimed, non-minority-owned, community-listed, and heritage records. Pins without a corresponding profile may retain an informational popover only; do not invent a profile or a route. Address suggestions and duplicate checks remain governed: normalize and suggest a candidate address, show an existing canonical record when one exists, retain provenance, and never silently merge or delete user history.

### 3. Business profile and public social contributions

Keep the mobile and web listing layouts visually appropriate to their device, while mirroring the same behavior and shared record set. The official website must be a prominent, safe, validated action near the top of a listing. Approved public community media belongs in a dedicated **Community media** section near the overview, with a clear count and a safe external-link action.

A contribution is a link to the contributor’s public original post; Mapping with Melanin does not copy the creator’s video. Supported sources remain the existing approved Instagram, TikTok, YouTube, and Vimeo URL paths. A submitted contribution stays **pending** until moderation. It must then appear in the existing admin video-contribution panel, where an authorized moderator can approve or reject it with an auditable decision. Approved contributions must be publicly readable on the matching MWM listing; pending and rejected material must not be public. Verify this full submit → admin queue → approve → listing-display loop with a test account before release.

The label must match the record type. For restaurants and lifestyle venues, community language such as “What it feels like here” may be appropriate. For professional services, use neutral, useful wording such as **Community experience**, **Service experience**, **Practice details**, or **What members report**. Retain the underlying searchable tags; present extra tag groups in a compact expandable section rather than a long initial wall.

### 4. Living Library

Seed the governed 100-topic starter foundation at API startup using the new idempotent seeder. The seed is a discovery foundation, not medical, legal, financial, or other professional advice.

The Library must provide a fuller topic breakdown than Kinfolk chat: concise overview, definitions, population-relevant context when evidence supports it, source-specific “why this matters” notes, citations, connected next-topic links, and article links. For health questions such as fertility, route through the high-stakes policy and reputable-source chain; do not diagnose, promise outcomes, or replace clinician advice. The source-aware article explanations must render on both web and mobile.

HBCU detail profiles include an **HBCU learning & community** entry to a focused Library research query. Separate user contributions into **Academics & Research**, **Student Life**, **Traditions & Events**, **Alumni & Mentorship**, and **Community Connection**. A chemistry or academic query must not show party or homecoming content by default. Community media stays in its selected category, and content remains subject to moderation.

### 5. HBCU and heritage profiles

Retain each cultural site’s own MWM profile. Enriched HBCU profiles use source-linked context about campus identity, institutions, traditions, and surrounding community rather than generic filler. Do not state an unsupported rivalry, business ownership claim, current event, program, or food recommendation as fact. Nearby business candidates are review-only directory records until the protected publication workflow creates a live profile.

### 6. Optional recall and health alerts

The official public-alert feature is consent-first. Users are off by default and can separately opt into recall and health alerts. The scheduled refresh remains fail-closed: CPSC and CDC are the enabled official sources; FDA remains disabled unless separately implemented and tested. Keep the public alert feed, notification preferences, source links, deduplication, and opt-out controls working on web and mobile.

## Required validation gate

Run this from the exact clean release checkout after merge. A failure stops release; do not patch a local binary around it.

```bash
pnpm install --frozen-lockfile --prefer-offline
pnpm run typecheck:libs
pnpm --dir artifacts/api-server run typecheck
pnpm --dir artifacts/web run typecheck
pnpm --dir artifacts/mobile run typecheck
pnpm --dir artifacts/api-server exec vitest run \
  src/businesses/__tests__/publicBusinessDiscoveryPolicy.test.ts \
  src/library/__tests__/livingLibraryResearch.test.ts \
  src/library/__tests__/openAiLibraryWriter.test.ts \
  src/library/__tests__/registerLivingLibraryRoutes.test.ts \
  src/heritage/__tests__/heritageContentCategories.test.ts \
  src/heritage/__tests__/hbcuProfileContext.test.ts
pnpm --dir artifacts/web exec vitest run \
  src/__tests__/business-experience-social-ui.test.ts \
  src/__tests__/map-profile-navigation.test.ts \
  src/__tests__/heritage-content-separation.test.ts
pnpm --dir artifacts/mobile exec vitest run \
  __tests__/business-experience-social-ui.test.ts \
  __tests__/map-clean-surface.test.ts
pnpm --dir artifacts/web run build
pnpm --dir artifacts/api-server run build
pnpm --dir artifacts/mobile run prebuild:ios
pnpm --dir artifacts/mobile run prebuild:android
git diff --check
```

Synchronize the committed web runtime assets from the successful web build before committing the release source:

```bash
find web-static -mindepth 1 -maxdepth 1 -exec rm -rf {} +
find artifacts/api-server/web-static -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a artifacts/web/dist/public/. web-static/
cp -a artifacts/web/dist/public/. artifacts/api-server/web-static/
```

Then confirm static asset parity and run API readiness checks. A GitHub merge is not proof of a Railway deploy:

```bash
diff -qr web-static artifacts/api-server/web-static
curl -fsS https://api.melaninmaps.com/api/version
curl -fsS https://api.melaninmaps.com/api/healthz
curl -fsS https://api.melaninmaps.com/api/readyz
curl -fsS https://api.melaninmaps.com/api/kinfolk/health
```

Record the source SHA and compare it to both `railway_sha` and `built_from_sha`. If the source is newer, deploy the normal API/web service first, recheck the endpoints, and do not say it is live until the identities match.

## Protected directory publication — no manual row-by-row review

The review packages contain source-backed candidates but are not production records. The repository currently contains **33 checksum-pinned review-only manifests with 6,576 raw candidate rows**. That is a staging arithmetic total, not a deduplicated live count. The protected pipeline performs automatic policy classification, holds, cross-package reconciliation, duplicate mapping, and receipt production so the owner does not have to approve hundreds of repeated rows.

The latest HBCU-neighborhood package is included in that set: 31 raw candidate rows, 27 raw held rows, 24 consolidated eligible review rows, one internal exact duplicate, and six exact overlaps with existing review manifests. Its review-only candidate checksum is `b63120df8c3a91a03215a657dbbde84a422e22fea82950dfcf2697d9e6f6fba5`. It is **not live yet**.

### Provisioning prerequisite

1. Create a separate managed PostgreSQL service in the same Railway project, preferably named `directory-review-postgres`.
2. Configure the API service with a private Railway service reference for `DIRECTORY_REVIEW_DATABASE_URL`. This review database must be different from the production business database.
3. Configure the existing scoped service token and HMAC signing secret privately in the operator environment. Do not put values in Git, source files, chat, screenshots, or build logs.
4. Run review migrations and the isolated-review database guard. Keep `DIRECTORY_PUBLICATION_WORKER_ENABLED=false` until review ingress, automatic policy reconciliation, and receipt verification pass.

### Stage every committed review package

With `DIRECTORY_REVIEW_ENABLED=true`, worker still disabled, and operator environment variables present, stage each manifest through the signed ingress utility. This loop stages only; it does not publish businesses.

```bash
set -euo pipefail
: "${DIRECTORY_REVIEW_API_URL:?set the private/public protected API base URL}"
: "${DIRECTORY_REVIEW_SIGNING_SECRET:?configure only in the operator environment}"
: "${DIRECTORY_SERVICE_TOKEN:?configure only in the operator environment}"

mkdir -p /tmp/mwm-directory-ingress-receipts
find data/founder-imports -path '*/review-package/*review-only-candidates.jsonl' -type f | sort | \
while IFS= read -r manifest; do
  package_dir="$(dirname "$manifest")"
  summary="$(find "$package_dir" -maxdepth 1 -type f -name '*summary.json' -print -quit)"
  health="$(find "$package_dir" -maxdepth 1 -type f -name '*destination-health.json' -print -quit)"
  source_name="$(basename "$manifest" .jsonl)"
  test -n "$summary" && test -n "$health"
  node scripts/ingest-signed-directory-review-manifest.mjs \
    --manifest "$manifest" \
    --summary "$summary" \
    --health "$health" \
    --source-name "$source_name" \
    --api "$DIRECTORY_REVIEW_API_URL" \
    | tee "/tmp/mwm-directory-ingress-receipts/${source_name}.json"
done
```

For every receipt, verify the returned row count and checksum. Then run the built-in automatic policy and reconciliation process. It should hold invalid or ambiguous rows; map physical businesses only after a valid numbered address and controlled geocode; retain online-only services as mapless; preserve pre-existing businesses, users, records, and history; and record canonical/superseded mappings rather than deleting duplicates.

Only after review ingress receipts, automatic holds, and duplicate reconciliation are clean, enable **exactly one** worker:

```bash
DIRECTORY_PUBLICATION_WORKER_ENABLED=true
DIRECTORY_PUBLICATION_WORKER_CONCURRENCY=1
```

Do not enable a second worker. Verify durable publication receipts, then test sampled newly published records in all seven paths: website directory search, mobile directory search, website map, mobile map, listing detail, Kinfolk business card, and internal MWM route from a pin. A batch is complete only when receipt counts reconcile and those public paths work. Do not state that a research row is published merely because it was committed or staged.

## EAS builds and TestFlight

After the deployment identity matches the frozen final source SHA and the release gate passes, run:

```bash
cd artifacts/mobile
npx eas build --platform ios --profile production --non-interactive
npx eas submit --platform ios --profile production --latest --non-interactive
npx eas build --platform android --profile production --non-interactive
```

Confirm that iOS is `1.1.9 (112)` and has reached App Store Connect/TestFlight processing. Confirm Android is `1.1.7 (82)` and that its AAB build completed. Do not make a Play submission unless separately instructed. Report these separately: source merge, Railway deployment, directory staging, directory publication receipts, iOS build, TestFlight upload, Android build, and Play submission.

## Release acceptance checklist

- [ ] Website/API source identity matches final GitHub SHA and health endpoints return `200`.
- [ ] Existing waitlist, login, reset, Community, social, and payment routes still work.
- [ ] Kinfolk directly recognizes Kendrick/Drake cultural context, provides factual sourced consensus, and still responds concisely when a short answer is appropriate.
- [ ] Mobile tone settings are discoverable; microphone press shows a permission/recording/transcription status rather than silently doing nothing.
- [ ] Maps preserve typed city and record search, show HBCUs/markets through search, remove crowded strips, retain selected historical sundown-town context, and send profiled pins to MWM details.
- [ ] Official website appears near the top of web and mobile listing profiles.
- [ ] A public-video test submission reaches the moderation queue; an approved test contribution appears on the matching listing; no pending material is public.
- [ ] HBCU academic, student-life, tradition, alumni/mentorship, and community contribution views remain separated.
- [ ] Library starter topics are seeded idempotently; health topics use the high-stakes source policy and show linked source explanations on web and mobile.
- [ ] Directory review database is isolated; ingress receipts, holds, duplicate mappings, and publication receipts are saved; no database reset or bulk deletion occurred.
- [ ] iOS 112 is uploaded to TestFlight; Android 82 is built; no extra or duplicate iOS build number is attempted.
