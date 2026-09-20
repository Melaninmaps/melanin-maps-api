import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve("data/founder-imports/2026-09-20-multi-city-everyday-living-review/review-package");
const candidatePath = `${root}/multi-city-everyday-living-review-only-candidates.jsonl`;
const heldPath = `${root}/multi-city-everyday-living-held-and-overlap-evidence.jsonl`;
const summaryPath = `${root}/multi-city-everyday-living-review-summary.json`;
const reportPath = `${root}/multi-city-everyday-living-validation.json`;
const healthPath = `${root}/multi-city-everyday-living-destination-health.json`;
const expectedCandidateFields = [
  "source_row_id", "sourceRow", "targetKind", "dedupeKey", "name", "city", "state", "country", "category", "subcategory",
  "address", "phone", "website", "sourceUrl", "sourceName", "sourceStatus", "ownershipDesignations", "ownershipEvidence",
  "regulatedProfession", "instagramUrl", "facebookUrl", "tiktokUrl", "socialSourceUrl", "servicesSearchTerms", "notes",
];
const allowedKinds = new Set(["business", "online_business", "community_resource", "cultural_place", "regulated_review"]);
const physicalAddress = /\b\d{1,6}\b/;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalize = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const readJsonl = async (path) => (await readFile(path, "utf8")).split(/\r?\n/).filter(Boolean).map((line, index) => {
  try { return JSON.parse(line); }
  catch { throw new Error(`${path} line ${index + 1} is invalid JSON.`); }
});

const candidatePayload = await readFile(candidatePath, "utf8");
const heldPayload = await readFile(heldPath, "utf8");
const healthPayload = await readFile(healthPath, "utf8");
const candidates = await readJsonl(candidatePath);
const held = await readJsonl(heldPath);
const summary = JSON.parse(await readFile(summaryPath, "utf8"));
const health = JSON.parse(healthPayload);
const errors = [];
const sourceRowIds = new Set();
const dedupeKeys = new Set();
const normalizedIdentities = new Set();
const kinds = {};
for (const [index, row] of candidates.entries()) {
  const keys = Object.keys(row);
  if (keys.length !== expectedCandidateFields.length || keys.some((key, at) => key !== expectedCandidateFields[at])) {
    errors.push(`candidate ${index + 1} field order does not match the normalized review schema`);
  }
  if (JSON.stringify(row).includes('"null"')) errors.push(`candidate ${index + 1} contains a string null`);
  if (["latitude", "longitude", "lat", "lng", "coordinates"].some((key) => key in row)) errors.push(`candidate ${index + 1} contains coordinate data`);
  if (!row.source_row_id || sourceRowIds.has(String(row.source_row_id))) errors.push(`candidate ${index + 1} has a duplicate or missing source_row_id`);
  sourceRowIds.add(String(row.source_row_id));
  if (!Number.isInteger(row.sourceRow) || row.sourceRow !== index + 1) errors.push(`candidate ${index + 1} must use sequential sourceRow numbering`);
  if (!allowedKinds.has(row.targetKind)) errors.push(`candidate ${index + 1} has unsupported targetKind ${row.targetKind}`);
  if (!row.name || !row.city || !row.state || !row.country) errors.push(`candidate ${index + 1} lacks required identity fields`);
  if (!row.sourceUrl || !row.sourceName) errors.push(`candidate ${index + 1} lacks source evidence`);
  if (!row.dedupeKey || dedupeKeys.has(row.dedupeKey)) errors.push(`candidate ${index + 1} has a duplicate or missing dedupeKey`);
  dedupeKeys.add(row.dedupeKey);
  const identity = [normalize(row.name), normalize(row.address), normalize(row.city), normalize(row.state)].join("|");
  if (normalizedIdentities.has(identity)) errors.push(`candidate ${index + 1} duplicates an earlier normalized name/address identity`);
  normalizedIdentities.add(identity);
  if (row.targetKind === "online_business") {
    if (row.address !== null) errors.push(`candidate ${index + 1} online_business must remain mapless`);
  } else if (!physicalAddress.test(String(row.address ?? ""))) {
    errors.push(`candidate ${index + 1} physical candidate lacks a numbered address`);
  }
  kinds[row.targetKind] = (kinds[row.targetKind] ?? 0) + 1;
}
for (const [index, row] of held.entries()) {
  if (JSON.stringify(row).includes('"null"')) errors.push(`held record ${index + 1} contains a string null`);
  if (["latitude", "longitude", "lat", "lng", "coordinates"].some((key) => key in row)) errors.push(`held record ${index + 1} contains coordinate data`);
}
if (summary.status !== "review_only") errors.push("summary must remain review_only");
if (summary.candidateManifest.rowCount !== candidates.length) errors.push("summary candidate row count mismatch");
if (summary.heldEvidence.rowCount !== held.length) errors.push("summary held evidence row count mismatch");
if (summary.candidateManifest.sha256 !== sha256(candidatePayload)) errors.push("summary candidate checksum mismatch");
if (summary.heldEvidence.sha256 !== sha256(heldPayload)) errors.push("summary held evidence checksum mismatch");
if (summary.invariantResults.publicationNotPerformed !== true) errors.push("summary must state that publication was not performed");
if (!summary.destinationHealth || summary.destinationHealth.candidateRows !== candidates.length) errors.push("summary destination health candidate count mismatch");
if (summary.destinationHealth?.sha256 !== sha256(healthPayload)) errors.push("summary destination health checksum mismatch");
if (health.candidates !== candidates.length) errors.push("destination health candidate count mismatch");
if (!Array.isArray(health.results) || health.results.length !== health.uniqueDestinations) errors.push("destination health result count mismatch");
const healthCount = Object.values(health.counts ?? {}).reduce((total, value) => total + Number(value ?? 0), 0);
if (healthCount !== health.uniqueDestinations) errors.push("destination health outcome count mismatch");
const report = {
  status: errors.length ? "failed" : "passed",
  candidateRows: candidates.length,
  heldEvidenceRows: held.length,
  targetKinds: kinds,
  candidateManifestSha256: sha256(candidatePayload),
  heldEvidenceSha256: sha256(heldPayload),
  errors,
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
