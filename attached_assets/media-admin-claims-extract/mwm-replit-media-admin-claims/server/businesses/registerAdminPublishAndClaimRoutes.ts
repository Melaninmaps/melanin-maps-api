import { randomUUID } from "crypto";
import type { Express, NextFunction, Request, Response } from "express";
import type { Pool } from "pg";
import { validateDirectBusiness, type DirectBusinessInput } from "./validateBusinessInput";

type RequestWithMember = Request & { member?: { id: string; role: string } };
type DirectBusinessPublisher = { publishDirect(input: DirectBusinessInput, actor: { id: string; role: string }, mediaAssetIds: string[]): Promise<{ businessId: string; slug: string }> };
const admin = (request: RequestWithMember) => { if (!request.member || !["founder", "admin"].includes(request.member.role)) throw Object.assign(new Error("ADMIN_ACCESS_REQUIRED"), { status: 403 }); return request.member; };

export function registerAdminPublishAndClaimRoutes(app: Express, pool: Pool, publisher: DirectBusinessPublisher) {
  app.post("/api/admin/businesses", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try {
      const actor = admin(request); const input = validateDirectBusiness(request.body); const mediaAssetIds = Array.isArray(request.body?.mediaAssetIds) ? request.body.mediaAssetIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 12) : [];
      const published = await publisher.publishDirect(input, actor, mediaAssetIds);
      return response.status(201).json({ ...published, status: "published", ownerClaimStatus: "unclaimed" });
    } catch (error) { return next(error); }
  });

  app.post("/api/businesses/:businessId/claim", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try {
      if (!request.member) throw Object.assign(new Error("AUTH_REQUIRED"), { status: 401 });
      const { claimantName, claimantEmail, claimantPhone, claimantRole, verificationMessage, mediaAssetIds = [] } = request.body ?? {};
      if (![claimantName, claimantEmail, claimantRole].every((value) => typeof value === "string" && value.trim())) throw Object.assign(new Error("CLAIMANT_DETAILS_REQUIRED"), { status: 400 });
      const { rows } = await pool.query(`SELECT id FROM businesses WHERE id=$1 AND owner_claim_status IN ('unclaimed','rejected')`, [request.params.businessId]);
      if (!rows[0]) throw Object.assign(new Error("BUSINESS_NOT_CLAIMABLE"), { status: 409 });
      const claimId = randomUUID();
      await pool.query(`INSERT INTO business_claim_requests (id,business_id,claimant_member_id,claimant_name,claimant_email,claimant_phone,claimant_role,verification_message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [claimId, request.params.businessId, request.member.id, claimantName.trim(), claimantEmail.trim().toLowerCase(), typeof claimantPhone === "string" ? claimantPhone.trim() : null, claimantRole.trim(), typeof verificationMessage === "string" ? verificationMessage.trim().slice(0, 2000) : null]);
      await pool.query(`UPDATE businesses SET owner_claim_status='pending_verification' WHERE id=$1`, [request.params.businessId]);
      for (const assetId of mediaAssetIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 6)) await pool.query(`INSERT INTO entity_media_assets (entity_type,entity_id,media_asset_id) VALUES ('business_claim',$1,$2) ON CONFLICT DO NOTHING`, [claimId, assetId]);
      return response.status(201).json({ claimId, status: "pending_verification", message: "Your claim was received and will be reviewed." });
    } catch (error) { return next(error); }
  });

  app.post("/api/admin/business-claims/:claimId/decision", async (request: RequestWithMember, response: Response, next: NextFunction) => {
    try {
      const actor = admin(request); const decision = request.body?.decision;
      if (!["approved", "rejected", "needs_more_info"].includes(decision)) throw Object.assign(new Error("VALID_CLAIM_DECISION_REQUIRED"), { status: 400 });
      await pool.query("BEGIN");
      const { rows } = await pool.query(`SELECT business_id, claimant_member_id FROM business_claim_requests WHERE id=$1 AND status='pending_verification' FOR UPDATE`, [request.params.claimId]);
      if (!rows[0]) throw Object.assign(new Error("CLAIM_NOT_PENDING"), { status: 409 });
      await pool.query(`UPDATE business_claim_requests SET status=$2,reviewed_by_member_id=$3,reviewed_at=now(),review_note=$4,updated_at=now() WHERE id=$1`, [request.params.claimId, decision, actor.id, typeof request.body?.reviewNote === "string" ? request.body.reviewNote.slice(0,1500) : null]);
      if (decision === "approved") await pool.query(`UPDATE businesses SET owner_claim_status='claimed',claimed_owner_member_id=$2 WHERE id=$1`, [rows[0].business_id, rows[0].claimant_member_id]);
      else if (decision === "rejected") await pool.query(`UPDATE businesses SET owner_claim_status='rejected' WHERE id=$1`, [rows[0].business_id]);
      await pool.query("COMMIT"); return response.json({ status: decision });
    } catch (error) { await pool.query("ROLLBACK").catch(() => undefined); return next(error); }
  });
}
