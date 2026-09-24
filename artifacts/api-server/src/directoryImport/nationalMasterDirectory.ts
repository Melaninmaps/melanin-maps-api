import { createHash } from "node:crypto";
import nationalMasterPayload from "../data/national-diaspora-master-18294.json";

export const NATIONAL_MASTER_DIRECTORY_SOURCE =
  "national_diaspora_master_18294" as const;
export const NATIONAL_MASTER_DIRECTORY_POLICY =
  "national-master-directory-v1" as const;
export const NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256 =
  "ecc8aa355ef785a172b235d27afb5d003e92675760f96c5abd6e0788e4905bb4" as const;
export const NATIONAL_MASTER_DIRECTORY_EXPECTED_ROWS = 18_294 as const;

export type NationalMasterSourceRecord = Readonly<{
  source_row: number;
  name: string;
  city: string;
  state: string;
  category: string;
  subcategory: string;
  cultural_specialty: string;
  address: string;
  phone: string;
  website: string;
  source_url: string;
  source_name: string;
  source_status: string;
  ownership_or_identity_evidence: string;
  regulated_profession: string;
  public_display_recommendation: string;
  notes: string;
  audit_date: string;
  offline_production_name_match: string;
  replit_action: string;
  price_range: string;
  price_basis: string;
  price_last_checked: string;
  location_model: string;
  brand_or_franchise: string;
  mobile_route_notes: string;
  nearby_cultural_sites_tags: string;
}>;

type NationalMasterPayload = Readonly<{
  sourceFile: string;
  sourceSha256: string;
  rowCount: number;
  generatedAt: string;
  records: NationalMasterSourceRecord[];
}>;

const payload = nationalMasterPayload as NationalMasterPayload;

function nonBlank(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  return normalized || null;
}

function sourceDesignations(evidence: string): string[] {
  const normalized = evidence.toLowerCase();
  const tags = new Set<string>();
  // A designation is retained only when this explicit source-evidence field
  // says so. Names, categories, neighborhoods, and imagery are never used.
  if (/black[ -]?owned|african american[ -]?owned/.test(normalized)) tags.add("black-owned");
  if (/women?[ -]?owned|woman[ -]?owned/.test(normalized)) tags.add("women-owned");
  if (/latinx[ -]?owned|latino[ -]?owned|hispanic[ -]?owned/.test(normalized)) tags.add("latino-owned");
  if (/lgbtq(?:ia\+)?[ -]?owned|queer[ -]?owned/.test(normalized)) tags.add("lgbtq-owned");
  if (/veteran[ -]?owned/.test(normalized)) tags.add("veteran-owned");
  if (/disab(?:led|ility)[ -]?owned/.test(normalized)) tags.add("disability-owned");
  return [...tags];
}

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type NationalMasterDirectoryProfile = Readonly<{
  id: string;
  sourceRow: number;
  sourceRowId: string;
  receiptHash: string;
  name: string;
  category: string;
  subcategory: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  phone: string | null;
  website: string | null;
  sourceUrl: string | null;
  sourceLabel: string;
  recommendationReason: string | null;
  ownershipDesignations: string[];
  blackOwned: boolean;
  ownershipClaim: string | null;
  tags: string[];
}>;

export function assertNationalMasterDirectoryDataset(): readonly NationalMasterSourceRecord[] {
  if (
    payload.sourceSha256 !== NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256 ||
    payload.rowCount !== NATIONAL_MASTER_DIRECTORY_EXPECTED_ROWS ||
    payload.records.length !== NATIONAL_MASTER_DIRECTORY_EXPECTED_ROWS
  ) {
    throw new Error("National master dataset checksum or count is inconsistent.");
  }
  return payload.records;
}

export function buildNationalMasterDirectoryProfile(
  record: NationalMasterSourceRecord,
): NationalMasterDirectoryProfile {
  const sourceRowId = `national-master-18294:${record.source_row}`;
  const receiptHash = stableHash(
    `${NATIONAL_MASTER_DIRECTORY_EXPECTED_SHA256}|${sourceRowId}|${record.name}|${record.city}|${record.state}`,
  );
  const ownershipDesignations = sourceDesignations(record.ownership_or_identity_evidence);
  const descriptionParts = [
    nonBlank(record.cultural_specialty),
    nonBlank(record.notes),
  ].filter((value): value is string => Boolean(value));
  const recommendationParts = [
    nonBlank(record.ownership_or_identity_evidence),
    nonBlank(record.public_display_recommendation),
    nonBlank(record.source_status),
  ].filter((value): value is string => Boolean(value));
  const tags = [
    nonBlank(record.cultural_specialty),
    nonBlank(record.price_range),
    nonBlank(record.location_model),
    nonBlank(record.nearby_cultural_sites_tags),
  ].filter((value): value is string => Boolean(value));

  return {
    id: `national-${receiptHash.slice(0, 24)}`,
    sourceRow: record.source_row,
    sourceRowId,
    receiptHash,
    name: record.name,
    category: nonBlank(record.category) ?? "Community Resources",
    subcategory: nonBlank(record.subcategory) ?? nonBlank(record.category) ?? "General",
    address: record.address,
    city: record.city,
    state: record.state,
    country: "United States",
    description: descriptionParts.join(" "),
    phone: nonBlank(record.phone),
    website: nonBlank(record.website),
    sourceUrl: nonBlank(record.source_url),
    sourceLabel: nonBlank(record.source_name) ?? "National diaspora master source",
    recommendationReason: recommendationParts.join(" · ") || null,
    ownershipDesignations,
    blackOwned: ownershipDesignations.includes("black-owned"),
    ownershipClaim: ownershipDesignations.length > 0
      ? "source_reported_designation_unverified"
      : null,
    tags,
  };
}

export function nationalMasterDirectorySqlPredicate(
  businessIdSql = "b.id",
): string {
  // The directory predicate deliberately uses a row-local, importer-only source
  // marker so ordinary discovery cannot fail before the additive receipt table is
  // created. `businessIdSql` is retained in the signature for consistency with
  // the completed-cohort predicate and future receipt-table hardening.
  void businessIdSql;
  return `COALESCE(b.data_source, '') = '${NATIONAL_MASTER_DIRECTORY_SOURCE}'`;
}

export function nationalMasterActivationReceiptHash(
  profile: NationalMasterDirectoryProfile,
): string {
  return stableHash(
    `${NATIONAL_MASTER_DIRECTORY_POLICY}|${profile.receiptHash}|${profile.id}`,
  );
}
