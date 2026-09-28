import { pool } from "@workspace/db";
import { sendPushToUser } from "../lib/pushNotifications.js";
import { createNotification } from "../routes/notifications-hub.js";
import type { CommunityBusinessSubmissionInput } from "./types";
import {
  SubmissionRepository,
  type PublishedDuplicate,
  type Queryable,
  type Submission,
} from "./submissionRepository";

const POSSIBLE_DUPLICATE_NOTE =
  "Possible duplicate: an existing public listing matched this submission. The member was shown that listing; an administrator can confirm the match or keep both records.";

export type PossibleDuplicateQueueResult = {
  submission: Submission;
  created: boolean;
  reviewItemId: string | null;
};

function finiteNumberOrNull(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Retains a member's duplicate report as an auditable review item without
 * creating a second public business profile. The canonical public listing is
 * returned to the member immediately; only an admin can decide to keep both.
 */
export async function queuePublishedDuplicateForReview(args: {
  repository: SubmissionRepository;
  input: CommunityBusinessSubmissionInput;
  submittedById: string;
  canonicalBusiness: PublishedDuplicate;
  database: Queryable;
}): Promise<PossibleDuplicateQueueResult> {
  const { repository, input, submittedById, canonicalBusiness, database } = args;
  const created = await repository.create(
    input,
    submittedById,
    database,
    "pending_review",
    POSSIBLE_DUPLICATE_NOTE,
  );

  if (!created.created) {
    return { submission: created.submission, created: false, reviewItemId: null };
  }

  const submission = await repository.markPossibleDuplicate(
    created.submission.id,
    canonicalBusiness.id,
    POSSIBLE_DUPLICATE_NOTE,
    database,
  );
  if (!submission) throw new Error("Possible duplicate submission could not be retained");

  await repository.logAuditEvent(
    submission.id,
    submittedById,
    "possible_duplicate_detected",
    `Matched existing public listing ${canonicalBusiness.id}`,
    database,
  );

  const review = await database.query<{ id: string }>(
    `INSERT INTO business_review_items
       (review_type, status, candidate_name, candidate_address, candidate_city,
        candidate_state, candidate_website, candidate_phone, candidate_latitude,
        candidate_longitude, candidate_category, candidate_source_provider,
        candidate_source_url, matched_business_id, reason, evidence)
     VALUES
       ('possible_duplicate', 'pending', $1, $2, $3, $4, $5, $6, $7, $8,
        $9, 'community_submission', $5, $10, $11, $12::jsonb)
     RETURNING id`,
    [
      input.name,
      input.address ?? "",
      input.city,
      input.state ?? "",
      input.website ?? null,
      input.phone ?? null,
      finiteNumberOrNull(input.latitude),
      finiteNumberOrNull(input.longitude),
      input.category,
      canonicalBusiness.id,
      POSSIBLE_DUPLICATE_NOTE,
      JSON.stringify({
        version: 1,
        source: "community_business_submission",
        submissionId: submission.id,
        canonicalBusinessId: canonicalBusiness.id,
        detection: "exact_public_identity_match",
      }),
    ],
  );

  return {
    submission,
    created: true,
    reviewItemId: review.rows[0]?.id ?? null,
  };
}

/**
 * Delivers an in-app notification to every current administrator and, where a
 * device token exists, a matching push notification. Delivery failure never
 * rolls back the retained review item or the contributor's visible result.
 */
export async function notifyAdministratorsOfPossibleDuplicate(args: {
  reviewItemId: string | null;
  canonicalBusiness: PublishedDuplicate;
  submittedBusinessName: string;
}): Promise<void> {
  const { reviewItemId, canonicalBusiness, submittedBusinessName } = args;
  if (!reviewItemId) return;

  try {
    const admins = await pool.query<{ id: string }>(
      "SELECT id FROM users WHERE role = 'admin'",
    );
    const title = "Possible duplicate business needs review";
    const body = `${submittedBusinessName} may match ${canonicalBusiness.name}. The member was shown the existing listing.`;
    const data = {
      type: "possible_business_duplicate",
      reviewItemId,
      canonicalBusinessId: canonicalBusiness.id,
      route: "/admin?tab=biz-review&filter=possible_duplicate",
    };

    await Promise.allSettled(
      admins.rows.flatMap((admin) => [
        createNotification(admin.id, {
          type: "business",
          title,
          body,
          entityId: reviewItemId,
          entityType: "business_review_item",
          data,
        }),
        sendPushToUser(admin.id, { title, body, data }),
      ]),
    );
  } catch {
    // The duplicate review record and contributor response remain durable even
    // if a best-effort notification provider is temporarily unavailable.
  }
}

export const POSSIBLE_DUPLICATE_MEMBER_MESSAGE =
  "We found an existing listing that may be the same business. You can view it now; we saved your report in Duplicates & review and alerted the administrators to confirm it. No second public listing was created.";
