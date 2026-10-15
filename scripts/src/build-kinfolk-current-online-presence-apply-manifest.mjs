#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const KIND = "kinfolk_current_online_presence_apply_v1";

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) =>
    `${JSON.stringify(key)}:${stableJson(value[key])}`,
  ).join(",")}}`;
}

function manifestFingerprint(manifest) {
  return createHash("sha256").update(stableJson(manifest)).digest("hex");
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const inputDirectory = arg("--input-dir");
const output = arg("--output");
if (!inputDirectory || !output) {
  throw new Error("Usage: build-kinfolk-current-online-presence-apply-manifest.mjs --input-dir <scan-dir> --output <manifest.json>");
}

const directory = resolve(inputDirectory);
const [summary, removals, deleteReviews] = await Promise.all([
  readFile(resolve(directory, "summary.json"), "utf8").then(JSON.parse),
  readFile(resolve(directory, "website-removal-proposals.json"), "utf8").then(JSON.parse),
  readFile(resolve(directory, "delete-review-proposals.json"), "utf8").then(JSON.parse),
]);

const unsignedManifest = {
  kind: KIND,
  generatedAt: new Date().toISOString(),
  source: {
    verifierVersion: summary.verifierVersion,
    inputSha256: summary.inputSha256,
    completedAt: summary.completedAt,
  },
  websiteRemovals: removals.map((item) => ({
    businessId: item.businessId,
    businessName: item.businessName,
    city: item.city,
    state: item.state,
    originalWebsite: item.originalWebsite,
    verifiedOfficialSocial: item.verifiedOfficialSocial,
    verification: item.verification,
    currentSnapshotHash: item.currentSnapshotHash,
  })),
  deleteReviews: deleteReviews.map((item) => ({
    businessId: item.businessId,
    businessName: item.businessName,
    city: item.city,
    state: item.state,
    originalLinks: item.originalLinks,
    websiteVerification: item.websiteVerification,
    socialVerification: item.socialVerification,
    originalSnapshot: item.originalSnapshot,
  })),
};
const manifest = {
  ...unsignedManifest,
  manifestFingerprint: manifestFingerprint(unsignedManifest),
};

await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(resolve(output), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  output: resolve(output),
  manifestFingerprint: manifest.manifestFingerprint,
  websiteRemovals: manifest.websiteRemovals.length,
  deleteReviews: manifest.deleteReviews.length,
  total: manifest.websiteRemovals.length + manifest.deleteReviews.length,
}, null, 2));
