#!/usr/bin/env bash
# Mapping With Melanin — surgical release executor for iOS 1.1.9 (114)
# and Android 1.1.7 (84). This script does NOT edit application code, delete
# data, publish directory records, or weaken source/consent/moderation guards.
#
# Required environment: an authenticated EAS CLI session with the existing
# project credentials. Never echo secrets, connection strings, service tokens,
# or provider keys.
#
# Usage from repository root:
#   RELEASE_SHA=<full GitHub main SHA> bash scripts/replit-release-113-83.sh prepare
#   # review and commit only generated static assets, then use the resulting SHA:
#   RELEASE_SHA=<full final GitHub main SHA> bash scripts/replit-release-113-83.sh verify
#   RELEASE_SHA=<full final GitHub main SHA> bash scripts/replit-release-113-83.sh build
#
# `build` starts both store builds. It automatically submits iOS to the existing
# TestFlight submit profile after the artifact succeeds. Android produces a
# production AAB but intentionally does not submit to Google Play because this
# repository has no reviewed Android submit profile or requested release track.

set -euo pipefail

MODE="${1:-}"
case "$MODE" in
  prepare|verify|build) ;;
  *)
    printf '%s\n' 'Usage: RELEASE_SHA=<full GitHub main SHA> bash scripts/replit-release-113-83.sh prepare|verify|build' >&2
    exit 64
    ;;
esac

: "${RELEASE_SHA:?Set RELEASE_SHA to the exact full GitHub main SHA.}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() {
  printf 'RELEASE_114_84_FAIL: %s\n' "$*" >&2
  exit 1
}

require_exact_clean_source() {
  git fetch origin --prune
  local head main
  head="$(git rev-parse HEAD)"
  main="$(git rev-parse origin/main)"
  [ "$head" = "$RELEASE_SHA" ] || fail "HEAD $head does not equal RELEASE_SHA $RELEASE_SHA"
  [ "$main" = "$RELEASE_SHA" ] || fail "origin/main $main does not equal RELEASE_SHA $RELEASE_SHA"
  [ -z "$(git status --porcelain)" ] || fail "release checkout is dirty; commit reviewed source/static assets first"
  [ "$(jq -r '.expo.ios.buildNumber' artifacts/mobile/app.json)" = "114" ] || fail "iOS build number must remain 114"
  [ "$(jq -r '.expo.android.versionCode' artifacts/mobile/app.json)" = "84" ] || fail "Android versionCode must remain 84"
  [ "$(jq -r '.expo.ios.supportsTablet' artifacts/mobile/app.json)" = "true" ] || fail "iPad support must remain enabled"
  [ "$(jq -r '.expo.ios.infoPlist.UIRequiresFullScreen' artifacts/mobile/app.json)" = "false" ] || fail "iPad multitasking must remain enabled"
}

require_live_production_api() {
  local version railway_sha built_from_sha
  version="$(curl --connect-timeout 10 --max-time 30 -fsS "https://api.melaninmaps.com/api/version?release_identity_probe=$(date +%s)")" \
    || fail "production API version endpoint is unavailable"
  railway_sha="$(printf '%s' "$version" | jq -r '.railway_sha // empty')"
  built_from_sha="$(printf '%s' "$version" | jq -r '.built_from_sha // empty')"
  [ "$railway_sha" = "$RELEASE_SHA" ] || fail "production Railway SHA $railway_sha does not match release SHA $RELEASE_SHA"
  [ "$built_from_sha" = "$RELEASE_SHA" ] || fail "production compiled source SHA $built_from_sha does not match release SHA $RELEASE_SHA"
  curl --connect-timeout 10 --max-time 30 -fsS https://api.melaninmaps.com/api/healthz >/dev/null \
    || fail "production health check failed"
  curl --connect-timeout 10 --max-time 30 -fsS https://api.melaninmaps.com/api/readyz >/dev/null \
    || fail "production readiness check failed"
  curl --connect-timeout 10 --max-time 30 -fsS https://api.melaninmaps.com/api/kinfolk/health >/dev/null \
    || fail "production Kinfolk health check failed"
}

case "$MODE" in
  prepare)
    require_exact_clean_source
    RELEASE_SHA="$RELEASE_SHA" bash scripts/run-build-113-83-requirements-gate.sh --prepare-static
    node scripts/verify-release-artifacts.mjs
    printf '%s\n' 'PREPARE_PASS: inspect the diff. Only synchronized web-static and artifacts/api-server/web-static files may be generated. Commit them only after review, then rerun this script with that new main SHA in verify mode.'
    ;;

  verify)
    require_exact_clean_source
    RELEASE_SHA="$RELEASE_SHA" bash scripts/run-build-113-83-requirements-gate.sh --verify-final
    node scripts/verify-release-artifacts.mjs
    printf 'VERIFY_PASS: exact_sha=%s ios=1.1.9(114) android=1.1.7(84)\n' "$RELEASE_SHA"
    ;;

  build)
    require_exact_clean_source
    RELEASE_SHA="$RELEASE_SHA" bash scripts/run-build-113-83-requirements-gate.sh --verify-final
    node scripts/verify-release-artifacts.mjs
    require_live_production_api

    cd artifacts/mobile
    pnpm exec eas whoami >/dev/null || fail "EAS is not authenticated; authenticate in the existing owner account without exposing credentials"
    pnpm exec eas project:info >/dev/null || fail "EAS project identity could not be verified"

    # iOS build 114: production API, exact source gate, then TestFlight submission.
    pnpm exec eas build \
      --platform ios \
      --profile production \
      --auto-submit-with-profile production \
      --what-to-test 'Build 114: server-owned Kinfolk voice with four delivery profiles and record-discard control; strict private Support Lens across directory, map, and Kinfolk; source-receipted governed directory staging controls; Library research, Community recovery, locality-first maps, and typo/collective-opinion handling. Verify fresh production API identity and microphone playback on a physical device.' \
      --clear-cache \
      --freeze-credentials \
      --no-wait \
      --non-interactive \
      --json > "$ROOT/release-eas-ios-114.json"

    # Android code 84: production AAB only. Do not guess a Play Console track
    # or mutate Google Play access; a deliberate reviewed Play submission uses
    # the artifact ID after this build succeeds.
    pnpm exec eas build \
      --platform android \
      --profile production-android \
      --clear-cache \
      --freeze-credentials \
      --no-wait \
      --non-interactive \
      --json > "$ROOT/release-eas-android-84.json"

    printf '%s\n' 'BUILD_STARTED: iOS TestFlight auto-submit was requested; Android production AAB build was requested. Record the JSON build IDs, wait for completed artifacts, then audit fresh binaries on real devices before claiming availability.'
    ;;
esac
