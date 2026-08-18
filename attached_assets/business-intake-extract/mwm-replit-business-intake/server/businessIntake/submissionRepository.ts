import { randomUUID } from "crypto";
import type { Pool } from "pg";
import type { CommunityBusinessSubmissionInput, SubmissionStatus } from "./types";

export interface ApprovedBusinessPublisher {
  publishFromSubmission(submissionId: string, reviewerId: string): Promise<string>;
}

export class SubmissionRepository {
  constructor(private readonly pool: Pool) {}

  async create(input: CommunityBusinessSubmissionInput, memberId?: string) {
    const id = randomUUID();
    const submissionCode = `MWM-${Date.now().toString(36).toUpperCase()}-${id.slice(0, 5).toUpperCase()}`;
    await this.pool.query(
      `INSERT INTO community_business_submissions (
        id, submission_code, submitter_member_id, submitter_name, submitter_email, business_name, business_description, primary_category, specialties, community_tags,
        owner_name, owner_role, owner_identity_text, location_label, address_line1, city, state_region, postal_code, country_code, phone, email, website_url, instagram_handle, facebook_url, tiktok_handle, source, source_campaign
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
      [id, submissionCode, memberId ?? null, input.submitterName ?? null, input.submitterEmail ?? null, input.businessName, input.businessDescription, input.primaryCategory, input.specialties ?? [], input.communityTags ?? [], input.ownerName ?? null, input.ownerRole ?? null, input.ownerIdentityText ?? null, input.locationLabel ?? null, input.addressLine1 ?? null, input.city ?? null, input.stateRegion ?? null, input.postalCode ?? null, input.countryCode ?? "US", input.phone ?? null, input.email ?? null, input.websiteUrl ?? null, input.instagramHandle ?? null, input.facebookUrl ?? null, input.tiktokHandle ?? null, input.source ?? "website", input.sourceCampaign ?? null],
    );
    await this.event(id, "submitted", memberId, { source: input.source ?? "website" });
    return { id, submissionCode, status: "pending_review" as const };
  }

  async list(status: SubmissionStatus = "pending_review") {
    const { rows } = await this.pool.query(`SELECT * FROM community_business_submissions WHERE status = $1 ORDER BY created_at ASC`, [status]);
    return rows;
  }

  async decide(submissionId: string, reviewerId: string, status: Extract<SubmissionStatus, "approved" | "declined" | "needs_more_info">, reviewNote?: string, publisher?: ApprovedBusinessPublisher) {
    await this.pool.query("BEGIN");
    try {
      let publishedBusinessId: string | null = null;
      if (status === "approved") {
        if (!publisher) throw new Error("APPROVED_BUSINESS_PUBLISHER_REQUIRED");
        publishedBusinessId = await publisher.publishFromSubmission(submissionId, reviewerId);
      }
      const { rowCount } = await this.pool.query(
        `UPDATE community_business_submissions SET status=$3, review_note=$4, reviewed_by=$2, reviewed_at=now(), published_business_id=coalesce($5, published_business_id), updated_at=now() WHERE id=$1 AND status='pending_review'`,
        [submissionId, reviewerId, status, reviewNote ?? null, publishedBusinessId],
      );
      if (rowCount !== 1) throw new Error("SUBMISSION_NOT_PENDING");
      await this.event(submissionId, status, reviewerId, { reviewNote, publishedBusinessId });
      if (publishedBusinessId) await this.event(submissionId, "published", reviewerId, { publishedBusinessId });
      await this.pool.query("COMMIT");
      return { status, publishedBusinessId };
    } catch (error) { await this.pool.query("ROLLBACK"); throw error; }
  }

  private async event(submissionId: string, eventType: string, actorMemberId: string | undefined, detail: Record<string, unknown>) {
    await this.pool.query(`INSERT INTO business_submission_audit_events (id, submission_id, event_type, actor_member_id, detail) VALUES ($1,$2,$3,$4,$5)`, [randomUUID(), submissionId, eventType, actorMemberId ?? null, detail]);
  }
}
