import { Router, type IRouter, type Request, type Response } from "express";
import type { PoolClient } from "pg";
import { createGovernedKinfolkBusinessRepository } from "../kinfolk/governedBusinessRepository";
import {
  PRIVATE_PLACES_DISCLOSURE_VERSION,
  privatePlacesRuntimeState,
} from "../kinfolk/private-places-policy";
import {
  isTemporaryStayExpired,
  normalizeTemporaryStayAddress,
  normalizeTemporaryStayDates,
  normalizeTemporaryStayExtension,
  normalizeTemporaryStayLabel,
  openTemporaryStay,
  sealTemporaryStay,
  temporaryStayExpiresAt,
  TEMPORARY_STAY_POST_DEPARTURE_GRACE_DAYS,
  TEMPORARY_STAY_PRIVACY_NOTICE,
} from "../kinfolk/temporary-stays-policy";
import { purgeExpiredTemporaryStays } from "../kinfolk/temporary-stay-retention";
import {
  isPrivatePlacesFictionalQaProvider,
  type PrivatePlacesGeocode,
} from "../kinfolk/private-places-fictional-qa";
import { pool } from "@workspace/db";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TemporaryStayRow = {
  id: string; user_id: string; label: string; encrypted_payload: string; encryption_key_version: string;
  geocode_provider: string; geocoded_at: Date; disclosure_version: string; is_active: boolean; created_at: Date; updated_at: Date;
};
type SafeTemporaryStay = Readonly<{
  id: string; label: string; isActive: boolean; arrivalDate: string; departureDate: string; expiresAt: Date; createdAt: Date; updatedAt: Date;
}>;
type RouteQuery = Pick<typeof pool, "query">;

export type TemporaryStaysRouteDependencies = Readonly<{
  /** Used only by the loopback production QA harness inside one rollback transaction. */
  transactionClient?: PoolClient;
  /** A fixture-only geocoder used only by the loopback production QA harness. */
  geocode?: (address: string) => Promise<PrivatePlacesGeocode | null>;
}>;

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
    arrivalDate: payload.arrivalDate,
    departureDate: payload.departureDate,
    expiresAt: temporaryStayExpiresAt(payload),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function geocodeWithApprovedGoogleDisclosure(address: string): Promise<PrivatePlacesGeocode | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("PRIVATE_PLACES_GEOCODING_UNAVAILABLE");
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`,
    { signal: AbortSignal.timeout(6_000) },
  );
  if (!response.ok) return null;
  const payload = await response.json() as { status?: string; results?: Array<{ formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }> };
  const found = payload.status === "OK" ? payload.results?.[0] : null;
  const formattedAddress = normalizeTemporaryStayAddress(found?.formatted_address);
  const latitude = found?.geometry?.location?.lat;
  const longitude = found?.geometry?.location?.lng;
  return Number.isFinite(latitude) && Number.isFinite(longitude) && formattedAddress
    ? { latitude: Number(latitude), longitude: Number(longitude), formattedAddress, provider: "google_maps" }
    : null;
}

export function createKinfolkTemporaryStaysRouter(
  dependencies: TemporaryStaysRouteDependencies = {},
): IRouter {
  const router: IRouter = Router();
  const query = (dependencies.transactionClient ?? pool) as RouteQuery;
  const geocode = dependencies.geocode ?? geocodeWithApprovedGoogleDisclosure;
  const governedBusinessRepository = createGovernedKinfolkBusinessRepository(pool);

  async function purgeOwnerExpiredStays(userId: string): Promise<void> {
    // No failure details are logged because ciphertext can indirectly encode a
    // member's private location. A later scheduled pass can retry safely.
    await purgeExpiredTemporaryStays({ ownerId: userId, database: query }).catch(() => undefined);
  }

  router.get("/kinfolk/temporary-stays/status", (req, res) => {
    if (!owner(req, res)) return;
    const state = privatePlacesRuntimeState();
    res.json({
      enabled: state.enabled,
      disclosureVersion: state.disclosureVersion,
      disclosure: state.disclosure,
      retention: {
        departureDateRequired: true,
        postDepartureGraceDays: TEMPORARY_STAY_POST_DEPARTURE_GRACE_DAYS,
        extensionAllowedBeforeExpiry: true,
      },
      privacyNotice: TEMPORARY_STAY_PRIVACY_NOTICE,
      guarantees: [
        "No directory ingestion, advertising, analytics, community, or ordinary Kinfolk memory.",
        "Only an active, member-selected stay can power a nearby-directory request.",
        "The encrypted row is deleted after its visible post-departure grace window unless extended or removed sooner.",
      ],
    });
  });

  router.get("/kinfolk/temporary-stays", async (req, res) => {
    const userId = owner(req, res); if (!userId || !runtime(res)) return;
    try {
      await purgeOwnerExpiredStays(userId);
      const result = await query.query<TemporaryStayRow>("SELECT * FROM kinfolk_temporary_stays WHERE user_id = $1 ORDER BY updated_at DESC", [userId]);
      res.json({ stays: result.rows.map(safe) });
    } catch { res.status(500).json({ error: "Could not load Temporary Stays." }); }
  });

  router.post("/kinfolk/temporary-stays", async (req, res) => {
    const userId = owner(req, res); if (!userId || !runtime(res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const label = normalizeTemporaryStayLabel(body.label); const exactAddress = normalizeTemporaryStayAddress(body.exactAddress); const dates = normalizeTemporaryStayDates(body);
    if (!label || !exactAddress || !dates) return void res.status(400).json({ error: "Use a short non-address nickname and valid arrival and departure dates." });
    if (isTemporaryStayExpired(dates)) return void res.status(400).json({ error: "That Temporary Stay is beyond its retention window. Nothing was saved.", code: "TEMPORARY_STAY_EXPIRED" });
    if (!disclosed(body)) return void res.status(400).json({ error: "Explicit Google Maps geocoding acknowledgement is required before a Temporary Stay can be saved.", code: "PRIVATE_PLACES_DISCLOSURE_REQUIRED" });
    try {
      const coordinates = await geocode(exactAddress); if (!coordinates) return void res.status(422).json({ error: "Google Maps could not verify that address. Nothing was saved." });
      const sealed = sealTemporaryStay({ exactAddress, latitude: coordinates.latitude, longitude: coordinates.longitude, googleFormattedAddress: coordinates.formattedAddress, ...dates });
      const result = await query.query<TemporaryStayRow>(
        `INSERT INTO kinfolk_temporary_stays (user_id, label, encrypted_payload, encryption_key_version, geocode_provider, disclosure_version)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [userId, label, sealed.encryptedPayload, sealed.encryptionKeyVersion, coordinates.provider, PRIVATE_PLACES_DISCLOSURE_VERSION],
      );
      res.status(201).json({ stay: safe(result.rows[0]!) });
    } catch (error) {
      if (error instanceof Error && error.message === "PRIVATE_PLACES_GEOCODING_UNAVAILABLE") return void res.status(503).json({ error: "Temporary Stay geocoding is temporarily unavailable. Nothing was saved." });
      res.status(500).json({ error: "Could not save this Temporary Stay. Nothing was changed." });
    }
  });

  router.put("/kinfolk/temporary-stays/:id", async (req, res) => {
    const userId = owner(req, res); if (!userId || !runtime(res)) return;
    const stayId = id(req.params.id); const body = (req.body ?? {}) as Record<string, unknown>;
    const label = normalizeTemporaryStayLabel(body.label); const exactAddress = normalizeTemporaryStayAddress(body.exactAddress); const dates = normalizeTemporaryStayDates(body);
    if (!stayId || !label || !exactAddress || !dates) return void res.status(400).json({ error: "Use a short non-address nickname and valid arrival and departure dates." });
    if (isTemporaryStayExpired(dates)) return void res.status(400).json({ error: "That Temporary Stay is beyond its retention window. Nothing was changed.", code: "TEMPORARY_STAY_EXPIRED" });
    if (!disclosed(body)) return void res.status(400).json({ error: "Explicit Google Maps geocoding acknowledgement is required before a Temporary Stay can be updated.", code: "PRIVATE_PLACES_DISCLOSURE_REQUIRED" });
    try {
      const owned = await query.query(
        "SELECT id FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2 LIMIT 1",
        [stayId, userId],
      );
      if (!owned.rows[0]) return void res.status(404).json({ error: "Temporary Stay not found." });
      const coordinates = await geocode(exactAddress); if (!coordinates) return void res.status(422).json({ error: "Google Maps could not verify that address. Nothing was changed." });
      const sealed = sealTemporaryStay({ exactAddress, latitude: coordinates.latitude, longitude: coordinates.longitude, googleFormattedAddress: coordinates.formattedAddress, ...dates });
      const updated = await query.query<TemporaryStayRow>(
        `UPDATE kinfolk_temporary_stays
            SET label = $3, encrypted_payload = $4, encryption_key_version = $5, geocode_provider = $6,
                geocoded_at = NOW(), disclosure_version = $7, updated_at = NOW()
          WHERE id = $1 AND user_id = $2 RETURNING *`,
        [stayId, userId, label, sealed.encryptedPayload, sealed.encryptionKeyVersion, coordinates.provider, PRIVATE_PLACES_DISCLOSURE_VERSION],
      );
      if (!updated.rows[0]) return void res.status(404).json({ error: "Temporary Stay not found." });
      res.json({ stay: safe(updated.rows[0]) });
    } catch (error) {
      if (error instanceof Error && error.message === "PRIVATE_PLACES_GEOCODING_UNAVAILABLE") return void res.status(503).json({ error: "Temporary Stay geocoding is temporarily unavailable. Nothing was changed." });
      res.status(500).json({ error: "Could not update this Temporary Stay. Nothing was changed." });
    }
  });

  router.post("/kinfolk/temporary-stays/:id/extend", async (req, res) => {
    const userId = owner(req, res); if (!userId || !runtime(res)) return;
    const stayId = id(req.params.id); if (!stayId) return void res.status(400).json({ error: "A valid Temporary Stay is required." });
    try {
      await purgeOwnerExpiredStays(userId);
      const found = await query.query<TemporaryStayRow>("SELECT * FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2 LIMIT 1", [stayId, userId]);
      const row = found.rows[0];
      if (!row) return void res.status(404).json({ error: "Temporary Stay not found or already removed after its grace period." });
      const payload = openTemporaryStay(row.encrypted_payload, row.encryption_key_version);
      if (isTemporaryStayExpired(payload)) {
        await query.query("DELETE FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2", [stayId, userId]);
        return void res.status(410).json({ error: "This Temporary Stay has reached its retention limit and was removed.", code: "TEMPORARY_STAY_EXPIRED" });
      }
      const dates = normalizeTemporaryStayExtension({
        arrivalDate: payload.arrivalDate,
        currentDepartureDate: payload.departureDate,
        departureDate: (req.body as { departureDate?: unknown } | undefined)?.departureDate,
      });
      if (!dates) return void res.status(400).json({ error: "Choose a later valid departure date to extend this Temporary Stay." });
      const sealed = sealTemporaryStay({ ...payload, ...dates });
      const updated = await query.query<TemporaryStayRow>("UPDATE kinfolk_temporary_stays SET encrypted_payload = $3, encryption_key_version = $4, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *", [stayId, userId, sealed.encryptedPayload, sealed.encryptionKeyVersion]);
      res.json({ stay: safe(updated.rows[0]!) });
    } catch { res.status(500).json({ error: "Could not extend this Temporary Stay. Nothing was changed." }); }
  });

  router.patch("/kinfolk/temporary-stays/:id/active", async (req, res) => {
    const userId = owner(req, res); if (!userId || !runtime(res)) return;
    const stayId = id(req.params.id); const isActive = (req.body as { isActive?: unknown } | undefined)?.isActive;
    if (!stayId || typeof isActive !== "boolean") return void res.status(400).json({ error: "A valid Temporary Stay and active state are required." });
    try {
      await purgeOwnerExpiredStays(userId);
      const updated = await query.query<TemporaryStayRow>("UPDATE kinfolk_temporary_stays SET is_active = $3, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *", [stayId, userId, isActive]);
      if (!updated.rows[0]) return void res.status(404).json({ error: "Temporary Stay not found or already removed after its grace period." });
      res.json({ stay: safe(updated.rows[0]) });
    } catch { res.status(500).json({ error: "Could not update Temporary Stay status." }); }
  });

  router.delete("/kinfolk/temporary-stays/:id", async (req, res) => {
    const userId = owner(req, res); if (!userId || !runtime(res)) return;
    const stayId = id(req.params.id); if (!stayId) return void res.status(400).json({ error: "A valid Temporary Stay is required." });
    try {
      const result = await query.query("DELETE FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2 RETURNING id", [stayId, userId]);
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
      await purgeOwnerExpiredStays(userId);
      const result = await query.query<TemporaryStayRow>("SELECT * FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2 AND is_active = true LIMIT 1", [stayId, userId]);
      const stay = result.rows[0]; if (!stay) return void res.status(404).json({ error: "Active Temporary Stay not found." });
      if (isPrivatePlacesFictionalQaProvider(stay.geocode_provider)) {
        return void res.json({ stay: safe(stay), radiusMiles: 8, businesses: [] });
      }
      const location = openTemporaryStay(stay.encrypted_payload, stay.encryption_key_version);
      if (isTemporaryStayExpired(location)) {
        await query.query("DELETE FROM kinfolk_temporary_stays WHERE id = $1 AND user_id = $2", [stayId, userId]);
        return void res.status(410).json({ error: "This Temporary Stay has reached its retention limit and was removed.", code: "TEMPORARY_STAY_EXPIRED" });
      }
      const radiusMiles = 8;
      const businesses = await governedBusinessRepository.findWithinRadius({ latitude: location.latitude, longitude: location.longitude, radiusMiles }, 25);
      res.json({ stay: safe(stay), radiusMiles, businesses });
    } catch { res.status(503).json({ error: "This Temporary Stay cannot be opened securely right now." }); }
  });

  return router;
}

const router = createKinfolkTemporaryStaysRouter();
export default router;
