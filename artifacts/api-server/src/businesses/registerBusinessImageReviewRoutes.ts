import { randomUUID } from "crypto";
import type { Express, Request, Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import {
  BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION,
  attachEligibleBusinessImages,
  classifyImageAuditReasons,
  ensureBusinessImageEvidenceSchema,
  receiptSourceMatchesCurrentBusinessIdentity,
  type BusinessImageReceiptBusiness,
  validateBusinessImageReceipt,
} from "./businessImageEligibility";

type AuditAsset = {
  business_id: string;
  business_name: string;
  image_url: string;
  usage_count: string | number;
  receipt_status: string | null;
  receipt_source_type: string | null;
  receipt_source_url: string | null;
  website: string | null;
  instagram: string | null;
  tiktok: string | null;
  facebook: string | null;
};

function actorId(req: Request): string | null {
  const id = (req as any).user?.id;
  return typeof id === "string" && id.trim() ? id.trim() : null;
}

function parseLimit(value: unknown, fallback = 100): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : fallback;
  return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 500) : fallback;
}

async function loadBusinessForReceipt(businessId: string): Promise<BusinessImageReceiptBusiness | null> {
  const result = await pool.query<BusinessImageReceiptBusiness>(
    `SELECT id, image_url AS "imageUrl", photos, website, instagram, tiktok, facebook
       FROM businesses
      WHERE id = $1
      LIMIT 1`,
    [businessId],
  );
  return result.rows[0] ?? null;
}

/**
 * These controls add receipts to existing media; they never replace or delete
 * legacy business image fields. Public serialization remains fail-closed until
 * a receipt is approved, and revocation immediately suppresses the image.
 */
export function registerBusinessImageReviewRoutes(app: Express): void {
  app.get("/api/admin/business-image-audit", async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    try {
      await ensureBusinessImageEvidenceSchema(pool);
      const limit = parseLimit(req.query.limit);
      const result = await pool.query<AuditAsset>(
        `WITH raw_assets AS (
           SELECT b.id AS business_id, b.name AS business_name, b.image_url
             FROM businesses b
            WHERE NULLIF(TRIM(COALESCE(b.image_url, '')), '') IS NOT NULL
           UNION
           SELECT b.id AS business_id, b.name AS business_name, image.url AS image_url
             FROM businesses b
             CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(b.photos, '[]'::jsonb)) AS image(url)
            WHERE NULLIF(TRIM(image.url), '') IS NOT NULL
         ), deduplicated_assets AS (
           SELECT DISTINCT business_id, business_name, image_url FROM raw_assets
         ), usage AS (
           SELECT image_url, COUNT(*) AS usage_count
             FROM deduplicated_assets
            GROUP BY image_url
         )
         SELECT asset.business_id, asset.business_name, asset.image_url, usage.usage_count,
                receipt.status AS receipt_status,
                receipt.source_type AS receipt_source_type,
                receipt.source_url AS receipt_source_url,
                b.website, b.instagram, b.tiktok, b.facebook
           FROM deduplicated_assets asset
           JOIN usage ON usage.image_url = asset.image_url
           JOIN businesses b ON b.id = asset.business_id
           LEFT JOIN business_image_evidence_receipts receipt
             ON receipt.business_id = asset.business_id
            AND receipt.image_url = asset.image_url
          ORDER BY asset.business_name ASC, asset.image_url ASC
          LIMIT $1`,
        [limit],
      );
      const assets = result.rows.map((asset) => {
        const hasApprovedReceipt = asset.receipt_status === "approved";
        const sourceIdentityMatchesCurrentOfficial = hasApprovedReceipt && asset.receipt_source_type
          ? receiptSourceMatchesCurrentBusinessIdentity({
              id: asset.business_id,
              website: asset.website,
              instagram: asset.instagram,
              tiktok: asset.tiktok,
              facebook: asset.facebook,
            }, asset.receipt_source_type as "business_owner_upload" | "official_business_website" | "official_business_social" | "approved_member_visit", asset.receipt_source_url)
          : null;
        const reasons = classifyImageAuditReasons({
          imageUrl: asset.image_url,
          usageCount: Number(asset.usage_count),
          hasApprovedReceipt,
          receiptSourceMatchesCurrentOfficialIdentity: sourceIdentityMatchesCurrentOfficial ?? undefined,
        });
        return {
          businessId: asset.business_id,
          businessName: asset.business_name,
          imageUrl: asset.image_url,
          usageCount: Number(asset.usage_count),
          receiptStatus: asset.receipt_status ?? "missing",
          receiptSourceType: asset.receipt_source_type,
          receiptSourceUrl: asset.receipt_source_url,
          sourceIdentityMatchesCurrentOfficial,
          publicDisposition: hasApprovedReceipt && reasons.length === 0 ? "eligible" : "suppressed",
          reasons,
        };
      });
      const summary = assets.reduce<Record<string, number>>((counts, asset) => {
        for (const reason of asset.reasons) counts[reason] = (counts[reason] ?? 0) + 1;
        return counts;
      }, {});
      res.json({
        policyVersion: BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION,
        auditedAt: new Date().toISOString(),
        sampledAssets: assets.length,
        summary,
        assets,
      });
    } catch (error) {
      req.log.error({ error }, "Business image audit failed");
      res.status(500).json({ error: "Unable to audit business images" });
    }
  });

  app.post("/api/admin/businesses/:businessId/image-receipts", async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    try {
      await ensureBusinessImageEvidenceSchema(pool);
      const business = await loadBusinessForReceipt(String(req.params.businessId));
      if (!business) {
        res.status(404).json({ error: "Business not found" });
        return;
      }
      const sourceType = req.body?.sourceType;
      // Owner/member provenance must come from their authenticated upload flows,
      // not be asserted retroactively by an administrator.
      if (sourceType === "business_owner_upload" || sourceType === "approved_member_visit") {
        res.status(400).json({
          error: "Owner and member receipt types can only be created by their authenticated upload flows",
        });
        return;
      }
      const receipt = validateBusinessImageReceipt(business, {
        imageUrl: req.body?.imageUrl,
        sourceType,
        sourceUrl: req.body?.sourceUrl,
        sourceLabel: req.body?.sourceLabel,
      });
      const id = randomUUID();
      const reviewerId = actorId(req);
      await pool.query(
        `INSERT INTO business_image_evidence_receipts
           (id, business_id, image_url, source_type, source_url, source_label,
            reviewed_by_user_id, status, policy_version, reviewed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8, NOW())
         ON CONFLICT (business_id, image_url) DO UPDATE SET
           source_type = EXCLUDED.source_type,
           source_url = EXCLUDED.source_url,
           source_label = EXCLUDED.source_label,
           reviewed_by_user_id = EXCLUDED.reviewed_by_user_id,
           status = 'approved',
           policy_version = EXCLUDED.policy_version,
           rejection_or_revocation_reason = NULL,
           reviewed_at = NOW(),
           updated_at = NOW()`,
        [id, business.id, receipt.imageUrl, receipt.sourceType, receipt.sourceUrl, receipt.sourceLabel, reviewerId, BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION],
      );
      await pool.query(
        `INSERT INTO business_image_audit_events
           (business_id, image_url, action, reason, actor_user_id, details)
         VALUES ($1, $2, 'receipt_approved', 'source_receipt_approved', $3, $4::jsonb)`,
        [business.id, receipt.imageUrl, reviewerId, JSON.stringify({ sourceType: receipt.sourceType, sourceUrl: receipt.sourceUrl })],
      );
      res.status(201).json({
        businessId: business.id,
        imageUrl: receipt.imageUrl,
        status: "approved",
        policyVersion: BUSINESS_IMAGE_ELIGIBILITY_POLICY_VERSION,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to create image receipt";
      res.status(400).json({ error: message });
    }
  });

  app.patch("/api/admin/businesses/:businessId/image-receipts/revoke", async (req: Request, res: Response) => {
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }
    const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : "";
    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 500) : "";
    if (!imageUrl || !reason) {
      res.status(400).json({ error: "imageUrl and a revocation reason are required" });
      return;
    }
    try {
      await ensureBusinessImageEvidenceSchema(pool);
      const businessId = String(req.params.businessId);
      const reviewerId = actorId(req);
      const result = await pool.query(
        `UPDATE business_image_evidence_receipts
            SET status = 'revoked', rejection_or_revocation_reason = $1,
                reviewed_by_user_id = $2, reviewed_at = NOW(), updated_at = NOW()
          WHERE business_id = $3 AND image_url = $4
          RETURNING id`,
        [reason, reviewerId, businessId, imageUrl],
      );
      if (!result.rows.length) {
        res.status(404).json({ error: "Image receipt not found" });
        return;
      }
      await pool.query(
        `INSERT INTO business_image_audit_events
           (business_id, image_url, action, reason, actor_user_id)
         VALUES ($1, $2, 'receipt_revoked', $3, $4)`,
        [businessId, imageUrl, reason, reviewerId],
      );
      res.json({ businessId, imageUrl, status: "revoked" });
    } catch (error) {
      req.log.error({ error }, "Business image receipt revocation failed");
      res.status(500).json({ error: "Unable to revoke image receipt" });
    }
  });

  // Exported via the registered routes for human review; used by the public
  // surfaces below only through the shared fail-closed eligibility helper.
  void attachEligibleBusinessImages;
}
