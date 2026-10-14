import { randomUUID } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  isFlightId,
  openTripFlight,
  parseFlightDeleteConfirmation,
  parseFlightInput,
  sealTripFlight,
  type FlightInput,
  type StoredKinfolkTripFlight,
} from "../kinfolk/trip-flight-policy";
import {
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../kinfolk/private-memory-encryption";
import { tripFlightColumns, tripFlightView } from "./kinfolk-trip-flights";

const router = Router();

function owner(req: Request, res: Response): string | null {
  res.setHeader("Cache-Control", "no-store");
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}
function flightNotFound(res: Response): void { res.status(404).json({ error: "Flight not found" }); }
function secureAccessError(res: Response): void {
  res.status(503).json({ error: "Flight could not be securely accessed. Please retry. The record was not changed.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
}
function secureError(error: unknown): boolean {
  return error instanceof PrivateMemoryEncryptionIntegrityError || error instanceof PrivateMemoryEncryptionUnavailableError;
}

async function list(ownerId: string): Promise<StoredKinfolkTripFlight[]> {
  const result = await pool.query<StoredKinfolkTripFlight>(`SELECT ${tripFlightColumns} FROM travel_flights WHERE user_id = $1 ORDER BY created_at DESC, id DESC`, [ownerId]);
  return result.rows;
}
async function find(ownerId: string, id: string): Promise<StoredKinfolkTripFlight | null> {
  const result = await pool.query<StoredKinfolkTripFlight>(`SELECT ${tripFlightColumns} FROM travel_flights WHERE id = $1 AND user_id = $2 LIMIT 1`, [id, ownerId]);
  return result.rows[0] ?? null;
}
function newUnlinkedFlight(input: FlightInput, ownerId: string): StoredKinfolkTripFlight {
  const now = new Date(); const base = { id: randomUUID(), userId: ownerId };
  const encrypted = sealTripFlight(input, base);
  const row: StoredKinfolkTripFlight = { ...base, tripId: null, ...encrypted, memberConfirmedAt: now, createdAt: now, updatedAt: now };
  openTripFlight(row, ownerId);
  return row;
}

/**
 * Existing authenticated Flight Tracker compatibility routes. They return the same
 * owner-safe public projection as selected-Trip flights and never expose user IDs,
 * placeholders, ciphertext, key IDs, or fingerprints. The generic create route
 * deliberately creates an unlinked private flight; only the selected Trip route can attach it.
 */
router.get("/travel/flights", async (req, res) => {
  const ownerId = owner(req, res); if (!ownerId) return;
  try {
    const rows = await list(ownerId);
    res.json({ flights: rows.map((row) => ({ ...tripFlightView(row, ownerId), linkedToPrivateTrip: row.tripId !== null })) });
  } catch (error) {
    req.log?.error("GET /api/travel/flights secure access failed");
    if (secureError(error)) return void secureAccessError(res);
    res.status(503).json({ error: "Flight could not be securely accessed. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
  }
});

router.post("/travel/flights", async (req, res) => {
  const ownerId = owner(req, res); if (!ownerId) return;
  const input = parseFlightInput(req.body);
  if (!input) return void res.status(400).json({ error: "Provide valid flight, airline, ISO departure date, IATA origin/destination, optional note, and explicit confirmation. Do not include a PNR, booking reference, exact address, coordinates, or live location." });
  try {
    const row = newUnlinkedFlight(input, ownerId);
    const result = await pool.query<StoredKinfolkTripFlight>(
      `INSERT INTO travel_flights (
        id, user_id, trip_id, flight_number, encrypted_flight_number, flight_number_encryption_key_id,
        airline, encrypted_airline, airline_encryption_key_id, departure_date, encrypted_departure_date,
        departure_date_encryption_key_id, origin, encrypted_origin, origin_encryption_key_id, destination,
        encrypted_destination, destination_encryption_key_id, notes, encrypted_notes, notes_encryption_key_id,
        member_confirmed_at, created_at, updated_at
      ) VALUES ($1,$2,NULL,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING ${tripFlightColumns}`,
      [row.id, row.userId, row.flightNumber, row.encryptedFlightNumber, row.flightNumberEncryptionKeyId,
        row.airline, row.encryptedAirline, row.airlineEncryptionKeyId, row.departureDate, row.encryptedDepartureDate,
        row.departureDateEncryptionKeyId, row.origin, row.encryptedOrigin, row.originEncryptionKeyId, row.destination,
        row.encryptedDestination, row.destinationEncryptionKeyId, row.notes, row.encryptedNotes, row.notesEncryptionKeyId,
        row.memberConfirmedAt, row.createdAt, row.updatedAt],
    );
    res.status(201).json({ flight: { ...tripFlightView(result.rows[0]!, ownerId), linkedToPrivateTrip: false } });
  } catch (error) {
    req.log?.error("POST /api/travel/flights secure access failed");
    if (secureError(error)) return void secureAccessError(res);
    res.status(503).json({ error: "Flight could not be securely saved. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
  }
});

router.put("/travel/flights/:id", async (req, res) => {
  const ownerId = owner(req, res); if (!ownerId) return;
  if (!isFlightId(req.params.id)) return void flightNotFound(res);
  const input = parseFlightInput(req.body);
  if (!input) return void res.status(400).json({ error: "Provide a complete valid private flight correction and explicit confirmation." });
  try {
    const existing = await find(ownerId, req.params.id); if (!existing) return void flightNotFound(res);
    // A key outage or tamper must never become a plaintext overwrite.
    openTripFlight(existing, ownerId);
    const encrypted = sealTripFlight(input, existing); const confirmedAt = new Date();
    openTripFlight({ ...existing, ...encrypted, memberConfirmedAt: confirmedAt, updatedAt: confirmedAt }, ownerId);
    const result = await pool.query<StoredKinfolkTripFlight>(
      `UPDATE travel_flights SET flight_number=$3, encrypted_flight_number=$4, flight_number_encryption_key_id=$5,
        airline=$6, encrypted_airline=$7, airline_encryption_key_id=$8, departure_date=$9,
        encrypted_departure_date=$10, departure_date_encryption_key_id=$11, origin=$12, encrypted_origin=$13,
        origin_encryption_key_id=$14, destination=$15, encrypted_destination=$16, destination_encryption_key_id=$17,
        notes=$18, encrypted_notes=$19, notes_encryption_key_id=$20, member_confirmed_at=$21, updated_at=NOW()
        WHERE id=$1 AND user_id=$2 RETURNING ${tripFlightColumns}`,
      [existing.id, ownerId, encrypted.flightNumber, encrypted.encryptedFlightNumber, encrypted.flightNumberEncryptionKeyId,
        encrypted.airline, encrypted.encryptedAirline, encrypted.airlineEncryptionKeyId, encrypted.departureDate,
        encrypted.encryptedDepartureDate, encrypted.departureDateEncryptionKeyId, encrypted.origin, encrypted.encryptedOrigin,
        encrypted.originEncryptionKeyId, encrypted.destination, encrypted.encryptedDestination, encrypted.destinationEncryptionKeyId,
        encrypted.notes, encrypted.encryptedNotes, encrypted.notesEncryptionKeyId, confirmedAt],
    );
    const saved = result.rows[0]; if (!saved) return void flightNotFound(res);
    res.json({ flight: { ...tripFlightView(saved, ownerId), linkedToPrivateTrip: saved.tripId !== null } });
  } catch (error) {
    req.log?.error("PUT /api/travel/flights secure access failed");
    if (secureError(error)) return void secureAccessError(res);
    res.status(503).json({ error: "Flight could not be securely corrected. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
  }
});

router.delete("/travel/flights/:id", async (req, res) => {
  const ownerId = owner(req, res); if (!ownerId) return;
  if (!isFlightId(req.params.id)) return void flightNotFound(res);
  if (!parseFlightDeleteConfirmation(req.body)) return void res.status(400).json({ error: "Explicit confirmation is required to remove a private flight." });
  try {
    // Explicit deletion is crypto-independent for legacy, tampered, and key-unavailable rows.
    const result = await pool.query("DELETE FROM travel_flights WHERE id = $1 AND user_id = $2 RETURNING id", [req.params.id, ownerId]);
    if (!result.rows[0]) return void flightNotFound(res);
    res.json({ removed: true });
  } catch {
    res.status(503).json({ error: "Flight could not be removed. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
  }
});

/**
 * Compatibility status endpoint only. It is never called by the selected-Trip UI.
 * Stored fields are opened solely after an owner-scoped query; without an API key it
 * truthfully returns unavailable and performs no provider request.
 */
router.get("/travel/flights/status", async (req, res) => {
  const ownerId = owner(req, res); if (!ownerId) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const flights = (await list(ownerId))
      .map((row) => ({ row, flight: tripFlightView(row, ownerId) }))
      .filter(({ flight }) => flight.departureDate >= today)
      .slice(0, 20);
    const apiKey = process.env.AVIATIONSTACK_API_KEY;
    if (!apiKey) {
      res.json({
        flights: flights.map(({ flight }) => ({ ...flight, status: "unavailable", statusMessage: "Status provider unavailable" })),
        checked: 0,
        providerStatus: "unavailable",
      });
      return;
    }
    const toCheck = flights.slice(0, 5);
    const statuses = await Promise.allSettled(toCheck.map(async ({ flight }) => {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${encodeURIComponent(flight.flightNumber)}&flight_date=${encodeURIComponent(flight.departureDate)}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return { id: flight.id, status: "unknown", statusMessage: "Unavailable", delay: 0 };
      const payload = await response.json() as { data?: Array<{ flight_status?: string; departure?: { delay?: number | null }; arrival?: { delay?: number | null } }> };
      const item = payload.data?.[0]; if (!item) return { id: flight.id, status: "unknown", statusMessage: "No data", delay: 0 };
      const delay = Math.max(item.departure?.delay ?? 0, item.arrival?.delay ?? 0);
      if (item.flight_status === "cancelled") return { id: flight.id, status: "cancelled", statusMessage: "Cancelled", delay: 0 };
      if (item.flight_status === "diverted") return { id: flight.id, status: "diverted", statusMessage: "Diverted", delay };
      if (delay >= 15) return { id: flight.id, status: "delayed", statusMessage: `Delayed ~${delay} min`, delay };
      return { id: flight.id, status: "on_time", statusMessage: "On time", delay: 0 };
    }));
    const statusById = new Map(toCheck.map(({ flight }, index) => [flight.id, statuses[index]?.status === "fulfilled" ? statuses[index].value : { id: flight.id, status: "unknown", statusMessage: "Check failed", delay: 0 }]));
    res.json({ flights: flights.map(({ flight }) => ({ ...flight, ...(statusById.get(flight.id) ?? { status: "upcoming", statusMessage: "Upcoming", delay: 0 }) })), checked: toCheck.length, providerStatus: "checked" });
  } catch (error) {
    req.log?.error("GET /api/travel/flights/status secure access failed");
    if (secureError(error)) return void secureAccessError(res);
    res.status(503).json({ error: "Flight status could not be securely accessed. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
  }
});

export default router;
