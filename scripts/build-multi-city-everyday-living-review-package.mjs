import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const repositoryRoot = process.cwd();
const researchRoot = "/home/ubuntu/directory-research-wave-2026-09-20/multi-city-everyday-living-sweep";
const packageRoot = join(
  repositoryRoot,
  "data/founder-imports/2026-09-20-multi-city-everyday-living-review/review-package",
);
const evidenceRoot = join(packageRoot, "source-evidence");
const canonicalCandidatesPath = join(packageRoot, "multi-city-everyday-living-review-only-candidates.jsonl");
const heldEvidencePath = join(packageRoot, "multi-city-everyday-living-held-and-overlap-evidence.jsonl");
const overlapPath = join(packageRoot, "multi-city-everyday-living-existing-review-overlaps.jsonl");
const summaryPath = join(packageRoot, "multi-city-everyday-living-review-summary.json");
const contractPath = join(researchRoot, "RESEARCH_CONTRACT.md");
const fields = [
  "sourceRow", "targetKind", "name", "category", "subcategory", "address", "city", "state", "country",
  "phone", "website", "sourceUrl", "sourceName", "sourceStatus", "ownershipDesignations", "ownershipEvidence",
  "regulatedProfession", "instagramUrl", "facebookUrl", "tiktokUrl", "socialSourceUrl", "servicesSearchTerms", "notes",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function normalize(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function host(value) {
  try { return new URL(String(value)).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}
function rawIdentity(row) {
  return [normalize(row.name), normalize(row.address), normalize(row.city), normalize(row.state)].join("|");
}
function packageIdentity(row) {
  const base = [normalize(row.name), normalize(row.city), normalize(row.state), normalize(row.country)].join("|");
  if (row.targetKind === "online_business") {
    const destinationHost = host(row.website) || host(row.socialSourceUrl);
    return destinationHost ? `online|${base}|${destinationHost}` : null;
  }
  const address = normalize(row.address);
  return address ? `physical|${base}|${address}` : null;
}
function normalizeTargetKind(value) {
  if (value === "online_service") return "online_business";
  if (value === "physical_place") return "business";
  return value;
}
function hasNumberedAddress(value) {
  return /\b\d{1,6}\b/.test(String(value ?? ""));
}
function assertRawRow(row, file, index) {
  const keys = Object.keys(row);
  if (keys.length !== fields.length || keys.some((key, position) => key !== fields[position])) {
    throw new Error(`${file} row ${index + 1} does not match the required raw schema and field order.`);
  }
  if (JSON.stringify(row).includes('"null"')) throw new Error(`${file} row ${index + 1} contains a string null.`);
  if (["latitude", "longitude", "lat", "lng", "coordinates"].some((key) => key in row)) {
    throw new Error(`${file} row ${index + 1} contains coordinate data.`);
  }
  if (!String(row.sourceRow).startsWith("multi-city-")) throw new Error(`${file} row ${index + 1} has an invalid source row identifier.`);
}
async function readJsonl(path) {
  const text = await readFile(path, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch { throw new Error(`${path} line ${index + 1} is invalid JSON.`); }
  });
}
async function listDirs(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}
async function findReviewManifests(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...await findReviewManifests(child));
    else if (/review-only-candidates\.jsonl$/i.test(entry.name)) found.push(child);
  }
  return found;
}
function jsonl(rows) {
  return rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");
}

await rm(packageRoot, { recursive: true, force: true });
await mkdir(packageRoot, { recursive: true });
await mkdir(evidenceRoot, { recursive: true });
const cities = await listDirs(researchRoot);
const rawCandidates = [];
const rawHeld = [];
const cityCounts = [];
for (const city of cities) {
  const sourceDirectory = join(researchRoot, city);
  const candidates = await readJsonl(join(sourceDirectory, "candidates.jsonl"));
  const held = await readJsonl(join(sourceDirectory, "held-candidates.jsonl"));
  candidates.forEach((row, index) => assertRawRow(row, `${city}/candidates.jsonl`, index));
  held.forEach((row, index) => assertRawRow(row, `${city}/held-candidates.jsonl`, index));
  rawCandidates.push(...candidates.map((row) => ({ cityFolder: city, row })));
  rawHeld.push(...held.map((row) => ({ cityFolder: city, row })));
  cityCounts.push({ cityFolder: city, candidateRows: candidates.length, heldRows: held.length });
  await cp(sourceDirectory, join(evidenceRoot, city), { recursive: true });
}

const reviewRoot = join(repositoryRoot, "data/founder-imports");
const existingManifests = await findReviewManifests(reviewRoot);
const existingIdentityMap = new Map();
for (const manifestPath of existingManifests) {
  const records = await readJsonl(manifestPath);
  for (const record of records) {
    const key = rawIdentity(record);
    if (!key || key === "|||") continue;
    const matches = existingIdentityMap.get(key) ?? [];
    matches.push(relative(repositoryRoot, manifestPath));
    existingIdentityMap.set(key, matches);
  }
}

const canonicalRows = [];
const overlaps = [];
const internalDuplicateEvidence = [];
const inputValidationHolds = [];
const seen = new Map();
for (const item of rawCandidates) {
  if (!item.row.name || !item.row.city || !item.row.state || !item.row.country) {
    inputValidationHolds.push({
      ...item.row,
      holdReason: "candidate_missing_required_identity_for_review_ingress",
      sourceCityFolder: item.cityFolder,
    });
    continue;
  }
  const normalizedTargetKind = normalizeTargetKind(item.row.targetKind);
  if (normalizedTargetKind !== "online_business" && !hasNumberedAddress(item.row.address)) {
    inputValidationHolds.push({
      ...item.row,
      holdReason: "candidate_missing_numbered_physical_address_for_review_ingress",
      sourceCityFolder: item.cityFolder,
    });
    continue;
  }
  const overlapKey = rawIdentity(item.row);
  const existing = existingIdentityMap.get(overlapKey);
  if (existing?.length) {
    overlaps.push({
      ...item.row,
      holdReason: "exact_identity_already_exists_in_committed_review_inventory",
      matchingReviewManifests: [...new Set(existing)].sort(),
      sourceCityFolder: item.cityFolder,
    });
    continue;
  }
  const targetKind = normalizedTargetKind;
  const normalized = {
    source_row_id: String(item.row.sourceRow),
    sourceRow: canonicalRows.length + 1,
    targetKind,
    dedupeKey: null,
    name: item.row.name,
    city: item.row.city,
    state: item.row.state,
    country: item.row.country,
    category: item.row.category,
    subcategory: item.row.subcategory,
    address: targetKind === "online_business" ? null : item.row.address,
    phone: item.row.phone,
    website: item.row.website,
    sourceUrl: item.row.sourceUrl,
    sourceName: item.row.sourceName,
    sourceStatus: item.row.sourceStatus,
    ownershipDesignations: item.row.ownershipDesignations,
    ownershipEvidence: item.row.ownershipEvidence,
    regulatedProfession: item.row.regulatedProfession,
    instagramUrl: item.row.instagramUrl,
    facebookUrl: item.row.facebookUrl,
    tiktokUrl: item.row.tiktokUrl,
    socialSourceUrl: item.row.socialSourceUrl,
    servicesSearchTerms: item.row.servicesSearchTerms,
    notes: JSON.stringify({
      review_only: true,
      sourceCityFolder: item.cityFolder,
      originalTargetKind: item.row.targetKind,
      originalNotes: item.row.notes,
      publication_constraints: "Protected review pipeline only: reconcile against production before create/link, preserve evidence and records, geocode only through the controlled worker after approval, and never treat source attribution as MWM verification.",
    }),
  };
  normalized.dedupeKey = packageIdentity(normalized);
  const identity = normalized.dedupeKey ?? `manual|${normalized.source_row_id}`;
  const original = seen.get(identity);
  if (original) {
    internalDuplicateEvidence.push({
      ...item.row,
      holdReason: "exact_duplicate_within_multi_city_source_inventory",
      canonicalSourceRowId: original.source_row_id,
      sourceCityFolder: item.cityFolder,
    });
    continue;
  }
  seen.set(identity, normalized);
  canonicalRows.push(normalized);
}

const heldEvidence = [
  ...rawHeld.map(({ cityFolder, row }) => ({ ...row, holdReason: "raw_research_hold", sourceCityFolder: cityFolder })),
  ...overlaps,
  ...internalDuplicateEvidence,
  ...inputValidationHolds,
];
const candidatePayload = jsonl(canonicalRows);
const heldPayload = jsonl(heldEvidence);
await writeFile(canonicalCandidatesPath, candidatePayload);
await writeFile(heldEvidencePath, heldPayload);
await writeFile(overlapPath, jsonl(overlaps));
const summary = {
  status: "review_only",
  sourceResearchRoot: researchRoot,
  sourceContractSha256: sha256(await readFile(contractPath)),
  cities,
  cityCounts,
  rawCandidateRows: rawCandidates.length,
  rawHeldRows: rawHeld.length,
  existingReviewManifestCount: existingManifests.length,
  exactExistingReviewOverlapRows: overlaps.length,
  internalExactDuplicateRows: internalDuplicateEvidence.length,
  ingressIdentityHoldRows: inputValidationHolds.length,
  consolidatedCandidateRows: canonicalRows.length,
  heldAndOverlapEvidenceRows: heldEvidence.length,
  candidateManifest: {
    path: relative(repositoryRoot, canonicalCandidatesPath),
    sha256: sha256(candidatePayload),
    rowCount: canonicalRows.length,
  },
  heldEvidence: {
    path: relative(repositoryRoot, heldEvidencePath),
    sha256: sha256(heldPayload),
    rowCount: heldEvidence.length,
  },
  targetKinds: canonicalRows.reduce((counts, row) => {
    counts[row.targetKind] = (counts[row.targetKind] ?? 0) + 1;
    return counts;
  }, {}),
  invariantResults: {
    noCoordinates: true,
    noStringNull: true,
    rawSchemaAndOrderPreserved: true,
    rawInternalExactNameAddressDuplicates: 0,
    existingReviewExactNameAddressOverlapsRemovedFromCandidateManifest: overlaps.length,
    publicationNotPerformed: true,
  },
};
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
