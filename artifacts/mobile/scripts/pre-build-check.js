#!/usr/bin/env node
/**
 * Pre-build gate for Mapping With Melanin production EAS builds.
 *
 * Usage:
 *   node scripts/pre-build-check.js ios
 *   node scripts/pre-build-check.js android
 *   node scripts/pre-build-check.js all
 *
 * Reads app.json for current build numbers and .build-record.json for
 * the last numbers submitted to Apple / Google. Blocks the build if
 * the current number is not strictly greater than the last submitted.
 *
 * After a successful EAS build, update .build-record.json manually
 * (or run: node scripts/pre-build-check.js --record ios|android).
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SCRIPT_DIR = path.dirname(require.resolve("./pre-build-check.js"));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const APP_JSON = path.join(ROOT, "app.json");
const RECORD_FILE = path.join(ROOT, ".build-record.json");

// ── helpers ────────────────────────────────────────────────────────────────

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function banner(text, char = "─") {
  const line = char.repeat(60);
  console.log(`\n${line}`);
  console.log(` ${text}`);
  console.log(line);
}

function pass(label, value) {
  console.log(`  ✅  ${label.padEnd(30)} ${value}`);
}

function fail(label, value) {
  console.log(`  ❌  ${label.padEnd(30)} ${value}`);
}

function info(label, value) {
  console.log(`  ℹ️   ${label.padEnd(30)} ${value}`);
}

// ── load files ─────────────────────────────────────────────────────────────

const appJson = readJSON(APP_JSON);
if (!appJson) {
  console.error("FATAL: cannot read app.json");
  process.exit(1);
}

const record = readJSON(RECORD_FILE) ?? {
  lastIosSubmitted: 0,
  lastAndroidSubmitted: 0,
};

// ── read current state ─────────────────────────────────────────────────────

const version = appJson.expo.version;
const iosBuild = parseInt(appJson.expo.ios.buildNumber, 10);
const androidCode = parseInt(appJson.expo.android.versionCode, 10);
const bundle = appJson.expo.ios.bundleIdentifier;
const easProjectId =
  appJson.expo.extra?.eas?.projectId ?? "(not found in app.json)";
const expoAudioPlugin = (appJson.expo.plugins ?? []).find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-audio"
);
const expoAudioOptions = Array.isArray(expoAudioPlugin)
  ? expoAudioPlugin[1] ?? {}
  : {};
const declaredBackgroundModes = Array.isArray(
  appJson.expo.ios?.infoPlist?.UIBackgroundModes
)
  ? appJson.expo.ios.infoPlist.UIBackgroundModes
  : [];
const backgroundAudioDisabled =
  expoAudioOptions.enableBackgroundPlayback === false &&
  expoAudioOptions.enableBackgroundRecording === false &&
  !declaredBackgroundModes.includes("audio");

let gitCommit = "(unknown)";
let gitDirty = false;
try {
  gitCommit = execSync("git rev-parse --short HEAD", { cwd: ROOT })
    .toString()
    .trim();
  const status = execSync("git status --porcelain -- .", { cwd: ROOT })
    .toString()
    .trim();
  gitDirty = status.length > 0;
} catch {
  // non-fatal
}

// ── parse platform arg ─────────────────────────────────────────────────────

const arg = process.argv[2] ?? "all";

// Record mode: update .build-record.json after a successful build
if (arg === "--record") {
  const platform = process.argv[3];
  const updated = { ...record };
  if (platform === "ios" || platform === "all")
    updated.lastIosSubmitted = iosBuild;
  if (platform === "android" || platform === "all")
    updated.lastAndroidSubmitted = androidCode;
  fs.writeFileSync(RECORD_FILE, JSON.stringify(updated, null, 2) + "\n");
  console.log("✅  .build-record.json updated:", updated);
  process.exit(0);
}

const checkIos = arg === "ios" || arg === "all";
const checkAndroid = arg === "android" || arg === "all";

// ── print pre-build checklist ──────────────────────────────────────────────

banner("MWM PRE-BUILD CHECKLIST", "═");

console.log("\n  ENVIRONMENT");
info("Working directory", ROOT);
info("Git commit", gitCommit + (gitDirty ? " (dirty — uncommitted changes)" : " (clean)"));
info("EAS Project ID", easProjectId);
info("Bundle / Package", bundle);
info("App version", version);

console.log("\n  BUILD NUMBERS");
if (checkIos) {
  info("iOS — last submitted", record.lastIosSubmitted);
  info("iOS — current in app.json", iosBuild);
  info("iOS — required minimum", record.lastIosSubmitted + 1);
}
if (checkAndroid) {
  info("Android — last submitted", record.lastAndroidSubmitted);
  info("Android — current in app.json", androidCode);
  info("Android — required minimum", record.lastAndroidSubmitted + 1);
}

// ── validation ─────────────────────────────────────────────────────────────

banner("VALIDATION RESULTS");

let blocked = false;

if (checkIos) {
  if (iosBuild > record.lastIosSubmitted) {
    pass("iOS build number", `${iosBuild} > ${record.lastIosSubmitted} ✓`);
  } else {
    fail(
      "iOS build number",
      `${iosBuild} is NOT > ${record.lastIosSubmitted} — must increment`
    );
    blocked = true;
  }

  if (backgroundAudioDisabled) {
    pass(
      "iOS background audio",
      "disabled; foreground microphone and playback remain available"
    );
  } else {
    fail(
      "iOS background audio",
      "UIBackgroundModes audio may be generated — App Review Guideline 2.5.4"
    );
    blocked = true;
  }
}

if (checkAndroid) {
  if (androidCode > record.lastAndroidSubmitted) {
    pass("Android versionCode", `${androidCode} > ${record.lastAndroidSubmitted} ✓`);
  } else {
    fail(
      "Android versionCode",
      `${androidCode} is NOT > ${record.lastAndroidSubmitted} — must increment`
    );
    blocked = true;
  }
}

if (gitDirty) {
  fail("Working tree", "has uncommitted changes in artifacts/mobile");
  blocked = true;
} else {
  pass("Working tree", "clean");
}

if (easProjectId === "(not found in app.json)") {
  fail("EAS Project ID", "not found — check app.json extras.eas.projectId");
  blocked = true;
} else {
  pass("EAS Project ID", easProjectId);
}

// ── result ─────────────────────────────────────────────────────────────────

if (blocked) {
  banner("BUILD BLOCKED", "!");
  console.log(
    "\n  BUILD BLOCKED — Build number was not incremented (or other check failed).\n"
  );
  console.log("  Fix the items marked ❌ above, then re-run this script.\n");
  process.exit(1);
} else {
  banner("BUILD APPROVED ✅");
  console.log("\n  All checks passed. Safe to run:\n");
  if (checkIos) {
    console.log(
      `    eas build --platform ios --profile production`
    );
    console.log(
      `\n  After the build completes, record the submitted number:\n`
    );
    console.log(
      `    node scripts/pre-build-check.js --record ios\n`
    );
  }
  if (checkAndroid) {
    console.log(
      `    eas build --platform android --profile production`
    );
    console.log(
      `\n  After the build completes, record the submitted number:\n`
    );
    console.log(
      `    node scripts/pre-build-check.js --record android\n`
    );
  }
}
