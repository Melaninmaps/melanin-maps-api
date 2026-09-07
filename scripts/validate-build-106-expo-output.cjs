#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const STAGING_DOMAIN = "mwm-staging.35.196.78.19.nip.io";
const STAGING_ORIGIN = `https://${STAGING_DOMAIN}`;
const PRODUCTION_BACKEND = "https://www.mappingwithmelanin.com";
const PROJECT_ID = "0f873107-7787-46ab-9a04-685c2a6756b1";
const APP_ID = "com.melaninmaps.app";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function collectFiles(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(absolute, output);
    else output.push(absolute);
  }
  return output;
}

function validateExpoOutput(publicConfig, introspectConfig, exportDirectory, expectedSha) {
  assert(/^[0-9a-f]{40}$/.test(expectedSha), "expected export SHA must be a full lowercase Git SHA");
  assert(publicConfig.version === "1.1.6", "public Expo version mismatch");
  assert(publicConfig.ios?.buildNumber === "106", "public Expo iOS build mismatch");
  assert(publicConfig.runtimeVersion === "1.1.6-native.1", "public Expo runtime mismatch");
  assert(publicConfig.ios?.bundleIdentifier === APP_ID, "public Expo bundle identifier mismatch");
  assert(publicConfig.extra?.eas?.projectId === PROJECT_ID, "public Expo project identifier mismatch");
  assert(publicConfig.extra?.commitSha === expectedSha, "public Expo source SHA mismatch");
  assert(publicConfig.extra?.environment === "staging", "public Expo APP_ENV mismatch");
  assert(publicConfig.extra?.releaseChannel === "testflight-staging", "public Expo release channel mismatch");
  assert(publicConfig.extra?.apiOrigin === STAGING_ORIGIN, "public Expo API origin mismatch");
  assert(publicConfig.extra?.revenueCatEnabled === false, "public Expo config must disable RevenueCat");
  assert(publicConfig.updates?.enabled === false, "public Expo config must disable OTA updates");
  assert(publicConfig.updates?.checkAutomatically === "NEVER", "public Expo config must never check for OTA updates");
  assert(!(publicConfig.ios?.infoPlist?.UIBackgroundModes ?? []).includes("audio"), "public Expo config enables background audio");

  const infoPlist = introspectConfig?._internal?.modResults?.ios?.infoPlist ?? {};
  assert(introspectConfig.ios?.bundleIdentifier === APP_ID, "introspected bundle identifier mismatch");
  assert(introspectConfig.ios?.buildNumber === "106", "introspected iOS build mismatch");
  assert(!(infoPlist.UIBackgroundModes ?? []).includes("audio"), "introspected Info.plist enables background audio");
  assert(infoPlist.EXUpdatesEnabled === false, "introspected Info.plist must disable Expo Updates");
  assert(typeof infoPlist.NSMicrophoneUsageDescription === "string" && infoPlist.NSMicrophoneUsageDescription.length > 0, "introspected microphone permission is missing");

  const files = collectFiles(exportDirectory);
  const textual = files.filter((file) => /\.(?:js|json|map|txt|html)$/i.test(file));
  assert(textual.length > 0, "Expo export contained no inspectable bundle files");
  let stagingHits = 0;
  const productionHits = [];
  for (const file of textual) {
    const source = fs.readFileSync(file, "utf8");
    if (source.includes(STAGING_DOMAIN)) stagingHits += 1;
    if (source.includes(PRODUCTION_BACKEND)) productionHits.push(path.relative(exportDirectory, file));
  }
  assert(stagingHits > 0, "Expo iOS export does not contain the reviewed staging origin");
  assert(productionHits.length === 0, `Expo iOS export contains the production backend in: ${productionHits.join(", ")}`);
  return { inspectedFiles: textual.length, stagingHits };
}

module.exports = { validateExpoOutput };

if (require.main === module) {
  try {
    const [publicPath, introspectPath, exportDirectory, expectedSha] = process.argv.slice(2);
    assert(publicPath && introspectPath && exportDirectory && expectedSha, "usage: validate-build-106-expo-output.cjs <public.json> <introspect.json> <export-dir> <sha>");
    const result = validateExpoOutput(
      JSON.parse(fs.readFileSync(publicPath, "utf8")),
      JSON.parse(fs.readFileSync(introspectPath, "utf8")),
      exportDirectory,
      expectedSha,
    );
    console.log(`Build 106 Expo staging proof passed (${result.inspectedFiles} files, ${result.stagingHits} staging hits).`);
  } catch (error) {
    console.error(`BUILD_106_BLOCKED: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
