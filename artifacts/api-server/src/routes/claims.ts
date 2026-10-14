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
import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth.js";
import {
  sendBusinessClaimVerificationCode,
  sendBusinessManagerInvitation,
  sendClaimReceived,
  sendClaimApproved,
} from "../lib/email.js";
import {
  CLAIM_VERIFICATION_MAX_ATTEMPTS,
  CLAIM_VERIFICATION_TTL_MINUTES,
  MANAGER_INVITATION_MAX_ATTEMPTS,
  MANAGER_INVITATION_TTL_DAYS,
  claimVerificationEmailDeliveryEnabled,
  createOpaqueCode,
  emailDomainMatchesOfficialUrl,
  hashesMatch,
  hashPrivateCode,
  managerInvitationDeliveryEnabled,
  normalizePrivateEmail,
} from "../services/business-owner/verification.js";

const router: IRouter = Router();

/**
 * A listing is marked claim_pending only while at least one reviewable claim
 * remains. This shared guard is deliberately used by claimant withdrawal and
 * every admin rejection path so a declined claim cannot strand a business in
 * an unclaimable state. It never changes verification, publication, ownership
 * designations, or an approved/revoked ownership audit record.
 */
async function releaseBusinessFromClaimPendingIfNoOpenClaims(businessId: string): Promise<void> {
  const { rows: openClaims } = await pool.query(
    `SELECT 1 FROM business_claims
     WHERE business_id = $1 AND status IN ('pending', 'needs_info', 'disputed')
     LIMIT 1`,
    [businessId],
  );

  if (!openClaims[0]) {
    await pool.query(
      `UPDATE businesses
       SET ownership_control_status = 'unclaimed', updated_at = NOW()
       WHERE id = $1 AND ownership_control_status = 'claim_pending'`,
      [businessId],
    );
  }
}

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
      res.json({ eligibility: "already_claimed", message: "This business already has an approved owner relationship. If there is an issue, contact support." });
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
       WHERE business_id = $1 AND user_id = $2 AND status IN ('pending', 'needs_info', 'disputed')
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
       WHERE business_id = $1 AND user_id != $2 AND status IN ('pending', 'needs_info', 'disputed')
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
    ownerName, role = "owner", businessEmail, claimantPhone, verificationMethod,
    officialUrl, socialHandle, attestation, notes,
  } = req.body as Record<string, unknown>;

  if (!ownerName || typeof ownerName !== "string" || ownerName.trim().length < 2) {
    res.status(400).json({ error: "ownerName (2–255 chars) is required" }); return;
  }
  if (!businessEmail || typeof businessEmail !== "string" || !businessEmail.includes("@")) {
    res.status(400).json({ error: "A valid businessEmail is required" }); return;
  }
  if (claimantPhone !== undefined && typeof claimantPhone !== "string") {
    res.status(400).json({ error: "claimantPhone must be a phone number when provided" }); return;
  }
  // Private review contact information is never copied
  // into the business listing, where it could overwrite or disclose public data.
  const safeClaimantPhone = typeof claimantPhone === "string"
    ? claimantPhone.trim().replace(/[^0-9+().\-\s]/g, "").slice(0, 30) || null
    : null;
  const allowedClaimRoles = ["owner", "authorized_representative"];
  if (typeof role !== "string" || !allowedClaimRoles.includes(role)) {
    res.status(400).json({ error: "role must be owner or authorized_representative; managers are invited after approval" }); return;
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
      res.status(409).json({ error: "This business already has an approved management owner" }); return;
    }

    // One-open-claim-per-member-per-business guard
    const { rows: existing } = await pool.query(
      `SELECT id FROM business_claims WHERE business_id = $1 AND user_id = $2 AND status IN ('pending', 'needs_info', 'disputed') LIMIT 1`,
      [businessId, userId]
    );
    if (existing[0]) {
      res.status(409).json({ error: "You already have an open claim for this business", claimId: existing[0].id }); return;
    }

    // A listing has one active review path at a time. The eligibility route
    // exposes the same rule; enforcing it here prevents a caller from bypassing
    // the client-side state and creating a competing pending claim.
    const { rows: competingClaims } = await pool.query(
      `SELECT id FROM business_claims
       WHERE business_id = $1 AND user_id <> $2 AND status IN ('pending', 'needs_info', 'disputed')
       LIMIT 1`,
      [businessId, userId],
    );
    if (competingClaims[0]) {
      res.status(409).json({ error: "Another ownership claim is already being reviewed for this business" }); return;
    }

    const claimId = `clm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const safeNotes = typeof notes === "string" ? notes.replace(/<[^>]*>/g, "").slice(0, 1000) : null;

    await pool.query(
      `INSERT INTO business_claims
         (id, business_id, user_id, business_name, owner_name, email, phone, role,
          claim_type, verification_method, evidence_url, evidence_summary,
          attested_at, additional_info, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'ownership_control',$9,$10,$11,NOW(),$12,'pending',NOW(),NOW())`,
      [
        claimId, businessId, userId,
        biz.name ?? null,
        ownerName.trim().slice(0, 255),
        businessEmail.trim().slice(0, 255),
        safeClaimantPhone,
        role,
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

    // Transactional claimant notification uses the separately supplied private
    // business contact. It is never copied into the public listing.
    sendClaimReceived(
      businessEmail.trim(),
      ownerName.trim(),
      String(biz.name ?? businessId),
    ).catch(() => {});

    res.status(201).json({
      ok: true, claimId,
      message: "Claim submitted for private review. An approved claim may grant listing-management access; it does not verify the business or its ownership designations.",
    });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/:id/claims failed");
    res.status(500).json({ error: "Failed to submit claim" });
  }
});


// ── POST /me/business-claims/:id/verification-code ───────────────────────────
// Issues an opt-in, short-lived email code only after the delivery feature has
// been explicitly configured. It proves control of a private business contact;
// it cannot approve a claim or alter a public business record.
router.post("/me/business-claims/:id/verification-code", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!claimVerificationEmailDeliveryEnabled()) {
    res.status(503).json({ error: "Business contact verification is not enabled in this environment." });
    return;
  }
  const claimId = String(req.params.id);
  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, business_id, business_name, owner_name, email, verification_method, evidence_url, status
       FROM business_claims WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [claimId, req.user.id],
    );
    const claim = rows[0];
    if (!claim) { res.status(404).json({ error: "Claim not found" }); return; }
    if (!["pending", "needs_info", "disputed"].includes(claim.status)) {
      res.status(409).json({ error: "Only an active private review claim can verify a business contact." });
      return;
    }
    if (claim.verification_method !== "domain_email") {
      res.status(409).json({ error: "Choose business-domain email review before requesting an email code." });
      return;
    }
    const target = normalizePrivateEmail(String(claim.email ?? ""));
    if (!target || !claim.evidence_url || !emailDomainMatchesOfficialUrl(target, String(claim.evidence_url))) {
      res.status(409).json({ error: "A business-domain email and matching official website are required for email-code review." });
      return;
    }
    const { rows: recent } = await pool.query(
      `SELECT count(*)::int AS count
       FROM business_claim_verification_challenges
       WHERE claim_id = $1 AND channel = 'email' AND created_at > NOW() - INTERVAL '1 hour'`,
      [claimId],
    );
    if (Number(recent[0]?.count ?? 0) >= 3) {
      res.status(429).json({ error: "Too many verification codes were requested. Please try again later." });
      return;
    }

    const code = createOpaqueCode(8);
    const challengeId = `bcv_${randomUUID()}`;
    await pool.query(
      `UPDATE business_claim_verification_challenges
       SET status = 'expired', updated_at = NOW()
       WHERE claim_id = $1 AND channel = 'email' AND status = 'issued'`,
      [claimId],
    );
    await pool.query(
      `INSERT INTO business_claim_verification_challenges
       (id, claim_id, user_id, channel, target, code_hash, status, attempts, max_attempts, expires_at, created_at, updated_at)
       VALUES ($1,$2,$3,'email',$4,$5,'issued',0,$6,NOW() + ($7 || ' minutes')::interval,NOW(),NOW())`,
      [challengeId, claimId, req.user.id, target, hashPrivateCode(code), CLAIM_VERIFICATION_MAX_ATTEMPTS, String(CLAIM_VERIFICATION_TTL_MINUTES)],
    );
    try {
      await sendBusinessClaimVerificationCode({
        to: target,
        ownerName: String(claim.owner_name ?? "there"),
        businessName: String(claim.business_name ?? claim.business_id),
        code,
      });
    } catch (error) {
      await pool.query(
        `UPDATE business_claim_verification_challenges
         SET status = 'delivery_failed', delivery_error = $2, updated_at = NOW()
         WHERE id = $1`,
        [challengeId, error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed"],
      );
      res.status(503).json({ error: "The verification code could not be delivered. No verification was recorded." });
      return;
    }
    res.status(201).json({
      ok: true,
      status: "code_issued",
      channel: "email",
      expiresInSeconds: CLAIM_VERIFICATION_TTL_MINUTES * 60,
      maxAttempts: CLAIM_VERIFICATION_MAX_ATTEMPTS,
    });
  } catch (error) {
    req.log.error({ error, claimId }, "Failed to issue private business claim verification code");
    res.status(503).json({ error: "Business contact verification is unavailable until its reviewed storage is ready." });
  }
});

// ── POST /me/business-claims/:id/verification-code/confirm ───────────────────
router.post("/me/business-claims/:id/verification-code/confirm", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!claimVerificationEmailDeliveryEnabled()) {
    res.status(503).json({ error: "Business contact verification is not enabled in this environment." });
    return;
  }
  const claimId = String(req.params.id);
  const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{8}$/.test(code)) {
    res.status(400).json({ error: "Enter the eight-character verification code." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, code_hash, attempts, max_attempts, expires_at, status
       FROM business_claim_verification_challenges
       WHERE claim_id = $1 AND user_id = $2 AND channel = 'email'
       ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [claimId, req.user.id],
    );
    const challenge = rows[0];
    if (!challenge || challenge.status !== "issued") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Request a new verification code before confirming." });
      return;
    }
    if (new Date(challenge.expires_at).getTime() <= Date.now()) {
      await client.query(`UPDATE business_claim_verification_challenges SET status = 'expired', updated_at = NOW() WHERE id = $1`, [challenge.id]);
      await client.query("COMMIT");
      res.status(410).json({ error: "This verification code expired. Request a new one." });
      return;
    }
    const attempts = Number(challenge.attempts) + 1;
    const matched = typeof challenge.code_hash === "string" && hashesMatch(challenge.code_hash, hashPrivateCode(code));
    if (!matched) {
      const status = attempts >= Number(challenge.max_attempts) ? "locked" : "issued";
      await client.query(
        `UPDATE business_claim_verification_challenges
         SET attempts = $2, status = $3, updated_at = NOW() WHERE id = $1`,
        [challenge.id, attempts, status],
      );
      await client.query("COMMIT");
      res.status(attempts >= Number(challenge.max_attempts) ? 429 : 400).json({
        error: attempts >= Number(challenge.max_attempts)
          ? "Too many incorrect codes. Request a new verification code."
          : "That verification code is not correct.",
      });
      return;
    }
    await client.query(
      `UPDATE business_claim_verification_challenges
       SET attempts = $2, status = 'verified', verified_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [challenge.id, attempts],
    );
    await client.query("COMMIT");
    res.json({ ok: true, status: "verified", message: "Business contact confirmed. Your ownership claim remains under private review." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ error, claimId }, "Failed to confirm private business claim verification code");
    res.status(503).json({ error: "Business contact verification is unavailable until its reviewed storage is ready." });
  } finally {
    client.release();
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
              CASE WHEN bc.status IN ('needs_info', 'rejected', 'disputed') THEN bc.decision_reason ELSE NULL END AS decision_reason,
              b.name AS business_name, b.city, b.state
       FROM business_claims bc
       LEFT JOIN businesses b ON b.id = bc.business_id
       WHERE bc.user_id = $1
       ORDER BY bc.created_at DESC`,
      [req.user.id]
    );
    // The existing status endpoint remains usable before the source-only
    // verification migration is applied. Verification detail is private and
    // reported only if its reviewed table is available.
    try {
      const { rows: verificationRows } = await pool.query(
        `SELECT claim_id,
                CASE
                  WHEN bool_or(status = 'verified') THEN 'verified'
                  WHEN bool_or(status = 'issued' AND expires_at > NOW()) THEN 'code_issued'
                  ELSE 'not_requested'
                END AS contact_verification_status
         FROM business_claim_verification_challenges
         WHERE user_id = $1
         GROUP BY claim_id`,
        [req.user.id],
      );
      const verificationByClaim = new Map(verificationRows.map((row) => [row.claim_id, row.contact_verification_status]));
      res.json({ claims: rows.map((claim) => ({ ...claim, contact_verification_status: verificationByClaim.get(claim.id) ?? "not_requested" })) });
    } catch {
      res.json({ claims: rows.map((claim) => ({ ...claim, contact_verification_status: "unavailable" })) });
    }
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
      if (!["pending", "needs_info", "disputed"].includes(claim.status)) {
        res.status(409).json({ error: "Only pending or needs_info claims can be withdrawn" }); return;
      }
      await pool.query(
        `UPDATE business_claims SET status='withdrawn', withdrawn_at=NOW(), updated_at=NOW() WHERE id=$1`,
        [claimId]
      );
      await releaseBusinessFromClaimPendingIfNoOpenClaims(claim.business_id);
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

    if (action === "dispute") {
      if (claim.status !== "rejected") {
        res.status(409).json({ error: "Only a rejected claim can be disputed" }); return;
      }
      const safeNotes = typeof notes === "string" ? notes.replace(/<[^>]*>/g, "").slice(0, 1000) : "";
      if (safeNotes.trim().length < 3) {
        res.status(400).json({ error: "Provide a brief private reason for the dispute" }); return;
      }
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const { rows: businessRows } = await client.query(
          `SELECT COALESCE(ownership_control_status, CASE WHEN listing_status = 'live_claimed' THEN 'claimed' ELSE 'unclaimed' END) AS ownership_control_status
           FROM businesses WHERE id = $1 FOR UPDATE`,
          [claim.business_id],
        );
        if (!businessRows[0] || businessRows[0].ownership_control_status === "claimed") {
          await client.query("ROLLBACK");
          res.status(409).json({ error: "This listing cannot be disputed because an active owner relationship now exists." }); return;
        }
        const { rows: competingRows } = await client.query(
          `SELECT 1 FROM business_claims WHERE business_id = $1 AND user_id <> $2
           AND status IN ('pending', 'needs_info', 'disputed') LIMIT 1 FOR UPDATE`,
          [claim.business_id, req.user.id],
        );
        if (competingRows[0]) {
          await client.query("ROLLBACK");
          res.status(409).json({ error: "Another private ownership review is already active for this listing." }); return;
        }
        await client.query(
          `UPDATE business_claims SET status='disputed', additional_info=$1, updated_at=NOW() WHERE id=$2`,
          [safeNotes, claimId],
        );
        await client.query(
          `UPDATE businesses SET ownership_control_status='ownership_disputed', updated_at=NOW() WHERE id=$1`,
          [claim.business_id],
        );
        await client.query("COMMIT");
        res.json({ ok: true, message: "Claim moved to private dispute review. No ownership or public listing data changed." }); return;
      } catch (disputeError) {
        await client.query("ROLLBACK").catch(() => {});
        req.log.error({ disputeError, claimId }, "Failed to dispute business claim");
        res.status(500).json({ error: "Failed to open private dispute review" }); return;
      } finally {
        client.release();
      }
    }

    res.status(400).json({ error: "action must be 'withdraw', 'resubmit', or 'dispute'" });
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
    if (status === "rejected") {
      await releaseBusinessFromClaimPendingIfNoOpenClaims(rows[0].business_id);
    }
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
    if (!["pending", "needs_info", "disputed"].includes(claim.status)) {
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


async function approvedOwnerForBusiness(userId: string, businessId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM business_owner_links
     WHERE business_id = $1 AND user_id = $2 AND role = 'owner'
       AND status = 'approved' AND revoked_at IS NULL LIMIT 1`,
    [businessId, userId],
  );
  return Boolean(rows[0]);
}

// ── GET /businesses/:id/management-team ───────────────────────────────────────
// Private owner-only view. It intentionally returns no member profile, claim
// evidence, or public discovery data.
router.get("/businesses/:id/management-team", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const businessId = String(req.params.id);
  try {
    if (!await approvedOwnerForBusiness(req.user.id, businessId)) { res.status(403).json({ error: "Only an approved owner can view this management team." }); return; }
    const { rows } = await pool.query(
      `SELECT bol.user_id, bol.role, bol.approved_at, bol.created_at
       FROM business_owner_links bol
       WHERE bol.business_id = $1 AND bol.status = 'approved' AND bol.revoked_at IS NULL
       ORDER BY CASE bol.role WHEN 'owner' THEN 0 ELSE 1 END, bol.created_at ASC`,
      [businessId],
    );
    const { rows: invitations } = await pool.query(
      `SELECT id, invited_email, status, expires_at, created_at
       FROM business_manager_invitations
       WHERE business_id = $1 AND status IN ('pending', 'delivery_failed')
       ORDER BY created_at DESC`,
      [businessId],
    );
    res.json({ members: rows, invitations });
  } catch (error) {
    req.log.error({ error, businessId }, "Failed to load private business management team");
    res.status(503).json({ error: "Business team management is unavailable until its reviewed storage is ready." });
  }
});

// ── POST /businesses/:id/management-team/invitations ─────────────────────────
router.post("/businesses/:id/management-team/invitations", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!managerInvitationDeliveryEnabled()) {
    res.status(503).json({ error: "Business manager invitations are not enabled in this environment." });
    return;
  }
  const businessId = String(req.params.id);
  const invitedEmail = normalizePrivateEmail(typeof req.body?.email === "string" ? req.body.email : "");
  if (!invitedEmail) { res.status(400).json({ error: "A valid manager email is required." }); return; }
  try {
    if (!await approvedOwnerForBusiness(req.user.id, businessId)) { res.status(403).json({ error: "Only an approved owner can invite a manager." }); return; }
    const { rows: businessRows } = await pool.query(`SELECT id, name FROM businesses WHERE id = $1 LIMIT 1`, [businessId]);
    const business = businessRows[0];
    if (!business) { res.status(404).json({ error: "Business not found" }); return; }
    const inviterEmail = normalizePrivateEmail(String((req.user as { email?: string }).email ?? ""));
    if (inviterEmail && inviterEmail === invitedEmail) { res.status(400).json({ error: "Use your existing owner access instead of inviting yourself." }); return; }
    const { rows: rateRows } = await pool.query(
      `SELECT count(*)::int AS count FROM business_manager_invitations
       WHERE business_id = $1 AND inviter_user_id = $2 AND created_at > NOW() - INTERVAL '1 hour'`,
      [businessId, req.user.id],
    );
    if (Number(rateRows[0]?.count ?? 0) >= 5) { res.status(429).json({ error: "Too many team invitations were sent. Please try again later." }); return; }
    const { rows: existingManager } = await pool.query(
      `SELECT 1 FROM business_owner_links bol JOIN users u ON u.id = bol.user_id
       WHERE bol.business_id = $1 AND lower(u.email) = lower($2)
         AND bol.status = 'approved' AND bol.revoked_at IS NULL LIMIT 1`,
      [businessId, invitedEmail],
    );
    if (existingManager[0]) { res.status(409).json({ error: "That member already has active access to this business." }); return; }
    const code = createOpaqueCode(10);
    const invitationId = `bmi_${randomUUID()}`;
    await pool.query(
      `INSERT INTO business_manager_invitations
       (id, business_id, inviter_user_id, invited_email, role, code_hash, status, attempts, max_attempts, expires_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,'manager',$5,'pending',0,$6,NOW() + ($7 || ' days')::interval,NOW(),NOW())`,
      [invitationId, businessId, req.user.id, invitedEmail, hashPrivateCode(code), MANAGER_INVITATION_MAX_ATTEMPTS, String(MANAGER_INVITATION_TTL_DAYS)],
    );
    try {
      await sendBusinessManagerInvitation({
        to: invitedEmail,
        businessName: String(business.name),
        inviterName: inviterEmail ?? "An approved business owner",
        code,
      });
    } catch (error) {
      await pool.query(
        `UPDATE business_manager_invitations SET status = 'delivery_failed', updated_at = NOW() WHERE id = $1`,
        [invitationId],
      );
      res.status(503).json({ error: "The invitation could not be delivered. No manager access was granted." });
      return;
    }
    res.status(201).json({ ok: true, invitationId, status: "pending", expiresInDays: MANAGER_INVITATION_TTL_DAYS });
  } catch (error) {
    req.log.error({ error, businessId }, "Failed to issue private business manager invitation");
    res.status(503).json({ error: "Business team invitations are unavailable until reviewed storage is ready." });
  }
});

// ── POST /business-manager-invitations/accept ─────────────────────────────────
router.post("/business-manager-invitations/accept", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  if (!managerInvitationDeliveryEnabled()) { res.status(503).json({ error: "Business manager invitations are not enabled in this environment." }); return; }
  const code = typeof req.body?.code === "string" ? req.body.code.trim().toUpperCase() : "";
  const accountEmail = normalizePrivateEmail(String((req.user as { email?: string }).email ?? ""));
  if (!/^[A-Z2-9]{10}$/.test(code) || !accountEmail) { res.status(400).json({ error: "Sign in with the invited email address and enter the ten-character invitation code." }); return; }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, business_id, inviter_user_id, invited_email, code_hash, status, attempts, max_attempts, expires_at
       FROM business_manager_invitations WHERE code_hash = $1 LIMIT 1 FOR UPDATE`,
      [hashPrivateCode(code)],
    );
    const invitation = rows[0];
    if (!invitation || invitation.status !== 'pending' || !hashesMatch(invitation.code_hash, hashPrivateCode(code))) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Invitation not found or no longer available." }); return;
    }
    if (String(invitation.invited_email).toLowerCase() !== accountEmail) {
      await client.query(`UPDATE business_manager_invitations SET attempts = attempts + 1, updated_at = NOW() WHERE id = $1`, [invitation.id]);
      await client.query("COMMIT");
      res.status(403).json({ error: "Use the member account that matches the invited email address." }); return;
    }
    if (new Date(invitation.expires_at).getTime() <= Date.now()) {
      await client.query(`UPDATE business_manager_invitations SET status = 'expired', updated_at = NOW() WHERE id = $1`, [invitation.id]);
      await client.query("COMMIT");
      res.status(410).json({ error: "This manager invitation expired." }); return;
    }
    if (Number(invitation.attempts) >= Number(invitation.max_attempts)) {
      await client.query(`UPDATE business_manager_invitations SET status = 'expired', updated_at = NOW() WHERE id = $1`, [invitation.id]);
      await client.query("COMMIT");
      res.status(429).json({ error: "Too many invitation attempts. Ask the owner for a new invitation." }); return;
    }
    const { rows: ownerRows } = await client.query(
      `SELECT 1 FROM business_owner_links WHERE business_id = $1 AND user_id = $2
       AND role = 'owner' AND status = 'approved' AND revoked_at IS NULL LIMIT 1`,
      [invitation.business_id, invitation.inviter_user_id],
    );
    if (!ownerRows[0]) { await client.query("ROLLBACK"); res.status(409).json({ error: "This invitation is no longer authorized by an active owner." }); return; }
    const { rows: linkRows } = await client.query(
      `SELECT id FROM business_owner_links WHERE business_id = $1 AND user_id = $2
       AND status = 'approved' AND revoked_at IS NULL LIMIT 1 FOR UPDATE`,
      [invitation.business_id, req.user.id],
    );
    if (!linkRows[0]) {
      await client.query(
        `INSERT INTO business_owner_links
         (id, user_id, business_id, role, status, approved_by, approved_at, created_at, updated_at)
         VALUES ($1,$2,$3,'manager','approved',$4,NOW(),NOW(),NOW())`,
        [`bol_${randomUUID()}`, req.user.id, invitation.business_id, invitation.inviter_user_id],
      );
    }
    await client.query(
      `UPDATE business_manager_invitations
       SET status = 'accepted', accepted_by_user_id = $2, accepted_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [invitation.id, req.user.id],
    );
    await client.query("COMMIT");
    res.json({ ok: true, businessId: invitation.business_id, role: "manager", message: "Manager access was accepted. Ownership, verification, and public listing details are unchanged." });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    req.log.error({ error }, "Failed to accept business manager invitation");
    res.status(503).json({ error: "Business manager invitations are unavailable until reviewed storage is ready." });
  } finally {
    client.release();
  }
});

// ── DELETE /businesses/:id/management-team/:userId ───────────────────────────
router.delete("/businesses/:id/management-team/:userId", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const businessId = String(req.params.id);
  const managerUserId = String(req.params.userId);
  try {
    if (!await approvedOwnerForBusiness(req.user.id, businessId)) { res.status(403).json({ error: "Only an approved owner can remove a manager." }); return; }
    const { rows } = await pool.query(
      `UPDATE business_owner_links SET revoked_at = NOW(), revoked_by = $3, revocation_reason = 'Removed by approved owner', updated_at = NOW()
       WHERE business_id = $1 AND user_id = $2 AND role = 'manager' AND status = 'approved' AND revoked_at IS NULL
       RETURNING id`,
      [businessId, managerUserId, req.user.id],
    );
    if (!rows[0]) { res.status(404).json({ error: "Active manager relationship not found." }); return; }
    res.json({ ok: true, message: "Manager access was removed. Ownership and public business information are unchanged." });
  } catch (error) {
    req.log.error({ error, businessId, managerUserId }, "Failed to revoke business manager access");
    res.status(503).json({ error: "Business team management is unavailable until reviewed storage is ready." });
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
    if (status === "rejected") {
      await releaseBusinessFromClaimPendingIfNoOpenClaims(rows[0].business_id);
    }
    res.json({ claim: rows[0] });
  } catch (err) {
    req.log.error({ err }, "PATCH /admin/claims/:id failed");
    res.status(500).json({ error: "Failed to update claim" });
  }
});

export default router;
