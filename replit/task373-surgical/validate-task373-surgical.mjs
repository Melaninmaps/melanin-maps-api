#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.argv[2] ?? process.cwd());
const MOBILE = path.join(ROOT, "artifacts", "mobile");
const results = [];

function check(id, description, predicate, evidence) {
  let passed = false;
  let detail = evidence;
  try {
    passed = Boolean(predicate());
  } catch (error) {
    detail = `${evidence}; ${error instanceof Error ? error.message : String(error)}`;
  }
  results.push({ id, description, status: passed ? "PASS" : "FAIL", evidence: detail });
}

function text(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

const appJsonPath = path.join("artifacts", "mobile", "app.json");
const appJson = JSON.parse(text(appJsonPath));
const appConfig = text(path.join("artifacts", "mobile", "app.config.js"));
const packageJson = JSON.parse(text(path.join("artifacts", "mobile", "package.json")));
const community = text(path.join("artifacts", "mobile", "app", "(tabs)", "community.tsx"));
const crashLogger = text(path.join("artifacts", "mobile", "lib", "crashLogger.ts"));
const permissions = new Set(appJson.expo?.android?.permissions ?? []);
const blockedPermissions = new Set(appJson.expo?.android?.blockedPermissions ?? []);

check("S01", "iOS identity remains correct", () => appJson.expo.ios.bundleIdentifier === "com.melaninmaps.app" && appJson.expo.ios.buildNumber === "103", appJsonPath);
check("S02", "Android identity remains correct", () => appJson.expo.android.package === "com.melaninmaps.app" && appJson.expo.android.versionCode === 78, appJsonPath);
check("S03", "Camera purpose covers community media", () => /community photo or video/i.test(appJson.expo.ios.infoPlist.NSCameraUsageDescription), appJsonPath);
check("S04", "Photo-library purpose covers selected photos and videos", () => /photos and videos you select/i.test(appJson.expo.ios.infoPlist.NSPhotoLibraryUsageDescription), appJsonPath);
check("S05", "Android declares media image and video read access", () => permissions.has("android.permission.READ_MEDIA_IMAGES") && permissions.has("android.permission.READ_MEDIA_VIDEO"), appJsonPath);
check("S06", "Obsolete broad storage permissions are not requested", () => !permissions.has("android.permission.READ_EXTERNAL_STORAGE") && !permissions.has("android.permission.WRITE_EXTERNAL_STORAGE") && blockedPermissions.has("android.permission.READ_EXTERNAL_STORAGE") && blockedPermissions.has("android.permission.WRITE_EXTERNAL_STORAGE"), appJsonPath);
check("S07", "Write-contacts permission is not requested", () => !permissions.has("android.permission.WRITE_CONTACTS") && blockedPermissions.has("android.permission.WRITE_CONTACTS"), appJsonPath);
check("S08", "Resolved Expo config includes commit SHA", () => /commitSha/.test(appConfig) && /EAS_BUILD_GIT_COMMIT_HASH/.test(appConfig), "artifacts/mobile/app.config.js");
check("S09", "Resolved Expo config includes release channel and environment", () => /releaseChannel/.test(appConfig) && /environment/.test(appConfig), "artifacts/mobile/app.config.js");
check("S10", "iOS build command cannot auto-submit", () => !String(packageJson.scripts?.["build:ios"] ?? "").includes("--auto-submit") && !String(packageJson.scripts?.["build:candidate:ios"] ?? "").includes("--auto-submit"), "artifacts/mobile/package.json");
check("S11", "Post submission is guarded while media uploads", () => /if \(uploadingMedia\)/.test(community) && /Upload in progress/.test(community), "artifacts/mobile/app/(tabs)/community.tsx");
check("S12", "Only completed media URLs are submitted", () => /const completedMediaUrls/.test(community) && /mediaUrls: completedMediaUrls/.test(community), "artifacts/mobile/app/(tabs)/community.tsx");
check("S13", "Post control exposes upload busy/disabled state", () => /disabled=\{!newPostText\.trim\(\) \|\| submittingPost \|\| uploadingMedia\}/.test(community) && /busy: submittingPost \|\| uploadingMedia/.test(community), "artifacts/mobile/app/(tabs)/community.tsx");
check("S14", "Crash request URLs are sanitized", () => /sanitizeBreadcrumbUrl/.test(crashLogger) && /url: sanitizeBreadcrumbUrl\(url\)/.test(crashLogger), "artifacts/mobile/lib/crashLogger.ts");
check("S15", "Crash route and coordinate context is minimized", () => /sanitizeRoute/.test(crashLogger) && /sanitizeMapState/.test(crashLogger) && /toFixed\(2\)/.test(crashLogger), "artifacts/mobile/lib/crashLogger.ts");
check("S16", "Crash reports include release identity", () => /releaseChannel: meta\.releaseChannel/.test(crashLogger) && /environment: meta\.environment/.test(crashLogger), "artifacts/mobile/lib/crashLogger.ts");
check("S17", "Crash messages and stacks pass through redaction", () => /message: redactSensitiveText/.test(crashLogger) && /stack: redactSensitiveText/.test(crashLogger), "artifacts/mobile/lib/crashLogger.ts");

const failures = results.filter((result) => result.status !== "PASS");
const report = {
  generatedAt: new Date().toISOString(),
  root: ROOT,
  summary: { total: results.length, passed: results.length - failures.length, failed: failures.length },
  results,
  notProvenByThisSourceValidator: [
    "Full mobile/workspace typecheck, lint, tests, and builds",
    "API supertest suite restoration",
    "Server-side upload MIME/signature/size/duration/rate-limit enforcement",
    "Native in-app video playback or verified external playback",
    "UGC report/block/terms behavior on signed builds",
    "Account deletion and public deletion-request behavior",
    "Signed artifact identity and checksums",
    "Physical iOS/Android clean-install, upgrade, lifecycle, permission, network, session, and cold-launch tests",
    "Symbolicated/mapped native crash-report pipeline",
    "Reviewer credentials and Google pre-launch report",
  ],
};

console.log(JSON.stringify(report, null, 2));
process.exit(failures.length === 0 ? 0 : 1);
