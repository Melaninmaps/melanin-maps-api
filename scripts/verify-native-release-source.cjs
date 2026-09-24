#!/usr/bin/env node
/**
 * Fails a local native release attempt unless it is built from an exact clean
 * GitHub main checkout. It does not build, submit, or alter remote state.
 */
const { execFileSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const run = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const fail = (message) => {
  process.stderr.write(`NATIVE_RELEASE_SOURCE_FAIL: ${message}\n`);
  process.exit(1);
};

try {
  const branch = run(["branch", "--show-current"]);
  if (branch !== "main") fail(`expected branch main, found ${branch || "detached HEAD"}`);

  const dirty = run(["status", "--porcelain"]);
  if (dirty) fail("working tree is not clean; commit, stash, or discard local edits before a release build");

  run(["fetch", "origin", "main", "--prune"]);
  const head = run(["rev-parse", "HEAD"]);
  const remoteMain = run(["rev-parse", "origin/main"]);
  if (head !== remoteMain) fail(`HEAD ${head} does not equal origin/main ${remoteMain}; update the checkout first`);

  const app = require(path.join(root, "artifacts/mobile/app.json")).expo;
  // Build identifiers change for every artifact. Their exact next values are
  // checked by the release gate; this provenance guard only ensures that a
  // release has valid, explicit iOS and Android identifiers on GitHub main so
  // a previously correct source checkout is not rejected after an increment.
  const iosBuildNumber = String(app.ios?.buildNumber ?? "");
  const androidVersionCode = app.android?.versionCode;
  if (!/^\d+$/.test(iosBuildNumber) || Number(iosBuildNumber) < 1) {
    fail(`invalid iOS buildNumber ${iosBuildNumber || "missing"}`);
  }
  if (!Number.isInteger(androidVersionCode) || androidVersionCode < 1) {
    fail(`invalid Android versionCode ${String(androidVersionCode ?? "missing")}`);
  }

  process.stdout.write(`NATIVE_RELEASE_SOURCE_PASS: sha=${head} ios=${app.ios.buildNumber} android=${app.android.versionCode}\n`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
