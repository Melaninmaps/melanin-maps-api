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
import { dedupeKey, normalizeText } from "../lib/business-dedup";
import { validateSubmission } from "./types";
import {
  SubmissionRepository,
  type Submission,
} from "./submissionRepository";

interface TransactionPool {
  connect(): Promise<PoolClient>;
}

interface RouteDependencies {
  repository?: SubmissionRepository;
  transactionPool?: TransactionPool;
  approvedMemberMiddleware?: RequestHandler;
  geocode?: typeof geocodeBusiness;
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
  return /required|must be|invalid|unsupported|accepts at most|too long|completed business submission uploads/i.test(message)
    ? message
    : null;
}

function memberSubmission(submission: Submission): Omit<Submission, "reviewed_by_id" | "submitted_by_id" | "client_request_id"> {
  const {
    reviewed_by_id: _reviewedById,
    submitted_by_id: _submittedById,
    client_request_id: _clientRequestId,
    ...safe
  } = submission;
  return safe;
}

// ── Geocode a location string via Google Maps ─────────────────────────────
async function geocodeBusiness(
  parts: (string | null | undefined)[],
): Promise<{ lat: string; lng: string }> {
  const query = parts.filter(Boolean).join(", ");
  const gmKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!gmKey || !query) return { lat: "0", lng: "0" };
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${gmKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    const data = (await response.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };
    const location = data.results?.[0]?.geometry?.location;
    if (data.status === "OK" && typeof location?.lat === "number" && typeof location.lng === "number") {
      return { lat: String(location.lat), lng: String(location.lng) };
    }
  } catch {
    // Geocoding failure is non-fatal. The review queue retains the address.
  }
  return { lat: "0", lng: "0" };
}

function websiteHost(website: string | null): string | null {
  if (!website) return null;
  try {
    return new URL(website).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function resolveSubmissionCoordinates(
  submission: Submission,
  geocode: typeof geocodeBusiness,
): Promise<{ lat: string; lng: string }> {
  if (submission.latitude !== null && submission.longitude !== null) {
    return { lat: submission.latitude, lng: submission.longitude };
  }
  return geocode([
    submission.address,
    submission.city,
    submission.state,
    submission.postal_code,
    submission.country,
  ]);
}

// Called only inside the founder decision transaction. The resulting record is
// community-listed and unclaimed; approval to publish is not ownership or
// business verification. Submission media remains in the private review record
// so an unclaimed profile continues to use the truthful category icon plate.
async function publishFromSubmission(
  submission: Submission,
  reviewerId: string,
  client: PoolClient,
  coordinates: { lat: string; lng: string },
): Promise<string> {
  const resolvedCountry = submission.country
    ?? (submission.state && submission.state.length <= 2 ? "USA" : null);
  const socialProfiles = Object.entries(submission.social_profiles ?? {}).map(([platform, url]) => ({
    platform,
    url,
    handle: null,
    suppliedByUser: true,
  }));
  const sourceEvidence = [{
    url: submission.website ?? null,
    sourceType: "user_supplied",
    field: "identity",
    supports: true,
    excerpt: "Community supplied and administrator reviewed for directory publication; not ownership verification.",
  }];
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

  const result = await client.query<{ id: string }>(
    `INSERT INTO businesses
       (id, name, category, subcategory, description, address, city, state, country,
        postal_code, latitude, longitude, phone, website, website_domain, hours,
        price_range, tags, image_url, photos, pending_photos, videos,
        instagram, tiktok, facebook, youtube, social_profiles, source_evidence,
        ownership_designations, verified_designations, black_owned, verified,
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
        $25::jsonb,'[]'::jsonb,$26,false,
        false,false,false,'active','live_unclaimed',
        'community','community_listed','unclaimed',NULL,
        $27,'community_submission','community_submission',$28,
        $29,$30,'community_submission',$31,NOW(),
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
      hasBlackOwnedDesignation(submission.ownership_designations ?? []),
      submission.submitted_by_id ?? reviewerId,
      submission.provider_place_id,
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
      Number(coordinates.lat) || null,
      Number(coordinates.lng) || null,
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
      Number(coordinates.lat) || null,
      Number(coordinates.lng) || null,
      submission.category,
      submission.location_source ?? "community_intake",
      result.rows[0].id,
      `Published from community submission ${submission.id} by admin ${reviewerId}`,
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
  const geocode = dependencies.geocode ?? geocodeBusiness;

  // Approved members and testers only. Every proposal begins pending_review;
  // no canonical business is created by this route.
  app.post(
    "/api/community/business-submissions",
    approvedMember,
    async (req: Request, res: Response) => {
      try {
        const body = req.body as Record<string, unknown>;
        const input = validateSubmission({
          ...body,
          clientRequestId: body.clientRequestId ?? req.header("idempotency-key"),
          sourceChannel: body.sourceChannel ?? req.query["source"],
          sourceCampaign: body.sourceCampaign ?? req.query["campaign"],
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

        const user = requestUser(req)!;
        const result = await repository.create(input, user.id);
        if (result.created) {
          await repository.logAuditEvent(result.submission.id, user.id, "submitted").catch(() => undefined);
        }

        res.status(result.created ? 201 : 200).json({
          ok: true,
          submissionId: result.submission.id,
          status: result.submission.status,
          duplicateRetry: !result.created,
          message: result.created
            ? "Your business was submitted for review. It is not public yet."
            : "This submission is already in review. It was not submitted twice.",
        });
      } catch (error: unknown) {
        const validationMessage = invalidSubmissionMessage(error);
        if (validationMessage) {
          res.status(400).json({ error: validationMessage, code: "INVALID_SUBMISSION" });
          return;
        }
        req.log?.error({ err: error }, "Failed to create community business submission");
        res.status(500).json({ error: "Failed to submit. Please try again." });
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

        const amended = await repository.amendNeedsInfo(submissionId, user.id, input);
        if (!amended) {
          res.status(409).json({
            error: "Only your own submission awaiting more information can be resubmitted.",
            code: "SUBMISSION_NOT_AMENDABLE",
          });
          return;
        }
        await repository.logAuditEvent(submissionId, user.id, "member_resubmitted");
        res.json({
          ok: true,
          submissionId,
          status: amended.status,
          message: "Your updated submission is back in pending review and is not public.",
        });
      } catch (error: unknown) {
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
        const preparedCoordinates = status === "published"
          ? await resolveSubmissionCoordinates(preflightSubmission, geocode)
          : null;

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

        let businessId: string | undefined;
        if (status === "published") {
          businessId = await publishFromSubmission(submission, admin.id, client, preparedCoordinates!);
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
