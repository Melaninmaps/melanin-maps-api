import { type Express, type Request, type Response } from "express";
import { pool, db, businessesTable } from "@workspace/db";
import { validateSubmission } from "./types";
import { SubmissionRepository } from "./submissionRepository";
import type { Submission } from "./submissionRepository";

const repo = new SubmissionRepository();

// ── Geocode a location string via Google Maps ─────────────────────────────
async function geocodeBusiness(
  parts: (string | null | undefined)[],
): Promise<{ lat: string; lng: string }> {
  const query = parts.filter(Boolean).join(", ");
  const gmKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!gmKey || !query) return { lat: "0", lng: "0" };
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${gmKey}`;
    const resp = await fetch(url);
    const data = (await resp.json()) as any;
    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      return {
        lat: String(data.results[0].geometry.location.lat),
        lng: String(data.results[0].geometry.location.lng),
      };
    }
  } catch {
    /* geocoding failure is non-fatal */
  }
  return { lat: "0", lng: "0" };
}

// ── Publish a submission to the canonical businesses table ─────────────────
// Called by the founder's approve action. Creates a live_unclaimed business
// record from the submission data and marks the submission as approved.
async function publishFromSubmission(
  submission: Submission,
  reviewerId: string,
): Promise<string> {
  const { lat, lng } = await geocodeBusiness([
    submission.address,
    submission.city,
    submission.state,
    submission.country,
  ]);

  const resolvedState = submission.state ?? null;
  const resolvedCountry =
    submission.country ??
    (resolvedState && resolvedState.length <= 2 ? "USA" : null);

  const id = `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const insertValues: Record<string, unknown> = {
    id,
    name: submission.name,
    category: submission.category,
    subcategory: submission.subcategory ?? submission.category,
    description:
      submission.description ??
      `Community-submitted business in ${submission.city}${resolvedCountry && resolvedCountry !== "USA" ? `, ${resolvedCountry}` : ""}.`,
    address: submission.address ?? submission.city,
    city: submission.city,
    latitude: lat,
    longitude: lng,
    blackOwned: (submission.ownership_designations ?? []).includes("black-owned"),
    isReferenceOnly: false,
    status: "active",
    listingStatus: "live_unclaimed",
    verified: false,
    featured: false,
    promotionEligible: false,
    feedbackOptIn: false,
    submittedById: submission.submitted_by_id ?? reviewerId,
    ownershipDesignations: submission.ownership_designations ?? [],
    // Track that this came through the community submission pipeline
    addedVia: "community_submission",
    addedByMemberId: submission.submitted_by_id ?? reviewerId,
    ownerClaimStatus: "unclaimed",
  };

  if (resolvedState) insertValues.state = resolvedState;
  if (resolvedCountry) insertValues.country = resolvedCountry;
  if (submission.website) insertValues.website = submission.website;
  if (submission.phone) insertValues.phone = submission.phone;

  const [business] = await db
    .insert(businessesTable)
    .values(insertValues as any)
    .returning();

  // Queue a review item (approved immediately)
  await pool.query(
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
      resolvedState ?? "",
      submission.website ?? null,
      parseFloat(lat) || null,
      parseFloat(lng) || null,
      submission.category,
      "community_intake",
      business.id,
      `Approved from community submission ${submission.id} by admin ${reviewerId}`,
    ],
  );

  return business.id;
}

export function registerSubmissionRoutes(app: Express): void {
  // ── POST /api/community/business-submissions ────────────────────────────
  // Public — no authentication required.
  // Accepts a community member's business tip. Always starts as pending_review.
  // The business does NOT appear anywhere until the founder approves it.
  app.post(
    "/api/community/business-submissions",
    async (req: Request, res: Response) => {
      try {
        const input = validateSubmission(req.body);

        // Read source attribution from query params (social media links)
        const sourceChannel =
          input.sourceChannel ??
          (req.query["source"] as string | undefined) ??
          null;
        const sourceCampaign =
          input.sourceCampaign ??
          (req.query["campaign"] as string | undefined) ??
          null;

        const submission = await repo.create(
          { ...input, sourceChannel: sourceChannel ?? undefined, sourceCampaign: sourceCampaign ?? undefined },
          (req as any).user?.id,
        );

        // Audit log
        if ((req as any).user?.id) {
          await repo.logAuditEvent(
            submission.id,
            (req as any).user.id,
            "submitted",
          ).catch(() => {});
        }

        res.status(201).json({
          ok: true,
          submissionId: submission.id,
          message:
            "Thank you! Your submission is under review. We'll add it to the directory once verified.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid submission";
        if (msg.includes("required")) {
          res.status(400).json({ error: msg });
        } else {
          console.error("[submission-routes] POST error:", err);
          res.status(500).json({ error: "Failed to submit. Please try again." });
        }
      }
    },
  );

  // ── GET /api/founder/business-submissions ──────────────────────────────
  // Admin only — returns the pending review queue.
  app.get(
    "/api/founder/business-submissions",
    async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      if (user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const status = (req.query["status"] as string) || "pending_review";
      const submissions = await repo.list(status === "all" ? undefined : status);
      res.json({ submissions, total: submissions.length });
    },
  );

  // ── POST /api/founder/business-submissions/:id/decision ───────────────
  // Admin only — approve, decline, or request more info.
  // Approval triggers publishFromSubmission which creates the canonical
  // business record and makes it live on the map.
  app.post(
    "/api/founder/business-submissions/:id/decision",
    async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }
      if (user.role !== "admin") {
        res.status(403).json({ error: "Admin access required" });
        return;
      }

      const submissionId = req.params["id"];
      const { status, reviewNote } = req.body as {
        status: "approved" | "declined" | "needs_info";
        reviewNote?: string;
      };

      if (!["approved", "declined", "needs_info"].includes(status)) {
        res.status(400).json({
          error: "status must be one of: approved, declined, needs_info",
        });
        return;
      }

      const submission = await repo.getById(submissionId);
      if (!submission) {
        res.status(404).json({ error: "Submission not found" });
        return;
      }
      if (submission.status !== "pending_review") {
        res.status(409).json({
          error: `Submission is already ${submission.status}`,
        });
        return;
      }

      try {
        let businessId: string | undefined;

        if (status === "approved") {
          businessId = await publishFromSubmission(submission, user.id);
        }

        const updated = await repo.decide(submissionId, user.id, {
          status,
          reviewNote,
          matchedBusinessId: businessId,
        });

        await repo.logAuditEvent(
          submissionId,
          user.id,
          status,
          reviewNote,
        ).catch(() => {});

        res.json({
          ok: true,
          submission: updated,
          businessId,
          message:
            status === "approved"
              ? "Business published and now live on the map."
              : status === "declined"
              ? "Submission declined."
              : "More information requested from submitter.",
        });
      } catch (err: unknown) {
        console.error("[submission-routes] decision error:", err);
        res.status(500).json({ error: "Failed to process decision." });
      }
    },
  );
}
