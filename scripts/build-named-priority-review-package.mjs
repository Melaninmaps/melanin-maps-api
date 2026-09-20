#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const RESEARCH_ROOT = "/home/ubuntu/directory-research-wave-2026-09-20/named-priority-listings";
const PACKAGE_ROOT = "data/founder-imports/2026-09-20-named-priority-listings-review";
const RAW_ROOT = join(PACKAGE_ROOT, "raw");
const REVIEW_ROOT = join(PACKAGE_ROOT, "review-package");
const SOURCE_REPORT_ROOT = join(PACKAGE_ROOT, "source-reports");
const UP_AND_ADAM_RAW = "data/founder-imports/2026-09-19-up-and-adam-nola-review/raw/up-and-adam-eatz-source-backed.jsonl";
const ALLOWED_KINDS = new Set(["business", "online_business", "community_resource", "cultural_place", "regulated_review"]);

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalize = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const asNullableText = (value) => typeof value === "string" && value.trim() ? value.trim() : null;
const asHttps = (value) => {
  const text = asNullableText(value);
  if (!text) return null;
  try {
    const parsed = new URL(text);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.toString() : null;
  } catch {
    return null;
  }
};

function lineJson(value) {
  return `${JSON.stringify(value)}\n`;
}

function namedCandidate(raw, sourceRow, sourceId) {
  const targetKind = asNullableText(raw.targetKind);
  const name = asNullableText(raw.name);
  const city = asNullableText(raw.city);
  const country = asNullableText(raw.country) ?? "United States";
  const address = asNullableText(raw.address);
  const website = asHttps(raw.website);
  const socialSourceUrl = asHttps(raw.socialSourceUrl) ?? website;
  if (!ALLOWED_KINDS.has(targetKind)) throw new Error(`${sourceId}: unsupported target kind`);
  if (!name || !city || !country) throw new Error(`${sourceId}: missing identity`);
  if (targetKind === "business" && (!address || !/\d/.test(address) || (!website && !socialSourceUrl))) {
    throw new Error(`${sourceId}: physical candidate lacks a numbered address or official destination`);
  }
  if (targetKind === "online_business" && address) throw new Error(`${sourceId}: online-only candidate has an address`);
  const services = Array.isArray(raw.servicesSearchTerms)
    ? raw.servicesSearchTerms.map(asNullableText).filter(Boolean).join("; ")
    : asNullableText(raw.servicesSearchTerms);
  const notes = {
    review_only: true,
    source_item_id: sourceId,
    original_notes: asNullableText(raw.notes),
    publication_constraints: "Exact production reconciliation is required before any create/link decision. Controlled geocoding may run only for a physical business with a numbered address. Ownership evidence is source attribution only and never MWM verification.",
  };
  return {
    source_row_id: `named-priority-2026-09-20-${String(sourceRow).padStart(3, "0")}`,
    sourceRow,
    targetKind,
    dedupeKey: targetKind === "online_business"
      ? `online|${normalize(name)}|${new URL(website ?? socialSourceUrl).hostname.toLowerCase()}`
      : `physical|${normalize(name)}|${normalize(city)}|${normalize(raw.state)}|${normalize(country)}|${normalize(address)}`,
    name,
    city,
    state: asNullableText(raw.state),
    country,
    category: asNullableText(raw.category) ?? "Other",
    subcategory: asNullableText(raw.subcategory),
    address,
    phone: asNullableText(raw.phone),
    website,
    sourceUrl: asHttps(raw.sourceUrl) ?? website ?? socialSourceUrl,
    sourceName: asNullableText(raw.sourceName) ?? "Public source review",
    sourceStatus: "pending_review",
    ownershipDesignations: Array.isArray(raw.ownershipDesignations) ? raw.ownershipDesignations.filter((value) => typeof value === "string" && value.trim()) : [],
    ownershipEvidence: asNullableText(raw.ownershipEvidence),
    regulatedProfession: raw.regulatedProfession === true,
    instagramUrl: asHttps(raw.instagramUrl),
    facebookUrl: asHttps(raw.facebookUrl),
    tiktokUrl: asHttps(raw.tiktokUrl),
    socialSourceUrl,
    servicesSearchTerms: services,
    notes: JSON.stringify(notes),
  };
}

function upAndAdamCandidate(raw, sourceRow) {
  const result = namedCandidate(raw, sourceRow, "up-and-adam-eatz-nola");
  return {
    ...result,
    source_row_id: `named-priority-2026-09-20-${String(sourceRow).padStart(3, "0")}`,
    sourceStatus: "pending_review",
    notes: JSON.stringify({
      review_only: true,
      source_item_id: "up-and-adam-eatz-nola",
      original_notes: raw.notes,
      publication_constraints: "Exact production reconciliation is required before any create/link decision. Controlled geocoding may run only for this confirmed physical address. Existing source attribution never becomes MWM ownership verification.",
    }),
  };
}

async function main() {
  await rm(PACKAGE_ROOT, { recursive: true, force: true });
  await Promise.all([mkdir(RAW_ROOT, { recursive: true }), mkdir(REVIEW_ROOT, { recursive: true }), mkdir(SOURCE_REPORT_ROOT, { recursive: true })]);

  const candidates = [];
  const held = [];
  const entries = (await readdir(RESEARCH_ROOT, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const id of entries) {
    const result = JSON.parse(await readFile(join(RESEARCH_ROOT, id, "research-result.json"), "utf8"));
    if (typeof result.targetKind === "string") {
      candidates.push(namedCandidate(result, candidates.length + 1, id));
    } else {
      held.push({ source_item_id: id, ...result });
    }
  }

  const upAndAdam = JSON.parse((await readFile(UP_AND_ADAM_RAW, "utf8")).trim());
  candidates.push(upAndAdamCandidate(upAndAdam, candidates.length + 1));

  const duplicateKeys = new Map();
  for (const candidate of candidates) {
    const first = duplicateKeys.get(candidate.dedupeKey);
    if (first) throw new Error(`Internal duplicate candidate key: ${candidate.name} and ${first.name}`);
    duplicateKeys.set(candidate.dedupeKey, candidate);
  }

  const candidateJsonl = candidates.map(lineJson).join("");
  const heldJsonl = held.map(lineJson).join("");
  await writeFile(join(RAW_ROOT, "named-priority-listings-candidates.jsonl"), candidateJsonl);
  await writeFile(join(RAW_ROOT, "named-priority-listings-held.jsonl"), heldJsonl);
  await writeFile(join(REVIEW_ROOT, "named-priority-listings-review-only-candidates.jsonl"), candidateJsonl);
  await writeFile(join(REVIEW_ROOT, "named-priority-listings-held.jsonl"), heldJsonl);

  const typeCounts = Object.fromEntries([...ALLOWED_KINDS].map((kind) => [kind, candidates.filter((candidate) => candidate.targetKind === kind).length]).filter(([, count]) => count));
  const report = [
    "# Named Priority Listings: Source Report",
    "",
    "**Scope:** user-supplied, named businesses and places researched on 2026-09-20, plus Up & Adam Eatz in New Orleans. This package is protected review data only; it does not create a production record, map pin, or ownership verification.",
    "",
    "## Results",
    "",
    `The review-only candidate set contains **${candidates.length} address-confirmed records**. The held set contains **${held.length} names** where an exact local match could not be established without guessing. Each candidate has a numbered physical address and a customer-facing official website or official social/booking destination. The live worker must still reconcile canonical records, controlled-geocode physical listings, and hold any mismatch or duplicate.`,
    "",
    "| Target kind | Candidates |",
    "|---|---:|",
    ...Object.entries(typeCounts).map(([kind, count]) => `| ${kind} | ${count} |`),
    "",
    "## Candidate evidence",
    "",
    "| Name | City | Address | Customer destination |",
    "|---|---|---|---|",
    ...candidates.map((candidate) => `| ${candidate.name.replace(/\|/g, "\\|")} | ${candidate.city} | ${candidate.address ?? "Mapless"} | ${candidate.website ?? candidate.socialSourceUrl ?? "None"} |`),
    "",
    "## Holds and non-matches",
    "",
    ...held.map((record) => `- **${record.source_item_id}:** ${record.reason ?? record.summary ?? "Exact match was not confirmed."}`),
    "",
    "## Safeguards",
    "",
    "No coordinates are included. A directory worker must never invent coordinates or substitute a near match. An ownership statement is only source-attributed evidence unless a verified owner claim establishes it. Cultural places are routed separately from commercial business publication. No user, account, authentication, session, waitlist, Community, review, or existing business record is modified by this package.",
    "",
  ].join("\n");
  await writeFile(join(SOURCE_REPORT_ROOT, "NAMED_PRIORITY_LISTINGS_SOURCE_REPORT.md"), report);

  const metadata = {
    package: "2026-09-20-named-priority-listings-source-backed-review",
    publication_status: "NOT PUBLISHED — review-only package",
    accepted_review_only_candidates: candidates.length,
    held_candidates: held.length,
    accepted_by_target_kind: typeCounts,
    manifest_sha256: sha256(candidateJsonl),
    source_manifest_sha256: sha256(candidateJsonl),
    safeguards: [
      "This package has no production database connection and cannot publish a listing or map pin.",
      "Every candidate must undergo protected current-live reconciliation before a create or link decision.",
      "Controlled geocoding may run only for address-confirmed physical business candidates; online-only records remain mapless.",
      "Held and non-match records must not be substituted with similarly named businesses.",
      "No ownership attribution in the package is MWM verification.",
    ],
  };
  await writeFile(join(REVIEW_ROOT, "named-priority-listings-review-summary.json"), `${JSON.stringify(metadata, null, 2)}\n`);
  console.log(JSON.stringify({ candidates: candidates.length, held: held.length, manifest_sha256: metadata.manifest_sha256 }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
