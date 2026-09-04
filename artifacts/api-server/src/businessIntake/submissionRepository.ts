import { pool } from "@workspace/db";
import { createHash, randomUUID } from "crypto";
import type { QueryResult, QueryResultRow } from "pg";
import type { CommunityBusinessSubmissionInput, SubmissionSocialProfiles } from "./types";

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
  ownership_designations: string[];
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
  postal_code, country, website, phone, social_profiles, media_urls,
  ownership_designations, price_range, hours, tags, latitude, longitude,
  provider_place_id, location_source, source_campaign, source_channel,
  submitter_note, client_request_id, submitted_by_id, status, reviewed_by_id,
  review_note, matched_business_id, created_at, updated_at
`;

function isUniqueViolation(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "23505");
}

function submissionIdentityKey(input: CommunityBusinessSubmissionInput): string {
  const normalized = [input.name, input.city, input.state ?? "", input.address ?? ""]
    .map((value) => value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim())
    .join("|");
  return createHash("sha256").update(normalized).digest("hex");
}

export class SubmissionRepository {
  constructor(private readonly database: Queryable = pool) {}

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
  ): Promise<void> {
    if (mediaUrls.length === 0) return;
    const result = await this.database.query<{ public_url: string }>(
      `SELECT public_url
       FROM media_assets
       WHERE uploader_id = $1
         AND purpose = 'business_submission'
         AND status = 'ready'
         AND public_url = ANY($2::text[])`,
      [submittedById, mediaUrls],
    );
    const owned = new Set(result.rows.map((row) => row.public_url));
    if (mediaUrls.some((url) => !owned.has(url))) {
      throw new Error("mediaUrls must reference your completed business submission uploads");
    }
  }

  private async findRetry(
    input: CommunityBusinessSubmissionInput,
    submittedById: string,
  ): Promise<Submission | null> {
    if (input.clientRequestId) {
      const byRequest = await this.database.query<Submission>(
        `SELECT ${SUBMISSION_COLUMNS}
         FROM community_business_submissions
         WHERE submitted_by_id = $1 AND client_request_id = $2
         LIMIT 1`,
        [submittedById, input.clientRequestId],
      );
      if (byRequest.rows[0]) return byRequest.rows[0];
    }

    const byIdentity = await this.database.query<Submission>(
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
  ): Promise<CreateSubmissionResult> {
    if (!submittedById) throw new Error("Authentication required");

    const retry = await this.findRetry(input, submittedById);
    if (retry) return { submission: retry, created: false };

    const mediaUrls = input.mediaUrls ?? [];
    await this.validateOwnedMedia(submittedById, mediaUrls);

    const id = randomUUID();
    try {
      const result = await this.database.query<Submission>(
        `INSERT INTO community_business_submissions
           (id, name, category, subcategory, description, address, city, state,
            postal_code, country, website, phone, social_profiles, media_urls,
            ownership_designations, price_range, hours, tags, latitude, longitude,
            provider_place_id, location_source, source_campaign, source_channel,
            submitter_note, client_request_id, identity_key, submitted_by_id,
            status, created_at, updated_at)
         VALUES
           ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb,$15::jsonb,
            $16,$17,$18::jsonb,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,
            'pending_review',NOW(),NOW())
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
          JSON.stringify(input.ownershipDesignations ?? []),
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
          submissionIdentityKey(input),
          submittedById,
        ],
      );
      return { submission: result.rows[0], created: true };
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        const retryAfterConflict = await this.findRetry(input, submittedById);
        if (retryAfterConflict) return { submission: retryAfterConflict, created: false };
      }
      throw error;
    }
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
  ): Promise<Submission | null> {
    const mediaUrls = input.mediaUrls ?? [];
    await this.validateOwnedMedia(submittedById, mediaUrls);
    const result = await this.database.query<Submission>(
      `UPDATE community_business_submissions
       SET name = $3, category = $4, subcategory = $5, description = $6,
           address = $7, city = $8, state = $9, postal_code = $10,
           country = $11, website = $12, phone = $13,
           social_profiles = $14::jsonb, media_urls = $15::jsonb,
           ownership_designations = $16::jsonb, price_range = $17,
           hours = $18, tags = $19::jsonb, latitude = $20, longitude = $21,
           provider_place_id = $22, location_source = $23,
           source_campaign = $24, source_channel = $25, submitter_note = $26,
           identity_key = $27, status = 'pending_review', reviewed_by_id = NULL,
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
        JSON.stringify(input.ownershipDesignations ?? []),
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
