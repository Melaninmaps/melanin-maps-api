import { Router, type IRouter, type Request, type Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import { createGovernedKinfolkBusinessRepository } from "../kinfolk/governedBusinessRepository";
import {
  PRIVATE_PLACES_DISCLOSURE_VERSION,
  normalizePrivatePlaceAddress,
  normalizePrivatePlaceLabel,
  openPrivatePlace,
  privatePlacesRuntimeState,
  sealPrivatePlace,
} from "../kinfolk/private-places-policy";
import {
  isPrivatePlacesFictionalQaProvider,
  type PrivatePlacesGeocode,
} from "../kinfolk/private-places-fictional-qa";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface PrivatePlaceRow {
  id: string;
  user_id: string;
  label: string;
  encrypted_payload: string;
  encryption_key_version: string;
  geocode_provider: string;
  geocoded_at: Date;
  disclosure_version: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

type SafePrivatePlace = Readonly<{
  id: string;
  label: string;
  isActive: boolean;
  geocodeProvider: string;
  geocodedAt: Date;
  disclosureVersion: string;
  createdAt: Date;
  updatedAt: Date;
}>;

function safePlace(row: PrivatePlaceRow): SafePrivatePlace {
  return {
    id: row.id,
    label: row.label,
    isActive: row.is_active,
    geocodeProvider: row.geocode_provider,
    geocodedAt: row.geocoded_at,
    disclosureVersion: row.disclosure_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requirePrivatePlacesRuntime(res: Response): boolean {
  const state = privatePlacesRuntimeState();
  if (state.enabled) return true;
  res.status(403).json({
    error: "Private Places is not enabled.",
    code: state.encryptionReady ? "PRIVATE_PLACES_DISABLED" : "PRIVATE_PLACES_ENCRYPTION_UNAVAILABLE",
  });
  return false;
}

function requireOwner(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function validPlaceId(value: unknown): string | null {
  const id = typeof value === "string" ? value.trim() : "";
  return UUID_PATTERN.test(id) ? id : null;
}

function disclosureAccepted(body: Record<string, unknown>): boolean {
  return body.googleMapsGeocodingConsent === true && body.disclosureVersion === PRIVATE_PLACES_DISCLOSURE_VERSION;
}

async function geocodeWithApprovedGoogleDisclosure(address: string): Promise<PrivatePlacesGeocode | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error("PRIVATE_PLACES_GEOCODING_UNAVAILABLE");
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`,
    { signal: AbortSignal.timeout(6_000) },
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as {
    status?: string;
    results?: Array<{ formatted_address?: string; geometry?: { location?: { lat?: number; lng?: number } } }>;
  };
  const result = payload.status === "OK" ? payload.results?.[0] : null;
  const latitude = result?.geometry?.location?.lat;
  const longitude = result?.geometry?.location?.lng;
  const formattedAddress = normalizePrivatePlaceAddress(result?.formatted_address);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !formattedAddress) return null;
  return { latitude: Number(latitude), longitude: Number(longitude), formattedAddress, provider: "google_maps" };
}

export type PrivatePlacesRouteDependencies = Readonly<{
  /** Used only by the loopback production QA harness inside one rollback transaction. */
  transactionClient?: PoolClient;
  /** A fixture-only geocoder used only by the loopback production QA harness. */
  geocode?: (address: string) => Promise<PrivatePlacesGeocode | null>;
}>;

export function createKinfolkPrivatePlacesRouter(
  dependencies: PrivatePlacesRouteDependencies = {},
): IRouter {
  const router: IRouter = Router();
  const query = dependencies.transactionClient ?? pool;
  const governedBusinessRepository = createGovernedKinfolkBusinessRepository(pool);
  const geocode = dependencies.geocode ?? geocodeWithApprovedGoogleDisclosure;

  async function savePrivatePlace(input: {
    ownerId: string;
    label: string;
    exactAddress: string;
    currentId?: string;
  }): Promise<SafePrivatePlace | null> {
    const client = dependencies.transactionClient ?? await pool.connect();
    const ownsTransaction = !dependencies.transactionClient;
    try {
      if (ownsTransaction) await client.query("BEGIN");
      if (input.currentId) {
        const owned = await client.query(
          "SELECT id FROM kinfolk_private_places WHERE id = $1 AND user_id = $2 LIMIT 1",
          [input.currentId, input.ownerId],
        );
        if (!owned.rows[0]) {
          if (ownsTransaction) await client.query("ROLLBACK");
          return null;
        }
      }
      // The provider request is deliberately after both disclosure and owner
      // authorization have succeeded. The address is never logged.
      const coordinates = await geocode(input.exactAddress);
      if (!coordinates) {
        if (ownsTransaction) await client.query("ROLLBACK");
        return null;
      }
      const sealed = sealPrivatePlace({
        exactAddress: input.exactAddress,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        googleFormattedAddress: coordinates.formattedAddress,
      });
      let row: PrivatePlaceRow | undefined;
      let action: "created" | "updated" = "created";
      if (input.currentId) {
        action = "updated";
        const updated = await client.query<PrivatePlaceRow>(
          `UPDATE kinfolk_private_places
              SET label = $3,
                  encrypted_payload = $4,
                  encryption_key_version = $5,
                  geocode_provider = $6,
                  geocoded_at = NOW(),
                  disclosure_version = $7,
                  updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            RETURNING *`,
          [input.currentId, input.ownerId, input.label, sealed.encryptedPayload, sealed.encryptionKeyVersion, coordinates.provider, PRIVATE_PLACES_DISCLOSURE_VERSION],
        );
        row = updated.rows[0];
      } else {
        const inserted = await client.query<PrivatePlaceRow>(
          `INSERT INTO kinfolk_private_places
            (user_id, label, encrypted_payload, encryption_key_version, geocode_provider, disclosure_version)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [input.ownerId, input.label, sealed.encryptedPayload, sealed.encryptionKeyVersion, coordinates.provider, PRIVATE_PLACES_DISCLOSURE_VERSION],
        );
        row = inserted.rows[0];
      }
      if (!row) {
        if (ownsTransaction) await client.query("ROLLBACK");
        return null;
      }
      await client.query(
        `INSERT INTO kinfolk_private_place_events (private_place_id, user_id, action)
         VALUES ($1, $2, $3)`,
        [row.id, input.ownerId, action],
      );
      if (ownsTransaction) await client.query("COMMIT");
      return safePlace(row);
    } catch (error) {
      if (ownsTransaction) await client.query("ROLLBACK");
      throw error;
    } finally {
      if (ownsTransaction) client.release();
    }
  }

  router.get("/kinfolk/private-places/status", (req: Request, res: Response) => {
    if (!requireOwner(req, res)) return;
    const state = privatePlacesRuntimeState();
    res.json({
      enabled: state.enabled,
      disclosureVersion: state.disclosureVersion,
      disclosure: state.disclosure,
      guarantees: [
        "Private Places is separate from Kinfolk memory and chat.",
        "An exact address is sent to Google Maps only after this disclosure is accepted.",
        "MWM stores the place as an encrypted record and does not use it automatically.",
      ],
    });
  });

  router.get("/kinfolk/private-places", async (req: Request, res: Response) => {
    const ownerId = requireOwner(req, res);
    if (!ownerId || !requirePrivatePlacesRuntime(res)) return;
    try {
      const result = await query.query<PrivatePlaceRow>(
        `SELECT id, user_id, label, encrypted_payload, encryption_key_version, geocode_provider,
                geocoded_at, disclosure_version, is_active, created_at, updated_at
           FROM kinfolk_private_places
          WHERE user_id = $1
          ORDER BY updated_at DESC`,
        [ownerId],
      );
      res.json({ places: result.rows.map(safePlace) });
    } catch (_error) {
      req.log.error("Private Places list failed");
      res.status(500).json({ error: "Could not load Private Places." });
    }
  });

  router.post("/kinfolk/private-places", async (req: Request, res: Response) => {
    const ownerId = requireOwner(req, res);
    if (!ownerId || !requirePrivatePlacesRuntime(res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const label = normalizePrivatePlaceLabel(body.label);
    const exactAddress = normalizePrivatePlaceAddress(body.exactAddress);
    if (!label || !exactAddress) return void res.status(400).json({ error: "Choose a short nickname and enter a valid address." });
    if (!disclosureAccepted(body)) {
      return void res.status(400).json({
        error: "Explicit Google Maps geocoding acknowledgement is required before an address can be saved.",
        code: "PRIVATE_PLACES_DISCLOSURE_REQUIRED",
      });
    }
    try {
      const place = await savePrivatePlace({ ownerId, label, exactAddress });
      if (!place) return void res.status(422).json({ error: "Google Maps could not verify that address. Nothing was saved." });
      res.status(201).json({ place });
    } catch (error) {
      if (error instanceof Error && error.message === "PRIVATE_PLACES_GEOCODING_UNAVAILABLE") {
        return void res.status(503).json({ error: "Private Places geocoding is temporarily unavailable. Nothing was saved." });
      }
      req.log.error("Private Places create failed");
      res.status(500).json({ error: "Could not save this Private Place. Nothing was changed." });
    }
  });

  router.put("/kinfolk/private-places/:id", async (req: Request, res: Response) => {
    const ownerId = requireOwner(req, res);
    if (!ownerId || !requirePrivatePlacesRuntime(res)) return;
    const id = validPlaceId(req.params.id);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const label = normalizePrivatePlaceLabel(body.label);
    const exactAddress = normalizePrivatePlaceAddress(body.exactAddress);
    if (!id || !label || !exactAddress) return void res.status(400).json({ error: "Choose a short nickname and enter a valid address." });
    if (!disclosureAccepted(body)) {
      return void res.status(400).json({
        error: "Explicit Google Maps geocoding acknowledgement is required before an address can be updated.",
        code: "PRIVATE_PLACES_DISCLOSURE_REQUIRED",
      });
    }
    try {
      const place = await savePrivatePlace({ ownerId, label, exactAddress, currentId: id });
      if (!place) return void res.status(404).json({ error: "Private Place not found, or Google Maps could not verify the new address." });
      res.json({ place });
    } catch (error) {
      if (error instanceof Error && error.message === "PRIVATE_PLACES_GEOCODING_UNAVAILABLE") {
        return void res.status(503).json({ error: "Private Places geocoding is temporarily unavailable. Nothing was changed." });
      }
      req.log.error("Private Places update failed");
      res.status(500).json({ error: "Could not update this Private Place. Nothing was changed." });
    }
  });

  router.patch("/kinfolk/private-places/:id/active", async (req: Request, res: Response) => {
    const ownerId = requireOwner(req, res);
    if (!ownerId || !requirePrivatePlacesRuntime(res)) return;
    const id = validPlaceId(req.params.id);
    const isActive = (req.body as { isActive?: unknown } | undefined)?.isActive;
    if (!id || typeof isActive !== "boolean") return void res.status(400).json({ error: "A valid place and active state are required." });
    try {
      const result = await query.query<PrivatePlaceRow>(
        `UPDATE kinfolk_private_places
            SET is_active = $3, updated_at = NOW()
          WHERE id = $1 AND user_id = $2
          RETURNING *`,
        [id, ownerId, isActive],
      );
      const place = result.rows[0];
      if (!place) return void res.status(404).json({ error: "Private Place not found." });
      await query.query(
        `INSERT INTO kinfolk_private_place_events (private_place_id, user_id, action)
         VALUES ($1, $2, $3)`,
        [id, ownerId, isActive ? "reactivated" : "deactivated"],
      );
      res.json({ place: safePlace(place) });
    } catch (_error) {
      req.log.error("Private Places activation update failed");
      res.status(500).json({ error: "Could not update Private Place status." });
    }
  });

  router.delete("/kinfolk/private-places/:id", async (req: Request, res: Response) => {
    const ownerId = requireOwner(req, res);
    if (!ownerId || !requirePrivatePlacesRuntime(res)) return;
    const id = validPlaceId(req.params.id);
    if (!id) return void res.status(400).json({ error: "A valid Private Place is required." });
    try {
      const result = await query.query(
        `DELETE FROM kinfolk_private_places WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, ownerId],
      );
      if (!result.rows[0]) return void res.status(404).json({ error: "Private Place not found." });
      // The row, ciphertext, and place events are removed together via cascade.
      res.json({ deleted: true, id });
    } catch (_error) {
      req.log.error("Private Places delete failed");
      res.status(500).json({ error: "Could not delete this Private Place." });
    }
  });

  router.post("/kinfolk/private-places/:id/nearby", async (req: Request, res: Response) => {
    const ownerId = requireOwner(req, res);
    if (!ownerId || !requirePrivatePlacesRuntime(res)) return;
    const id = validPlaceId(req.params.id);
    const requestedRadius = (req.body as { radiusMiles?: unknown } | undefined)?.radiusMiles;
    const radiusMiles = typeof requestedRadius === "number" && Number.isFinite(requestedRadius)
      ? Math.max(1, Math.min(25, requestedRadius))
      : 8;
    if (!id) return void res.status(400).json({ error: "A valid Private Place is required." });
    try {
      const result = await query.query<PrivatePlaceRow>(
        `SELECT id, user_id, label, encrypted_payload, encryption_key_version, geocode_provider,
                geocoded_at, disclosure_version, is_active, created_at, updated_at
           FROM kinfolk_private_places
          WHERE id = $1 AND user_id = $2 AND is_active = true
          LIMIT 1`,
        [id, ownerId],
      );
      const place = result.rows[0];
      if (!place) return void res.status(404).json({ error: "Active Private Place not found." });
      if (isPrivatePlacesFictionalQaProvider(place.geocode_provider)) {
        // The non-geographic QA fixture must not read directory data, create a
        // recommendation, or expose a real nearby result.
        return void res.json({ place: safePlace(place), radiusMiles, businesses: [] });
      }
      const location = openPrivatePlace(place.encrypted_payload, place.encryption_key_version);
      const businesses = await governedBusinessRepository.findWithinRadius({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusMiles,
      }, 25);
      // The response deliberately contains directory records only. It never echoes
      // address, coordinates, formatted Google result, or ciphertext to the client.
      res.json({ place: safePlace(place), radiusMiles, businesses });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("PRIVATE_PLACES_DECRYPTION")) {
        return void res.status(503).json({ error: "This Private Place cannot be opened securely right now." });
      }
      req.log.error("Private Places nearby search failed");
      res.status(500).json({ error: "Could not search nearby businesses from this Private Place." });
    }
  });

  return router;
}

const router = createKinfolkPrivatePlacesRouter();
export default router;
