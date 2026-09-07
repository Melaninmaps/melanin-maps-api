"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { validateBuild106Policy } = require("../validate-build-106-staging.cjs");
const { validateExpoOutput } = require("../validate-build-106-expo-output.cjs");
const { validateBuild106EasEnvironment } = require("../validate-build-106-eas-environment.cjs");
const { validateBuild106Archive } = require("../validate-build-106-archive.cjs");

const ROOT = path.resolve(__dirname, "../..");
const RELEASE = path.join(ROOT, "scripts/release-build-106.sh");
const ROOT_EAS_PATH = path.join(ROOT, "eas.json");
const EAS_PATH = path.join(ROOT, "artifacts/mobile/eas.json");
const ROOT_EAS_IGNORE = path.join(ROOT, ".easignore");
const MOBILE_EAS_IGNORE = path.join(ROOT, "artifacts/mobile/.easignore");
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
  assert.equal(profile.environment, "testflight-staging");
  assert.equal(mobilePackage.scripts["build:ios"], undefined);
  assert.equal(mobilePackage.scripts["build:android"], undefined);
  assert.equal(mobilePackage.dependencies["react-native-purchases"], undefined);
});

test("rejects production, alternate store, wrong environment, and root EAS profiles", () => {
  withJsonMutation(EAS_PATH, (eas) => { eas.build.production = { distribution: "store" }; }, /production build profile/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build.other = { distribution: "store" }; }, /unauthorized store build profile/);
  withJsonMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].environment = "production"; }, /dedicated testflight-staging EAS environment/);
  withJsonMutation(EAS_PATH, (eas) => { delete eas.build["testflight-staging"].environment; }, /dedicated testflight-staging EAS environment/);
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

test("the dispatcher inspects remote environment and archive before one iOS build with frozen signing and TestFlight auto-submit", () => {
  const source = fs.readFileSync(RELEASE, "utf8");
  const buildCalls = source.match(/pnpm exec eas build \\/g) ?? [];
  assert.equal(buildCalls.length, 1);
  assert.match(source, /eas env:list testflight-staging --scope project/);
  assert.match(source, /eas env:list testflight-staging --scope account/);
  assert.match(source, /eas build:inspect/);
  assert.match(source, /--stage archive/);
  assert.match(source, /pnpm exec eas build \\\n[\s\S]*--platform ios/);
  assert.match(source, /pnpm exec eas build \\\n[\s\S]*--profile testflight-staging/);
  assert.match(source, /--freeze-credentials/);
  assert.match(source, /--auto-submit-with-profile testflight-staging/);
  assert.match(source, /expo export --platform ios --no-bytecode/);
  assert.doesNotMatch(source, /--profile production|--platform android|eas update|submit --platform/);
  assert.match(source, /export EXPO_PUBLIC_API_ORIGIN="\$STAGING_ORIGIN"/);
  assert.match(source, /unset EXPO_PUBLIC_API_URL/);
});

test("requires an empty dedicated EAS environment at project and account scopes", () => {
  const empty = "Environment: testflight-staging\nNo variables found for this environment.\n";
  assert.deepEqual(validateBuild106EasEnvironment(empty, empty), {
    environment: "testflight-staging",
    projectVariables: 0,
    accountVariables: 0,
  });
  assert.throws(
    () => validateBuild106EasEnvironment("Environment: testflight-staging\nEXPO_PUBLIC_API_ORIGIN=*****\n", empty),
    /must be empty|contains a variable/,
  );
});

test("rejects signing files, Replit config, environment files, and credential literals in the local EAS archive", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build106-archive-"));
  const mobile = path.join(root, "artifacts/mobile");
  fs.mkdirSync(path.join(mobile, "lib"), { recursive: true });
  fs.writeFileSync(path.join(mobile, "app.json"), "{}\n");
  fs.writeFileSync(path.join(mobile, "lib/api.ts"), "export const api = 'https://mwm-staging.35.196.78.19.nip.io';\n");
  try {
    assert.doesNotThrow(() => validateBuild106Archive(root));
    for (const [name, value] of [
      ["upload_keystore.jks", "binary"],
      ["google-services.json", "{\"api_key\":\"AIzaabcdefghijklmnopqrstuvwxyz1234567890\"}"],
      [".replit", "config"],
      [".replitignore", "config"],
      ["replit.nix", "config"],
      ["service-account.json", "{}"],
      ["google-service-account-prod.json", "{}"],
      ["my-credentials.json", "{}"],
      ["eas-credentials.json", "{}"],
      ["upload_credentials.json", "{}"],
      ["upload-credential.txt", "config"],
      ["upload_key.txt", "config"],
      ["upload_profile.txt", "config"],
      [".env.staging", "SECRET=value"],
      ["leak.txt", "sk-abcdefghijklmnopqrstuvwxyz1234567890"],
    ]) {
      const candidate = path.join(root, name);
      fs.writeFileSync(candidate, value);
      assert.throws(() => validateBuild106Archive(root), /artifact|environment file|credential-like literal/);
      fs.rmSync(candidate);
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("both EAS ignore files exclude the complete tracked risky-file inventory", () => {
  const tracked = execFileSync("git", ["-C", ROOT, "ls-files"], { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter((name) => /(^|\/)(\.replit(?:ignore)?$|\.replit-artifact\/|replit\.(?:md|nix)$|sedQ6qvzl$|google-services\.json$|GoogleService-Info\.plist$|credentials?\.json$|google-service-account\.json$|.*\.(?:jks|keystore|pem|p12|p8|pfx|key|cer|mobileprovision)$|upload_cert|upload_certificate)/i.test(name));
  assert(tracked.length > 0, "tracked risky-file inventory unexpectedly empty");

  for (const [label, ignorePath] of [["root", ROOT_EAS_IGNORE], ["mobile", MOBILE_EAS_IGNORE]]) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), `mwm-${label}-easignore-`));
    try {
      fs.copyFileSync(ignorePath, path.join(directory, ".gitignore"));
      execFileSync("git", ["-C", directory, "init", "-q"]);
      for (const relative of tracked) {
        const candidate = path.join(directory, relative);
        fs.mkdirSync(path.dirname(candidate), { recursive: true });
        fs.writeFileSync(candidate, "fixture");
        const result = spawnSync("git", ["-C", directory, "check-ignore", "-q", "--no-index", relative]);
        assert.equal(result.status, 0, `${label} .easignore permits tracked risky file ${relative}`);
      }
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
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
