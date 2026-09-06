#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const appJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "app.json"), "utf8"));
const buildRecord = JSON.parse(fs.readFileSync(path.join(projectRoot, ".build-record.json"), "utf8"));
const expoBinary = path.join(projectRoot, "node_modules", ".bin", "expo");

if (!fs.existsSync(expoBinary)) {
  console.error("iOS review config check failed: install locked dependencies first.");
  process.exit(1);
}

const output = execFileSync(expoBinary, ["config", "--type", "introspect", "--json"], {
  cwd: projectRoot,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "inherit"],
});
const config = JSON.parse(output);
const infoPlist = config?._internal?.modResults?.ios?.infoPlist ?? {};
const backgroundModes = Array.isArray(infoPlist.UIBackgroundModes) ? infoPlist.UIBackgroundModes : [];
const audioPlugin = (appJson.expo.plugins ?? []).find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-audio",
);
const audioOptions = Array.isArray(audioPlugin) ? audioPlugin[1] ?? {} : {};
const expectedBuild = String(Number(buildRecord.lastIosSubmitted) + 1);
const failures = [];

if (config?.ios?.bundleIdentifier !== "com.melaninmaps.app") failures.push("unexpected iOS bundle identifier");
if (config?.ios?.buildNumber !== expectedBuild) {
  failures.push(`expected next iOS build ${expectedBuild}, found ${config?.ios?.buildNumber ?? "missing"}`);
}
if (backgroundModes.includes("audio")) failures.push("generated UIBackgroundModes still contains audio");
if (audioOptions.enableBackgroundPlayback !== false) {
  failures.push("expo-audio enableBackgroundPlayback must be false");
}
if (audioOptions.enableBackgroundRecording !== false) {
  failures.push("expo-audio enableBackgroundRecording must be false");
}
if (
  typeof infoPlist.NSMicrophoneUsageDescription !== "string"
  || infoPlist.NSMicrophoneUsageDescription.trim().length === 0
) {
  failures.push("foreground microphone usage description is missing");
}

if (failures.length > 0) {
  console.error("iOS App Review configuration check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("iOS App Review configuration check passed.");
console.log(`Bundle identifier: ${config.ios.bundleIdentifier}`);
console.log(`Build number: ${config.ios.buildNumber}`);
console.log(`UIBackgroundModes: ${JSON.stringify(backgroundModes)}`);
console.log("Foreground Kinfolk microphone permission: present");
