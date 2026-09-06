import { pool } from "@workspace/db";
import { createHash, randomUUID } from "crypto";
import type { QueryResult, QueryResultRow } from "pg";
import type {
  CommunityBusinessSubmissionInput,
  CommunityReportedOwnership,
  SubmissionSocialProfiles,
} from "./types";

export type SubmissionStatus = "pending_review" | "published" | "declined" | "needs_info";

export interface Submission {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  address: string | null;
  city: string;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  social_profiles: SubmissionSocialProfiles;
  media_urls: string[];
  media_asset_ids: string[];
  ownership_designations: string[];
  community_reported_ownership: CommunityReportedOwnership;
  price_range: string | null;
  hours: string | null;
  tags: string[];
  latitude: string | null;
  longitude: string | null;
  provider_place_id: string | null;
  location_source: string | null;
  source_campaign: string | null;
  source_channel: string | null;
  submitter_note: string | null;
  client_request_id: string | null;
  request_payload_hash: string | null;
  submitted_by_id: string | null;
  status: SubmissionStatus;
  reviewed_by_id: string | null;
  review_note: string | null;
  matched_business_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubmissionResult {
  submission: Submission;
  created: boolean;
}

export interface PublishedDuplicate {
  id: string;
  name: string;
}

export interface DecisionInput {
  status: SubmissionStatus;
  reviewNote?: string;
  matchedBusinessId?: string;
}

export type Queryable = {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<QueryResult<T>>;
};

const SUBMISSION_COLUMNS = `
  id, name, category, subcategory, description, address, city, state,
  postal_code, country, website, phone, social_profiles, media_urls, media_asset_ids,
  ownership_designations, community_reported_ownership, price_range, hours, tags, latitude, longitude,
  provider_place_id, location_source, source_campaign, source_channel,
  submitter_note, client_request_id, request_payload_hash, submitted_by_id, status, reviewed_by_id,
  review_note, matched_business_id, created_at, updated_at
`;

function submissionIdentityKey(input: CommunityBusinessSubmissionInput): string {
  const normalized = [input.name, input.city, input.state ?? "", input.address ?? ""]
    .map((value) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim())
    .join("|");
  return createHash("sha256").update(normalized).digest("hex");
}

export function submissionPayloadHash(input: CommunityBusinessSubmissionInput): string {
  const { clientRequestId: _clientRequestId, ...payload } = input;
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export class SubmissionRepository {
  constructor(private readonly database: Queryable = pool) {}

  async findByClientRequest(
    submittedById: string,
    clientRequestId: string,
    database: Queryable = this.database,
  ): Promise<Submission | null> {
    const result = await database.query<Submission>(
      `SELECT ${SUBMISSION_COLUMNS}
       FROM community_business_submissions
       WHERE submitted_by_id = $1 AND client_request_id = $2
       LIMIT 1`,
      [submittedById, clientRequestId],
    );
    return result.rows[0] ?? null;
  }

  async findPublishedDuplicate(input: CommunityBusinessSubmissionInput): Promise<PublishedDuplicate | null> {
    const result = await this.database.query<PublishedDuplicate>(
      `SELECT id, name
       FROM public_businesses
       WHERE lower(trim(name)) = lower(trim($1))
         AND lower(trim(city)) = lower(trim($2))
         AND (
           NULLIF(trim($3), '') IS NULL
           OR NULLIF(trim(address), '') IS NULL
           OR lower(trim(address)) = lower(trim($3))
         )
       ORDER BY created_at ASC
       LIMIT 1`,
      [input.name, input.city, input.address ?? null],
    );
    return result.rows[0] ?? null;
  }

  private async validateOwnedMedia(
    submittedById: string,
    mediaUrls: string[],
    mediaAssetIds: string[],
    database: Queryable = this.database,
  ): Promise<void> {
    if (mediaUrls.length === 0 && mediaAssetIds.length === 0) return;
    const result = await database.query<{ id: string; public_url: string | null }>(
      `SELECT id, public_url
       FROM media_assets
       WHERE uploader_id = $1
         AND purpose = 'business_submission'
         AND status = 'ready'
         AND (id = ANY($2::uuid[]) OR public_url = ANY($3::text[]))`,
      [submittedById, mediaAssetIds, mediaUrls],
    );
    const ownedIds = new Set(result.rows.map((row) => row.id));
    const ownedUrls = new Set(result.rows.map((row) => row.public_url).filter(Boolean));
    if (
      mediaAssetIds.some((id) => !ownedIds.has(id))
      || mediaUrls.some((url) => !ownedUrls.has(url))
    ) {
      throw new Error("business submission media must reference your completed private uploads");
    }
  }

  private async findRetry(
    input: CommunityBusinessSubmissionInput,
    submittedById: string,
    database: Queryable = this.database,
  ): Promise<Submission | null> {
    if (input.clientRequestId) {
      const byRequest = await database.query<Submission>(
        `SELECT ${SUBMISSION_COLUMNS}
         FROM community_business_submissions
         WHERE submitted_by_id = $1 AND client_request_id = $2
         LIMIT 1`,
        [submittedById, input.clientRequestId],
      );
      if (byRequest.rows[0]) return byRequest.rows[0];
    }

    const byIdentity = await database.query<Submission>(
      `SELECT ${SUBMISSION_COLUMNS}
       FROM community_business_submissions
       WHERE submitted_by_id = $1
         AND lower(trim(name)) = lower(trim($2))
         AND lower(trim(city)) = lower(trim($3))
         AND lower(trim(COALESCE(state, ''))) = lower(trim(COALESCE($4, '')))
         AND lower(trim(COALESCE(address, ''))) = lower(trim(COALESCE($5, '')))
         AND status IN ('pending_review', 'needs_info')
       ORDER BY created_at DESC
       LIMIT 1`,
      [submittedById, input.name, input.city, input.state ?? null, input.address ?? null],
    );
    return byIdentity.rows[0] ?? null;
  }

  async create(
    input: CommunityBusinessSubmissionInput,
    submittedById: string,
    database: Queryable = this.database,
    initialStatus: "pending_review" | "needs_info" = "pending_review",
    initialReviewNote?: string,
  ): Promise<CreateSubmissionResult> {
    if (!submittedById) throw new Error("Authentication required");

    const retry = await this.findRetry(input, submittedById, database);
    if (retry) return { submission: retry, created: false };

    const mediaUrls = input.mediaUrls ?? [];
    const mediaAssetIds = input.mediaAssetIds ?? [];
    await this.validateOwnedMedia(submittedById, mediaUrls, mediaAssetIds, database);

    const id = randomUUID();
    const result = await database.query<Submission>(
        `INSERT INTO community_business_submissions
           (id, name, category, subcategory, description, address, city, state,
            postal_code, country, website, phone, social_profiles, media_urls, media_asset_ids,
            ownership_designations, community_reported_ownership, price_range, hours, tags, latitude, longitude,
            provider_place_id, location_source, source_campaign, source_channel,
            submitter_note, client_request_id, request_payload_hash, identity_key, submitted_by_id,
            status, review_note, created_at, updated_at)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,$16::jsonb,
            $17,$18,$19,$20::jsonb,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,
            $31,$32,$33,NOW(),NOW())
         ON CONFLICT DO NOTHING
         RETURNING ${SUBMISSION_COLUMNS}`,
        [
          id,
          input.name,
          input.category,
          input.subcategory ?? null,
          input.description ?? null,
          input.address ?? null,
          input.city,
          input.state ?? null,
          input.postalCode ?? null,
          input.country ?? null,
          input.website ?? null,
          input.phone ?? null,
          JSON.stringify(input.socialProfiles ?? {}),
          JSON.stringify(mediaUrls),
          JSON.stringify(mediaAssetIds),
          JSON.stringify(input.ownershipDesignations ?? []),
          input.communityReportedOwnership ?? "not_sure",
          input.priceRange ?? null,
          input.hours ?? null,
          JSON.stringify(input.tags ?? []),
          input.latitude ?? null,
          input.longitude ?? null,
          input.providerPlaceId ?? null,
          input.locationSource ?? "member_entered",
          input.sourceCampaign ?? null,
          input.sourceChannel ?? null,
          input.submitterNote ?? null,
          input.clientRequestId ?? null,
          submissionPayloadHash(input),
          submissionIdentityKey(input),
          submittedById,
          initialStatus,
          initialReviewNote ?? null,
        ],
    );
    if (result.rows[0]) return { submission: result.rows[0], created: true };
    const retryAfterConflict = await this.findRetry(input, submittedById, database);
    if (retryAfterConflict) return { submission: retryAfterConflict, created: false };
    throw new Error("Submission could not be created because its identity is already reserved");
  }

  async list(status?: string): Promise<Submission[]> {
    const query = status
      ? `SELECT ${SUBMISSION_COLUMNS} FROM community_business_submissions WHERE status = $1 ORDER BY created_at DESC`
      : `SELECT ${SUBMISSION_COLUMNS} FROM community_business_submissions ORDER BY created_at DESC`;
    const result = await this.database.query<Submission>(query, status ? [status] : []);
    return result.rows;
  }

  async listBySubmitter(submittedById: string): Promise<Submission[]> {
    const result = await this.database.query<Submission>(
      `SELECT ${SUBMISSION_COLUMNS}
       FROM community_business_submissions
       WHERE submitted_by_id = $1
       ORDER BY created_at DESC
       LIMIT 200`,
      [submittedById],
    );
    return result.rows;
  }

  async getById(id: string, database: Queryable = this.database): Promise<Submission | null> {
    const result = await database.query<Submission>(
      `SELECT ${SUBMISSION_COLUMNS}
       FROM community_business_submissions
       WHERE id = $1
       LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async getByIdForUpdate(id: string, database: Queryable): Promise<Submission | null> {
    const result = await database.query<Submission>(
      `SELECT ${SUBMISSION_COLUMNS}
       FROM community_business_submissions
       WHERE id = $1
       LIMIT 1
       FOR UPDATE`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async getOwnedById(id: string, submittedById: string): Promise<Submission | null> {
    const result = await this.database.query<Submission>(
      `SELECT ${SUBMISSION_COLUMNS}
       FROM community_business_submissions
       WHERE id = $1 AND submitted_by_id = $2
       LIMIT 1`,
      [id, submittedById],
    );
    return result.rows[0] ?? null;
  }

  async amendNeedsInfo(
    id: string,
    submittedById: string,
    input: CommunityBusinessSubmissionInput,
    database: Queryable = this.database,
    nextStatus: "pending_review" | "needs_info" = "pending_review",
    reviewNote?: string,
  ): Promise<Submission | null> {
    const mediaUrls = input.mediaUrls ?? [];
    const mediaAssetIds = input.mediaAssetIds ?? [];
    await this.validateOwnedMedia(submittedById, mediaUrls, mediaAssetIds, database);
    const result = await database.query<Submission>(
      `UPDATE community_business_submissions
       SET name = $3, category = $4, subcategory = $5, description = $6,
           address = $7, city = $8, state = $9, postal_code = $10,
           country = $11, website = $12, phone = $13,
           social_profiles = $14::jsonb, media_urls = $15::jsonb, media_asset_ids = $16::jsonb,
           ownership_designations = $17::jsonb, community_reported_ownership = $18,
           price_range = $19, hours = $20, tags = $21::jsonb,
           latitude = $22, longitude = $23, provider_place_id = $24,
           location_source = $25, source_campaign = $26, source_channel = $27,
           submitter_note = $28, identity_key = $29, status = $30, reviewed_by_id = NULL,
           review_note = $31,
           matched_business_id = NULL, updated_at = NOW()
       WHERE id = $1 AND submitted_by_id = $2 AND status = 'needs_info'
       RETURNING ${SUBMISSION_COLUMNS}`,
      [
        id,
        submittedById,
        input.name,
        input.category,
        input.subcategory ?? null,
        input.description ?? null,
        input.address ?? null,
        input.city,
        input.state ?? null,
        input.postalCode ?? null,
        input.country ?? null,
        input.website ?? null,
        input.phone ?? null,
        JSON.stringify(input.socialProfiles ?? {}),
        JSON.stringify(mediaUrls),
        JSON.stringify(mediaAssetIds),
        JSON.stringify(input.ownershipDesignations ?? []),
        input.communityReportedOwnership ?? "not_sure",
        input.priceRange ?? null,
        input.hours ?? null,
        JSON.stringify(input.tags ?? []),
        input.latitude ?? null,
        input.longitude ?? null,
        input.providerPlaceId ?? null,
        input.locationSource ?? "member_entered",
        input.sourceCampaign ?? null,
        input.sourceChannel ?? null,
        input.submitterNote ?? null,
        submissionIdentityKey(input),
        nextStatus,
        reviewNote ?? null,
      ],
    );
    return result.rows[0] ?? null;
  }

  async decide(
    id: string,
    reviewerId: string,
    decision: DecisionInput,
    database: Queryable = this.database,
  ): Promise<Submission | null> {
    const result = await database.query<Submission>(
      `UPDATE community_business_submissions
       SET status = $2, reviewed_by_id = $3, review_note = $4,
           matched_business_id = $5, updated_at = NOW()
       WHERE id = $1 AND status = 'pending_review'
       RETURNING ${SUBMISSION_COLUMNS}`,
      [
        id,
        decision.status,
        reviewerId,
        decision.reviewNote ?? null,
        decision.matchedBusinessId ?? null,
      ],
    );
    return result.rows[0] ?? null;
  }

  async finalizeAutomaticPublication(
    id: string,
    matchedBusinessId: string,
    reviewNote: string,
    database: Queryable,
  ): Promise<Submission | null> {
    const result = await database.query<Submission>(
      `UPDATE community_business_submissions
       SET status = 'published', reviewed_by_id = NULL, review_note = $3,
           matched_business_id = $2, updated_at = NOW()
       WHERE id = $1 AND status IN ('pending_review', 'needs_info')
       RETURNING ${SUBMISSION_COLUMNS}`,
      [id, matchedBusinessId, reviewNote],
    );
    return result.rows[0] ?? null;
  }

  async logAuditEvent(
    submissionId: string,
    actorId: string,
    eventType: string,
    note?: string,
    database: Queryable = this.database,
  ): Promise<void> {
    await database.query(
      `INSERT INTO business_submission_audit_events
         (id, submission_id, actor_id, event_type, note, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [randomUUID(), submissionId, actorId, eventType, note ?? null],
    );
  }
}
