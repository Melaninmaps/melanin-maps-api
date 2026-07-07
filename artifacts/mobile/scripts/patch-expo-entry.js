/**
 * Patches expo/AppEntry.js in the pnpm virtual store to replace the
 * relative `../../App` import (which can't resolve in pnpm's deep store
 * paths) with expo-router's qualified entry directly.
 *
 * Run via eas-build-post-install after pnpm install completes.
 */
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(projectRoot, "../..");

let expoAppEntryPath;
try {
  expoAppEntryPath = require.resolve("expo/AppEntry", {
    paths: [projectRoot, workspaceRoot],
  });
} catch (e) {
  console.error("[patch-expo-entry] Could not find expo/AppEntry:", e.message);
  process.exit(0); // non-fatal
}

const original = fs.readFileSync(expoAppEntryPath, "utf8");
const BROKEN_IMPORT = "import App from '../../App'";
const FIXED_IMPORT = "import App from 'expo-router/build/qualified-entry'";

if (!original.includes(BROKEN_IMPORT)) {
  if (original.includes(FIXED_IMPORT)) {
    console.log("[patch-expo-entry] Already patched:", expoAppEntryPath);
  } else {
    console.log(
      "[patch-expo-entry] Unexpected format, skipping patch:",
      expoAppEntryPath
    );
    console.log("[patch-expo-entry] Content:", original.slice(0, 200));
  }
  process.exit(0);
}

const patched = original.replace(BROKEN_IMPORT, FIXED_IMPORT);
fs.writeFileSync(expoAppEntryPath, patched, "utf8");
console.log("[patch-expo-entry] Patched", expoAppEntryPath);
console.log("[patch-expo-entry] Replaced:", BROKEN_IMPORT);
console.log("[patch-expo-entry] With:    ", FIXED_IMPORT);
