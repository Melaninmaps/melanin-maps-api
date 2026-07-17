/**
 * create-rn-maps-podspec.js
 *
 * Copies react-native-maps.podspec → react-native-google-maps.podspec inside
 * the react-native-maps package in the pnpm virtual store.
 *
 * WHY THIS IS NEEDED:
 *   react-native-maps@1.27.2's podspec declares s.name = "react-native-google-maps"
 *   (the package intends to be used as the google-maps pod). Expo's autolinking
 *   reads s.name and generates:  pod 'react-native-google-maps', :path => '...'
 *   RN CLI reads the filename and generates:  pod 'react-native-maps', :path => '...'
 *   Both pods resolve to the same source files → 339 duplicate AIR* symbols → linker crash.
 *
 *   Fix step 1 (this script): ensure react-native-google-maps.podspec exists so
 *   CocoaPods resolves `pod 'react-native-google-maps'` to the explicit podspec
 *   (not a filename-mismatch fallback).
 *
 *   Fix step 2 (react-native.config.js): platforms.ios: null tells RN CLI to skip
 *   iOS autolinking for react-native-maps → no `pod 'react-native-maps'` is added.
 *
 *   Result: one pod, one set of AIR* symbols, no duplicates.
 *
 * pnpm can hold MULTIPLE physical copies of the package (different peer-dep hash
 * suffixes). We walk the whole .pnpm store and patch every copy, same pattern as
 * patch-expo-entry.js.
 *
 * Run via eas-build-post-install after pnpm install completes, before pod install.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");

const SRC_PODSPEC = "react-native-maps.podspec";
const DST_PODSPEC = "react-native-google-maps.podspec";

function findRnMapsDirs(pnpmStoreDir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(pnpmStoreDir, { withFileTypes: true });
  } catch (e) {
    return results;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith("react-native-maps@")) continue;
    const pkgDir = path.join(pnpmStoreDir, entry.name, "node_modules", "react-native-maps");
    if (fs.existsSync(path.join(pkgDir, SRC_PODSPEC))) {
      results.push(pkgDir);
    }
  }
  return results;
}

function copyPodspec(pkgDir) {
  const src = path.join(pkgDir, SRC_PODSPEC);
  const dst = path.join(pkgDir, DST_PODSPEC);

  if (fs.existsSync(dst)) {
    console.log("[create-rn-maps-podspec] Already present:", dst);
    return;
  }

  fs.copyFileSync(src, dst);
  console.log("[create-rn-maps-podspec] Created:", dst);
}

const pnpmStoreDirs = [
  path.join(workspaceRoot, "node_modules", ".pnpm"),
  path.join(projectRoot, "node_modules", ".pnpm"),
];

const seen = new Set();
let patchedCount = 0;

for (const storeDir of pnpmStoreDirs) {
  for (const pkgDir of findRnMapsDirs(storeDir)) {
    const real = fs.realpathSync(pkgDir);
    if (seen.has(real)) continue;
    seen.add(real);
    copyPodspec(pkgDir);
    patchedCount++;
  }
}

if (patchedCount === 0) {
  console.error(
    "[create-rn-maps-podspec] No react-native-maps directories found in .pnpm store."
  );
  console.error(
    "[create-rn-maps-podspec] Searched:", pnpmStoreDirs.join(", ")
  );
  process.exit(1);
} else {
  console.log(
    `[create-rn-maps-podspec] Processed ${patchedCount} physical copy(ies) of react-native-maps`
  );
}
