#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-verify}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOBILE="$ROOT/artifacts/mobile"
PRODUCTION_URL="https://www.mappingwithmelanin.com"
STAGING_HOST="mwm-staging.35.196.78.19.nip.io"
STAGING_URL="https://$STAGING_HOST"
EXPECTED_SHA="${MWM_BUILD106_SOURCE_SHA:-}"
TEST_DB_SECRET="${MWM_RELEASE_TEST_DATABASE_URL:-}"
PRODUCTION_DB_FINGERPRINT_SECRET="${MWM_PRODUCTION_DATABASE_FINGERPRINT:-}"
TESTER_EMAIL_SECRET="${MWM_RELEASE_TESTER_EMAIL:-}"
TESTER_PASSWORD_SECRET="${MWM_RELEASE_TESTER_PASSWORD:-}"
STAGING_EVIDENCE_KEY="${MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY:-}"
unset MWM_RELEASE_TEST_DATABASE_URL MWM_PRODUCTION_DATABASE_FINGERPRINT MWM_RELEASE_TESTER_EMAIL MWM_RELEASE_TESTER_PASSWORD MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY
export -n TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET STAGING_EVIDENCE_KEY
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
  unset TOKEN TEST_DB_SECRET PRODUCTION_DB_FINGERPRINT_SECRET TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET STAGING_EVIDENCE_KEY
}
trap cleanup EXIT

staging_evidence_path() {
  local state_home="${XDG_STATE_HOME:-$HOME/.local/state}"
  printf '%s/mwm-release/testflight-staging-build106-%s.json' "$state_home" "$EXPECTED_SHA"
}

staging_source_digest() {
  sha256sum "$MOBILE/app.json" "$MOBILE/eas.json" "$ROOT/scripts/release-build-106.sh" | sha256sum | awk '{print $1}'
}

write_staging_evidence() {
  local evidence_path source_tree source_digest evidence_dir temp_evidence
  [[ -n "$STAGING_EVIDENCE_KEY" ]] || fail "set MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY to seal staging verification evidence"
  evidence_path="$(staging_evidence_path)"
  evidence_dir="$(dirname "$evidence_path")"
  source_tree="$(git -C "$ROOT" rev-parse "${EXPECTED_SHA}^{tree}")"
  source_digest="$(staging_source_digest)"
  mkdir -p -- "$evidence_dir"
  chmod 0700 "$evidence_dir"
  temp_evidence="$(mktemp "$evidence_dir/.testflight-staging.XXXXXX")"
  chmod 0600 "$temp_evidence"
  MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY="$STAGING_EVIDENCE_KEY" \
    node - "$temp_evidence" "$EXPECTED_SHA" "$source_tree" "$source_digest" <<'NODE'
const crypto = require("node:crypto");
const fs = require("node:fs");
const [file, sha, tree, sourceDigest] = process.argv.slice(2);
const verifiedAt = new Date().toISOString();
const payload = ["testflight-staging-build106-v1", sha, tree, sourceDigest, verifiedAt].join("\n");
const signature = crypto.createHmac("sha256", process.env.MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY).update(payload).digest("hex");
fs.writeFileSync(file, `${JSON.stringify({ schema: "testflight-staging-build106-v1", sha, tree, sourceDigest, verifiedAt, signature })}\n`, { mode: 0o600 });
NODE
  mv -f -- "$temp_evidence" "$evidence_path"
  pass "tamper-evident TestFlight staging evidence sealed for $EXPECTED_SHA"
}

verify_staging_evidence() {
  local evidence_path source_tree source_digest
  [[ -n "$STAGING_EVIDENCE_KEY" ]] || fail "set MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY to verify staging evidence"
  [[ -n "$EXPECTED_SHA" && "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "set MWM_BUILD106_SOURCE_SHA to the exact reviewed 40-character lowercase commit SHA"
  cd "$ROOT"
  [[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" ]] || fail "checkout SHA does not equal MWM_BUILD106_SOURCE_SHA after staging verification"
  [[ -z "$(git status --porcelain)" ]] || fail "source changed after staging verification"
  evidence_path="$(staging_evidence_path)"
  [[ -f "$evidence_path" ]] || fail "verify-testflight-staging must successfully seal evidence before an iOS staging build"
  source_tree="$(git rev-parse "${EXPECTED_SHA}^{tree}")"
  source_digest="$(staging_source_digest)"
  MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY="$STAGING_EVIDENCE_KEY" \
    node - "$evidence_path" "$EXPECTED_SHA" "$source_tree" "$source_digest" <<'NODE'
const crypto = require("node:crypto");
const fs = require("node:fs");
const [file, expectedSha, expectedTree, expectedDigest] = process.argv.slice(2);
const evidence = JSON.parse(fs.readFileSync(file, "utf8"));
const payload = [evidence.schema, evidence.sha, evidence.tree, evidence.sourceDigest, evidence.verifiedAt].join("\n");
const expectedSignature = crypto.createHmac("sha256", process.env.MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY).update(payload).digest("hex");
const validSignature = typeof evidence.signature === "string" &&
  evidence.signature.length === expectedSignature.length &&
  crypto.timingSafeEqual(Buffer.from(evidence.signature), Buffer.from(expectedSignature));
const ageMs = Date.now() - Date.parse(evidence.verifiedAt);
if (evidence.schema !== "testflight-staging-build106-v1" || evidence.sha !== expectedSha ||
    evidence.tree !== expectedTree || evidence.sourceDigest !== expectedDigest || !validSignature ||
    !Number.isFinite(ageMs) || ageMs < 0 || ageMs > 30 * 60 * 1000) process.exit(1);
NODE
  pass "fresh tamper-evident staging evidence matches the exact clean committed SHA"
}

verify_testflight_staging() {
  local staging_audio="${MWM_KINFOLK_TEST_AUDIO:-}"
  local config_json introspect_json compiled_dir version_json health_json login_json auth_header discovery_search_json discovery_preferences_json discovery_event_json discovery_opt_out_json ordinary_json research_json inventory_json transcript_json speech_json

  [[ -n "$EXPECTED_SHA" && "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "set MWM_BUILD106_SOURCE_SHA to the exact reviewed 40-character lowercase commit SHA"
  [[ -n "$TESTER_EMAIL_SECRET" && -n "$TESTER_PASSWORD_SECRET" ]] || fail "secure staging tester credentials are required in environment secrets"
  [[ -n "$staging_audio" && -r "$staging_audio" && -f "$staging_audio" ]] || fail "set MWM_KINFOLK_TEST_AUDIO to a reviewed, readable iPhone-compatible speech recording"
  cd "$ROOT"
  [[ "$(git rev-parse HEAD)" == "$EXPECTED_SHA" ]] || fail "checkout SHA does not equal MWM_BUILD106_SOURCE_SHA"
  git cat-file -e "${EXPECTED_SHA}^{commit}" || fail "MWM_BUILD106_SOURCE_SHA is not a commit"
  [[ -z "$(git status --porcelain)" ]] || fail "working tree is not clean"
  pass "clean committed source $EXPECTED_SHA"

  version_json="$(mktemp)"
  TEMP_FILES=("$version_json")
  curl --silent --show-error --fail --max-time 30 "$STAGING_URL/api/version" > "$version_json"
  node - "$version_json" "$EXPECTED_SHA" <<'NODE'
const version = JSON.parse(require("node:fs").readFileSync(process.argv[2], "utf8"));
if (version.built_from_sha !== process.argv[3]) {
  console.error("BUILD_106_BLOCKED: staging /api/version.built_from_sha does not equal the reviewed source SHA");
  process.exit(1);
}
NODE
  rm -f -- "$version_json"
  TEMP_FILES=()
  pass "isolated staging /api/version reports the exact reviewed built_from_sha"

  node - "$MOBILE/app.json" "$MOBILE/eas.json" "$STAGING_HOST" <<'NODE'
const fs = require("node:fs");
const [appPath, easPath, host] = process.argv.slice(2);
const app = JSON.parse(fs.readFileSync(appPath, "utf8")).expo;
const eas = JSON.parse(fs.readFileSync(easPath, "utf8"));
const profile = eas.build?.["testflight-staging"];
const failures = [];
if (app.version !== "1.1.6") failures.push("version");
if (app.ios?.buildNumber !== "106") failures.push("ios.buildNumber");
if (app.runtimeVersion !== "1.1.6-native.1") failures.push("runtimeVersion");
if (profile?.channel !== "testflight-staging") failures.push("profile.channel");
if (profile?.distribution !== "store") failures.push("profile.distribution");
if (profile?.environment !== "preview") failures.push("profile.environment");
if (profile?.env?.EXPO_PUBLIC_DOMAIN !== host) failures.push("staging API host");
if (profile?.env?.EXPO_PUBLIC_REVENUECAT_DISABLED !== "true") failures.push("RevenueCat staging kill switch");
if (Object.keys(profile?.env ?? {}).some((key) => /REVENUECAT_(?:IOS|ANDROID|TEST)_API_KEY/i.test(key))) failures.push("production RevenueCat API key");
if (Object.keys(profile?.env ?? {}).some((key) => /OPENAI|AI_INTEGRATIONS/i.test(key))) failures.push("provider variable in EAS profile");
if (!eas.submit?.["testflight-staging"]?.ios) failures.push("explicit testflight-staging submit profile");
if (failures.length) {
  console.error(`BUILD_106_BLOCKED: TestFlight staging metadata mismatch: ${failures.join(", ")}`);
  process.exit(1);
}
NODE

  config_json="$(mktemp)"
  introspect_json="$(mktemp)"
  compiled_dir="$(mktemp -d)"
  health_json="$(mktemp)"
  login_json="$(mktemp)"
  auth_header="$(mktemp)"
  discovery_search_json="$(mktemp)"
  discovery_preferences_json="$(mktemp)"
  discovery_event_json="$(mktemp)"
  discovery_opt_out_json="$(mktemp)"
  ordinary_json="$(mktemp)"
  research_json="$(mktemp)"
  inventory_json="$(mktemp)"
  transcript_json="$(mktemp)"
  speech_json="$(mktemp)"
  TEMP_FILES=("$config_json" "$introspect_json" "$health_json" "$login_json" "$auth_header" "$discovery_search_json" "$discovery_preferences_json" "$discovery_event_json" "$discovery_opt_out_json" "$ordinary_json" "$research_json" "$inventory_json" "$transcript_json" "$speech_json")
  chmod 0600 "${TEMP_FILES[@]}"
  trap 'rm -rf -- "$compiled_dir"; cleanup' EXIT

  (
    cd "$MOBILE"
    EXPO_PUBLIC_DOMAIN="$STAGING_HOST" EXPO_NO_TELEMETRY=1 corepack pnpm exec expo config --type public --json > "$config_json"
    EXPO_PUBLIC_DOMAIN="$STAGING_HOST" EXPO_NO_TELEMETRY=1 corepack pnpm exec expo config --type introspect --json > "$introspect_json"
    EXPO_PUBLIC_DOMAIN="$STAGING_HOST" EXPO_NO_TELEMETRY=1 corepack pnpm exec expo export --platform ios --output-dir "$compiled_dir" --non-interactive >/dev/null
    corepack pnpm test
    corepack pnpm run typecheck
  ) || fail "staging mobile export, tests, or typecheck failed"
  node - "$config_json" "$introspect_json" "$compiled_dir" "$STAGING_HOST" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const [configPath, introspectPath, outputDir, host] = process.argv.slice(2);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const introspected = JSON.parse(fs.readFileSync(introspectPath, "utf8"));
function hasGeneratedBackgroundAudio(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.includes("audio") || value.some(hasGeneratedBackgroundAudio);
  return Object.entries(value).some(([key, child]) =>
    (key === "UIBackgroundModes" && Array.isArray(child) && child.includes("audio")) ||
    hasGeneratedBackgroundAudio(child),
  );
}
if (config.version !== "1.1.6" || config.ios?.buildNumber !== "106" ||
    config.runtimeVersion !== "1.1.6-native.1" ||
    hasGeneratedBackgroundAudio(config) || hasGeneratedBackgroundAudio(introspected)) process.exit(1);
let compiled = "";
for (const entry of fs.readdirSync(outputDir, { recursive: true })) {
  const file = path.join(outputDir, entry);
  if (fs.statSync(file).isFile() && /\.(?:js|map)$/.test(file)) compiled += fs.readFileSync(file, "utf8");
}
const productionOrigin = "https://www.mappingwithmelanin.com";
if (!compiled.includes(host) || compiled.includes(productionOrigin)) process.exit(1);
NODE
  pass "staging Expo public configuration, staging-only compiled API origin, mobile tests, typecheck, and foreground-only audio configuration"

  curl --silent --show-error --fail --max-time 30 "$STAGING_URL/api/kinfolk/health" > "$health_json"
  node - "$health_json" <<'NODE'
const health = JSON.parse(require("node:fs").readFileSync(process.argv[2], "utf8"));
if (health.ok !== true || Object.keys(health).some((key) => /key|token|provider|error/i.test(key))) process.exit(1);
NODE
  pass "Kinfolk canary 1/6: provider health"

  MWM_RELEASE_TESTER_EMAIL="$TESTER_EMAIL_SECRET" MWM_RELEASE_TESTER_PASSWORD="$TESTER_PASSWORD_SECRET" \
    jq -cn '{email:env.MWM_RELEASE_TESTER_EMAIL,password:env.MWM_RELEASE_TESTER_PASSWORD}' |
    curl --silent --show-error --fail --max-time 30 -H 'Content-Type: application/json' --data-binary @- \
      "$STAGING_URL/api/auth/login-email" > "$login_json"
  TOKEN="$(jq -er '.token | select(type=="string" and length>20)' "$login_json")"
  export -n TOKEN
  : > "$login_json"
  unset TESTER_EMAIL_SECRET TESTER_PASSWORD_SECRET
  printf 'Authorization: Bearer %s\n' "$TOKEN" > "$auth_header"

  discovery_request_id="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
  discovery_event_id="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')"
  discovery_key="build106-staging-${discovery_event_id}"
  DISCOVERY_REQUEST_ID="$discovery_request_id" jq -cn '{
    schemaVersion:"1", requestId:env.DISCOVERY_REQUEST_ID, surface:"smart_search", platform:"ios",
    entryPoint:"testflight_staging_release_canary", query:"bakery",
    location:{source:"typed",city:"Philadelphia",stateRegion:"PA",countryCode:"US"},
    filters:{}, consent:{personalizedSuggestions:false,searchImprovement:false,preciseLocation:false}
  }' | curl --silent --show-error --fail --max-time 30 -H 'Content-Type: application/json' \
    --data-binary @- "$STAGING_URL/api/discovery/v1/search" > "$discovery_search_json"
  node - "$discovery_search_json" "$discovery_request_id" <<'NODE'
const result = JSON.parse(require("node:fs").readFileSync(process.argv[2], "utf8"));
if (result.requestId !== process.argv[3] || typeof result.resultSetId !== "string" ||
    !Array.isArray(result.results) || typeof result.total !== "number") process.exit(1);
NODE
  pass "isolated staging Discovery search schema canary"

  curl --silent --show-error --fail --max-time 30 -H @"$auth_header" \
    "$STAGING_URL/api/discovery/v1/preferences" > "$discovery_preferences_json"
  node - "$discovery_preferences_json" <<'NODE'
const preference = JSON.parse(require("node:fs").readFileSync(process.argv[2], "utf8"));
if (typeof preference.searchImprovement !== "boolean" || typeof preference.consentVersion !== "string") process.exit(1);
NODE
  jq -cn '{searchImprovement:true,consentVersion:"build106-staging-canary"}' |
    curl --silent --show-error --fail --max-time 30 -X PUT -H 'Content-Type: application/json' -H @"$auth_header" \
      --data-binary @- "$STAGING_URL/api/discovery/v1/preferences" > "$discovery_preferences_json"
  jq -e '.searchImprovement == true and .consentVersion == "build106-staging-canary"' "$discovery_preferences_json" >/dev/null ||
    fail "Discovery consent canary failed"
  pass "isolated staging Discovery preferences and consent canary"

  DISCOVERY_EVENT_ID="$discovery_event_id" DISCOVERY_KEY="$discovery_key" DISCOVERY_REQUEST_ID="$discovery_request_id" jq -cn '{
    schemaVersion:"1", eventId:env.DISCOVERY_EVENT_ID, idempotencyKey:env.DISCOVERY_KEY,
    eventName:"search_submitted", consent:{searchImprovement:true,version:"build106-staging-canary"},
    surface:"smart_search", platform:"ios", entryPoint:"testflight_staging_release_canary",
    appVersion:"106", requestId:env.DISCOVERY_REQUEST_ID, normalizedIntent:"bakery",
    coarseLocationBucket:"city:philadelphia-pa"
  }' > "$discovery_event_json"
  curl --silent --show-error --fail --max-time 30 -H 'Content-Type: application/json' -H @"$auth_header" \
    --data-binary @"$discovery_event_json" "$STAGING_URL/api/discovery/v1/events" > "$discovery_opt_out_json"
  jq -e '.accepted == true' "$discovery_opt_out_json" >/dev/null || fail "Discovery event consent canary failed"
  curl --silent --show-error --fail --max-time 30 -H 'Content-Type: application/json' -H @"$auth_header" \
    --data-binary @"$discovery_event_json" "$STAGING_URL/api/discovery/v1/events" > "$discovery_opt_out_json"
  jq -e '.accepted == true' "$discovery_opt_out_json" >/dev/null || fail "Discovery idempotent replay canary failed"
  pass "isolated staging Discovery event consent and idempotency canary"

  jq -cn '{searchImprovement:false,consentVersion:"build106-staging-canary"}' |
    curl --silent --show-error --fail --max-time 30 -X PUT -H 'Content-Type: application/json' -H @"$auth_header" \
      --data-binary @- "$STAGING_URL/api/discovery/v1/preferences" > "$discovery_opt_out_json"
  jq -e '.searchImprovement == false' "$discovery_opt_out_json" >/dev/null || fail "Discovery opt-out canary failed"
  DISCOVERY_EVENT_ID="$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')" DISCOVERY_REQUEST_ID="$discovery_request_id" jq -cn '{
    schemaVersion:"1", eventId:env.DISCOVERY_EVENT_ID, idempotencyKey:"build106-staging-after-opt-out",
    eventName:"search_submitted", consent:{searchImprovement:true,version:"build106-staging-canary"},
    surface:"smart_search", platform:"ios", entryPoint:"testflight_staging_release_canary",
    appVersion:"106", requestId:env.DISCOVERY_REQUEST_ID
  }' | curl --silent --show-error --fail --max-time 30 -H 'Content-Type: application/json' -H @"$auth_header" \
    --data-binary @- "$STAGING_URL/api/discovery/v1/events" > "$discovery_opt_out_json"
  jq -e '.accepted == false and .reason == "search_improvement_consent_required"' "$discovery_opt_out_json" >/dev/null ||
    fail "Discovery opt-out enforcement canary failed"
  pass "isolated staging Discovery opt-out enforcement canary"

  staging_chat() {
    local message="$1" output="$2"
    MESSAGE="$message" jq -cn '{sessionId:null,message:env.MESSAGE,vibes:[],voiceMode:"community",imageUrls:[]}' |
      curl --silent --show-error --fail --max-time 60 -H 'Content-Type: application/json' -H @"$auth_header" \
        --data-binary @- "$STAGING_URL/api/kinfolk/chat" > "$output"
  }
  staging_chat 'What is the capital of Maryland?' "$ordinary_json"
  jq -e '(.reply|type=="string") and (.reply|ascii_downcase|contains("annapolis"))' "$ordinary_json" >/dev/null || fail "Kinfolk ordinary-fact canary failed"
  pass "Kinfolk canary 2/6: ordinary factual answer"

  staging_chat 'What is the current weather in Philadelphia? Research it and include safe source links.' "$research_json"
  node - "$research_json" <<'NODE'
const answer = JSON.parse(require("node:fs").readFileSync(process.argv[2], "utf8"));
const sources = answer.sources ?? [];
if (typeof answer.reply !== "string" || answer.reply.length < 20 || !sources.some((source) => {
  try { const url = new URL(source.url); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
})) process.exit(1);
NODE
  pass "Kinfolk canary 3/6: current researched answer with safe citation"

  staging_chat 'Find bakeries in Philadelphia from the Mapping With Melanin directory and include a working detail or official website link.' "$inventory_json"
  node - "$inventory_json" "$STAGING_URL" "$ROOT/scripts/release-smoke-policy.cjs" <<'NODE'
const fs = require("node:fs");
const { isPhiladelphiaLocation } = require(process.argv[4]);
const answer = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const business = (answer.recommendations?.businesses ?? []).find((item) => /bakery|baker|cake|pastry/i.test(`${item.name ?? ""} ${item.category ?? ""} ${item.description ?? ""}`));
const location = business && `${business.city ?? ""} ${business.state ?? ""} ${business.location?.city ?? ""} ${business.location?.state ?? ""}`;
const links = [business?.detailUrl, business?.website].filter(Boolean);
const safeLink = links.some((value) => { try { const url = new URL(value, process.argv[3]); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; } });
if (!business || !isPhiladelphiaLocation(location) || !safeLink || typeof answer.reply !== "string") process.exit(1);
NODE
  pass "Kinfolk canary 4/6: canonical inventory recommendation"

  curl --silent --show-error --fail --max-time 45 -H @"$auth_header" \
    -F "audio=@${staging_audio};type=audio/m4a" "$STAGING_URL/api/kinfolk/transcribe" > "$transcript_json"
  jq -e '((.text // .transcript)|type=="string") and ((.text // .transcript)|length>0) and .audioRetained==false' "$transcript_json" >/dev/null || fail "Kinfolk transcription canary failed"
  pass "Kinfolk canary 5/6: iPhone-compatible transcription"

  jq -cn '{text:"Mapping With Melanin Kinfolk TestFlight staging voice check.",voice:"alloy"}' |
    curl --silent --show-error --fail --max-time 45 -H 'Content-Type: application/json' -H @"$auth_header" \
      --data-binary @- "$STAGING_URL/api/kinfolk/speak" > "$speech_json"
  jq -e '(.audio|type=="string") and (.audio|length>32) and .format=="wav" and (.voice|type=="string")' "$speech_json" >/dev/null || fail "Kinfolk spoken-response canary failed"
  unset TOKEN
  : > "$auth_header"
  pass "Kinfolk canary 6/6: foreground spoken response"
  [[ "$(git -C "$ROOT" rev-parse HEAD)" == "$EXPECTED_SHA" && -z "$(git -C "$ROOT" status --porcelain)" ]] || fail "source changed during staging verification"
  write_staging_evidence
  printf '\nTESTFLIGHT_STAGING_VERIFIED. No EAS build, prebuild, upload, or deployment was started.\n'
}

ios_testflight_staging() {
  verify_staging_evidence
  BUILD_DIR="$(mktemp -d)"
  rmdir "$BUILD_DIR"
  git -C "$ROOT" worktree add --detach "$BUILD_DIR" "$EXPECTED_SHA" >/dev/null
  cd "$BUILD_DIR/artifacts/mobile"
  corepack pnpm install --frozen-lockfile
  [[ "$(git -C "$BUILD_DIR" rev-parse HEAD)" == "$EXPECTED_SHA" && -z "$(git -C "$BUILD_DIR" status --porcelain)" ]] || fail "sealed staging EAS checkout is not exact and clean"
  corepack pnpm exec eas whoami >/dev/null
  corepack pnpm exec eas build --platform ios --profile testflight-staging --non-interactive --auto-submit --auto-submit-with-profile testflight-staging
  printf '\nIOS_STAGING_BUILD_106_SENT_TO_TESTFLIGHT. App Store review was not started.\n'
}

[[ "$MODE" =~ ^(verify|verify-testflight-staging|ios-testflight-staging|ios-testflight-production|android-build)$ ]] || fail "usage: $0 verify|verify-testflight-staging|ios-testflight-staging|ios-testflight-production|android-build"
if [[ "$MODE" == "verify-testflight-staging" ]]; then
  verify_testflight_staging
  exit 0
fi
if [[ "$MODE" == "ios-testflight-staging" ]]; then
  ios_testflight_staging
  exit 0
fi
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
  "$ROOT/scripts/__tests__/testflight-staging-policy.test.cjs" \
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

if [[ "$MODE" == "ios-testflight-production" ]]; then
  ios_build_number="$(node -e 'const app=require(process.argv[1]).expo; process.stdout.write(String(app.ios?.buildNumber ?? ""))' "$MOBILE/app.json")"
  [[ "$ios_build_number" =~ ^[0-9]+$ && "$ios_build_number" -ge 107 ]] || fail "iOS build 106 is staging-only; production TestFlight requires iOS build number 107 or later"
  corepack pnpm exec eas build --platform ios --profile production --non-interactive --auto-submit
  printf '\nIOS_PRODUCTION_BUILD_SENT_TO_TESTFLIGHT. App Store review was not started.\n'
else
  corepack pnpm exec eas build --platform android --profile production --non-interactive
  printf '\nANDROID_VERSION_CODE_80_BUILT. Google Play submission was not started.\n'
fi
