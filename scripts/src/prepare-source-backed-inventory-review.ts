import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

/**
 * Consolidates source-backed domestic and international research rows into the
 * review-only manifest consumed by stage-global-review-manifest.ts.
 *
 * This script is intentionally a local-file transform. It does not connect to a
 * database, geocode, make HTTP requests, publish a business/resource, or write
 * any user, authentication, session, access, or waitlist record.
 *
 * A row may enter the review manifest only when it has an explicit street
 * address, attributable source URL, and an official public social destination.
 * Ownership designations are normalized only when their source text expressly
 * identifies ownership. Every retained designation is marked for reviewer
 * evidence confirmation by the staging adapter before public use.
 */

const root = resolve(import.meta.dirname, "../..");
function options(name: string): string[] {
  const values: string[] = [];
  for (let index = 0; index < process.argv.length; index += 1) {
    if (process.argv[index] === name && process.argv[index + 1]) values.push(process.argv[index + 1]!);
  }
  return values;
}

function option(name: string): string | null {
  return options(name)[0] ?? null;
}

const domesticManifest = resolve(
  root,
  "data/founder-imports/2026-09-17-10k-expansion/source-backed-domestic-candidates.jsonl",
);
const internationalManifest = resolve(
  root,
  "data/founder-imports/2026-09-17-international-2500-expansion/source-backed-international-candidates.jsonl",
);
const inputManifests = options("--input").map((path) => resolve(path));
const manifests = inputManifests.length > 0 ? inputManifests : [domesticManifest, internationalManifest];
const outputDirectory = resolve(
  option("--output-dir") ?? "data/founder-imports/2026-09-17-source-backed-inventory-review",
);

const SOCIAL_HOSTS = new Set([
  "instagram.com",
  "facebook.com",
  "tiktok.com",
  "youtube.com",
  "linkedin.com",
  "x.com",
  "twitter.com",
]);

const RESOURCE_PATTERN = /\b(nonprofit|non-profit|foundation|food bank|food pantry|public library|legal aid|government|city department|county department|resource center|referral service|social service|community center)\b/i;
const CULTURAL_PATTERN = /\b(museum|monument|historic site|heritage center|cultural center|memorial|archives|visitor center)\b/i;
const REGULATED_PATTERN = /\b(doctor|medical|health|clinic|hospital|dental|dentist|child.?care|daycare|school|legal|law|attorney|financial|accounting|tax|hvac|contractor|real estate|home care|pharmacy|therapy|behavioral)\b/i;

const CANONICAL_DESIGNATIONS = [
  "Black / African American-Owned",
  "Foundational Black American-Owned",
  "African-Owned",
  "Afro-Caribbean-Owned",
  "Caribbean / West Indian-Owned",
  "Afro-Latino-Owned",
  "Latino / Hispanic-Owned",
  "Woman-Owned",
  "Veteran-Owned",
  "Disability-Owned",
  "LGBTQIA+-Owned",
  "Divine Nine-Affiliated",
  "Indigenous / Native-Owned",
  "Family-Owned",
  "Minority-Owned (general / legacy)",
] as const;

type CanonicalDesignation = (typeof CANONICAL_DESIGNATIONS)[number];
type RawRecord = Record<string, unknown>;

type ReviewCandidate = {
  sourceRow: number;
  targetKind: "business" | "community_resource" | "cultural_place" | "regulated_review" | "manual_review";
  dedupeKey: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  category: string;
  subcategory: string | null;
  address: string;
  phone: string | null;
  website: string | null;
  sourceUrl: string;
  sourceName: string;
  sourceStatus: string | null;
  ownershipDesignations: CanonicalDesignation[];
  ownershipEvidence: string | null;
  regulatedProfession: boolean;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  socialSourceUrl: string;
  notes: string;
  servicesSearchTerms: string | null;
};

type HeldCandidate = {
  input: string;
  sourceRow: number;
  name: string | null;
  reason: string[];
  rawRecord: RawRecord;
};

function value(record: RawRecord, key: string): string {
  const raw = record[key];
  return typeof raw === "string" ? raw.trim() : "";
}

function optional(valueToNormalize: string): string | null {
  return valueToNormalize.trim() || null;
}

function asHttpUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || !url.hostname) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function isSocialUrl(raw: string): boolean {
  const url = asHttpUrl(raw);
  if (!url) return false;
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  return SOCIAL_HOSTS.has(host) || [...SOCIAL_HOSTS].some((domain) => host.endsWith(`.${domain}`));
}

function normalizedText(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizedCountry(raw: string, state: string): string {
  const country = raw.trim();
  if (/^(us|usa|u\.s\.a\.?|united states(?: of america)?)$/i.test(country)) return "United States";
  if (country) return country;
  if (/^(on|ontario|qc|quebec|bc|british columbia|ab|alberta|mb|manitoba|ns|nova scotia)$/i.test(state)) return "Canada";
  return "United States";
}

function primarySocial(record: RawRecord): string | null {
  const candidates = [
    value(record, "instagram_url"),
    value(record, "facebook_url"),
    value(record, "tiktok_url"),
    value(record, "official_social_url"),
    value(record, "website"),
    value(record, "official_website"),
  ];
  return candidates.find(isSocialUrl) ?? null;
}

function firstWebsite(record: RawRecord): string | null {
  for (const raw of [value(record, "website"), value(record, "official_website")]) {
    const url = asHttpUrl(raw);
    if (url && !isSocialUrl(url)) return url;
  }
  return null;
}

function targetKind(record: RawRecord): ReviewCandidate["targetKind"] {
  const explicitlySupplied = value(record, "target_kind");
  if (["business", "community_resource", "cultural_place", "regulated_review", "manual_review"].includes(explicitlySupplied)) {
    return explicitlySupplied as ReviewCandidate["targetKind"];
  }
  const text = ["name", "category", "subcategory", "description", "services_search_terms", "notes"]
    .map((key) => value(record, key))
    .join(" ");
  if (CULTURAL_PATTERN.test(text)) return "cultural_place";
  if (RESOURCE_PATTERN.test(text)) return "community_resource";
  if (value(record, "regulated_profession").toLowerCase() === "true" || REGULATED_PATTERN.test(text)) return "regulated_review";
  return "business";
}

function explicitDesignationList(raw: string): CanonicalDesignation[] {
  const text = raw.normalize("NFKC").toLowerCase();
  const found: CanonicalDesignation[] = [];
  const add = (designation: CanonicalDesignation) => {
    if (!found.includes(designation)) found.push(designation);
  };

  // The "owned" / "affiliated" language matters: never convert a cuisine,
  // neighborhood, person, or "serving" statement into an ownership claim.
  if (/\bfoundational(?:ly)?\s+black(?:\s+american)?[-\s]*(?:owned|led)\b|\bfba[-\s]*(?:owned|led)\b/.test(text)) add("Foundational Black American-Owned");
  else if (/\b(?:black|african[-\s]?american)[-\s]*(?:owned|owner)\b/.test(text)) add("Black / African American-Owned");
  if (/\bafro[-\s]?caribbean[-\s]*owned\b/.test(text)) add("Afro-Caribbean-Owned");
  else if (/\b(?:caribbean|west indian)[-\s]*owned\b/.test(text)) add("Caribbean / West Indian-Owned");
  if (/\bafro[-\s]?(?:latino|latina)[-\s]*owned\b/.test(text)) add("Afro-Latino-Owned");
  else if (/\b(?:latino|latina|latinx|hispanic|latin)[-\s]*owned\b/.test(text)) add("Latino / Hispanic-Owned");
  if (/\bafrican[-\s]*owned\b/.test(text) && !found.includes("Black / African American-Owned")) add("African-Owned");
  if (/\b(?:woman|women)[-\s]*owned\b/.test(text)) add("Woman-Owned");
  if (/\bveteran[-\s]*(?:owned|led)\b/.test(text)) add("Veteran-Owned");
  if (/\bdisability[-\s]*(?:owned|led)\b/.test(text)) add("Disability-Owned");
  if (/\blgbtq(?:ia)?[-\s]*(?:owned|led)\b/.test(text)) add("LGBTQIA+-Owned");
  if (/\b(?:divine\s*nine|d9)[-\s]*(?:affiliated|owned|led)\b/.test(text)) add("Divine Nine-Affiliated");
  if (/\b(?:indigenous|native)[-\s]*owned\b/.test(text)) add("Indigenous / Native-Owned");
  if (/\bfamily[-\s]*(?:owned|business)\b/.test(text)) add("Family-Owned");
  if (/\bminority[-\s]*owned\b/.test(text)) add("Minority-Owned (general / legacy)");
  return found;
}

function parseRecord(raw: RawRecord, input: string, sourceRow: number): { candidate?: ReviewCandidate; held?: HeldCandidate } {
  const name = value(raw, "name");
  const address = value(raw, "address");
  const city = value(raw, "city");
  const state = value(raw, "state") || value(raw, "state_or_region");
  const country = normalizedCountry(value(raw, "country"), state);
  const sourceUrl = asHttpUrl(value(raw, "source_url"));
  const socialSourceUrl = primarySocial(raw);
  const website = firstWebsite(raw);
  const category = value(raw, "category") || "Other services";
  const subcategory = optional(value(raw, "subcategory"));
  const designationText = value(raw, "ownership_designations");
  const ownershipDesignations = explicitDesignationList(designationText);
  const ownershipEvidence = ownershipDesignations.length > 0
    ? asHttpUrl(value(raw, "ownership_evidence_url")) ?? sourceUrl
    : null;

  const reason: string[] = [];
  if (!name) reason.push("missing_name");
  if (address.length < 10 || !/\d/.test(address)) reason.push("missing_public_street_address");
  if (!city) reason.push("missing_city");
  if (!sourceUrl) reason.push("missing_or_invalid_source_url");
  if (!socialSourceUrl) reason.push("missing_official_social_destination");
  if (!website && !socialSourceUrl) reason.push("missing_attributable_official_destination");
  if (reason.length > 0) return { held: { input, sourceRow, name: name || null, reason, rawRecord: raw } };

  const instagramUrl = asHttpUrl(value(raw, "instagram_url"));
  const facebookUrl = asHttpUrl(value(raw, "facebook_url"));
  const tiktokUrl = asHttpUrl(value(raw, "tiktok_url"));
  const target = targetKind(raw);
  const searchTerms = optional(value(raw, "services_search_terms"));
  const sourceFile = value(raw, "source_file") || input;
  const notes = JSON.stringify({
    review_only: true,
    input,
    source_file: sourceFile,
    source_row: value(raw, "source_row") || sourceRow,
    original_designation_text: designationText || null,
    ownership_evidence_requires_reviewer_confirmation: ownershipDesignations.length > 0,
    description: optional(value(raw, "description")),
    public_hours: optional(value(raw, "hours")),
    languages: optional(value(raw, "languages")),
    price_range: optional(value(raw, "price_range")),
    address_enrichment_note: optional(value(raw, "address_enrichment_note")),
    original_source_url: sourceUrl,
  });

  return {
    candidate: {
      sourceRow,
      targetKind: target,
      dedupeKey: [name, address, city, state, country].map(normalizedText).join("|"),
      name,
      city,
      state: optional(state),
      country,
      category,
      subcategory,
      address,
      phone: optional(value(raw, "phone")),
      website,
      sourceUrl: sourceUrl!,
      sourceName: value(raw, "source_name") || "Source-backed public business listing",
      sourceStatus: null,
      ownershipDesignations,
      ownershipEvidence,
      regulatedProfession: target === "regulated_review" || value(raw, "regulated_profession").toLowerCase() === "true",
      instagramUrl,
      facebookUrl,
      tiktokUrl,
      socialSourceUrl: socialSourceUrl!,
      notes,
      servicesSearchTerms: searchTerms,
    },
  };
}

async function readJsonl(path: string): Promise<RawRecord[]> {
  return (await readFile(path, "utf8"))
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        const parsed = JSON.parse(line) as unknown;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("row is not an object");
        return parsed as RawRecord;
      } catch (error) {
        throw new Error(`${basename(path)} line ${index + 1} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
}

function sha256(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

async function main(): Promise<void> {
  const manifestRows = await Promise.all(manifests.map(async (path) => ({
    path,
    rows: await readJsonl(path),
  })));
  const accepted: ReviewCandidate[] = [];
  const held: HeldCandidate[] = [];
  const seen = new Set<string>();
  let sourceRow = 0;

  for (const { path, rows } of manifestRows) {
    const input = basename(path);
    for (const raw of rows) {
      sourceRow += 1;
      const result = parseRecord(raw, input, sourceRow);
      if (result.held) {
        held.push(result.held);
        continue;
      }
      const candidate = result.candidate!;
      if (seen.has(candidate.dedupeKey)) {
        held.push({ input, sourceRow, name: candidate.name, reason: ["duplicate_within_consolidated_batch"], rawRecord: raw });
        continue;
      }
      seen.add(candidate.dedupeKey);
      accepted.push(candidate);
    }
  }

  const manifestContent = accepted.map((candidate) => JSON.stringify(candidate)).join("\n") + (accepted.length ? "\n" : "");
  const heldContent = held.map((candidate) => JSON.stringify(candidate)).join("\n") + (held.length ? "\n" : "");
  const targetCounts = accepted.reduce<Record<string, number>>((counts, candidate) => {
    counts[candidate.targetKind] = (counts[candidate.targetKind] ?? 0) + 1;
    return counts;
  }, {});
  const designationCounts = accepted.reduce<Record<string, number>>((counts, candidate) => {
    for (const designation of candidate.ownershipDesignations) counts[designation] = (counts[designation] ?? 0) + 1;
    return counts;
  }, {});
  const sourceCounts = accepted.reduce<Record<string, number>>((counts, candidate) => {
    const input = JSON.parse(candidate.notes).input as string;
    counts[input] = (counts[input] ?? 0) + 1;
    return counts;
  }, {});
  const summary = {
    input_rows_by_manifest: Object.fromEntries(manifestRows.map(({ path, rows }) => [path, rows.length])),
    input_rows: manifestRows.reduce((total, { rows }) => total + rows.length, 0),
    accepted_review_only_candidates: accepted.length,
    held_candidates: held.length,
    duplicate_rows_held: held.filter((row) => row.reason.includes("duplicate_within_consolidated_batch")).length,
    accepted_by_input: sourceCounts,
    accepted_by_target_kind: targetCounts,
    review_only_designation_counts: designationCounts,
    eligibility: "Requires a public street address, attributable source URL, and attributable official public social destination. Ownership designations are included only when the research row expressly stated ownership and remain reviewer-confirmation gates. Exact coordinate geocoding is still required before a commercial Map pin.",
    publication_status: "NOT PUBLISHED. This manifest is review-only. Staging is local-only; production publication requires live duplicate reconciliation, link-health review, reviewer-confirmed geocoding, regulated credential review where applicable, and an authorized founder/admin decision.",
    manifest: resolve(outputDirectory, "source-backed-inventory-review-only-candidates.jsonl"),
    manifest_sha256: sha256(manifestContent),
    hold_file: resolve(outputDirectory, "source-backed-inventory-held-candidates.jsonl"),
    source_manifests: manifests,
  };

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(resolve(outputDirectory, "source-backed-inventory-review-only-candidates.jsonl"), manifestContent),
    writeFile(resolve(outputDirectory, "source-backed-inventory-held-candidates.jsonl"), heldContent),
    writeFile(resolve(outputDirectory, "source-backed-inventory-review-summary.json"), `${JSON.stringify(summary, null, 2)}\n`),
  ]);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
