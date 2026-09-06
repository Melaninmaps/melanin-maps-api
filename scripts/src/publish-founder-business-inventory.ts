import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool, type PoolClient } from "pg";
import {
  getBusinessExperiencePolicy,
  isBlackOwned,
  OWNERSHIP_DESIGNATIONS,
} from "@workspace/constants";
import { assertLocalDirectoryStagingFromProcess } from "./lib/local-directory-staging";

type Candidate = {
  id: string;
  batch_id: string;
  source_row: number;
  target_kind: string;
  status: string;
  name: string;
  city: string;
  state: string | null;
  category: string;
  subcategory: string | null;
  cultural_specialty: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  source_url: string | null;
  source_name: string | null;
  source_status: string | null;
  regulated_profession: boolean;
  public_display_recommendation: string | null;
  ownership_designations: unknown;
  ownership_evidence: string | null;
  matched_business_id: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  price_range: string | null;
  price_basis: string | null;
  notes: string | null;
  raw_record: unknown;
  created_at: string;
};

type ExistingBusiness = {
  id: string;
  name: string;
  city: string;
  state: string | null;
  address: string | null;
  listing_status: string | null;
  permanently_hidden: boolean | null;
};

type PlanRow = {
  candidate_id: string;
  batch_id: string;
  source_row: number;
  previous_status: string;
  original_matched_business_id: string | null;
  identity_key: string;
  record_id: string;
  is_new: boolean;
  is_primary: boolean;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  address: string | null;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  phone: string | null;
  website: string | null;
  source_url: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
  social_profiles: unknown[];
  source_evidence: unknown[];
  ownership_designations: string[];
  ownership_claim: string | null;
  black_owned: boolean;
  tags: string[];
  normalized_name: string;
  dedupe_key: string;
  source_record_id: string;
  price_range: string | null;
  contact_completeness: "partial" | "unknown";
  publication_action: "create" | "link_existing";
  decision_action: "publish" | "link_existing";
  idempotency_key: string;
  payload_hash: string;
};

const PUBLICATION_VERSION = "founder-searchable-v1";
const ACTOR_ID = "founder-authorized-bulk-searchable-2026-09-06";
const AUTHORIZED_SOURCES = [
  {
    sourceName: "directory-import-candidates.jsonl",
    sha256: "e4c5921ed460535cdc5355a40799b01017a3cd77fca40c78fd03e3ffc852db34",
    rowCount: 18_051,
  },
  {
    sourceName: "kinfolk-poc-business-candidates.jsonl",
    sha256: "a1981d62915bad12ce076dea670f6d12eaa95aa39517aa8bdc89c02a2ded8502",
    rowCount: 115,
  },
  {
    sourceName: "cumulative-content-global-candidates.jsonl",
    sha256: "6f1e686856eb79e45add03f2208ac836167cde7d5ca69ea99f4464eeae9169a8",
    rowCount: 7_315,
  },
] as const;
const ownershipSet = new Set<string>(OWNERSHIP_DESIGNATIONS);

// Kept byte-for-byte equivalent to artifacts/api-server/src/lib/business-dedup.ts.
function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function dedupeKey(business: {
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
}): string {
  const name = normalizeText(business.name);
  const address = normalizeText(business.address);
  const city = normalizeText(business.city);
  const state = normalizeText(business.state);
  if (address) return `${name}|${city}|${state}|addr:${address}`;
  return `${name}|${city}|${state}|no-location`;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value.trim());
    if (!["https:", "http:"].includes(parsed.protocol)) return null;
    if (parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (!host || host === "localhost" || host.endsWith(".localhost")) return null;
    if (/^(?:127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function socialUrl(platform: "instagram" | "facebook" | "tiktok", value: unknown): string | null {
  const url = safeExternalUrl(value);
  if (!url) return null;
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  const accepted = platform === "instagram"
    ? host === "instagram.com" || host.endsWith(".instagram.com")
    : platform === "facebook"
      ? host === "facebook.com" || host.endsWith(".facebook.com") || host === "fb.com"
      : host === "tiktok.com" || host.endsWith(".tiktok.com");
  return accepted ? url : null;
}

function websiteDomain(value: string | null): string | null {
  if (!value) return null;
  return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function firstValue<T>(rows: Candidate[], read: (row: Candidate) => T | null): T | null {
  for (const row of rows) {
    const value = read(row);
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

function normalizedIdentity(candidate: Pick<Candidate, "name" | "city" | "state">): string {
  return [normalizeText(candidate.name), normalizeText(candidate.city), normalizeText(candidate.state)].join("|");
}

function canonicalStreetIdentity(address: string | null, city: string, state: string | null): string | null {
  if (!address?.trim()) return null;
  let normalizedAddress = normalizeText(address);
  const postal = normalizedAddress.match(/\b\d{5}(?: \d{4})?$/)?.[0];
  if (postal) normalizedAddress = normalizedAddress.slice(0, -postal.length).trim();
  for (const suffix of [normalizeText(state), normalizeText(city)]) {
    if (suffix && normalizedAddress.endsWith(` ${suffix}`)) {
      normalizedAddress = normalizedAddress.slice(0, -(suffix.length + 1)).trim();
    }
  }
  return normalizedAddress || null;
}

function postalCode(address: string | null): string | null {
  return address?.match(/\b\d{5}(?:-\d{4})?\b/)?.[0] ?? null;
}

function canonicalPriceRange(value: string | null): string | null {
  const normalizedValue = value?.trim() ?? "";
  if (/^\${1,4}$/.test(normalizedValue)) return normalizedValue;
  if (/^(free|budget|moderate|premium|luxury)$/i.test(normalizedValue) && normalizedValue.length <= 10) {
    return normalizedValue;
  }
  return null;
}

function explicitOwnershipDesignations(rows: Candidate[]): string[] {
  const designations = new Set<string>();
  for (const row of rows) {
    for (const designation of asStringArray(row.ownership_designations)) {
      if (ownershipSet.has(designation)) designations.add(designation);
    }
    const evidence = normalizeText(row.ownership_evidence);
    if (!evidence) continue;
    const add = (label: string, pattern: RegExp) => {
      if (pattern.test(evidence)) designations.add(label);
    };
    add("Black / African American-Owned", /\bblack\b.*\b(?:owned|founded|led|operated)\b/);
    add("African-Owned", /\bafrican\b.*\b(?:owned|founded|led|operated)\b/);
    add("Afro-Caribbean-Owned", /\bafro caribbean\b.*\b(?:owned|founded|led|operated)\b/);
    add("Caribbean / West Indian-Owned", /\b(?:caribbean|west indian)\b.*\b(?:owned|founded|led|operated)\b/);
    add("Latino / Hispanic-Owned", /\b(?:latino|latina|hispanic)\b.*\b(?:owned|founded|led|operated)\b/);
    add("Afro-Latino-Owned", /\bafro latino\b.*\b(?:owned|founded|led|operated)\b/);
    add("Indigenous / Native-Owned", /\b(?:indigenous|native american)\b.*\b(?:owned|founded|led|operated)\b/);
    add("Asian American-Owned", /\basian(?: american)?\b.*\b(?:owned|founded|led|operated)\b/);
    add("Arab / MENA-Owned", /\b(?:arab|mena|middle eastern)\b.*\b(?:owned|founded|led|operated)\b/);
    add("Woman-Owned", /\b(?:woman|women|female|sister)\b.*\b(?:owned|founded|led|operated)\b/);
    add("LGBTQIA+-Owned", /\b(?:lgbtqia|lgbtq|queer)\b.*\b(?:owned|founded|led|operated)\b/);
    add("Veteran-Owned", /\bveteran\b.*\b(?:owned|founded|led|operated)\b/);
    add("Disability-Owned", /\b(?:disabled|disability)\b.*\b(?:owned|founded|led|operated)\b/);
    add("Family-Owned", /\bfamily\b.*\b(?:owned|founded|operated)\b/);
    add("Minority-Owned (general / legacy)", /\bminority\b.*\b(?:owned|founded|led|operated)\b/);
  }
  return [...designations].sort();
}

function communityMinorityClaim(designations: string[]): string | null {
  if (!designations.length) return null;
  const onlyGeneralOwnership = designations.every((designation) =>
    designation === "Family-Owned" || designation === "Cooperative / Worker-Owned",
  );
  return onlyGeneralOwnership ? null : "community_reported_minority_owned";
}

function countryFor(candidate: Candidate): string {
  const raw = asRecord(candidate.raw_record);
  const supplied = typeof raw.country === "string" ? raw.country.trim() : "";
  if (supplied) return supplied;
  return /^[A-Za-z]{2}$/.test(candidate.state ?? "") ? "USA" : (candidate.state?.trim() || "USA");
}

function deterministicUuid(identity: string): string {
  const bytes = createHash("sha256").update(`${PUBLICATION_VERSION}|${identity}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function stableHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function sortCandidates(rows: Candidate[]): Candidate[] {
  return [...rows].sort((a, b) => {
    const score = (row: Candidate) =>
      (row.address?.trim() ? 16 : 0)
      + (row.website?.trim() ? 8 : 0)
      + (row.source_url?.trim() ? 4 : 0)
      + (row.phone?.trim() ? 2 : 0)
      + (row.ownership_evidence?.trim() ? 1 : 0);
    return score(b) - score(a)
      || Date.parse(a.created_at) - Date.parse(b.created_at)
      || a.source_row - b.source_row
      || a.id.localeCompare(b.id);
  });
}

function publicTags(rows: Candidate[], category: string, subcategory: string): string[] {
  const values = new Set<string>([category, subcategory]);
  for (const row of rows) {
    if (row.cultural_specialty?.trim()) {
      for (const item of row.cultural_specialty.split(/[;,]/)) {
        if (item.trim()) values.add(item.trim());
      }
    }
    const raw = asRecord(row.raw_record);
    if (raw.publicSearchTagEvidence === "workbook_category_services_and_reviewed_offerings_only") {
      for (const item of asStringArray(raw.searchTags)) {
        if (item.trim()) values.add(item.trim());
      }
    }
  }
  return [...values].slice(0, 40);
}

function publicationIdentityKey(rows: Candidate[]): string {
  const ordered = sortCandidates(rows);
  const winner = ordered[0];
  const address = firstValue(ordered, (row) => row.address?.trim() || null);
  return dedupeKey({ name: winner.name, city: winner.city, state: winner.state, address });
}

function planGroup(rows: Candidate[], existing: ExistingBusiness | null): PlanRow[] {
  const ordered = sortCandidates(rows);
  const winner = ordered[0];
  const identity = normalizedIdentity(winner);
  const addresses = new Set(
    ordered.map((row) => canonicalStreetIdentity(row.address, row.city, row.state)).filter(Boolean),
  );
  if (addresses.size > 1) {
    throw new Error(`Ambiguous multi-location identity requires a hold: ${identity}`);
  }
  const recordId = existing?.id ?? deterministicUuid(identity);
  const isNew = !existing;
  const website = firstValue(ordered, (row) => safeExternalUrl(row.website));
  const sourceUrl = firstValue(ordered, (row) => safeExternalUrl(row.source_url));
  const instagram = firstValue(ordered, (row) => socialUrl("instagram", row.instagram_url));
  const facebook = firstValue(ordered, (row) => socialUrl("facebook", row.facebook_url));
  const tiktok = firstValue(ordered, (row) => socialUrl("tiktok", row.tiktok_url));
  const address = firstValue(ordered, (row) => row.address?.trim() || null);
  const phone = firstValue(ordered, (row) => row.phone?.trim() || null);
  const policy = getBusinessExperiencePolicy(winner.category, winner.subcategory);
  const category = policy.category;
  const subcategory = winner.subcategory?.trim() || category;
  const country = countryFor(winner);
  const designations = explicitOwnershipDesignations(ordered);
  const ownershipClaim = communityMinorityClaim(designations);
  const socialProfiles = [
    ["instagram", instagram],
    ["facebook", facebook],
    ["tiktok", tiktok],
  ].flatMap(([platform, url]) => url ? [{ platform, url, handle: null, suppliedByUser: false }] : []);
  const tags = publicTags(ordered, category, subcategory);
  const sourceEvidence = ordered.map((row) => ({
    sourceType: "founder_directory_import",
    sourceName: row.source_name,
    sourceUrl: safeExternalUrl(row.source_url),
    sourceStatus: row.source_status,
    candidateId: row.id,
    batchId: row.batch_id,
    sourceRow: row.source_row,
    ownershipEvidence: row.ownership_evidence || null,
    supports: true,
    verifiedByMwm: false,
    excerpt: "Founder-supplied directory evidence for an unclaimed searchable listing. This is not Mapping With Melanin verification.",
  }));
  const description = `Founder-listed, unclaimed ${subcategory} in ${winner.city}. Not verified by Mapping With Melanin.${address ? " The supplied address is shown; a map pin appears only after precise geocoding." : " Exact street location has not yet been supplied, so this listing is searchable but not pinned."}`;
  const canonicalDedupeKey = publicationIdentityKey(ordered);
  const primaryCandidateId = winner.id;

  return ordered.map((candidate) => {
    const primary = candidate.id === primaryCandidateId;
    const publicationAction = isNew && primary ? "create" : "link_existing";
    const idempotencyKey = `${PUBLICATION_VERSION}:${candidate.id}`;
    const payloadHash = stableHash({ candidateId: candidate.id, recordId, publicationAction, version: PUBLICATION_VERSION });
    return {
      candidate_id: candidate.id,
      batch_id: candidate.batch_id,
      source_row: candidate.source_row,
      previous_status: candidate.status,
      original_matched_business_id: candidate.matched_business_id,
      identity_key: canonicalDedupeKey,
      record_id: recordId,
      is_new: isNew,
      is_primary: primary,
      name: winner.name.trim(),
      category,
      subcategory,
      description,
      address,
      city: winner.city.trim(),
      state: winner.state?.trim() || null,
      country,
      postal_code: postalCode(address),
      phone,
      website,
      source_url: sourceUrl,
      instagram,
      tiktok,
      facebook,
      social_profiles: socialProfiles,
      source_evidence: sourceEvidence,
      ownership_designations: designations,
      ownership_claim: ownershipClaim,
      black_owned: isBlackOwned(designations),
      tags,
      normalized_name: normalizeText(winner.name),
      dedupe_key: canonicalDedupeKey,
      source_record_id: primaryCandidateId,
      price_range: winner.price_basis ? canonicalPriceRange(winner.price_range) : null,
      contact_completeness: website || instagram || facebook || tiktok || sourceUrl || phone ? "partial" : "unknown",
      publication_action: publicationAction,
      decision_action: publicationAction === "create" ? "publish" : "link_existing",
      idempotency_key: idempotencyKey,
      payload_hash: payloadHash,
    };
  });
}

async function verifyAuthorizedBatches(client: PoolClient, lock: boolean): Promise<string[]> {
  const expected = AUTHORIZED_SOURCES.map((source) => ({
    source_name: source.sourceName,
    source_sha256: source.sha256,
    source_row_count: source.rowCount,
  }));
  const { rows } = await client.query<{
    id: string;
    source_name: string;
    source_sha256: string;
    source_row_count: number;
    status: string;
  }>(`
    WITH expected AS (
      SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(
        source_name text, source_sha256 text, source_row_count integer
      )
    )
    SELECT b.id, b.source_name, b.source_sha256, b.source_row_count, b.status
      FROM expected e
      JOIN directory_import_batches b
        ON b.source_name = e.source_name
       AND b.source_sha256 = e.source_sha256
       AND b.source_row_count = e.source_row_count
     ORDER BY b.source_name
     ${lock ? "FOR UPDATE OF b" : ""}
  `, [JSON.stringify(expected)]);
  if (rows.length !== AUTHORIZED_SOURCES.length) {
    throw new Error("FOUNDER_AUTHORIZED_BATCH_SET_MISMATCH");
  }
  for (const row of rows) {
    const candidateCount = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM directory_import_candidates WHERE batch_id = $1",
      [row.id],
    );
    if (row.status !== "in_review" || Number(candidateCount.rows[0]?.count ?? 0) !== row.source_row_count) {
      throw new Error(`FOUNDER_AUTHORIZED_BATCH_NOT_READY:${row.source_name}`);
    }
  }
  return rows.map((row) => row.id);
}

async function loadCandidates(client: PoolClient, authorizedBatchIds: string[], lock: boolean): Promise<Candidate[]> {
  const { rows } = await client.query<Candidate>(`
    SELECT id, batch_id, source_row, target_kind, status, name, city, state,
           category, subcategory, cultural_specialty, address, phone, website,
           source_url, source_name, source_status, regulated_profession,
           public_display_recommendation, ownership_designations,
           ownership_evidence, instagram_url, facebook_url, tiktok_url,
           price_range, price_basis, notes, raw_record, matched_business_id, created_at
     FROM directory_import_candidates
     WHERE batch_id = ANY($1::uuid[])
       AND target_kind = 'business'
       AND status IN ('pending_review', 'needs_research', 'published')
       AND COALESCE(regulated_profession, false) = false
       AND concat_ws(' ', COALESCE(public_display_recommendation, ''), COALESCE(source_status, ''), COALESCE(notes, ''))
           !~* '(safety gate|safety review required)'
     ORDER BY created_at, batch_id, source_row, id
     ${lock ? "FOR UPDATE" : ""}
  `, [authorizedBatchIds]);
  return rows;
}

async function loadExisting(client: PoolClient, lock: boolean): Promise<{
  byIdentity: Map<string, ExistingBusiness[]>;
  byId: Map<string, ExistingBusiness>;
}> {
  const { rows } = await client.query<ExistingBusiness>(`
    SELECT id, name, city, state, address, listing_status, permanently_hidden
      FROM businesses
     WHERE COALESCE(is_duplicate, false) = false
       AND COALESCE(permanently_hidden, false) = false
       AND COALESCE(status, 'active') NOT IN ('duplicate','permanently_hidden','removed','deleted')
     ${lock ? "FOR UPDATE" : ""}
  `);
  const byIdentity = new Map<string, ExistingBusiness[]>();
  const byId = new Map<string, ExistingBusiness>();
  for (const row of rows) {
    byId.set(row.id, row);
    const identity = normalizedIdentity({ name: row.name, city: row.city, state: row.state });
    const list = byIdentity.get(identity) ?? [];
    list.push(row);
    byIdentity.set(identity, list);
  }
  return { byIdentity, byId };
}

async function loadPublicationIdentityClaims(client: PoolClient, identityKeys: string[], lock: boolean): Promise<Map<string, string>> {
  const { rows } = await client.query<{ identity_key: string; business_id: string }>(`
    SELECT identity_key, business_id
     FROM business_publication_identities
     WHERE identity_key = ANY($1::text[])
     ${lock ? "FOR UPDATE" : ""}
  `, [identityKeys]);
  return new Map(rows.map((row) => [row.identity_key, row.business_id]));
}

async function createPlans(client: PoolClient, lock: boolean): Promise<{ plans: PlanRow[]; summary: Record<string, number> }> {
  const authorizedBatchIds = await verifyAuthorizedBatches(client, lock);
  const candidates = await loadCandidates(client, authorizedBatchIds, lock);
  const existing = await loadExisting(client, lock);
  const groups = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const identity = normalizedIdentity(candidate);
    const list = groups.get(identity) ?? [];
    list.push(candidate);
    groups.set(identity, list);
  }
  const identityClaims = await loadPublicationIdentityClaims(
    client,
    [...groups.values()].map((rows) => publicationIdentityKey(rows)),
    lock,
  );

  const plans: PlanRow[] = [];
  let existingIdentities = 0;
  let newIdentities = 0;
  let ambiguousExisting = 0;
  let unsafeAuthoritativeMatchesHeld = 0;
  let identityClaimConflictsHeld = 0;
  for (const [identity, rows] of groups) {
    const identityKey = publicationIdentityKey(rows);
    const claimedBusinessId = identityClaims.get(identityKey) ?? null;
    const authoritativeIds = [...new Set(rows.map((row) => row.matched_business_id).filter((value): value is string => Boolean(value)))];
    if (authoritativeIds.length > 1) {
      ambiguousExisting += 1;
      continue;
    }
    const candidateStreet = firstValue(sortCandidates(rows), (row) => canonicalStreetIdentity(row.address, row.city, row.state));
    const identityMatches = (existing.byIdentity.get(identity) ?? []).filter((business) => {
      if (!candidateStreet || !business.address) return true;
      return canonicalStreetIdentity(business.address, business.city, business.state) === candidateStreet;
    });
    const publicExisting = identityMatches.filter((business) => ["live_unclaimed", "live_claimed"].includes(business.listing_status ?? ""));
    if (authoritativeIds.length === 0 && publicExisting.length > 1) {
      ambiguousExisting += 1;
      continue;
    }
    if (authoritativeIds.length === 0 && publicExisting.length === 0 && identityMatches.length > 0) {
      unsafeAuthoritativeMatchesHeld += 1;
      continue;
    }
    if (claimedBusinessId && authoritativeIds.length === 1 && claimedBusinessId !== authoritativeIds[0]) {
      identityClaimConflictsHeld += 1;
      continue;
    }
    const match = claimedBusinessId
      ? existing.byId.get(claimedBusinessId) ?? null
      : authoritativeIds.length === 1
        ? existing.byId.get(authoritativeIds[0]) ?? null
        : publicExisting[0] ?? null;
    if (claimedBusinessId && !match) {
      identityClaimConflictsHeld += 1;
      continue;
    }
    if (match && !["live_unclaimed", "live_claimed"].includes(match.listing_status ?? "")) {
      unsafeAuthoritativeMatchesHeld += 1;
      continue;
    }
    if (authoritativeIds.length === 1 && !match) {
      unsafeAuthoritativeMatchesHeld += 1;
      continue;
    }
    if (match) existingIdentities += 1;
    else newIdentities += 1;
    plans.push(...planGroup(rows, match));
  }

  const primaryPlans = plans.filter((plan) => plan.is_primary);
  return {
    plans,
    summary: {
      ordinaryBusinessCandidateRows: candidates.length,
      authorizedBatches: authorizedBatchIds.length,
      uniqueBusinessIdentities: groups.size,
      existingBusinessIdentities: existingIdentities,
      newBusinessIdentities: newIdentities,
      ambiguousExistingIdentitiesHeld: ambiguousExisting,
      unsafeAuthoritativeMatchesHeld,
      identityClaimConflictsHeld,
      publicationRows: plans.length,
      newSearchableListings: primaryPlans.filter((plan) => plan.is_new).length,
      suppliedStreetLikeAddresses: primaryPlans.filter((plan) => plan.address && /\d.*[A-Za-z]/.test(plan.address)).length,
      suppliedWebsites: primaryPlans.filter((plan) => plan.website).length,
      suppliedSourceLinks: primaryPlans.filter((plan) => plan.source_url).length,
      suppliedSocialLinks: primaryPlans.filter((plan) => plan.instagram || plan.facebook || plan.tiktok).length,
      communityReportedMinorityClaims: primaryPlans.filter((plan) => plan.ownership_claim === "community_reported_minority_owned").length,
    },
  };
}

async function installPlan(client: PoolClient, plans: PlanRow[]): Promise<void> {
  await client.query(`
    CREATE TEMP TABLE mwm_founder_publication_plan (
      candidate_id uuid PRIMARY KEY, batch_id uuid NOT NULL, source_row integer NOT NULL,
      previous_status text NOT NULL, original_matched_business_id text,
      identity_key text NOT NULL, record_id text NOT NULL,
      is_new boolean NOT NULL, is_primary boolean NOT NULL, name text NOT NULL,
      category text NOT NULL, subcategory text NOT NULL, description text NOT NULL,
      address text, city text NOT NULL, state text, country text NOT NULL, postal_code text,
      phone text, website text, source_url text, instagram text, tiktok text, facebook text,
      social_profiles jsonb NOT NULL, source_evidence jsonb NOT NULL,
      ownership_designations jsonb NOT NULL, ownership_claim text, black_owned boolean NOT NULL,
      tags jsonb NOT NULL, normalized_name text NOT NULL, dedupe_key text NOT NULL,
      source_record_id text NOT NULL, price_range text, contact_completeness text NOT NULL,
      publication_action text NOT NULL, decision_action text NOT NULL,
      idempotency_key text NOT NULL, payload_hash text NOT NULL
    ) ON COMMIT DROP
  `);
  await client.query(
    `INSERT INTO mwm_founder_publication_plan
     SELECT * FROM jsonb_to_recordset($1::jsonb) AS p(
      candidate_id uuid, batch_id uuid, source_row integer, previous_status text,
      original_matched_business_id text,
      identity_key text, record_id text, is_new boolean, is_primary boolean,
      name text, category text, subcategory text, description text, address text,
      city text, state text, country text, postal_code text, phone text, website text,
      source_url text, instagram text, tiktok text, facebook text, social_profiles jsonb,
      source_evidence jsonb, ownership_designations jsonb, ownership_claim text,
      black_owned boolean, tags jsonb, normalized_name text, dedupe_key text,
      source_record_id text, price_range text, contact_completeness text,
      publication_action text, decision_action text, idempotency_key text, payload_hash text
     )`,
    [JSON.stringify(plans)],
  );
}

async function applyPlans(client: PoolClient): Promise<Record<string, number>> {
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '180s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [PUBLICATION_VERSION]);
    const { plans, summary } = await createPlans(client, true);
    await installPlan(client, plans);

    const stalePlan = await client.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count
        FROM mwm_founder_publication_plan p
        LEFT JOIN directory_import_candidates c ON c.id = p.candidate_id
       WHERE c.id IS NULL
          OR c.batch_id <> p.batch_id
          OR c.target_kind <> 'business'
          OR c.status <> p.previous_status
          OR c.status NOT IN ('pending_review','needs_research','published')
          OR COALESCE(c.regulated_profession, false) = true
          OR concat_ws(' ', COALESCE(c.public_display_recommendation, ''), COALESCE(c.source_status, ''), COALESCE(c.notes, ''))
             ~* '(safety gate|safety review required)'
          OR c.matched_business_id IS DISTINCT FROM p.original_matched_business_id
    `);
    if (Number(stalePlan.rows[0]?.count ?? 0) !== 0) {
      throw new Error("BULK_PUBLICATION_STALE_OR_INELIGIBLE_PLAN");
    }

    const inserted = await client.query(`
      INSERT INTO businesses (
        id, name, category, subcategory, description, address, city, state, country,
        postal_code, latitude, longitude, phone, website, website_domain, source_url, hours,
        price_range, tags, image_url, photos, pending_photos, videos,
        instagram, tiktok, facebook, youtube, social_profiles, source_evidence,
        ownership_designations, verified_designations, ownership_claim, black_owned, verified,
        featured, promotion_eligible, feedback_opt_in, status, listing_status,
        business_status, profile_status, owner_claim_status, submitted_by_id,
        added_by_member_id, added_via, data_source, provider_place_id,
        normalized_name, dedupe_key, source_provider, source_record_id,
        public_location_kind, contact_completeness, published_at, created_at, updated_at
      )
      SELECT record_id::text, name, category, subcategory, description, address, city, state, country,
             postal_code, NULL, NULL, phone, website,
             CASE WHEN website IS NULL THEN NULL ELSE regexp_replace(split_part(website, '/', 3), '^www\\.', '') END,
             source_url, NULL, price_range, tags, NULL, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
             instagram, tiktok, facebook, NULL, social_profiles, source_evidence,
             ownership_designations, '[]'::jsonb, ownership_claim, black_owned, false,
             false, false, false, 'active', 'live_unclaimed',
             'community', 'community_listed', 'unclaimed', NULL,
             NULL, 'founder_directory_import', 'founder_directory_import', NULL,
             normalized_name, dedupe_key, 'founder_directory_import', source_record_id,
             CASE WHEN address IS NULL THEN 'city_only' ELSE 'address_ungeocoded' END,
             contact_completeness, NOW(), NOW(), NOW()
        FROM mwm_founder_publication_plan
       WHERE is_new = true AND is_primary = true
      ON CONFLICT (dedupe_key)
        WHERE dedupe_key IS NOT NULL AND btrim(dedupe_key) <> ''
          AND COALESCE(is_duplicate, false) = false
          AND COALESCE(status, '') NOT IN ('duplicate', 'permanently_hidden', 'removed', 'deleted')
      DO NOTHING
      RETURNING id
    `);

    await client.query(`
      UPDATE mwm_founder_publication_plan p
         SET record_id = b.id,
             is_new = false,
             publication_action = 'link_existing',
             decision_action = 'link_existing'
        FROM businesses b
       WHERE p.is_new = true
         AND NOT EXISTS (SELECT 1 FROM businesses created WHERE created.id = p.record_id::text)
         AND b.dedupe_key = p.dedupe_key
         AND COALESCE(b.is_duplicate, false) = false
         AND COALESCE(b.status, 'active') NOT IN ('duplicate','permanently_hidden','removed','deleted')
         AND b.listing_status IN ('live_unclaimed','live_claimed')
    `);

    const missing = await client.query<{ count: string }>(`
      SELECT COUNT(*)::text count
        FROM mwm_founder_publication_plan p
       WHERE NOT EXISTS (SELECT 1 FROM businesses b WHERE b.id = p.record_id::text)
    `);
    if (Number(missing.rows[0]?.count ?? 0) !== 0) {
      throw new Error("BULK_PUBLICATION_CANONICAL_RECORD_MISSING");
    }

    await client.query(`
      INSERT INTO business_publication_identities (identity_key, business_id, created_at)
      SELECT DISTINCT ON (identity_key) identity_key, record_id, NOW()
        FROM mwm_founder_publication_plan
       ORDER BY identity_key, is_primary DESC, source_row
      ON CONFLICT (identity_key) DO NOTHING
    `);

    const identityConflicts = await client.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count
        FROM mwm_founder_publication_plan p
        JOIN business_publication_identities i ON i.identity_key = p.identity_key
       WHERE i.business_id <> p.record_id
    `);
    if (Number(identityConflicts.rows[0]?.count ?? 0) !== 0) {
      throw new Error("BULK_PUBLICATION_IDENTITY_WINNER_CONFLICT");
    }

    await client.query(`
      INSERT INTO directory_import_publications
        (candidate_id, batch_id, record_type, record_id, publication_action,
         actor_id, idempotency_key, payload_hash, created_at)
      SELECT candidate_id, batch_id, 'business', record_id::text, publication_action,
             $1::text, idempotency_key, payload_hash, NOW()
        FROM mwm_founder_publication_plan
      ON CONFLICT (candidate_id) DO NOTHING
    `, [ACTOR_ID]);

    await client.query(`
      INSERT INTO directory_import_decision_events
        (candidate_id, batch_id, actor_id, action, previous_status, new_status,
         review_note, review_evidence, idempotency_key, payload_hash,
         published_record_type, published_record_id, created_at)
      SELECT candidate_id, batch_id, $1::text, decision_action, previous_status, 'published',
             CASE WHEN is_new AND is_primary
               THEN 'Founder-authorized searchable publication: unclaimed, not verified; map pin only after precise geocoding.'
               ELSE 'Founder-authorized reconciliation to an existing canonical searchable business.' END,
             jsonb_build_object(
               'policyVersion', $2::text,
               'founderAuthorized', true,
               'verified', false,
               'ownerClaimStatus', 'unclaimed',
               'mapPin', false,
               'locationState', CASE WHEN address IS NULL THEN 'city_only' ELSE 'address_pending_precise_geocode' END
             ),
             idempotency_key || ':decision', payload_hash,
             'business', record_id::text, NOW()
        FROM mwm_founder_publication_plan
      ON CONFLICT (idempotency_key) DO NOTHING
    `, [ACTOR_ID, PUBLICATION_VERSION]);

    await client.query(`
      UPDATE directory_import_candidates c
         SET status = 'published',
             matched_business_id = p.record_id,
             published_record_type = 'business',
             published_record_id = p.record_id::text,
             reviewed_by = $1::text,
             reviewed_at = NOW(),
             review_note = CASE WHEN p.address IS NULL
               THEN 'Founder authorized searchable listing; exact street location not supplied, so no map pin.'
               ELSE 'Founder authorized searchable listing; supplied address preserved and precise pin geocoding pending.' END,
             review_evidence = COALESCE(c.review_evidence, '{}'::jsonb) || jsonb_build_object(
               'policyVersion', $2::text,
               'founderAuthorized', true,
               'listingStatus', 'live_unclaimed',
               'verified', false,
               'ownerClaimStatus', 'unclaimed'
             ),
             review_revision = review_revision + 1,
             updated_at = NOW()
        FROM mwm_founder_publication_plan p
       WHERE c.id = p.candidate_id
         AND c.status <> 'published'
         AND c.status = p.previous_status
         AND c.batch_id = p.batch_id
         AND c.target_kind = 'business'
         AND COALESCE(c.regulated_profession, false) = false
         AND c.matched_business_id IS NOT DISTINCT FROM p.original_matched_business_id
    `, [ACTOR_ID, PUBLICATION_VERSION]);

    await client.query(`
      UPDATE directory_import_batches b
         SET status = CASE
           WHEN EXISTS (
             SELECT 1 FROM directory_import_candidates c
              WHERE c.batch_id = b.id AND c.status IN ('pending_review','needs_research','approved')
           ) THEN 'in_review' ELSE 'completed' END,
             updated_at = NOW()
       WHERE EXISTS (SELECT 1 FROM mwm_founder_publication_plan p WHERE p.batch_id = b.id)
    `);

    const total = await client.query<{ count: string }>(`SELECT COUNT(*)::text count FROM public_businesses`);
    const imported = await client.query<{ count: string }>(`
      SELECT COUNT(*)::text count FROM public_businesses WHERE data_source = 'founder_directory_import'
    `);
    await client.query("COMMIT");
    return {
      ...summary,
      insertedBusinesses: inserted.rowCount ?? 0,
      totalPublicBusinesses: Number(total.rows[0]?.count ?? 0),
      publicFounderImportBusinesses: Number(imported.rows[0]?.count ?? 0),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main(): Promise<void> {
  const apply = hasFlag("--apply");
  if (apply) assertLocalDirectoryStagingFromProcess();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const pool = new Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 10_000, query_timeout: 240_000 });
  const client = await pool.connect();
  try {
    if (!apply) {
      const { summary } = await createPlans(client, false);
      console.log(JSON.stringify({ mode: "dry_run", policyVersion: PUBLICATION_VERSION, ...summary }, null, 2));
      return;
    }
    const result = await applyPlans(client);
    console.log(JSON.stringify({ mode: "applied", policyVersion: PUBLICATION_VERSION, ...result }, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}

export {
  canonicalPriceRange,
  canonicalStreetIdentity,
  communityMinorityClaim,
  deterministicUuid,
  explicitOwnershipDesignations,
  normalizedIdentity,
  safeExternalUrl,
  socialUrl,
};
