#!/usr/bin/env node
/**
 * scripts/verify-release-artifacts.mjs
 *
 * Run after the production build and before git commit / Railway push.
 * Confirms that:
 *   1. dist/index.mjs exists and matches its recorded BUILD_IDENTITY hash.
 *   2. root web-static/index.html matches artifacts/api-server/web-static/index.html.
 *
 * Usage:
 *   node scripts/verify-release-artifacts.mjs
 *
 * Exit 0 = all checks passed. Exit 1 = failure (message explains what mismatched).
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const apiRoot = path.join(root, "artifacts", "api-server");
const entry = path.join(apiRoot, "dist", "index.mjs");
const identityPath = path.join(apiRoot, "dist", "BUILD_IDENTITY");
const rootStatic = path.join(root, "web-static", "index.html");
const builtStatic = path.join(apiRoot, "web-static", "index.html");

function die(message) {
  console.error(`RELEASE_VERIFY_FAIL: ${message}`);
  process.exit(1);
}

function hash(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

for (const file of [entry, identityPath, rootStatic, builtStatic]) {
  if (!fs.existsSync(file)) die(`missing ${path.relative(root, file)}`);
}

const identity = JSON.parse(fs.readFileSync(identityPath, "utf8"));
const entryHash = hash(entry);

if (identity.bundle_sha256 !== entryHash) {
  die(`dist/index.mjs hash ${entryHash.slice(0,16)}... does not match BUILD_IDENTITY ${identity.bundle_sha256?.slice(0,16)}...`);
}

if (fs.readFileSync(rootStatic, "utf8") !== fs.readFileSync(builtStatic, "utf8")) {
  die("root web-static/index.html differs from artifacts/api-server/web-static/index.html — run sync-web-static first");
}

console.log(JSON.stringify({
  ok: true,
  built_from_sha: identity.built_from_sha,
  bundle_sha256: identity.bundle_sha256,
  web_static_synced: true,
}, null, 2));
