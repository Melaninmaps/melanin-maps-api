import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? "data/founder-imports/2026-09-19-philly-harrisburg-support-review");
const reviewDir = resolve(root, "review-package");
const manifestPath = resolve(reviewDir, "philly-harrisburg-support-combined-review-only-candidates.jsonl");
const summaryPath = resolve(reviewDir, "philly-harrisburg-support-combined-review-summary.json");
const healthPath = resolve(reviewDir, "philly-harrisburg-support-combined-destination-health.json");
const sourceHoldsPath = resolve(reviewDir, "philly-harrisburg-support-source-held-candidates.jsonl");
const expectedKeys = ["sourceRow", "targetKind", "dedupeKey", "name", "city", "state", "country", "category", "subcategory", "address", "phone", "website", "sourceUrl", "sourceName", "sourceStatus", "ownershipDesignations", "ownershipEvidence", "regulatedProfession", "instagramUrl", "facebookUrl", "tiktokUrl", "socialSourceUrl", "servicesSearchTerms", "notes"];
const allowedKinds = new Set(["business", "online_business", "community_resource", "cultural_place", "regulated_review"]);
const normalize = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isUrl = (value) => value === null || (typeof value === "string" && /^https?:\/\//i.test(value));
const text = await readFile(manifestPath, "utf8");
const records = text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const summary = JSON.parse(await readFile(summaryPath, "utf8"));
const health = JSON.parse(await readFile(healthPath, "utf8"));
const sourceHolds = (await readFile(sourceHoldsPath, "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const issues = [];
const seen = new Set();
const statusCounts = {};
for (const [index, record] of records.entries()) {
  const label = `row ${index + 1}`;
  if (JSON.stringify(Object.keys(record)) !== JSON.stringify(expectedKeys)) issues.push(`${label}: manifest key order mismatch`);
  if (!allowedKinds.has(record.targetKind)) issues.push(`${label}: unsupported target kind`);
  if (!["pending_review", "needs_research"].includes(record.sourceStatus)) issues.push(`${label}: invalid review status`);
  if (!["Philadelphia", "Harrisburg"].includes(record.city) || record.state !== "PA" || record.country !== "United States") issues.push(`${label}: invalid geography`);
  if (typeof record.address !== "string" || !/\d/.test(record.address)) issues.push(`${label}: missing physical address`);
  if (!record.website && !record.socialSourceUrl) issues.push(`${label}: missing customer destination`);
  for (const key of ["website", "sourceUrl", "socialSourceUrl", "instagramUrl", "facebookUrl", "tiktokUrl", "ownershipEvidence"]) if (!isUrl(record[key])) issues.push(`${label}: invalid ${key}`);
  if (!Array.isArray(record.ownershipDesignations) || record.ownershipDesignations.length !== 0) issues.push(`${label}: ownership requires unsupported evidence`);
  if (typeof record.servicesSearchTerms !== "string" || !record.servicesSearchTerms.trim()) issues.push(`${label}: missing searchable terms`);
  if (JSON.stringify(record).includes('"null"')) issues.push(`${label}: string null value`);
  if (Object.keys(record).some((key) => /^(lat|lng|latitude|longitude|coordinates?)$/i.test(key))) issues.push(`${label}: coordinate field present`);
  const key = `${normalize(record.name)}|${normalize(record.city)}|${normalize(record.state)}|${normalize(record.address)}`;
  if (seen.has(key)) issues.push(`${label}: duplicate normalized name/city/state/address`);
  seen.add(key);
  statusCounts[record.sourceStatus] = (statusCounts[record.sourceStatus] ?? 0) + 1;
}
for (const [index, record] of sourceHolds.entries()) {
  const label = `source hold ${index + 1}`;
  if (record.sourceStatus !== "needs_research") issues.push(`${label}: must be needs_research`);
  if (JSON.stringify(record).includes('"null"')) issues.push(`${label}: string null value`);
}
const digest = createHash("sha256").update(text).digest("hex");
if (summary.accepted_review_only_candidates !== records.length) issues.push("summary candidate count mismatch");
if (summary.manifest_sha256 !== digest) issues.push("manifest checksum mismatch");
if (JSON.stringify(summary.preliminary_review_status_counts) !== JSON.stringify(statusCounts)) issues.push("summary status counts mismatch");
if (health.candidates !== records.length) issues.push("health candidate count mismatch");
if (sourceHolds.length !== 19) issues.push("expected 19 carried source holds");
const result = { valid: issues.length === 0, candidates: records.length, sourceHolds: sourceHolds.length, statusCounts, manifestSha256: digest, issues };
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exit(1);
