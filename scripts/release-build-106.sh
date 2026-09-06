#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-verify}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE="$ROOT/artifacts/mobile"
PRODUCTION_URL="https://www.mappingwithmelanin.com"
EXPECTED_SHA="${MWM_BUILD106_SOURCE_SHA:-}"
TEST_DB_SECRET="${MWM_RELEASE_TEST_DATABASE_URL:-}"
PRODUCTION_DB_FINGERPRINT_SECRET="${MWM_PRODUCTION_DATABASE_FINGERPRINT:-}"
TESTER_EMAIL_SECRET="${MWM_RELEASE_TESTER_EMAIL:-}"
TESTER_PASSWORD_SECRET="${MWM_RELEASE_TESTER_PASSWORD:-}"
unset MWM_RELEASE_TEST_DATABASE_URL MWM_PRODUCTION_DATABASE_FINGERPRINT MWM_RELEASE_TESTER_EMAIL MWM_RELEASE_TESTER_PASSWORD
export -n TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET
unset TOKEN
PROJECT_ID="0f873107-7787-46ab-9a04-685c2a6756b1"
APP_ID="com.melaninmaps.app"
VERIFY_DIR=""
BUILD_DIR=""
TEMP_FILES=()

fail() { printf 'BUILD_106_BLOCKED: %s\n' "$*" >&2; exit 1; }
pass() { printf 'PASS: %s\n' "$*"; }
require_file() { [[ -f "$1" ]] || fail "missing required release contract: ${1#$ROOT/}"; }
cleanup() {
  if [[ -n "$VERIFY_DIR" ]]; then git -C "$ROOT" worktree remove --force "$VERIFY_DIR" >/dev/null 2>&1 || true; fi
  if [[ -n "$BUILD_DIR" ]]; then git -C "$ROOT" worktree remove --force "$BUILD_DIR" >/dev/null 2>&1 || true; fi
  if ((${#TEMP_FILES[@]})); then rm -f -- "${TEMP_FILES[@]}"; fi
  unset TOKEN TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET
}
trap cleanup EXIT

[[ "$MODE" =~ ^(verify|ios-testflight|android-build)$ ]] || fail "usage: $0 verify|ios-testflight|android-build"
[[ -n "$EXPECTED_SHA" && "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "set MWM_BUILD106_SOURCE_SHA to the exact reviewed 40-character lowercase commit SHA"
[[ -n "$TEST_DB_SECRET" ]] || fail "set MWM_RELEASE_TEST_DATABASE_URL to an isolated migrated release-test database"
[[ "$PRODUCTION_DB_FINGERPRINT_SECRET" =~ ^[0-9a-f]{64}$ ]] || fail "set the reviewed production database identity fingerprint; release cannot prove database isolation without it"
[[ -n "$TESTER_EMAIL_SECRET" && -n "$TESTER_PASSWORD_SECRET" ]] || fail "secure release tester credentials are required in environment secrets"

cd "$ROOT"
[[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" ]] || fail "checkout SHA does not equal MWM_BUILD106_SOURCE_SHA"
[[ -z "$(git status --porcelain)" ]] || fail "working tree is not clean"
[[ "$(git branch --show-current)" == "main" ]] || fail "store builds must be created from reviewed main, not a draft branch"
git fetch origin main --quiet
[[ "$(git rev-parse origin/main)" == "$EXPECTED_SHA" ]] || fail "origin/main does not equal the reviewed source SHA"
pass "clean reviewed source $EXPECTED_SHA"

node --test \
  "$ROOT/scripts/__tests__/verify-release-database-url.test.mjs" \
  "$ROOT/scripts/__tests__/release-smoke-policy.test.cjs" \
  "$ROOT/scripts/__tests__/release-version-policy.test.cjs" \
  "$ROOT/scripts/__tests__/release-secret-lifecycle.test.cjs" \
  "$ROOT/scripts/__tests__/verify-release-evidence.test.mjs"
MWM_RELEASE_TEST_DATABASE_URL="$TEST_DB_SECRET" \
  MWM_PRODUCTION_DATABASE_FINGERPRINT="$PRODUCTION_DB_FINGERPRINT_SECRET" \
  node "$ROOT/scripts/verify-release-database-url.mjs"
pass "release-test database identity differs from reviewed production fingerprint"

PROVENANCE="$ROOT/docs/product/releases/BUILD_105_PROVENANCE.json"
ACCEPTANCE="$ROOT/docs/product/releases/BUILD_106_ACCEPTANCE.json"
require_file "$PROVENANCE"
require_file "$ACCEPTANCE"

node - "$MOBILE/app.json" "$MOBILE/eas.json" "$MOBILE/.build-record.json" "$PROVENANCE" "$ACCEPTANCE" "$PROJECT_ID" "$APP_ID" <<'NODE'
const fs = require('node:fs');
const [appPath, easPath, recordPath, provenancePath, acceptancePath, projectId, appId] = process.argv.slice(2);
const app = JSON.parse(fs.readFileSync(appPath, 'utf8')).expo;
const eas = JSON.parse(fs.readFileSync(easPath, 'utf8'));
const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(acceptancePath, 'utf8'));
const failures = [];
if (app.version !== '1.1.6') failures.push('version');
if (app.ios?.buildNumber !== '106') failures.push('ios.buildNumber');
if (app.android?.versionCode !== 80) failures.push('android.versionCode');
if (app.runtimeVersion !== '1.1.6-native.1') failures.push('runtimeVersion');
if (app.ios?.bundleIdentifier !== appId) failures.push('ios.bundleIdentifier');
if (app.android?.package !== appId) failures.push('android.package');
if (app.extra?.eas?.projectId !== projectId) failures.push('extra.eas.projectId');
if (app.updates?.url !== `https://u.expo.dev/${projectId}`) failures.push('updates.url');
if (eas.build?.production?.env?.EXPO_PUBLIC_DOMAIN !== 'www.mappingwithmelanin.com') failures.push('eas production API domain');
if (record.lastIosSubmitted !== 105) failures.push('lastIosSubmitted');
if ((app.ios?.infoPlist?.UIBackgroundModes ?? []).includes('audio')) failures.push('UIBackgroundModes');
if (provenance.buildNumber !== 105 || provenance.sourceCommit !== '4af512bc70e030beafd4f256aa8034be0c833bc8') failures.push('Build 105 provenance identity');
if (provenance.easBuildReconciled !== true || provenance.testFlightReconciled !== true || !provenance.reconciledAt || !provenance.reconciledBy) failures.push('Build 105 external reconciliation');
if (!/^[0-9a-f]{40}$/.test(acceptance.reviewedCodeSha ?? '')) failures.push('acceptance.reviewedCodeSha');
for (const key of ['databaseMigrations','responsiveWeb','iosPhysicalDevice','androidPhysicalDevice','kinfolkEvidence','businessPublication','safetyLocation','voice','deepLinks','eventsCirclesMarketplaceResources','independentReview']) {
  if (acceptance[key] !== true) failures.push(`acceptance.${key}`);
}
if (!acceptance.completedAt || !acceptance.reviewedBy) failures.push('acceptance audit metadata');
if (failures.length) {
  console.error(`BUILD_106_BLOCKED: release metadata/acceptance mismatch: ${failures.join(', ')}`);
  process.exit(1);
}
NODE
REVIEWED_CODE_SHA="$(jq -er '.reviewedCodeSha | select(type=="string" and test("^[0-9a-f]{40}$"))' "$ACCEPTANCE")"
node "$ROOT/scripts/verify-release-evidence.mjs" "$ROOT" "$REVIEWED_CODE_SHA" "$EXPECTED_SHA"
pass "app/project identifiers, Build 105 provenance, and reviewed device acceptance"

for contract in \
  "$ROOT/artifacts/api-server/src/__tests__/kinfolk-release-acceptance-contract.test.ts" \
  "$ROOT/artifacts/api-server/src/__tests__/release-safety-location-contract.test.ts" \
  "$ROOT/artifacts/mobile/__tests__/release-safety-location-contract.test.ts" \
  "$ROOT/artifacts/web/src/__tests__/release-parity-contract.test.ts"; do
  require_file "$contract"
done

if rg -n --glob '!*.web.tsx' 'fetch\((`|"|\x27)/api/' "$MOBILE/app" "$MOBILE/components" "$MOBILE/hooks" "$MOBILE/lib"; then
  fail "native code still contains relative /api fetch calls; every native request must use the configured API base"
fi
pass "native API calls are host-qualified"

VERIFY_DIR="$(mktemp -d)"
rmdir "$VERIFY_DIR"
git worktree add --detach "$VERIFY_DIR" "$EXPECTED_SHA" >/dev/null
if ! (
  set -euo pipefail
  cd "$VERIFY_DIR"
  corepack pnpm install --frozen-lockfile
  corepack pnpm exec tsc --build --force
  corepack pnpm run typecheck
  DATABASE_URL="$TEST_DB_SECRET" corepack pnpm --filter @workspace/db push-force
  DATABASE_URL="$TEST_DB_SECRET" corepack pnpm --filter @workspace/api-server release-db:verify
  DATABASE_URL="$TEST_DB_SECRET" NODE_ENV=test corepack pnpm --filter @workspace/api-server test
  (cd artifacts/web && ../../node_modules/.bin/vitest run)
  (cd artifacts/mobile && ../../node_modules/.bin/vitest run)
  corepack pnpm --filter @workspace/web build
  rm -rf artifacts/api-server/web-static
  mkdir -p artifacts/api-server/web-static
  cp -a artifacts/web/dist/public/. artifacts/api-server/web-static/
  diff -qr artifacts/web/dist/public artifacts/api-server/web-static
  corepack pnpm --filter @workspace/api-server build
  DATABASE_URL="$TEST_DB_SECRET" \
    NODE_ENV=test \
    EXPECTED_RELEASE_SHA="$EXPECTED_SHA" \
    PLAYWRIGHT_BASE_URL='http://127.0.0.1:24680/web/' \
    PLAYWRIGHT_WEB_SERVER_COMMAND='PORT=24680 HOST=127.0.0.1 NODE_ENV=test pnpm --filter @workspace/api-server start' \
    corepack pnpm test:e2e
  corepack pnpm --filter @workspace/mobile audit
  corepack pnpm --filter @workspace/mobile lint
  cd artifacts/mobile
  corepack pnpm exec expo-doctor
  corepack pnpm run prebuild:ios
  corepack pnpm run prebuild:android
  ios_config="$(corepack pnpm exec expo config --type public --json)"
  android_config="$ios_config"
  node - "$PROJECT_ID" "$APP_ID" "$ios_config" "$android_config" <<'NODE'
const [projectId, appId, iosRaw, androidRaw] = process.argv.slice(2);
const ios = JSON.parse(iosRaw);
const android = JSON.parse(androidRaw);
if (ios.ios?.bundleIdentifier !== appId || ios.extra?.eas?.projectId !== projectId) process.exit(1);
if (android.android?.package !== appId || android.extra?.eas?.projectId !== projectId) process.exit(1);
if ((ios.ios?.infoPlist?.UIBackgroundModes ?? []).includes('audio')) process.exit(1);
NODE
); then
  git worktree remove --force "$VERIFY_DIR" >/dev/null 2>&1 || true
  VERIFY_DIR=""
  fail "clean detached-worktree test, migration, E2E, build, Expo, or App Review validation failed"
fi
git worktree remove --force "$VERIFY_DIR" >/dev/null
VERIFY_DIR=""
[[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" && "$(git rev-parse origin/main)" == "$EXPECTED_SHA" && -z "$(git status --porcelain)" ]] || fail "release checkout changed during validation"
pass "fresh declarations, isolated migrations, full API/web/Expo/E2E suites, production builds, Expo Doctor, and native prebuild gates"
unset TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET

version_json="$(mktemp)"
login_json="$(mktemp)"
capital_json="$(mktemp)"
directory_json="$(mktemp)"
auth_header="$(mktemp)"
link_target="$(mktemp)"
TEMP_FILES=("$version_json" "$login_json" "$capital_json" "$directory_json" "$auth_header" "$link_target")
chmod 0600 "${TEMP_FILES[@]}"

curl --silent --show-error --fail --max-time 20 "$PRODUCTION_URL/api/version" > "$version_json"
node - "$version_json" "$EXPECTED_SHA" "$ROOT/scripts/release-version-policy.cjs" <<'NODE'
const fs = require('node:fs');
const [file, expected, policyPath] = process.argv.slice(2);
const { validateProductionVersion } = require(policyPath);
const v = JSON.parse(fs.readFileSync(file, 'utf8'));
validateProductionVersion(v, expected);
NODE
pass "canonical production API serves the exact reviewed 40-character SHA"

MWM_RELEASE_TESTER_EMAIL="$TESTER_EMAIL_SECRET" MWM_RELEASE_TESTER_PASSWORD="$TESTER_PASSWORD_SECRET" \
  jq -cn '{email:env.MWM_RELEASE_TESTER_EMAIL,password:env.MWM_RELEASE_TESTER_PASSWORD}' |
  curl --silent --show-error --fail --max-time 30 \
    -H 'Content-Type: application/json' --data-binary @- \
    "$PRODUCTION_URL/api/auth/login-email" > "$login_json"
TOKEN="$(jq -er '.token | select(type=="string" and length>20)' "$login_json")"
export -n TOKEN
: > "$login_json"
unset TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET
printf 'Authorization: Bearer %s\n' "$TOKEN" > "$auth_header"

post_kinfolk() {
  local message="$1" output="$2"
  MESSAGE="$message" jq -cn '{sessionId:null,message:env.MESSAGE,vibes:[],voiceMode:"community",imageUrls:[]}' |
    curl --silent --show-error --fail --max-time 45 \
      -H 'Content-Type: application/json' -H @"$auth_header" \
      --data-binary @- "$PRODUCTION_URL/api/kinfolk/chat" > "$output"
}
post_kinfolk 'What is the capital of Pennsylvania?' "$capital_json"
jq -e '(.reply|type=="string") and (.reply|ascii_downcase|contains("harrisburg"))' "$capital_json" >/dev/null || fail "Kinfolk did not answer the ordinary state-capital question directly"
post_kinfolk 'Find bakeries in Philadelphia from the Mapping With Melanin directory and include a working detail or official website link.' "$directory_json"
node - "$directory_json" "$PRODUCTION_URL" "$link_target" "$ROOT/scripts/release-smoke-policy.cjs" <<'NODE'
const fs = require('node:fs');
const [file, origin, output, policyPath] = process.argv.slice(2);
const { isPhiladelphiaLocation } = require(policyPath);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const businesses = data.recommendations?.businesses ?? [];
const matching = businesses.find((b) => /bakery|baker|cake|pastry/i.test(`${b.name ?? ''} ${b.category ?? ''} ${b.description ?? ''}`));
const locationText = matching ? `${matching.city ?? ''} ${matching.state ?? ''} ${matching.location?.city ?? ''} ${matching.location?.state ?? ''}` : '';
const isPhiladelphia = isPhiladelphiaLocation(locationText);
const candidates = [
  { kind: 'detail', value: matching?.detailUrl },
  { kind: 'website', value: matching?.website },
].filter((candidate) => candidate.value);
let accepted = null;
for (const candidate of candidates) {
  try {
    const url = new URL(candidate.value, origin);
    if (url.protocol !== 'https:') continue;
    if (url.username || url.password) continue;
    if (candidate.kind === 'detail' && url.origin !== origin) continue;
    accepted = url.href;
    break;
  } catch {}
}
if (!matching || !isPhiladelphia || !accepted || typeof data.reply !== 'string' || data.reply.length < 20) {
  console.error('BUILD_106_BLOCKED: Kinfolk lacked a relevant inventory bakery result with a safe link'); process.exit(1);
}
fs.writeFileSync(output, accepted, { mode: 0o600 });
NODE
curl --silent --show-error --fail --location --proto '=https' --proto-redir '=https' --max-redirs 3 --max-time 20 --range 0-2048 "$(cat "$link_target")" >/dev/null || fail "Kinfolk bakery result link is not reachable"
unset TOKEN
: > "$auth_header"
pass "authenticated production Kinfolk ordinary-fact and relevant inventory-link smoke tests"

if [[ "$MODE" == "verify" ]]; then
  printf '\nBUILD_106_VERIFIED. No store build was started.\n'
  exit 0
fi

# Seal the store build to a new detached worktree of the exact reviewed/deployed SHA.
cd "$ROOT"
git fetch origin main --quiet
[[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" && "$(git rev-parse origin/main)" == "$EXPECTED_SHA" && "$(git branch --show-current)" == "main" && -z "$(git status --porcelain)" ]] || fail "final source identity changed before EAS"
BUILD_DIR="$(mktemp -d)"
rmdir "$BUILD_DIR"
git worktree add --detach "$BUILD_DIR" "$EXPECTED_SHA" >/dev/null
cd "$BUILD_DIR/artifacts/mobile"
corepack pnpm install --frozen-lockfile
[[ "$(git -C "$BUILD_DIR" rev-parse HEAD)" == "$EXPECTED_SHA" && -z "$(git -C "$BUILD_DIR" status --porcelain)" ]] || fail "sealed EAS checkout is not exact and clean"
corepack pnpm exec eas whoami >/dev/null

if [[ "$MODE" == "ios-testflight" ]]; then
  corepack pnpm exec eas build --platform ios --profile production --non-interactive --auto-submit
  printf '\nIOS_BUILD_106_SENT_TO_TESTFLIGHT. App Store review was not started.\n'
else
  corepack pnpm exec eas build --platform android --profile production --non-interactive
  printf '\nANDROID_VERSION_CODE_80_BUILT. Google Play submission was not started.\n'
fi
