/**
 * Patches react-native-maps.podspec in the pnpm virtual store so that
 * s.name = "react-native-google-maps" instead of "react-native-maps".
 *
 * WHY: React Native / Expo autolinking generates:
 *   pod 'react-native-google-maps', :path => '...node_modules/react-native-maps'
 * ...but react-native-maps@1.27.x ships a podspec with s.name = "react-native-maps".
 * CocoaPods then fails: "No podspec found for 'react-native-google-maps' in ...".
 *
 * We rename s.name (and the internal subspec dependency strings) to match
 * what autolinking requests.  The module_name stays 'ReactNativeMaps' so
 * Swift/ObjC imports are unaffected.
 *
 * pnpm stores one physical copy per unique peer-dep combination, so we
 * walk the whole .pnpm store and patch every copy we find.
 */
const fs = require("fs");
const path = require("path");

const scriptDir = path.dirname(require.resolve("./patch-rnmaps-podspec.js"));
const projectRoot = path.resolve(scriptDir, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");

const PODSPEC_NAME = "react-native-maps.podspec";

function findPodspecFiles(pnpmStoreDir) {
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
    const candidate = path.join(
      pnpmStoreDir,
      entry.name,
      "node_modules",
      "react-native-maps",
      PODSPEC_NAME
    );
    if (fs.existsSync(candidate)) {
      results.push(candidate);
    }
  }
  return results;
}

function patchFile(podspecPath) {
  const original = fs.readFileSync(podspecPath, "utf8");

  if (original.includes('s.name = "react-native-google-maps"')) {
    console.log("[patch-rnmaps] Already patched:", podspecPath);
    return;
  }

  if (!original.includes('s.name = "react-native-maps"')) {
    console.log("[patch-rnmaps] Unexpected format, skipping:", podspecPath);
    return;
  }

  // Replace s.name and all internal subspec dependency references.
  // We use targeted replacements rather than a blanket replace to avoid
  // touching the GitHub URL in s.source (which doesn't matter for :path pods
  // but keeps things cleaner).
  let patched = original;
  patched = patched.replace(
    's.name = "react-native-maps"',
    's.name = "react-native-google-maps"'
  );
  // Internal subspec deps: 'react-native-maps/Generated', 'react-native-maps/Maps'
  patched = patched.replace(
    /ss\.dependency 'react-native-maps\//g,
    "ss.dependency 'react-native-google-maps/"
  );

  fs.writeFileSync(podspecPath, patched, "utf8");
  console.log("[patch-rnmaps] Patched s.name + subspec deps in:", podspecPath);
}

const pnpmStoreDirs = [
  path.join(workspaceRoot, "node_modules", ".pnpm"),
  path.join(projectRoot, "node_modules", ".pnpm"),
];

const seen = new Set();
let patchedCount = 0;

for (const storeDir of pnpmStoreDirs) {
  for (const podspecPath of findPodspecFiles(storeDir)) {
    const real = fs.realpathSync(podspecPath);
    if (seen.has(real)) continue;
    seen.add(real);
    patchFile(podspecPath);
    patchedCount++;
  }
}

// Also patch via the symlinked path in case realpathSync resolves differently
const symlinkPath = path.join(
  projectRoot,
  "node_modules",
  "react-native-maps",
  PODSPEC_NAME
);
if (fs.existsSync(symlinkPath)) {
  const real = fs.realpathSync(symlinkPath);
  if (!seen.has(real)) {
    seen.add(real);
    patchFile(symlinkPath);
    patchedCount++;
  }
}

if (patchedCount === 0) {
  console.error(
    "[patch-rnmaps] No react-native-maps.podspec files found — nothing patched."
  );
  process.exit(1);
} else {
  console.log(
    `[patch-rnmaps] Processed ${patchedCount} physical copy(ies) of react-native-maps.podspec`
  );
}
