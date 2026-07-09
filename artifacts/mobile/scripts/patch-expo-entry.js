/**
 * Patches expo/AppEntry.js in the pnpm virtual store to replace the
 * relative `../../App` import (which can't resolve in pnpm's deep store
 * paths) with expo-router's qualified entry directly.
 *
 * pnpm's content-addressable store can contain MULTIPLE physical copies of
 * the `expo` package (different dependency-hash suffixes caused by peer
 * resolution differences). A single require.resolve() only finds one
 * hoisted copy, which may not be the copy Metro actually bundles from in
 * the EAS cloud build. So this walks the whole .pnpm store and patches
 * every copy it finds.
 *
 * Run via eas-build-post-install after pnpm install completes.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");

const BROKEN_IMPORT = "import App from '../../App'";
// qualified-entry exports App as a named export, not default — must use { App }
const FIXED_IMPORT = "import { App } from 'expo-router/build/qualified-entry'";
const WRONG_FIXED_IMPORT = "import App from 'expo-router/build/qualified-entry'";

function findAppEntryFiles(pnpmStoreDir) {
  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(pnpmStoreDir, { withFileTypes: true });
  } catch (e) {
    return results;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!entry.name.startsWith("expo@")) continue;
    const appEntryPath = path.join(
      pnpmStoreDir,
      entry.name,
      "node_modules",
      "expo",
      "AppEntry.js"
    );
    if (fs.existsSync(appEntryPath)) {
      results.push(appEntryPath);
    }
  }
  return results;
}

function patchFile(expoAppEntryPath) {
  const original = fs.readFileSync(expoAppEntryPath, "utf8");

  if (!original.includes(BROKEN_IMPORT)) {
    if (original.includes(FIXED_IMPORT)) {
      console.log("[patch-expo-entry] Already patched correctly:", expoAppEntryPath);
      return;
    }
    if (original.includes(WRONG_FIXED_IMPORT)) {
      console.log("[patch-expo-entry] Found wrong patch (default import), re-patching...");
      const repatched = original.replace(WRONG_FIXED_IMPORT, FIXED_IMPORT);
      fs.writeFileSync(expoAppEntryPath, repatched, "utf8");
      console.log("[patch-expo-entry] Re-patched", expoAppEntryPath);
      return;
    }
    console.log("[patch-expo-entry] Unexpected format, skipping patch:", expoAppEntryPath);
    console.log("[patch-expo-entry] Content:", original.slice(0, 200));
    return;
  }

  const patched = original.replace(BROKEN_IMPORT, FIXED_IMPORT);
  fs.writeFileSync(expoAppEntryPath, patched, "utf8");
  console.log("[patch-expo-entry] Patched", expoAppEntryPath);
}

const pnpmStoreDirs = [
  path.join(workspaceRoot, "node_modules", ".pnpm"),
  path.join(projectRoot, "node_modules", ".pnpm"),
];

const seen = new Set();
let patchedCount = 0;

for (const storeDir of pnpmStoreDirs) {
  for (const appEntryPath of findAppEntryFiles(storeDir)) {
    const real = fs.realpathSync(appEntryPath);
    if (seen.has(real)) continue;
    seen.add(real);
    patchFile(appEntryPath);
    patchedCount++;
  }
}

if (patchedCount === 0) {
  console.error(
    "[patch-expo-entry] No expo/AppEntry.js files found under .pnpm store — nothing patched."
  );
} else {
  console.log(`[patch-expo-entry] Processed ${patchedCount} physical copy(ies) of expo/AppEntry.js`);
}
