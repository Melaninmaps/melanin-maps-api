#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const ROOT = "data/founder-imports/2026-09-20-named-priority-listings-review/review-package";
const manifestPath = `${ROOT}/named-priority-listings-review-only-candidates.jsonl`;
const summaryPath = `${ROOT}/named-priority-listings-review-summary.json`;
const healthPath = `${ROOT}/named-priority-listings-destination-health.json`;
const required = [
  "source_row_id", "sourceRow", "targetKind", "dedupeKey", "name", "city", "state", "country",
  "category", "subcategory", "address", "phone", "website", "sourceUrl", "sourceName", "sourceStatus",
  "ownershipDesignations", "ownershipEvidence", "regulatedProfession", "instagramUrl", "facebookUrl", "tiktokUrl",
  "socialSourceUrl", "servicesSearchTerms", "notes",
];
const allowedKinds = new Set(["business", "online_business", "community_resource", "cultural_place", "regulated_review"]);
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const validUrl = (value) => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
};

function hasCoordinateFields(value) {
  if (Array.isArray(value)) return value.some(hasCoordinateFields);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).some(([key, child]) =>
    /^(latitude|longitude|coordinates|lat|lng)$/i.test(key) || hasCoordinateFields(child),
  );
}

async function main() {
  const [manifest, summaryText, healthText] = await Promise.all([
    readFile(manifestPath, "utf8"),
    readFile(summaryPath, "utf8"),
    readFile(healthPath, "utf8"),
  ]);
  const summary = JSON.parse(summaryText);
  const health = JSON.parse(healthText);
  const rows = manifest.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); } catch { throw new Error(`Invalid manifest JSONL at line ${index + 1}`); }
  });
  if (rows.length !== 20) throw new Error(`Expected 20 candidate records, found ${rows.length}`);
  if (summary.accepted_review_only_candidates !== rows.length) throw new Error("Summary candidate count mismatch");
  if (summary.manifest_sha256 !== sha256(manifest)) throw new Error("Manifest checksum mismatch");
  if (summary.destination_health_sha256 !== sha256(healthText)) throw new Error("Destination-health checksum mismatch");
  if (health.candidates !== rows.length) throw new Error("Destination-health candidate count mismatch");
  const rowIds = new Set();
  const dedupeKeys = new Set();
  for (const [index, row] of rows.entries()) {
    for (const key of required) if (!(key in row)) throw new Error(`Line ${index + 1} is missing ${key}`);
    if (!allowedKinds.has(row.targetKind)) throw new Error(`Line ${index + 1} has unsupported target kind`);
    if (!Number.isInteger(row.sourceRow) || row.sourceRow < 1) throw new Error(`Line ${index + 1} has invalid sourceRow`);
    if (typeof row.source_row_id !== "string" || !row.source_row_id.trim() || rowIds.has(row.source_row_id)) throw new Error(`Line ${index + 1} has duplicate or invalid source_row_id`);
    rowIds.add(row.source_row_id);
    if (typeof row.dedupeKey !== "string" || !row.dedupeKey || dedupeKeys.has(row.dedupeKey)) throw new Error(`Line ${index + 1} has duplicate or invalid dedupeKey`);
    dedupeKeys.add(row.dedupeKey);
    if (JSON.stringify(row).includes('"null"')) throw new Error(`Line ${index + 1} contains the string null`);
    if (hasCoordinateFields(row)) throw new Error(`Line ${index + 1} contains coordinate data`);
    if (!Array.isArray(row.ownershipDesignations)) throw new Error(`Line ${index + 1} has invalid ownershipDesignations`);
    if (row.targetKind === "business") {
      if (typeof row.address !== "string" || !/\d/.test(row.address)) throw new Error(`Line ${index + 1} has no numbered physical address`);
      if (!validUrl(row.website) && !validUrl(row.socialSourceUrl)) throw new Error(`Line ${index + 1} has no official customer destination`);
    }
    if (row.targetKind === "online_business" && row.address !== null) throw new Error(`Line ${index + 1} makes an online-only record mappable`);
  }
  if (!rows.some((row) => row.name === "Up & Adam Eatz" && row.city === "New Orleans")) throw new Error("Up & Adam Eatz is missing");
  console.log(JSON.stringify({ valid: true, candidates: rows.length, manifest_sha256: summary.manifest_sha256 }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
