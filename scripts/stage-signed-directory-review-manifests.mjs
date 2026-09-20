#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function requiredOption(name) {
  const value = option(name);
  if (!value?.trim()) throw new Error(`Missing ${name}.`);
  return value.trim();
}

function requiredEnvironment(name, minimumLength = 1) {
  const value = process.env[name] ?? "";
  if (value.length < minimumLength) {
    throw new Error(`${name} must be configured in the operator environment.`);
  }
  return value;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function walk(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`Invalid JSON in ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function manifestRows(path) {
  const rows = [];
  for (const [index, line] of readFileSync(path, "utf8").split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("not an object");
      rows.push(row);
    } catch {
      throw new Error(`Invalid JSONL in ${path} at line ${index + 1}.`);
    }
  }
  return rows;
}

function summaryChecksum(summary) {
  return summary.manifest_sha256 ?? summary.candidateManifest?.sha256;
}

function summaryRowCount(summary) {
  return summary.accepted_review_only_candidates
    ?? summary.candidates
    ?? summary.candidateManifest?.rowCount;
}

function inspectPackage(manifestPath) {
  const packageDir = dirname(manifestPath);
  const packageFiles = readdirSync(packageDir)
    .map((name) => join(packageDir, name))
    .filter((path) => statSync(path).isFile());
  const manifestBytes = readFileSync(manifestPath);
  const manifestSha256 = sha256(manifestBytes);
  const rows = manifestRows(manifestPath);

  const checksumSummaries = packageFiles
    .filter((path) => basename(path).endsWith("summary.json"))
    .map((path) => ({ path, value: readJson(path) }))
    .filter(({ value }) => typeof summaryChecksum(value) === "string");
  if (checksumSummaries.length !== 1) {
    throw new Error(
      `${manifestPath} requires exactly one checksum-bearing summary; found ${checksumSummaries.length}.`,
    );
  }
  const summary = checksumSummaries[0];
  if (summaryChecksum(summary.value) !== manifestSha256) {
    throw new Error(`Review summary checksum does not match ${manifestPath}.`);
  }
  if (!Number.isInteger(summaryRowCount(summary.value)) || summaryRowCount(summary.value) !== rows.length) {
    throw new Error(`Review summary row count does not match ${manifestPath}.`);
  }

  const healthPaths = packageFiles.filter((path) => basename(path).endsWith("destination-health.json"));
  if (healthPaths.length !== 1) {
    throw new Error(`${manifestPath} requires exactly one destination-health ledger; found ${healthPaths.length}.`);
  }
  const health = readJson(healthPaths[0]);
  if (health.candidates !== rows.length) {
    throw new Error(`Destination-health row count does not match ${manifestPath}.`);
  }

  return {
    manifestPath,
    summaryPath: summary.path,
    healthPath: healthPaths[0],
    sourceName: basename(manifestPath, ".jsonl"),
    sourceManifestSha256: manifestSha256,
    rowCount: rows.length,
  };
}

function preflight(root) {
  const manifests = walk(root)
    .filter((path) => path.endsWith("review-only-candidates.jsonl"))
    .sort();
  if (manifests.length === 0) throw new Error(`No review manifests found under ${root}.`);
  return manifests.map(inspectPackage);
}

function receiptMatches(path, packageInfo) {
  try {
    const receipt = readJson(path);
    return receipt.accepted === true
      && receipt.sourceName === packageInfo.sourceName
      && receipt.sourceManifestSha256 === packageInfo.sourceManifestSha256
      && receipt.rowCount === packageInfo.rowCount;
  } catch {
    return false;
  }
}

function stagePackage(packageInfo, api, receiptsDir, ingestScript) {
  const result = spawnSync(process.execPath, [
    ingestScript,
    "--manifest", packageInfo.manifestPath,
    "--summary", packageInfo.summaryPath,
    "--health", packageInfo.healthPath,
    "--source-name", packageInfo.sourceName,
    "--api", api,
  ], {
    encoding: "utf8",
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(
      `Ingress failed for ${packageInfo.sourceName}: ${(result.stderr || result.stdout || "unknown error").trim()}`,
    );
  }
  let receipt;
  try {
    receipt = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Ingress returned a non-JSON receipt for ${packageInfo.sourceName}.`);
  }
  if (
    receipt.accepted !== true
    || receipt.sourceName !== packageInfo.sourceName
    || receipt.sourceManifestSha256 !== packageInfo.sourceManifestSha256
    || receipt.rowCount !== packageInfo.rowCount
  ) {
    throw new Error(`Ingress receipt did not reconcile for ${packageInfo.sourceName}.`);
  }

  const receiptPath = join(receiptsDir, `${packageInfo.sourceName}.json`);
  if (!receiptMatches(receiptPath, packageInfo)) {
    const temporaryPath = `${receiptPath}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
    renameSync(temporaryPath, receiptPath);
  }
  return receipt;
}

function report(packages) {
  return {
    preflightPassed: true,
    manifestCount: packages.length,
    rowCount: packages.reduce((total, packageInfo) => total + packageInfo.rowCount, 0),
    packages: packages.map((packageInfo) => ({
      sourceName: packageInfo.sourceName,
      sourceManifestSha256: packageInfo.sourceManifestSha256,
      rowCount: packageInfo.rowCount,
    })),
  };
}

function main() {
  const root = resolve(option("--root", "data/founder-imports"));
  const packages = preflight(root);
  const preflightReport = report(packages);
  if (process.argv.includes("--preflight-only")) {
    console.log(JSON.stringify(preflightReport, null, 2));
    return;
  }

  requiredEnvironment("DIRECTORY_REVIEW_SIGNING_SECRET", 32);
  requiredEnvironment("DIRECTORY_SERVICE_TOKEN", 32);
  const api = requiredOption("--api").replace(/\/+$/, "");
  const receiptsDir = resolve(option("--receipts-dir", "/tmp/mwm-directory-ingress-receipts"));
  const ingestScript = fileURLToPath(
    new URL("./ingest-signed-directory-review-manifest.mjs", import.meta.url),
  );
  mkdirSync(receiptsDir, { recursive: true, mode: 0o700 });

  const receipts = packages.map((packageInfo) => (
    stagePackage(packageInfo, api, receiptsDir, ingestScript)
  ));
  console.log(JSON.stringify({
    ...preflightReport,
    staged: true,
    receiptCount: receipts.length,
    receiptRowCount: receipts.reduce((total, receipt) => total + receipt.rowCount, 0),
  }, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}