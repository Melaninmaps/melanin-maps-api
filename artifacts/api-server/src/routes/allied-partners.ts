/**
 * Allied Partner Program — 5-stage journey
 *
 * A business earns its way into the partner program through community signals,
 * then applies, gets reviewed, signs a partnership agreement, and becomes a
 * paying platform partner. No business can skip stages.
 *
 * Stages (in order):
 *  1. community_ready    — business has ≥5 community check-ins (auto-unlocked)
 *  2. applied            — owner submits a partner application
 *  3. under_review       — admin has picked it up for review
 *  4. agreement_pending  — admin approved; waiting for owner to sign/confirm
 *  5. active_partner     — partnership active (owner confirmed agreement)
 *
 * Rejection is a terminal state; the owner can re-apply after a cooldown.
 */

import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { sendEmail } from "../lib/email";
import { isAdmin } from "../lib/adminAuth";

const router = Router();

// ── Community readiness threshold ─────────────────────────────────────────────
const COMMUNITY_CHECKIN_THRESHOLD = 5;   // unique member check-ins needed
const REJECTION_COOLDOWN_DAYS    = 60;   // days before rejected business may re-apply

// ── GET /businesses/:id/partner-eligibility ───────────────────────────────────
// Returns whether a business is eligible to apply, their current stage if they
// have an open application, and the community signal count.
router.get("/businesses/:id/partner-eligibility", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Community signal count (unique members who checked in)
    const { rows: [signal] } = await pool.query<{
      checkin_count: string;
      endorsement_count: string;
    }>(`
      SELECT
        COUNT(DISTINCT ci.user_id)::text AS checkin_count,
        COUNT(DISTINCT e.user_id)::text  AS endorsement_count
      FROM businesses b
      LEFT JOIN checkins ci ON ci.business_id = b.id
      LEFT JOIN (
        SELECT bf.business_id, bf.user_id
        FROM business_feedback bf
        WHERE bf.feedback_type IN ('endorsement','positive_vibe','hidden_gem')
      ) e ON e.business_id = b.id
      WHERE b.id = $1
    `, [id]);

    const checkinCount    = parseInt(signal?.checkin_count    ?? "0", 10);
    const endorsementCount = parseInt(signal?.endorsement_count ?? "0", 10);
    const communityScore  = checkinCount + Math.floor(endorsementCount / 2);
    const communityReady  = communityScore >= COMMUNITY_CHECKIN_THRESHOLD;

    // Existing open application
    const { rows: [existing] } = await pool.query<{
      id: string; stage: string; rejected_at: string | null;
      created_at: string; updated_at: string;
    }>(`
      SELECT id, stage, rejected_at, created_at, updated_at
      FROM allied_partner_applications
      WHERE business_id = $1
        AND stage NOT IN ('rejected','withdrawn')
      ORDER BY created_at DESC LIMIT 1
    `, [id]);

    // Recent rejection cooldown check
    const { rows: [rejected] } = await pool.query<{ rejected_at: string }>(`
      SELECT rejected_at FROM allied_partner_applications
      WHERE business_id = $1 AND stage = 'rejected'
      ORDER BY rejected_at DESC LIMIT 1
    `, [id]);

    let cooldownActive = false;
    if (rejected?.rejected_at) {
      const msAgo = Date.now() - new Date(rejected.rejected_at).getTime();
      cooldownActive = msAgo < REJECTION_COOLDOWN_DAYS * 86400000;
    }

    res.json({
      businessId:     id,
      communityScore,
      checkinCount,
      endorsementCount,
      communityReady,
      threshold:      COMMUNITY_CHECKIN_THRESHOLD,
      existingApplication: existing ?? null,
      canApply:       communityReady && !existing && !cooldownActive,
      cooldownActive,
      cooldownDays:   REJECTION_COOLDOWN_DAYS,
    });
  } catch (err) {
    req.log?.error({ err }, "GET /businesses/:id/partner-eligibility failed");
    res.status(500).json({ error: "Failed to check partner eligibility" });
  }
});

// ── POST /businesses/:id/partner-application ───────────────────────────────────
// Stage 1 → 2: Submit a partner application.
// Requires the business to have enough community signals.
router.post("/businesses/:id/partner-application", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }

    const {
      contactName, contactEmail, contactPhone,
      partnershipGoal, audienceDescription, additionalInfo,
    } = req.body as {
      contactName: string; contactEmail: string; contactPhone?: string;
      partnershipGoal: string; audienceDescription?: string; additionalInfo?: string;
    };

    if (!contactName?.trim() || !contactEmail?.trim() || !partnershipGoal?.trim()) {
      res.status(400).json({ error: "contactName, contactEmail, and partnershipGoal are required." });
      return;
    }

    // Verify business exists
    const { rows: [biz] } = await pool.query<{ id: string; name: string; city: string }>(
      `SELECT id, name, city FROM businesses WHERE id = $1 AND listing_status LIKE 'live%'`, [id]
    );
    if (!biz) {
      res.status(404).json({ error: "Business not found or not live." });
      return;
    }

    // Community signal check
    const { rows: [signal] } = await pool.query<{ score: string }>(`
      SELECT (
        COUNT(DISTINCT ci.user_id) +
        COUNT(DISTINCT e.user_id) / 2
      )::text AS score
      FROM businesses b
      LEFT JOIN checkins ci ON ci.business_id = b.id
      LEFT JOIN (
        SELECT bf.business_id, bf.user_id FROM business_feedback bf
        WHERE bf.feedback_type IN ('endorsement','positive_vibe','hidden_gem')
      ) e ON e.business_id = b.id
      WHERE b.id = $1
    `, [id]);
    const score = parseInt(signal?.score ?? "0", 10);
    if (score < COMMUNITY_CHECKIN_THRESHOLD) {
      res.status(403).json({
        error: `This business needs ${COMMUNITY_CHECKIN_THRESHOLD} community signals before applying. Current: ${score}.`,
        communityScore: score,
        threshold: COMMUNITY_CHECKIN_THRESHOLD,
      });
      return;
    }

    // No open application already
    const { rows: [existing] } = await pool.query(
      `SELECT id FROM allied_partner_applications
       WHERE business_id = $1 AND stage NOT IN ('rejected','withdrawn')
       LIMIT 1`, [id]
    );
    if (existing) {
      res.status(409).json({ error: "An open partner application already exists for this business." });
      return;
    }

    // Rejection cooldown
    const { rows: [rejected] } = await pool.query<{ rejected_at: string }>(
      `SELECT rejected_at FROM allied_partner_applications
       WHERE business_id = $1 AND stage = 'rejected'
       ORDER BY rejected_at DESC LIMIT 1`, [id]
    );
    if (rejected?.rejected_at) {
      const msAgo = Date.now() - new Date(rejected.rejected_at).getTime();
      if (msAgo < REJECTION_COOLDOWN_DAYS * 86400000) {
        const daysLeft = Math.ceil((REJECTION_COOLDOWN_DAYS * 86400000 - msAgo) / 86400000);
        res.status(403).json({
          error: `This business may re-apply in ${daysLeft} day(s) after a previous rejection.`,
          daysRemaining: daysLeft,
        });
        return;
      }
    }

    // Insert the application
    const { rows: [app] } = await pool.query<{ id: string }>(`
      INSERT INTO allied_partner_applications
        (business_id, submitted_by_user_id, stage,
         contact_name, contact_email, contact_phone,
         partnership_goal, audience_description, additional_info,
         community_score_at_apply, created_at, updated_at)
      VALUES ($1,$2,'applied',$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
      RETURNING id
    `, [id, userId, contactName.trim(), contactEmail.trim(),
        contactPhone?.trim() ?? null, partnershipGoal.trim(),
        audienceDescription?.trim() ?? null, additionalInfo?.trim() ?? null,
        score]);

    // Notify admins
    await sendEmail({
      from: "Mapping With Melanin™ <hello@send.mappingwithmelanin.com>",
      to: "tlindsay428@yahoo.com",
      subject: `[MWM] New Allied Partner Application — ${biz.name}`,
      html: `
        <p><strong>${biz.name}</strong> (${biz.city}) has submitted a partner application.</p>
        <p><strong>Community score:</strong> ${score} / ${COMMUNITY_CHECKIN_THRESHOLD} threshold</p>
        <p><strong>Contact:</strong> ${contactName} &lt;${contactEmail}&gt;</p>
        <p><strong>Goal:</strong> ${partnershipGoal}</p>
        <p>Review in the admin panel: <a href="https://mappingwithmelanin.com/admin/partner-applications/${app.id}">View Application</a></p>
      `,
    }).catch(() => {/* non-blocking */});

    res.status(201).json({
      applicationId: app.id,
      stage: "applied",
      message: "Partner application submitted. Our team will review it within 3–5 business days.",
    });
  } catch (err) {
    req.log?.error({ err }, "POST /businesses/:id/partner-application failed");
    res.status(500).json({ error: "Failed to submit partner application" });
  }
});

// ── GET /me/partner-applications ──────────────────────────────────────────────
// Returns the authenticated user's partner applications.
router.get("/me/partner-applications", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }
    const { rows } = await pool.query(`
      SELECT
        apa.id, apa.stage, apa.community_score_at_apply,
        apa.contact_name, apa.contact_email,
        apa.partnership_goal, apa.admin_notes,
        apa.stage_advanced_at, apa.rejected_at, apa.partner_confirmed_at,
        apa.created_at, apa.updated_at,
        b.id AS business_id, b.name AS business_name, b.city, b.state
      FROM allied_partner_applications apa
      JOIN businesses b ON b.id = apa.business_id
      WHERE apa.submitted_by_user_id = $1
      ORDER BY apa.created_at DESC
    `, [userId]);
    res.json({ applications: rows });
  } catch (err) {
    req.log?.error({ err }, "GET /me/partner-applications failed");
    res.status(500).json({ error: "Failed to load partner applications" });
  }
});

// ── GET /admin/partner-applications ───────────────────────────────────────────
// Admin: list all applications with optional stage filter.
router.get("/admin/partner-applications", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { stage, limit = "50", offset = "0" } = req.query as Record<string, string>;
    const stageFilter = stage ? `AND apa.stage = $3` : "";
    const params: unknown[] = [parseInt(limit, 10), parseInt(offset, 10)];
    if (stage) params.push(stage);

    const { rows } = await pool.query(`
      SELECT
        apa.id, apa.stage, apa.community_score_at_apply,
        apa.contact_name, apa.contact_email, apa.contact_phone,
        apa.partnership_goal, apa.audience_description, apa.additional_info,
        apa.admin_notes, apa.reviewed_by_admin_id,
        apa.stage_advanced_at, apa.rejected_at, apa.rejection_reason,
        apa.partner_confirmed_at, apa.created_at, apa.updated_at,
        b.id AS business_id, b.name AS business_name, b.city, b.state,
        b.listing_status, b.ownership_control_status,
        u.email AS submitter_email
      FROM allied_partner_applications apa
      JOIN businesses b ON b.id = apa.business_id
      LEFT JOIN users u ON u.id = apa.submitted_by_user_id
      WHERE 1=1 ${stageFilter}
      ORDER BY apa.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    const { rows: [{ total }] } = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM allied_partner_applications ${stage ? "WHERE stage = $1" : ""}`,
      stage ? [stage] : []
    );

    res.json({ applications: rows, total: parseInt(total, 10) });
  } catch (err) {
    req.log?.error({ err }, "GET /admin/partner-applications failed");
    res.status(500).json({ error: "Failed to load partner applications" });
  }
});

// ── GET /admin/partner-applications/:id ───────────────────────────────────────
router.get("/admin/partner-applications/:id", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { id } = req.params;
    const { rows: [app] } = await pool.query(`
      SELECT apa.*, b.name AS business_name, b.city, b.state,
             b.listing_status, b.ownership_control_status,
             u.email AS submitter_email
      FROM allied_partner_applications apa
      JOIN businesses b ON b.id = apa.business_id
      LEFT JOIN users u ON u.id = apa.submitted_by_user_id
      WHERE apa.id = $1
    `, [id]);
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    res.json({ application: app });
  } catch (err) {
    req.log?.error({ err }, "GET /admin/partner-applications/:id failed");
    res.status(500).json({ error: "Failed to load application" });
  }
});

// ── POST /admin/partner-applications/:id/advance ──────────────────────────────
// Admin: advance the application to the next stage.
// Valid transitions:
//   applied → under_review
//   under_review → agreement_pending
//   agreement_pending → active_partner (when admin confirms owner confirmed agreement)
router.post("/admin/partner-applications/:id/advance", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const { adminNotes } = req.body as { adminNotes?: string };

    const { rows: [app] } = await pool.query<{
      id: string; stage: string; business_id: string; contact_email: string; contact_name: string;
    }>(
      `SELECT id, stage, business_id, contact_email, contact_name
       FROM allied_partner_applications WHERE id = $1 FOR UPDATE`, [id]
    );
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }

    const STAGE_TRANSITIONS: Record<string, string> = {
      applied:           "under_review",
      under_review:      "agreement_pending",
      agreement_pending: "active_partner",
    };
    const nextStage = STAGE_TRANSITIONS[app.stage];
    if (!nextStage) {
      res.status(400).json({
        error: `Cannot advance from stage '${app.stage}'. Valid from-stages: ${Object.keys(STAGE_TRANSITIONS).join(", ")}`,
      });
      return;
    }

    await pool.query(`
      UPDATE allied_partner_applications
      SET stage = $1,
          reviewed_by_admin_id = $2,
          admin_notes = COALESCE($3, admin_notes),
          stage_advanced_at = NOW(),
          partner_confirmed_at = CASE WHEN $1 = 'active_partner' THEN NOW() ELSE partner_confirmed_at END,
          updated_at = NOW()
      WHERE id = $4
    `, [nextStage, adminId, adminNotes?.trim() ?? null, id]);

    // When reaching active_partner, tag the business
    if (nextStage === "active_partner") {
      await pool.query(`
        UPDATE businesses
        SET allied_partner = true, allied_partner_since = NOW(), updated_at = NOW()
        WHERE id = $1
      `, [app.business_id]).catch(() => {/* column may not exist yet — harmless */});
    }

    // Email the applicant at key stages
    const stageMessages: Record<string, { subject: string; body: string }> = {
      under_review: {
        subject: "Your MWM Partner Application Is Under Review",
        body: `<p>Hi ${app.contact_name},</p>
               <p>We've picked up your partner application for <strong>review</strong>. Our team will be in touch within 3–5 business days with a decision or next steps.</p>`,
      },
      agreement_pending: {
        subject: "Congratulations — Your MWM Partner Application Is Approved",
        body: `<p>Hi ${app.contact_name},</p>
               <p>Great news — your partner application has been <strong>approved</strong>! We'll send the partnership agreement shortly. Once signed, you'll be an official Mapping With Melanin Allied Partner.</p>`,
      },
      active_partner: {
        subject: "Welcome to the MWM Allied Partner Network",
        body: `<p>Hi ${app.contact_name},</p>
               <p>Welcome! Your business is now an official <strong>Mapping With Melanin Allied Partner</strong>. Your listing has been upgraded and you'll have access to partner benefits in your dashboard.</p>`,
      },
    };

    const msg = stageMessages[nextStage];
    if (msg) {
      await sendEmail({ from: "Mapping With Melanin™ <hello@send.mappingwithmelanin.com>", to: app.contact_email, subject: msg.subject, html: msg.body })
        .catch(() => {/* non-blocking */});
    }

    res.json({
      applicationId: id,
      previousStage: app.stage,
      newStage: nextStage,
      message: `Application advanced from '${app.stage}' to '${nextStage}'.`,
    });
  } catch (err) {
    req.log?.error({ err }, "POST /admin/partner-applications/:id/advance failed");
    res.status(500).json({ error: "Failed to advance application" });
  }
});

// ── POST /admin/partner-applications/:id/reject ───────────────────────────────
// Admin: reject an application at any stage.
router.post("/admin/partner-applications/:id/reject", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const { rejectionReason, adminNotes } = req.body as { rejectionReason?: string; adminNotes?: string };

    const { rows: [app] } = await pool.query<{
      id: string; stage: string; contact_email: string; contact_name: string; business_id: string;
    }>(
      `SELECT id, stage, contact_email, contact_name, business_id
       FROM allied_partner_applications WHERE id = $1 FOR UPDATE`, [id]
    );
    if (!app) { res.status(404).json({ error: "Application not found" }); return; }
    if (app.stage === "rejected" || app.stage === "withdrawn") {
      res.status(400).json({ error: `Application is already in terminal state '${app.stage}'.` });
      return;
    }

    await pool.query(`
      UPDATE allied_partner_applications
      SET stage = 'rejected',
          reviewed_by_admin_id = $1,
          rejection_reason = $2,
          admin_notes = COALESCE($3, admin_notes),
          rejected_at = NOW(),
          updated_at = NOW()
      WHERE id = $4
    `, [adminId, rejectionReason?.trim() ?? null, adminNotes?.trim() ?? null, id]);

    // Email applicant
    await sendEmail({
      from: "Mapping With Melanin™ <hello@send.mappingwithmelanin.com>",
      to: app.contact_email,
      subject: "Update on Your MWM Partner Application",
      html: `<p>Hi ${app.contact_name},</p>
             <p>Thank you for applying to the Mapping With Melanin Allied Partner program. After review, we are unable to approve this application at this time.</p>
             ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
             <p>You are welcome to re-apply in ${REJECTION_COOLDOWN_DAYS} days. In the meantime, continue building your community presence — more check-ins and endorsements strengthen future applications.</p>`,
    }).catch(() => {/* non-blocking */});

    res.json({
      applicationId: id,
      previousStage: app.stage,
      newStage: "rejected",
      cooldownDays: REJECTION_COOLDOWN_DAYS,
    });
  } catch (err) {
    req.log?.error({ err }, "POST /admin/partner-applications/:id/reject failed");
    res.status(500).json({ error: "Failed to reject application" });
  }
});

// ── POST /businesses/:id/partner-application/withdraw ─────────────────────────
// Owner: withdraw their own application before it reaches active_partner.
router.post("/businesses/:id/partner-application/withdraw", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }

    const { rows: [app] } = await pool.query<{ id: string; stage: string }>(
      `SELECT id, stage FROM allied_partner_applications
       WHERE business_id = $1 AND submitted_by_user_id = $2
         AND stage NOT IN ('rejected','withdrawn','active_partner')
       ORDER BY created_at DESC LIMIT 1`, [id, userId]
    );
    if (!app) {
      res.status(404).json({ error: "No withdrawable application found." }); return;
    }

    await pool.query(
      `UPDATE allied_partner_applications SET stage = 'withdrawn', updated_at = NOW() WHERE id = $1`,
      [app.id]
    );
    res.json({ applicationId: app.id, newStage: "withdrawn" });
  } catch (err) {
    req.log?.error({ err }, "POST /businesses/:id/partner-application/withdraw failed");
    res.status(500).json({ error: "Failed to withdraw application" });
  }
});

export default router;
