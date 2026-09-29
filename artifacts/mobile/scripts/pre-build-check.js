#!/usr/bin/env node
/**
 * Native candidate preflight.
 *
 * This validates configuration facts only after an immutable release-evidence
 * chain has reached INTEGRATION_TESTED for the exact checked-out source SHA.
 * It never requests EAS, submits to a store, or records a build as consumed.
 *
 * Usage:
 *   node scripts/pre-build-check.js ios --release-evidence <snapshot.json>
 *   node scripts/pre-build-check.js android --release-evidence <snapshot.json>
 *   node scripts/pre-build-check.js all --release-evidence <snapshot.json>
 *   node scripts/pre-build-check.js ios --source-gate
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { pathToFileURL } = require("url");

const SCRIPT_DIR = path.dirname(require.resolve("./pre-build-check.js"));
const MOBILE_ROOT = path.resolve(SCRIPT_DIR, "..");
const REPOSITORY_ROOT = path.resolve(MOBILE_ROOT, "../..");
const APP_JSON = path.join(MOBILE_ROOT, "app.json");
const RECORD_FILE = path.join(MOBILE_ROOT, ".build-record.json");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function banner(text, character = "─") {
  const line = character.repeat(68);
  console.log(`\n${line}\n ${text}\n${line}`);
}

function pass(label, value) {
  console.log(`  PASS  ${label.padEnd(34)} ${value}`);
}

function fail(label, value) {
  console.log(`  FAIL  ${label.padEnd(34)} ${value}`);
}

function info(label, value) {
  console.log(`  INFO  ${label.padEnd(34)} ${value}`);
}

function exitUsage(message) {
  if (message) console.error(`BUILD_PREFLIGHT_BLOCKED: ${message}`);
  console.error("Usage: node scripts/pre-build-check.js ios|android|all --release-evidence <snapshot.json>|--source-gate");
  process.exit(64);
}

function parseArgs(argv) {
  const platform = argv[0] ?? "all";
  if (!["ios", "android", "all"].includes(platform)) {
    exitUsage("platform must be ios, android, or all");
  }
  const values = {};
  for (let index = 1; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) exitUsage(`unexpected argument ${key}`);
    if (key === "--source-gate") {
      values.sourceGate = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) exitUsage(`missing value for ${key}`);
    values[key.slice(2)] = value;
    index += 1;
  }
  if (values.sourceGate && values["release-evidence"]) {
    exitUsage("choose either --source-gate or --release-evidence, never both");
  }
  if (!values.sourceGate && !values["release-evidence"]) {
    exitUsage("--release-evidence is required; configuration alone is not build authorization");
  }
  return { platform, releaseEvidence: values["release-evidence"], sourceGate: values.sourceGate === true };
}

async function main() {
  const { platform, releaseEvidence, sourceGate } = parseArgs(process.argv.slice(2));
  const appJson = readJson(APP_JSON);
  if (!appJson?.expo) {
    throw new Error("cannot read artifacts/mobile/app.json");
  }

  let evidence = null;
  let evidencePath = null;
  if (!sourceGate) {
    evidencePath = path.resolve(process.cwd(), releaseEvidence);
    if (!fs.existsSync(evidencePath)) {
      throw new Error(`release evidence snapshot does not exist: ${evidencePath}`);
    }
    const { validateEvidence } = await import(
      pathToFileURL(path.join(REPOSITORY_ROOT, "scripts", "release-state.mjs")).href,
    );
    evidence = validateEvidence(readJson(evidencePath), {
      requireStage: "INTEGRATION_TESTED",
    });
  }

  const version = appJson.expo.version;
  const iosBuild = Number.parseInt(appJson.expo.ios.buildNumber, 10);
  const androidCode = Number.parseInt(appJson.expo.android.versionCode, 10);
  const easProjectId = appJson.expo.extra?.eas?.projectId ?? "(not found)";
  const sourceSha = execSync("git rev-parse HEAD", { cwd: REPOSITORY_ROOT })
    .toString()
    .trim();
  const gitDirty = execSync("git status --porcelain --untracked-files=all", {
    cwd: REPOSITORY_ROOT,
  })
    .toString()
    .trim().length > 0;
  const buildRecord = readJson(RECORD_FILE);

  banner("MWM NATIVE CANDIDATE PREFLIGHT", "═");
  if (sourceGate) {
    info("Mode", "source configuration gate only — not build authorization");
  } else {
    info("Candidate", evidence.candidate.id);
    info("Validated stage", evidence.transitions.at(-1).stage);
    info("Evidence snapshot", evidencePath);
  }
  info("Source SHA", sourceSha);
  info("App version", version);
  info("iOS build number", String(iosBuild));
  info("Android versionCode", String(androidCode));
  info("EAS project ID", easProjectId);

  banner("VALIDATION RESULTS");
  let blocked = false;

  if (evidence) {
    if (sourceSha !== evidence.candidate.sourceSha) {
      fail("Evidence source identity", "checked-out SHA does not equal the immutable candidate SHA");
      blocked = true;
    } else {
      pass("Evidence source identity", evidence.candidate.sourceSha);
    }
  }
  if (gitDirty) {
    fail("Repository working tree", "dirty source cannot produce a candidate artifact");
    blocked = true;
  } else {
    pass("Repository working tree", "clean");
  }
  if (easProjectId === "(not found)") {
    fail("EAS project identity", "missing from app.json");
    blocked = true;
  } else {
    pass("EAS project identity", easProjectId);
  }
  if (!Number.isInteger(iosBuild) || iosBuild <= 0) {
    fail("iOS build number", "must be a positive integer");
    blocked = true;
  } else if (platform === "ios" || platform === "all") {
    pass("iOS build number", String(iosBuild));
  }
  if (!Number.isInteger(androidCode) || androidCode <= 0) {
    fail("Android versionCode", "must be a positive integer");
    blocked = true;
  } else if (platform === "android" || platform === "all") {
    pass("Android versionCode", String(androidCode));
  }
  if (appJson.expo.ios.supportsTablet !== true || appJson.expo.ios.infoPlist?.UIRequiresFullScreen !== false) {
    fail("iPad capability", "tablet support or multitasking configuration changed");
    blocked = true;
  } else {
    pass("iPad capability", "tablet support and multitasking preserved");
  }

  if (buildRecord) {
    info("Legacy build record", "read-only historical context; verify live EAS/store records before assigning a number");
  } else {
    info("Legacy build record", "absent; live EAS/store review remains required");
  }

  if (blocked) {
    banner("BUILD PREFLIGHT BLOCKED", "!");
    process.exitCode = 1;
    return;
  }

  if (sourceGate) {
    banner("SOURCE CONFIGURATION VALIDATED");
    console.log("This source-only result is not native build authorization. No EAS build request, artifact upload, TestFlight action, Play action, or record update was performed.");
  } else {
    banner("CANDIDATE CONFIGURATION VALIDATED");
    console.log("No EAS build request, artifact upload, TestFlight action, Play action, or record update was performed.");
    console.log("Before an approved build request, obtain live EAS and store-number evidence and record the returned artifact facts in a new evidence snapshot.");
  }
}

main().catch((error) => {
  console.error(`BUILD_PREFLIGHT_BLOCKED: ${error.message}`);
  process.exitCode = 1;
});
