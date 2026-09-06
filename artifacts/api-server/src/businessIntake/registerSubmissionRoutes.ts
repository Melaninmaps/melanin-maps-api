import {
  type Express,
  type Request,
  type RequestHandler,
  type Response,
} from "express";
import { isBlackOwned as hasBlackOwnedDesignation, pool } from "@workspace/db";
import type { PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { requireApprovedMember } from "../middlewares/requireAuth";
import { businessSubmissionLimiter } from "../middleware/rateLimiter";
import { dedupeKey, normalizeText } from "../lib/business-dedup";
import { validateSubmission } from "./types";
import {
  SubmissionRepository,
  submissionPayloadHash,
  type Submission,
} from "./submissionRepository";
import {
  assessCommunityPublication,
  automaticPublicationReviewNote,
  isValidPinCoordinates,
  locationNeedsInformationAssessment,
  ownershipClaimValue,
  publicationCandidateFromInput,
  publicationCandidateFromSubmission,
  resolvePreciseBusinessLocation,
  type ResolvedBusinessLocation,
} from "./communityPublicationPolicy";

interface TransactionPool {
  connect(): Promise<PoolClient>;
}

interface RouteDependencies {
  repository?: SubmissionRepository;
  transactionPool?: TransactionPool;
  approvedMemberMiddleware?: RequestHandler;
  resolveLocation?: typeof resolvePreciseBusinessLocation;
}

class RouteError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

function requestUser(req: Request): { id: string; role?: string } | null {
  const user = req.user as { id?: string; role?: string } | undefined;
  return user?.id ? { id: user.id, role: user.role } : null;
}

function adminOnly(req: Request, res: Response): { id: string; role?: string } | null {
  const user = requestUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    return null;
  }
  if (user.role !== "admin") {
    res.status(403).json({ error: "Admin access required", code: "ADMIN_REQUIRED" });
    return null;
  }
  return user;
}

function invalidSubmissionMessage(error: unknown): string | null {
  const message = error instanceof Error ? error.message : "";
  return /required|must be|invalid|unsupported|accepts at most|too long|completed business submission uploads|completed private uploads/i.test(message)
    ? message
    : null;
}

function memberSubmission(submission: Submission): Omit<Submission, "reviewed_by_id" | "submitted_by_id" | "client_request_id" | "request_payload_hash"> {
  const {
    reviewed_by_id: _reviewedById,
    submitted_by_id: _submittedById,
    client_request_id: _clientRequestId,
    request_payload_hash: _requestPayloadHash,
    ...safe
  } = submission;
  return safe;
}

function sendIdempotentSubmission(
  res: Response,
  submission: Submission,
  expectedPayloadHash: string,
): void {
  if (!submission.request_payload_hash) {
    res.status(409).json({
      error: "This older idempotency key cannot be replayed safely. Start a new submission.",
      code: "IDEMPOTENCY_PAYLOAD_UNVERIFIABLE",
    });
    return;
  }
  if (submission.request_payload_hash !== expectedPayloadHash) {
    res.status(409).json({
      error: "This idempotency key was already used for different business information.",
      code: "IDEMPOTENCY_PAYLOAD_MISMATCH",
    });
    return;
  }
  const published = submission.status === "published";
  res.status(200).json({
    ok: true,
    submissionId: submission.id,
    businessId: submission.matched_business_id ?? undefined,
    status: submission.status,
    publicationOutcome: published ? "published" : submission.status,
    mapPin: published,
    duplicateRetry: true,
    message: published
      ? "This submission already published as a community-listed, unclaimed, not verified map listing."
      : submission.review_note ?? "This submission is already saved. It was not submitted twice.",
  });
}

function websiteHost(website: string | null): string | null {
  if (!website) return null;
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Called only inside the same transaction that finalizes a submission. The
// resulting record is community-listed and unclaimed; publication is neither
// ownership authority nor business/identity verification. Submission media
// remains private until its separate moderation path completes.
async function publishFromSubmission(
  submission: Submission,
  actorId: string,
  client: PoolClient,
  coordinates: ResolvedBusinessLocation,
): Promise<string> {
  if (!isValidPinCoordinates(coordinates.lat, coordinates.lng)) {
    throw new RouteError(409, "PRECISE_LOCATION_REQUIRED", "A precise non-zero location is required before publication.");
  }
  const resolvedCountry = submission.country
    ?? (submission.state && submission.state.length <= 2 ? "USA" : null);
  const socialProfiles = Object.entries(submission.social_profiles ?? {}).map(([platform, url]) => ({
    platform,
    url,
    handle: null,
    suppliedByUser: true,
  }));
  const sourceEvidence: Array<{
    url: string | null;
    sourceType: string;
    field: string;
    supports: boolean;
    excerpt: string;
  }> = [
    submission.website,
    ...Object.values(submission.social_profiles ?? {}),
  ].filter((url): url is string => Boolean(url)).map((url) => ({
    url,
    sourceType: "community_supplied_public_link",
    field: "business_identity",
    supports: true,
    excerpt: "Community supplied for directory publication; not ownership verification.",
  }));
  sourceEvidence.push({
    url: null,
    sourceType: coordinates.source,
    field: "precise_location",
    supports: true,
    excerpt: coordinates.formattedAddress ?? "Server-confirmed precise street address.",
  });
  const businessId = randomUUID();
  const canonicalDedupeKey = dedupeKey({
    name: submission.name,
    city: submission.city,
    state: submission.state,
    address: submission.address,
    latitude: coordinates.lat,
    longitude: coordinates.lng,
  });
  const publicationLockKey = dedupeKey({
    name: submission.name,
    city: submission.city,
    state: submission.state,
    address: submission.address,
  });

  // Serialize contenders for the same identity and re-check inside the same
  // transaction that publishes. The unique dedupe index remains the final
  // database-level guard.
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [publicationLockKey]);
  const duplicate = await client.query<{ id: string; name: string }>(
    `SELECT id, name
     FROM businesses
     WHERE coalesce(is_duplicate, false) = false
       AND coalesce(status, 'active') NOT IN ('duplicate','permanently_hidden')
       AND (
         dedupe_key = $1
         OR (
           lower(trim(name)) = lower(trim($2))
           AND lower(trim(city)) = lower(trim($3))
           AND (
             NULLIF(trim($4), '') IS NULL
             OR NULLIF(trim(address), '') IS NULL
             OR lower(trim(address)) = lower(trim($4))
           )
         )
       )
     LIMIT 1`,
    [canonicalDedupeKey, submission.name, submission.city, submission.address ?? null],
  );
  if (duplicate.rows[0]) {
    throw new RouteError(
      409,
      "BUSINESS_ALREADY_LISTED",
      "A matching business is already published. This submission was not published.",
      { businessId: duplicate.rows[0].id },
    );
  }

  const identityClaim = await client.query<{ business_id: string }>(
    `INSERT INTO business_publication_identities (identity_key, business_id, created_at)
     VALUES ($1,$2,NOW())
     ON CONFLICT (identity_key) DO NOTHING
     RETURNING business_id`,
    [publicationLockKey, businessId],
  );
  if (!identityClaim.rows[0]) {
    const winner = await client.query<{ business_id: string }>(
      `SELECT business_id FROM business_publication_identities WHERE identity_key = $1`,
      [publicationLockKey],
    );
    throw new RouteError(
      409,
      "BUSINESS_ALREADY_LISTED",
      "A matching business was published concurrently. This submission was not published.",
      { businessId: winner.rows[0]?.business_id },
    );
  }

  const result = await client.query<{ id: string }>(
    `INSERT INTO businesses
       (id, name, category, subcategory, description, address, city, state, country,
        postal_code, latitude, longitude, phone, website, website_domain, hours,
        price_range, tags, image_url, photos, pending_photos, videos,
        instagram, tiktok, facebook, youtube, social_profiles, source_evidence,
        ownership_designations, verified_designations, ownership_claim, black_owned, verified,
        featured, promotion_eligible, feedback_opt_in, status, listing_status,
        business_status, profile_status, owner_claim_status, submitted_by_id,
        added_by_member_id, added_via, data_source, provider_place_id,
        normalized_name, dedupe_key, source_provider, source_record_id, published_at,
        created_at, updated_at)
     VALUES
       ($1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,
        $17,$18::jsonb,NULL,'[]'::jsonb,'[]'::jsonb,'[]'::jsonb,
        $19,$20,$21,$22,$23::jsonb,$24::jsonb,
        $25::jsonb,'[]'::jsonb,$26,$27,false,
        false,false,false,'active','live_unclaimed',
        'community','community_listed','unclaimed',NULL,
        $28,'community_submission','community_submission',$29,
        $30,$31,'community_submission',$32,NOW(),
        NOW(),NOW())
     RETURNING id`,
    [
      businessId,
      submission.name,
      submission.category,
      submission.subcategory ?? submission.category,
      submission.description ?? `Community-listed business in ${submission.city}.`,
      submission.address ?? submission.city,
      submission.city,
      submission.state,
      resolvedCountry,
      submission.postal_code,
      coordinates.lat,
      coordinates.lng,
      submission.phone,
      submission.website,
      websiteHost(submission.website),
      submission.hours,
      submission.price_range,
      JSON.stringify(submission.tags ?? []),
      submission.social_profiles?.instagram ?? null,
      submission.social_profiles?.tiktok ?? null,
      submission.social_profiles?.facebook ?? null,
      submission.social_profiles?.youtube ?? null,
      JSON.stringify(socialProfiles),
      JSON.stringify(sourceEvidence),
      JSON.stringify(submission.ownership_designations ?? []),
      ownershipClaimValue(submission),
      hasBlackOwnedDesignation(submission.ownership_designations ?? []),
      submission.submitted_by_id ?? actorId,
      null,
      normalizeText(submission.name),
      canonicalDedupeKey,
      submission.id,
    ],
  );

  await client.query(
    `INSERT INTO canonical_record_locations
       (record_type, record_id, city_name, state_code, neighborhood_name,
        latitude, longitude, is_primary, created_at, updated_at)
     VALUES ('business',$1,$2,$3,NULL,$4,$5,TRUE,NOW(),NOW())
     ON CONFLICT (record_type, record_id, city_name, COALESCE(state_code, ''), COALESCE(neighborhood_name, ''))
     DO UPDATE SET
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       is_primary = TRUE,
       updated_at = NOW()`,
    [
      result.rows[0].id,
      submission.city.trim().toLowerCase(),
      submission.state?.trim().toUpperCase() ?? "",
      Number(coordinates.lat),
      Number(coordinates.lng),
    ],
  );

  await client.query(
    `INSERT INTO business_review_items
       (review_type, status, candidate_name, candidate_address, candidate_city,
        candidate_state, candidate_website, candidate_latitude, candidate_longitude,
        candidate_category, candidate_source_provider, matched_business_id, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      "community_submission",
      "approved",
      submission.name,
      submission.address ?? submission.city,
      submission.city,
      submission.state ?? "",
      submission.website,
      Number(coordinates.lat),
      Number(coordinates.lng),
      submission.category,
      coordinates.source,
      result.rows[0].id,
      `Published from community submission ${submission.id} by objective automatic checks; actor ${actorId}; location source ${coordinates.source}`,
    ],
  );

  return result.rows[0].id;
}

export function registerSubmissionRoutes(
  app: Express,
  dependencies: RouteDependencies = {},
): void {
  const repository = dependencies.repository ?? new SubmissionRepository();
  const transactionPool = dependencies.transactionPool ?? pool;
  const approvedMember = dependencies.approvedMemberMiddleware ?? requireApprovedMember;
  const resolveLocation = dependencies.resolveLocation ?? resolvePreciseBusinessLocation;

  // Approved members and testers only. Ordinary submissions with complete
  // evidence publish atomically as unclaimed/not verified. Objective holds
  // stay private; no founder click is required for an eligible bakery, shop,
  // restaurant, salon, or other ordinary business.
  app.post(
    "/api/community/business-submissions",
    approvedMember,
    businessSubmissionLimiter,
    async (req: Request, res: Response) => {
      let client: PoolClient | null = null;
      try {
        const body = req.body as Record<string, unknown>;
        const input = validateSubmission({
          ...body,
          clientRequestId: body.clientRequestId ?? req.header("idempotency-key"),
          sourceChannel: body.sourceChannel ?? req.query["source"],
          sourceCampaign: body.sourceCampaign ?? req.query["campaign"],
        });
        if (!input.clientRequestId) {
          throw new RouteError(
            400,
            "IDEMPOTENCY_KEY_REQUIRED",
            "A unique submission request ID is required. Please try again from the form.",
          );
        }

        const user = requestUser(req)!;
        const payloadHash = submissionPayloadHash(input);
        if (input.clientRequestId) {
          const retry = await repository.findByClientRequest(user.id, input.clientRequestId);
          if (retry) {
            sendIdempotentSubmission(res, retry, payloadHash);
            return;
          }
        }

        const publishedDuplicate = await repository.findPublishedDuplicate(input);
        if (publishedDuplicate) {
          res.status(409).json({
            error: "This business is already listed in the directory.",
            code: "BUSINESS_ALREADY_LISTED",
            businessId: publishedDuplicate.id,
          });
          return;
        }

        let assessment = assessCommunityPublication(publicationCandidateFromInput(input));
        let preparedLocation: ResolvedBusinessLocation | null = null;
        if (assessment.outcome === "eligible") {
          preparedLocation = await resolveLocation(publicationCandidateFromInput(input));
          if (!preparedLocation) assessment = locationNeedsInformationAssessment();
        }

        client = await transactionPool.connect();
        await client.query("BEGIN");
        const result = await repository.create(
          input,
          user.id,
          client,
          assessment.submissionStatus,
          assessment.auditNote,
        );

        if (!result.created) {
          await client.query("COMMIT");
          sendIdempotentSubmission(res, result.submission, payloadHash);
          return;
        }

        await repository.logAuditEvent(result.submission.id, user.id, "submitted", undefined, client);

        let status = result.submission.status;
        let businessId: string | undefined;
        let message = assessment.publicMessage;
        let mapPin = false;
        let publicationOutcome: string = assessment.outcome;

        if (assessment.outcome === "eligible" && preparedLocation) {
          const stored = await repository.getByIdForUpdate(result.submission.id, client)
            ?? result.submission;
          businessId = await publishFromSubmission(stored, user.id, client, preparedLocation);
          const reviewNote = automaticPublicationReviewNote(preparedLocation);
          const published = await repository.finalizeAutomaticPublication(
            stored.id,
            businessId,
            reviewNote,
            client,
          );
          if (!published) {
            throw new RouteError(409, "SUBMISSION_STATE_CHANGED", "The submission changed before publication; no partial listing was created.");
          }
          await repository.logAuditEvent(stored.id, user.id, "automatic_published", reviewNote, client);
          status = "published";
          publicationOutcome = "published";
          mapPin = true;
          message = "Published on the map as community-listed, unclaimed, and not verified.";
        } else {
          await repository.logAuditEvent(
            result.submission.id,
            user.id,
            `automatic_hold_${assessment.outcome}`,
            assessment.auditNote,
            client,
          );
        }

        await client.query("COMMIT");
        if (result.created) {
          req.log?.info({ submissionId: result.submission.id, publicationOutcome }, "Community business submission processed");
        }

        res.status(201).json({
          ok: true,
          submissionId: result.submission.id,
          businessId,
          status,
          publicationOutcome,
          mapPin,
          duplicateRetry: false,
          message,
        });
      } catch (error: unknown) {
        if (client) await client.query("ROLLBACK").catch(() => undefined);
        if (error instanceof RouteError) {
          res.status(error.statusCode).json({ error: error.message, code: error.code, ...error.details });
          return;
        }
        const validationMessage = invalidSubmissionMessage(error);
        if (validationMessage) {
          res.status(400).json({ error: validationMessage, code: "INVALID_SUBMISSION" });
          return;
        }
        req.log?.error({ err: error }, "Failed to create community business submission");
        res.status(500).json({ error: "Failed to submit. Please try again." });
      } finally {
        client?.release();
      }
    },
  );

  app.get(
    "/api/community/business-submissions/mine",
    approvedMember,
    async (req: Request, res: Response) => {
      try {
        const submissions = await repository.listBySubmitter(requestUser(req)!.id);
        res.json({ submissions: submissions.map(memberSubmission), total: submissions.length });
      } catch (error: unknown) {
        req.log?.error({ err: error }, "Failed to list member business submissions");
        res.status(500).json({ error: "Failed to load your submissions." });
      }
    },
  );

  app.patch(
    "/api/community/business-submissions/:id",
    approvedMember,
    async (req: Request, res: Response) => {
      const user = requestUser(req)!;
      const submissionId = String(req.params.id);
      let client: PoolClient | null = null;
      try {
        const body = req.body as Record<string, unknown>;
        const input = validateSubmission({
          ...body,
          sourceChannel: body.sourceChannel ?? "member_needs_info_resubmission",
        });
        const publishedDuplicate = await repository.findPublishedDuplicate(input);
        if (publishedDuplicate) {
          res.status(409).json({
            error: "This business is already listed in the directory.",
            code: "BUSINESS_ALREADY_LISTED",
            businessId: publishedDuplicate.id,
          });
          return;
        }

        let assessment = assessCommunityPublication(publicationCandidateFromInput(input));
        let preparedLocation: ResolvedBusinessLocation | null = null;
        if (assessment.outcome === "eligible") {
          preparedLocation = await resolveLocation(publicationCandidateFromInput(input));
          if (!preparedLocation) assessment = locationNeedsInformationAssessment();
        }

        client = await transactionPool.connect();
        await client.query("BEGIN");
        const amended = await repository.amendNeedsInfo(
          submissionId,
          user.id,
          input,
          client,
          assessment.submissionStatus,
          assessment.auditNote,
        );
        if (!amended) {
          throw new RouteError(
            409,
            "SUBMISSION_NOT_AMENDABLE",
            "Only your own submission awaiting more information can be resubmitted.",
          );
        }
        await repository.logAuditEvent(submissionId, user.id, "member_resubmitted", undefined, client);

        let status = amended.status;
        let businessId: string | undefined;
        let publicationOutcome: string = assessment.outcome;
        let mapPin = false;
        let message = assessment.publicMessage;
        if (assessment.outcome === "eligible" && preparedLocation) {
          businessId = await publishFromSubmission(amended, user.id, client, preparedLocation);
          const reviewNote = automaticPublicationReviewNote(preparedLocation);
          const published = await repository.finalizeAutomaticPublication(
            amended.id,
            businessId,
            reviewNote,
            client,
          );
          if (!published) {
            throw new RouteError(409, "SUBMISSION_STATE_CHANGED", "The submission changed before publication; no partial listing was created.");
          }
          await repository.logAuditEvent(amended.id, user.id, "automatic_published", reviewNote, client);
          status = "published";
          publicationOutcome = "published";
          mapPin = true;
          message = "Published on the map as community-listed, unclaimed, and not verified.";
        } else {
          await repository.logAuditEvent(
            amended.id,
            user.id,
            `automatic_hold_${assessment.outcome}`,
            assessment.auditNote,
            client,
          );
        }

        await client.query("COMMIT");
        res.json({
          ok: true,
          submissionId,
          businessId,
          status,
          publicationOutcome,
          mapPin,
          message,
        });
      } catch (error: unknown) {
        if (client) await client.query("ROLLBACK").catch(() => undefined);
        if (error instanceof RouteError) {
          res.status(error.statusCode).json({ error: error.message, code: error.code, ...error.details });
          return;
        }
        const validationMessage = invalidSubmissionMessage(error);
        if (validationMessage) {
          res.status(400).json({ error: validationMessage, code: "INVALID_SUBMISSION" });
          return;
        }
        if (error && typeof error === "object" && (error as { code?: string }).code === "23505") {
          res.status(409).json({
            error: "A matching submission is already pending review.",
            code: "SUBMISSION_ALREADY_PENDING",
          });
          return;
        }
        req.log?.error({ err: error }, "Failed to amend community business submission");
        res.status(500).json({ error: "Failed to update your submission." });
      } finally {
        client?.release();
      }
    },
  );

  app.get(
    "/api/community/business-submissions/:id",
    approvedMember,
    async (req: Request, res: Response) => {
      try {
        const submission = await repository.getOwnedById(String(req.params.id), requestUser(req)!.id);
        if (!submission) {
          res.status(404).json({ error: "Submission not found" });
          return;
        }
        res.json({ submission: memberSubmission(submission) });
      } catch (error: unknown) {
        req.log?.error({ err: error }, "Failed to load member business submission");
        res.status(500).json({ error: "Failed to load your submission." });
      }
    },
  );

  app.get(
    "/api/founder/business-submissions",
    async (req: Request, res: Response) => {
      if (!adminOnly(req, res)) return;
      try {
        const requestedStatus = String(req.query["status"] ?? "pending_review");
        const status = requestedStatus === "approved" ? "published" : requestedStatus;
        const submissions = await repository.list(status === "all" ? undefined : status);
        res.json({ submissions, total: submissions.length });
      } catch (error: unknown) {
        req.log?.error({ err: error }, "Failed to load founder business submissions");
        res.status(500).json({ error: "Failed to load submissions." });
      }
    },
  );

  // Publication and submission status transition commit in one transaction.
  app.post(
    "/api/founder/business-submissions/:id/decision",
    async (req: Request, res: Response) => {
      const admin = adminOnly(req, res);
      if (!admin) return;

      const submissionId = String(req.params.id);
      const requestedStatus = (req.body as { status?: string }).status;
      const rawReviewNote = (req.body as { reviewNote?: unknown }).reviewNote;
      const reviewNote = typeof rawReviewNote === "string"
        ? rawReviewNote.trim().slice(0, 2_000) || undefined
        : undefined;
      const status = requestedStatus === "approved" ? "published" : requestedStatus;
      if (!status || !["published", "declined", "needs_info"].includes(status)) {
        res.status(400).json({
          error: "status must be one of: published, declined, needs_info",
          code: "INVALID_DECISION",
        });
        return;
      }

      let client: PoolClient | null = null;
      try {
        const preflightSubmission = await repository.getById(submissionId);
        if (!preflightSubmission) {
          throw new RouteError(404, "SUBMISSION_NOT_FOUND", "Submission not found");
        }
        const preflightAssessment = assessCommunityPublication(
          publicationCandidateFromSubmission(preflightSubmission),
        );
        if (status === "published" && preflightAssessment.outcome !== "eligible") {
          throw new RouteError(
            409,
            "PUBLICATION_HELD",
            preflightAssessment.publicMessage,
            { publicationOutcome: preflightAssessment.outcome },
          );
        }
        const preparedLocation = status === "published"
          ? await resolveLocation(publicationCandidateFromSubmission(preflightSubmission))
          : null;
        if (status === "published" && !preparedLocation) {
          throw new RouteError(
            409,
            "PRECISE_LOCATION_REQUIRED",
            "A precise non-zero address location is required before publication; no fallback pin was created.",
          );
        }

        client = await transactionPool.connect();
        await client.query("BEGIN");
        const submission = await repository.getByIdForUpdate(submissionId, client);
        if (!submission) {
          throw new RouteError(404, "SUBMISSION_NOT_FOUND", "Submission not found");
        }
        if (submission.status !== "pending_review") {
          throw new RouteError(
            409,
            "SUBMISSION_ALREADY_DECIDED",
            `Submission is already ${submission.status}`,
          );
        }
        const lockedAssessment = assessCommunityPublication(
          publicationCandidateFromSubmission(submission),
        );
        if (status === "published" && lockedAssessment.outcome !== "eligible") {
          throw new RouteError(
            409,
            "PUBLICATION_HELD",
            lockedAssessment.publicMessage,
            { publicationOutcome: lockedAssessment.outcome },
          );
        }

        let businessId: string | undefined;
        if (status === "published") {
          businessId = await publishFromSubmission(submission, admin.id, client, preparedLocation!);
        }

        const updated = await repository.decide(
          submissionId,
          admin.id,
          { status: status as "published" | "declined" | "needs_info", reviewNote, matchedBusinessId: businessId },
          client,
        );
        if (!updated) {
          throw new RouteError(409, "SUBMISSION_ALREADY_DECIDED", "Submission was already decided");
        }

        await repository.logAuditEvent(submissionId, admin.id, status, reviewNote, client);
        await client.query("COMMIT");

        res.json({
          ok: true,
          submission: updated,
          businessId,
          message: status === "published"
            ? "Community-listed, unclaimed business published. This does not mark it verified."
            : status === "declined"
            ? "Submission declined."
            : "More information requested from the submitter.",
        });
      } catch (error: unknown) {
        if (client) await client.query("ROLLBACK").catch(() => undefined);
        if (error instanceof RouteError) {
          res.status(error.statusCode).json({ error: error.message, code: error.code, ...error.details });
          return;
        }
        req.log?.error({ err: error }, "Failed to process business submission decision");
        res.status(500).json({ error: "Failed to process decision." });
      } finally {
        client?.release();
      }
    },
  );
}
