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
// qualified-entry exports App as a named export, not default — must use { App }
const FIXED_IMPORT = "import { App } from 'expo-router/build/qualified-entry'";

// Also handle the case where a previous (wrong) patch used a default import
const WRONG_FIXED_IMPORT = "import App from 'expo-router/build/qualified-entry'";

if (!original.includes(BROKEN_IMPORT)) {
  if (original.includes(FIXED_IMPORT)) {
    console.log("[patch-expo-entry] Already patched correctly:", expoAppEntryPath);
    process.exit(0);
  } else if (original.includes(WRONG_FIXED_IMPORT)) {
    console.log("[patch-expo-entry] Found wrong patch (default import), re-patching...");
    const repatched = original.replace(WRONG_FIXED_IMPORT, FIXED_IMPORT);
    fs.writeFileSync(expoAppEntryPath, repatched, "utf8");
    console.log("[patch-expo-entry] Re-patched", expoAppEntryPath);
    process.exit(0);
  } else {
    console.log(
      "[patch-expo-entry] Unexpected format, skipping patch:",
      expoAppEntryPath
    );
    console.log("[patch-expo-entry] Content:", original.slice(0, 200));
    process.exit(0);
  }
}

const patched = original.replace(BROKEN_IMPORT, FIXED_IMPORT);
fs.writeFileSync(expoAppEntryPath, patched, "utf8");
console.log("[patch-expo-entry] Patched", expoAppEntryPath);
console.log("[patch-expo-entry] Replaced:", BROKEN_IMPORT);
console.log("[patch-expo-entry] With:    ", FIXED_IMPORT);
