#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import childProcess from "node:child_process";

const ROOT = path.resolve(process.argv[2] ?? process.cwd());
const outputRoot = path.join(ROOT, "release-evidence", "task373-native-release");
const directories = [
  "01-code-gates",
  "02-artifacts",
  "04-ios",
  "05-android",
  "06-media",
  "07-reviewer-access",
  "08-policy",
  "09-observability",
  "10-store",
];

for (const directory of directories) fs.mkdirSync(path.join(outputRoot, directory), { recursive: true });

function git(command) {
  try {
    return childProcess.execSync(`git ${command}`, { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

const mobileConfig = JSON.parse(fs.readFileSync(path.join(ROOT, "artifacts", "mobile", "app.json"), "utf8"));
const manifestPath = path.join(outputRoot, "00-manifest.json");
const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : {};

Object.assign(manifest, {
  generatedAt: new Date().toISOString(),
  branch: git("branch --show-current"),
  commitSha: git("rev-parse HEAD"),
  treeStatus: git("status --short"),
  ios: {
    bundleIdentifier: mobileConfig.expo?.ios?.bundleIdentifier ?? "unknown",
    version: mobileConfig.expo?.version ?? "unknown",
    buildNumber: mobileConfig.expo?.ios?.buildNumber ?? "unknown",
    easBuildId: manifest.ios?.easBuildId ?? "BLOCKED",
    artifactSha256: manifest.ios?.artifactSha256 ?? "BLOCKED",
  },
  android: {
    package: mobileConfig.expo?.android?.package ?? "unknown",
    version: mobileConfig.expo?.version ?? "unknown",
    versionCode: mobileConfig.expo?.android?.versionCode ?? "unknown",
    easBuildId: manifest.android?.easBuildId ?? "BLOCKED",
    artifactSha256: manifest.android?.artifactSha256 ?? "BLOCKED",
  },
});
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const deviceSlots = [
  ["ios-current", "iOS", "REQUIRED_CURRENT_IPHONE", "REQUIRED_CURRENT_IOS"],
  ["ios-older", "iOS", "REQUIRED_OLDER_IPHONE", "REQUIRED_OLDER_SUPPORTED_IOS"],
  ["android-current", "Android", "REQUIRED_CURRENT_ANDROID_DEVICE", "REQUIRED_CURRENT_ANDROID"],
  ["android-older", "Android", "REQUIRED_OLDER_ANDROID_DEVICE", "REQUIRED_OLDER_SUPPORTED_ANDROID"],
];

const journeys = [
  ["N01", "Clean install and first launch"],
  ["N02", "Upgrade install and migration/session preservation"],
  ["N03", "Permanent reviewer login without OTP/2FA/paywall"],
  ["N04", "Every native tab and back/re-entry behavior"],
  ["N05", "Cold and warm deep links plus invalid-link recovery"],
  ["N06", "Image select/upload/preview/post/force-close/relaunch/persist"],
  ["N07", "Video select/upload/preview/post/force-close/relaunch/play"],
  ["N08", "First upload succeeds, later upload fails, first remains"],
  ["N09", "Legacy array/JSON/double-encoded/malformed media without crash"],
  ["N10", "Location/photo/video/notification permission denial and recovery"],
  ["N11", "Offline/slow/interrupted/timeout/429/500 recovery"],
  ["N12", "Expired session/401/logout/re-auth protected-route stability"],
  ["N13", "Background/foreground/lock/unlock/interrupted-upload lifecycle"],
  ["N14", "Twenty consecutive cold launches without crash/permanent loader"],
  ["N15", "Discover-to-engage-to-contribute-to-return flywheel"],
  ["N16", "Business-owner onboarding/listing/conversion path"],
  ["N17", "In-app account deletion using disposable test account"],
  ["N18", "Terms/report post/report user/block user/support moderation controls"],
];

const headers = [
  "test_id",
  "slot",
  "platform",
  "device",
  "os",
  "app_version",
  "build",
  "install_type",
  "network",
  "permissions",
  "journey",
  "expected",
  "actual",
  "result",
  "tester",
  "timestamp_utc",
  "evidence_path",
  "notes",
];

function csv(value) {
  const string = String(value ?? "");
  return /[",\n]/.test(string) ? `"${string.replaceAll('"', '""')}"` : string;
}

const rows = [headers];
for (const [slot, platform, device, os] of deviceSlots) {
  for (const [id, journey] of journeys) {
    rows.push([
      id,
      slot,
      platform,
      device,
      os,
      mobileConfig.expo?.version ?? "unknown",
      platform === "iOS" ? mobileConfig.expo?.ios?.buildNumber ?? "unknown" : mobileConfig.expo?.android?.versionCode ?? "unknown",
      id === "N02" ? "upgrade" : "clean-or-existing-as-specified",
      "REQUIRED",
      "REQUIRED",
      journey,
      "Complete without crash, permanent loading, inaccessible action, or data loss",
      "BLOCKED",
      "BLOCKED",
      "UNASSIGNED",
      "",
      "",
      "",
    ]);
  }
}
fs.writeFileSync(path.join(outputRoot, "03-device-matrix.csv"), `${rows.map((row) => row.map(csv).join(",")).join("\n")}\n`);

const policyRows = [
  ["P01", "Apple reusable reviewer access", "BLOCKED", "", ""],
  ["P02", "Google reusable reviewer access", "BLOCKED", "", ""],
  ["P03", "Privacy policy and support URL", "BLOCKED", "", ""],
  ["P04", "Public account-deletion request URL", "BLOCKED", "", ""],
  ["P05", "UGC terms/report/block/moderation", "BLOCKED", "", ""],
  ["P06", "Apple App Privacy answers match build", "BLOCKED", "", ""],
  ["P07", "Google Data safety answers match build", "BLOCKED", "", ""],
  ["P08", "Google pre-launch report", "BLOCKED", "", ""],
  ["P09", "iOS symbolicated crash diagnostics", "BLOCKED", "", ""],
  ["P10", "Android mapped crash/ANR diagnostics", "BLOCKED", "", ""],
];
const policyCsv = [["gate_id", "gate", "result", "owner", "evidence_path"], ...policyRows]
  .map((row) => row.map(csv).join(","))
  .join("\n");
fs.writeFileSync(path.join(outputRoot, "store-policy-gates.csv"), `${policyCsv}\n`);

fs.writeFileSync(
  path.join(outputRoot, "GO_NO_GO.md"),
  `# Task #373 Native Release Decision\n\n**Decision: NO-GO**\n\nThis template starts as NO-GO. Replace every BLOCKED device and store/policy row with PASS plus an evidence path from the exact signed artifacts. Any FAIL, BLOCKED, empty evidence path, dirty-tree artifact, or web/Expo-browser substitution keeps the decision NO-GO.\n`,
);

console.log(`TASK373 evidence template created at ${outputRoot}`);
console.log(`Device rows: ${deviceSlots.length * journeys.length}; store/policy rows: ${policyRows.length}`);
