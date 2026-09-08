"use strict";

const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { validateBuild107Policy } = require("../validate-build-107-staging.cjs");
const { validateBuild107ExpoOutput } = require("../validate-build-107-expo-output.cjs");
const { validateBuild107EasEnvironment } = require("../validate-build-107-eas-environment.cjs");
const { validateBuild107Archive } = require("../validate-build-107-archive.cjs");

const ROOT = path.resolve(__dirname, "../..");
const RELEASE = path.join(ROOT, "scripts/release-build-107.sh");
const EAS_PATH = path.join(ROOT, "artifacts/mobile/eas.json");
const APP_PATH = path.join(ROOT, "artifacts/mobile/app.json");
const MAP_DATA_PATH = path.join(ROOT, "artifacts/mobile/lib/mapData.ts");
const SHA = "a".repeat(40);
const STAGING_ORIGIN = "https://mwm-staging.35.196.78.19.nip.io";

function mutateJson(file, mutate) {
  const original = fs.readFileSync(file, "utf8");
  const parsed = JSON.parse(original);
  mutate(parsed);
  fs.writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
  return () => fs.writeFileSync(file, original);
}

function withRejectedMutation(file, mutate, expectation) {
  const restore = mutateJson(file, mutate);
  try {
    assert.throws(() => validateBuild107Policy(), expectation);
  } finally {
    restore();
  }
  assert.doesNotThrow(() => validateBuild107Policy());
}

function publicConfig() {
  return {
    version: "1.1.7",
    runtimeVersion: "1.1.7-native.1",
    updates: { enabled: false, checkAutomatically: "NEVER" },
    ios: { buildNumber: "107", bundleIdentifier: "com.melaninmaps.app", infoPlist: { UIBackgroundModes: [] } },
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
    ios: { buildNumber: "107", bundleIdentifier: "com.melaninmaps.app" },
    _internal: { modResults: { ios: { infoPlist: {
      UIBackgroundModes: ["remote-notification"],
      NSMicrophoneUsageDescription: "Kinfolk voice input",
      EXUpdatesEnabled: false,
    } } } },
  };
}

function withExport(contents, callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build107-export-"));
  try {
    fs.writeFileSync(path.join(directory, "index.js"), contents);
    callback(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts the reviewed Build 107 staging and native-map contract", () => {
  assert.equal(validateBuild107Policy().profile, "testflight-staging");
  const app = JSON.parse(fs.readFileSync(APP_PATH, "utf8")).expo;
  assert.equal(app.version, "1.1.7");
  assert.equal(app.ios.buildNumber, "107");
  assert.equal(app.runtimeVersion, "1.1.7-native.1");
});

test("rejects production, Android, alternate store, and profile identity drift", () => {
  withRejectedMutation(EAS_PATH, (eas) => { eas.build.production = { distribution: "store" }; }, /production build profile/);
  withRejectedMutation(EAS_PATH, (eas) => { eas.build.other = { distribution: "store" }; }, /unauthorized store build profile/);
  withRejectedMutation(EAS_PATH, (eas) => { eas.submit["testflight-staging"].android = { track: "internal" }; }, /iOS-only/);
  withRejectedMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].env.EXPO_PUBLIC_API_ORIGIN = "https://www.mappingwithmelanin.com"; }, /API origin is not staging/);
  withRejectedMutation(EAS_PATH, (eas) => { eas.build["testflight-staging"].android = { buildType: "app-bundle" }; }, /must not define Android/);
});

test("rejects Build 107 metadata drift and OTA/background-audio activation", () => {
  withRejectedMutation(APP_PATH, (app) => { app.expo.ios.buildNumber = "108"; }, /build number/);
  withRejectedMutation(APP_PATH, (app) => { app.expo.runtimeVersion = "1.1.6-native.1"; }, /runtime/);
  withRejectedMutation(APP_PATH, (app) => { app.expo.android.versionCode = 81; }, /Android versionCode/);
  withRejectedMutation(APP_PATH, (app) => { app.expo.ios.infoPlist.UIBackgroundModes = ["audio"]; }, /background audio/);
});

test("rejects alternate backend origins in native source", () => {
  const original = fs.readFileSync(MAP_DATA_PATH, "utf8");
  for (const [literal, expectation] of [
    ["https://unreviewed.example/v1", /unreviewed URL origin/],
    ["HTTPS://unreviewed.example/v1", /unreviewed URL origin/],
    ["https://mwm-staging.35.196.78.19.nip.io@unreviewed.example/v1", /URL credentials or user-info/],
    ["//unreviewed.example/v1", /unreviewed URL origin/],
    ["//127.0.0.1/v1", /unreviewed URL origin/],
    ["//localhost/v1", /unreviewed URL origin/],
  ]) {
    try {
      fs.writeFileSync(MAP_DATA_PATH, `${original}\nexport const unsafeBackend = ${JSON.stringify(literal)};\n`);
      assert.throws(() => validateBuild107Policy(), expectation);
    } finally {
      fs.writeFileSync(MAP_DATA_PATH, original);
    }
  }
  for (const sourceExpression of [
    String.raw`"https:\u002f\u002funreviewed.example/v1"`,
    String.raw`"https:\\unreviewed.example/v1"`,
    `"https://" + "unreviewed.example/v1"`,
  ]) {
    try {
      fs.writeFileSync(MAP_DATA_PATH, `${original}\nexport const unsafeEncodedBackend = ${sourceExpression};\n`);
      assert.throws(() => validateBuild107Policy(), /unreviewed URL origin/);
    } finally {
      fs.writeFileSync(MAP_DATA_PATH, original);
    }
  }
  try {
    fs.writeFileSync(MAP_DATA_PATH, `${original}\nconst unsafeHost = "unreviewed.example"; export const unsafeTemplateBackend = \`https://\${unsafeHost}/v1\`;\n`);
    assert.throws(() => validateBuild107Policy(), /unreviewed URL origin/);
  } finally {
    fs.writeFileSync(MAP_DATA_PATH, original);
  }
  assert.doesNotThrow(() => validateBuild107Policy());
});

test("no argument and unauthorized modes fail before network-capable commands", () => {
  const fakeBin = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build107-offline-"));
  const touched = path.join(fakeBin, "network-command-called");
  for (const command of ["git", "pnpm", "eas", "curl", "expo", "node", "npm", "npx"]) {
    fs.writeFileSync(path.join(fakeBin, command), `#!/bin/sh\nprintf '%s\\n' ${command} >> '${touched}'\nexit 99\n`, { mode: 0o755 });
  }
  try {
    const noArg = spawnSync("/bin/bash", [RELEASE], { cwd: ROOT, env: { ...process.env, PATH: fakeBin }, encoding: "utf8" });
    assert.equal(noArg.status, 64);
    assert.match(noArg.stderr, /No action is taken without an explicit mode/);
    for (const mode of ["verify", "ios-testflight", "android-build", "production", "eas-update"]) {
      const result = spawnSync("/bin/bash", [RELEASE, mode], { cwd: ROOT, env: { ...process.env, PATH: fakeBin }, encoding: "utf8" });
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /only ios-testflight-staging is authorized/);
    }
    assert.equal(fs.existsSync(touched), false);
  } finally {
    fs.rmSync(fakeBin, { recursive: true, force: true });
  }
});

test("the dispatcher performs one iOS build with frozen signing and TestFlight auto-submit", () => {
  const source = fs.readFileSync(RELEASE, "utf8");
  assert.equal((source.match(/pnpm exec eas build \\/g) ?? []).length, 1);
  assert.match(source, /eas env:list testflight-staging --scope project/);
  assert.match(source, /eas env:list testflight-staging --scope account/);
  assert.match(source, /eas build:inspect/);
  assert.match(source, /--platform ios/);
  assert.match(source, /--profile testflight-staging/);
  assert.match(source, /--freeze-credentials/);
  assert.match(source, /--auto-submit-with-profile testflight-staging/);
  assert.doesNotMatch(source, /--profile production|--platform android|eas update|submit --platform/);
});

test("requires an empty dedicated EAS environment", () => {
  const empty = "Environment: testflight-staging\nNo variables found for this environment.\n";
  assert.deepEqual(validateBuild107EasEnvironment(empty, empty), {
    environment: "testflight-staging",
    projectVariables: 0,
    accountVariables: 0,
  });
  assert.throws(() => validateBuild107EasEnvironment("Environment: testflight-staging\nSECRET=*****\n", empty), /must be empty|contains a variable/);
});

test("rejects signing files, logs, environment files, and credential literals in the EAS archive", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build107-archive-"));
  const mobile = path.join(root, "artifacts/mobile");
  fs.mkdirSync(path.join(mobile, "lib"), { recursive: true });
  fs.writeFileSync(path.join(mobile, "app.json"), "{}\n");
  fs.writeFileSync(path.join(mobile, "lib/api.ts"), `export const api = '${STAGING_ORIGIN}';\n`);
  try {
    assert.doesNotThrow(() => validateBuild107Archive(root));
    for (const [name, value] of [["dist_cert.p12", "binary"], ["complaint_log.txt", "log"], [".env.staging", "SECRET=value"], ["leak.txt", "sk-abcdefghijklmnopqrstuvwxyz1234567890"]]) {
      const candidate = path.join(root, name);
      fs.writeFileSync(candidate, value);
      assert.throws(() => validateBuild107Archive(root), /artifact|environment file|credential-like literal/);
      fs.rmSync(candidate);
    }
    const credential = "sk-abcdefghijklmnopqrstuvwxyz1234567890";
    const plist = path.join(root, "Config.plist");
    fs.writeFileSync(plist, `<plist><string>${credential}</string></plist>`);
    assert.throws(() => validateBuild107Archive(root), /credential-like literal/);
    fs.rmSync(plist);

    const binary = path.join(root, "Config.blob");
    fs.writeFileSync(binary, Buffer.concat([Buffer.from([0, 1, 2, 3]), Buffer.from(credential)]));
    assert.throws(() => validateBuild107Archive(root), /credential-like literal/);
    fs.rmSync(binary);

    const wordPrefixed = path.join(root, "word-prefixed.blob");
    fs.writeFileSync(wordPrefixed, Buffer.from(`X${credential}`));
    assert.throws(() => validateBuild107Archive(root), /credential-like literal/);
    fs.rmSync(wordPrefixed);

    const utf16be = path.join(root, "utf16be.blob");
    fs.writeFileSync(utf16be, Buffer.from([...credential].flatMap((character) => [0, character.charCodeAt(0)])));
    assert.throws(() => validateBuild107Archive(root), /credential-like literal/);
    fs.rmSync(utf16be);

    const large = path.join(root, "large-config.bin");
    fs.writeFileSync(large, Buffer.concat([Buffer.alloc(6 * 1024 * 1024, 65), Buffer.from(`\n${credential}\n`)]));
    assert.throws(() => validateBuild107Archive(root), /credential-like literal/);
    fs.rmSync(large);

    const outside = path.join(os.tmpdir(), `mwm-build107-outside-${process.pid}`);
    fs.writeFileSync(outside, credential);
    const escapingLink = path.join(root, "outside-link");
    fs.symlinkSync(outside, escapingLink);
    assert.throws(() => validateBuild107Archive(root), /symlink escapes root/);
    fs.rmSync(escapingLink);
    fs.rmSync(outside);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("excludes compiled websites and founder-import data at any depth from the mobile EAS archive", () => {
  const excludedTrees = ["artifacts/web-static", "web-static", "data/founder-imports"];
  for (const relative of [".easignore", "artifacts/mobile/.easignore"]) {
    const contents = fs.readFileSync(path.join(ROOT, relative), "utf8");
    for (const tree of excludedTrees) {
      assert(contents.split("\n").includes(tree));
    }
  }
  for (const tree of excludedTrees) {
    const tracked = execFileSync("git", ["ls-files", tree], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim().split("\n").filter(Boolean);
    const removedByEasGitRule = execFileSync("git", [
      "ls-files",
      "--exclude-from", ".easignore",
      "--ignored",
      "--cached",
      "--",
      tree,
    ], { cwd: ROOT, encoding: "utf8" }).trim().split("\n").filter(Boolean);
    assert(tracked.length > 0);
    assert.deepEqual(removedByEasGitRule, tracked);
  }

  for (const tree of excludedTrees) {
    for (const wrapper of ["", "repo-root", "inspection/output/repo-root"]) {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "mwm-build107-irrelevant-tree-"));
      const archiveRoot = path.join(root, wrapper);
      const mobile = path.join(archiveRoot, "artifacts/mobile");
      fs.mkdirSync(path.join(mobile, "lib"), { recursive: true });
      fs.writeFileSync(path.join(mobile, "app.json"), "{}\n");
      fs.writeFileSync(path.join(mobile, "lib/api.ts"), `export const api = '${STAGING_ORIGIN}';\n`);
      const irrelevantTree = path.join(archiveRoot, tree);
      fs.mkdirSync(irrelevantTree, { recursive: true });
      fs.writeFileSync(path.join(irrelevantTree, "candidate.txt"), "harmless source material\n");
      try {
        assert.throws(
          () => validateBuild107Archive(root),
          /mobile-irrelevant source data entered EAS archive/,
        );
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    }
  }
});

test("accepts exact Expo staging proof and rejects production/OTA/audio drift", () => {
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)};`, (directory) => {
    assert.equal(validateBuild107ExpoOutput(publicConfig(), introspectConfig(), directory, SHA).stagingHits, 1);
    const ota = publicConfig();
    ota.updates.enabled = true;
    assert.throws(() => validateBuild107ExpoOutput(ota, introspectConfig(), directory, SHA), /disable OTA updates/);
    const audio = introspectConfig();
    audio._internal.modResults.ios.infoPlist.UIBackgroundModes.push("audio");
    assert.throws(() => validateBuild107ExpoOutput(publicConfig(), audio, directory, SHA), /background audio/);
  });
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)}; const prod="https://www.mappingwithmelanin.com";`, (directory) => {
    assert.throws(() => validateBuild107ExpoOutput(publicConfig(), introspectConfig(), directory, SHA), /production backend|unreviewed URL origin/);
  });
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)}; const alternate="https://unreviewed.example/v1";`, (directory) => {
    assert.throws(() => validateBuild107ExpoOutput(publicConfig(), introspectConfig(), directory, SHA), /unreviewed URL origin/);
  });
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)}; const alternate="HTTPS://unreviewed.example/v1";`, (directory) => {
    assert.throws(() => validateBuild107ExpoOutput(publicConfig(), introspectConfig(), directory, SHA), /unreviewed URL origin/);
  });
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)}; const alternate="https://mwm-staging.35.196.78.19.nip.io@unreviewed.example/v1";`, (directory) => {
    assert.throws(() => validateBuild107ExpoOutput(publicConfig(), introspectConfig(), directory, SHA), /URL credentials or user-info/);
  });
  withExport(`const api=${JSON.stringify(STAGING_ORIGIN)}; const alternate="//unreviewed.example/v1";`, (directory) => {
    assert.throws(() => validateBuild107ExpoOutput(publicConfig(), introspectConfig(), directory, SHA), /unreviewed URL origin/);
  });
  for (const encodedSource of [
    String.raw`const alternate="https:\u002f\u002funreviewed.example/v1";`,
    String.raw`const alternate="https:\\unreviewed.example/v1";`,
    `const alternate="https://" + "unreviewed.example/v1";`,
    'const alternateHost="unreviewed.example"; const alternate=`https://${alternateHost}/v1`;',
    `const alternate="//127.0.0.1/v1";`,
    `const alternate="//localhost/v1";`,
  ]) {
    withExport(`const api=${JSON.stringify(STAGING_ORIGIN)}; ${encodedSource}`, (directory) => {
      assert.throws(() => validateBuild107ExpoOutput(publicConfig(), introspectConfig(), directory, SHA), /unreviewed URL origin/);
    });
  }
});

test("shell entrypoint remains syntactically valid", () => {
  assert.doesNotThrow(() => execFileSync("bash", ["-n", RELEASE], { stdio: "ignore" }));
});
