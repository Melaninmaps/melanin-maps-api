import { type Express, type Request, type Response } from "express";
import { pool, db, businessesTable } from "@workspace/db";
import { randomUUID } from "crypto";

// ── Input validation ──────────────────────────────────────────────────────
export interface DirectBusinessInput {
  name: string;
  category: string;
  subcategory?: string;
  description?: string;
  address?: string;
  city: string;
  state?: string;
  country?: string;
  website?: string;
  phone?: string;
  ownershipDesignations?: string[];
  blackOwned?: boolean;
  mediaAssetUrls?: string[];
}

export function validateDirectBusiness(input: unknown): DirectBusinessInput {
  const body = input as Record<string, unknown>;

  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    throw new Error("name is required");
  }
  if (!body.category || typeof body.category !== "string" || !body.category.trim()) {
    throw new Error("category is required");
  }
  if (!body.city || typeof body.city !== "string" || !body.city.trim()) {
    throw new Error("city is required");
  }

  return {
    name: (body.name as string).trim(),
    category: (body.category as string).trim(),
    subcategory: typeof body.subcategory === "string" ? body.subcategory.trim() || undefined : undefined,
    description: typeof body.description === "string" ? body.description.trim() || undefined : undefined,
    address: typeof body.address === "string" ? body.address.trim() || undefined : undefined,
    city: (body.city as string).trim(),
    state: typeof body.state === "string" ? body.state.trim() || undefined : undefined,
    country: typeof body.country === "string" ? body.country.trim() || undefined : undefined,
    website: typeof body.website === "string" ? body.website.trim() || undefined : undefined,
    phone: typeof body.phone === "string" ? body.phone.trim() || undefined : undefined,
    ownershipDesignations: Array.isArray(body.ownershipDesignations)
      ? (body.ownershipDesignations as string[]).filter((s) => typeof s === "string")
      : [],
    blackOwned: Boolean(body.blackOwned),
    mediaAssetUrls: Array.isArray(body.mediaAssetUrls)
      ? (body.mediaAssetUrls as string[]).filter((s) => typeof s === "string")
      : [],
  };
}

// ── Geocoding helper ─────────────────────────────────────────────────────
async function geocode(
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
  } catch { /* non-fatal */ }
  return { lat: "0", lng: "0" };
}

export function registerAdminPublishAndClaimRoutes(app: Express): void {
  // ── POST /api/admin/businesses ─────────────────────────────────────────
  // Admin only — creates a business record that goes live immediately.
  // listing_status is set to live_unclaimed so the business appears in all
  // public views (map, directory, search) right away.
  app.post(
    "/api/admin/businesses",
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

      try {
        const input = validateDirectBusiness(req.body);
        const { lat, lng } = await geocode([
          input.address,
          input.city,
          input.state,
          input.country,
        ]);

        const resolvedState = input.state ?? null;
        const resolvedCountry =
          input.country ??
          (resolvedState && resolvedState.length <= 2 ? "USA" : null);

        const id = `place_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const designations = input.ownershipDesignations ?? [];
        if (input.blackOwned && !designations.includes("black-owned")) {
          designations.unshift("black-owned");
        }

        const insertValues: Record<string, unknown> = {
          id,
          name: input.name,
          category: input.category,
          subcategory: input.subcategory ?? input.category,
          description:
            input.description ??
            `${input.name} — ${input.category} in ${input.city}.`,
          address: input.address ?? input.city,
          city: input.city,
          latitude: lat,
          longitude: lng,
          blackOwned: input.blackOwned ?? designations.includes("black-owned"),
          isReferenceOnly: false,
          status: "active",
          listingStatus: "live_unclaimed",
          verified: false,
          featured: false,
          promotionEligible: false,
          feedbackOptIn: false,
          submittedById: user.id,
          ownershipDesignations: designations,
          addedVia: "admin_web",
          addedByMemberId: user.id,
          ownerClaimStatus: "unclaimed",
        };

        if (resolvedState) insertValues.state = resolvedState;
        if (resolvedCountry) insertValues.country = resolvedCountry;
        if (input.website) insertValues.website = input.website;
        if (input.phone) insertValues.phone = input.phone;

        // Attach uploaded media as the primary imageUrl if provided
        const mediaUrls = input.mediaAssetUrls ?? [];
        if (mediaUrls.length > 0) {
          insertValues.imageUrl = mediaUrls[0];
          if (mediaUrls.length > 1) {
            insertValues.photos = mediaUrls;
          }
        }

        const [business] = await db
          .insert(businessesTable)
          .values(insertValues as any)
          .returning();

        res.status(201).json({
          ok: true,
          businessId: business.id,
          slug: (business as any).slug ?? null,
          message: "Business published and live on the map.",
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Invalid input";
        if (msg.includes("required")) {
          res.status(400).json({ error: msg });
        } else {
          console.error("[admin-publish] error:", err);
          res.status(500).json({ error: "Failed to publish business." });
        }
      }
    },
  );

  // ── POST /api/businesses/:id/claim ────────────────────────────────────
  // Authenticated — any member can submit a claim on an unclaimed listing.
  // Creates a pending_verification claim request that the admin reviews.
  // The existing listing stays public while the claim is evaluated.
  app.post(
    "/api/businesses/:id/claim",
    async (req: Request, res: Response) => {
      const user = (req as any).user;
      if (!user?.id) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const businessId = req.params["id"];

      // Check business exists and is claimable
      const bizCheck = await pool.query<{
        id: string;
        name: string;
        owner_claim_status: string | null;
      }>(
        `SELECT id, name, owner_claim_status FROM businesses
         WHERE id = $1 AND status NOT IN ('removed','deleted') LIMIT 1`,
        [businessId],
      );

      if (bizCheck.rows.length === 0) {
        res.status(404).json({ error: "Business not found" });
        return;
      }

      const biz = bizCheck.rows[0];
      if (biz.owner_claim_status === "claimed") {
        res.status(409).json({
          error: "This listing has already been claimed by its owner.",
        });
        return;
      }

      // Check for an existing pending claim from this user
      const existingClaim = await pool.query(
        `SELECT id FROM business_claim_requests
         WHERE business_id = $1 AND claimant_member_id = $2
           AND status = 'pending_verification'
         LIMIT 1`,
        [businessId, user.id],
      );
      if (existingClaim.rows.length > 0) {
        res.status(409).json({
          error: "You already have a pending claim on this business.",
        });
        return;
      }

      const {
        claimantName,
        claimantTitle,
        claimantPhone,
        verificationNote,
        verificationUrls,
      } = req.body as {
        claimantName?: string;
        claimantTitle?: string;
        claimantPhone?: string;
        verificationNote?: string;
        verificationUrls?: string[];
      };

      const claimId = randomUUID();
      await pool.query(
        `INSERT INTO business_claim_requests
           (id, business_id, claimant_member_id, claimant_name, claimant_title,
            claimant_phone, verification_note, verification_files,
            status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,'pending_verification',NOW(),NOW())`,
        [
          claimId,
          businessId,
          user.id,
          claimantName ?? null,
          claimantTitle ?? null,
          claimantPhone ?? null,
          verificationNote ?? null,
          JSON.stringify(verificationUrls ?? []),
        ],
      );

      // Update business claim status
      await pool.query(
        `UPDATE businesses SET owner_claim_status = 'pending_verification', updated_at = NOW()
         WHERE id = $1`,
        [businessId],
      ).catch(() => {
        // Column may not exist yet on older schema — non-fatal
      });

      res.status(201).json({
        ok: true,
        claimId,
        message:
          "Your claim is under review. We'll reach out within a few business days.",
      });
    },
  );

  // ── POST /api/admin/business-claims/:claimId/decision ─────────────────
  // Admin only — approve or reject a business ownership claim.
  // Approval sets owner_claim_status = 'claimed' and links the member.
  app.post(
    "/api/admin/business-claims/:claimId/decision",
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

      const claimId = req.params["claimId"];
      const { status, reviewNote } = req.body as {
        status: "approved" | "rejected";
        reviewNote?: string;
      };

      if (!["approved", "rejected"].includes(status)) {
        res.status(400).json({ error: "status must be approved or rejected" });
        return;
      }

      const claim = await pool.query<{
        id: string;
        business_id: string;
        claimant_member_id: string;
        status: string;
      }>(
        `SELECT id, business_id, claimant_member_id, status
         FROM business_claim_requests WHERE id = $1 LIMIT 1`,
        [claimId],
      );

      if (claim.rows.length === 0) {
        res.status(404).json({ error: "Claim not found" });
        return;
      }

      const claimRow = claim.rows[0];
      if (claimRow.status !== "pending_verification") {
        res.status(409).json({
          error: `Claim is already ${claimRow.status}`,
        });
        return;
      }

      await pool.query(
        `UPDATE business_claim_requests
         SET status = $2, reviewed_by_id = $3, review_note = $4, updated_at = NOW()
         WHERE id = $1`,
        [claimId, status, user.id, reviewNote ?? null],
      );

      if (status === "approved") {
        await pool.query(
          `UPDATE businesses
           SET owner_claim_status = 'claimed',
               claimed_owner_member_id = $2,
               updated_at = NOW()
           WHERE id = $1`,
          [claimRow.business_id, claimRow.claimant_member_id],
        ).catch(() => {});

        // Reject all other pending claims on the same business
        await pool.query(
          `UPDATE business_claim_requests
           SET status = 'rejected', review_note = 'Another claim was approved.',
               updated_at = NOW()
           WHERE business_id = $1 AND id != $2 AND status = 'pending_verification'`,
          [claimRow.business_id, claimId],
        ).catch(() => {});
      } else {
        await pool.query(
          `UPDATE businesses
           SET owner_claim_status = 'unclaimed', updated_at = NOW()
           WHERE id = $1 AND owner_claim_status = 'pending_verification'`,
          [claimRow.business_id],
        ).catch(() => {});
      }

      res.json({
        ok: true,
        status,
        message:
          status === "approved"
            ? "Claim approved. The business owner now has access."
            : "Claim rejected.",
      });
    },
  );
}
