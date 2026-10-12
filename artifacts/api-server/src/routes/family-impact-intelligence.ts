import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { randomUUID } from "node:crypto";
import { classifyFamilyImpact, familyImpactDisclosure, FAMILY_IMPACT_LOCATION_SCOPE, type EmergencyBoundary } from "../safety/familyImpactIntelligence";
import { cancelFamilyImpactEvent, dispatchFamilyImpactEvent } from "../safety/familyImpactDispatch";

const router = Router();
const CONSENT_VERSION = "family-impact-v1";
const CONSENT_DURATION_DAYS = 365;

function requireUser(req: Request, res: Response): string | null {
  if (!req.user?.id || !req.isAuthenticated?.()) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function requireIngestSecret(req: Request, res: Response): boolean {
  const expected = process.env.FAMILY_IMPACT_INGEST_SECRET;
  if (!expected || expected.length < 16 || req.header("x-family-impact-ingest-secret") !== expected) {
    res.status(403).json({ error: "Family-impact ingestion is unavailable" });
    return false;
  }
  return true;
}

function parseBoundary(value: unknown): EmergencyBoundary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (input.kind === "county" && typeof input.countyCode === "string" && input.countyCode.trim().length <= 40) return { kind: "county", countyCode: input.countyCode.trim() };
  if (input.kind === "warning_zone" && typeof input.warningZone === "string" && input.warningZone.trim().length <= 60) return { kind: "warning_zone", warningZone: input.warningZone.trim() };
  if (input.kind === "polygon" && Array.isArray(input.coordinates)) {
    const coordinates = input.coordinates.flatMap((point) => Array.isArray(point) && point.length === 2 && typeof point[0] === "number" && typeof point[1] === "number"
      && Number.isFinite(point[0]) && Number.isFinite(point[1]) ? [[point[0], point[1]] as [number, number]] : []);
    if (coordinates.length >= 3 && coordinates.length <= 200) {
      return { kind: "polygon", coordinates, ...(typeof input.uncertaintyMeters === "number" && input.uncertaintyMeters >= 0 && input.uncertaintyMeters <= 20_000 ? { uncertaintyMeters: input.uncertaintyMeters } : {}) };
    }
  }
  return null;
}

function text(value: unknown, max: number): string | null {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= max ? value.trim() : null;
}

function eventExpiry(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getTime() > Date.now() && date.getTime() <= Date.now() + 7 * 24 * 60 * 60 * 1000 ? date : null;
}

// Owner-visible, relationship-specific consent management. No location is sent
// by this route; it only authorizes evaluation of a separate active temporary
// location session if the member starts one later.
router.get("/safety/family-impact/consents", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  try {
    const result = await pool.query(
      `SELECT tss.id AS trusted_share_id, tss.contact_name, tss.contact_accepted, tss.owner_enabled, tss.status,
              fic.location_scope, fic.consent_version, fic.consented_at, fic.expires_at, fic.revoked_at
         FROM trusted_safety_shares tss
         LEFT JOIN family_impact_consents fic ON fic.trusted_share_id = tss.id AND fic.owner_id = tss.owner_id
        WHERE tss.owner_id = $1 AND tss.contact_type = 'mwm_user' AND tss.status <> 'revoked'
        ORDER BY tss.created_at DESC`, [ownerId]);
    res.set("Cache-Control", "no-store, private, max-age=0");
    res.json({
      disclosure: "Family impact can evaluate only an active, time-limited location session you separately start. Contacts never receive your coordinates or a claim that you are safe.",
      consents: result.rows.map((row) => ({
        trustedShareId: row.trusted_share_id, contactName: row.contact_name,
        eligible: row.contact_accepted === true && row.owner_enabled === true && row.status === "active",
        enabled: Boolean(row.consented_at && !row.revoked_at && new Date(String(row.expires_at)).getTime() > Date.now()),
        locationScope: row.location_scope ?? null, expiresAt: row.expires_at ?? null,
      })),
    });
  } catch { res.status(500).json({ error: "Unable to load family-impact consent" }); }
});

router.put("/safety/family-impact/consents/:shareId", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  const enabled = req.body?.enabled;
  const locationScope = req.body?.locationScope;
  const consentVersion = req.body?.consentVersion;
  if (typeof enabled !== "boolean" || (enabled && (locationScope !== FAMILY_IMPACT_LOCATION_SCOPE || consentVersion !== CONSENT_VERSION))) {
    res.status(400).json({ error: "Explicit family-impact consent and the approved location scope are required" }); return;
  }
  try {
    const eligible = await pool.query<{ id: string }>(
      `SELECT tss.id FROM trusted_safety_shares tss
       LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = tss.contact_user_id
       LEFT JOIN user_blocks contact_blocks ON contact_blocks.blocker_id = tss.contact_user_id AND contact_blocks.blocked_id = tss.owner_id
       WHERE tss.id = $1 AND tss.owner_id = $2 AND tss.contact_type = 'mwm_user'
         AND tss.status = 'active' AND tss.owner_enabled = true AND tss.contact_accepted = true
         AND owner_blocks.id IS NULL AND contact_blocks.id IS NULL`, [req.params.shareId, ownerId]);
    if (!eligible.rows[0]) { res.status(409).json({ error: "That trusted contact is not currently eligible" }); return; }
    const saved = await pool.query(
      `INSERT INTO family_impact_consents (id, owner_id, trusted_share_id, location_scope, consent_version, consented_at, expires_at, revoked_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(), NOW() + INTERVAL '${CONSENT_DURATION_DAYS} days', CASE WHEN $6 THEN NULL ELSE NOW() END, NOW())
       ON CONFLICT (owner_id, trusted_share_id) DO UPDATE SET
         location_scope = EXCLUDED.location_scope, consent_version = EXCLUDED.consent_version,
         consented_at = CASE WHEN $6 THEN NOW() ELSE family_impact_consents.consented_at END,
         expires_at = CASE WHEN $6 THEN NOW() + INTERVAL '${CONSENT_DURATION_DAYS} days' ELSE family_impact_consents.expires_at END,
         revoked_at = CASE WHEN $6 THEN NULL ELSE NOW() END, updated_at = NOW()
       RETURNING location_scope, consented_at, expires_at, revoked_at`,
      [randomUUID(), ownerId, req.params.shareId, FAMILY_IMPACT_LOCATION_SCOPE, CONSENT_VERSION, enabled]);
    const row = saved.rows[0];
    res.json({ enabled, locationScope: row?.location_scope ?? null, expiresAt: row?.expires_at ?? null, revokedAt: row?.revoked_at ?? null });
  } catch { res.status(500).json({ error: "Unable to update family-impact consent" }); }
});

// Contact can ask the member to explicitly confirm safety. This creates no
// safety inference and no location disclosure.
router.post("/safety/family-impact/check-in-requests", async (req, res) => {
  const contactId = requireUser(req, res); if (!contactId) return;
  const eventId = text(req.body?.eventId, 160); const shareId = text(req.body?.trustedShareId, 80);
  if (!eventId || !shareId) { res.status(400).json({ error: "eventId and trustedShareId are required" }); return; }
  try {
    const created = await pool.query<{ id: string; owner_id: string }>(
      `INSERT INTO family_impact_checkin_requests (id, event_id, trusted_share_id, owner_id, contact_user_id, state, requested_at, expires_at)
       SELECT gen_random_uuid(), event.id, tss.id, tss.owner_id, tss.contact_user_id, 'requested', NOW(), LEAST(event.expires_at, NOW() + INTERVAL '2 hours')
         FROM family_impact_events event JOIN trusted_safety_shares tss ON tss.id = $2
         JOIN family_impact_consents fic ON fic.owner_id = tss.owner_id AND fic.trusted_share_id = tss.id
        WHERE event.source_event_id = $1 AND event.status = 'active' AND event.expires_at > NOW()
          AND tss.contact_user_id = $3 AND tss.status = 'active' AND tss.owner_enabled = true AND tss.contact_accepted = true
          AND fic.revoked_at IS NULL AND fic.expires_at > NOW()
       ON CONFLICT (event_id, trusted_share_id) DO NOTHING RETURNING id, owner_id`, [eventId, shareId, contactId]);
    const request = created.rows[0];
    if (!request) { res.status(409).json({ error: "A safety check-in cannot be requested for this relationship or event" }); return; }
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, data, read, created_at)
       VALUES (gen_random_uuid(),$1,'safety','Safety check-in requested','A trusted contact asked you to confirm your safety. Your location is not shared.','family_impact_checkin',$2,$3::jsonb,false,NOW())`,
      [request.owner_id, request.id, JSON.stringify({ type: "family_impact_checkin_request", requestId: request.id })],
    );
    res.status(201).json({ requestId: request.id, state: "requested" });
  } catch { res.status(500).json({ error: "Unable to request a safety check-in" }); }
});

router.post("/safety/family-impact/check-in-requests/:id/respond", async (req, res) => {
  const ownerId = requireUser(req, res); if (!ownerId) return;
  const response = req.body?.response;
  if (response !== "safe" && response !== "need_assistance") { res.status(400).json({ error: "response must be safe or need_assistance" }); return; }
  try {
    const updated = await pool.query<{ contact_user_id: string; event_id: string; trusted_share_id: string }>(
      `UPDATE family_impact_checkin_requests SET state = $1, responded_at = NOW()
        WHERE id = $2 AND owner_id = $3 AND state = 'requested' AND expires_at > NOW()
        RETURNING contact_user_id, event_id, trusted_share_id`, [response, req.params.id, ownerId]);
    const request = updated.rows[0];
    if (!request) { res.status(409).json({ error: "This safety check-in is no longer awaiting a response" }); return; }
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, body, entity_type, entity_id, data, read, created_at)
       VALUES (gen_random_uuid(),$1,'safety','Safety check-in response',$2,'family_impact_checkin',$3,$4::jsonb,false,NOW())`,
      [request.contact_user_id, response === "safe" ? "They confirmed they are safe." : "They requested assistance. Use your agreed safety plan.", req.params.id, JSON.stringify({ type: "family_impact_checkin_response", requestId: req.params.id, response })],
    );
    res.json({ state: response });
  } catch { res.status(500).json({ error: "Unable to record safety check-in response" }); }
});

// Creates an auditable, review-only escalation signal. Three distinct reports
// increase urgency for a qualified reviewer; no member notification is sent.
router.post("/safety/family-impact/violence-reports/:eventId", async (req, res) => {
  const reporterId = requireUser(req, res); if (!reporterId) return;
  try {
    const inserted = await pool.query<{ incident_id: string }>(
      `INSERT INTO family_impact_violence_reports (id, incident_id, reporter_id, submitted_at, abuse_state)
       SELECT gen_random_uuid(), event.id, $2::varchar, NOW(), 'accepted' FROM family_impact_events event
        WHERE event.source_event_id = $1::varchar AND event.source = 'reviewed_violence' AND event.status = 'active'
          AND NOT EXISTS (SELECT 1 FROM family_impact_violence_reports prior WHERE prior.incident_id = event.id AND prior.reporter_id = $2::varchar)
          AND NOT EXISTS (SELECT 1 FROM family_impact_violence_reports recent WHERE recent.reporter_id = $2::varchar AND recent.submitted_at > NOW() - INTERVAL '10 minutes')
       RETURNING incident_id`, [req.params.eventId, reporterId]);
    if (!inserted.rows[0]) { res.status(409).json({ error: "This report is duplicate, rate-limited, or not eligible" }); return; }
    const count = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM family_impact_violence_reports WHERE incident_id = $1 AND abuse_state = 'accepted'`, [inserted.rows[0].incident_id]);
    res.status(201).json({ received: true, urgentReviewRequired: Number(count.rows[0]?.count ?? 0) >= 3, notificationQueued: false });
  } catch (error) {
    req.log?.error({ code: error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : "unknown" }, "family impact review signal failed");
    res.status(500).json({ error: "Unable to submit incident review signal" });
  }
});

// Authoritative ingestion boundary. It accepts only source events and defaults
// to storage/review; it does not invoke a real notification provider.
router.post("/internal/safety/family-impact/events", async (req, res) => {
  if (!requireIngestSecret(req, res)) return;
  const source = req.body?.source;
  const sourceEventId = text(req.body?.sourceEventId, 160);
  const eventType = req.body?.eventType;
  const boundary = parseBoundary(req.body?.boundary);
  const generalArea = text(req.body?.generalArea, 160);
  const expiresAt = eventExpiry(req.body?.expiresAt);
  if (!(["nws", "fema_ipaws", "local_emergency"].includes(source)) || !sourceEventId || !(["severe_weather", "natural_disaster"].includes(eventType)) || !boundary || !generalArea || !expiresAt) {
    res.status(400).json({ error: "A supported source, safe boundary, general area, and future expiry are required" }); return;
  }
  try {
    await pool.query(
      `INSERT INTO family_impact_events (id, source, source_event_id, event_type, status, boundary, general_area, expires_at, created_at, updated_at)
       VALUES (gen_random_uuid(),$1,$2,$3,'active',$4::jsonb,$5,$6,NOW(),NOW())
       ON CONFLICT (source, source_event_id) DO UPDATE SET event_type = EXCLUDED.event_type, status = 'active', boundary = EXCLUDED.boundary,
         general_area = EXCLUDED.general_area, expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
      [source, sourceEventId, eventType, JSON.stringify(boundary), generalArea, expiresAt],
    );
    // Default off. An explicit founder-approved provider configuration is still
    // required before dispatch is permitted outside synthetic testing.
    const result = await dispatchFamilyImpactEvent(sourceEventId, { enableDelivery: false });
    res.status(202).json({ accepted: true, delivery: result.eventState });
  } catch { res.status(500).json({ error: "Unable to ingest emergency event" }); }
});

router.post("/internal/safety/family-impact/events/:eventId/:action", async (req, res, next) => {
  if (!requireIngestSecret(req, res)) return;
  const action = req.params.action;
  if (action === "review") return next();
  if (action !== "cancel" && action !== "withdraw" && action !== "correct") { res.status(400).json({ error: "Unsupported lifecycle action" }); return; }
  try {
    const changed = await cancelFamilyImpactEvent(req.params.eventId, action === "cancel" ? "cancelled" : action === "withdraw" ? "withdrawn" : "corrected");
    if (!changed) { res.status(404).json({ error: "Current emergency event not found" }); return; }
    res.json({ changed: true, delivery: "disabled" });
  } catch (error) {
    req.log?.error({ code: error && typeof error === "object" && "code" in error ? (error as { code?: unknown }).code : "unknown" }, "family impact event lifecycle failed");
    res.status(500).json({ error: "Unable to update emergency event" });
  }
});

// Three independent reports only create an urgent-review signal. A separately
// allow-listed qualified reviewer must approve before reviewed-violence events
// can ever enter the dispatch policy; the delivery circuit remains default-off.
router.post("/internal/safety/family-impact/events/:eventId/review", async (req, res) => {
  if (!requireIngestSecret(req, res)) return;
  const reviewerId = text(req.body?.reviewerId, 160);
  const allowedReviewers = new Set((process.env.FAMILY_IMPACT_REVIEWER_IDS ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  if (!reviewerId || !allowedReviewers.has(reviewerId)) { res.status(403).json({ error: "Qualified reviewer authorization is required" }); return; }
  try {
    const approved = await pool.query<{ id: string }>(
      `UPDATE family_impact_events event SET reviewer_id = $2, reviewer_approved_at = NOW(), updated_at = NOW()
        WHERE event.source_event_id = $1 AND event.source = 'reviewed_violence' AND event.status = 'active'
          AND (SELECT COUNT(*) FROM family_impact_violence_reports report WHERE report.incident_id = event.id AND report.abuse_state = 'accepted') >= 3
        RETURNING event.id`, [req.params.eventId, reviewerId]);
    if (!approved.rows[0]) { res.status(409).json({ error: "This incident lacks the required independent reports or is no longer current" }); return; }
    res.json({ reviewed: true, delivery: "disabled" });
  } catch { res.status(500).json({ error: "Unable to record qualified review" }); }
});

router.get("/safety/family-impact/events/:eventId/impact", async (req, res) => {
  const contactId = requireUser(req, res); if (!contactId) return;
  try {
    const row = await pool.query<{
      boundary: unknown; general_area: string; owner_id: string; last_updated_at: Date | null; latitude: number | null; longitude: number | null; confirmed_safe: boolean;
    }>(
      `SELECT event.boundary, event.general_area, tss.owner_id, ls.last_updated_at, ls.current_lat AS latitude, ls.current_lng AS longitude,
              EXISTS(SELECT 1 FROM family_impact_checkin_requests request WHERE request.event_id = event.id AND request.trusted_share_id = tss.id AND request.state = 'safe') AS confirmed_safe
         FROM family_impact_events event
         JOIN family_impact_consents fic ON fic.revoked_at IS NULL AND fic.expires_at > NOW()
         JOIN trusted_safety_shares tss ON tss.id = fic.trusted_share_id AND tss.owner_id = fic.owner_id
         JOIN users owner ON owner.id = tss.owner_id
         JOIN users contact ON contact.id = tss.contact_user_id
         LEFT JOIN user_blocks owner_blocks ON owner_blocks.blocker_id = tss.owner_id AND owner_blocks.blocked_id = tss.contact_user_id
         LEFT JOIN user_blocks contact_blocks ON contact_blocks.blocker_id = tss.contact_user_id AND contact_blocks.blocked_id = tss.owner_id
         LEFT JOIN LATERAL (SELECT last_updated_at, current_lat, current_lng FROM location_shares WHERE sharer_id = tss.owner_id AND recipient_user_id = tss.contact_user_id AND is_active = true AND expires_at > NOW() ORDER BY last_updated_at DESC NULLS LAST LIMIT 1) ls ON true
        WHERE event.source_event_id = $1 AND event.status = 'active' AND event.expires_at > NOW()
          AND tss.contact_user_id = $2 AND tss.status = 'active' AND tss.owner_enabled = true AND tss.contact_accepted = true
          AND owner.approved = true AND COALESCE(owner.account_status, 'active') = 'active'
          AND contact.approved = true AND COALESCE(contact.account_status, 'active') = 'active'
          AND owner_blocks.id IS NULL AND contact_blocks.id IS NULL
        LIMIT 1`, [req.params.eventId, contactId]);
    const current = row.rows[0];
    const boundary = current ? parseBoundary(current.boundary) : null;
    if (!current || !boundary) { res.status(404).json({ error: "No authorized family-impact view is available" }); return; }
    const impact = classifyFamilyImpact(boundary, { latitude: current.latitude, longitude: current.longitude, capturedAt: current.last_updated_at, accuracyMeters: null }, { memberConfirmedSafe: current.confirmed_safe });
    res.set("Cache-Control", "no-store, private, max-age=0");
    res.json({ generalArea: current.general_area, impact: impact.status, message: familyImpactDisclosure(impact.status) });
  } catch { res.status(500).json({ error: "Unable to evaluate family impact" }); }
});

export default router;
