import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(
  process.argv[2] ?? "data/founder-imports/2026-09-19-philly-bucks-sixth-depth-review",
);
const packageDirectory = resolve(root, "review-package");
const manifestFile = resolve(
  packageDirectory,
  "philly-bucks-sixth-depth-combined-review-only-candidates.jsonl",
);
const summaryFile = resolve(
  packageDirectory,
  "philly-bucks-sixth-depth-combined-review-summary.json",
);
const healthFile = resolve(
  packageDirectory,
  "philly-bucks-sixth-depth-combined-destination-health.json",
);
const allowedKinds = new Set([
  "business",
  "online_business",
  "regulated_review",
  "community_resource",
  "cultural_place",
]);
const physicalAddress = /^\s*\d+[A-Za-z0-9-]*\s+.+/;
const errors = [];

function hasStringNull(value) {
  if (value === "null") return true;
  if (Array.isArray(value)) return value.some(hasStringNull);
  if (value && typeof value === "object") return Object.values(value).some(hasStringNull);
  return false;
}

const manifest = await readFile(manifestFile, "utf8");
const rows = manifest
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line, index) => ({ line: index + 1, record: JSON.parse(line) }));
const summary = JSON.parse(await readFile(summaryFile, "utf8"));
const health = JSON.parse(await readFile(healthFile, "utf8"));
const hash = createHash("sha256").update(manifest).digest("hex");

if (summary.publication_status !== "NOT PUBLISHED — review-only package") {
  errors.push("publication status must remain review-only");
}
if (summary.accepted_review_only_candidates !== rows.length) {
  errors.push("summary candidate count does not match manifest");
}
if (summary.manifest_sha256 !== hash) errors.push("manifest checksum mismatch");
if (summary.package !== "2026-09-19-philly-bucks-sixth-depth-combined-source-backed-review") {
  errors.push("package label does not match the intended date and scope");
}
if ((health.results ?? []).length !== 100) errors.push("destination health result count must be 100");

const dedupeKeys = new Set();
const nameCities = new Set();
for (const { line, record } of rows) {
  const prefix = `line ${line}`;
  if (!allowedKinds.has(record.targetKind)) errors.push(`${prefix}: unsupported target kind`);
  if (hasStringNull(record)) errors.push(`${prefix}: contains literal string null`);
  if (JSON.stringify(record).match(/"(?:lat|lng|latitude|longitude|coordinates)"/i)) {
    errors.push(`${prefix}: contains prohibited coordinate data`);
  }
  if (record.country !== "United States" || record.state !== "PA") {
    errors.push(`${prefix}: outside intended PA/US scope`);
  }
  if (!record.dedupeKey || dedupeKeys.has(record.dedupeKey)) {
    errors.push(`${prefix}: duplicate or missing dedupeKey`);
  }
  dedupeKeys.add(record.dedupeKey);
  const nameCity = `${String(record.name).toLowerCase()}|${String(record.city ?? "").toLowerCase()}|${record.state}`;
  if (nameCities.has(nameCity)) errors.push(`${prefix}: duplicate normalized name/city/state`);
  nameCities.add(nameCity);
  if (record.targetKind === "business" && !physicalAddress.test(record.address ?? "")) {
    errors.push(`${prefix}: commercial business lacks street-number address`);
  }
  if (record.targetKind === "online_business" && record.address !== null) {
    errors.push(`${prefix}: online business must remain mapless`);
  }
  if (!record.website && !record.socialSourceUrl) {
    errors.push(`${prefix}: missing customer-facing destination`);
  }
  if (!String(record.notes ?? "").includes("review_only")) {
    errors.push(`${prefix}: missing review-only provenance`);
  }
  if (String(record.notes ?? "").includes("northeast_core_fifth_depth")) {
    errors.push(`${prefix}: stale provenance label`);
  }
}

const output = {
  ok: errors.length === 0,
  rows: rows.length,
  manifest_sha256: hash,
  target_kinds: rows.reduce((counts, { record }) => {
    counts[record.targetKind] = (counts[record.targetKind] ?? 0) + 1;
    return counts;
  }, {}),
  status_counts: rows.reduce((counts, { record }) => {
    const parsed = JSON.parse(record.notes);
    const status = parsed?.philly_bucks_sixth_depth_review_package ? "review_provenance_present" : "review_provenance_missing";
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {}),
  health_outcomes: (health.results ?? []).reduce((counts, item) => {
    counts[item.outcome] = (counts[item.outcome] ?? 0) + 1;
    return counts;
  }, {}),
  errors,
};
console.log(JSON.stringify(output, null, 2));
if (errors.length) process.exit(2);
