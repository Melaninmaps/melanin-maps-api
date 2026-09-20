import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

const repositoryRoot = process.cwd();
const researchRoot = "/home/ubuntu/hbcu-neighborhood-directory-research-2026-09-20";
const packageRoot = join(repositoryRoot, "data/founder-imports/2026-09-20-hbcu-neighborhood-directory-review/review-package");
const evidenceRoot = join(packageRoot, "source-evidence");
const candidatesPath = join(packageRoot, "hbcu-neighborhood-directory-review-only-candidates.jsonl");
const heldPath = join(packageRoot, "hbcu-neighborhood-directory-held-and-overlap-evidence.jsonl");
const overlapPath = join(packageRoot, "hbcu-neighborhood-directory-existing-review-overlaps.jsonl");
const summaryPath = join(packageRoot, "hbcu-neighborhood-directory-review-summary.json");
const contractPath = join(researchRoot, "RESEARCH_CONTRACT.md");
const rawFields = [
  "sourceRow", "targetKind", "name", "category", "subcategory", "address", "city", "state", "country",
  "phone", "website", "sourceUrl", "sourceName", "sourceStatus", "ownershipDesignations", "ownershipEvidence",
  "regulatedProfession", "instagramUrl", "facebookUrl", "tiktokUrl", "socialSourceUrl", "servicesSearchTerms", "notes",
];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalize = (value) => String(value ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");
const rawIdentity = (row) => [normalize(row.name), normalize(row.address), normalize(row.city), normalize(row.state)].join("|");
const packageIdentity = (row) => [normalize(row.targetKind), normalize(row.name), normalize(row.address), normalize(row.city), normalize(row.state), normalize(row.country)].join("|");
const hasNumberedAddress = (value) => /^\d+(?:-[0-9A-Za-z]+)?\s+/.test(String(value ?? ""));
const normalizeTargetKind = (value) => value === "physical_business" || value === "physical_place" ? "business" : value === "online_service" ? "online_business" : value;
const jsonl = (rows) => rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");

async function readJsonl(path) {
  const text = await readFile(path, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line, index) => {
    try { return JSON.parse(line); }
    catch { throw new Error(`${path} line ${index + 1} is not valid JSON.`); }
  });
}
async function listDirectories(path) {
  return (await readdir(path, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}
async function findReviewManifests(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) found.push(...await findReviewManifests(child));
    else if (/review-only-candidates\.jsonl$/i.test(entry.name) && child !== candidatesPath) found.push(child);
  }
  return found;
}
function assertRawRow(row, file, index) {
  const keys = Object.keys(row);
  if (keys.length !== rawFields.length || keys.some((key, position) => key !== rawFields[position])) {
    throw new Error(`${file} row ${index + 1} does not preserve the raw 23-field schema and field order.`);
  }
  if (JSON.stringify(row).includes('"null"')) throw new Error(`${file} row ${index + 1} contains a string null.`);
  if (["latitude", "longitude", "lat", "lng", "coordinates"].some((key) => key in row)) throw new Error(`${file} row ${index + 1} contains coordinates.`);
}

await rm(packageRoot, { recursive: true, force: true });
await mkdir(evidenceRoot, { recursive: true });
const areas = await listDirectories(researchRoot);
const rawCandidates = [];
const rawHeld = [];
const areaCounts = [];
for (const area of areas) {
  const sourceDirectory = join(researchRoot, area);
  const candidates = await readJsonl(join(sourceDirectory, "candidates.jsonl"));
  const held = await readJsonl(join(sourceDirectory, "held-candidates.jsonl"));
  candidates.forEach((row, index) => assertRawRow(row, `${area}/candidates.jsonl`, index));
  held.forEach((row, index) => assertRawRow(row, `${area}/held-candidates.jsonl`, index));
  rawCandidates.push(...candidates.map((row) => ({ area, row })));
  rawHeld.push(...held.map((row) => ({ area, row })));
  areaCounts.push({ area, candidateRows: candidates.length, heldRows: held.length });
  await cp(sourceDirectory, join(evidenceRoot, area), { recursive: true });
}

const existingManifests = await findReviewManifests(join(repositoryRoot, "data/founder-imports"));
const existingIdentityMap = new Map();
for (const manifest of existingManifests) {
  for (const row of await readJsonl(manifest)) {
    const identity = rawIdentity(row);
    if (!identity || identity === "|||") continue;
    existingIdentityMap.set(identity, [...(existingIdentityMap.get(identity) ?? []), relative(repositoryRoot, manifest)]);
  }
}

const canonicalRows = [];
const overlaps = [];
const internalDuplicates = [];
const inputHolds = [];
const seen = new Map();
for (const { area, row } of rawCandidates) {
  if (!row.name || !row.city || !row.state || !row.country || !hasNumberedAddress(row.address)) {
    inputHolds.push({ ...row, sourceArea: area, holdReason: "candidate_missing_identity_or_numbered_address_for_review_ingress" });
    continue;
  }
  const targetKind = normalizeTargetKind(row.targetKind);
  if (targetKind !== "business") {
    inputHolds.push({ ...row, sourceArea: area, holdReason: "candidate_target_kind_not_eligible_for_business_review_package" });
    continue;
  }
  const existing = existingIdentityMap.get(rawIdentity(row));
  if (existing?.length) {
    overlaps.push({ ...row, sourceArea: area, holdReason: "exact_identity_already_exists_in_committed_review_inventory", matchingReviewManifests: [...new Set(existing)].sort() });
    continue;
  }
  const normalized = {
    source_row_id: String(row.sourceRow),
    sourceRow: canonicalRows.length + 1,
    targetKind,
    dedupeKey: null,
    name: row.name,
    city: row.city,
    state: row.state,
    country: row.country,
    category: row.category,
    subcategory: row.subcategory,
    address: row.address,
    phone: row.phone,
    website: row.website,
    sourceUrl: row.sourceUrl,
    sourceName: row.sourceName,
    sourceStatus: row.sourceStatus,
    ownershipDesignations: row.ownershipDesignations,
    ownershipEvidence: row.ownershipEvidence,
    regulatedProfession: row.regulatedProfession,
    instagramUrl: row.instagramUrl,
    facebookUrl: row.facebookUrl,
    tiktokUrl: row.tiktokUrl,
    socialSourceUrl: row.socialSourceUrl,
    servicesSearchTerms: row.servicesSearchTerms,
    notes: JSON.stringify({
      review_only: true,
      sourceArea: area,
      originalTargetKind: row.targetKind,
      originalNotes: row.notes,
      publication_constraints: "Protected review pipeline only: reconcile before create/link, preserve evidence and records, geocode only through the controlled worker after batch approval, and never treat source attribution as MWM verification.",
    }),
  };
  normalized.dedupeKey = packageIdentity(normalized);
  const original = seen.get(normalized.dedupeKey);
  if (original) {
    internalDuplicates.push({ ...row, sourceArea: area, holdReason: "exact_duplicate_within_hbcu_neighborhood_source_inventory", canonicalSourceRowId: original.source_row_id });
    continue;
  }
  seen.set(normalized.dedupeKey, normalized);
  canonicalRows.push(normalized);
}

const heldEvidence = [
  ...rawHeld.map(({ area, row }) => ({ ...row, sourceArea: area, holdReason: "raw_research_hold" })),
  ...overlaps,
  ...internalDuplicates,
  ...inputHolds,
];
const candidatePayload = jsonl(canonicalRows);
const heldPayload = jsonl(heldEvidence);
await writeFile(candidatesPath, candidatePayload);
await writeFile(heldPath, heldPayload);
await writeFile(overlapPath, jsonl(overlaps));
const summary = {
  status: "review_only",
  sourceResearchRoot: researchRoot,
  sourceContractSha256: sha256(await readFile(contractPath)),
  areas,
  areaCounts,
  rawCandidateRows: rawCandidates.length,
  rawHeldRows: rawHeld.length,
  existingReviewManifestCount: existingManifests.length,
  exactExistingReviewOverlapRows: overlaps.length,
  internalExactDuplicateRows: internalDuplicates.length,
  ingressIdentityHoldRows: inputHolds.length,
  consolidatedCandidateRows: canonicalRows.length,
  heldAndOverlapEvidenceRows: heldEvidence.length,
  candidateManifest: { path: relative(repositoryRoot, candidatesPath), sha256: sha256(candidatePayload), rowCount: canonicalRows.length },
  heldEvidence: { path: relative(repositoryRoot, heldPath), sha256: sha256(heldPayload), rowCount: heldEvidence.length },
  targetKinds: canonicalRows.reduce((counts, row) => ({ ...counts, [row.targetKind]: (counts[row.targetKind] ?? 0) + 1 }), {}),
  invariantResults: {
    noCoordinates: true,
    noStringNull: true,
    rawSchemaAndOrderPreserved: true,
    publicationNotPerformed: true,
  },
};
await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
