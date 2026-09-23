#!/usr/bin/env node
"use strict";

/**
 * Protects the Railway Docker runtime from serving the stale, tracked
 * artifacts/api-server/dist/public directory. The Docker image receives both
 * dist/ and web-static/, so web-static/ must overwrite dist/public after the
 * copy steps. The latter is the reviewed current website bundle.
 */
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dockerfilePath = path.join(root, "artifacts", "api-server", "Dockerfile");
const rootStatic = path.join(root, "web-static");
const apiStatic = path.join(root, "artifacts", "api-server", "web-static");

function fail(message) {
  console.error(`RUNTIME_STATIC_BUNDLE_SYNC_FAIL: ${message}`);
  process.exit(1);
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    fail(`missing ${path.relative(root, file)}`);
  }
}

const dockerfile = read(dockerfilePath);
const copyDist = dockerfile.indexOf("COPY dist/ ./dist/");
const copyStatic = dockerfile.indexOf("COPY web-static/ ./web-static/");
const syncRuntimeStatic = dockerfile.indexOf("RUN rm -rf ./dist/public && mkdir -p ./dist/public && cp -a ./web-static/. ./dist/public/");

if (copyDist < 0) fail("Dockerfile must copy the API runtime dist directory");
if (copyStatic < 0) fail("Dockerfile must copy the reviewed web-static directory");
if (syncRuntimeStatic < 0) {
  fail("Dockerfile must replace dist/public with reviewed web-static after both COPY steps");
}
if (!(copyDist < copyStatic && copyStatic < syncRuntimeStatic)) {
  fail("Dockerfile static-copy ordering must be dist, web-static, then runtime synchronization");
}

const rootIndex = read(path.join(rootStatic, "index.html"));
const apiIndex = read(path.join(apiStatic, "index.html"));
if (rootIndex !== apiIndex) {
  fail("web-static/index.html differs from artifacts/api-server/web-static/index.html");
}

const referencedAssets = [...rootIndex.matchAll(/(?:src|href)="\/?(assets\/index-[A-Za-z0-9_-]+\.(?:js|css))"/g)]
  .map((match) => match[1]);
if (referencedAssets.length < 2) fail("reviewed index.html does not reference the expected JavaScript and CSS assets");

for (const asset of referencedAssets) {
  for (const directory of [rootStatic, apiStatic]) {
    const target = path.join(directory, asset);
    if (!fs.existsSync(target)) fail(`missing reviewed asset ${path.relative(root, target)}`);
  }
}

console.log(JSON.stringify({
  ok: true,
  docker_runtime_static_sync: true,
  reviewed_assets: referencedAssets.sort(),
}, null, 2));
