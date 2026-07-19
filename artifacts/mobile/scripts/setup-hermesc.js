/**
 * setup-hermesc.js
 *
 * Copies the hermesc Linux binary from the hermes-compiler npm package into the
 * location that @expo/metro-config's exportHermes.js expects it.
 *
 * Why this is needed:
 *   react-native ships a pre-built hermesc for macOS/Windows via CocoaPods / Gradle.
 *   On Linux (Replit, CI) the sdks/hermesc/linux64-bin/ directory is empty.
 *   hermes-compiler@<version> (a peer dep of react-native) ships the Linux binary
 *   but pnpm does not hoist it automatically into react-native's sdks tree.
 *
 * Run automatically after `pnpm install` via the postinstall script.
 */
const { execSync } = require("child_process");
const fs   = require("fs");
const path = require("path");

const WORKSPACE_ROOT = path.resolve(__dirname, "../../../");

function resolve(pkg, from) {
  try {
    return path.dirname(require.resolve(`${pkg}/package.json`, { paths: [from] }));
  } catch {
    return null;
  }
}

const mobileDir = path.resolve(__dirname, "..");
const rnDir     = resolve("react-native", mobileDir);
const hcDir     = resolve("hermes-compiler", mobileDir) || resolve("hermes-compiler", WORKSPACE_ROOT);

if (!rnDir) { console.log("[setup-hermesc] react-native not found — skipping"); process.exit(0); }
if (!hcDir) { console.log("[setup-hermesc] hermes-compiler not found — skipping"); process.exit(0); }

const src  = path.join(hcDir, "hermesc", "linux64-bin", "hermesc");
const dest = path.join(rnDir, "sdks", "hermesc", "linux64-bin", "hermesc");

if (!fs.existsSync(src)) {
  console.log("[setup-hermesc] hermesc Linux binary not found at", src, "— skipping");
  process.exit(0);
}

if (fs.existsSync(dest)) {
  console.log("[setup-hermesc] hermesc already in place at", dest);
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
fs.chmodSync(dest, 0o755);
console.log("[setup-hermesc] installed hermesc →", dest);
