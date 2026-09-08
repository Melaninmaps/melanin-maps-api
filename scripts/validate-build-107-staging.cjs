#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { assertAllowedBuild107BackendOrigins } = require("./validate-build-107-expo-output.cjs");

const ROOT = path.resolve(__dirname, "..");
const MOBILE = path.join(ROOT, "artifacts/mobile");
const STAGING_DOMAIN = "mwm-staging.35.196.78.19.nip.io";
const STAGING_ORIGIN = `https://${STAGING_DOMAIN}`;
const PROFILE = "testflight-staging";
const PROJECT_ID = "0f873107-7787-46ab-9a04-685c2a6756b1";
const APP_ID = "com.melaninmaps.app";

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function walk(directory, predicate, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "dist", ".expo", "ios", "android", ".task373-backups", "replit"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, predicate, output);
    else if (predicate(absolute)) output.push(absolute);
  }
  return output;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateBuild107Policy() {
  const app = readJson("artifacts/mobile/app.json").expo;
  const eas = readJson("artifacts/mobile/eas.json");
  const rootEas = readJson("eas.json");
  const buildRecord = readJson("artifacts/mobile/.build-record.json");
  const releaseScript = fs.readFileSync(path.join(ROOT, "scripts/release-build-107.sh"), "utf8");
  const rootEasIgnore = fs.readFileSync(path.join(ROOT, ".easignore"), "utf8");
  const mobileEasIgnore = fs.readFileSync(path.join(MOBILE, ".easignore"), "utf8");
  const revenueCat = fs.readFileSync(path.join(MOBILE, "lib/revenuecat.tsx"), "utf8");
  const auth = fs.readFileSync(path.join(MOBILE, "lib/auth.tsx"), "utf8");
  const profileScreen = fs.readFileSync(path.join(MOBILE, "app/(tabs)/profile.tsx"), "utf8");
  const mapScreen = fs.readFileSync(path.join(MOBILE, "components/FullMapView.tsx"), "utf8");
  const businessHook = fs.readFileSync(path.join(MOBILE, "hooks/useBusinesses.ts"), "utf8");
  const apiResolver = fs.readFileSync(path.join(MOBILE, "lib/api.ts"), "utf8");

  assert(app.version === "1.1.7", "app version must remain 1.1.7");
  assert(app.ios?.buildNumber === "107", "iOS build number must remain 107");
  assert(app.runtimeVersion === "1.1.7-native.1", "runtime must remain 1.1.7-native.1");
  assert(app.ios?.bundleIdentifier === APP_ID, "iOS bundle identifier changed");
  assert(app.android?.package === APP_ID, "Android package identifier changed");
  assert(app.android?.versionCode === 80, "Android versionCode must remain unchanged at 80");
  assert(app.extra?.eas?.projectId === PROJECT_ID, "EAS project identifier changed");
  assert(app.updates?.url === `https://u.expo.dev/${PROJECT_ID}`, "Expo updates project URL changed");
  assert(buildRecord.lastIosSubmitted === 106, "Build 107 must follow the recorded Build 106 TestFlight upload");
  assert(buildRecord.iosEasBuildId === "4aedbe7a-27d0-4123-b2f8-4db3e197a5a8", "Build 106 EAS lineage changed");
  assert(buildRecord.iosEasSubmissionId === "87157a4c-c8f0-48fc-a40c-6305e938a3fc", "Build 106 submission lineage changed");
  assert(!(app.ios?.infoPlist?.UIBackgroundModes ?? []).includes("audio"), "background audio must remain disabled");
  const audioPlugin = (app.plugins ?? []).find((entry) => Array.isArray(entry) && entry[0] === "expo-audio");
  assert(audioPlugin?.[1]?.enableBackgroundPlayback === false, "background playback must remain disabled");
  assert(audioPlugin?.[1]?.enableBackgroundRecording === false, "background recording must remain disabled");

  assert(!Object.hasOwn(eas.build ?? {}, "production"), "mobile EAS production build profile is forbidden");
  assert(!Object.hasOwn(eas.submit ?? {}, "production"), "mobile EAS production submit profile is forbidden");
  assert(!Object.hasOwn(rootEas.build ?? {}, "production"), "root EAS production build profile is forbidden");
  assert(Object.keys(rootEas.build ?? {}).length === 0, "repository-root EAS build profiles are forbidden");
  assert(Object.keys(rootEas.submit ?? {}).length === 0, "repository-root EAS submit profiles are forbidden");

  const build = eas.build?.[PROFILE];
  assert(build, `missing ${PROFILE} build profile`);
  assert(build.distribution === "store", `${PROFILE} must use iOS store distribution`);
  assert(build.channel === PROFILE, `${PROFILE} channel mismatch`);
  assert(build.autoIncrement === false, `${PROFILE} cannot mutate Build 107`);
  assert(build.ios?.credentialsSource === "remote", `${PROFILE} must reuse remote iOS credentials`);
  assert(!Object.hasOwn(build, "android"), `${PROFILE} must not define Android`);
  assert(build.env?.EXPO_PUBLIC_DOMAIN === STAGING_DOMAIN, `${PROFILE} domain is not staging`);
  assert(build.env?.EXPO_PUBLIC_API_ORIGIN === STAGING_ORIGIN, `${PROFILE} API origin is not staging`);
  assert(!Object.hasOwn(build.env ?? {}, "EXPO_PUBLIC_API_URL"), `${PROFILE} must not use the legacy API URL variable`);
  assert(build.env?.EXPO_PUBLIC_APP_ENV === "staging", `${PROFILE} public app environment mismatch`);
  assert(build.env?.APP_ENV === "staging", `${PROFILE} APP_ENV mismatch`);
  assert(build.env?.APP_RELEASE_CHANNEL === PROFILE, `${PROFILE} release channel mismatch`);
  assert(build.env?.EXPO_PUBLIC_REVENUECAT_ENABLED === "false", `${PROFILE} must explicitly disable RevenueCat`);
  assert(build.environment === PROFILE, `${PROFILE} must use only the dedicated ${PROFILE} EAS environment`);
  assert(!Object.keys(build.env ?? {}).some((key) => /^EXPO_PUBLIC_REVENUECAT_(IOS|ANDROID|TEST)_API_KEY$/.test(key)), `${PROFILE} contains a RevenueCat API key`);
  assert(!JSON.stringify(build).includes("mappingwithmelanin.com"), `${PROFILE} references the production backend`);

  const submit = eas.submit?.[PROFILE];
  assert(submit?.ios?.ascAppId === "6783773366", `${PROFILE} submit profile must target the existing ASC app`);
  assert(Object.keys(submit).length === 1 && Object.hasOwn(submit, "ios"), `${PROFILE} submit profile must be iOS-only`);
  assert(!JSON.stringify(submit).match(/review|releaseStatus|track/i), `${PROFILE} submit profile cannot request store review or an Android track`);

  for (const [name, candidate] of Object.entries(eas.build ?? {})) {
    const serialized = JSON.stringify(candidate);
    assert(candidate.env?.GOOGLE_MAPS_API_KEY === undefined, `build profile ${name} must not commit GOOGLE_MAPS_API_KEY`);
    assert(!serialized.includes("www.mappingwithmelanin.com"), `build profile ${name} references production`);
    assert(candidate.env?.APP_ENV !== "production", `build profile ${name} has production APP_ENV`);
    if (candidate.distribution === "store") assert(name === PROFILE, `unauthorized store build profile ${name}`);
  }
  for (const name of Object.keys(eas.submit ?? {})) assert(name === PROFILE, `unauthorized submit profile ${name}`);

  const packageFiles = walk(ROOT, (file) => path.basename(file) === "package.json");
  for (const packageFile of packageFiles) {
    const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf8"));
    for (const [name, command] of Object.entries(packageJson.scripts ?? {})) {
      assert(!/\beas\s+build\b/.test(String(command)), `${path.relative(ROOT, packageFile)} script ${name} directly invokes eas build`);
      assert(!/--profile(?:=|\s+)production\b/.test(String(command)), `${path.relative(ROOT, packageFile)} script ${name} invokes production profile`);
    }
  }

  assert(/MODE="\$\{1:-\}"/.test(releaseScript), "release entrypoint must not default to a networked mode");
  assert(releaseScript.includes('[[ -z "$MODE" ]]'), "release entrypoint lacks no-argument fail-safe");
  assert(releaseScript.includes('"ios-testflight-staging"'), "release entrypoint lacks staging TestFlight mode");
  assert(!releaseScript.includes("git fetch"), "release entrypoint must not contact Git remotes");
  assert(!releaseScript.includes("curl "), "release entrypoint must not contact a backend directly");
  assert(!/https:\/\/(?:www\.)?mappingwithmelanin\.com/.test(releaseScript), "release entrypoint references production");
  assert(!/\beas\s+update\b/.test(releaseScript), "release entrypoint must never run EAS Update");
  assert(!/--platform\s+android\b/.test(releaseScript), "release entrypoint must never build Android");
  assert(!/--profile(?:=|\s+)production\b/.test(releaseScript), "release entrypoint invokes production profile");
  assert(releaseScript.includes("--profile testflight-staging"), "release entrypoint must use only the staging profile");
  assert(releaseScript.includes("--auto-submit-with-profile testflight-staging"), "release entrypoint must upload through the staging submit profile");
  assert(releaseScript.includes("--freeze-credentials"), "release entrypoint must freeze existing signing credentials");
  assert(releaseScript.includes("pnpm install --frozen-lockfile"), "release entrypoint must use a frozen install");
  assert(releaseScript.includes("expo config --type public"), "release entrypoint must inspect public Expo config");
  assert(releaseScript.includes("expo config --type introspect"), "release entrypoint must inspect native Expo config");
  assert(releaseScript.includes("expo export --platform ios"), "release entrypoint must prove the iOS export origin");
  assert(releaseScript.includes("POST_UPLOAD_ACCEPTANCE_PENDING"), "release entrypoint must distinguish post-upload tester acceptance");
  assert(releaseScript.includes('export EXPO_PUBLIC_API_ORIGIN="$STAGING_ORIGIN"'), "release entrypoint must set the exact staging API origin");
  assert(releaseScript.includes("unset EXPO_PUBLIC_API_URL"), "release entrypoint must clear the legacy API URL variable");
  assert(releaseScript.includes('export APP_RELEASE_CHANNEL="testflight-staging"'), "release entrypoint must pin the Expo staging release channel");
  assert(releaseScript.includes("eas env:list testflight-staging --scope project"), "release entrypoint must inspect project EAS variables");
  assert(releaseScript.includes("eas env:list testflight-staging --scope account"), "release entrypoint must inspect account EAS variables");
  assert(releaseScript.includes("validate-build-107-eas-environment.cjs"), "release entrypoint must reject inherited remote EAS variables");
  assert(releaseScript.includes("eas build:inspect"), "release entrypoint must create a local EAS archive for inspection");
  assert(releaseScript.includes("--stage archive"), "release entrypoint must inspect the exact EAS archive stage");
  assert(releaseScript.includes("validate-build-107-archive.cjs"), "release entrypoint must reject credential artifacts in the EAS archive");

  for (const [name, contents] of [["root", rootEasIgnore], ["mobile", mobileEasIgnore]]) {
    for (const required of ["*.jks", "*.keystore", "*.pem", "*.p12", "*.p8", "*.key", "*.mobileprovision", "*.log", "complaint*.txt", "*_log.txt", "credentials.json", "google-service-account.json", "google-services.json", "GoogleService-Info.plist", ".replit", "replit.md", "replit.nix", "sedQ6qvzl", "upload_keystore.jks"]) {
      assert(contents.includes(required), `${name} .easignore does not exclude ${required}`);
    }
  }

  assert(revenueCat.includes("REVENUECAT_ENABLED = false"), "RevenueCat no-op flag is missing");
  assert(!revenueCat.includes("react-native-purchases"), "RevenueCat no-op imports the native SDK");
  assert(!auth.includes("react-native-purchases") && !auth.includes("Purchases."), "auth bypasses the RevenueCat no-op");
  assert(!profileScreen.includes("react-native-purchases") && !profileScreen.includes("Purchases."), "profile bypasses the RevenueCat no-op");
  assert(!JSON.stringify(readJson("artifacts/mobile/package.json")).includes("react-native-purchases"), "Build 107 must exclude the native RevenueCat SDK");
  assert(readJson("artifacts/mobile/package.json").devDependencies?.["eas-cli"] === "23.2.0", "Build 107 must pin eas-cli 23.2.0");

  assert(mapScreen.includes('testID="map-search-input"'), "Build 107 native map search input is missing");
  assert(mapScreen.includes('testID="map-hbcu-search"'), "Build 107 HBCU map search is missing");
  assert(mapScreen.includes("useBusinesses({ mapPins: true })"), "Build 107 does not load the canonical map-pin feed");
  assert(mapScreen.includes("onRegionChangeComplete"), "Build 107 does not bound markers to the visible region");
  assert(mapScreen.includes('memberFetch(`${base}/api/cultural-sites`)'), "Build 107 canonical cultural read is not authenticated");
  assert(mapScreen.includes('memberFetch(`${base}/api/tour-cultural-sites?limit=300`)'), "Build 107 tour cultural read is not authenticated");
  assert(mapScreen.includes("Array.isArray(data.items)"), "Build 107 does not parse the canonical cultural response");
  assert(mapScreen.includes("openMapDirections(activeBusiness.latitude"), "Build 107 business directions action is missing");
  assert(mapScreen.includes("openExternalUrl(activeBusiness.website)"), "Build 107 business website action is missing");
  assert(businessHook.includes('mapPins ? "/api/businesses/map-pins" : "/api/businesses"'), "Build 107 map-pin endpoint selection is missing");
  assert(businessHook.includes('import { getApiBase } from "@/lib/api"'), "Build 107 business/map hook bypasses the canonical API resolver");
  assert(!businessHook.includes("EXPO_PUBLIC_DOMAIN"), "Build 107 business/map hook reads a parallel API origin");
  assert(apiResolver.includes("assertBuild107StagingApiOrigin"), "Build 107 staging API assertion is missing");
  assert(apiResolver.includes(STAGING_ORIGIN), "canonical API resolver staging origin changed");

  const runtimeFiles = ["app", "components", "constants", "hooks", "lib"]
    .flatMap((directory) => walk(path.join(MOBILE, directory), (file) => /\.(?:js|jsx|ts|tsx)$/.test(file)));
  for (const file of runtimeFiles) {
    const relative = path.relative(ROOT, file);
    if (relative.includes("/__tests__/") || relative.includes("/scripts/")) continue;
    const source = fs.readFileSync(file, "utf8");
    assertAllowedBuild107BackendOrigins(source, relative);
    assert(!source.includes('EXPO_PUBLIC_API_URL ?? "https://www.mappingwithmelanin.com"'), `${relative} can fall back to production`);
    assert(!source.includes("EXPO_PUBLIC_API_URL"), `${relative} reads the legacy API URL variable`);
    if (relative !== "artifacts/mobile/lib/api.ts" && relative !== "artifacts/mobile/app.config.js") {
      assert(!source.includes("EXPO_PUBLIC_API_ORIGIN"), `${relative} bypasses the canonical API origin resolver`);
    }
  }

  return { profile: PROFILE, stagingOrigin: STAGING_ORIGIN, packageFiles: packageFiles.length };
}

module.exports = { validateBuild107Policy };

if (require.main === module) {
  try {
    const result = validateBuild107Policy();
    console.log(`Build 107 staging policy passed (${result.profile}, ${result.stagingOrigin}).`);
  } catch (error) {
    console.error(`BUILD_107_BLOCKED: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
