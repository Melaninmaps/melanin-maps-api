#!/usr/bin/env node
/**
 * Deterministic, read-only mobile audit preflight.
 *
 * This intentionally does not build, submit, deploy, mutate app.json, or
 * contact production services. It checks the local Expo route/config surface
 * and the source contracts that are easy to regress before an EAS build.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "app");
const APP_JSON = path.join(ROOT, "app.json");
const PACKAGE_JSON = path.join(ROOT, "package.json");

const failures = [];
const notes = [];

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    failures.push(`${path.relative(ROOT, file)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (error) {
    failures.push(`${path.relative(ROOT, file)} could not be read: ${error.message}`);
    return "";
  }
}

function requireFile(relativePath) {
  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) failures.push(`Missing required file: ${relativePath}`);
  return file;
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(absolute);
    return absolute;
  });
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) failures.push(`${label}: missing ${needle}`);
}

function assertMatches(text, pattern, label) {
  if (!pattern.test(text)) failures.push(`${label}: expected source guard was not found`);
}

const appConfig = readJson(APP_JSON);
const packageConfig = readJson(PACKAGE_JSON);

console.log("MWM MOBILE AUDIT PREFLIGHT");
console.log(`workspace: ${ROOT}`);
console.log(`timestamp: ${new Date().toISOString()}`);

const requiredFiles = [
  "app/_layout.tsx",
  "app/(tabs)/community.tsx",
  "components/CommunityPostCard.tsx",
  "components/FullMapView.tsx",
  "components/BusinessMapView.tsx",
  "lib/crashLogger.ts",
  "scripts/pre-build-check.js",
];

for (const relativePath of requiredFiles) requireFile(relativePath);

const routeFiles = walk(APP_DIR).filter((file) => /\.(tsx|ts|jsx|js)$/.test(file));
if (routeFiles.length === 0) failures.push("No Expo route files found under app/");
else console.log(`route files discovered: ${routeFiles.length}`);

if (!appConfig?.expo) {
  failures.push("app.json does not contain an expo configuration");
} else {
  const expo = appConfig.expo;
  const ios = expo.ios ?? {};
  const android = expo.android ?? {};
  if (!ios.bundleIdentifier) failures.push("iOS bundleIdentifier is missing");
  if (!android.package) failures.push("Android package is missing");
  if (!expo.scheme) failures.push("deep-link scheme is missing");
  if (!Number.isInteger(Number.parseInt(String(ios.buildNumber), 10))) {
    failures.push("iOS buildNumber is not an integer");
  }
  if (!Number.isInteger(android.versionCode)) failures.push("Android versionCode is not an integer");
  if (!Array.isArray(expo.plugins) || expo.plugins.length === 0) failures.push("Expo plugins are missing");
  if (!(expo.ios?.infoPlist?.NSLocationWhenInUseUsageDescription)) {
    failures.push("iOS location permission copy is missing");
  }
  if (!(expo.ios?.infoPlist?.NSPhotoLibraryUsageDescription)) {
    failures.push("iOS photo library permission copy is missing");
  }
  if (!android.permissions?.includes("android.permission.INTERNET")) {
    failures.push("Android INTERNET permission is missing");
  }
  notes.push(`version ${expo.version}, iOS ${ios.buildNumber}, Android ${android.versionCode}`);
}

if (!packageConfig?.scripts?.typecheck) failures.push("package.json is missing the typecheck script");
if (!packageConfig?.scripts?.test) failures.push("package.json is missing the test script");

const communitySource = readText(path.join(ROOT, "app/(tabs)/community.tsx"));
const cardSource = readText(path.join(ROOT, "components/CommunityPostCard.tsx"));
const mapSource = readText(path.join(ROOT, "components/FullMapView.tsx"));
const crashSource = readText(path.join(ROOT, "lib/crashLogger.ts"));

assertIncludes(communitySource, "/api/community/posts", "community post contract");
assertIncludes(communitySource, "mediaUrls", "community media state/submit contract");
assertIncludes(communitySource, "setUploadingMedia(false)", "community upload cleanup");
assertIncludes(cardSource, "mediaUrls", "community media rendering");
assertIncludes(mapSource, "mapReady", "map readiness guard");
assertMatches(mapSource, /(?:Number\.)?isFinite\(/, "map finite-coordinate validation");
assertIncludes(mapSource, "latitude >= -90", "map latitude range validation");
assertIncludes(mapSource, "longitude >= -180", "map longitude range validation");
assertIncludes(crashSource, "installFetchInterceptor", "crash API breadcrumb instrumentation");
assertIncludes(crashSource, "checkAndSendSavedCrash", "crash replay instrumentation");

if (failures.length > 0) {
  console.log("\nFAIL");
  for (const failure of failures) console.log(`- ${failure}`);
  process.exit(1);
}

console.log("\nPASS");
for (const note of notes) console.log(`- ${note}`);
console.log("- Expo route surface discovered");
console.log("- Native identifiers, permission copy, and deep-link config present");
console.log("- Community media submission/rendering contract markers present");
console.log("- Map readiness and coordinate guards present");
console.log("- Crash instrumentation and replay markers present");