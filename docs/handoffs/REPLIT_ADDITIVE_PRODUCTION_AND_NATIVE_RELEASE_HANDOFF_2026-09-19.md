# Mapping with Melanin™ Additive Production and Native Release Handoff

**Author:** Manus AI
**Date:** September 19, 2026
**Repository:** `Melaninmaps/melanin-maps-api`
**Release rule:** Build and deploy only from the exact `origin/main` commit captured immediately before the commands run. Do not release from a local branch, cached build output, a preview environment, or an older commit.[1]

## Release decision

This handoff requires an **additive release only**. Do not remove, replace, or simplify an existing capability to make a new screen, test, or build pass. The product remains an everyday-life and travel Green Book. Kinfolk remains a warm general-purpose assistant with grounded source links, article-summary actions, practical next steps, and private answer-level feedback. Community, Library, Map, Discovery, business-owner, safety, profile, payment, and account experiences must all remain available.

The next native release must include **both** platforms. The repository already declares the requested identifiers. Do not change them unless a newer binary has already been uploaded and the release owner has explicitly approved a new number.

| Platform | Required marketing version | Required build identifier | Current configured value |
|---|---:|---:|---|
| iOS | `1.1.9` | Build `111` | `expo.version = 1.1.9`; `expo.ios.buildNumber = 111` |
| Android | `1.1.7` | `versionCode = 81` | `expo.android.version = 1.1.7`; `expo.android.versionCode = 81` |

## Non-negotiable preservation requirements

The release must preserve authentication, email login, password reset, tester-password behavior, temporary-password change prompts, user records, account approval, sessions, and all existing authorization boundaries. Do not create, alter, delete, revoke, merge, or bulk-modify users during deployment or native builds.

The only waitlist behavior in scope is the existing **combined website-admin view** for app and website waitlist entries. Do not change waitlist uploads, access status, membership eligibility, or individual waitlist records.

Preserve Community posts and media, including public social embeds when safely allowed; direct messages; circles; saves; follows; blocks; profile edit/image upload; comments and moderation/privacy controls; and business-owner flows. Preserve profile settings, activity, friends/follow relationships, saved places, circles, business capability, and privacy choices. Do not remove working content in order to change a layout.

Preserve Kinfolk’s general chat, everyday-life and travel discovery, cited sources, linked-article summary action, article links, contextual next steps, Helpful/Not helpful feedback, and the optional private response-feedback note. Keep Library distinct as source-governed group research. Preserve typo-tolerant search, locality-first map behavior, listing detail click-through, official customer links, and map-pin behavior for already approved records.

## Source capture and clean checkout

Run these commands from the repository root. Record the resulting SHA in the Railway deployment log and both native-build records. This SHA is the only valid release source identifier.

```bash
git fetch origin --prune
git checkout main
git reset --hard origin/main
RELEASE_SHA="$(git rev-parse HEAD)"
printf 'RELEASE_SHA=%s\n' "$RELEASE_SHA"
git log -12 --oneline
```

The release source must include the merged Kinfolk exact-cited-article retrieval repair, the current static web-runtime refresh, and all previously merged additive product changes. GitHub merge alone is not a public website deployment, directory publication, native build, upload, store submission, or store release.

## Web and API deployment

Use the existing `nixpacks.toml` clean-build sequence. It removes only generated web output before rebuilding it from source. It does **not** remove source code, users, passwords, sessions, waitlist data, production listings, or database records.

```bash
corepack enable
pnpm install --frozen-lockfile
rm -rf artifacts/web/dist artifacts/api-server/web-static
pnpm --filter @workspace/web run build
mkdir -p artifacts/api-server/web-static
cp -R artifacts/web/dist/public/. artifacts/api-server/web-static/
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
```

Deploy the exact recorded `RELEASE_SHA` to the production Railway service. After Railway reports success, verify the deployed runtime rather than trusting the GitHub merge:

```bash
API='https://api.melaninmaps.com'
WEB='https://www.mappingwithmelanin.com'

curl -fsS "$API/api/version"
curl -fsS "$API/api/healthz"
curl -fsS "$API/api/readyz"
curl -fsS "$API/api/kinfolk/health"
curl -fsS "$WEB/kinfolk" | grep -Eo '/assets/index-[A-Za-z0-9_-]+\.js' | head -1
```

The deployment passes only when the API reports healthy responses, `/api/version` reports the intended source SHA or a deliberately later release SHA, and the served web asset is the fresh asset generated from that same source. Then run a real browser check of Kinfolk article summary, Community feed, profile viewport/edit controls, map locality-first behavior, Library rendering, typo clarification, and Kinfolk answer feedback.

## Directory publication is a separate protected operation

The repository now contains research-only review packages for the Northeast core, Minneapolis, Houston, and Allentown/Lehigh Valley. These packages are **not** database imports and are not public merely because their pull requests are merged.

Do not bulk import GitHub data, run raw SQL against production, create pins automatically, or overwrite an existing listing. Use the authorized reviewer environment and the source-backed inventory publication runbook. For each intended manifest, verify its checksum, reconcile it against current live records, hold `needs_research` records, route regulated/resource/cultural entries correctly, review official customer destinations, and geocode only reviewer-approved physical business records.

Once a record is approved and published through the API, it can appear dynamically in web and mobile search, map, discovery, and authenticated Kinfolk recommendations. **Directory publication does not require a new iOS or Android binary.** The native build is needed for merged mobile code changes, not for each later approved directory record.

## Native production build: both platforms are required

Use `artifacts/mobile/eas.json` profile `production`. It already sets the production API origin to `https://api.melaninmaps.com`, website domain to `www.mappingwithmelanin.com`, and production application environment. Do not substitute the staging host, a Replit preview host, or any development origin.

Before starting either build, confirm the final checked-out source and release identifiers:

```bash
cd artifacts/mobile
jq '{version: .expo.version, iosBuild: .expo.ios.buildNumber, androidVersion: .expo.android.version, androidVersionCode: .expo.android.versionCode}' app.json
pnpm run prebuild:ios
pnpm run prebuild:android
```

The expected output is iOS `1.1.9` / `111` and Android `1.1.7` / `81`. The prebuild scripts must pass before either build begins. They are designed to stop a duplicate or misconfigured release.

Build both production artifacts from the same recorded `RELEASE_SHA`:

```bash
# Run from artifacts/mobile after all release gates pass.
pnpm exec eas build --platform ios --profile production
pnpm exec eas build --platform android --profile production
```

Do not call either build a release until its result is separately recorded. A successful EAS build means an artifact was created. It does **not** mean it was uploaded, submitted to App Store Connect or Google Play, accepted for tester distribution, approved, or released to the public.

Before a later submission, re-check the Apple and Google consoles for a newer existing build number. If another build has been uploaded, stop and obtain a new explicit version decision rather than trying to reuse `111` or `81`.

## External payment links

Native membership, renewal, upgrade, family-seat, business-membership, promotion, and Shop entry points must continue to route through the fixed authenticated Mapping with Melanin website destinations. The app must not create Stripe checkout or portal sessions, expose Stripe identifiers, or place user/session data in a browser URL.

The external-payment flags must remain disabled unless the release owner has confirmed current platform-program eligibility, storefront scope, disclosures, entitlement/configuration, and reporting requirements. Do not set either value simply to make a link appear:

```bash
# Set only after the applicable platform approval/compliance review.
EXPO_PUBLIC_IOS_EXTERNAL_WEB_PAYMENT_APPROVED=1
EXPO_PUBLIC_ANDROID_EXTERNAL_WEB_PAYMENT_APPROVED=1
```

If either flag is absent or not `1`, retain the existing safe website guidance instead of bypassing platform requirements. Review current Apple and Google policy before changing this decision.[2] [3]

## Required validation gate

Run these checks from the exact release checkout. A failure stops the release. Fix the failure additively; do not delete or weaken a working product behavior to make a test pass.

```bash
# Repository root
pnpm install --frozen-lockfile
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/web run typecheck
pnpm --filter @workspace/mobile run typecheck
pnpm --filter @workspace/mobile test
pnpm --filter @workspace/web run build
pnpm --filter @workspace/api-server run build
node scripts/verify-release-artifacts.mjs
git diff --check

# Mobile production origin guard
pnpm --dir artifacts/mobile exec vitest run __tests__/api-origin.test.ts
```

Perform the following manual acceptance checks on both iOS and Android before tester distribution. Confirm email login; reset password; tester login; temporary-password prompt/change; approved and unapproved account states; session persistence; combined website-admin waitlist display; profile edit/settings/image flow; privacy toggle; DMs; circles; saves; Community post/media rendering; search with a sensible typo; local map first-load; a listing detail and official link; Kinfolk general chat; a cited Kinfolk source; the exact-article summary action; Helpful/Not helpful plus optional feedback note; Library research; and website payment navigation behavior.

## Release record and exit criteria

Create one release record with the source SHA, Railway deployment ID, `/api/version` response, web-asset name, iOS EAS build URL/ID, Android EAS build URL/ID, tester-distribution status, and any store-submission status. Do not mark a platform as released based on a build log alone.

The release is ready for testers only after the production API is healthy, the deployed runtime matches the intended source, the web acceptance checks pass, both native artifacts are complete from the same source, the native acceptance checks pass, and both artifacts are made available through their appropriate tester channels.

## Minimal-change instruction for Replit

No new feature rewrite is required for this handoff. The requested version numbers and production EAS profile are already present in source. Replit’s required work is to use the exact latest `origin/main`, execute the clean web/API build, preserve all existing behaviors, run the release gates, build **both** platforms, and keep directory publication as a separately authorized protected-review operation.

## References

[1]: https://github.com/Melaninmaps/melanin-maps-api "Mapping with Melanin source repository"
[2]: https://developer.apple.com/app-store/review/guidelines/ "Apple App Review Guidelines"
[3]: https://developer.android.com/google/play/billing/externalpaymentlinks/integration "Google Play external payment links integration"
