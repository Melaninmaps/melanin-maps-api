import { createHash, randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import { DOCUMENTED_DISCOVERY_POLICY_VERSION } from "../businesses/documentedDiscoveryEligibility";
import {
  FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
  founderSourceObservedAt,
  founderSourcePresence,
  sanitizeFounderSourceOfficialWebsite,
  sourceListedOfficialSocials,
} from "./founderSourcePublicationPolicy";
import { sourceBackedDirectoryCandidates, type SourceBackedDirectoryCandidate } from "./sourceBackedDirectoryCandidates";
import { minneapolisSourceBackedDirectoryCandidates } from "./minneapolisSourceBackedDirectoryCandidates";
import { mnblackStatewideSourceBackedDirectoryCandidates } from "./mnblackStatewideSourceBackedDirectoryCandidates";
import {
  buildSourceBackedDirectoryIntakePlan,
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
}>;

type SourceTarget = Readonly<{
  candidate: SourceBackedDirectoryCandidate;
  businessId: string;
  outcome: "created" | "linked_existing";
}>;

type FounderSourceRequest = Readonly<{
  apply: boolean;
  city: string | null;
  state: string | null;
  batch: string | null;
  cursor: string | null;
  batchSize: number;
}>;

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
  const requestedBatchSize = Number(req.body?.batchSize ?? 100);
  if (!city && !batch) return null;
  return {
    apply: req.body?.apply === true,
    city,
    state,
    batch,
    cursor,
    batchSize: Number.isFinite(requestedBatchSize)
      ? Math.min(Math.max(Math.floor(requestedBatchSize), 1), 100)
      : 100,
  };
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
            tags, status, listing_status AS "listingStatus"
       FROM businesses
      WHERE (
        REGEXP_REPLACE(LOWER(COALESCE(name, '')), '[^a-z0-9]+', '', 'g') = ANY($1::text[])
        OR dedupe_key = ANY($2::text[])
        OR source_url = ANY($3::text[])
      )
        AND COALESCE(is_duplicate, false) = false`,
    [names, receiptKeys, listingUrls],
  );
  return result.rows;
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
): Promise<{ qualified: boolean; officialWebsiteBlanked: boolean; socialOnly: boolean }> {
  const { candidate, businessId } = target;
  const presence = founderSourcePresence(candidate);
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
  if (!presence.hasOfficialPresence) {
    return { qualified: false, officialWebsiteBlanked: Boolean(presence.rejectedWebsite), socialOnly: false };
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
       address_evidence_id = NULL, map_pin_evidence_id = NULL,
       ownership_designations = EXCLUDED.ownership_designations,
       ownership_source_expires_at = EXCLUDED.ownership_source_expires_at,
       review_after = EXCLUDED.review_after, decision_reason = EXCLUDED.decision_reason,
       decided_by = EXCLUDED.decided_by, decided_at = now(), updated_at = now()`,
    [
      businessId, DOCUMENTED_DISCOVERY_POLICY_VERSION, identityEvidenceId, ownershipEvidenceId,
      officialWebsiteEvidenceId, officialSocialEvidenceId, JSON.stringify(candidate.ownershipDesignations),
      inFuture(366), inFuture(180),
      "Founder-provided ownership-directory receipt plus at least one source-listed official presence.",
    ],
  );
  await client.query(
    `INSERT INTO business_discovery_eligibility_audit_events
       (id, business_id, action, actor_id, reason, before_state, after_state)
     VALUES ($1, $2, 'qualified', 'founder-source-publication', $3, '{}'::jsonb,
       jsonb_build_object('sourceRecordKey', $4, 'policyVersion', $5))`,
    [randomUUID(), businessId, "Founder source presence publication", candidate.sourceRecordKey, DOCUMENTED_DISCOVERY_POLICY_VERSION],
  );
  return {
    qualified: true,
    officialWebsiteBlanked: Boolean(presence.rejectedWebsite),
    socialOnly: !presence.officialWebsite && Boolean(firstSocial),
  };
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

function publicManifest(
  request: FounderSourceRequest,
  selected: readonly SourceBackedDirectoryCandidate[],
  plan: ReturnType<typeof buildSourceBackedDirectoryIntakePlan>,
  existing: readonly ExistingSourceBusiness[],
) {
  const selectedKeys = new Set(selected.map((candidate) => candidate.sourceRecordKey));
  const plannedCreates = plan.toCreate.filter((candidate) => selectedKeys.has(candidate.sourceRecordKey));
  const noPresence = plannedCreates.filter((candidate) => !founderSourcePresence(candidate).hasOfficialPresence);
  const publishable = plannedCreates.filter((candidate) => founderSourcePresence(candidate).hasOfficialPresence);
  const duplicateMatches = plan.duplicateMatches.filter((match) => selectedKeys.has(match.candidate.sourceRecordKey));
  return {
    policyVersion: FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
    requestedScope: { city: request.city, state: request.state, batch: request.batch },
    sourceRecordsProcessed: selected.length,
    profilesToCreate: publishable.length,
    existingProfilesToEnrich: duplicateMatches.filter((match) => Boolean(match.existingBusinessId)).length,
    duplicateHolds: duplicateMatches.length,
    officialSiteBlanks: selected.filter((candidate) => Boolean(founderSourcePresence(candidate).rejectedWebsite)).length,
    officialSocialOnlyProfiles: publishable.filter((candidate) => {
      const presence = founderSourcePresence(candidate);
      return !presence.officialWebsite && presence.hasOfficialPresence;
    }).length,
    mapPinnedProfiles: 0,
    noPresenceHolds: noPresence.length,
    existingCandidateCount: existing.length,
  };
}

export function registerFounderSourcePublicationRoutes(app: Express): void {
  app.post("/api/admin/founder-source-publication", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status((req as any).user?.id ? 403 : 401).json({ error: "Administrator access required" });
    const request = parseRequest(req);
    if (!request) return void res.status(400).json({ error: "A source batch or city is required." });

    const scope = FOUNDER_SOURCE_CANDIDATES
      .filter((candidate) => !request.batch || candidate.batch === request.batch)
      .filter((candidate) => !request.city || normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(request.city!))
      .filter((candidate) => !request.state || candidate.state?.trim().toUpperCase() === request.state)
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
          nextCursor: scope.find((candidate) => candidate.sourceRecordKey > selected.at(-1)!.sourceRecordKey)?.sourceRecordKey ?? null,
          rule: "No profile, map pin, ownership verification, or source receipt is written by a dry run.",
        });
      }

      const selectedKeys = new Set(selected.map((candidate) => candidate.sourceRecordKey));
      const newCandidates = plan.toCreate
        .filter((candidate) => selectedKeys.has(candidate.sourceRecordKey))
        .filter((candidate) => founderSourcePresence(candidate).hasOfficialPresence);
      const noPresence = plan.toCreate
        .filter((candidate) => selectedKeys.has(candidate.sourceRecordKey))
        .filter((candidate) => !founderSourcePresence(candidate).hasOfficialPresence);
      const duplicateMatches = plan.duplicateMatches.filter((match) => selectedKeys.has(match.candidate.sourceRecordKey));
      const batchKey = hash(JSON.stringify({
        policy: FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
        city: request.city, state: request.state, batch: request.batch,
        keys: selected.map((candidate) => candidate.sourceRecordKey),
      }));
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO founder_source_publication_batches
             (batch_key, city, state, policy_version, source_count, before_manifest, created_by)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
           ON CONFLICT (batch_key) DO UPDATE SET before_manifest = EXCLUDED.before_manifest`,
          [batchKey, request.city, request.state, FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION, selected.length,
            JSON.stringify(beforeManifest), (req as any).user?.id ?? "founder-source-publication"],
        );

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
          targets.push({ candidate, businessId: id, outcome: "created" });
        }

        const seenExisting = new Set<string>();
        for (const duplicate of duplicateMatches) {
          const businessId = duplicate.existingBusinessId
            ?? (duplicate.matchedSourceReceiptKey ? businessByReceipt.get(duplicate.matchedSourceReceiptKey) ?? null : null);
          if (!businessId) continue;
          const existingRecord = existing.find((item) => item.id === businessId);
          const presence = founderSourcePresence(duplicate.candidate);
          const retainedWebsite = sanitizeFounderSourceOfficialWebsite(existingRecord?.website) ?? presence.officialWebsite;
          const retainedSocials = existingRecord ? nonDirectoryExistingSocials(existingRecord) : {};
          await client.query(
            `UPDATE businesses SET
               website = $2, instagram = COALESCE($3, instagram), facebook = COALESCE($4, facebook),
               tiktok = COALESCE($5, tiktok), twitter = COALESCE($6, twitter), youtube = COALESCE($7, youtube),
               pinterest = COALESCE($8, pinterest), ownership_designations = (
                 SELECT jsonb_agg(DISTINCT value) FROM jsonb_array_elements_text(
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
            targets.push({ candidate: duplicate.candidate, businessId, outcome: "linked_existing" });
          }
        }

        let qualifiedCount = 0;
        let blankedCount = 0;
        let socialOnlyCount = 0;
        for (const target of targets) {
          const result = await recordSourceReceiptAndEligibility(client, target);
          if (result.qualified) qualifiedCount += 1;
          if (result.officialWebsiteBlanked) blankedCount += 1;
          if (result.socialOnly) socialOnlyCount += 1;
        }
        const afterManifest = {
          ...beforeManifest,
          profilesCreated: targets.filter((target) => target.outcome === "created").length,
          existingProfilesEnriched: targets.filter((target) => target.outcome === "linked_existing").length,
          searchableInMwm: qualifiedCount,
          duplicateHolds: duplicateMatches.length,
          officialSiteBlanks: blankedCount,
          officialSocialOnlyProfiles: socialOnlyCount,
          mapPinnedProfiles: 0,
          noPresenceHolds: noPresence.length,
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
          nextCursor: scope.find((candidate) => candidate.sourceRecordKey > selected.at(-1)!.sourceRecordKey)?.sourceRecordKey ?? null,
          message: "Founder-source profiles were published unclaimed with documented-by-source ownership labels; no address-only map pins were created.",
        });
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      req.log.error({ error }, "Founder-source publication failed");
      return void res.status(500).json({ error: "Founder-source publication failed" });
    }
  });
}
