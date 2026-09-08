#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateBuild106Archive } = require("./validate-build-106-archive.cjs");

const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /appl_[A-Za-z0-9_-]{20,}/,
  /goog_[A-Za-z0-9_-]{20,}/,
  /AIza[0-9A-Za-z_-]{30,}/,
  /AKIA[A-Z0-9]{16}/,
];

function assertNoSecretPatterns(text, relative) {
  for (const pattern of SECRET_PATTERNS) {
    assert(!pattern.test(text), `credential-like literal entered EAS archive: ${relative}`);
  }
}

function scanFile(filePath, relative) {
  const descriptor = fs.openSync(filePath, "r");
  const chunk = Buffer.allocUnsafe(1024 * 1024);
  let latinCarry = "";
  let collapsedCarry = "";
  try {
    for (;;) {
      const bytesRead = fs.readSync(descriptor, chunk, 0, chunk.length, null);
      if (bytesRead === 0) break;
      const bytes = chunk.subarray(0, bytesRead);
      const latin = `${latinCarry}${bytes.toString("latin1")}`;
      assertNoSecretPatterns(latin, relative);
      latinCarry = latin.slice(-512);

      // UTF-16LE, UTF-16BE, binary plists, and generated configs can separate
      // ASCII credential signatures with NUL bytes. Collapse only NULs and scan
      // every remaining byte; this is independent of byte order and extension.
      const collapsed = `${collapsedCarry}${bytes.toString("latin1").replace(/\0/g, "")}`;
      assertNoSecretPatterns(collapsed, relative);
      collapsedCarry = collapsed.slice(-512);
    }
  } finally {
    fs.closeSync(descriptor);
  }
}

function scanAllArchiveFiles(root) {
  const canonicalRoot = fs.realpathSync(root);
  const scannedTargets = new Set();
  const containsMobileIrrelevantTree = (relative) => {
    const parts = relative.split("/");
    return parts.includes("web-static") ||
      parts.some((part, index) => part === "data" && parts[index + 1] === "founder-imports");
  };
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(canonicalRoot, absolute).split(path.sep).join("/");
      assert(
        !containsMobileIrrelevantTree(relative),
        `mobile-irrelevant source data entered EAS archive: ${relative}`,
      );
      if (entry.isDirectory()) {
        visit(absolute);
        continue;
      }
      let target = absolute;
      if (entry.isSymbolicLink()) {
        target = fs.realpathSync(absolute);
        assert(
          target === canonicalRoot || target.startsWith(`${canonicalRoot}${path.sep}`),
          `archive symlink escapes root: ${relative}`,
        );
      }
      if (!fs.statSync(target).isFile()) continue;
      const canonicalTarget = fs.realpathSync(target);
      if (scannedTargets.has(canonicalTarget)) continue;
      scannedTargets.add(canonicalTarget);
      scanFile(canonicalTarget, relative);
    }
  };
  visit(canonicalRoot);
  return scannedTargets.size;
}

function validateBuild107Archive(archivePath) {
  const result = validateBuild106Archive(archivePath);
  const deeplyScannedFiles = scanAllArchiveFiles(archivePath);
  assert(deeplyScannedFiles > 0, "Build 107 deep archive scan found no files");
  return { ...result, deeplyScannedFiles };
}

if (require.main === module) {
  try {
    const [, , archivePath] = process.argv;
    assert(archivePath, "usage: validate-build-107-archive.cjs <archive-directory>");
    const result = validateBuild107Archive(archivePath);
    console.log(`Build 107 EAS archive proof passed (${result.files} files, ${result.deeplyScannedFiles} deeply scanned, no credential artifacts).`);
  } catch (error) {
    console.error(`BUILD_107_BLOCKED: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

module.exports = { validateBuild107Archive };
