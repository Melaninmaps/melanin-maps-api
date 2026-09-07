"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { validateBuild106Policy } = require("../validate-build-106-staging.cjs");
const { validateExpoOutput } = require("../validate-build-106-expo-output.cjs");

const ROOT = path.resolve(__dirname, "../..");
const RELEASE = path.join(ROOT, "scripts/release-build-106.sh");
const ROOT_EAS_PATH = path.join(ROOT, "eas.json");
const EAS_PATH = path.join(ROOT, "artifacts/mobile/eas.json");
const PACKAGE_PATH = path.join(ROOT, "artifacts/mobile/package.json");
const APP_CONFIG_PATH = path.join(ROOT, "artifacts/mobile/app.config.js");
const SHA = "a".repeat(40);
const STAGING_ORIGIN = "https://mwm-staging.35.196.78.19.nip.io";

function mutateJson(file, mutate) {
  const original = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(original);
  try {
    mutate(parsed);
    fs.writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
    return () => fs.writeFileSync(file, original);
  } catch (error) {
    fs.writeFileSync(file, original);
    throw error;
  }
}

function withJsonMutation(file, mutate, expectation) {
  const restore = mutateJson(file, mutate);
  try {
    assert.throws(() => validateBuild106Policy(), expectation);
  } finally {
    restore();
  }
  assert.doesNotThrow(() => validateBuild106Policy());
}

function publicConfig() {
  return {
    version: "1.1.6",
    runtimeVersion: "1.1.6-native.1",
    updates: { enabled: false, checkAutomatically: "NEVER" },
    ios: {
      buildNumber: "106",
      bundleIdentifier: "com.melaninmaps.app",
      infoPlist: { UIBackgroundModes: [] },
    },
    extra: {
      eas: { projectId: "0f873107-7787-46ab-9a04-685c2a6756b1" },
      commitSha: SHA,
      environment: "staging",
      releaseChannel: "testflight-staging",
      apiOrigin: STAGING_ORIGIN,
      revenueCatEnabled: false,
    },
  };
}

function introspectConfig() {
  return {
    ios: { buildNumber: "106", bundleIdentifier: "com.melaninmaps.app" },
    _internal: {
      modResults: {
        ios: {
          infoPlist: {
            UIBackgroundModes: ["remote-notification"],
            NSMicrophoneUsageDescription: "Kinfolk voice input",
            EXUpdatesEnabled: false,
          },
        },
      },
    },
  };
}

function withExport(contents, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build106-export-"));
  try {
    fs.writeFileSync(path.join(directory, "index.js"), contents);
    callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts the reviewed Build 106 staging/TestFlight contract", () => {
  assert.deepEqual(validateBuild106Policy().profile, "testflight-staging");
  const rootEas = JSON.parse(fs.readFileSync(ROOT_EAS_PATH, "utf8"));
  const eas = JSON.parse(fs.readFileSync(EAS_PATH, "utf8"));
  const mobilePackage = JSON.parse(fs.readFileSync(PACKAGE_PATH, "utf8"));
  const profile = eas.build["testflight-staging"];

  assert.deepEqual(rootEas.build, {});
  assert.deepEqual(rootEas.submit, {});
  assert.equal(profile.env.EXPO_PUBLIC_API_ORIGIN, STAGING_ORIGIN);
  assert.equal(profile.env.EXPO_PUBLIC_API_URL, undefined);
  assert.equal(profile.env.EXPO_PUBLIC_APP_ENV, "staging");
  assert.equal(profile.env.EXPO_PUBLIC_REVENUECAT_ENABLED, "false");
  assert.equal(profile.environment, undefined);
  assert.equal(mobilePackage.scripts["build:ios"], undefined);
  assert.equal(mobilePackage.scripts["build:android"], undefined);
  assert.equal(mobilePackage.dependencies["react-native-purchases"], undefined);
});

test("rejects production, alternate store, inherited environment, and root EAS profiles", () => {
  withJsonMutation(EAS_PATH, (eas) => { eas.build.production = { distribution: "store" }; }, /production build profile/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build.other = { distribution: "store" }; }, /unauthorized store build profile/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].environment = "production"; }, /must not inherit/);
  withJsonMutation(ROOT_EAS_PATH, (eas) => { eas.build.preview = { distribution: "internal" }; }, /root EAS build profiles/);
});

test("rejects production submit, Android submit, and profile identity drift", () => {
  withJsonMutation(EAS_PATH, (eas) => { eas.submit.production = { ios: {} }; }, /production submit profile/);
  withJsonMutation(EAS_PATH, (eas) => { eas.submit["testflight-staging"].android = { track: "internal" }; }, /iOS-only/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].env.EXPO_PUBLIC_DOMAIN = "www.mappingwithmelanin.com"; }, /domain is not staging/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].env.EXPO_PUBLIC_API_ORIGIN = "https://www.mappingwithmelanin.com"; }, /API origin is not staging/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].env.APP_ENV = "production"; }, /APP_ENV mismatch/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].channel = "production"; }, /channel mismatch/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].env.EXPO_PUBLIC_REVENUECAT_ENABLED = "true"; }, /disable RevenueCat/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].android = { buildType: "app-bundle" }; }, /must not define Android/);
});

test("rejects direct package EAS aliases and the native RevenueCat SDK", () => {
  withJsonMutation(PACKAGE_PATH, (pkg) => { pkg.scripts["unsafe-build"] = "eas build --platform ios --profile production"; }, /directly invokes eas build/);
  withJsonMutation(PACKAGE_PATH, (pkg) => { pkg.dependencies["react-native-purchases"] = "10.4.2"; }, /native RevenueCat SDK/);
});

test("dynamic Expo configuration explicitly disables Updates for staging", () => {
  const source = fs.readFileSync(APP_CONFIG_PATH, "utf8");
  assert.match(source, /enabled: false/);
  assert.match(source, /checkAutomatically: "NEVER"/);
  assert.match(source, /EXUpdatesEnabled: false/);
  assert.match(source, /EXPO_PUBLIC_API_ORIGIN/);
});

test("no-argument execution fails offline before any command can touch the network", () => {
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build106-noarg-"));
  const touched = path.join(fakeBin, "network-command-called");
  for (const command of ["git", "pnpm", "eas", "curl", "expo", "node", "npm", "npx"]) {
    fs.writeFileSync(path.join(fakeBin, command), `#!/bin/sh\nprintf '%s\\n' ${command} >> '${touched}'\nexit 99\n`, { mode: 0o755 });
  }
  try {
    const result = spawnSync("/bin/bash", [RELEASE], { cwd: ROOT, env: { ...process.env, PATH: fakeBin }, encoding: "utf8" });
    assert.equal(result.status, 64);
    assert.match(result.stderr, /No action is taken without an explicit mode/);
    assert.equal(fs.existsSync(touched), false);
  } finally {
    fs.rmSync(fakeBin, { recursive: true, force: true });
  }
});

test("unauthorized modes fail before git, package managers, EAS, or backend clients", () => {
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build106-mode-"));
  const touched = path.join(fakeBin, "network-command-called");
  for (const command of ["git", "pnpm", "eas", "curl", "expo", "node", "npm", "npx"]) {
    fs.writeFileSync(path.join(fakeBin, command), `#!/bin/sh\nprintf '%s\\n' ${command} >> '${touched}'\nexit 99\n`, { mode: 0o755 });
  }
  try {
    for (const mode of ["verify", "ios-testflight", "android-build", "production", "eas-update"]) {
      const result = spawnSync("/bin/bash", [RELEASE, mode], { cwd: ROOT, env: { ...process.env, PATH: fakeBin }, encoding: "utf8" });
      assert.notEqual(result.status, 0, mode);
      assert.match(result.stderr, /only ios-testflight-staging is authorized/, mode);
    }
    assert.equal(fs.existsSync(touched), false);
  } finally {
    fs.rmSync(fakeBin, { recursive: true, force: true });
  }
});

test("the only dispatcher EAS invocation builds iOS staging with frozen signing and TestFlight auto-submit", () => {
  const source = fs.readFileSync(RELEASE, "utf8");
  const calls = source.match(/pnpm exec eas [\s\S]*?(?=\n\nprintf|$)/g) ?? [];
  assert.equal(calls.length, 1);
  assert.match(calls[0], /eas build/);
  assert.match(calls[0], /--platform ios/);
  assert.match(calls[0], /--profile testflight-staging/);
  assert.match(calls[0], /--freeze-credentials/);
  assert.match(calls[0], /--auto-submit-with-profile testflight-staging/);
  assert.match(source, /expo export --platform ios --no-bytecode/);
  assert.doesNotMatch(calls[0], /production|android|eas update|submit --platform/);
  assert.match(source, /export EXPO_PUBLIC_API_ORIGIN="\$STAGING_ORIGIN"/);
  assert.match(source, /unset EXPO_PUBLIC_API_URL/);
});

test("accepts exact public config, introspection, and iOS export staging proof", () => {
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)};`, (directory) => {
    const result = validateExpoOutput(publicConfig(), introspectConfig(), directory, SHA);
    assert.equal(result.stagingHits, 1);
  });
});

test("rejects production backend, missing Updates lock, and background audio in generated proof", () => {
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)}; const prod="https://www.mappingwithmelanin.com";`, (directory) => {
    assert.throws(() => validateExpoOutput(publicConfig(), introspectConfig(), directory, SHA), /production backend/);
  });
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)};`, (directory) => {
    const config = publicConfig();
    config.updates.enabled = true;
    assert.throws(() => validateExpoOutput(config, introspectConfig(), directory, SHA), /disable OTA updates/);
  });
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)};`, (directory) => {
    const introspect = introspectConfig();
    introspect._internal.modResults.ios.infoPlist.UIBackgroundModes.push("audio");
    assert.throws(() => validateExpoOutput(publicConfig(), introspect, directory, SHA), /background audio/);
  });
});

test("shell entrypoint remains syntactically valid", () => {
  assert.doesNotThrow(() => execFileSync("bash", ["-n", RELEASE], { stdio: "ignore" }));
});
