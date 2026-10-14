import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  isTripId,
  KINFOLK_TRIP_DEFAULT_NON_USE,
  openTrip,
  parseTripDeleteConfirmation,
  parseTripInput,
  sealTrip,
  type StoredKinfolkTrip,
  type TripInput,
} from "../kinfolk/trip-policy";
import {
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../kinfolk/private-memory-encryption";

export type KinfolkTripRepository = {
  list(ownerId: string): Promise<StoredKinfolkTrip[]>;
  find(ownerId: string, id: string): Promise<StoredKinfolkTrip | null>;
  create(row: StoredKinfolkTrip): Promise<StoredKinfolkTrip>;
  update(ownerId: string, id: string, encrypted: ReturnType<typeof sealTrip>, memberConfirmedAt: Date): Promise<StoredKinfolkTrip | null>;
  remove(ownerId: string, id: string): Promise<boolean>;
};

const tripColumns = `id, user_id AS "userId", title, encrypted_title AS "encryptedTitle",
  title_encryption_key_id AS "titleEncryptionKeyId", destination,
  encrypted_destination AS "encryptedDestination",
  destination_encryption_key_id AS "destinationEncryptionKeyId", note,
  encrypted_note AS "encryptedNote", note_encryption_key_id AS "noteEncryptionKeyId",
  member_confirmed_at AS "memberConfirmedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

/** The default repository remains owner-scoped in every direct-ID SQL operation. */
function postgresTripRepository(): KinfolkTripRepository {
  return {
    async list(ownerId) {
      const result = await pool.query<StoredKinfolkTrip>(
        `SELECT ${tripColumns} FROM kinfolk_trips WHERE user_id = $1 ORDER BY updated_at DESC`, [ownerId],
      );
      return result.rows;
    },
    async find(ownerId, id) {
      const result = await pool.query<StoredKinfolkTrip>(
        `SELECT ${tripColumns} FROM kinfolk_trips WHERE id = $1 AND user_id = $2 LIMIT 1`, [id, ownerId],
      );
      return result.rows[0] ?? null;
    },
    async create(row) {
      const result = await pool.query<StoredKinfolkTrip>(
        `INSERT INTO kinfolk_trips (
          id, user_id, title, encrypted_title, title_encryption_key_id, destination,
          encrypted_destination, destination_encryption_key_id, note, encrypted_note,
          note_encryption_key_id, member_confirmed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING ${tripColumns}`,
        [
          row.id, row.userId, row.title, row.encryptedTitle, row.titleEncryptionKeyId,
          row.destination, row.encryptedDestination, row.destinationEncryptionKeyId,
          row.note, row.encryptedNote, row.noteEncryptionKeyId, row.memberConfirmedAt,
          row.createdAt, row.updatedAt,
        ],
      );
      return result.rows[0]!;
    },
    async update(ownerId, id, encrypted, memberConfirmedAt) {
      const result = await pool.query<StoredKinfolkTrip>(
        `UPDATE kinfolk_trips
            SET title = $3, encrypted_title = $4, title_encryption_key_id = $5,
                destination = $6, encrypted_destination = $7, destination_encryption_key_id = $8,
                note = $9, encrypted_note = $10, note_encryption_key_id = $11,
                member_confirmed_at = $12, updated_at = NOW()
          WHERE id = $1 AND user_id = $2
          RETURNING ${tripColumns}`,
        [
          id, ownerId, encrypted.title, encrypted.encryptedTitle, encrypted.titleEncryptionKeyId,
          encrypted.destination, encrypted.encryptedDestination, encrypted.destinationEncryptionKeyId,
          encrypted.note, encrypted.encryptedNote, encrypted.noteEncryptionKeyId, memberConfirmedAt,
        ],
      );
      return result.rows[0] ?? null;
    },
    async remove(ownerId, id) {
      const result = await pool.query(
        "DELETE FROM kinfolk_trips WHERE id = $1 AND user_id = $2 RETURNING id", [id, ownerId],
      );
      return Boolean(result.rows[0]);
    },
  };
}

export type KinfolkTripsRouteDependencies = Readonly<{
  repository?: KinfolkTripRepository;
  makeId?: () => string;
  now?: () => Date;
}>;

type OwnerTripView = Readonly<{
  id: string;
  title: string;
  destination: string;
  note: string;
  memberConfirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

function owner(req: Request, res: Response): string | null {
  res.setHeader("Cache-Control", "no-store");
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

/** Direct IDs are deliberately indistinguishable between malformed, missing, and cross-owner. */
function notFound(res: Response): void {
  res.status(404).json({ error: "Trip not found" });
}

function secureAccessError(res: Response, error: unknown): void {
  const unavailable = error instanceof PrivateMemoryEncryptionUnavailableError;
  const integrity = error instanceof PrivateMemoryEncryptionIntegrityError;
  res.status(unavailable ? 503 : integrity ? 409 : 503).json({
    error: "Trip could not be securely accessed. Please retry. The record was not changed.",
    code: "TRIP_SECURE_ACCESS_REQUIRED",
    recoverable: true,
  });
}

/** Owner response projection intentionally omits owner ID, placeholder, ciphertext, key IDs, and fingerprints. */
function tripView(row: StoredKinfolkTrip, ownerId: string): OwnerTripView {
  const opened = openTrip(row, ownerId);
  return {
    id: row.id,
    ...opened,
    memberConfirmedAt: row.memberConfirmedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function newTrip(input: TripInput, ownerId: string, id: string, now: Date): StoredKinfolkTrip {
  const base = { id, userId: ownerId };
  const encrypted = sealTrip(input, base);
  const row: StoredKinfolkTrip = {
    ...base,
    ...encrypted,
    memberConfirmedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  // Crypto must be viable and the full authenticated envelope must round-trip
  // before any insert is attempted, even if the optional note is blank.
  openTrip(row, ownerId);
  return row;
}

/**
 * Private storage lifecycle only. No chat, memory, profile, discovery, provider,
 * reminder, analytics, calendar, flight, hotel, document, or sharing hooks are
 * imported or called here. This router has no public/shared endpoint.
 */
export function createKinfolkTripsRouter(dependencies: KinfolkTripsRouteDependencies = {}): IRouter {
  const router: IRouter = Router();
  const repository = dependencies.repository ?? postgresTripRepository();
  const makeId = dependencies.makeId ?? randomUUID;
  const now = dependencies.now ?? (() => new Date());

  router.get("/kinfolk/trips", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    try {
      const rows = await repository.list(ownerId);
      // Opening all rows before responding keeps a tampered owner vault fail-closed.
      res.json({ trips: rows.map((row) => tripView(row, ownerId)), boundaries: KINFOLK_TRIP_DEFAULT_NON_USE });
    } catch (error) {
      req.log?.error("Kinfolk Trips list secure access failed");
      secureAccessError(res, error);
    }
  });

  router.post("/kinfolk/trips", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    const input = parseTripInput(req.body);
    if (!input) {
      res.status(400).json({ error: "A title, city/region/country destination, and explicit confirmation are required. Exact addresses and coordinates are not collected." });
      return;
    }
    try {
      const row = newTrip(input, ownerId, makeId(), now());
      const saved = await repository.create(row);
      res.status(201).json({ trip: tripView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trips create secure access failed");
      secureAccessError(res, error);
    }
  });

  router.get("/kinfolk/trips/:id", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.id)) return void notFound(res);
    try {
      const row = await repository.find(ownerId, req.params.id);
      if (!row) return void notFound(res);
      res.json({ trip: tripView(row, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trips read secure access failed");
      secureAccessError(res, error);
    }
  });

  router.put("/kinfolk/trips/:id", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.id)) return void notFound(res);
    const input = parseTripInput(req.body);
    if (!input) {
      res.status(400).json({ error: "A title, city/region/country destination, and explicit confirmation are required. Exact addresses and coordinates are not collected." });
      return;
    }
    try {
      const existing = await repository.find(ownerId, req.params.id);
      if (!existing) return void notFound(res);
      // Open old content before replacing it. A key outage or tamper is never overwritten.
      openTrip(existing, ownerId);
      const encrypted = sealTrip(input, existing);
      const candidate = { ...existing, ...encrypted, memberConfirmedAt: now(), updatedAt: now() };
      // Verify the new authenticated ciphertext before the first update mutation.
      openTrip(candidate, ownerId);
      const saved = await repository.update(ownerId, existing.id, encrypted, candidate.memberConfirmedAt);
      if (!saved) return void notFound(res);
      res.json({ trip: tripView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trips update secure access failed");
      secureAccessError(res, error);
    }
  });

  router.delete("/kinfolk/trips/:id", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.id)) return void notFound(res);
    if (!parseTripDeleteConfirmation(req.body)) {
      res.status(400).json({ error: "Explicit confirmation is required to delete a Trip." });
      return;
    }
    try {
      const existing = await repository.find(ownerId, req.params.id);
      if (!existing) return void notFound(res);
      // A record must be authenticated before deletion; failed crypto never deletes evidence.
      openTrip(existing, ownerId);
      if (!await repository.remove(ownerId, existing.id)) return void notFound(res);
      res.json({ removed: true });
    } catch (error) {
      req.log?.error("Kinfolk Trips delete secure access failed");
      secureAccessError(res, error);
    }
  });

  return router;
}

const router = createKinfolkTripsRouter();
export default router;
