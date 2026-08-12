/**
 * Business ownership claims — authoritative implementation.
 *
 * Architecture rules (permanent):
 *  - Claiming ≠ Verification. Approving a claim sets ownership_control_status = 'claimed'
 *    and profile_status = 'claimed'. It does NOT set verified = true.
 *  - Verification (verified=true, verified_designations) is a separate, independent
 *    process that the MWM team controls.
 *  - Admin approval MUST go through POST /admin/business-claims/:id/approve.
 *    The legacy PATCH /admin/claims/:id endpoint now explicitly blocks setting
 *    status='approved' and redirects callers to the transactional endpoint.
 *  - community_impact.ts had a competing POST /businesses/:id/claim which created
 *    owner links directly without evidence/validation — that route has been removed.
 *
 * All admin endpoints require isAdmin() — never just req.user?.id.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth.js";
import { sendClaimReceived, sendClaimApproved } from "../lib/email.js";

const router: IRouter = Router();

// ── GET /businesses/claim-candidates ─────────────────────────────────────────
// Disambiguation helper: show every listing matching name+city+state so the
// claimant can confirm which one is theirs by address.
router.get("/businesses/claim-candidates", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { name, city, state } = req.query as Record<string, string>;
  if (!name || !city || !state) {
    res.status(400).json({ error: "name, city, and state are required" }); return;
  }
  try {
    const { rows } = await pool.query(
      `SELECT id, name, address, city, state, listing_status, ownership_control_status, category, description, phone, website
       FROM businesses
       WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2) AND LOWER(state) = LOWER($3)
       ORDER BY address ASC`,
      [name.trim(), city.trim(), state.trim()]
    );
    res.json({
      candidates: rows,
      count: rows.length,
      message: rows.length > 1
        ? `Found ${rows.length} listings named "${name}" in ${city}. Please confirm which one is yours by matching the address.`
        : rows.length === 1
          ? "Found 1 listing. Please confirm this is your business before claiming."
          : `No listings found for "${name}" in ${city}, ${state}. If this is a new business, please submit it first.`,
    });
  } catch (err) {
    req.log.error({ err }, "claim-candidates failed");
    res.status(500).json({ error: "Failed to find claim candidates" });
  }
});

// ── GET /businesses/:id/claim-eligibility ─────────────────────────────────────
// Public endpoint — returns one of 6 safe eligibility states.
// Unauthenticated visitors receive not_claimable with a sign-in prompt (never
// a 401 — this is intentional, the prompt is rendered client-side as static copy).
router.get("/businesses/:id/claim-eligibility", async (req: Request, res: Response) => {
  const businessId = String(req.params.id);
  const userId = req.user?.id ?? null;

  try {
    const { rows: bizRows } = await pool.query(
      `SELECT id, status, listing_status,
              COALESCE(ownership_control_status,
                CASE WHEN listing_status = 'live_claimed' THEN 'claimed' ELSE 'unclaimed' END
              ) AS ocs,
              COALESCE(publication_status,
                CASE WHEN status = 'active' THEN 'live' ELSE 'pending_review' END
              ) AS pub
       FROM businesses WHERE id = $1`,
      [businessId]
    );

    if (!bizRows[0]) {
      res.json({ eligibility: "not_found", message: "We could not find this business. Use 'Add a place' to submit a real listing." });
      return;
    }

    const biz = bizRows[0];

    // Not currently a live listing
    if (biz.pub !== "live" && biz.status !== "active") {
      res.json({ eligibility: "not_claimable", message: "This listing is not currently eligible for claim." });
      return;
    }

    // Already has a confirmed active owner link
    const { rows: ownerLinks } = await pool.query(
      `SELECT id FROM business_owner_links
       WHERE business_id = $1 AND status = 'approved' AND (revoked_at IS NULL) AND role = 'owner'
       LIMIT 1`,
      [businessId]
    );
    if (biz.ocs === "claimed" || ownerLinks.length > 0) {
      res.json({ eligibility: "already_claimed", message: "This business has a verified owner. If there's an issue, use 'Ownership issue?' to contact support." });
      return;
    }

    // Unauthenticated visitor — static sign-in prompt
    if (!userId) {
      res.json({ eligibility: "not_claimable", message: "Own this business? Sign in or join to claim it." });
      return;
    }

    // Caller already has an open claim
    const { rows: myClaims } = await pool.query(
      `SELECT id FROM business_claims
       WHERE business_id = $1 AND user_id = $2 AND status IN ('pending', 'needs_info')
       LIMIT 1`,
      [businessId, userId]
    );
    if (myClaims[0]) {
      res.json({ eligibility: "pending_for_you", message: "Your ownership claim is being reviewed.", claimId: myClaims[0].id });
      return;
    }

    // Different user's claim is open
    const { rows: otherClaims } = await pool.query(
      `SELECT 1 FROM business_claims
       WHERE business_id = $1 AND user_id != $2 AND status IN ('pending', 'needs_info')
       LIMIT 1`,
      [businessId, userId]
    );
    if (otherClaims[0] || biz.ocs === "claim_pending" || biz.ocs === "ownership_disputed") {
      res.json({ eligibility: "pending_for_other_user", message: "An ownership claim is already being reviewed." });
      return;
    }

    res.json({ eligibility: "claimable", message: "Is this your business? Start a free ownership claim." });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/:id/claim-eligibility failed");
    res.status(500).json({ error: "Failed to check claim eligibility" });
  }
});

// ── POST /businesses/:id/claims ───────────────────────────────────────────────
// Creates one evidence-backed pending ownership-control claim. Auth required.
// Replaces the old unauthenticated POST /businesses/:id/claim from community-impact.ts.
router.post("/businesses/:id/claims", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const businessId = String(req.params.id);
  const userId = req.user.id;
  const {
    ownerName, role = "owner", businessEmail, verificationMethod,
    officialUrl, socialHandle, attestation, notes,
  } = req.body as Record<string, unknown>;

  if (!ownerName || typeof ownerName !== "string" || ownerName.trim().length < 2) {
    res.status(400).json({ error: "ownerName (2–255 chars) is required" }); return;
  }
  if (!businessEmail || typeof businessEmail !== "string" || !businessEmail.includes("@")) {
    res.status(400).json({ error: "A valid businessEmail is required" }); return;
  }
  const validMethods = ["domain_email", "social_account", "booking_page", "manual_review", "business_document"];
  if (!verificationMethod || typeof verificationMethod !== "string" || !validMethods.includes(verificationMethod)) {
    res.status(400).json({ error: `verificationMethod must be one of: ${validMethods.join(", ")}` }); return;
  }
  if (!attestation) {
    res.status(400).json({ error: "Ownership attestation is required" }); return;
  }

  try {
    // Inline eligibility check
    const { rows: bizRows } = await pool.query(
      `SELECT id, status, listing_status,
              COALESCE(ownership_control_status,
                CASE WHEN listing_status = 'live_claimed' THEN 'claimed' ELSE 'unclaimed' END
              ) AS ocs,
              name
       FROM businesses WHERE id = $1`,
      [businessId]
    );
    if (!bizRows[0]) { res.status(404).json({ error: "Business not found" }); return; }
    const biz = bizRows[0];

    if (biz.status !== "active" && !["live_unclaimed", "live_claimed"].includes(biz.listing_status ?? "")) {
      res.status(409).json({ error: "This listing is not currently eligible for claim" }); return;
    }
    if (biz.ocs === "claimed") {
      res.status(409).json({ error: "This business already has a verified owner" }); return;
    }

    // One-open-claim-per-member-per-business guard
    const { rows: existing } = await pool.query(
      `SELECT id FROM business_claims WHERE business_id = $1 AND user_id = $2 AND status IN ('pending', 'needs_info') LIMIT 1`,
      [businessId, userId]
    );
    if (existing[0]) {
      res.status(409).json({ error: "You already have an open claim for this business", claimId: existing[0].id }); return;
    }

    const claimId = `clm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const safeNotes = typeof notes === "string" ? notes.replace(/<[^>]*>/g, "").slice(0, 1000) : null;

    await pool.query(
      `INSERT INTO business_claims
         (id, business_id, user_id, business_name, owner_name, email, role,
          claim_type, verification_method, evidence_url, evidence_summary,
          attested_at, additional_info, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'ownership_control',$8,$9,$10,NOW(),$11,'pending',NOW(),NOW())`,
      [
        claimId, businessId, userId,
        biz.name ?? null,
        ownerName.trim().slice(0, 255),
        businessEmail.trim().slice(0, 255),
        (typeof role === "string" ? role : "owner").slice(0, 50),
        verificationMethod.slice(0, 40),
        typeof officialUrl === "string" ? officialUrl.slice(0, 500) : null,
        typeof socialHandle === "string" ? socialHandle.slice(0, 255) : null,
        safeNotes,
      ]
    );

    // Reflect pending state on the business
    await pool.query(
      `UPDATE businesses SET ownership_control_status = 'claim_pending', updated_at = NOW() WHERE id = $1`,
      [businessId]
    );

    // Fire-and-forget admin notification
    sendClaimReceived(
      "hello@mappingwithmelanin.com",
      `Admin — new claim from ${ownerName}`,
      `${biz.name ?? businessId} (${businessEmail})`
    ).catch(() => {});

    res.status(201).json({
      ok: true, claimId,
      message: "Claim submitted. We review clear requests within one business day.",
    });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/:id/claims failed");
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

// ── GET /me/business-claims ───────────────────────────────────────────────────
// Returns the caller's own claims only — no other user's data is returned.
router.get("/me/business-claims", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const { rows } = await pool.query(
      `SELECT bc.id, bc.business_id, bc.status, bc.claim_type, bc.role,
              bc.attested_at, bc.withdrawn_at, bc.created_at, bc.updated_at,
              CASE WHEN bc.status IN ('needs_info', 'rejected') THEN bc.decision_reason ELSE NULL END AS decision_reason,
              b.name AS business_name, b.city, b.state
       FROM business_claims bc
       LEFT JOIN businesses b ON b.id = bc.business_id
       WHERE bc.user_id = $1
       ORDER BY bc.created_at DESC`,
      [req.user.id]
    );
    res.json({ claims: rows });
  } catch (err) {
    req.log.error({ err }, "GET /me/business-claims failed");
    res.status(500).json({ error: "Failed to fetch your claims" });
  }
});

// ── PATCH /me/business-claims/:id ────────────────────────────────────────────
// Claimant actions: withdraw a pending claim, or resubmit a needs_info claim
// with additional evidence. Never modifies another user's claim.
router.patch("/me/business-claims/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const claimId = String(req.params.id);
  const { action, evidenceUrl, notes } = req.body as Record<string, unknown>;
  const userId = req.user.id;

  try {
    const { rows } = await pool.query(
      `SELECT id, status, business_id FROM business_claims WHERE id = $1 AND user_id = $2`,
      [claimId, userId]
    );
    if (!rows[0]) { res.status(404).json({ error: "Claim not found" }); return; }
    const claim = rows[0];

    if (action === "withdraw") {
      if (!["pending", "needs_info"].includes(claim.status)) {
        res.status(409).json({ error: "Only pending or needs_info claims can be withdrawn" }); return;
      }
      await pool.query(
        `UPDATE business_claims SET status='withdrawn', withdrawn_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [claimId]
      );
      // Reset business status if no other open claims for this listing
      const { rows: others } = await pool.query(
        `SELECT 1 FROM business_claims WHERE business_id=$1 AND id!=$2 AND status IN ('pending','needs_info') LIMIT 1`,
        [claim.business_id, claimId]
      );
      if (!others[0]) {
        await pool.query(
          `UPDATE businesses SET ownership_control_status='unclaimed' WHERE id=$1 AND ownership_control_status='claim_pending'`,
          [claim.business_id]
        );
      }
      res.json({ ok: true, message: "Claim withdrawn" });
      return;
    }

    if (action === "resubmit") {
      if (claim.status !== "needs_info") {
        res.status(409).json({ error: "Only needs_info claims can be resubmitted" }); return;
      }
      const safeNotes = typeof notes === "string" ? notes.replace(/<[^>]*>/g, "").slice(0, 1000) : null;
      await pool.query(
        `UPDATE business_claims
         SET status='pending',
             evidence_url=COALESCE($1, evidence_url),
             additional_info=COALESCE($2, additional_info),
             updated_at=NOW()
         WHERE id=$3`,
        [typeof evidenceUrl === "string" ? evidenceUrl.slice(0, 500) : null, safeNotes, claimId]
      );
      res.json({ ok: true, message: "Claim resubmitted for review" });
      return;
    }

    res.status(400).json({ error: "action must be 'withdraw' or 'resubmit'" });
  } catch (err) {
    req.log.error({ err }, "PATCH /me/business-claims/:id failed");
    res.status(500).json({ error: "Failed to update claim" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMINISTRATOR ENDPOINTS — all require isAdmin() (role === "admin")
// Never gate admin routes on req.user?.id alone.
// ══════════════════════════════════════════════════════════════════════════════

// ── GET /admin/business-claims ────────────────────────────────────────────────
router.get("/admin/business-claims", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const status = (req.query.status as string) ?? "pending";
  try {
    const { rows } = await pool.query(
      `SELECT bc.*, b.name AS business_name, b.city, b.state,
              b.listing_status, b.ownership_control_status, b.verification_status
       FROM business_claims bc
       LEFT JOIN businesses b ON b.id = bc.business_id
       WHERE ($1 = 'all' OR bc.status = $1)
       ORDER BY bc.created_at ASC`,
      [status]
    );
    res.json({ claims: rows, count: rows.length });
  } catch (err) {
    req.log.error({ err }, "GET /admin/business-claims failed");
    res.status(500).json({ error: "Failed to fetch claim queue" });
  }
});

// ── PATCH /admin/business-claims/:id ─────────────────────────────────────────
// Triage only — set needs_info or rejected. Approval is the dedicated endpoint below.
router.patch("/admin/business-claims/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const claimId = String(req.params.id);
  const { status, decisionReason } = req.body as { status?: string; decisionReason?: string };
  if (status === "approved") {
    res.status(400).json({ error: "Use POST /admin/business-claims/:id/approve — approval requires the full transaction" }); return;
  }
  const allowed = ["needs_info", "rejected"];
  if (!status || !allowed.includes(status)) {
    res.status(400).json({ error: "status must be 'needs_info' or 'rejected'" }); return;
  }
  if (!decisionReason || decisionReason.trim().length < 3) {
    res.status(400).json({ error: "decisionReason is required" }); return;
  }
  try {
    const { rows } = await pool.query(
      `UPDATE business_claims
       SET status=$1, decision_reason=$2, reviewed_by=$3, reviewed_at=NOW(), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, decisionReason.trim(), req.user!.id, claimId]
    );
    if (!rows[0]) { res.status(404).json({ error: "Claim not found" }); return; }
    res.json({ claim: rows[0] });
  } catch (err) {
    req.log.error({ err }, "PATCH /admin/business-claims/:id failed");
    res.status(500).json({ error: "Failed to update claim" });
  }
});

// ── POST /admin/business-claims/:id/approve ──────────────────────────────────
// Single database transaction:
//   1. Marks the claim approved
//   2. Creates a business_owner_links row (status='approved')
//   3. Updates the business (ownership_control_status, profile_status, listing_status)
//
// PERMANENT RULE: Does NOT set verified=true, does NOT change black_owned,
// does NOT alter verified_designations, ratings, safety scores, or community tags.
// Claiming grants profile control — verification is a separate MWM process.
router.post("/admin/business-claims/:id/approve", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const claimId = String(req.params.id);
  const { decisionReason } = req.body as { decisionReason?: string };
  const adminId = req.user!.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: claimRows } = await client.query(
      `SELECT * FROM business_claims WHERE id = $1 FOR UPDATE`,
      [claimId]
    );
    if (!claimRows[0]) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Claim not found" }); return;
    }
    const claim = claimRows[0];

    // Idempotent — already approved
    if (claim.status === "approved") {
      await client.query("ROLLBACK");
      res.json({ ok: true, message: "Claim already approved", claimId }); return;
    }
    if (!["pending", "needs_info"].includes(claim.status)) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: `Claim is in status '${claim.status}' and cannot be approved` }); return;
    }

    const { rows: bizRows } = await client.query(
      `SELECT id, status, listing_status,
              COALESCE(ownership_control_status,
                CASE WHEN listing_status = 'live_claimed' THEN 'claimed' ELSE 'unclaimed' END
              ) AS ocs
       FROM businesses WHERE id = $1 FOR UPDATE`,
      [claim.business_id]
    );
    if (!bizRows[0]) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Business not found" }); return;
    }
    const biz = bizRows[0];

    if (biz.ocs === "claimed") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Business already has an approved owner" }); return;
    }

    // Guard: no active primary owner link
    const { rows: existingOwner } = await client.query(
      `SELECT id FROM business_owner_links
       WHERE business_id=$1 AND status='approved' AND revoked_at IS NULL AND role='owner'
       LIMIT 1`,
      [claim.business_id]
    );
    if (existingOwner[0]) {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "An active owner link already exists for this business" }); return;
    }

    // 1. Approve the claim
    await client.query(
      `UPDATE business_claims
       SET status='approved', reviewed_by=$1, reviewed_at=NOW(), decision_reason=$2, updated_at=NOW()
       WHERE id=$3`,
      [adminId, decisionReason ?? "Approved by admin", claimId]
    );

    // 2. Create owner link (status=approved, NOT verified)
    const linkId = `bol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    await client.query(
      `INSERT INTO business_owner_links
         (id, user_id, business_id, role, status, claim_id, approved_by, approved_at, created_at)
       VALUES ($1,$2,$3,'owner','approved',$4,$5,NOW(),NOW())`,
      [linkId, claim.user_id, claim.business_id, claimId, adminId]
    );

    // 3. Update the business (ownership dimensions only — never touches verified/verified_designations)
    await client.query(
      `UPDATE businesses
       SET ownership_control_status='claimed',
           profile_status='claimed',
           listing_status='live_claimed',
           updated_at=NOW()
       WHERE id=$1`,
      [claim.business_id]
    );

    await client.query("COMMIT");

    // Post-commit notification — failure must never undo the approval
    sendClaimApproved(
      claim.email,
      claim.owner_name,
      claim.business_name ?? `Business ${claim.business_id}`
    ).catch(() => {});

    res.json({
      ok: true, claimId, ownerLinkId: linkId,
      message: "Claim approved. Owner now has profile control. MWM verification remains a separate process.",
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ err }, "POST /admin/business-claims/:id/approve failed");
    res.status(500).json({ error: "Approval transaction failed" });
  } finally {
    client.release();
  }
});

// ── POST /admin/business-claims/:id/revoke ───────────────────────────────────
// Revokes an approved owner relationship. Audit history (business_claims row,
// business_owner_links row) is NEVER deleted — revocation is a state change only.
router.post("/admin/business-claims/:id/revoke", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const claimId = String(req.params.id);
  const { revocationReason } = req.body as { revocationReason?: string };
  if (!revocationReason || revocationReason.trim().length < 3) {
    res.status(400).json({ error: "revocationReason is required (min 3 chars)" }); return;
  }
  const adminId = req.user!.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: linkRows } = await client.query(
      `UPDATE business_owner_links
       SET revoked_at=NOW(), revoked_by=$1, revocation_reason=$2, updated_at=NOW()
       WHERE claim_id=$3 AND revoked_at IS NULL
       RETURNING business_id`,
      [adminId, revocationReason.trim(), claimId]
    );
    if (linkRows[0]) {
      await client.query(
        `UPDATE businesses
         SET ownership_control_status='unclaimed',
             profile_status='community_listed',
             listing_status='live_unclaimed',
             updated_at=NOW()
         WHERE id=$1`,
        [linkRows[0].business_id]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true, message: "Owner relationship revoked. Audit history preserved." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ err }, "POST /admin/business-claims/:id/revoke failed");
    res.status(500).json({ error: "Revocation failed" });
  } finally {
    client.release();
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// LEGACY ENDPOINTS — kept for backwards compatibility with admin UI
// New admin UI should use /admin/business-claims/* above.
// ══════════════════════════════════════════════════════════════════════════════

router.get("/admin/claims", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { rows } = await pool.query(`SELECT * FROM business_claims ORDER BY created_at DESC`);
    res.json({ claims: rows });
  } catch (err) {
    req.log.error({ err }, "GET /admin/claims failed");
    res.status(500).json({ error: "Failed to fetch claims" });
  }
});

router.patch("/admin/claims/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  const id = String(req.params.id);
  const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
  if (status === "approved") {
    res.status(400).json({
      error: "Use POST /admin/business-claims/:id/approve — approvals require the full transaction to correctly create the owner link and update ownership state.",
    }); return;
  }
  const validStatuses = ["pending", "needs_info", "rejected", "withdrawn"];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: "Invalid status" }); return;
  }
  try {
    const { rows } = await pool.query(
      `UPDATE business_claims
       SET status=COALESCE($1, status),
           admin_notes=COALESCE($2, admin_notes),
           updated_at=NOW()
       WHERE id=$3 RETURNING *`,
      [status ?? null, adminNotes ?? null, id]
    );
    if (!rows[0]) { res.status(404).json({ error: "Claim not found" }); return; }
    res.json({ claim: rows[0] });
  } catch (err) {
    req.log.error({ err }, "PATCH /admin/claims/:id failed");
    res.status(500).json({ error: "Failed to update claim" });
  }
});

export default router;
