import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? "data/founder-imports/2026-09-20-nyc-weekend-family-lifestyle-review");
const packageDirectory = resolve(root, "review-package");
const manifestFile = resolve(packageDirectory, "nyc-weekend-family-lifestyle-review-only-candidates.jsonl");
const heldFile = resolve(packageDirectory, "nyc-weekend-family-lifestyle-review-held-and-duplicate-evidence.jsonl");
const summaryFile = resolve(packageDirectory, "nyc-weekend-family-lifestyle-review-summary.json");
const healthFile = resolve(packageDirectory, "nyc-weekend-family-lifestyle-destination-health.json");
const rawDirectory = resolve(root, "raw");
const categoryDirectories = ["beauty-wellness", "dining-nightlife", "entertainment-arts", "family-youth", "faith-community"];
const allowedKinds = new Set(["business", "online_business", "community_resource", "cultural_place", "regulated_review"]);
const allowedCities = new Set(["Astoria", "Bronx", "Brooklyn", "Corona", "Flushing", "Jamaica", "Laurelton", "LIC", "Manhattan", "New York", "Queens", "Staten Island", "Woodside"]);
const numberedAddress = /^\s*\d+[A-Za-z0-9-]*\s+.+/;
const errors = [];
const sha256 = (content) => createHash("sha256").update(content).digest("hex");
const stringNull = (value) => value === "null" || (Array.isArray(value) && value.some(stringNull)) || (value && typeof value === "object" && Object.values(value).some(stringNull));

const manifestContent = await readFile(manifestFile, "utf8");
const manifest = manifestContent.split(/\r?\n/).filter(Boolean).map((line, index) => ({ line: index + 1, record: JSON.parse(line) }));
const held = (await readFile(heldFile, "utf8")).split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const summary = JSON.parse(await readFile(summaryFile, "utf8"));
const health = JSON.parse(await readFile(healthFile, "utf8"));
const rawCandidateCounts = await Promise.all(categoryDirectories.map(async (category) => {
  const content = await readFile(resolve(rawDirectory, category, "candidates.jsonl"), "utf8");
  return content.split(/\r?\n/).filter(Boolean).length;
}));
const rawCandidateCount = rawCandidateCounts.reduce((total, count) => total + count, 0);
const dedupe = new Set();
const names = new Set();
for (const { line, record } of manifest) {
  const prefix = `line ${line}`;
  if (!allowedKinds.has(record.targetKind)) errors.push(`${prefix}: invalid target kind`);
  if (record.state !== "NY" || record.country !== "United States" || !allowedCities.has(record.city)) errors.push(`${prefix}: outside NYC geography`);
  if (stringNull(record)) errors.push(`${prefix}: literal string null`);
  if (/(?:"lat"|"lng"|"latitude"|"longitude"|"coordinates")/i.test(JSON.stringify(record))) errors.push(`${prefix}: coordinate data present`);
  if (!record.dedupeKey || dedupe.has(record.dedupeKey)) errors.push(`${prefix}: duplicate dedupe key`);
  dedupe.add(record.dedupeKey);
  const nameKey = `${String(record.name).toLowerCase()}|${String(record.address ?? "").toLowerCase()}`;
  if (names.has(nameKey)) errors.push(`${prefix}: duplicate normalized name/address`);
  names.add(nameKey);
  if (record.targetKind === "business" && !numberedAddress.test(String(record.address ?? ""))) errors.push(`${prefix}: business lacks numbered address`);
  if (record.targetKind === "online_business" && record.address !== null) errors.push(`${prefix}: online business is not mapless`);
  if (record.targetKind !== "online_business" && record.targetKind !== "community_resource" && !numberedAddress.test(String(record.address ?? ""))) errors.push(`${prefix}: physical record lacks numbered address`);
  if (!record.sourceUrl || (!record.website && !record.socialSourceUrl)) errors.push(`${prefix}: missing source or customer destination`);
  if (!String(record.notes ?? "").includes("review_only")) errors.push(`${prefix}: missing review-only provenance`);
}
if (summary.publication_status !== "NOT PUBLISHED — review-only package") errors.push("summary must be explicitly review-only");
if (summary.raw_candidate_rows !== rawCandidateCount) errors.push("raw candidate count does not reconcile");
if (summary.accepted_review_only_candidates !== manifest.length) errors.push("summary candidate count does not reconcile");
if (summary.manifest_sha256 !== sha256(manifestContent)) errors.push("manifest checksum mismatch");
if ((health.results ?? []).length !== health.uniqueDestinations) errors.push("destination-health result count does not reconcile");
if ((health.candidates ?? 0) !== manifest.length) errors.push("destination-health candidate count does not reconcile");
if (held.filter((item) => item.disposition === "consolidated_duplicate").length !== summary.cross_category_duplicate_rows_consolidated) errors.push("duplicate evidence count does not reconcile");
const output = {
  ok: errors.length === 0,
  raw_candidate_rows: rawCandidateCount,
  review_only_candidates: manifest.length,
  held_or_preserved_evidence_rows: held.length,
  consolidated_duplicate_rows: held.filter((item) => item.disposition === "consolidated_duplicate").length,
  manifest_sha256: sha256(manifestContent),
  target_kinds: manifest.reduce((counts, item) => { counts[item.record.targetKind] = (counts[item.record.targetKind] ?? 0) + 1; return counts; }, {}),
  destination_health: health.counts ?? {},
  errors,
};
console.log(JSON.stringify(output, null, 2));
if (errors.length) process.exit(2);
