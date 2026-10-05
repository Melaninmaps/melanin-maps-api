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
  type FounderSourcePresence,
} from "./founderSourcePublicationPolicy";
import { sourceBackedDirectoryCandidates, type SourceBackedDirectoryCandidate } from "./sourceBackedDirectoryCandidates";
import { minneapolisSourceBackedDirectoryCandidates } from "./minneapolisSourceBackedDirectoryCandidates";
import { mnblackStatewideSourceBackedDirectoryCandidates } from "./mnblackStatewideSourceBackedDirectoryCandidates";
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
}>;

type SourceTarget = Readonly<{
  candidate: SourceBackedDirectoryCandidate;
  businessId: string;
  outcome: "created" | "linked_existing";
  presence: FounderSourcePresence;
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
       jsonb_build_object('sourceRecordKey', $4::text, 'policyVersion', $5::text))`,
    [randomUUID(), businessId, "Founder source presence publication", candidate.sourceRecordKey, DOCUMENTED_DISCOVERY_POLICY_VERSION],
  );
  return {
    qualified: true,
    officialWebsiteBlanked: Boolean(presence.rejectedWebsite && !presence.officialWebsite),
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
  const identityHolds = plan.identityHolds.filter((hold) => selectedKeys.has(hold.candidate.sourceRecordKey));
  return {
    policyVersion: FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
    requestedScope: { city: request.city, state: request.state, batch: request.batch },
    sourceRecordsProcessed: selected.length,
    profilesToCreate: publishable.length,
    existingProfilesToEnrich: duplicateMatches.filter((match) => Boolean(match.existingBusinessId)).length,
    duplicateHolds: duplicateMatches.length,
    identityHolds: identityHolds.length,
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
  /** Administrator-only trace view for source receipt → canonical profile audits. */
  app.get("/api/admin/founder-source-publication/receipts", async (req: Request, res: Response) => {
    if (!isAdmin(req)) return void res.status((req as any).user?.id ? 403 : 401).json({ error: "Administrator access required" });
    const city = text(req.query.city, 100);
    const state = text(req.query.state, 50)?.toUpperCase() ?? null;
    const batch = text(req.query.batch, 255);
    const cursor = text(req.query.cursor, 512);
    const rawLimit = Number(req.query.limit ?? 100);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 100;
    if (!city && !batch) return void res.status(400).json({ error: "A source batch or city is required." });
    const scope = FOUNDER_SOURCE_CANDIDATES
      .filter((candidate) => !batch || candidate.batch === batch)
      .filter((candidate) => !city || normalizeDirectoryIdentity(candidate.city) === normalizeDirectoryIdentity(city))
      .filter((candidate) => !state || candidate.state?.trim().toUpperCase() === state)
      .sort((a, b) => a.sourceRecordKey.localeCompare(b.sourceRecordKey));
    const selected = scope
      .filter((candidate) => !cursor || candidate.sourceRecordKey > cursor)
      .slice(0, limit);
    try {
      const result = await pool.query<{
        source_record_key: string;
        business_id: string;
        name: string | null;
        city: string | null;
        state: string | null;
        status: string | null;
        listing_status: string | null;
        eligibility_status: string | null;
        mapping_status: string;
        mapping_hold_reason: string | null;
      }>(
        `SELECT r.source_record_key, r.business_id, b.name, b.city, b.state, b.status, b.listing_status,
                e.eligibility_status, r.mapping_status, r.mapping_hold_reason
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
      return void res.json({
        policyVersion: FOUNDER_SOURCE_PUBLICATION_POLICY_VERSION,
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
      const newCandidates = plan.toCreate
        .filter((candidate) => selectedKeys.has(candidate.sourceRecordKey))
        .filter((candidate) => founderSourcePresence(candidate).hasOfficialPresence);
      const noPresence = plan.toCreate
        .filter((candidate) => selectedKeys.has(candidate.sourceRecordKey))
        .filter((candidate) => !founderSourcePresence(candidate).hasOfficialPresence);
      const duplicateMatches = plan.duplicateMatches.filter((match) => selectedKeys.has(match.candidate.sourceRecordKey));
      const identityHolds = plan.identityHolds.filter((hold) => selectedKeys.has(hold.candidate.sourceRecordKey));
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
        for (const hold of identityHolds) await queueIdentityHold(client, hold);

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
        for (const duplicate of duplicateMatches) {
          const businessId = duplicate.existingBusinessId
            ?? (duplicate.matchedSourceReceiptKey ? businessByReceipt.get(duplicate.matchedSourceReceiptKey) ?? null : null);
          if (!businessId) continue;
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
            targets.push({ candidate: duplicate.candidate, businessId, outcome: "linked_existing", presence });
          }
        }

        let qualifiedCount = 0;
        let blankedCount = 0;
        let socialOnlyCount = 0;
        let noPresenceHoldCount = noPresence.length;
        const qualifiedBusinessIds = new Set<string>();
        const sourceDesignationsByBusiness = new Map<string, Set<string>>();
        for (const target of targets) {
          const result = await recordSourceReceiptAndEligibility(client, target);
          if (result.qualified) {
            qualifiedBusinessIds.add(target.businessId);
            const designations = sourceDesignationsByBusiness.get(target.businessId) ?? new Set<string>();
            target.candidate.ownershipDesignations.forEach((designation) => designations.add(designation));
            sourceDesignationsByBusiness.set(target.businessId, designations);
          } else noPresenceHoldCount += 1;
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
          officialSiteBlanks: blankedCount,
          officialSocialOnlyProfiles: socialOnlyCount,
          mapPinnedProfiles: 0,
          noPresenceHolds: noPresenceHoldCount,
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
