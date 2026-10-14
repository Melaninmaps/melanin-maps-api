import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { isTripId, type StoredKinfolkTrip } from "../kinfolk/trip-policy";
import {
  KINFOLK_TRIP_FLIGHT_DEFAULT_NON_USE,
  isFlightId,
  openTripFlight,
  parseFlightAttachInput,
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

const tripColumns = `id, user_id AS "userId", title, encrypted_title AS "encryptedTitle",
  title_encryption_key_id AS "titleEncryptionKeyId", destination,
  encrypted_destination AS "encryptedDestination",
  destination_encryption_key_id AS "destinationEncryptionKeyId", note,
  encrypted_note AS "encryptedNote", note_encryption_key_id AS "noteEncryptionKeyId",
  member_confirmed_at AS "memberConfirmedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

export const tripFlightColumns = `id, user_id AS "userId", trip_id AS "tripId",
  flight_number AS "flightNumber", encrypted_flight_number AS "encryptedFlightNumber",
  flight_number_encryption_key_id AS "flightNumberEncryptionKeyId", airline,
  encrypted_airline AS "encryptedAirline", airline_encryption_key_id AS "airlineEncryptionKeyId",
  departure_date AS "departureDate", encrypted_departure_date AS "encryptedDepartureDate",
  departure_date_encryption_key_id AS "departureDateEncryptionKeyId", origin,
  encrypted_origin AS "encryptedOrigin", origin_encryption_key_id AS "originEncryptionKeyId",
  destination, encrypted_destination AS "encryptedDestination",
  destination_encryption_key_id AS "destinationEncryptionKeyId", notes,
  encrypted_notes AS "encryptedNotes", notes_encryption_key_id AS "notesEncryptionKeyId",
  member_confirmed_at AS "memberConfirmedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

export type KinfolkTripFlightRepository = {
  findTrip(ownerId: string, tripId: string): Promise<StoredKinfolkTrip | null>;
  list(ownerId: string, tripId: string): Promise<StoredKinfolkTripFlight[]>;
  listUnlinked(ownerId: string): Promise<StoredKinfolkTripFlight[]>;
  find(ownerId: string, tripId: string, flightId: string): Promise<StoredKinfolkTripFlight | null>;
  findUnlinked(ownerId: string, flightId: string): Promise<StoredKinfolkTripFlight | null>;
  create(row: StoredKinfolkTripFlight): Promise<StoredKinfolkTripFlight>;
  update(ownerId: string, tripId: string, flightId: string, encrypted: ReturnType<typeof sealTripFlight>, memberConfirmedAt: Date): Promise<StoredKinfolkTripFlight | null>;
  attach(ownerId: string, tripId: string, flightId: string, memberConfirmedAt: Date): Promise<StoredKinfolkTripFlight | null>;
  attachWithCorrection(ownerId: string, tripId: string, flightId: string, encrypted: ReturnType<typeof sealTripFlight>, memberConfirmedAt: Date): Promise<StoredKinfolkTripFlight | null>;
  unlink(ownerId: string, tripId: string, flightId: string, memberConfirmedAt: Date): Promise<StoredKinfolkTripFlight | null>;
  remove(ownerId: string, tripId: string, flightId: string): Promise<boolean>;
};

function postgresTripFlightRepository(): KinfolkTripFlightRepository {
  return {
    async findTrip(ownerId, tripId) {
      const result = await pool.query<StoredKinfolkTrip>(`SELECT ${tripColumns} FROM kinfolk_trips WHERE id = $1 AND user_id = $2 LIMIT 1`, [tripId, ownerId]);
      return result.rows[0] ?? null;
    },
    async list(ownerId, tripId) {
      const result = await pool.query<StoredKinfolkTripFlight>(`SELECT ${tripFlightColumns} FROM travel_flights WHERE user_id = $1 AND trip_id = $2 ORDER BY created_at DESC, id DESC`, [ownerId, tripId]);
      return result.rows;
    },
    async listUnlinked(ownerId) {
      const result = await pool.query<StoredKinfolkTripFlight>(`SELECT ${tripFlightColumns} FROM travel_flights WHERE user_id = $1 AND trip_id IS NULL ORDER BY created_at DESC, id DESC`, [ownerId]);
      return result.rows;
    },
    async find(ownerId, tripId, flightId) {
      const result = await pool.query<StoredKinfolkTripFlight>(`SELECT ${tripFlightColumns} FROM travel_flights WHERE id = $1 AND user_id = $2 AND trip_id = $3 LIMIT 1`, [flightId, ownerId, tripId]);
      return result.rows[0] ?? null;
    },
    async findUnlinked(ownerId, flightId) {
      const result = await pool.query<StoredKinfolkTripFlight>(`SELECT ${tripFlightColumns} FROM travel_flights WHERE id = $1 AND user_id = $2 AND trip_id IS NULL LIMIT 1`, [flightId, ownerId]);
      return result.rows[0] ?? null;
    },
    async create(row) {
      const result = await pool.query<StoredKinfolkTripFlight>(
        `INSERT INTO travel_flights (
          id, user_id, trip_id, flight_number, encrypted_flight_number, flight_number_encryption_key_id,
          airline, encrypted_airline, airline_encryption_key_id, departure_date, encrypted_departure_date,
          departure_date_encryption_key_id, origin, encrypted_origin, origin_encryption_key_id, destination,
          encrypted_destination, destination_encryption_key_id, notes, encrypted_notes, notes_encryption_key_id,
          member_confirmed_at, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
        RETURNING ${tripFlightColumns}`,
        [row.id, row.userId, row.tripId, row.flightNumber, row.encryptedFlightNumber, row.flightNumberEncryptionKeyId,
          row.airline, row.encryptedAirline, row.airlineEncryptionKeyId, row.departureDate, row.encryptedDepartureDate,
          row.departureDateEncryptionKeyId, row.origin, row.encryptedOrigin, row.originEncryptionKeyId, row.destination,
          row.encryptedDestination, row.destinationEncryptionKeyId, row.notes, row.encryptedNotes, row.notesEncryptionKeyId,
          row.memberConfirmedAt, row.createdAt, row.updatedAt],
      );
      return result.rows[0]!;
    },
    async update(ownerId, tripId, flightId, encrypted, memberConfirmedAt) {
      const result = await pool.query<StoredKinfolkTripFlight>(
        `UPDATE travel_flights SET flight_number=$4, encrypted_flight_number=$5, flight_number_encryption_key_id=$6,
          airline=$7, encrypted_airline=$8, airline_encryption_key_id=$9, departure_date=$10,
          encrypted_departure_date=$11, departure_date_encryption_key_id=$12, origin=$13, encrypted_origin=$14,
          origin_encryption_key_id=$15, destination=$16, encrypted_destination=$17, destination_encryption_key_id=$18,
          notes=$19, encrypted_notes=$20, notes_encryption_key_id=$21, member_confirmed_at=$22, updated_at=NOW()
          WHERE id=$1 AND user_id=$2 AND trip_id=$3 RETURNING ${tripFlightColumns}`,
        [flightId, ownerId, tripId, encrypted.flightNumber, encrypted.encryptedFlightNumber, encrypted.flightNumberEncryptionKeyId,
          encrypted.airline, encrypted.encryptedAirline, encrypted.airlineEncryptionKeyId, encrypted.departureDate,
          encrypted.encryptedDepartureDate, encrypted.departureDateEncryptionKeyId, encrypted.origin, encrypted.encryptedOrigin,
          encrypted.originEncryptionKeyId, encrypted.destination, encrypted.encryptedDestination, encrypted.destinationEncryptionKeyId,
          encrypted.notes, encrypted.encryptedNotes, encrypted.notesEncryptionKeyId, memberConfirmedAt],
      );
      return result.rows[0] ?? null;
    },
    async attach(ownerId, tripId, flightId, memberConfirmedAt) {
      const result = await pool.query<StoredKinfolkTripFlight>(`UPDATE travel_flights SET trip_id=$3, member_confirmed_at=$4, updated_at=NOW() WHERE id=$1 AND user_id=$2 AND trip_id IS NULL RETURNING ${tripFlightColumns}`, [flightId, ownerId, tripId, memberConfirmedAt]);
      return result.rows[0] ?? null;
    },
    async attachWithCorrection(ownerId, tripId, flightId, encrypted, memberConfirmedAt) {
      const result = await pool.query<StoredKinfolkTripFlight>(
        `UPDATE travel_flights SET trip_id=$3, flight_number=$4, encrypted_flight_number=$5, flight_number_encryption_key_id=$6,
          airline=$7, encrypted_airline=$8, airline_encryption_key_id=$9, departure_date=$10,
          encrypted_departure_date=$11, departure_date_encryption_key_id=$12, origin=$13, encrypted_origin=$14,
          origin_encryption_key_id=$15, destination=$16, encrypted_destination=$17, destination_encryption_key_id=$18,
          notes=$19, encrypted_notes=$20, notes_encryption_key_id=$21, member_confirmed_at=$22, updated_at=NOW()
          WHERE id=$1 AND user_id=$2 AND trip_id IS NULL RETURNING ${tripFlightColumns}`,
        [flightId, ownerId, tripId, encrypted.flightNumber, encrypted.encryptedFlightNumber, encrypted.flightNumberEncryptionKeyId,
          encrypted.airline, encrypted.encryptedAirline, encrypted.airlineEncryptionKeyId, encrypted.departureDate,
          encrypted.encryptedDepartureDate, encrypted.departureDateEncryptionKeyId, encrypted.origin, encrypted.encryptedOrigin,
          encrypted.originEncryptionKeyId, encrypted.destination, encrypted.encryptedDestination, encrypted.destinationEncryptionKeyId,
          encrypted.notes, encrypted.encryptedNotes, encrypted.notesEncryptionKeyId, memberConfirmedAt],
      );
      return result.rows[0] ?? null;
    },
    async unlink(ownerId, tripId, flightId, memberConfirmedAt) {
      const result = await pool.query<StoredKinfolkTripFlight>(`UPDATE travel_flights SET trip_id=NULL, member_confirmed_at=$4, updated_at=NOW() WHERE id=$1 AND user_id=$2 AND trip_id=$3 RETURNING ${tripFlightColumns}`, [flightId, ownerId, tripId, memberConfirmedAt]);
      return result.rows[0] ?? null;
    },
    async remove(ownerId, tripId, flightId) {
      const result = await pool.query("DELETE FROM travel_flights WHERE id=$1 AND user_id=$2 AND trip_id=$3 RETURNING id", [flightId, ownerId, tripId]);
      return Boolean(result.rows[0]);
    },
  };
}

export type KinfolkTripFlightRouteDependencies = Readonly<{
  repository?: KinfolkTripFlightRepository;
  makeId?: () => string;
  now?: () => Date;
}>;

type OwnerFlightView = Readonly<{
  id: string;
  flightNumber: string;
  airline: string;
  departureDate: string;
  origin: string;
  destination: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date | null;
}>;

function owner(req: Request, res: Response): string | null {
  res.setHeader("Cache-Control", "no-store");
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}
function tripNotFound(res: Response): void { res.status(404).json({ error: "Trip not found" }); }
function flightNotFound(res: Response): void { res.status(404).json({ error: "Flight not found" }); }
function secureAccessError(res: Response, error: unknown): void {
  res.status(error instanceof PrivateMemoryEncryptionIntegrityError ? 409 : 503).json({ error: "Flight could not be securely accessed. Please retry. The record was not changed.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
}
function isSecureError(error: unknown): boolean {
  return error instanceof PrivateMemoryEncryptionIntegrityError || error instanceof PrivateMemoryEncryptionUnavailableError;
}
/** Never expose user ID, link ID, storage placeholder, ciphertext, key IDs, or a fingerprint. */
export function tripFlightView(row: StoredKinfolkTripFlight, ownerId: string): OwnerFlightView {
  return { id: row.id, ...openTripFlight(row, ownerId), createdAt: row.createdAt, updatedAt: row.updatedAt };
}
function newFlight(input: FlightInput, ownerId: string, tripId: string, id: string, now: Date): StoredKinfolkTripFlight {
  const base = { id, userId: ownerId };
  const encrypted = sealTripFlight(input, base);
  const row: StoredKinfolkTripFlight = { ...base, tripId, ...encrypted, memberConfirmedAt: now, createdAt: now, updatedAt: now };
  openTripFlight(row, ownerId);
  return row;
}

/** Owner-scoped parent lookup only: Flight operations never open or reuse Trip content. */
async function selectedTrip(repository: KinfolkTripFlightRepository, ownerId: string, tripId: string): Promise<StoredKinfolkTrip | null> {
  return repository.findTrip(ownerId, tripId);
}

/**
 * Private selected-Trip flight context only. No public/share route and no automatic
 * chat, memory, recommendations, calendar, reminder, provider-status, analytics,
 * booking, Map, Directory, Community, or Safety behavior is imported or called.
 */
export function createKinfolkTripFlightsRouter(dependencies: KinfolkTripFlightRouteDependencies = {}): IRouter {
  const router: IRouter = Router();
  const repository = dependencies.repository ?? postgresTripFlightRepository();
  const makeId = dependencies.makeId ?? randomUUID;
  const now = dependencies.now ?? (() => new Date());

  router.get("/kinfolk/trips/:tripId/flights", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      const rows = await repository.list(ownerId, trip.id);
      res.json({ flights: rows.map((row) => tripFlightView(row, ownerId)), boundaries: KINFOLK_TRIP_FLIGHT_DEFAULT_NON_USE });
    } catch (error) {
      req.log?.error("Kinfolk Trip flight list secure access failed");
      if (isSecureError(error)) return void secureAccessError(res, error);
      res.status(503).json({ error: "Flight could not be securely accessed. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  router.get("/kinfolk/trips/:tripId/flights/available", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      const rows = await repository.listUnlinked(ownerId);
      res.json({ flights: rows.map((row) => tripFlightView(row, ownerId)) });
    } catch (error) {
      req.log?.error("Kinfolk Trip available flight list secure access failed");
      if (isSecureError(error)) return void secureAccessError(res, error);
      res.status(503).json({ error: "Flight could not be securely accessed. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  router.post("/kinfolk/trips/:tripId/flights", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    const input = parseFlightInput(req.body);
    if (!input) return void res.status(400).json({ error: "Provide valid flight, airline, ISO departure date, IATA origin/destination, optional note, and explicit confirmation. Do not include a PNR, booking reference, exact address, coordinates, or live location." });
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      const saved = await repository.create(newFlight(input, ownerId, trip.id, makeId(), now()));
      res.status(201).json({ flight: tripFlightView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trip flight create secure access failed");
      if (isSecureError(error)) return void secureAccessError(res, error);
      res.status(503).json({ error: "Flight could not be securely saved. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  router.get("/kinfolk/trips/:tripId/flights/:flightId", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isFlightId(req.params.flightId)) return void flightNotFound(res);
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      const row = await repository.find(ownerId, trip.id, req.params.flightId); if (!row) return void flightNotFound(res);
      res.json({ flight: tripFlightView(row, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trip flight read secure access failed");
      if (isSecureError(error)) return void secureAccessError(res, error);
      res.status(503).json({ error: "Flight could not be securely accessed. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  router.put("/kinfolk/trips/:tripId/flights/:flightId", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isFlightId(req.params.flightId)) return void flightNotFound(res);
    const input = parseFlightInput(req.body);
    if (!input) return void res.status(400).json({ error: "Provide a complete valid private flight correction and explicit confirmation." });
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      const existing = await repository.find(ownerId, trip.id, req.params.flightId); if (!existing) return void flightNotFound(res);
      // A partial/tampered/key-unavailable envelope is never overwritten.
      openTripFlight(existing, ownerId);
      const encrypted = sealTripFlight(input, existing);
      const candidate = { ...existing, ...encrypted, memberConfirmedAt: now(), updatedAt: now() };
      openTripFlight(candidate, ownerId);
      const saved = await repository.update(ownerId, trip.id, existing.id, encrypted, candidate.memberConfirmedAt!);
      if (!saved) return void flightNotFound(res);
      res.json({ flight: tripFlightView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trip flight correction secure access failed");
      if (isSecureError(error)) return void secureAccessError(res, error);
      res.status(503).json({ error: "Flight could not be securely corrected. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  router.put("/kinfolk/trips/:tripId/flights/:flightId/attach", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isFlightId(req.params.flightId)) return void flightNotFound(res);
    const input = parseFlightAttachInput(req.body);
    if (!input) return void res.status(400).json({ error: "Explicit confirmation is required. A correction must include all valid private flight fields." });
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      const existing = await repository.findUnlinked(ownerId, req.params.flightId); if (!existing) return void flightNotFound(res);
      // Attach-only can preserve a readable legacy row; every malformed encrypted representation fails closed.
      openTripFlight(existing, ownerId);
      const confirmedAt = now();
      if (input.correction) {
        const encrypted = sealTripFlight(input.correction, existing);
        openTripFlight({ ...existing, tripId: trip.id, ...encrypted, memberConfirmedAt: confirmedAt }, ownerId);
        const saved = await repository.attachWithCorrection(ownerId, trip.id, existing.id, encrypted, confirmedAt);
        if (!saved) return void flightNotFound(res);
        return void res.json({ flight: tripFlightView(saved, ownerId) });
      }
      const saved = await repository.attach(ownerId, trip.id, existing.id, confirmedAt);
      if (!saved) return void flightNotFound(res);
      res.json({ flight: tripFlightView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trip flight attach secure access failed");
      if (isSecureError(error)) return void secureAccessError(res, error);
      res.status(503).json({ error: "Flight could not be securely attached. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  router.delete("/kinfolk/trips/:tripId/flights/:flightId/attachment", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isFlightId(req.params.flightId)) return void flightNotFound(res);
    if (!parseFlightDeleteConfirmation(req.body)) return void res.status(400).json({ error: "Explicit confirmation is required to unlink a private flight." });
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      const existing = await repository.find(ownerId, trip.id, req.params.flightId); if (!existing) return void flightNotFound(res);
      // Detachment changes only the owner-bound relation. It is deliberately
      // crypto-independent so a member can revoke Trip context during a key
      // outage or after an envelope-integrity failure without reading or
      // rewriting flight content.
      const saved = await repository.unlink(ownerId, trip.id, existing.id, now());
      if (!saved) return void flightNotFound(res);
      res.json({ unlinked: true });
    } catch (error) {
      req.log?.error("Kinfolk Trip flight unlink secure access failed");
      if (isSecureError(error)) return void secureAccessError(res, error);
      res.status(503).json({ error: "Flight could not be securely unlinked. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  router.delete("/kinfolk/trips/:tripId/flights/:flightId", async (req, res) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isFlightId(req.params.flightId)) return void flightNotFound(res);
    if (!parseFlightDeleteConfirmation(req.body)) return void res.status(400).json({ error: "Explicit confirmation is required to remove a private flight." });
    try {
      const trip = await selectedTrip(repository, ownerId, req.params.tripId); if (!trip) return void tripNotFound(res);
      // Deliberately crypto-independent: a member can remove a tampered/key-unavailable row.
      if (!await repository.remove(ownerId, trip.id, req.params.flightId)) return void flightNotFound(res);
      res.json({ removed: true });
    } catch {
      res.status(503).json({ error: "Flight could not be removed. Please retry.", code: "FLIGHT_SECURE_ACCESS_REQUIRED", recoverable: true });
    }
  });

  return router;
}

export default createKinfolkTripFlightsRouter();
