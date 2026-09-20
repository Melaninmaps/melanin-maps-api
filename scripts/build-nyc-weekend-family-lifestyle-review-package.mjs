import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(process.argv[2] ?? "data/founder-imports/2026-09-20-nyc-weekend-family-lifestyle-review");
const rawDirectory = resolve(root, "raw");
const packageDirectory = resolve(root, "review-package");
const healthFile = resolve(packageDirectory, "nyc-weekend-family-lifestyle-destination-health.json");
const categoryDirectories = ["beauty-wellness", "dining-nightlife", "entertainment-arts", "family-youth", "faith-community"];
const allowedKinds = new Set(["business", "online_business", "community_resource", "cultural_place", "regulated_review"]);
const physicalAddress = /^\s*\d+[A-Za-z0-9-]*\s+.+/;

const text = (value) => typeof value === "string" ? value.trim() : "";
const normalized = (value) => text(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
const sha256 = (content) => createHash("sha256").update(content).digest("hex");
const httpUrl = (value) => {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
};
const canonicalCountry = (value) => /^(?:us|usa|united states|united states of america)$/i.test(text(value)) ? "United States" : text(value) || null;
const normalizedAddress = (value) => normalized(value).replace(/\b(?:avenue|ave)\b/g, "ave").replace(/\b(?:boulevard|blvd)\b/g, "blvd").replace(/\b(?:street|st)\b/g, "st").replace(/\b(?:road|rd)\b/g, "rd");
const dedupeKey = (record) => record.targetKind === "online_business"
  ? `${normalized(record.name)}|online:${normalized(record.website ?? record.socialSourceUrl)}`
  : `${normalized(record.name)}|${normalized(record.city)}|${normalized(record.state)}|addr:${normalizedAddress(record.address)}`;
const hasStringNull = (value) => value === "null" || (Array.isArray(value) && value.some(hasStringNull)) || (value && typeof value === "object" && Object.values(value).some(hasStringNull));
const uniqueTerms = (values) => [...new Set(values.flatMap((value) => text(value).split(/[;,]/).map((term) => term.trim()).filter(Boolean)))];

const rawCandidates = [];
const rawHeld = [];
for (const categoryDirectory of categoryDirectories) {
  const candidatesPath = resolve(rawDirectory, categoryDirectory, "candidates.jsonl");
  const heldPath = resolve(rawDirectory, categoryDirectory, "held-candidates.jsonl");
  for (const line of (await readFile(candidatesPath, "utf8")).split(/\r?\n/).filter(Boolean)) {
    rawCandidates.push({ categoryDirectory, record: JSON.parse(line) });
  }
  for (const line of (await readFile(heldPath, "utf8")).split(/\r?\n/).filter(Boolean)) {
    rawHeld.push({ categoryDirectory, record: JSON.parse(line) });
  }
}

const groups = new Map();
for (const source of rawCandidates) {
  const sourceKind = text(source.record.targetKind);
  const targetKind = sourceKind === "physical_business" ? "business" : sourceKind;
  const candidate = { ...source.record, targetKind };
  const key = dedupeKey(candidate);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ ...source, record: candidate });
}

const precedence = (source) => {
  const status = text(source.record.sourceStatus).toLowerCase();
  const official = /official|verified/.test(status) ? 0 : 1;
  const category = source.categoryDirectory === "family-youth" ? 0 : 1;
  return `${official}${category}${String(source.record.sourceRow)}`;
};
const manifest = [];
const duplicates = [];
const stagingHolds = [];
for (const [key, sources] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const ordered = [...sources].sort((a, b) => precedence(a).localeCompare(precedence(b)));
  const canonical = ordered[0];
  const source = canonical.record;
  const targetKind = source.targetKind;
  const reasons = [];
  const website = httpUrl(source.website);
  const socialSourceUrl = httpUrl(source.socialSourceUrl) ?? httpUrl(source.instagramUrl) ?? httpUrl(source.facebookUrl) ?? httpUrl(source.tiktokUrl);
  const sourceUrl = httpUrl(source.sourceUrl);
  if (!allowedKinds.has(targetKind)) reasons.push("unsupported_target_kind");
  if (!text(source.name)) reasons.push("missing_name");
  if (!text(source.city) || !["Astoria", "Bronx", "Brooklyn", "Corona", "Flushing", "Jamaica", "Laurelton", "LIC", "Manhattan", "New York", "Queens", "Staten Island", "Woodside"].includes(text(source.city))) reasons.push("outside_nyc_locality_scope");
  if (text(source.state) !== "NY" || canonicalCountry(source.country) !== "United States") reasons.push("outside_nyc_state_country_scope");
  if (!text(source.category)) reasons.push("missing_category");
  if (!sourceUrl) reasons.push("missing_or_invalid_source_url");
  if (targetKind === "business" && !physicalAddress.test(text(source.address))) reasons.push("physical_business_without_numbered_address");
  if (targetKind === "online_business" && source.address !== null) reasons.push("online_business_with_address");
  if (targetKind !== "online_business" && targetKind !== "community_resource" && !physicalAddress.test(text(source.address))) reasons.push("physical_candidate_without_numbered_address");
  if (!website && !socialSourceUrl) reasons.push("missing_customer_destination");
  if (hasStringNull(source)) reasons.push("literal_string_null");
  if (reasons.length) {
    stagingHolds.push({ disposition: "hold", sourceCategory: canonical.categoryDirectory, sourceRow: source.sourceRow, name: source.name ?? null, reasons, rawRecord: source });
    continue;
  }
  const allCategories = [...new Set(ordered.map((item) => text(item.record.category)).filter(Boolean))];
  const allSubcategories = [...new Set(ordered.map((item) => text(item.record.subcategory)).filter(Boolean))];
  const sourceEvidence = ordered.map((item) => ({
    raw_category: item.categoryDirectory,
    raw_source_row: item.record.sourceRow,
    source_url: item.record.sourceUrl,
    source_name: item.record.sourceName,
    source_status: item.record.sourceStatus,
    raw_notes: item.record.notes ?? null,
  }));
  const record = {
    sourceRow: manifest.length + 1,
    targetKind,
    dedupeKey: key,
    name: text(source.name),
    city: text(source.city),
    state: "NY",
    country: "United States",
    category: allCategories.join(" | "),
    subcategory: allSubcategories.join(" | ") || null,
    address: targetKind === "online_business" ? null : text(source.address),
    phone: text(source.phone) || null,
    website,
    sourceUrl,
    sourceName: text(source.sourceName) || "Source-backed official listing",
    sourceStatus: text(source.sourceStatus) || null,
    ownershipDesignations: Array.isArray(source.ownershipDesignations) ? source.ownershipDesignations.filter((item) => typeof item === "string" && item.trim()) : [],
    ownershipEvidence: httpUrl(source.ownershipEvidence),
    regulatedProfession: source.regulatedProfession === true || targetKind === "regulated_review",
    instagramUrl: httpUrl(source.instagramUrl),
    facebookUrl: httpUrl(source.facebookUrl),
    tiktokUrl: httpUrl(source.tiktokUrl),
    socialSourceUrl,
    servicesSearchTerms: uniqueTerms(ordered.map((item) => item.record.servicesSearchTerms)).join("; ") || null,
    notes: JSON.stringify({
      review_only: true,
      package: "2026-09-20-nyc-weekend-family-lifestyle-review",
      canonical_raw_record: { category: canonical.categoryDirectory, source_row: source.sourceRow },
      consolidated_categories: allCategories,
      source_evidence: sourceEvidence,
      duplicate_raw_records_preserved: ordered.slice(1).map((item) => ({ category: item.categoryDirectory, source_row: item.record.sourceRow })),
    }),
  };
  record.dedupeKey = dedupeKey(record);
  manifest.push(record);
  for (const duplicate of ordered.slice(1)) {
    duplicates.push({ disposition: "consolidated_duplicate", canonicalDedupeKey: record.dedupeKey, canonicalSourceRow: record.sourceRow, sourceCategory: duplicate.categoryDirectory, sourceRow: duplicate.record.sourceRow, name: duplicate.record.name, rawRecord: duplicate.record });
  }
}

let health = { checkedAt: null, candidates: manifest.length, uniqueDestinations: 0, results: [], counts: {} };
try { health = JSON.parse(await readFile(healthFile, "utf8")); } catch { /* health is deliberately optional on first package pass */ }
const manifestContent = manifest.map((record) => JSON.stringify(record)).join("\n") + (manifest.length ? "\n" : "");
const manifestHash = sha256(manifestContent);
const healthByUrl = new Map((health.results ?? []).map((result) => [result.url, result]));
const reviewStatus = (record) => {
  const outcomes = [record.website, record.socialSourceUrl].filter(Boolean).map((url) => healthByUrl.get(url)?.outcome ?? "not_checked");
  return outcomes.every((outcome) => outcome === "reachable") ? "pending_review" : "needs_research";
};
const reviewStatusCounts = manifest.reduce((counts, record) => {
  const status = reviewStatus(record);
  counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}, {});
const targetKindCounts = manifest.reduce((counts, record) => {
  counts[record.targetKind] = (counts[record.targetKind] ?? 0) + 1;
  return counts;
}, {});
const held = [
  ...rawHeld.map((item) => ({ disposition: "research_hold", sourceCategory: item.categoryDirectory, sourceRow: item.record.sourceRow, name: item.record.name ?? null, reasons: ["source_research_hold"], rawRecord: item.record })),
  ...stagingHolds,
  ...duplicates,
];
const summary = {
  package: "2026-09-20-nyc-weekend-family-lifestyle-review",
  publication_status: "NOT PUBLISHED — review-only package",
  raw_candidate_rows: rawCandidates.length,
  raw_held_rows: rawHeld.length,
  cross_category_duplicate_rows_consolidated: duplicates.length,
  accepted_review_only_candidates: manifest.length,
  held_or_preserved_evidence_rows: held.length,
  accepted_by_target_kind: targetKindCounts,
  preliminary_review_status_counts: reviewStatusCounts,
  manifest_sha256: manifestHash,
  destination_health: {
    checked_at: health.checkedAt ?? null,
    unique_destinations: health.uniqueDestinations ?? 0,
    by_outcome: health.counts ?? {},
    policy: "Any timeout, network error, review-required response, or not-checked destination remains a review gate; it does not establish closure.",
  },
  safeguards: [
    "Research and package records are not published businesses, map pins, search results, or Kinfolk recommendations.",
    "No production database, user, authentication, session, waitlist, payment, or Community record is read or written by this builder.",
    "Only a separately configured directory-review database, signed checksum ingress, policy/reconciliation, and exactly-one controlled worker may later process an explicitly approved manifest.",
    "Physical places retain only source-backed numbered addresses and no coordinates; online-only records remain mapless.",
    "Cross-category duplicate raw records remain preserved in the duplicate-evidence file and canonical record provenance.",
  ],
};
await mkdir(packageDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(packageDirectory, "nyc-weekend-family-lifestyle-review-only-candidates.jsonl"), manifestContent),
  writeFile(resolve(packageDirectory, "nyc-weekend-family-lifestyle-review-held-and-duplicate-evidence.jsonl"), held.map((item) => JSON.stringify(item)).join("\n") + (held.length ? "\n" : "")),
  writeFile(resolve(packageDirectory, "nyc-weekend-family-lifestyle-review-summary.json"), `${JSON.stringify(summary, null, 2)}\n`),
]);
console.log(JSON.stringify({ rawCandidates: rawCandidates.length, rawHeld: rawHeld.length, acceptedReviewOnly: manifest.length, consolidatedDuplicates: duplicates.length, heldEvidence: held.length, targetKindCounts, reviewStatusCounts, manifestHash, packageDirectory }, null, 2));
