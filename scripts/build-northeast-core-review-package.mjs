import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "data/founder-imports/2026-09-18-northeast-core-review");
const consolidatedDirectory = resolve(root, "consolidated");
const inputManifest = resolve(consolidatedDirectory, "northeast-core-consolidated-candidates.jsonl");
const inputHealth = resolve(consolidatedDirectory, "northeast-core-combined-destination-health.json");
const outputDirectory = resolve(root, "review-package");

const allowedKinds = new Set(["business", "online_business", "regulated_review", "community_resource", "cultural_place", "manual_review"]);
const invalidDestinationHosts = new Set(["none", "google.com", "www.google.com", "facebook.com", "www.facebook.com", "instagram.com", "www.instagram.com"]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function searchTerms(value) {
  if (Array.isArray(value)) {
    return value.map(text).filter(Boolean).join("; ") || null;
  }
  return text(value) || null;
}

function normalized(value) {
  return text(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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
  return text(value) || null;
}

function canonicalCountry(value) {
  const key = normalized(value);
  if (key === "us" || key === "usa" || key === "united states" || key === "united states of america") {
    return "United States";
  }
  return text(value) || null;
}

function httpUrl(value) {
  const raw = text(value);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol) || !url.hostname || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "none" || host === "google.com") return null;
    if (url.hostname.includes(",") || /^(?:none|undefined|null)$/i.test(url.hostname)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function officialDestination(value) {
  const url = httpUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  if (invalidDestinationHosts.has(host) && (!path || path === "/" || path === "/login" || path === "/accounts/login/")) return null;
  return url;
}

const SHARED_DIRECTORY_DESTINATIONS = new Set([
  "https://x.com/shccnj",
  "https://twitter.com/shccnj",
  "https://business.shccnj.org/list",
  "https://membership.aachamber.com/list",
  "https://www.philahispanicchamber.org",
  "https://www.hchamber.org",
]);

const DIRECTORY_PROFILE_HOSTS = new Set([
  "business.shccnj.org",
  "membership.aachamber.com",
  "members.dcchamber.org",
]);

function comparableUrl(value) {
  const url = httpUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "").toLowerCase();
}

function customerDestination(value, source) {
  const url = officialDestination(value);
  if (!url) return null;
  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const comparable = comparableUrl(url);
  const sourceComparable = comparableUrl(source.sourceUrl);
  const sourceLooksLikeDirectory = /\b(?:directory|chamber|member|guide|listing)\b/i.test(text(source.sourceName));
  const sourceIsFirstParty = /(?:^|[_\s-])(?:first[_\s-]?party|official)(?:[_\s-]|$)/i.test(text(source.sourceStatus));
  const isLinkedInPersonalProfile = host === "linkedin.com" && /^\/in\//i.test(parsed.pathname);
  const isGoogleMapsDestination = host === "maps.app.goo.gl"
    || (host.endsWith("google.com") && /^\/maps(?:\/|$)/i.test(parsed.pathname));

  if (comparable && SHARED_DIRECTORY_DESTINATIONS.has(comparable)) return null;
  if (DIRECTORY_PROFILE_HOSTS.has(host)) return null;
  if (isLinkedInPersonalProfile) return null;
  if (isGoogleMapsDestination) return null;
  if (sourceLooksLikeDirectory && !sourceIsFirstParty && comparable && sourceComparable === comparable) return null;
  return url;
}

function hasStreetAddress(value) {
  const address = text(value);
  return address.length >= 10
    && /\d/.test(address)
    && !/\b(?:p\.?\s*o\.?\s*box|post office box|service area|serving\s+[^,]+)\b/i.test(address);
}

function hasSpecificBusinessName(value) {
  const name = normalized(value);
  return !new Set([
    "business",
    "construction",
    "consulting",
    "event planner",
    "other",
    "service",
  ]).has(name);
}

function parseNotes(value) {
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : { original_notes: value };
  } catch {
    return { original_notes: value };
  }
}

function dedupeKey(record) {
  if (record.targetKind === "online_business") {
    return `${normalized(record.name)}|online:${normalized(record.socialSourceUrl || record.website)}`;
  }
  return `${normalized(record.name)}|${normalized(record.city)}|${normalized(record.state)}|addr:${normalized(record.address)}`;
}

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function recordHealth(url, sourceHealth) {
  const result = sourceHealth.get(url);
  return result ?? { url, status: null, finalUrl: null, outcome: "not_checked" };
}

function readiness(outcomes) {
  if (outcomes.every((outcome) => outcome === "reachable")) return "pending_review";
  return "needs_research";
}

const sourceRecords = (await readFile(inputManifest, "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));
let sourceHealthPayload = { results: [] };
try {
  sourceHealthPayload = JSON.parse(await readFile(inputHealth, "utf8"));
} catch {
  // The initial deterministic pass builds the review manifest first. The
  // bounded destination checker then writes this file before the final pass.
}

const accepted = [];
const held = [];
const seen = new Set();
for (const source of sourceRecords) {
  const kind = text(source.targetKind);
  const sourceUrl = httpUrl(source.sourceUrl);
  const website = customerDestination(source.website, source);
  const socialCandidates = [source.socialSourceUrl, source.instagramUrl, source.facebookUrl, source.tiktokUrl, source.website]
    .map((value) => customerDestination(value, source))
    .filter(Boolean);
  const socialSourceUrl = socialCandidates[0] ?? null;
  const isOnlineOnly = kind === "online_business";
  const isMaplessResource = kind === "community_resource" && !hasStreetAddress(source.address);
  const reasons = [];
  if (!allowedKinds.has(kind)) reasons.push("unsupported_target_kind");
  if (!text(source.name)) reasons.push("missing_name");
  if (!hasSpecificBusinessName(source.name)) reasons.push("generic_or_placeholder_business_name");
  // An online-only business may have no supported physical locality. A
  // location-linked community resource may likewise be addressless without
  // receiving an invented map location. Both remain mapless.
  if (!isOnlineOnly && !text(source.city)) reasons.push("missing_city");
  if (!text(source.country)) reasons.push("missing_country");
  if (!text(source.category)) reasons.push("missing_category");
  if (!sourceUrl) reasons.push("missing_or_invalid_source_url");
  if (isOnlineOnly && source.address != null) reasons.push("online_listing_has_physical_address");
  if (!isOnlineOnly && !isMaplessResource && !hasStreetAddress(source.address)) reasons.push("missing_or_nonphysical_street_address");
  if (!socialSourceUrl) reasons.push("missing_or_invalid_customer_destination");
  if (reasons.length > 0) {
    held.push({ sourceRow: source.sourceRow, name: source.name ?? null, reasons, rawRecord: source });
    continue;
  }

  const record = {
    sourceRow: accepted.length + 1,
    targetKind: kind,
    dedupeKey: "",
    name: text(source.name),
    city: text(source.city) || null,
    state: canonicalState(source.state),
    country: canonicalCountry(source.country),
    category: text(source.category),
    subcategory: text(source.subcategory) || null,
    address: isOnlineOnly || isMaplessResource ? null : text(source.address),
    phone: text(source.phone) || null,
    website,
    sourceUrl,
    sourceName: text(source.sourceName) || "Source-backed public directory listing",
    sourceStatus: text(source.sourceStatus) || null,
    ownershipDesignations: Array.isArray(source.ownershipDesignations) ? source.ownershipDesignations : [],
    ownershipEvidence: httpUrl(source.ownershipEvidence),
    regulatedProfession: source.regulatedProfession === true || kind === "regulated_review",
    instagramUrl: customerDestination(source.instagramUrl, source),
    facebookUrl: customerDestination(source.facebookUrl, source),
    tiktokUrl: customerDestination(source.tiktokUrl, source),
    socialSourceUrl,
    servicesSearchTerms: searchTerms(source.servicesSearchTerms),
    notes: "",
  };
  record.dedupeKey = dedupeKey(record);
  if (seen.has(record.dedupeKey)) {
    held.push({ sourceRow: source.sourceRow, name: source.name ?? null, reasons: ["duplicate_after_staging_normalization"], rawRecord: source });
    continue;
  }
  seen.add(record.dedupeKey);
  const sourceNotes = parseNotes(source.notes);
  record.notes = JSON.stringify({
    ...sourceNotes,
    review_only: true,
    northeast_core_review_package: {
      source_consolidated_row: source.sourceRow,
      original_target_kind: source.targetKind,
      original_ownership_evidence: source.ownershipEvidence ?? null,
      original_customer_links: {
        website: source.website ?? null,
        social_source_url: source.socialSourceUrl ?? null,
        instagram: source.instagramUrl ?? null,
        facebook: source.facebookUrl ?? null,
        tiktok: source.tiktokUrl ?? null,
      },
      customer_destination_selected_for_review: socialSourceUrl,
      source_consolidation_checksum: sourceHealthPayload.sourceManifest ? null : null,
    },
  });
  accepted.push(record);
}

const manifestContent = accepted.map((record) => JSON.stringify(record)).join("\n") + (accepted.length ? "\n" : "");
const manifestHash = sha256(manifestContent);
const sourceHealth = new Map((sourceHealthPayload.results ?? []).map((item) => [httpUrl(item.url) ?? item.url, item]));
const uniqueDestinations = [...new Set(accepted.flatMap((record) => [record.website, record.socialSourceUrl].filter(Boolean)))];
const healthResults = uniqueDestinations.map((url) => recordHealth(url, sourceHealth));
const byOutcome = healthResults.reduce((counts, item) => {
  counts[item.outcome] = (counts[item.outcome] ?? 0) + 1;
  return counts;
}, {});
const candidateStatuses = accepted.map((record) => {
  const outcomes = [record.website, record.socialSourceUrl]
    .filter(Boolean)
    .map((url) => recordHealth(url, sourceHealth).outcome);
  return { sourceRow: record.sourceRow, name: record.name, targetKind: record.targetKind, status: readiness(outcomes), outcomes };
});
const statusCounts = candidateStatuses.reduce((counts, item) => {
  counts[item.status] = (counts[item.status] ?? 0) + 1;
  return counts;
}, {});
const targetCounts = accepted.reduce((counts, item) => {
  counts[item.targetKind] = (counts[item.targetKind] ?? 0) + 1;
  return counts;
}, {});
const summary = {
  package: "2026-09-18-northeast-core-combined-source-backed-review",
  publication_status: "NOT PUBLISHED — review-only package",
  source_consolidated_candidates: sourceRecords.length,
  accepted_review_only_candidates: accepted.length,
  held_candidates: held.length,
  held_reason_counts: held.reduce((counts, item) => {
    for (const reason of item.reasons) counts[reason] = (counts[reason] ?? 0) + 1;
    return counts;
  }, {}),
  accepted_by_target_kind: targetCounts,
  preliminary_review_status_counts: statusCounts,
  manifest_sha256: manifestHash,
  source_manifest: inputManifest,
  source_manifest_sha256: sha256(await readFile(inputManifest)),
  destination_health: {
    candidates: accepted.length,
    unique_destinations: uniqueDestinations.length,
    by_outcome: byOutcome,
  },
  safeguards: [
    "This package has no production database connection and cannot publish a business, map pin, resource, or cultural listing.",
    "Records without a structurally valid customer-facing official destination remain in the held file.",
    "A timeout, network error, or non-success HTTP response remains a needs-research gate, not a closure determination.",
    "Community resources and cultural places remain outside the commercial-business map-pin path.",
    "Regulated-review records require licensing or authority review before any publication.",
    "Existing-record reconciliation remains required during authorized reviewer staging.",
    "No user, authentication, password, session, access, or waitlist record is included or modified.",
  ],
};
const healthPayload = {
  checkedAt: sourceHealthPayload.checkedAt,
  sourceManifest: "northeast-core-combined-review-only-candidates.jsonl",
  candidates: accepted.length,
  uniqueDestinations: uniqueDestinations.length,
  counts: byOutcome,
  results: healthResults,
  publication: "Review-only evidence. Any timeout, network failure, not-checked result, or review-required response must remain a review gate before publication.",
};

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, "northeast-core-combined-review-only-candidates.jsonl"), manifestContent),
  writeFile(resolve(outputDirectory, "northeast-core-combined-review-held-candidates.jsonl"), held.map((item) => JSON.stringify(item)).join("\n") + (held.length ? "\n" : "")),
  writeFile(resolve(outputDirectory, "northeast-core-combined-review-summary.json"), `${JSON.stringify(summary, null, 2)}\n`),
  writeFile(resolve(outputDirectory, "northeast-core-combined-destination-health.json"), `${JSON.stringify(healthPayload, null, 2)}\n`),
]);
console.log(JSON.stringify({ outputDirectory, reviewCandidates: accepted.length, heldCandidates: held.length, targetCounts, statusCounts, destinationCounts: byOutcome, manifestHash }, null, 2));
