import { createHash, randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import { validateAdminBusinessProfilePatch } from "../businesses/adminBusinessProfilePolicy";
import { parseProfileEnrichmentManifest, type ProfileEnrichmentCandidate } from "../businesses/kinfolkCurrentProfileEnrichment";
import {
  FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION,
} from "../businesses/documentedDiscoveryEligibility";
import { mwmDiasporaPromotionSqlPredicate } from "../businesses/mwmCoreDiscoveryPolicy";
import {
  FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
  founderSourceObservedAt,
  founderSourcePresence,
  sanitizeFounderSourceOfficialWebsite,
  sourceListedOfficialSocials,
  type FounderSourcePresence,
} from "./founderSourcePublicationPolicy";
import { sourceBackedDirectoryCandidates, type SourceBackedDirectoryCandidate } from "./sourceBackedDirectoryCandidates";
import { minneapolisSourceBackedDirectoryCandidates } from "./minneapolisSourceBackedDirectoryCandidates";
import { mnblackStatewideSourceBackedDirectoryCandidates } from "./mnblackStatewideSourceBackedDirectoryCandidates";
import {
  REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT,
  REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_MANIFEST,
} from "./reviewedNonKinfolkLatinoProfileCreateManifest";
import {
  buildSourceBackedDirectoryIntakePlan,
  nextSourceReceiptCursor,
  normalizeDirectoryIdentity,
  sourceBackedDirectoryPublicationFields,
  type ExistingDirectoryBusiness,
} from "./sourceBackedDirectoryIntake";

const FOUNDER_SOURCE_CANDIDATES: readonly SourceBackedDirectoryCandidate[] = [
  ...sourceBackedDirectoryCandidates,
  ...minneapolisSourceBackedDirectoryCandidates,
  ...mnblackStatewideSourceBackedDirectoryCandidates,
];

type ExistingSourceBusiness = ExistingDirectoryBusiness & Readonly<{
  country: string | null;
  description: string | null;
  ownershipDesignations: string[] | null;
  blackOwned: boolean | null;
  tags: string[] | null;
  status: string | null;
  listingStatus: string | null;
  kinfolkCurrent: boolean;
}>;

type SourceTarget = Readonly<{
  candidate: SourceBackedDirectoryCandidate;
  businessId: string;
  outcome: "created" | "linked_existing";
  presence: FounderSourcePresence;
}>;

type FounderSourceRequest = Readonly<{
  apply: boolean;
  existingOnly: boolean;
  currentOnly: boolean;
  excludeKinfolkCurrent: boolean;
  city: string | null;
  state: string | null;
  batch: string | null;
  cursor: string | null;
  batchSize: number;
  ownershipScope: "black" | "latino" | null;
}>;

const BLACK_OWNERSHIP_DESIGNATION = "Black / African American-Owned";
const LATINO_OWNERSHIP_DESIGNATION = "Latino / Hispanic-Owned";

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function text(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized && normalized.length <= maximum ? normalized : null;
}

function parseRequest(req: Request): FounderSourceRequest | null {
  const city = text(req.body?.city, 100);
  const state = text(req.body?.state, 50)?.toUpperCase() ?? null;
  const batch = text(req.body?.batch, 255);
  const cursor = text(req.body?.cursor, 512);
  const rawOwnershipScope = text(req.body?.ownershipScope, 20)?.toLowerCase() ?? null;
  if (rawOwnershipScope && rawOwnershipScope !== "black" && rawOwnershipScope !== "latino") return null;
  const requestedBatchSize = Number(req.body?.batchSize ?? 100);
  if (!city && !batch) return null;
  return {
    apply: req.body?.apply === true,
    // Source-receipt reconciliation is canonical-profile enrichment by
    // default. A separate, explicit future workflow is required to create a
    // business profile that does not already have a unique canonical record.
    existingOnly: req.body?.existingOnly !== false,
    // This scope is for an additive source-ownership pass over profiles that
    // are already current. It must never create or enrich another field.
    currentOnly: req.body?.currentOnly === true,
    // A source-reconciliation caller can require that Kinfolk Current profiles
    // are never mutated, including after a concurrent profile-state change.
    excludeKinfolkCurrent: req.body?.excludeKinfolkCurrent === true,
    city,
    state,
    batch,
    cursor,
    batchSize: Number.isFinite(requestedBatchSize)
      ? Math.min(Math.max(Math.floor(requestedBatchSize), 1), 100)
      : 100,
    ownershipScope: rawOwnershipScope as FounderSourceRequest["ownershipScope"],
  };
}

function matchesRequestedOwnershipScope(
  candidate: SourceBackedDirectoryCandidate,
  ownershipScope: FounderSourceRequest["ownershipScope"],
): boolean {
  if (ownershipScope === "black") return candidate.ownershipDesignations.includes(BLACK_OWNERSHIP_DESIGNATION);
  if (ownershipScope === "latino") return candidate.ownershipDesignations.includes(LATINO_OWNERSHIP_DESIGNATION);
  return true;
}

function samePlace(candidate: SourceBackedDirectoryCandidate, existing: ExistingSourceBusiness): boolean {
  return normalizeDirectoryIdentity(candidate.name) === normalizeDirectoryIdentity(existing.name)
    && normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(existing.city)
    && normalizeDirectoryIdentity(candidate.state) === normalizeDirectoryIdentity(existing.state);
}

function nonDirectoryExistingSocials(existing: ExistingSourceBusiness) {
  return sourceListedOfficialSocials({
    facebook: existing.facebook ?? undefined,
    instagram: existing.instagram ?? undefined,
    tiktok: existing.tiktok ?? undefined,
    twitter: existing.twitter ?? undefined,
    youtube: existing.youtube ?? undefined,
    pinterest: existing.pinterest ?? undefined,
  });
}

function inFuture(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

async function existingCandidates(candidates: readonly SourceBackedDirectoryCandidate[]): Promise<ExistingSourceBusiness[]> {
  const names = [...new Set(candidates.map((candidate) => normalizeDirectoryIdentity(candidate.name)))];
  const receiptKeys = candidates.map((candidate) => candidate.sourceRecordKey);
  const listingUrls = candidates.map((candidate) => candidate.sourceListingUrl ?? candidate.sourceUrl);
  const result = await pool.query<ExistingSourceBusiness>(
    `SELECT id, name, city, state, address, country, website, source_url AS "sourceUrl",
            dedupe_key AS "dedupeKey", phone, facebook, instagram, tiktok, twitter, youtube, pinterest,
            description, ownership_designations AS "ownershipDesignations", black_owned AS "blackOwned",
            tags, status, listing_status AS "listingStatus",
            EXISTS (
              SELECT 1
                FROM public.public_businesses AS current_kinfolk
               WHERE current_kinfolk.id = businesses.id
                 AND ${mwmDiasporaPromotionSqlPredicate("current_kinfolk.id")}
            ) AS "kinfolkCurrent"
       FROM businesses
      WHERE (
        REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '', 'g') = ANY($1::text[])
        OR dedupe_key = ANY($2::text[])
        OR source_url = ANY($3::text[])
      )`,
    [names, receiptKeys, listingUrls],
  );
  return result.rows;
}

type SourceTargetMutationState = "mutable" | "kinfolk_current" | "deleted";

/**
 * Explicit-release mode deliberately skips general startup migrations. This
 * narrow, administrator-only publication preflight applies only the constraint
 * needed by this founder-authorized source-reconciliation workflow; it never
 * enables startup publishers, seeds, or workers.
 */
async function ensureFounderSourceEligibilityConstraint(client: { query: Function }): Promise<void> {
  const existing = await client.query(
    `SELECT pg_get_constraintdef(constraint_row.oid) AS definition
       FROM pg_constraint AS constraint_row
      WHERE constraint_row.conrelid = 'public.business_discovery_eligibility'::regclass
        AND constraint_row.conname = 'business_discovery_eligibility_check'`,
  );
  const definition = String(existing.rows[0]?.definition ?? "");
  if (definition.includes(FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION)) return;
  await client.query(
    `ALTER TABLE business_discovery_eligibility
       DROP CONSTRAINT IF EXISTS business_discovery_eligibility_check;
     ALTER TABLE business_discovery_eligibility
       ADD CONSTRAINT business_discovery_eligibility_check
       CHECK (
         eligibility_status <> 'qualified' OR (
           ownership_evidence_id IS NOT NULL
           AND jsonb_array_length(ownership_designations) > 0
           AND ownership_source_expires_at IS NOT NULL
           AND review_after IS NOT NULL
           AND (
             official_website_evidence_id IS NOT NULL
             OR official_social_evidence_id IS NOT NULL
             OR (
               policy_version = '${FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION}'
               AND identity_evidence_id IS NOT NULL
             )
           )
         )
       ) NOT VALID;
     ALTER TABLE business_discovery_eligibility
       VALIDATE CONSTRAINT business_discovery_eligibility_check;`,
  );
}

/**
 * Locks an existing profile immediately before mutation. This is intentionally
 * a live check: a concurrent Kinfolk Current workflow wins and this source
 * reconciliation skips the profile instead of overwriting its public state.
 */
async function sourceTargetMutationState(
  client: { query: Function },
  businessId: string,
): Promise<SourceTargetMutationState> {
  const result = await client.query(
    `SELECT businesses.status,
            EXISTS (
              SELECT 1
                FROM public.public_businesses AS current_kinfolk
               WHERE current_kinfolk.id = businesses.id
                 AND ${mwmDiasporaPromotionSqlPredicate("current_kinfolk.id")}
            ) AS "kinfolkCurrent"
       FROM businesses
      WHERE businesses.id = $1
      FOR UPDATE`,
    [businessId],
  );
  const row = result.rows[0] as { status?: string | null; kinfolkCurrent?: boolean } | undefined;
  if (!row || ["deleted", "removed"].includes((row.status ?? "").toLowerCase())) return "deleted";
  return row.kinfolkCurrent ? "kinfolk_current" : "mutable";
}

async function upsertEvidence(
  client: { query: Function },
  businessId: string,
  field: "identity" | "ownership" | "official_website" | "official_social",
  candidate: SourceBackedDirectoryCandidate,
  observedValue: Record<string, unknown>,
): Promise<string> {
  const sourceUrl = candidate.sourceListingUrl ?? candidate.sourceUrl;
  const sourceHash = hash(`${candidate.sourceRecordKey}:${field}`);
  const result = await client.query(
    `INSERT INTO business_profile_evidence_receipts (
       id, business_id, field_name, source_kind, source_url, source_label,
       observed_at, confidence, observed_value, source_sha256, captured_by, superseded_at
     ) VALUES ($1, $2, $3, 'founder_directory', $4, $5, $6::timestamptz, 'high', $7::jsonb, $8, 'founder-source-publication', NULL)
     ON CONFLICT (business_id, field_name, source_sha256) WHERE source_sha256 IS NOT NULL
     DO UPDATE SET source_url = EXCLUDED.source_url, source_label = EXCLUDED.source_label,
                   observed_at = EXCLUDED.observed_at, observed_value = EXCLUDED.observed_value,
                   confidence = EXCLUDED.confidence, captured_by = EXCLUDED.captured_by, superseded_at = NULL
     RETURNING id`,
    [
      randomUUID(), businessId, field, sourceUrl, candidate.sourceLabel,
      founderSourceObservedAt(candidate.batch), JSON.stringify(observedValue), sourceHash,
    ],
  );
  return result.rows[0]!.id;
}

async function recordSourceReceiptAndEligibility(
  client: { query: Function },
  target: SourceTarget,
): Promise<{
  qualified: boolean;
  officialWebsiteBlanked: boolean;
  socialOnly: boolean;
  holdReason: "no_usable_official_presence" | "no_documented_ownership_designation" | null;
}> {
  const { candidate, businessId } = target;
  const presence = target.presence;
  const sourceUrl = candidate.sourceListingUrl ?? candidate.sourceUrl;
  const receiptHash = hash(JSON.stringify({
    sourceRecordKey: candidate.sourceRecordKey,
    sourceUrl: candidate.sourceUrl,
    sourceListingUrl: candidate.sourceListingUrl,
    ownershipDesignations: candidate.ownershipDesignations,
    ownershipEvidence: candidate.ownershipEvidence,
  }));
  await client.query(
    `INSERT INTO business_source_directory_receipts (
       business_id, source_record_key, source_batch, source_label, source_url, source_listing_url,
       observed_at, ownership_designations, ownership_evidence, official_website_url, official_socials, receipt_sha256
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::jsonb, $9, $10, $11::jsonb, $12)
     ON CONFLICT (business_id, source_record_key) DO UPDATE SET
       source_batch = EXCLUDED.source_batch, source_label = EXCLUDED.source_label,
       source_url = EXCLUDED.source_url, source_listing_url = EXCLUDED.source_listing_url,
       observed_at = EXCLUDED.observed_at, ownership_designations = EXCLUDED.ownership_designations,
       ownership_evidence = EXCLUDED.ownership_evidence, official_website_url = EXCLUDED.official_website_url,
       official_socials = EXCLUDED.official_socials, receipt_sha256 = EXCLUDED.receipt_sha256`,
    [
      businessId, candidate.sourceRecordKey, candidate.batch, candidate.sourceLabel, candidate.sourceUrl,
      candidate.sourceListingUrl, founderSourceObservedAt(candidate.batch),
      JSON.stringify(candidate.ownershipDesignations), candidate.ownershipEvidence,
      presence.officialWebsite, JSON.stringify(presence.officialSocials), receiptHash,
    ],
  );
  if (!candidate.ownershipDesignations.length) {
    return {
      qualified: false,
      officialWebsiteBlanked: false,
      socialOnly: false,
      holdReason: "no_documented_ownership_designation",
    };
  }

  const identityEvidenceId = await upsertEvidence(client, businessId, "identity", candidate, {
    businessName: candidate.name, city: candidate.city, state: candidate.state,
  });
  const ownershipEvidenceId = await upsertEvidence(client, businessId, "ownership", candidate, {
    ownershipDesignations: candidate.ownershipDesignations,
    ownershipEvidence: candidate.ownershipEvidence,
  });
  const officialWebsiteEvidenceId = presence.officialWebsite
    ? await upsertEvidence(client, businessId, "official_website", candidate, { websiteUrl: presence.officialWebsite })
    : null;
  const firstSocial = Object.values(presence.officialSocials)[0] ?? null;
  const officialSocialEvidenceId = firstSocial
    ? await upsertEvidence(client, businessId, "official_social", candidate, { profileUrl: firstSocial })
    : null;
  await client.query(
    `INSERT INTO business_discovery_eligibility (
       business_id, eligibility_status, policy_version, identity_evidence_id, ownership_evidence_id,
       official_website_evidence_id, official_social_evidence_id, address_evidence_id, map_pin_evidence_id,
       ownership_designations, ownership_source_expires_at, review_after, decision_reason, decided_by, decided_at, updated_at
     ) VALUES ($1, 'qualified', $2, $3::uuid, $4::uuid, $5::uuid, $6::uuid, NULL, NULL,
       $7::jsonb, $8::timestamptz, $9::timestamptz, $10, 'founder-source-publication', now(), now())
     ON CONFLICT (business_id) DO UPDATE SET
       eligibility_status = EXCLUDED.eligibility_status, policy_version = EXCLUDED.policy_version,
       identity_evidence_id = EXCLUDED.identity_evidence_id, ownership_evidence_id = EXCLUDED.ownership_evidence_id,
       official_website_evidence_id = EXCLUDED.official_website_evidence_id,
       official_social_evidence_id = EXCLUDED.official_social_evidence_id,
       -- A source-receipt refresh never supplies a physical-address or
       -- geocoder assertion. Retain any separately audited address/map pin;
       -- a later address change must use documented-discovery review and a
       -- fresh address plus geocode receipt.
       address_evidence_id = business_discovery_eligibility.address_evidence_id,
       map_pin_evidence_id = business_discovery_eligibility.map_pin_evidence_id,
       ownership_designations = EXCLUDED.ownership_designations,
       ownership_source_expires_at = EXCLUDED.ownership_source_expires_at,
       review_after = EXCLUDED.review_after, decision_reason = EXCLUDED.decision_reason,
       decided_by = EXCLUDED.decided_by, decided_at = now(), updated_at = now()`,
    [
      businessId, FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION, identityEvidenceId, ownershipEvidenceId,
      officialWebsiteEvidenceId, officialSocialEvidenceId, JSON.stringify(candidate.ownershipDesignations),
      inFuture(366), inFuture(180),
      "Founder-provided ownership-directory receipt with retained source identity; a website or social profile is not required for source-backed discovery.",
    ],
  );
  await client.query(
     `INSERT INTO business_discovery_eligibility_audit_events
       (id, business_id, action, actor_id, reason, before_state, after_state)
     VALUES ($1, $2, 'qualified', 'founder-source-publication', $3, '{}'::jsonb,
       jsonb_build_object('sourceRecordKey', $4::text, 'policyVersion', $5::text))`,
    [randomUUID(), businessId, "Founder ownership-directory publication", candidate.sourceRecordKey, FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION],
  );
  return {
    qualified: true,
    officialWebsiteBlanked: Boolean(presence.rejectedWebsite && !presence.officialWebsite),
    socialOnly: !presence.officialWebsite && Boolean(firstSocial),
    holdReason: null,
  };
}

/**
 * Adds only documented ownership data to an already-current public profile.
 * It intentionally does not change the profile's Kinfolk membership, website,
 * social links, lifecycle state, map position, or discovery decision.
 */
async function recordCurrentProfileSourceOwnership(
  client: { query: Function },
  candidate: SourceBackedDirectoryCandidate,
  businessId: string,
): Promise<boolean> {
  if (!candidate.ownershipDesignations.length) return false;
  const presence = founderSourcePresence(candidate);
  const receiptHash = hash(JSON.stringify({
    sourceRecordKey: candidate.sourceRecordKey,
    sourceUrl: candidate.sourceUrl,
    sourceListingUrl: candidate.sourceListingUrl,
    ownershipDesignations: candidate.ownershipDesignations,
    ownershipEvidence: candidate.ownershipEvidence,
  }));
  await client.query(
    `INSERT INTO business_source_directory_receipts (
       business_id, source_record_key, source_batch, source_label, source_url, source_listing_url,
       observed_at, ownership_designations, ownership_evidence, official_website_url, official_socials, receipt_sha256
     ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8::jsonb, $9, $10, $11::jsonb, $12)
     ON CONFLICT (business_id, source_record_key) DO UPDATE SET
       source_batch = EXCLUDED.source_batch, source_label = EXCLUDED.source_label,
       source_url = EXCLUDED.source_url, source_listing_url = EXCLUDED.source_listing_url,
       observed_at = EXCLUDED.observed_at, ownership_designations = EXCLUDED.ownership_designations,
       ownership_evidence = EXCLUDED.ownership_evidence, official_website_url = EXCLUDED.official_website_url,
       official_socials = EXCLUDED.official_socials, receipt_sha256 = EXCLUDED.receipt_sha256`,
    [
      businessId, candidate.sourceRecordKey, candidate.batch, candidate.sourceLabel, candidate.sourceUrl,
      candidate.sourceListingUrl, founderSourceObservedAt(candidate.batch),
      JSON.stringify(candidate.ownershipDesignations), candidate.ownershipEvidence,
      presence.officialWebsite, JSON.stringify(presence.officialSocials), receiptHash,
    ],
  );
  await upsertEvidence(client, businessId, "ownership", candidate, {
    ownershipDesignations: candidate.ownershipDesignations,
    ownershipEvidence: candidate.ownershipEvidence,
  });
  await client.query(
    `UPDATE businesses SET
       ownership_designations = (
         SELECT COALESCE(jsonb_agg(DISTINCT value), '[]'::jsonb)
           FROM jsonb_array_elements_text(
             COALESCE(ownership_designations, '[]'::jsonb) || $2::jsonb
           ) AS value
       ),
       black_owned = COALESCE(black_owned, false) OR $3,
       updated_at = now()
     WHERE id = $1`,
    [
      businessId,
      JSON.stringify(candidate.ownershipDesignations),
      candidate.ownershipDesignations.includes(BLACK_OWNERSHIP_DESIGNATION),
    ],
  );
  return true;
}

async function queueDuplicate(
  client: { query: Function },
  candidate: SourceBackedDirectoryCandidate,
  canonicalBusinessId: string,
  reason: string,
): Promise<void> {
  await client.query(
    `INSERT INTO founder_source_duplicate_review_queue (
       source_record_key, source_batch, canonical_business_id, duplicate_reason, source_snapshot
     ) VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (source_record_key) DO UPDATE SET
       canonical_business_id = EXCLUDED.canonical_business_id,
       duplicate_reason = EXCLUDED.duplicate_reason,
       source_snapshot = EXCLUDED.source_snapshot`,
    [candidate.sourceRecordKey, candidate.batch, canonicalBusinessId, reason, JSON.stringify(candidate)],
  );
}

async function queueIdentityHold(
  client: { query: Function },
  hold: ReturnType<typeof buildSourceBackedDirectoryIntakePlan>["identityHolds"][number],
): Promise<void> {
  await client.query(
    `INSERT INTO founder_source_identity_review_queue (
       source_record_key, source_batch, conflict_reason, candidate_business_ids, source_snapshot
     ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
     ON CONFLICT (source_record_key) DO UPDATE SET
       source_batch = EXCLUDED.source_batch, conflict_reason = EXCLUDED.conflict_reason,
       candidate_business_ids = EXCLUDED.candidate_business_ids, source_snapshot = EXCLUDED.source_snapshot,
       status = CASE WHEN founder_source_identity_review_queue.status = 'resolved' THEN 'pending'
                     ELSE founder_source_identity_review_queue.status END`,
    [
      hold.candidate.sourceRecordKey, hold.candidate.batch, hold.reason,
      JSON.stringify(hold.candidateBusinessIds), JSON.stringify(hold.candidate),
    ],
  );
}

/** Retains a source receipt for review when it cannot safely enrich a canonical profile. */
async function queueCanonicalProfileHold(
  client: { query: Function },
  candidate: SourceBackedDirectoryCandidate,
  reason: "no_existing_canonical_profile" | "no_usable_official_presence" | "no_documented_ownership_designation",
): Promise<void> {
  await client.query(
    `INSERT INTO founder_source_identity_review_queue (
       source_record_key, source_batch, conflict_reason, candidate_business_ids, source_snapshot
     ) VALUES ($1, $2, $3, '[]'::jsonb, $4::jsonb)
     ON CONFLICT (source_record_key) DO UPDATE SET
       source_batch = EXCLUDED.source_batch, conflict_reason = EXCLUDED.conflict_reason,
       candidate_business_ids = EXCLUDED.candidate_business_ids, source_snapshot = EXCLUDED.source_snapshot,
       status = CASE WHEN founder_source_identity_review_queue.status = 'resolved' THEN 'pending'
                     ELSE founder_source_identity_review_queue.status END`,
    [candidate.sourceRecordKey, candidate.batch, reason, JSON.stringify(candidate)],
  );
}

function publicManifest(
  request: FounderSourceRequest,
  selected: readonly SourceBackedDirectoryCandidate[],
  plan: ReturnType<typeof buildSourceBackedDirectoryIntakePlan>,
  existing: readonly ExistingSourceBusiness[],
) {
  const selectedKeys = new Set(selected.map((candidate) => candidate.sourceRecordKey));
  const plannedCreates = plan.toCreate.filter((candidate) => selectedKeys.has(candidate.sourceRecordKey));
  const kinfolkCurrentIds = new Set(existing.filter((business) => business.kinfolkCurrent).map((business) => business.id));
  const deletedIds = new Set(existing
    .filter((business) => ["deleted", "removed"].includes((business.status ?? "").toLowerCase()))
    .map((business) => business.id));
  const candidateMatches = plan.duplicateMatches.filter((match) => selectedKeys.has(match.candidate.sourceRecordKey));
  const protectedMatches = candidateMatches.filter((match) =>
    Boolean(match.existingBusinessId && deletedIds.has(match.existingBusinessId))
      || Boolean(request.excludeKinfolkCurrent && match.existingBusinessId && kinfolkCurrentIds.has(match.existingBusinessId)),
  );
  const duplicateMatches = candidateMatches.filter((match) => !protectedMatches.includes(match));
  const identityHolds = plan.identityHolds.filter((hold) =>
    selectedKeys.has(hold.candidate.sourceRecordKey)
      && !hold.candidateBusinessIds.some((businessId) =>
        deletedIds.has(businessId)
          || (request.excludeKinfolkCurrent && kinfolkCurrentIds.has(businessId))),
  );
  const sourceDocumented = plannedCreates.filter((candidate) => candidate.ownershipDesignations.length > 0);
  return {
    policyVersion: FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION,
    requestedScope: {
      city: request.city, state: request.state, batch: request.batch,
      ownershipScope: request.ownershipScope, existingOnly: request.existingOnly,
      currentOnly: request.currentOnly,
      excludeKinfolkCurrent: request.excludeKinfolkCurrent,
    },
    sourceRecordsProcessed: selected.length,
    profilesToCreate: request.existingOnly ? 0 : sourceDocumented.length,
    unmatchedCanonicalHolds: request.existingOnly ? sourceDocumented.length : 0,
    existingProfilesToEnrich: duplicateMatches.filter((match) => Boolean(match.existingBusinessId)).length,
    duplicateHolds: duplicateMatches.length,
    identityHolds: identityHolds.length,
    kinfolkCurrentExcluded: protectedMatches.filter((match) => Boolean(match.existingBusinessId && kinfolkCurrentIds.has(match.existingBusinessId))).length,
    deletedExcluded: protectedMatches.filter((match) => Boolean(match.existingBusinessId && deletedIds.has(match.existingBusinessId))).length,
    officialSiteBlanks: selected.filter((candidate) => Boolean(founderSourcePresence(candidate).rejectedWebsite)).length,
    officialSocialOnlyProfiles: request.existingOnly ? 0 : sourceDocumented.filter((candidate) => {
      const presence = founderSourcePresence(candidate);
      return !presence.officialWebsite && presence.hasOfficialPresence;
    }).length,
    mapPinnedProfiles: 0,
    noOfficialPresenceRequired: sourceDocumented.filter((candidate) => !founderSourcePresence(candidate).hasOfficialPresence).length,
    ownershipDesignationHolds: selected.filter((candidate) => !candidate.ownershipDesignations.length).length,
    existingCandidateCount: existing.length,
  };
}

type VerifiedSourceProfileCreateResult = Readonly<{
  sourceRecordKey: string;
  status: "ready" | "created" | "skipped";
  reason: string;
  businessId?: string;
  changedFields?: readonly string[];
}>;

type VerifiedSourceProfileCreateEntry = Readonly<{
  source: SourceBackedDirectoryCandidate;
  profile: ProfileEnrichmentCandidate;
}>;

const PROFILE_CREATION_SOCIAL_FIELDS = [
  "instagram",
  "tiktok",
  "facebook",
  "twitter",
  "youtube",
  "pinterest",
] as const;

function sameVerifiedSourceIdentity(
  source: SourceBackedDirectoryCandidate,
  profile: ProfileEnrichmentCandidate,
): boolean {
  return (
    normalizeDirectoryIdentity(source.name) ===
      normalizeDirectoryIdentity(profile.expectedIdentity.name) &&
    normalizeDirectoryIdentity(source.city) ===
      normalizeDirectoryIdentity(profile.expectedIdentity.city) &&
    normalizeDirectoryIdentity(source.state) ===
      normalizeDirectoryIdentity(profile.expectedIdentity.state)
  );
}

/**
 * The creation manifest deliberately reuses the bounded enrichment schema, but
 * its candidate ID is an immutable source receipt key rather than a business
 * row ID. Only the documented Latino / Hispanic source registry can resolve
 * that key; arbitrary administrator uploads cannot create a profile.
 */
function verifiedSourceProfileCreateEntries(
  profiles: readonly ProfileEnrichmentCandidate[],
): VerifiedSourceProfileCreateEntry[] {
  const sourceByKey = new Map(
    FOUNDER_SOURCE_CANDIDATES.map((source) => [source.sourceRecordKey, source]),
  );
  const entries: VerifiedSourceProfileCreateEntry[] = [];
  for (const profile of profiles) {
    if (!profile.businessId.startsWith("source-receipt:")) {
      throw new Error(
        "A source-profile creation candidate must use a source receipt key.",
      );
    }
    const source = sourceByKey.get(profile.businessId);
    if (!source)
      throw new Error(
        "A source-profile creation candidate is not in the retained source registry.",
      );
    if (!source.ownershipDesignations.includes(LATINO_OWNERSHIP_DESIGNATION)) {
      throw new Error(
        "A source-profile creation candidate is not documented as Latino / Hispanic-Owned.",
      );
    }
    if (!sameVerifiedSourceIdentity(source, profile)) {
      throw new Error(
        "A source-profile creation candidate does not match its retained source identity.",
      );
    }
    entries.push({ source, profile });
  }
  return entries;
}

function verifiedSourceProfileCreationPresence(
  patch: Record<string, string | string[] | null>,
): FounderSourcePresence {
  const socials = Object.fromEntries(
    PROFILE_CREATION_SOCIAL_FIELDS.flatMap((field) => {
      const value = patch[field];
      return typeof value === "string" && value.trim()
        ? [[field, value] as const]
        : [];
    }),
  ) as FounderSourcePresence["officialSocials"];
  const officialWebsite =
    typeof patch.website === "string" && patch.website.trim()
      ? patch.website
      : null;
  return {
    officialWebsite,
    officialSocials: socials,
    hasOfficialPresence: Boolean(
      officialWebsite || Object.keys(socials).length,
    ),
    rejectedWebsite: null,
  };
}

function validateVerifiedSourceProfileCreation(
  source: SourceBackedDirectoryCandidate,
  profile: ProfileEnrichmentCandidate,
  batchId: string,
  fingerprint: string,
) {
  const fields = sourceBackedDirectoryPublicationFields(source);
  return validateAdminBusinessProfilePatch(
    {
      ...profile.patch,
      sourceReceipts: profile.receipts.map((receipt) => ({
        ...receipt,
        identityMatch: true,
        identityMatchSignal: "business_name" as const,
      })),
      changeNote: `Source-receipted non-Kinfolk profile creation (${batchId}; ${fingerprint.slice(0, 12)})`,
    },
    {
      name: source.name,
      description: null,
      address: source.address,
      city: source.city,
      state: source.state,
      phone: null,
      website: null,
      hours: null,
      priceRange: null,
      instagram: null,
      tiktok: null,
      facebook: null,
      twitter: null,
      youtube: null,
      pinterest: null,
      category: fields.category,
      subcategory: fields.subcategory,
      tags: [],
      vibes: [],
      ownershipDesignations: source.ownershipDesignations,
    },
  );
}

function creationPreviewReason(
  entry: VerifiedSourceProfileCreateEntry,
  plan: ReturnType<typeof buildSourceBackedDirectoryIntakePlan>,
): string | null {
  if (
    plan.toCreate.some(
      (candidate) => candidate.sourceRecordKey === entry.source.sourceRecordKey,
    )
  )
    return null;
  const held = plan.identityHolds.find(
    (candidate) =>
      candidate.candidate.sourceRecordKey === entry.source.sourceRecordKey,
  );
  if (held) return `Held for duplicate review: ${held.reason}.`;
  const duplicate = plan.duplicateMatches.find(
    (candidate) =>
      candidate.candidate.sourceRecordKey === entry.source.sourceRecordKey,
  );
  if (duplicate)
    return `A matching retained profile already exists (${duplicate.reason}); duplicate creation is prohibited.`;
  return "The source candidate is not eligible for a new canonical profile.";
}

const REVIEWED_SOURCE_PROFILE_CREATE_POLICY_VERSION = "reviewed-non-kinfolk-source-profile-create-v1";
const REVIEWED_SOURCE_PROFILE_CREATE_PREVIEW_TTL_MS = 15 * 60 * 1000;

class ReviewedSourceProfileCreateError extends Error {
  constructor(
    message: string,
    readonly status: 409 | 422,
    readonly results: readonly VerifiedSourceProfileCreateResult[] = [],
  ) {
    super(message);
  }
}

function reviewedSourceProfileCreationManifest() {
  const manifest = parseProfileEnrichmentManifest(REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_MANIFEST);
  if (manifest.scope !== "non_kinfolk_current") {
    throw new Error("The reviewed source-profile creation manifest must remain non-Kinfolk scoped.");
  }
  if (manifest.candidates.length !== REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT) {
    throw new Error("The reviewed source-profile creation manifest does not contain exactly the approved record count.");
  }
  return manifest;
}

function reviewedSourceProfileCreationKeys(entries: readonly VerifiedSourceProfileCreateEntry[]): string[] {
  return entries.map((entry) => entry.source.sourceRecordKey).sort();
}

function sourceProfileCreationActorId(req: Request): string {
  const actorId = text((req as any).user?.id, 255);
  if (!actorId) throw new Error("An authenticated administrator identity is required for source-profile creation.");
  return actorId;
}

export function registerFounderSourcePublicationRoutes(app: Express): void {
  /** Administrator-only trace view for source receipt → canonical profile audits. */
  app.get("/api/admin/founder-source-publication/receipts", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status((req as any).user?.id ? 403 : 401).json({ error: "Administrator access required" });
    const city = text(req.query.city, 100);
    const state = text(req.query.state, 50)?.toUpperCase() ?? null;
    const batch = text(req.query.batch, 255);
    const cursor = text(req.query.cursor, 512);
    const rawOwnershipScope = text(req.query.ownershipScope, 20)?.toLowerCase() ?? null;
    if (rawOwnershipScope && rawOwnershipScope !== "black" && rawOwnershipScope !== "latino") {
      return void res.status(400).json({ error: "ownershipScope must be black or latino." });
    }
    const ownershipScope = rawOwnershipScope as FounderSourceRequest["ownershipScope"];
    const rawLimit = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 100;
    const eligibleOnly = req.query.eligibleOnly === "true";
    const includeKinfolkCurrent = req.query.includeKinfolkCurrent === "true";
    if (!city && !batch) return void res.status(400).json({ error: "A source batch or city is required." });
    const scope = FOUNDER_SOURCE_CANDIDATES
      .filter((candidate) => !batch || candidate.batch === batch)
      .filter((candidate) => !city || normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(city))
      .filter((candidate) => !state || candidate.state?.trim().toUpperCase() === state)
      .filter((candidate) => matchesRequestedOwnershipScope(candidate, ownershipScope))
      .sort((a, b) => a.sourceRecordKey.localeCompare(b.sourceRecordKey));
    const selected = eligibleOnly
      ? scope
      : scope.filter((candidate) => !cursor || candidate.sourceRecordKey > cursor).slice(0, limit);
    try {
      const result = await pool.query<{
        source_record_key: string;
        business_id: string;
        name: string | null;
        city: string | null;
        state: string | null;
        status: string | null;
        listing_status: string | null;
        website: string | null;
        instagram: string | null;
        tiktok: string | null;
        facebook: string | null;
        eligibility_status: string | null;
        mapping_status: string;
        mapping_hold_reason: string | null;
        kinfolk_current: boolean;
      }>(
        `SELECT r.source_record_key, r.business_id, b.name, b.city, b.state, b.status, b.listing_status,
                b.website, b.instagram, b.tiktok, b.facebook,
                e.eligibility_status, r.mapping_status, r.mapping_hold_reason,
                EXISTS (
                  SELECT 1 FROM public.public_businesses AS current_kinfolk
                   WHERE current_kinfolk.id = b.id
                ) AS kinfolk_current
           FROM business_source_directory_receipts r
           JOIN businesses b ON b.id = r.business_id
           LEFT JOIN business_discovery_eligibility e ON e.business_id = b.id
          WHERE r.source_record_key = ANY($1::text[])
          ORDER BY r.source_record_key, r.created_at DESC`,
        [selected.map((candidate) => candidate.sourceRecordKey)],
      );
      const receiptsByKey = new Map<string, typeof result.rows>();
      for (const row of result.rows) {
        const rows = receiptsByKey.get(row.source_record_key) ?? [];
        rows.push(row);
        receiptsByKey.set(row.source_record_key, rows);
      }
      if (eligibleOnly) {
        const eligibleProfiles: Array<{
          businessId: string;
          name: string;
          city: string;
          state: string;
          website: string | null;
          instagram: string | null;
          facebook: string | null;
          tiktok: string | null;
          kinfolkCurrent: boolean;
        }> = [];
        const seenBusinessIds = new Set<string>();
        for (const candidate of selected) {
          for (const profile of receiptsByKey.get(candidate.sourceRecordKey) ?? []) {
            const exactIdentity = normalizeDirectoryIdentity(candidate.name) === normalizeDirectoryIdentity(profile.name)
              && normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(profile.city)
              && normalizeDirectoryIdentity(candidate.state) === normalizeDirectoryIdentity(profile.state);
            if (!exactIdentity || profile.mapping_status !== "active" || profile.status !== "active"
              || profile.listing_status === "archived" || (!includeKinfolkCurrent && profile.kinfolk_current)
              || seenBusinessIds.has(profile.business_id)) continue;
            seenBusinessIds.add(profile.business_id);
            eligibleProfiles.push({
              businessId: profile.business_id,
              name: profile.name ?? "",
              city: profile.city ?? "",
              state: profile.state ?? "",
              website: profile.website,
              instagram: profile.instagram,
              facebook: profile.facebook,
              tiktok: profile.tiktok,
              kinfolkCurrent: profile.kinfolk_current,
            });
          }
        }
        return void res.json({
          policyVersion: FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
          requestedOwnershipScope: ownershipScope,
          sourceRecordsInScope: selected.length,
          eligibleProfiles,
          nextCursor: null,
        });
      }
      return void res.json({
        policyVersion: FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
        requestedOwnershipScope: ownershipScope,
        records: selected.map((candidate) => ({
          sourceRecordKey: candidate.sourceRecordKey,
          sourceIdentity: { name: candidate.name, city: candidate.city, state: candidate.state },
          attachedProfiles: receiptsByKey.get(candidate.sourceRecordKey) ?? [],
        })),
        nextCursor: nextSourceReceiptCursor(scope, selected),
      });
    } catch (error) {
      req.log.error({ error }, "Founder-source receipt audit failed");
      return void res.status(500).json({ error: "Founder-source receipt audit failed" });
    }
  });

  app.post(
    "/api/admin/founder-source-profile-create",
    async (req: Request, res: Response) => {
      if (!isAdmin(req))
        return void res
          .status((req as any).user?.id ? 403 : 401)
          .json({ error: "Administrator access required" });

      let manifest: ReturnType<typeof reviewedSourceProfileCreationManifest>;
      let prepared: Array<
        VerifiedSourceProfileCreateEntry & {
          validated: ReturnType<typeof validateAdminBusinessProfilePatch>;
          presence: FounderSourcePresence;
        }
      >;
      let actorId: string;
      try {
        manifest = reviewedSourceProfileCreationManifest();
        actorId = sourceProfileCreationActorId(req);
        prepared = verifiedSourceProfileCreateEntries(manifest.candidates)
          .map((entry) => {
            const validated = validateVerifiedSourceProfileCreation(
              entry.source,
              entry.profile,
              manifest.batchId,
              manifest.contentFingerprint,
            );
            const presence = verifiedSourceProfileCreationPresence(validated.patch);
            if (!presence.hasOfficialPresence) {
              throw new Error(
                "Every approved source-backed profile requires a reviewed official website or official social profile.",
              );
            }
            return { ...entry, validated, presence };
          })
          .sort((a, b) =>
            a.source.sourceRecordKey.localeCompare(b.source.sourceRecordKey),
          );
      } catch (error) {
        return void res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "The reviewed source-profile manifest could not be loaded",
        });
      }

      const sourceRecordKeys = reviewedSourceProfileCreationKeys(prepared);
      const apply = (req.body as { apply?: unknown })?.apply === true;
      if (!apply) {
        try {
          const existing = await existingCandidates(
            prepared.map((entry) => entry.source),
          );
          const plan = buildSourceBackedDirectoryIntakePlan(
            prepared.map((entry) => entry.source),
            existing,
          );
          const results: VerifiedSourceProfileCreateResult[] = prepared.map(
            (entry) => {
              const reason = creationPreviewReason(entry, plan);
              return reason
                ? {
                    sourceRecordKey: entry.source.sourceRecordKey,
                    status: "skipped",
                    reason,
                  }
                : {
                    sourceRecordKey: entry.source.sourceRecordKey,
                    status: "ready",
                    reason:
                      "No retained duplicate or identity hold was found. The entire approved batch will be rechecked inside one atomic transaction before creation.",
                  };
            },
          );
          const readyCount = results.filter(
            (result) => result.status === "ready",
          ).length;
          if (
            readyCount !==
            REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT
          ) {
            return void res.status(409).json({
              ok: false,
              scope: "non_kinfolk_current",
              batchId: manifest.batchId,
              contentFingerprint: manifest.contentFingerprint,
              candidateCount: prepared.length,
              readyCount,
              skippedCount: results.length - readyCount,
              results,
              error:
                "The exact reviewed 62-profile batch is no longer safe to create. No preview token was issued and no records were changed.",
            });
          }

          const previewToken = hash(
            `${randomUUID()}:${actorId}:${manifest.contentFingerprint}`,
          );
          const issuedAt = new Date();
          const expiresAt = new Date(
            issuedAt.getTime() +
              REVIEWED_SOURCE_PROFILE_CREATE_PREVIEW_TTL_MS,
          ).toISOString();
          await pool.query(
            `INSERT INTO founder_source_publication_batches
               (batch_key, city, state, policy_version, source_count, before_manifest, created_by)
             VALUES ($1, NULL, NULL, $2, $3, $4::jsonb, $5)`,
            [
              previewToken,
              REVIEWED_SOURCE_PROFILE_CREATE_POLICY_VERSION,
              prepared.length,
              JSON.stringify({
                kind: "reviewed_non_kinfolk_source_profile_create_preview",
                actorId,
                batchId: manifest.batchId,
                contentFingerprint: manifest.contentFingerprint,
                sourceRecordKeys,
                issuedAt: issuedAt.toISOString(),
                expiresAt,
              }),
              actorId,
            ],
          );
          return void res.json({
            ok: true,
            requiresExplicitApply: true,
            scope: "non_kinfolk_current",
            batchId: manifest.batchId,
            contentFingerprint: manifest.contentFingerprint,
            candidateCount: prepared.length,
            readyCount,
            skippedCount: 0,
            previewToken,
            previewExpiresAt: expiresAt,
            results,
            rule:
              "This server-authorized preview is bound to the current administrator, immutable reviewed 62-record manifest, and a 15-minute expiry. Apply requires this exact unused token and runs all 62 creations atomically.",
          });
        } catch (error) {
          req.log.error(
            { error, batchId: manifest.batchId },
            "Reviewed source-profile creation preview failed",
          );
          return void res
            .status(500)
            .json({ error: "Reviewed source-profile creation preview failed" });
        }
      }

      const previewToken = text(
        (req.body as { previewToken?: unknown })?.previewToken,
        128,
      );
      if (!previewToken) {
        return void res.status(422).json({
          error:
            "A current server-authorized preview token is required before this exact batch can be created.",
        });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
        const preview = await client.query<{
          before_manifest: Record<string, unknown>;
          completed_at: string | null;
        }>(
          `SELECT before_manifest, completed_at
             FROM founder_source_publication_batches
            WHERE batch_key = $1
              AND created_by = $2
            FOR UPDATE`,
          [previewToken, actorId],
        );
        const previewState = preview.rows[0]?.before_manifest;
        const expiresAt =
          typeof previewState?.expiresAt === "string"
            ? Date.parse(previewState.expiresAt)
            : Number.NaN;
        const previewKeys = Array.isArray(previewState?.sourceRecordKeys)
          ? previewState.sourceRecordKeys
          : [];
        const exactPreview =
          preview.rows.length === 1 &&
          preview.rows[0]?.completed_at == null &&
          previewState?.kind ===
            "reviewed_non_kinfolk_source_profile_create_preview" &&
          previewState?.actorId === actorId &&
          previewState?.batchId === manifest.batchId &&
          previewState?.contentFingerprint === manifest.contentFingerprint &&
          Number.isFinite(expiresAt) &&
          expiresAt > Date.now() &&
          JSON.stringify(previewKeys) === JSON.stringify(sourceRecordKeys);
        if (!exactPreview) {
          throw new ReviewedSourceProfileCreateError(
            "The preview token is missing, expired, already used, or not bound to this exact reviewed source-profile batch.",
            422,
          );
        }

        await ensureFounderSourceEligibilityConstraint(client);
        const blocked: VerifiedSourceProfileCreateResult[] = [];
        for (const entry of prepared) {
          await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
            entry.source.sourceRecordKey,
          ]);
          const linkedReceipt = await client.query<{ business_id: string }>(
            `SELECT business_id
               FROM business_source_directory_receipts
              WHERE source_record_key = $1
              FOR UPDATE`,
            [entry.source.sourceRecordKey],
          );
          if (linkedReceipt.rows.length > 0) {
            blocked.push({
              sourceRecordKey: entry.source.sourceRecordKey,
              status: "skipped",
              reason:
                "This immutable source receipt is already attached to a retained MWM profile; duplicate creation is prohibited.",
            });
            continue;
          }
          const exactIdentity = await client.query<{
            id: string;
            kinfolk_current: boolean;
          }>(
            `SELECT b.id,
                    EXISTS (
                      SELECT 1
                        FROM public.public_businesses AS current_kinfolk
                       WHERE current_kinfolk.id = b.id
                         AND ${mwmDiasporaPromotionSqlPredicate("current_kinfolk.id")}
                    ) AS kinfolk_current
               FROM businesses AS b
              WHERE regexp_replace(lower(COALESCE(b.name, '')), '[^a-z0-9]+', '', 'g') = $1
                AND regexp_replace(lower(COALESCE(b.city, '')), '[^a-z0-9]+', '', 'g') = $2
                AND regexp_replace(lower(COALESCE(b.state, '')), '[^a-z0-9]+', '', 'g') = $3
              FOR UPDATE`,
            [
              normalizeDirectoryIdentity(entry.source.name),
              normalizeDirectoryIdentity(entry.source.city),
              normalizeDirectoryIdentity(entry.source.state),
            ],
          );
          if (exactIdentity.rows.length > 0) {
            const blockedByKinfolk = exactIdentity.rows.some(
              (row) => row.kinfolk_current,
            );
            blocked.push({
              sourceRecordKey: entry.source.sourceRecordKey,
              status: "skipped",
              reason: blockedByKinfolk
                ? "An exact matching profile is now in Kinfolk Current; creation is prohibited by the non-Kinfolk scope."
                : "An exact matching MWM profile now exists; duplicate creation is prohibited.",
            });
          }
        }
        if (blocked.length > 0) {
          throw new ReviewedSourceProfileCreateError(
            "The exact reviewed batch is no longer safe to create. The transaction was rolled back and no profile was created.",
            409,
            blocked,
          );
        }

        const results: VerifiedSourceProfileCreateResult[] = [];
        for (const entry of prepared) {
          const sourceFields = sourceBackedDirectoryPublicationFields(entry.source);
          const patch = entry.validated.patch;
          const description =
            typeof patch.description === "string" ? patch.description : null;
          const phone = typeof patch.phone === "string" ? patch.phone : null;
          const hours = typeof patch.hours === "string" ? patch.hours : null;
          const tags = Array.isArray(patch.tags) ? patch.tags : [];
          const officialWebsite =
            typeof patch.website === "string" ? patch.website : null;
          const social = Object.fromEntries(
            PROFILE_CREATION_SOCIAL_FIELDS.flatMap((field) => {
              const value = patch[field];
              return typeof value === "string" ? [[field, value] as const] : [];
            }),
          ) as Record<
            (typeof PROFILE_CREATION_SOCIAL_FIELDS)[number],
            string | undefined
          >;
          const businessId = `source_${randomUUID()}`;
          const blackOwned = entry.source.ownershipDesignations.includes(
            BLACK_OWNERSHIP_DESIGNATION,
          );
          await client.query(
            `INSERT INTO businesses (
               id, name, category, subcategory, description, address, city, state, country, phone, hours,
               website, facebook, instagram, tiktok, twitter, youtube, pinterest, source_url, dedupe_key,
               ownership_designations, black_owned, tags, status, listing_status, owner_claim_status,
               profile_status, verified, featured, promotion_eligible, feedback_opt_in, data_source,
               research_source_label, research_source_url, kinfolk_recommendation_reason, intake_batch_reference
             ) VALUES (
               $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
               $12,$13,$14,$15,$16,$17,$18,$19,$20,
               $21::jsonb,$22,$23::jsonb,'active','live_unclaimed','unclaimed','community_listed',false,false,false,false,
               'founder_source_directory_intake',$24,$25,$26,$27
             )`,
            [
              businessId,
              entry.source.name,
              sourceFields.category,
              sourceFields.subcategory,
              description,
              entry.source.address,
              entry.source.city,
              entry.source.state,
              entry.source.country,
              phone,
              hours,
              officialWebsite,
              social.facebook ?? null,
              social.instagram ?? null,
              social.tiktok ?? null,
              social.twitter ?? null,
              social.youtube ?? null,
              social.pinterest ?? null,
              entry.source.sourceListingUrl ?? entry.source.sourceUrl,
              entry.source.sourceRecordKey,
              JSON.stringify(entry.source.ownershipDesignations),
              blackOwned,
              JSON.stringify(tags),
              entry.source.sourceLabel,
              entry.source.sourceUrl,
              entry.source.ownershipEvidence,
              entry.source.batch,
            ],
          );
          await recordSourceReceiptAndEligibility(client, {
            candidate: entry.source,
            businessId,
            outcome: "created",
            presence: entry.presence,
          });

          const sourceUrl =
            entry.source.sourceListingUrl ?? entry.source.sourceUrl;
          const baselineReceipts = [
            {
              field: "identity",
              sourceUrl,
              sourceLabel: entry.source.sourceLabel,
              observedAt: founderSourceObservedAt(entry.source.batch),
              confidence: "high",
              note: "Retained source-directory identity receipt.",
              observedValue: {
                fields: {
                  name: entry.source.name,
                  city: entry.source.city,
                  state: entry.source.state,
                },
                identityMatch: { asserted: true, signal: "business_name" },
              },
            },
            {
              field: "category",
              sourceUrl,
              sourceLabel: entry.source.sourceLabel,
              observedAt: founderSourceObservedAt(entry.source.batch),
              confidence: "high",
              note: "Retained source-directory category receipt.",
              observedValue: {
                fields: {
                  category: sourceFields.category,
                  subcategory: sourceFields.subcategory,
                },
                identityMatch: { asserted: true, signal: "business_name" },
              },
            },
            ...(entry.source.address
              ? [
                  {
                    field: "address",
                    sourceUrl,
                    sourceLabel: entry.source.sourceLabel,
                    observedAt: founderSourceObservedAt(entry.source.batch),
                    confidence: "high",
                    note: "Retained source-directory address receipt. No map pin was created.",
                    observedValue: {
                      fields: { address: entry.source.address },
                      identityMatch: {
                        asserted: true,
                        signal: "street_address",
                      },
                    },
                  },
                ]
              : []),
            {
              field: "ownership",
              sourceUrl,
              sourceLabel: entry.source.sourceLabel,
              observedAt: founderSourceObservedAt(entry.source.batch),
              confidence: "high",
              note: entry.source.ownershipEvidence,
              observedValue: {
                fields: {
                  ownership_designations:
                    entry.source.ownershipDesignations,
                },
                identityMatch: { asserted: true, signal: "business_name" },
              },
            },
          ];
          const fieldReceipts = [
            ...entry.validated.fieldReceipts.map((receipt) => ({
              ...receipt,
              observedValue:
                entry.validated.receiptObservedValues[receipt.field] ?? {},
            })),
            ...baselineReceipts,
          ];
          for (const receipt of fieldReceipts) {
            await client.query(
              `INSERT INTO business_profile_field_receipts
                 (id, business_id, field_name, source_url, source_label, observed_at, confidence, note, observed_value, actor_user_id)
               VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8, $9::jsonb, $10)`,
              [
                randomUUID(),
                businessId,
                receipt.field,
                receipt.sourceUrl,
                receipt.sourceLabel,
                receipt.observedAt,
                receipt.confidence,
                receipt.note,
                JSON.stringify(receipt.observedValue),
                actorId,
              ],
            );
          }
          await client.query(
            `INSERT INTO business_admin_profile_edit_audit_events
               (id, business_id, actor_user_id, change_note, changed_fields, before_state, after_state)
             VALUES ($1, $2, $3, $4, $5::jsonb, '{}'::jsonb, $6::jsonb)`,
            [
              randomUUID(),
              businessId,
              actorId,
              entry.validated.changeNote,
              JSON.stringify([
                "profile_created",
                "identity",
                "category",
                ...(entry.source.address ? ["address"] : []),
                "ownership",
                ...entry.validated.changedColumns,
              ]),
              JSON.stringify({
                id: businessId,
                name: entry.source.name,
                city: entry.source.city,
                state: entry.source.state,
                website: officialWebsite,
                phone,
                hours,
                tags,
                ownershipDesignations: entry.source.ownershipDesignations,
                listingStatus: "live_unclaimed",
                mapPin: null,
              }),
            ],
          );
          results.push({
            sourceRecordKey: entry.source.sourceRecordKey,
            status: "created",
            businessId,
            changedFields: [
              "profile_created",
              "identity",
              "category",
              ...(entry.source.address ? ["address"] : []),
              "ownership",
              ...entry.validated.changedColumns,
            ],
            reason:
              "Created in the exact reviewed 62-record batch with first-party field receipts, source receipts, no map pin, and no Kinfolk membership.",
          });
        }

        if (
          results.length !==
          REVIEWED_NON_KINFOLK_LATINO_PROFILE_CREATE_EXPECTED_COUNT
        ) {
          throw new Error(
            "The reviewed source-profile creation did not produce the exact approved count.",
          );
        }
        await client.query(
          `UPDATE founder_source_publication_batches
              SET after_manifest = $2::jsonb, completed_at = now()
            WHERE batch_key = $1`,
          [
            previewToken,
            JSON.stringify({
              kind: "reviewed_non_kinfolk_source_profile_create_apply",
              batchId: manifest.batchId,
              contentFingerprint: manifest.contentFingerprint,
              sourceRecordKeys,
              createdCount: results.length,
              createdBusinessIds: results.map((result) => result.businessId),
            }),
          ],
        );
        await client.query("COMMIT");
        return void res.status(201).json({
          ok: true,
          scope: "non_kinfolk_current",
          batchId: manifest.batchId,
          contentFingerprint: manifest.contentFingerprint,
          candidateCount: prepared.length,
          createdCount: results.length,
          skippedCount: 0,
          results,
          rule:
            "All 62 reviewed, source-documented profiles were created atomically as unclaimed listings. No existing profile, Kinfolk membership, map pin, verification state, or community data was changed.",
        });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        if (error instanceof ReviewedSourceProfileCreateError) {
          return void res.status(error.status).json({
            ok: false,
            scope: "non_kinfolk_current",
            batchId: manifest.batchId,
            contentFingerprint: manifest.contentFingerprint,
            candidateCount: prepared.length,
            createdCount: 0,
            skippedCount: error.results.length,
            results: error.results,
            error: error.message,
          });
        }
        req.log.error(
          { error, batchId: manifest.batchId },
          "Reviewed source-profile creation failed and was rolled back",
        );
        return void res.status(500).json({
          ok: false,
          error:
            "Reviewed source-profile creation failed and was rolled back; no profile was created.",
        });
      } finally {
        client.release();
      }
    },
  );

  /**
   * Corrects only the false source-record → profile links caused by a prior
   * shared-directory receipt match. Raw receipts are retained with a review
   * hold; derived evidence is superseded and any decision that depended on it
   * is fail-closed. No business row is deleted or repointed automatically.
   */
  app.post("/api/admin/founder-source-publication/repair-identity-mismatches", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status((req as any).user?.id ? 403 : 401).json({ error: "Administrator access required" });
    const request = parseRequest(req);
    if (!request) return void res.status(400).json({ error: "A source batch or city is required." });
    const scope = FOUNDER_SOURCE_CANDIDATES
      .filter((candidate) => !request.batch || candidate.batch === request.batch)
      .filter((candidate) => !request.city || normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(request.city!))
      .filter((candidate) => !request.state || candidate.state?.trim().toUpperCase() === request.state)
      .filter((candidate) => matchesRequestedOwnershipScope(candidate, request.ownershipScope))
      .sort((a, b) => a.sourceRecordKey.localeCompare(b.sourceRecordKey));
    const selected = scope
      .filter((candidate) => !request.cursor || candidate.sourceRecordKey > request.cursor!)
      .slice(0, request.batchSize);
    if (!selected.length) return void res.status(404).json({ error: "No founder source records matched this scope." });
    const candidatesByKey = new Map(selected.map((candidate) => [candidate.sourceRecordKey, candidate]));
    type AttachedReceipt = Readonly<{ source_record_key: string; business_id: string; name: string | null; city: string | null; state: string | null; mapping_status: string }>;
    const hasSameIdentity = (candidate: SourceBackedDirectoryCandidate, row: AttachedReceipt) =>
      normalizeDirectoryIdentity(candidate.name) === normalizeDirectoryIdentity(row.name)
      && normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(row.city)
      && normalizeDirectoryIdentity(candidate.state) === normalizeDirectoryIdentity(row.state);
    try {
      const attached = await pool.query<AttachedReceipt>(
        `SELECT r.source_record_key, r.business_id, b.name, b.city, b.state, r.mapping_status
           FROM business_source_directory_receipts r
           JOIN businesses b ON b.id = r.business_id
          WHERE r.source_record_key = ANY($1::text[])
            AND r.mapping_status = 'active'`,
        [selected.map((candidate) => candidate.sourceRecordKey)],
      );
      const mismatches = attached.rows.filter((row) => {
        const candidate = candidatesByKey.get(row.source_record_key);
        return candidate && !hasSameIdentity(candidate, row);
      });
      if (!request.apply) {
        return void res.json({
          ok: true,
          requiresExplicitApply: true,
          sourceRecordsProcessed: selected.length,
          activeMappings: attached.rows.length,
          mismatchedMappings: mismatches.length,
          mismatchedSourceRecords: new Set(mismatches.map((row) => row.source_record_key)).size,
          sample: mismatches.slice(0, 20).map((row) => ({
            source: candidatesByKey.get(row.source_record_key),
            attachedBusiness: { id: row.business_id, name: row.name, city: row.city, state: row.state },
          })),
          rule: "A repair holds false mappings and supersedes their derived evidence; it does not delete receipts or profiles.",
        });
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const mismatchesByBusiness = new Map<string, AttachedReceipt[]>();
        for (const mismatch of mismatches) {
          const rows = mismatchesByBusiness.get(mismatch.business_id) ?? [];
          rows.push(mismatch);
          mismatchesByBusiness.set(mismatch.business_id, rows);
          const candidate = candidatesByKey.get(mismatch.source_record_key)!;
          await client.query(
            `UPDATE business_source_directory_receipts
                SET mapping_status = 'review_hold', mapping_hold_reason = 'source_identity_mismatch', mapping_reviewed_at = now()
              WHERE source_record_key = $1 AND business_id = $2 AND mapping_status = 'active'`,
            [mismatch.source_record_key, mismatch.business_id],
          );
          await client.query(
            `INSERT INTO founder_source_identity_review_queue
               (source_record_key, source_batch, conflict_reason, candidate_business_ids, source_snapshot)
             VALUES ($1, $2, 'source_identity_mismatch', $3::jsonb, $4::jsonb)
             ON CONFLICT (source_record_key) DO UPDATE SET
               conflict_reason = EXCLUDED.conflict_reason, candidate_business_ids = EXCLUDED.candidate_business_ids,
               source_snapshot = EXCLUDED.source_snapshot, status = 'pending', resolved_at = NULL, resolution_note = NULL`,
            [mismatch.source_record_key, candidate.batch, JSON.stringify([mismatch.business_id]), JSON.stringify(candidate)],
          );
        }
        let heldEligibilityCount = 0;
        for (const [businessId, badRows] of mismatchesByBusiness) {
          const hashes = badRows.flatMap((row) => ["identity", "ownership", "official_website", "official_social"]
            .map((field) => hash(`${row.source_record_key}:${field}`)));
          const before = await client.query<{ state: Record<string, unknown> }>(
            `SELECT to_jsonb(e) AS state FROM business_discovery_eligibility e WHERE e.business_id = $1`,
            [businessId],
          );
          const superseded = await client.query<{ id: string }>(
            `UPDATE business_profile_evidence_receipts
                SET superseded_at = COALESCE(superseded_at, now())
              WHERE business_id = $1
                AND captured_by = 'founder-source-publication'
                AND source_sha256 = ANY($2::text[])
              RETURNING id`,
            [businessId, hashes],
          );
          const evidenceIds = superseded.rows.map((row) => row.id);
          if (!evidenceIds.length) continue;
          const held = await client.query<{ state: Record<string, unknown> }>(
            `UPDATE business_discovery_eligibility e
                SET eligibility_status = 'review_hold', identity_evidence_id = NULL, ownership_evidence_id = NULL,
                    official_website_evidence_id = NULL, official_social_evidence_id = NULL,
                    address_evidence_id = NULL, map_pin_evidence_id = NULL, ownership_designations = '[]'::jsonb,
                    ownership_source_expires_at = NULL, review_after = NULL,
                    decision_reason = 'Held after source-record identity mismatch; administrator review required.',
                    decided_by = 'founder-source-publication-integrity-repair', decided_at = now(), updated_at = now()
              WHERE e.business_id = $1
                AND (e.identity_evidence_id = ANY($2::uuid[]) OR e.ownership_evidence_id = ANY($2::uuid[])
                  OR e.official_website_evidence_id = ANY($2::uuid[]) OR e.official_social_evidence_id = ANY($2::uuid[]))
              RETURNING to_jsonb(e) AS state`,
            [businessId, evidenceIds],
          );
          if (held.rows[0]) {
            heldEligibilityCount += 1;
            await client.query(
              `INSERT INTO business_discovery_eligibility_audit_events
                 (id, business_id, action, actor_id, reason, before_state, after_state)
               VALUES ($1, $2, 'review_hold', 'founder-source-publication-integrity-repair', $3, $4::jsonb, $5::jsonb)`,
              [
                randomUUID(), businessId,
                "Source receipt was attached to a different normalized business identity; evidence held for review.",
                JSON.stringify(before.rows[0]?.state ?? {}), JSON.stringify(held.rows[0].state),
              ],
            );
          }
        }
        await client.query("COMMIT");
        return void res.json({
          ok: true,
          sourceRecordsProcessed: selected.length,
          heldMappings: mismatches.length,
          heldSourceRecords: new Set(mismatches.map((row) => row.source_record_key)).size,
          heldEligibilityDecisions: heldEligibilityCount,
          rule: "False mappings and their derived discovery decisions are now review-held; source receipts and profiles remain retained for audit.",
        });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      req.log.error({ error }, "Founder-source mapping repair failed");
      return void res.status(500).json({ error: "Founder-source mapping repair failed", detail: error instanceof Error ? error.message : "unknown_repair_error" });
    }
  });

  app.post("/api/admin/founder-source-publication", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status((req as any).user?.id ? 403 : 401).json({ error: "Administrator access required" });
    const request = parseRequest(req);
    if (!request) return void res.status(400).json({ error: "A source batch or city is required." });

    const scope = FOUNDER_SOURCE_CANDIDATES
      .filter((candidate) => !request.batch || candidate.batch === request.batch)
      .filter((candidate) => !request.city || normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(request.city!))
      .filter((candidate) => !request.state || candidate.state?.trim().toUpperCase() === request.state)
      .filter((candidate) => matchesRequestedOwnershipScope(candidate, request.ownershipScope))
      .sort((a, b) => a.sourceRecordKey.localeCompare(b.sourceRecordKey));
    if (!scope.length) return void res.status(404).json({ error: "No founder source records matched this scope." });
    const selected = scope
      .filter((candidate) => !request.cursor || candidate.sourceRecordKey > request.cursor!)
      .slice(0, request.batchSize);
    if (!selected.length) return void res.status(200).json({ ok: true, complete: true, sourceRecordsProcessed: 0, nextCursor: null });

    try {
      const existing = await existingCandidates(scope);
      const plan = buildSourceBackedDirectoryIntakePlan(scope, existing);
      const beforeManifest = publicManifest(request, selected, plan, existing);
      if (!request.apply) {
        return void res.json({
          ok: true,
          requiresExplicitApply: true,
          manifest: beforeManifest,
          nextCursor: nextSourceReceiptCursor(scope, selected),
          rule: "No profile, map pin, ownership verification, or source receipt is written by a dry run.",
        });
      }

      const selectedKeys = new Set(selected.map((candidate) => candidate.sourceRecordKey));
      const plannedCreates = request.currentOnly ? [] : plan.toCreate
        .filter((candidate) => selectedKeys.has(candidate.sourceRecordKey));
      const kinfolkCurrentIds = new Set(existing.filter((business) => business.kinfolkCurrent).map((business) => business.id));
      const deletedIds = new Set(existing
        .filter((business) => ["deleted", "removed"].includes((business.status ?? "").toLowerCase()))
        .map((business) => business.id));
      const candidateMatches = plan.duplicateMatches
        .filter((match) => selectedKeys.has(match.candidate.sourceRecordKey));
      const protectedMatches = candidateMatches.filter((match) =>
        Boolean(match.existingBusinessId && deletedIds.has(match.existingBusinessId))
          || Boolean(request.excludeKinfolkCurrent && match.existingBusinessId && kinfolkCurrentIds.has(match.existingBusinessId)),
      );
      const canonicalProfileHolds = request.currentOnly ? [] : request.existingOnly
        ? [
          ...plannedCreates.filter((candidate) => candidate.ownershipDesignations.length > 0),
          ...candidateMatches
            .filter((match) => !match.existingBusinessId)
            .map((match) => match.candidate),
        ]
        : [];
      const canonicalProfileHoldKeys = new Set(canonicalProfileHolds.map((candidate) => candidate.sourceRecordKey));
      const newCandidates = (request.currentOnly || request.existingOnly ? [] : plannedCreates)
        .filter((candidate) => selectedKeys.has(candidate.sourceRecordKey))
        .filter((candidate) => candidate.ownershipDesignations.length > 0);
      const duplicateMatches = candidateMatches
        .filter((match) => !protectedMatches.includes(match))
        .filter((match) => !request.currentOnly || Boolean(match.existingBusinessId && kinfolkCurrentIds.has(match.existingBusinessId)));
      const identityHolds = (request.currentOnly ? [] : plan.identityHolds).filter((hold) =>
        selectedKeys.has(hold.candidate.sourceRecordKey)
          && !hold.candidateBusinessIds.some((businessId) =>
            deletedIds.has(businessId)
              || (request.excludeKinfolkCurrent && kinfolkCurrentIds.has(businessId))),
      );
      const batchKey = hash(JSON.stringify({
        policy: FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION,
        city: request.city, state: request.state, batch: request.batch, ownershipScope: request.ownershipScope,
        currentOnly: request.currentOnly, excludeKinfolkCurrent: request.excludeKinfolkCurrent,
        keys: selected.map((candidate) => candidate.sourceRecordKey),
      }));
      const client = await pool.connect();
      try {
        await ensureFounderSourceEligibilityConstraint(client);
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO founder_source_publication_batches
             (batch_key, city, state, policy_version, source_count, before_manifest, created_by)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
           ON CONFLICT (batch_key) DO UPDATE SET before_manifest = EXCLUDED.before_manifest`,
          [batchKey, request.city, request.state, FOUNDER_SOURCE_DIRECTORY_DISCOVERY_POLICY_VERSION, selected.length,
            JSON.stringify(beforeManifest), (req as any).user?.id ?? "founder-source-publication"],
        );
        for (const hold of identityHolds) await queueIdentityHold(client, hold);
        for (const candidate of canonicalProfileHolds) {
          if (!canonicalProfileHoldKeys.has(candidate.sourceRecordKey)) continue;
          canonicalProfileHoldKeys.delete(candidate.sourceRecordKey);
          await queueCanonicalProfileHold(client, candidate, "no_existing_canonical_profile");
        }

        const targets: SourceTarget[] = [];
        const businessByReceipt = new Map<string, string>();
        for (const candidate of newCandidates) {
          const presence = founderSourcePresence(candidate);
          const fields = sourceBackedDirectoryPublicationFields(candidate);
          const socials = presence.officialSocials;
          const id = `source_${randomUUID()}`;
          await client.query(
            `INSERT INTO businesses (
              id, name, category, subcategory, description, address, city, state, country, phone,
              website, facebook, instagram, tiktok, twitter, youtube, pinterest, source_url, dedupe_key,
              ownership_designations, black_owned, tags, status, listing_status, owner_claim_status,
              profile_status, verified, featured, promotion_eligible, feedback_opt_in, data_source,
              research_source_label, research_source_url, kinfolk_recommendation_reason, intake_batch_reference
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
              $20::jsonb,$21,$22::jsonb,'active','live_unclaimed','unclaimed','community_listed',false,false,false,false,
              'founder_source_directory_intake',$23,$24,$25,$26
            )`,
            [
              id, candidate.name, fields.category, fields.subcategory, fields.description,
              candidate.address, candidate.city, candidate.state, candidate.country, fields.phone,
              presence.officialWebsite, socials.facebook ?? null, socials.instagram ?? null, socials.tiktok ?? null,
              socials.twitter ?? null, socials.youtube ?? null, socials.pinterest ?? null,
              candidate.sourceListingUrl ?? candidate.sourceUrl, candidate.sourceRecordKey,
              JSON.stringify(candidate.ownershipDesignations), candidate.ownershipDesignations.includes("Black / African American-Owned"),
              JSON.stringify(fields.tags), candidate.sourceLabel, candidate.sourceUrl, candidate.ownershipEvidence, candidate.batch,
            ],
          );
          businessByReceipt.set(candidate.sourceRecordKey, id);
          targets.push({ candidate, businessId: id, outcome: "created", presence });
        }

        const seenExisting = new Set<string>();
        let liveDeletedExcluded = protectedMatches
          .filter((match) => Boolean(match.existingBusinessId && deletedIds.has(match.existingBusinessId))).length;
        let liveKinfolkExcluded = 0;
        const sourceOwnedCurrentProfiles = new Set<string>();
        for (const duplicate of duplicateMatches) {
          const businessId = duplicate.existingBusinessId
            ?? (duplicate.matchedSourceReceiptKey ? businessByReceipt.get(duplicate.matchedSourceReceiptKey) ?? null : null);
          if (!businessId) continue;
          if (duplicate.existingBusinessId) {
            const state = await sourceTargetMutationState(client, businessId);
            if (state === "kinfolk_current" && request.excludeKinfolkCurrent) {
              liveKinfolkExcluded += 1;
              continue;
            }
            if (state === "kinfolk_current") {
              if (await recordCurrentProfileSourceOwnership(client, duplicate.candidate, businessId)) {
                sourceOwnedCurrentProfiles.add(businessId);
                await queueDuplicate(client, duplicate.candidate, businessId, duplicate.reason);
              }
              continue;
            }
            if (state === "deleted") {
              liveDeletedExcluded += 1;
              continue;
            }
          }
          const existingRecord = existing.find((item) => item.id === businessId);
          const candidatePresence = founderSourcePresence(duplicate.candidate);
          const retainedWebsite = sanitizeFounderSourceOfficialWebsite(existingRecord?.website) ?? candidatePresence.officialWebsite;
          const retainedSocials = existingRecord ? nonDirectoryExistingSocials(existingRecord) : {};
          const presence: FounderSourcePresence = {
            officialWebsite: retainedWebsite,
            officialSocials: { ...candidatePresence.officialSocials, ...retainedSocials },
            hasOfficialPresence: Boolean(retainedWebsite || Object.keys({ ...candidatePresence.officialSocials, ...retainedSocials }).length),
            rejectedWebsite: candidatePresence.rejectedWebsite,
          };
          await client.query(
            `UPDATE businesses SET
               website = $2, instagram = COALESCE($3, instagram), facebook = COALESCE($4, facebook),
               tiktok = COALESCE($5, tiktok), twitter = COALESCE($6, twitter), youtube = COALESCE($7, youtube),
               pinterest = COALESCE($8, pinterest), ownership_designations = (
                 SELECT COALESCE(jsonb_agg(DISTINCT value), '[]'::jsonb)
                   FROM jsonb_array_elements_text(
                     COALESCE(ownership_designations, '[]'::jsonb) || $9::jsonb
                   ) AS value
               ), black_owned = COALESCE(black_owned, false) OR $10, updated_at = now()
             WHERE id = $1`,
            [
              businessId, retainedWebsite,
              retainedSocials.instagram ?? presence.officialSocials.instagram ?? null,
              retainedSocials.facebook ?? presence.officialSocials.facebook ?? null,
              retainedSocials.tiktok ?? presence.officialSocials.tiktok ?? null,
              retainedSocials.twitter ?? presence.officialSocials.twitter ?? null,
              retainedSocials.youtube ?? presence.officialSocials.youtube ?? null,
              retainedSocials.pinterest ?? presence.officialSocials.pinterest ?? null,
              JSON.stringify(duplicate.candidate.ownershipDesignations),
              duplicate.candidate.ownershipDesignations.includes("Black / African American-Owned"),
            ],
          );
          await queueDuplicate(client, duplicate.candidate, businessId, duplicate.reason);
          if (!seenExisting.has(`${businessId}:${duplicate.candidate.sourceRecordKey}`)) {
            seenExisting.add(`${businessId}:${duplicate.candidate.sourceRecordKey}`);
            targets.push({ candidate: duplicate.candidate, businessId, outcome: "linked_existing", presence });
          }
        }

        let qualifiedCount = 0;
        let blankedCount = 0;
        let socialOnlyCount = 0;
        const ownershipDesignationHoldCount = selected.filter(
          (candidate) => !candidate.ownershipDesignations.length,
        ).length;
        const qualifiedBusinessIds = new Set<string>();
        const sourceDesignationsByBusiness = new Map<string, Set<string>>();
        for (const target of targets) {
          const result = await recordSourceReceiptAndEligibility(client, target);
          if (result.qualified) {
            qualifiedBusinessIds.add(target.businessId);
            const designations = sourceDesignationsByBusiness.get(target.businessId) ?? new Set<string>();
            target.candidate.ownershipDesignations.forEach((designation) => designations.add(designation));
            sourceDesignationsByBusiness.set(target.businessId, designations);
          } else if (result.holdReason === "no_documented_ownership_designation") {
            await queueCanonicalProfileHold(client, target.candidate, result.holdReason);
          }
          if (result.officialWebsiteBlanked) blankedCount += 1;
          if (result.socialOnly) socialOnlyCount += 1;
        }
        qualifiedCount = qualifiedBusinessIds.size;
        const countSourceDesignation = (designation: string) => [...sourceDesignationsByBusiness.values()]
          .filter((designations) => designations.has(designation)).length;
        const afterManifest = {
          ...beforeManifest,
          profilesCreated: new Set(targets.filter((target) => target.outcome === "created").map((target) => target.businessId)).size,
          existingProfilesEnriched: new Set(targets.filter((target) => target.outcome === "linked_existing").map((target) => target.businessId)).size,
          searchableInMwm: qualifiedCount,
          sourceDocumentedOwnership: {
            blackOwned: countSourceDesignation("Black / African American-Owned"),
            latinxHispanicOwned: countSourceDesignation("Latino / Hispanic-Owned"),
          },
          duplicateHolds: duplicateMatches.length,
          identityHolds: identityHolds.length,
          unmatchedCanonicalHolds: [...new Set(canonicalProfileHolds.map((candidate) => candidate.sourceRecordKey))].length,
          officialSiteBlanks: blankedCount,
          officialSocialOnlyProfiles: socialOnlyCount,
          mapPinnedProfiles: 0,
          noOfficialPresenceRequired: targets.filter((target) => !target.presence.hasOfficialPresence).length,
          kinfolkCurrentOwnershipEnriched: sourceOwnedCurrentProfiles.size,
          liveKinfolkExcluded,
          deletedExcluded: liveDeletedExcluded,
          ownershipDesignationHolds: ownershipDesignationHoldCount,
          publicationState: "published_unclaimed_source_documented",
          mapNote: "No map pin was created by this publication. Address and audited geocode remain a separate enrichment requirement.",
        };
        await client.query(
          `UPDATE founder_source_publication_batches
              SET after_manifest = $2::jsonb, completed_at = now()
            WHERE batch_key = $1`,
          [batchKey, JSON.stringify(afterManifest)],
        );
        await client.query("COMMIT");
        return void res.status(201).json({
          ok: true,
          batchKey,
          manifest: afterManifest,
          nextCursor: nextSourceReceiptCursor(scope, selected),
          message: "Founder-source ownership labels were applied without changing Kinfolk membership, website or social fields, lifecycle state, or map pins.",
        });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      req.log.error({ error }, "Founder-source publication failed");
      // This endpoint is administrator-only. Return the deterministic failure
      // category to permit safe repair/retry without exposing database details
      // on a public directory endpoint.
      return void res.status(500).json({
        error: "Founder-source publication failed",
        detail: error instanceof Error ? error.message : "unknown_publication_error",
      });
    }
  });
}
