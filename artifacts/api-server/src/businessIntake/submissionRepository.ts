import { pool } from "@workspace/db";
import { randomUUID } from "crypto";
import type { CommunityBusinessSubmissionInput } from "./types";

export interface Submission {
  id: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  address: string | null;
  city: string;
  state: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  ownership_designations: string[];
  source_campaign: string | null;
  source_channel: string | null;
  submitter_note: string | null;
  submitted_by_id: string | null;
  status: "pending_review" | "approved" | "declined" | "needs_info";
  reviewed_by_id: string | null;
  review_note: string | null;
  matched_business_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DecisionInput {
  status: "approved" | "declined" | "needs_info";
  reviewNote?: string;
  matchedBusinessId?: string;
}

export class SubmissionRepository {
  async create(
    input: CommunityBusinessSubmissionInput,
    submittedById?: string,
  ): Promise<Submission> {
    const id = randomUUID();
    const result = await pool.query<Submission>(
      `INSERT INTO community_business_submissions
         (id, name, category, subcategory, description, address, city, state, country,
          website, phone, ownership_designations, source_campaign, source_channel,
          submitter_note, submitted_by_id, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,
               'pending_review', NOW(), NOW())
       RETURNING *`,
      [
        id,
        input.name,
        input.category,
        input.subcategory ?? null,
        input.description ?? null,
        input.address ?? null,
        input.city,
        input.state ?? null,
        input.country ?? null,
        input.website ?? null,
        input.phone ?? null,
        JSON.stringify(input.ownershipDesignations ?? []),
        input.sourceCampaign ?? null,
        input.sourceChannel ?? null,
        input.submitterNote ?? null,
        submittedById ?? null,
      ],
    );
    return result.rows[0];
  }

  async list(status?: string): Promise<Submission[]> {
    const q = status
      ? `SELECT * FROM community_business_submissions WHERE status = $1 ORDER BY created_at DESC`
      : `SELECT * FROM community_business_submissions ORDER BY created_at DESC`;
    const result = await pool.query<Submission>(q, status ? [status] : []);
    return result.rows;
  }

  async getById(id: string): Promise<Submission | null> {
    const result = await pool.query<Submission>(
      `SELECT * FROM community_business_submissions WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async decide(
    id: string,
    reviewerId: string,
    decision: DecisionInput,
  ): Promise<Submission | null> {
    const result = await pool.query<Submission>(
      `UPDATE community_business_submissions
       SET status = $2, reviewed_by_id = $3, review_note = $4,
           matched_business_id = $5, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
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
  ): Promise<void> {
    await pool.query(
      `INSERT INTO business_submission_audit_events
         (id, submission_id, actor_id, event_type, note, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW())`,
      [randomUUID(), submissionId, actorId, eventType, note ?? null],
    );
  }
}
