import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const inputFile = resolve(
  process.argv[2]
    ?? "/home/ubuntu/directory-research-wave-2026-09-18/new-orleans/candidates.jsonl",
);
const outputFile = resolve(
  process.argv[3]
    ?? "data/founder-imports/2026-09-18-third-three-city-review/source-passes/new-orleans-candidates.jsonl",
);

const listingTypeToTargetKind = new Map([
  ["physical_commercial", "business"],
  ["online_only", "online_business"],
  ["regulated_review", "regulated_review"],
  ["cultural_place", "cultural_place"],
  ["community_resource", "community_resource"],
  ["manual_review", "manual_review"],
]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function httpUrl(value) {
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
}

function hasStreetAddress(value) {
  const address = text(value);
  return address.length >= 10
    && /\d/.test(address)
    && !/\b(?:p\.?\s*o\.?\s*box|post office box|service area|serving\s+[^,]+)\b/i.test(address);
}

const rejected = [];
const normalized = [];
const lines = (await readFile(inputFile, "utf8")).split(/\r?\n/);
for (const [index, line] of lines.entries()) {
  if (!line.trim()) continue;
  let source;
  try {
    source = JSON.parse(line);
  } catch {
    rejected.push({ line: index + 1, reason: "invalid_json" });
    continue;
  }

  const targetKind = listingTypeToTargetKind.get(text(source.listing_type));
  const name = text(source.name);
  const city = text(source.city);
  const state = text(source.state);
  const category = text(source.category);
  const address = source.address == null ? null : text(source.address);
  const destination = httpUrl(source.customer_destination);
  const sourceUrl = httpUrl(source.source_url);
  const sourceName = text(source.source_name);
  const isOnlineOnly = targetKind === "online_business";
  const reasons = [];
  if (!targetKind) reasons.push("unsupported_listing_type");
  if (!name) reasons.push("missing_name");
  if (!city && !isOnlineOnly) reasons.push("missing_city");
  if (!state && !isOnlineOnly) reasons.push("missing_state");
  if (!category) reasons.push("missing_category");
  if (!sourceUrl) reasons.push("missing_or_invalid_source_url");
  if (!destination) reasons.push("missing_or_invalid_customer_destination");
  if (isOnlineOnly ? address !== null : !hasStreetAddress(address)) {
    reasons.push(isOnlineOnly ? "online_only_with_address" : "missing_numbered_street_address");
  }
  if (reasons.length) {
    rejected.push({ line: index + 1, name: source.name ?? null, reasons, rawRecord: source });
    continue;
  }

  normalized.push({
    sourceRow: `new-orleans-${String(index + 1).padStart(3, "0")}`,
    targetKind,
    name,
    city: city || null,
    state: state || null,
    country: "United States",
    category,
    subcategory: null,
    address: isOnlineOnly ? null : address,
    phone: null,
    website: destination,
    sourceUrl,
    sourceName: sourceName || "New Orleans source-backed public listing",
    sourceStatus: "source_backed_research_candidate",
    // The input records do not provide a separate, structured ownership field.
    // Do not infer one from a chamber source or from narrative research notes.
    ownershipDesignations: [],
    ownershipEvidence: null,
    regulatedProfession: targetKind === "regulated_review",
    instagramUrl: null,
    facebookUrl: null,
    tiktokUrl: null,
    socialSourceUrl: destination,
    servicesSearchTerms: [category],
    notes: JSON.stringify({
      original_review_status: text(source.review_status) || null,
      research_notes: text(source.research_notes) || null,
      source_record_schema: "new_orleans_research_v1",
    }),
  });
}

if (rejected.length) {
  throw new Error(`New Orleans normalization rejected ${rejected.length} retained input rows: ${JSON.stringify(rejected)}`);
}

const content = normalized.map((record) => JSON.stringify(record)).join("\n") + (normalized.length ? "\n" : "");
await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, content);
console.log(JSON.stringify({ inputFile, outputFile, normalized: normalized.length, rejected: rejected.length }, null, 2));
