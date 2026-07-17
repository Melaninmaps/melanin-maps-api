/**
 * create-rn-maps-podspec.js
 *
 * Early attempt (eas-build-post-install, after pnpm install) to create
 * react-native-google-maps.podspec so CocoaPods can resolve:
 *   pod 'react-native-google-maps', :path => '../node_modules/react-native-maps'
 *
 * WHY: react-native-maps ships only react-native-maps.podspec. Expo autolinking
 * reads s.name = "react-native-google-maps" from it and emits the pod entry above.
 * CocoaPods then looks for react-native-google-maps.podspec in that :path dir
 * and fails with "No podspec found for `react-native-google-maps`".
 *
 * PRIMARY FIX: withRnMapsPodfileFix.js config plugin writes the podspec during
 * expo prebuild (step 5), which is the authoritative moment. This script is an
 * early belt-and-suspenders attempt at step 2 (eas-build-post-install).
 * It is intentionally non-fatal — the plugin handles it if this script misses.
 *
 * STRATEGY: try both the direct node_modules symlink path (what CocoaPods reads)
 * AND the pnpm virtual store paths.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");         // artifacts/mobile
const workspaceRoot = path.resolve(projectRoot, "../.."); // monorepo root

const SRC = "react-native-maps.podspec";
const DST = "react-native-google-maps.podspec";

let patchedCount = 0;

// ── Strategy 1: direct node_modules path (what CocoaPods actually resolves) ──
const directPaths = [
  path.join(workspaceRoot, "node_modules", "react-native-maps"),
  path.join(projectRoot, "node_modules", "react-native-maps"),
];

for (const dir of directPaths) {
  const src = path.join(dir, SRC);
  const dst = path.join(dir, DST);
  if (!fs.existsSync(src)) {
    console.log(`[create-rn-maps-podspec] not found: ${src}`);
    continue;
  }
  if (fs.existsSync(dst)) {
    console.log(`[create-rn-maps-podspec] already present: ${dst}`);
    patchedCount++;
    continue;
  }
  try {
    fs.copyFileSync(src, dst);
    console.log(`[create-rn-maps-podspec] created: ${dst}`);
    patchedCount++;
  } catch (e) {
    console.warn(`[create-rn-maps-podspec] could not write ${dst}: ${e.message}`);
  }
}

// ── Strategy 2: pnpm virtual store (.pnpm/react-native-maps@*) ───────────────
function patchStoreDir(storeDir) {
  let entries;
  try {
    entries = fs.readdirSync(storeDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith("react-native-maps@")) continue;
    const pkgDir = path.join(storeDir, entry.name, "node_modules", "react-native-maps");
    const src = path.join(pkgDir, SRC);
    const dst = path.join(pkgDir, DST);
    if (!fs.existsSync(src)) continue;
    if (fs.existsSync(dst)) {
      console.log(`[create-rn-maps-podspec] store already present: ${dst}`);
      patchedCount++;
      continue;
    }
    try {
      fs.copyFileSync(src, dst);
      console.log(`[create-rn-maps-podspec] store created: ${dst}`);
      patchedCount++;
    } catch (e) {
      console.warn(`[create-rn-maps-podspec] store write failed: ${e.message}`);
    }
  }
}

const storeDirs = [
  path.join(workspaceRoot, "node_modules", ".pnpm"),
  path.join(projectRoot, "node_modules", ".pnpm"),
];
for (const s of storeDirs) patchStoreDir(s);

// ── Result ────────────────────────────────────────────────────────────────────
if (patchedCount === 0) {
  console.warn(
    "[create-rn-maps-podspec] WARNING: no react-native-maps dirs found — withRnMapsPodfileFix plugin will handle this during prebuild."
  );
} else {
  console.log(`[create-rn-maps-podspec] ${patchedCount} location(s) patched.`);
}

// Non-fatal: the config plugin is the authoritative fix.
process.exit(0);
