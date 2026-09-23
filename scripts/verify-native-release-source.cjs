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
  if (app.ios?.buildNumber !== "120" || app.android?.versionCode !== 90) {
    fail(`expected release identifiers iOS 120 / Android 90, found iOS ${app.ios?.buildNumber ?? "missing"} / Android ${app.android?.versionCode ?? "missing"}`);
  }

  process.stdout.write(`NATIVE_RELEASE_SOURCE_PASS: sha=${head} ios=${app.ios.buildNumber} android=${app.android.versionCode}\n`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
