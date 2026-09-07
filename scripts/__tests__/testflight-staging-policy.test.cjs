"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");
const eas = JSON.parse(readFileSync(path.join(root, "artifacts/mobile/eas.json"), "utf8"));
const script = readFileSync(path.join(root, "scripts/release-build-106.sh"), "utf8");
const revenueCat = readFileSync(path.join(root, "artifacts/mobile/lib/revenuecat.tsx"), "utf8");

test("TestFlight staging is an explicit free, staging-only profile", () => {
  const profile = eas.build["testflight-staging"];
  assert.equal(profile.channel, "testflight-staging");
  assert.equal(profile.distribution, "store");
  assert.equal(profile.environment, "preview");
  assert.equal(profile.autoIncrement, false);
  assert.equal(profile.env.EXPO_PUBLIC_DOMAIN, "mwm-staging.35.196.78.19.nip.io");
  assert.equal(profile.env.APP_RELEASE_CHANNEL, "testflight-staging");
  assert.equal(profile.env.APP_ENV, "staging");
  assert.equal(profile.env.EXPO_PUBLIC_REVENUECAT_DISABLED, "true");
  assert.equal(Object.keys(profile.env).some((key) => /REVENUECAT_(?:IOS|ANDROID|TEST)_API_KEY/i.test(key)), false);
  assert.equal(Object.keys(profile.env).some((key) => /OPENAI|AI_INTEGRATIONS/i.test(key)), false);
  assert.deepEqual(eas.submit["testflight-staging"].ios, eas.submit.production.ios);
});

test("free TestFlight testers cannot initialize, charge, or mutate RevenueCat", () => {
  assert.match(revenueCat, /No-op — do not initialize StoreKit/);
  assert.doesNotMatch(revenueCat, /from\s+["']react-native-purchases["']/);
  assert.match(revenueCat, /purchase:\s*\(\)\s*=>\s*Promise\.reject/);
  assert.match(revenueCat, /restore:\s*\(\)\s*=>\s*Promise\.reject/);
});

test("staging verification is explicit and never invokes EAS or prebuild", () => {
  const section = script.slice(script.indexOf("verify_testflight_staging()"), script.indexOf("\n}\n\nios_testflight_staging()") + 2);
  for (const fragment of [
    'MODE" == "verify-testflight-staging"',
    'corepack pnpm exec expo export --platform ios',
    'corepack pnpm test',
    'corepack pnpm run typecheck',
    'staging /api/version.built_from_sha',
    'Discovery search schema canary',
    'Discovery preferences and consent canary',
    'Discovery event consent and idempotency canary',
    'Discovery opt-out enforcement canary',
    'compiled.includes(productionOrigin)',
    'Kinfolk canary 6/6',
    'UIBackgroundModes',
    'No EAS build, prebuild, upload, or deployment was started.',
  ]) assert.ok(script.includes(fragment), `missing staging guard: ${fragment}`);
  assert.doesNotMatch(section, /\beas\s+build\b|pnpm\s+(?:run\s+)?prebuild/);
});

test("staging TestFlight mode requires fresh signed evidence and uses only its staging profile", () => {
  const stagingMode = script.slice(script.indexOf("ios_testflight_staging()"), script.indexOf('[[ "$MODE" =~'));
  assert.match(script, /ios-testflight-staging/);
  assert.match(stagingMode, /verify_staging_evidence/);
  assert.match(stagingMode, /--profile testflight-staging.*--auto-submit-with-profile testflight-staging/);
  assert.match(stagingMode, /git -C "\$ROOT" worktree add --detach "\$BUILD_DIR" "\$EXPECTED_SHA"/);
  assert.doesNotMatch(stagingMode, /--profile production/);
  for (const fragment of [
    "MWM_TESTFLIGHT_STAGING_EVIDENCE_KEY",
    "crypto.createHmac",
    "crypto.timingSafeEqual",
    'evidence.sha !== expectedSha',
    'evidence.sourceDigest !== expectedDigest',
    'source changed after staging verification',
  ]) assert.ok(script.includes(fragment), `missing fail-closed evidence guard: ${fragment}`);
});

test("build 106 cannot select production TestFlight", () => {
  assert.doesNotMatch(script, /"ios-testflight"/);
  assert.match(script, /ios-testflight-production/);
  assert.match(script, /iOS build 106 is staging-only; production TestFlight requires iOS build number 107 or later/);
  assert.match(script, /"\$ios_build_number" -ge 107/);
});