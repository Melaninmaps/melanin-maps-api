import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "/home/ubuntu/melanin-maps-inventory-staging/data/founder-imports/2026-09-19-philly-bucks-sixth-depth-review");
const outputDir = join(root, "consolidated");
mkdirSync(outputDir, { recursive: true });

function normalized(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedName(value) {
  // Public directory exports commonly append a category after a pipe. That
  // directory presentation must not turn an otherwise identical business and
  // address into a second candidate.
  return normalized(String(value ?? "").replace(/\s*\|\s*.+$/, ""));
}

function escapedPattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizedAddress(value, city, state) {
  let address = normalized(value)
    .replace(/\bavenue\b/g, "ave")
    .replace(/\bstreet\b/g, "st")
    .replace(/\broad\b/g, "rd")
    .replace(/\bboulevard\b/g, "blvd")
    .replace(/\bdrive\b/g, "dr")
    .replace(/\blane\b/g, "ln")
    .replace(/\bcourt\b/g, "ct")
    .replace(/\bplace\b/g, "pl")
    .replace(/\bparkway\b/g, "pkwy")
    .replace(/\bcircle\b/g, "cir")
    .replace(/\bhighway\b/g, "hwy")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedCity = normalized(city);
  const normalizedState = normalized(canonicalState(state));
  if (normalizedCity) {
    const cityTail = escapedPattern(normalizedCity);
    const stateTail = normalizedState ? `(?: ${escapedPattern(normalizedState)})?` : "";
    address = address
      .replace(new RegExp(` ${cityTail}${stateTail}(?: \\d{5}(?: \\d{4})?)?$`), "")
      .trim();
  }
  return address;
}

function normalizeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname) return null;
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function canonicalTargetKind(value) {
  const key = normalized(value).replace(/\s+/g, "_");
  // `candidate` and `online_service` are collection labels used by two
  // independently produced public-source passes. Normalize the labels here;
  // all address, destination, and reviewer safeguards still run below.
  if (key === "candidate") return "business";
  if (key === "business" || key === "commercial_business" || key === "physical_business") return "business";
  if (key === "online_business" || key === "online_service") return "online_business";
  if (key === "community_resource") return "community_resource";
  if (key === "cultural_place") return "cultural_place";
  if (key === "regulated_review") return "regulated_review";
  if (key === "manual_review") return "manual_review";
  return null;
}

function canonicalState(value) {
  const key = normalized(value);
  if (key === "pa" || key === "pennsylvania") return "PA";
  if (key === "nj" || key === "new jersey") return "NJ";
  if (key === "de" || key === "delaware") return "DE";
  if (key === "md" || key === "maryland") return "MD";
  if (key === "va" || key === "virginia") return "VA";
  if (key === "dc" || key === "district of columbia" || key === "district columbia") return "DC";
  if (key === "ga" || key === "georgia") return "GA";
  if (key === "il" || key === "illinois") return "IL";
  if (key === "tx" || key === "texas") return "TX";
  if (key === "nc" || key === "north carolina") return "NC";
  if (key === "mi" || key === "michigan") return "MI";
  if (key === "ca" || key === "california") return "CA";
  if (key === "al" || key === "alabama") return "AL";
  if (key === "sc" || key === "south carolina") return "SC";
  if (key === "la" || key === "louisiana") return "LA";
  if (key === "fl" || key === "florida") return "FL";
  if (key === "ny" || key === "new york") return "NY";
  if (key === "oh" || key === "ohio") return "OH";
  if (key === "in" || key === "indiana") return "IN";
  if (key === "mn" || key === "minnesota") return "MN";
  if (key === "ma" || key === "massachusetts") return "MA";
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hasPhysicalStreetAddress(value) {
  if (typeof value !== "string") return false;
  const address = value.trim();
  if (address.length < 10 || !/\d/.test(address)) return false;
  return !/\b(?:p\.?\s*o\.?\s*box|post office box|service area|serving\s+[^,]+)\b/i.test(address);
}

function destination(record) {
  return normalizeUrl(record.website)
    ?? normalizeUrl(record.instagramUrl)
    ?? normalizeUrl(record.facebookUrl)
    ?? normalizeUrl(record.tiktokUrl)
    ?? normalizeUrl(record.socialSourceUrl);
}

function candidateKey(record) {
  const name = normalizedName(record.name);
  const city = normalized(record.city);
  const state = normalized(canonicalState(record.state));
  const address = normalizedAddress(record.address, record.city, record.state);
  if (record.targetKind === "online_business") {
    return `online|${name}|${destination(record) ?? "missing-destination"}`;
  }
  return `physical|${name}|${city}|${state}|${address}`;
}

function sourceFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.endsWith(".jsonl") && !/-held\.jsonl$/i.test(file))
    .sort()
    .map((file) => join(directory, file));
}

const files = [
  ...sourceFiles(join(root, "raw")),
  ...sourceFiles(join(root, "source-passes")),
  ...sourceFiles(join(root, "community-passes")),
];
const inputRows = [];
const invalidRows = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      const targetKind = canonicalTargetKind(record.targetKind);
      const state = canonicalState(record.state);
      const isMapless = targetKind === "online_business" || targetKind === "community_resource";
      // Online-only services and location-linked community resources can be
      // addressless and mapless. Commercial, regulated, and cultural places
      // still require a specific locality and physical street address.
      const required = ["sourceRow", "targetKind", "name", "country", "category", "sourceUrl"];
      if (targetKind !== "online_business") required.push("city");
      const missing = required.filter((key) => !(key in record) || record[key] === null || String(record[key]).trim() === "");
      const locationProblem = targetKind === "online_business"
        ? record.address != null
        : !isMapless && !hasPhysicalStreetAddress(record.address);
      const destinationProblem = !destination(record);
      if (missing.length || !targetKind || locationProblem || destinationProblem) {
        invalidRows.push({ file: basename(file), line: lineIndex + 1, name: record?.name ?? null, missing, invalidTargetKind: record.targetKind ?? null, locationProblem, destinationProblem });
        continue;
      }
      inputRows.push({ record: { ...record, targetKind, state }, file: basename(file), line: lineIndex + 1 });
    } catch (error) {
      invalidRows.push({ file: basename(file), line: lineIndex + 1, parseError: String(error) });
    }
  }
}

const recordsByKey = new Map();
const duplicateRows = [];
for (const item of inputRows) {
  const key = candidateKey(item.record);
  const existing = recordsByKey.get(key);
  if (!existing) {
    recordsByKey.set(key, { ...item, evidenceFiles: [{ file: item.file, line: item.line }] });
    continue;
  }
  existing.evidenceFiles.push({ file: item.file, line: item.line });
  duplicateRows.push({
    duplicateKey: key,
    retained: { name: existing.record.name, file: existing.file, line: existing.line, sourceUrl: existing.record.sourceUrl },
    duplicate: { name: item.record.name, file: item.file, line: item.line, sourceUrl: item.record.sourceUrl },
    reason: "normalized_name_city_state_address_or_destination_match",
  });
}

const destinationIndex = new Map();
for (const item of recordsByKey.values()) {
  const url = destination(item.record);
  if (!url) continue;
  const group = destinationIndex.get(url) ?? [];
  group.push(item);
  destinationIndex.set(url, group);
}
const destinationCollisions = [...destinationIndex.entries()]
  .filter(([, items]) => new Set(items.map((item) => normalized(item.record.name))).size > 1)
  .map(([url, items]) => ({
    destination: url,
    records: items.map((item) => ({ name: item.record.name, city: item.record.city, state: item.record.state, file: item.file, line: item.line })),
    reason: "same_customer_destination_different_name_manual_reconciliation_required",
  }));

const consolidated = [...recordsByKey.values()]
  .sort((a, b) => String(a.record.city ?? "").localeCompare(String(b.record.city ?? "")) || a.record.name.localeCompare(b.record.name))
  .map((item, index) => {
    let notes = {};
    try { notes = typeof item.record.notes === "string" ? JSON.parse(item.record.notes) : {}; } catch { notes = { original_notes: item.record.notes }; }
    const record = {
      ...item.record,
      sourceRow: index + 1,
      notes: JSON.stringify({
      ...notes,
        philly_bucks_sixth_depth_consolidation: {
          canonical_source_file: item.file,
          canonical_source_line: item.line,
          corroborating_source_rows: item.evidenceFiles,
          normalized_duplicate_key: candidateKey(item.record),
        },
      }),
    };
    return record;
  });

function countBy(values, fn) {
  const counts = {};
  for (const value of values) {
    const key = fn(value);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

const summary = {
  generatedAt: new Date().toISOString(),
  publicationStatus: "REVIEW_ONLY_NOT_PUBLISHED",
  inputFiles: files.map((file) => basename(file)),
  inputRows: inputRows.length,
  invalidOrIncompleteRowsHeld: invalidRows.length,
  exactCrossSourceDuplicatesRemoved: duplicateRows.length,
  consolidatedCandidates: consolidated.length,
  potentialSameDestinationCollisionsHeldForReview: destinationCollisions.length,
  addressBackedCandidates: consolidated.filter((record) => hasPhysicalStreetAddress(record.address)).length,
  commercialMapPinReviewCandidates: consolidated.filter((record) => (
    (record.targetKind === "business" || record.targetKind === "regulated_review")
    && hasPhysicalStreetAddress(record.address)
  )).length,
  maplessCommunityResources: consolidated.filter((record) => (
    record.targetKind === "community_resource" && !hasPhysicalStreetAddress(record.address)
  )).length,
  onlineOnlyCandidates: consolidated.filter((record) => record.targetKind === "online_business").length,
  targetKinds: countBy(consolidated, (record) => record.targetKind),
  categories: countBy(consolidated, (record) => record.category),
  states: countBy(consolidated, (record) => `${record.city}, ${record.state ?? ""}`.trim()),
  officialCustomerDestinationCoverage: consolidated.filter((record) => destination(record)).length,
  files: {
    candidates: "philly-bucks-sixth-depth-consolidated-candidates.jsonl",
    exactDuplicates: "philly-bucks-sixth-depth-exact-duplicates-removed.json",
    destinationCollisions: "philly-bucks-sixth-depth-destination-collisions-review.json",
    invalidRowsHeld: "philly-bucks-sixth-depth-invalid-or-incomplete-rows-held.json",
  },
};
const candidateText = consolidated.map((record) => JSON.stringify(record)).join("\n") + (consolidated.length ? "\n" : "");
writeFileSync(join(outputDir, summary.files.candidates), candidateText);
writeFileSync(join(outputDir, summary.files.exactDuplicates), JSON.stringify(duplicateRows, null, 2) + "\n");
writeFileSync(join(outputDir, summary.files.destinationCollisions), JSON.stringify(destinationCollisions, null, 2) + "\n");
writeFileSync(join(outputDir, summary.files.invalidRowsHeld), JSON.stringify(invalidRows, null, 2) + "\n");
summary.candidatesSha256 = createHash("sha256").update(candidateText).digest("hex");
writeFileSync(join(outputDir, "philly-bucks-sixth-depth-consolidation-summary.json"), JSON.stringify(summary, null, 2) + "\n");

const report = `# Philadelphia and Bucks County Sixth-Depth Directory Consolidation\n\n**Status:** Review only. No candidate in this package has been published to production, placed on a live map, or made available to Kinfolk.\n\nThe source-by-source collection and initial philly-bucks-sixth-depth pass produced ${summary.inputRows} source records. The consolidation retained ${summary.consolidatedCandidates} structurally complete candidates after removing ${summary.exactCrossSourceDuplicatesRemoved} exact normalized cross-source duplicates and holding ${summary.invalidOrIncompleteRowsHeld} incomplete rows outside the package. ${summary.potentialSameDestinationCollisionsHeldForReview} records share a customer destination with a different name and are retained in a separate manual-reconciliation report rather than silently merged.\n\n${summary.addressBackedCandidates} candidates have a source-backed physical street address. ${summary.commercialMapPinReviewCandidates} commercial candidates could proceed to a later protected map-pin review after duplicate reconciliation, current-destination verification, and guarded server-side geocoding. ${summary.maplessCommunityResources} community resources have no qualifying street address and remain explicitly mapless. ${summary.onlineOnlyCandidates} candidates are valid online-only services or shops; they may be searchable after approval but must never receive fabricated map pins or directions. Every retained candidate has a source URL and at least one customer-facing official public destination supplied by its evidence record.\n\n## Candidate composition\n\n| Measure | Count |\n|---|---:|\n| Source records collected | ${summary.inputRows} |\n| Consolidated candidates | ${summary.consolidatedCandidates} |\n| Exact duplicates removed | ${summary.exactCrossSourceDuplicatesRemoved} |\n| Incomplete rows held | ${summary.invalidOrIncompleteRowsHeld} |\n| Address-backed candidates | ${summary.addressBackedCandidates} |\n| Commercial map-pin review candidates | ${summary.commercialMapPinReviewCandidates} |\n| Explicitly mapless community resources | ${summary.maplessCommunityResources} |\n| Online-only candidates | ${summary.onlineOnlyCandidates} |\n| Same-destination review collisions | ${summary.potentialSameDestinationCollisionsHeldForReview} |\n\n## Publication boundary\n\nThis package is input to the protected directory review process only. Physical commercial businesses still need their individual address reviewed and geocoded before any map pin is published. Online-only candidates must be reviewed for their public destination and remain mapless. Community resources, cultural places, and regulated professions remain in their respective protected review paths. No source statement is treated as inferred evidence of identity, ownership, language, hours, accessibility, licensing, or service quality.\n\n## Files\n\nThe consolidated candidate file is philly-bucks-sixth-depth-consolidated-candidates.jsonl. The package also includes reports for removed exact duplicates, potential same-destination collisions, and structurally incomplete rows held outside the review set. The candidate checksum is ${summary.candidatesSha256}.\n`;
writeFileSync(join(outputDir, "README.md"), report);
console.log(JSON.stringify(summary, null, 2));
