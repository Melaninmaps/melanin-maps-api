#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"

usage() {
  printf '%s\n' \
    'Build 106 safe release entrypoint' \
    '' \
    'No action is taken without an explicit mode. No-argument and help execution are offline.' \
    '' \
    'Usage:' \
    '  MWM_BUILD106_SOURCE_SHA=<reviewed-40-char-sha> scripts/release-build-106.sh ios-testflight-staging' \
    '' \
    'Authorized action: iOS Build 106 using testflight-staging and frozen remote signing.' \
    'Blocked: production profiles, Android, EAS Update, App Review, and signing changes.'
}

fail() { printf 'BUILD_106_BLOCKED: %s\n' "$*" >&2; exit 1; }
pass() { printf 'PASS: %s\n' "$*"; }

if [[ -z "$MODE" ]]; then
  usage >&2
  exit 64
fi
if [[ "$MODE" == "help" || "$MODE" == "--help" || "$MODE" == "-h" ]]; then
  usage
  exit 0
fi
[[ $# -eq 1 && "$MODE" == "ios-testflight-staging" ]] || {
  usage >&2
  fail "only ios-testflight-staging is authorized"
}

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_DIR="${SCRIPT_PATH%/*}"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE="$ROOT/artifacts/mobile"
EXPECTED_SHA="${MWM_BUILD106_SOURCE_SHA:-}"
STAGING_DOMAIN="mwm-staging.35.196.78.19.nip.io"
STAGING_ORIGIN="https://$STAGING_DOMAIN"
EXPORT_DIR=""
PUBLIC_CONFIG=""
INTROSPECT_CONFIG=""
PROJECT_ENV_OUTPUT=""
ACCOUNT_ENV_OUTPUT=""
ARCHIVE_DIR=""
cleanup() {
  [[ -z "$EXPORT_DIR" ]] || rm -rf -- "$EXPORT_DIR"
  [[ -z "$PUBLIC_CONFIG" ]] || rm -f -- "$PUBLIC_CONFIG"
  [[ -z "$INTROSPECT_CONFIG" ]] || rm -f -- "$INTROSPECT_CONFIG"
  [[ -z "$PROJECT_ENV_OUTPUT" ]] || rm -f -- "$PROJECT_ENV_OUTPUT"
  [[ -z "$ACCOUNT_ENV_OUTPUT" ]] || rm -f -- "$ACCOUNT_ENV_OUTPUT"
  [[ -z "$ARCHIVE_DIR" ]] || rm -rf -- "$ARCHIVE_DIR"
}
trap cleanup EXIT

[[ "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "set MWM_BUILD106_SOURCE_SHA to the exact reviewed 40-character lowercase commit SHA"

cd "$ROOT"
[[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" ]] || fail "checkout SHA does not equal the reviewed SHA"
[[ -z "$(git status --porcelain --untracked-files=all)" ]] || fail "working tree is not clean"
pass "clean exact reviewed source $EXPECTED_SHA"

node "$ROOT/scripts/validate-build-106-staging.cjs"
pass "Build 106 static staging/TestFlight policy"

pnpm install --frozen-lockfile
[[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" && -z "$(git status --porcelain --untracked-files=all)" ]] || fail "locked install changed the reviewed checkout"
pnpm run typecheck
pnpm --filter @workspace/mobile run test
pnpm --filter @workspace/mobile run audit
pnpm --filter @workspace/mobile run lint
pass "frozen install, typechecks, mobile tests, audit, and lint"

export EXPO_PUBLIC_DOMAIN="$STAGING_DOMAIN"
export EXPO_PUBLIC_API_ORIGIN="$STAGING_ORIGIN"
export EXPO_PUBLIC_APP_ENV="staging"
export EXPO_PUBLIC_RELEASE_CHANNEL="testflight-staging"
export EXPO_PUBLIC_APP_ENV="staging"
export APP_ENV="staging"
export MWM_RELEASE_CHANNEL="testflight-staging"
export APP_RELEASE_CHANNEL="testflight-staging"
export MWM_BUILD_COMMIT_SHA="$EXPECTED_SHA"
unset EXPO_PUBLIC_API_URL
unset EXPO_PUBLIC_REVENUECAT_IOS_API_KEY EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY EXPO_PUBLIC_REVENUECAT_TEST_API_KEY

cd "$MOBILE"
pnpm run prebuild:ios
PUBLIC_CONFIG="$(mktemp)"
INTROSPECT_CONFIG="$(mktemp)"
EXPORT_DIR="$(mktemp -d)"
pnpm exec expo config --type public --json > "$PUBLIC_CONFIG"
pnpm exec expo config --type introspect --json > "$INTROSPECT_CONFIG"
pnpm exec expo export --platform ios --no-bytecode --output-dir "$EXPORT_DIR" --clear
node "$ROOT/scripts/validate-build-106-expo-output.cjs" \
  "$PUBLIC_CONFIG" "$INTROSPECT_CONFIG" "$EXPORT_DIR" "$EXPECTED_SHA"
pass "Expo public config, native introspection, and iOS export prove staging runtime origin"

cd "$ROOT"
node "$ROOT/scripts/validate-build-106-staging.cjs"
[[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" && -z "$(git status --porcelain --untracked-files=all)" ]] || fail "source identity changed before EAS"
cd "$MOBILE"
PROJECT_ENV_OUTPUT="$(mktemp)"
ACCOUNT_ENV_OUTPUT="$(mktemp)"
NO_COLOR=1 pnpm exec eas env:list testflight-staging --scope project --format short > "$PROJECT_ENV_OUTPUT"
NO_COLOR=1 pnpm exec eas env:list testflight-staging --scope account --format short > "$ACCOUNT_ENV_OUTPUT"
node "$ROOT/scripts/validate-build-106-eas-environment.cjs" "$PROJECT_ENV_OUTPUT" "$ACCOUNT_ENV_OUTPUT"
pass "dedicated EAS environment contains zero project or account variables"

ARCHIVE_DIR="$(mktemp -d)"
pnpm exec eas build:inspect \
  --platform ios \
  --stage archive \
  --profile testflight-staging \
  --output "$ARCHIVE_DIR" \
  --force
node "$ROOT/scripts/validate-build-106-archive.cjs" "$ARCHIVE_DIR"
cd "$ROOT"
[[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" && -z "$(git status --porcelain --untracked-files=all)" ]] || fail "archive inspection changed the reviewed source"
pass "local EAS archive contains no credential or signing artifacts"

cd "$MOBILE"
pnpm exec eas build \
  --platform ios \
  --profile testflight-staging \
  --non-interactive \
  --freeze-credentials \
  --auto-submit-with-profile testflight-staging

printf '\nIOS_BUILD_106_UPLOADED_TO_TESTFLIGHT. App Review was not started.\n'
printf 'POST_UPLOAD_ACCEPTANCE_PENDING: install the processed TestFlight candidate on physical tester devices and record acceptance separately.\n'
