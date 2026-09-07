"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");
const eas = JSON.parse(readFileSync(path.join(root, "artifacts/mobile/eas.json"), "utf8"));
const script = readFileSync(path.join(root, "scripts/release-build-106.sh"), "utf8");

test("TestFlight staging profile preserves required nonsecret mobile variables", () => {
  const profile = eas.build["testflight-staging"];
  assert.equal(profile.channel, "testflight-staging");
  assert.equal(profile.distribution, "store");
  assert.equal(profile.environment, "preview");
  assert.equal(profile.env.EXPO_PUBLIC_DOMAIN, "mwm-staging.35.196.78.19.nip.io");
  for (const key of ["EXPO_PUBLIC_REPL_ID", "GOOGLE_MAPS_API_KEY", "PNPM_VERSION", "EXPO_PUBLIC_REVENUECAT_IOS_API_KEY", "EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY", "EXPO_PUBLIC_REVENUECAT_TEST_API_KEY", "SENTRY_ALLOW_FAILURE"]) {
    assert.equal(profile.env[key], eas.build.production.env[key], `missing merged variable: ${key}`);
  }
  assert.equal(Object.keys(profile.env).some((key) => /OPENAI|AI_INTEGRATIONS/i.test(key)), false);
});

test("staging verification is explicit and never invokes EAS or prebuild", () => {
  const section = script.slice(script.indexOf("verify_testflight_staging()"), script.indexOf("\n}\n\nios_testflight_staging()") + 2);
  for (const fragment of [
    'MODE" == "verify-testflight-staging"',
    'corepack pnpm exec expo export --platform ios',
    'corepack pnpm test',
    'corepack pnpm run typecheck',
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
  assert.match(stagingMode, /--profile testflight-staging/);
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