import { Router, type IRouter, type Request, type Response } from "express";
import { createGovernedKinfolkBusinessRepository } from "../kinfolk/governedBusinessRepository";
import {
  PRIVATE_PLACES_DISCLOSURE_VERSION,
  privatePlacesRuntimeState,
} from "../kinfolk/private-places-policy";
import {
  normalizeTemporaryStayAddress,
  normalizeTemporaryStayDates,
  normalizeTemporaryStayLabel,
  openTemporaryStay,
  sealTemporaryStay,
  TEMPORARY_STAY_PRIVACY_NOTICE,
} from "../kinfolk/temporary-stays-policy";
import { pool } from "@workspace/db";

const router: IRouter = Router();
const governedBusinessRepository = createGovernedKinfolkBusinessRepository(pool);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TemporaryStayRow = {
  id: string; user_id: string; label: string; encrypted_payload: string; encryption_key_version: string;
  geocode_provider: string; geocoded_at: Date; disclosure_version: string; is_active: boolean; created_at: Date; updated_at: Date;
};
type SafeTemporaryStay = Readonly<{ id: string; label: string; isActive: boolean; arrivalDate?: string; departureDate?: string; createdAt: Date; updatedAt: Date }>;

function owner(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}
function runtime(res: Response): boolean {
  const state = privatePlacesRuntimeState();
  if (state.enabled) return true;
  res.status(403).json({ error: "Temporary Stays is not enabled.", code: state.encryptionReady ? "TEMPORARY_STAYS_DISABLED" : "PRIVATE_PLACES_ENCRYPTION_UNAVAILABLE" });
  return false;
}
function id(value: unknown): string | null { return typeof value === "string" && UUID_PATTERN.test(value.trim()) ? value.trim() : null; }
function disclosed(body: Record<string, unknown>): boolean { return body.googleMapsGeocodingConsent === true && body.disclosureVersion === PRIVATE_PLACES_DISCLOSURE_VERSION; }
function safe(row: TemporaryStayRow): SafeTemporaryStay {
  const payload = openTemporaryStay(row.encrypted_payload, row.encryption_key_version);
  return {
    id: row.id,
    label: row.label,
    isActive: row.is_active,
    ...(payload.arrivalDate ? { arrivalDate: payload.arrivalDate } : {}),
    ...(payload.departureDate ? { departureDate: payload.departureDate } : {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
async function geocode(exactAddress: string): Promise<{ latitude: number; longitude: number; formattedAddress: string } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("PRIVATE_PLACES_GEOCODING_UNAVAILABLE");
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(exactAddress)}&key=${key}`, { signal: AbortSignal.timeout(6_000) });
  if (!response.ok) return null;
  const payload = await response.json() as { status?: string; results?: Array<{ formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }> };
  const found = payload.status === "OK" ? payload.results?.[0] : null;
  const formattedAddress = normalizeTemporaryStayAddress(found?.formatted_address);
  const latitude = found?.geometry?.location?.lat; const longitude = found?.geometry?.location?.lng;
  return Number.isFinite(latitude) && Number.isFinite(longitude) && formattedAddress ? { latitude: Number(latitude), longitude: Number(longitude), formattedAddress } : null;
}

router.get("/kinfolk/temporary-stays/status", (req, res) => {
  if (!owner(req, res)) return;
  const state = privatePlacesRuntimeState();
  res.json({ enabled: state.enabled, disclosureVersion: state.disclosureVersion, disclosure: state.disclosure, privacyNotice: TEMPORARY_STAY_PRIVACY_NOTICE, guarantees: ["No automatic checkout deletion.", "No directory ingestion, advertising, analytics, community, or ordinary Kinfolk memory.", "Kinfolk can use an active stay only as private contextual location when the member deliberately asks for location-dependent help."] });
});

router.get("/kinfolk/temporary-stays", async (req, res) => {
  const userId = owner(req, res); if (!userId || !runtime(res)) return;
  try {
    const result = await pool.query<TemporaryStayRow>("SELECT * FROM kinfolk_temporary_stays WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
    res.json({ stays: result.rows.map(safe) });
  } catch { res.status(500).json({ error: "Could not load Temporary Stays." }); }
});

router.post("/kinfolk/temporary-stays", async (req, res) => {
  const userId = owner(req, res); if (!userId || !runtime(res)) return;
  const body = (req.body ?? {}) as Record<string, unknown>;
  const label = normalizeTemporaryStayLabel(body.label); const exactAddress = normalizeTemporaryStayAddress(body.exactAddress); const dates = normalizeTemporaryStayDates(body);
  if (!label || !exactAddress || !dates) return void res.status(400).json({ error: "Use a short non-address nickname, a valid address, and valid optional arrival/departure dates." });
  if (!disclosed(body)) return void res.status(400).json({ error: "Explicit Google Maps geocoding acknowledgement is required before a Temporary Stay can be saved.", code: "PRIVATE_PLACES_DISCLOSURE_REQUIRED" });
  try {
    const coordinates = await geocode(exactAddress); if (!coordinates) return void res.status(422).json({ error: "Google Maps could not verify that address. Nothing was saved." });
    const sealed = sealTemporaryStay({ exactAddress, latitude: coordinates.latitude, longitude: coordinates.longitude, googleFormattedAddress: coordinates.formattedAddress, ...dates });
    const result = await pool.query<TemporaryStayRow>(`INSERT INTO kinfolk_temporary_stays (user_id, label, encrypted_payload, encryption_key_version, geocode_provider, disclosure_version) VALUES ($1,$2,$3,$4,'google_maps',$5) RETURNING *`, [userId, label, sealed.encryptedPayload, sealed.encryptionKeyVersion, PRIVATE_PLACES_DISCLOSURE_VERSION]);
    res.status(201).json({ stay: safe(result.rows[0]!) });
  } catch (error) {
    if (error instanceof Error && error.message === "PRIVATE_PLACES_GEOCODING_UNAVAILABLE") return void res.status(503).json({ error: "Temporary Stay geocoding is temporarily unavailable. Nothing was saved." });
    res.status(500).json({ error: "Could not save this Temporary Stay. Nothing was changed." });
  }
});

router.delete("/kinfolk/temporary-stays/:id", async (req, res) => {
  const userId = owner(req, res); if (!userId || !runtime(res)) return;
  const stayId = id(req.params.id); if (!stayId) return void res.status(400).json({ error: "A valid Temporary Stay is required." });
  try {
    const result = await pool.query("DELETE FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2 RETURNING id", [stayId, userId]);
    if (!result.rows[0]) return void res.status(404).json({ error: "Temporary Stay not found." });
    res.json({ deleted: true, id: stayId });
  } catch { res.status(500).json({ error: "Could not delete this Temporary Stay." }); }
});

// Deliberate, owner-scoped contextual use. It exposes directory records only,
// never exact address, coordinates, encrypted payload, or Google result.
router.post("/kinfolk/temporary-stays/:id/nearby", async (req, res) => {
  const userId = owner(req, res); if (!userId || !runtime(res)) return;
  const stayId = id(req.params.id); if (!stayId) return void res.status(400).json({ error: "A valid Temporary Stay is required." });
  try {
    const result = await pool.query<TemporaryStayRow>("SELECT * FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2 AND is_active = true LIMIT 1", [stayId, userId]);
    const stay = result.rows[0]; if (!stay) return void res.status(404).json({ error: "Active Temporary Stay not found." });
    const location = openTemporaryStay(stay.encrypted_payload, stay.encryption_key_version);
    const radiusMiles = 8;
    const businesses = await governedBusinessRepository.findWithinRadius({ latitude: location.latitude, longitude: location.longitude, radiusMiles }, 25);
    res.json({ stay: safe(stay), radiusMiles, businesses });
  } catch { res.status(503).json({ error: "This Temporary Stay cannot be opened securely right now." }); }
});

export default router;
