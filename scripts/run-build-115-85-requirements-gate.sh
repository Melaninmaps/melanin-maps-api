#!/usr/bin/env bash
# Requirements-to-proof source/artifact gate. Defaults to the complete 124/94
# repair release while retaining prior reviewed pairs for reproducible checks.
#
# Usage:
#   bash scripts/run-build-115-85-requirements-gate.sh --prepare-static
#   RELEASE_SHA=<full_sha> bash scripts/run-build-115-85-requirements-gate.sh --verify-final
#
# --prepare-static runs the full source gate then synchronizes the generated web
# runtime assets. Review and commit that generated asset diff with the source.
# --verify-final refuses a dirty checkout so that the build is demonstrably from
# one committed SHA. It does not deploy, publish a directory batch, or submit
# a native binary. Those operations require their own recorded evidence.

set -euo pipefail

MODE="${1:-}"
case "$MODE" in
  --prepare-static|--verify-final) ;;
  *)
    printf '%s\n' 'Usage: bash scripts/run-build-115-85-requirements-gate.sh --prepare-static|--verify-final' >&2
    exit 64
    ;;
esac

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

EXPECTED_IOS_BUILD="${EXPECTED_IOS_BUILD:-124}"
EXPECTED_ANDROID_CODE="${EXPECTED_ANDROID_CODE:-94}"
if [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "115/85" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "116/86" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "117/87" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "118/88" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "119/89" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "120/90" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "121/91" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "122/92" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "123/93" ] &&
   [ "$EXPECTED_IOS_BUILD/$EXPECTED_ANDROID_CODE" != "124/94" ]; then
  printf '%s\n' 'Unsupported release identifier pair' >&2
  exit 64
fi

fail() {
  printf 'BUILD_%s_%s_REQUIREMENTS_GATE_FAIL: %s\n' "$EXPECTED_IOS_BUILD" "$EXPECTED_ANDROID_CODE" "$*" >&2
  exit 1
}

check_authored_source_whitespace() {
  # Vite's generated, minified static bundles may contain formatting that trips
  # git's text-oriented whitespace detector. They are separately protected by
  # byte-for-byte parity; authored source must remain whitespace-clean.
  git diff --check -- \
    . \
    ':(exclude)web-static' \
    ':(exclude)artifacts/api-server/web-static'
}

SHA="$(git rev-parse HEAD)"
if [ -n "${RELEASE_SHA:-}" ] && [ "$SHA" != "$RELEASE_SHA" ]; then
  fail "HEAD $SHA does not equal RELEASE_SHA $RELEASE_SHA"
fi

for generated_runtime_artifact in \
  artifacts/api-server/dist/index.mjs \
  artifacts/api-server/dist/BUILD_IDENTITY
do
  if git ls-files --error-unmatch "$generated_runtime_artifact" >/dev/null 2>&1; then
    fail "$generated_runtime_artifact must not be tracked; Railway's final COPY would overwrite the fresh build"
  fi
done

if [ "$MODE" = "--verify-final" ]; then
  [ -z "$(git status --porcelain)" ] || fail "final verification requires a clean checkout"
fi

printf 'BUILD_%s_%s_REQUIREMENTS_GATE\n' "$EXPECTED_IOS_BUILD" "$EXPECTED_ANDROID_CODE"
printf 'mode=%s\nsha=%s\n' "$MODE" "$SHA"
printf 'ios=1.1.9 (%s); android=1.1.7 (%s)\n' \
  "$(jq -r '.expo.ios.buildNumber' artifacts/mobile/app.json)" \
  "$(jq -r '.expo.android.versionCode' artifacts/mobile/app.json)"

[ "$(jq -r '.expo.ios.buildNumber' artifacts/mobile/app.json)" = "$EXPECTED_IOS_BUILD" ] || fail "iOS build must be $EXPECTED_IOS_BUILD"
[ "$(jq -r '.expo.android.versionCode' artifacts/mobile/app.json)" = "$EXPECTED_ANDROID_CODE" ] || fail "Android versionCode must be $EXPECTED_ANDROID_CODE"
[ "$(jq -r '.expo.ios.supportsTablet' artifacts/mobile/app.json)" = "true" ] || fail "iPad support must remain enabled"
[ "$(jq -r '.expo.ios.infoPlist.UIRequiresFullScreen' artifacts/mobile/app.json)" = "false" ] || fail "iPad multitasking must remain enabled"
node scripts/validate-android-eas-jdk17.cjs || fail "Android EAS Java 17 image configuration is invalid"

check_authored_source_whitespace
pnpm install --frozen-lockfile --prefer-offline
pnpm run typecheck:libs
pnpm --dir artifacts/api-server run typecheck
pnpm --dir artifacts/web run typecheck
pnpm --dir artifacts/mobile run typecheck

pnpm --dir artifacts/api-server exec vitest run \
  src/__tests__/compiled-build-identity.test.ts \
  src/__tests__/community-feed.test.ts \
  src/__tests__/community-feed-schema-guard.test.ts \
  src/__tests__/kinfolk-mobile-continuity-contract.test.ts \
  src/__tests__/directory-import-publication.test.ts \
  src/__tests__/directory-publication.test.ts \
  src/__tests__/founder-business-discoverability-contract.test.ts \
  src/__tests__/canonical-vibes-contract.test.ts \
  src/__tests__/community-experience-contract.test.ts \
  src/__tests__/business-experience-social-contract.test.ts \
  src/lib/__tests__/business-merge-audit-schema.test.ts \
  src/lib/__tests__/publication-schema-diagnostics.test.ts \
  src/map/__tests__/essentialServices.test.ts \
  src/map/__tests__/registerLocalBusinessSearchRoute.test.ts \
  src/library/__tests__/librarySearch.test.ts \
  src/library/__tests__/livingLibraryResearch.test.ts \
  src/library/__tests__/registerLivingLibraryRoutes.test.ts \
  src/kinfolk/__tests__/city-briefing.test.ts \
  src/kinfolk/__tests__/collective-opinion-policy.test.ts \
  src/kinfolk/__tests__/english-query-recovery-policy.test.ts \
  src/kinfolk/__tests__/image-creation-safety.test.ts \
  src/kinfolk/__tests__/lean-general-chat.test.ts \
  src/kinfolk/__tests__/consented-planning-context.test.ts \
  src/kinfolk/__tests__/current-research.test.ts \
  src/kinfolk/__tests__/source-relevance.test.ts \
  src/kinfolk/__tests__/contextual-evidence-safety.test.ts \
  src/kinfolk/__tests__/voice-delivery.test.ts \
  src/kinfolk/__tests__/audio-inspection.test.ts \
  src/kinfolk/__tests__/transcription-handler.test.ts \
  src/__tests__/kinfolk-server-voice-contract.test.ts \
  src/__tests__/admin-business-inventory-controls.test.ts \
  src/routes/__tests__/waitlist-unified-contract.test.ts \
  src/kinfolk/__tests__/designation-predicate-policy.test.ts \
  src/businesses/__tests__/mwmCoreDiscoveryPolicy.test.ts \
  src/kinfolk/__tests__/governed-business-repository.test.ts \
  src/routes/__tests__/universal-search-hotfix.test.ts

node scripts/test-mwm-core-evidence-lanes.mjs
node scripts/test-mwm-core-source-policy.mjs
node scripts/test-mwm-core-publication-manifest.mjs

pnpm exec vitest run \
  lib/constants/src/map-discovery.test.ts \
  artifacts/web/src/__tests__/business-experience-social-ui.test.ts \
  artifacts/web/src/__tests__/kinfolk-audit-repairs.test.ts \
  artifacts/web/src/__tests__/kinfolk-city-briefing-entry.test.ts \
  artifacts/web/src/__tests__/living-library-research.test.ts \
  artifacts/web/src/__tests__/community-feed-error-state.test.ts \
  artifacts/web/src/__tests__/waitlist-and-phone-recovery-contract.test.ts \
  artifacts/web/src/__tests__/map-discovery-card.test.ts \
  artifacts/web/src/__tests__/map-locality-first.test.ts \
  artifacts/web/src/__tests__/essential-services-map.test.ts \
  artifacts/web/src/__tests__/map-profile-navigation.test.ts \
  artifacts/mobile/__tests__/adaptive-platform-config.test.ts \
  artifacts/mobile/__tests__/ios-background-audio-config.test.ts \
  artifacts/mobile/__tests__/community-feed-recovery.test.ts \
  artifacts/mobile/__tests__/community-map-voice-regressions.test.ts \
  artifacts/mobile/__tests__/community-content-first.test.ts \
  artifacts/mobile/__tests__/business-experience-social-ui.test.ts \
  artifacts/mobile/__tests__/kinfolk-audit-repairs.test.ts \
  artifacts/mobile/__tests__/cross-client-social-records.test.ts \
  artifacts/mobile/__tests__/library-research.test.ts \
  artifacts/mobile/__tests__/navigation-visibility.test.ts \
  artifacts/mobile/__tests__/waitlist-and-phone-recovery-contract.test.ts \
  artifacts/mobile/__tests__/map-clean-surface.test.ts \
  artifacts/mobile/__tests__/map-discovery-card.test.ts \
  artifacts/mobile/__tests__/business-discovery-contract.test.ts \
  artifacts/mobile/__tests__/map-locality-first.test.ts \
  artifacts/mobile/__tests__/map-kinfolk-continuity.test.ts \
  artifacts/mobile/__tests__/essential-services-map.test.ts

pnpm --dir artifacts/web run build

# The API fallback page is generated from artifacts/api-server/web-static during
# its build. Synchronize reviewed Vite output first, otherwise direct API SPA
# fallbacks can embed the previous asset hash while the public static server
# serves the new one.
if [ "$MODE" = "--prepare-static" ]; then
  find web-static -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  find artifacts/api-server/web-static -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a artifacts/web/dist/public/. web-static/
  cp -a artifacts/web/dist/public/. artifacts/api-server/web-static/
fi

pnpm --dir artifacts/api-server run build

node scripts/validate-runtime-static-bundle-sync.cjs
node scripts/verify-release-artifacts.mjs

# API bundles and their generated identity source are build products. Validate
# them above, then restore them so whitespace inside a minified bundle cannot
# be mistaken for an application-source change. The synchronized web static
# assets intentionally remain for review/commit in --prepare-static mode.
git restore artifacts/api-server/dist artifacts/api-server/src/generated/buildIdentity.ts
git clean -fd artifacts/api-server/dist
git restore artifacts/web/dist
git clean -fd artifacts/web/dist

if [ "$MODE" = "--verify-final" ]; then
  pnpm --dir artifacts/mobile run prebuild:ios
  pnpm --dir artifacts/mobile run prebuild:android
else
  printf '%s\n' 'PREPARE_STATIC_PASS: review and commit the generated static/source diff, then rerun --verify-final from the clean final SHA for native prebuild guards.'
fi
check_authored_source_whitespace

printf 'BUILD_%s_%s_REQUIREMENTS_GATE_PASS: sha=%s mode=%s\n' "$EXPECTED_IOS_BUILD" "$EXPECTED_ANDROID_CODE" "$SHA" "$MODE"
printf '%s\n' 'NEXT: commit reviewed source/static assets, rerun --verify-final from clean final SHA, deploy API/web, then collect live and device evidence. No EAS build or directory publication is implied by this pass.'
