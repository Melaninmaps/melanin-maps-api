import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isAdmin } from "../lib/adminAuth";
import {
  validateServiceOfferingSet,
  type BusinessServiceOffering,
} from "../businesses/serviceOfferingPolicy";

const router: IRouter = Router();

type OwnedBusiness = { id: string; name: string };

type OfferingRow = {
  id: string; service_key: string; service_label: string; policy: Record<string, string>;
  price_text: string | null; duration_minutes: number | null; booking_url: string | null;
  evidence_state: string; status: string; source_url: string | null; source_label: string | null;
  observed_at: string | null; confidence: string | null; last_confirmed_at: string | null; note: string | null;
};

function offering(row: OfferingRow): BusinessServiceOffering {
  return {
    id: row.id, serviceKey: row.service_key as BusinessServiceOffering["serviceKey"], serviceLabel: row.service_label,
    policy: row.policy as BusinessServiceOffering["policy"], priceText: row.price_text, durationMinutes: row.duration_minutes,
    bookingUrl: row.booking_url, evidenceState: row.evidence_state as BusinessServiceOffering["evidenceState"],
    status: row.status as BusinessServiceOffering["status"], sourceUrl: row.source_url, sourceLabel: row.source_label,
    observedAt: row.observed_at?.slice(0, 10) ?? null, confidence: row.confidence as BusinessServiceOffering["confidence"],
    lastConfirmedAt: row.last_confirmed_at?.slice(0, 10) ?? null, note: row.note,
  };
}

async function requireApprovedOwner(req: Request, res: Response): Promise<OwnedBusiness | null> {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  const businessId = String(req.params.businessId ?? "").trim();
  const result = await pool.query<OwnedBusiness>(
    `SELECT b.id, b.name FROM businesses b WHERE b.id = $1 AND EXISTS (
       SELECT 1 FROM business_owner_links bol WHERE bol.business_id = b.id AND bol.user_id = $2
         AND bol.role = 'owner' AND bol.status = 'approved'
     ) LIMIT 1`, [businessId, req.user.id],
  );
  const business = result.rows[0] ?? null;
  if (!business) res.status(403).json({ error: "An approved business owner link is required" });
  return business;
}

async function requireAdminBusiness(req: Request, res: Response): Promise<OwnedBusiness | null> {
  if (!isAdmin(req)) { res.status(403).json({ error: "Admin required" }); return null; }
  const businessId = String(req.params.businessId ?? "").trim();
  const result = await pool.query<OwnedBusiness>("SELECT id, name FROM businesses WHERE id = $1 LIMIT 1", [businessId]);
  const business = result.rows[0] ?? null;
  if (!business) res.status(404).json({ error: "Business not found" });
  return business;
}

async function listOfferings(businessId: string): Promise<BusinessServiceOffering[]> {
  const result = await pool.query<OfferingRow>(
    `SELECT id, service_key, service_label, policy, price_text, duration_minutes, booking_url,
            evidence_state, status, source_url, source_label, observed_at::text, confidence,
            last_confirmed_at::text, note
       FROM business_service_offerings WHERE business_id = $1 ORDER BY service_key`, [businessId],
  );
  return result.rows.map(offering);
}

async function replaceOfferings(input: {
  business: OwnedBusiness; offerings: BusinessServiceOffering[]; changeNote: string; actorUserId: string; actorRole: "owner" | "admin";
}): Promise<BusinessServiceOffering[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const before = await client.query<OfferingRow>(
      `SELECT id, service_key, service_label, policy, price_text, duration_minutes, booking_url,
              evidence_state, status, source_url, source_label, observed_at::text, confidence,
              last_confirmed_at::text, note
         FROM business_service_offerings WHERE business_id = $1 FOR UPDATE`, [input.business.id],
    );
    await client.query("DELETE FROM business_service_offerings WHERE business_id = $1", [input.business.id]);
    for (const item of input.offerings) {
      await client.query(
        `INSERT INTO business_service_offerings (
           id, business_id, service_key, service_label, policy, price_text, duration_minutes, booking_url,
           evidence_state, status, source_url, source_label, observed_at, confidence, last_confirmed_at, note
         ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13::date,$14,$15::date,$16)`,
        [randomUUID(), input.business.id, item.serviceKey, item.serviceLabel, JSON.stringify(item.policy), item.priceText,
          item.durationMinutes, item.bookingUrl, item.evidenceState, item.status, item.sourceUrl, item.sourceLabel,
          item.observedAt, item.confidence, item.lastConfirmedAt, item.note],
      );
    }
    const after = await listOfferings(input.business.id);
    await client.query(
      `INSERT INTO business_service_offering_audit_events
       (id, business_id, actor_user_id, actor_role, change_note, before_state, after_state)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,
      [randomUUID(), input.business.id, input.actorUserId, input.actorRole, input.changeNote,
        JSON.stringify(before.rows.map(offering)), JSON.stringify(after)],
    );
    await client.query("COMMIT");
    return after;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally { client.release(); }
}

async function update(req: Request, res: Response, business: OwnedBusiness, actorRole: "owner" | "admin") {
  const changeNote = typeof req.body?.changeNote === "string" ? req.body.changeNote.trim() : "";
  if (changeNote.length < 3 || changeNote.length > 1000) { res.status(400).json({ error: "A 3–1,000 character audit note is required" }); return; }
  try {
    const offerings = validateServiceOfferingSet(req.body?.offerings);
    const saved = await replaceOfferings({ business, offerings, changeNote, actorUserId: req.user!.id, actorRole });
    res.json({ business, offerings: saved, message: "Services saved with provenance and an append-only audit event. This did not change publication, map pins, ownership, community signals, or lifecycle." });
  } catch (error) {
    req.log.error({ error, businessId: business.id }, "Failed to update service offerings");
    res.status(400).json({ error: error instanceof Error ? error.message : "Could not save service offerings" });
  }
}

router.get("/businesses/:businessId/service-offerings", async (req, res) => {
  const business = await requireApprovedOwner(req, res); if (!business) return;
  res.json({ business, offerings: await listOfferings(business.id) });
});
router.put("/businesses/:businessId/service-offerings", async (req, res) => {
  const business = await requireApprovedOwner(req, res); if (!business || !req.user?.id) return;
  await update(req, res, business, "owner");
});
router.get("/admin/businesses/:businessId/service-offerings", async (req, res) => {
  const business = await requireAdminBusiness(req, res); if (!business) return;
  res.json({ business, offerings: await listOfferings(business.id) });
});
router.put("/admin/businesses/:businessId/service-offerings", async (req, res) => {
  const business = await requireAdminBusiness(req, res); if (!business || !req.user?.id) return;
  await update(req, res, business, "admin");
});

export default router;
