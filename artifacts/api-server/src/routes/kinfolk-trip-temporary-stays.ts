import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  isTripId,
  openTrip,
  type StoredKinfolkTrip,
} from "../kinfolk/trip-policy";
import {
  isTemporaryStayExpired,
  openTemporaryStay,
  temporaryStayExpiresAt,
} from "../kinfolk/temporary-stays-policy";
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

const temporaryStayColumns = `id, user_id AS "userId", label, encrypted_payload AS "encryptedPayload",
  encryption_key_version AS "encryptionKeyVersion", is_active AS "isActive",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

const linkColumns = `id, trip_id AS "tripId", temporary_stay_id AS "temporaryStayId",
  user_id AS "userId", member_confirmed_at AS "memberConfirmedAt",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export type StoredTemporaryStay = Readonly<{
  id: string;
  userId: string;
  label: string;
  encryptedPayload: string;
  encryptionKeyVersion: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}>;

export type StoredKinfolkTripTemporaryStayLink = Readonly<{
  id: string;
  tripId: string;
  temporaryStayId: string;
  userId: string;
  memberConfirmedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}>;

export type KinfolkTripTemporaryStaysRepository = {
  findTrip(ownerId: string, tripId: string): Promise<StoredKinfolkTrip | null>;
  /** Active rows only: inactive stays cannot enter a Trip context through this route. */
  listAvailableStays(ownerId: string): Promise<StoredTemporaryStay[]>;
  findAvailableStay(ownerId: string, stayId: string): Promise<StoredTemporaryStay | null>;
  /** Owner-scoped only for unlinking a reference that has since become unavailable. */
  findOwnedStay(ownerId: string, stayId: string): Promise<StoredTemporaryStay | null>;
  listLinks(ownerId: string, tripId: string): Promise<StoredKinfolkTripTemporaryStayLink[]>;
  link(row: StoredKinfolkTripTemporaryStayLink): Promise<StoredKinfolkTripTemporaryStayLink | null>;
  unlink(ownerId: string, tripId: string, stayId: string): Promise<boolean>;
};

function postgresTripTemporaryStaysRepository(): KinfolkTripTemporaryStaysRepository {
  return {
    async findTrip(ownerId, tripId) {
      const result = await pool.query<StoredKinfolkTrip>(
        `SELECT ${tripColumns} FROM kinfolk_trips WHERE id = $1 AND user_id = $2 LIMIT 1`, [tripId, ownerId],
      );
      return result.rows[0] ?? null;
    },
    async listAvailableStays(ownerId) {
      const result = await pool.query<StoredTemporaryStay>(
        `SELECT ${temporaryStayColumns} FROM kinfolk_temporary_stays
          WHERE user_id = $1 AND is_active = true ORDER BY updated_at DESC`, [ownerId],
      );
      return result.rows;
    },
    async findAvailableStay(ownerId, stayId) {
      const result = await pool.query<StoredTemporaryStay>(
        `SELECT ${temporaryStayColumns} FROM kinfolk_temporary_stays
          WHERE id = $1 AND user_id = $2 AND is_active = true LIMIT 1`, [stayId, ownerId],
      );
      return result.rows[0] ?? null;
    },
    async findOwnedStay(ownerId, stayId) {
      const result = await pool.query<StoredTemporaryStay>(
        `SELECT ${temporaryStayColumns} FROM kinfolk_temporary_stays
          WHERE id = $1 AND user_id = $2 LIMIT 1`, [stayId, ownerId],
      );
      return result.rows[0] ?? null;
    },
    async listLinks(ownerId, tripId) {
      const result = await pool.query<StoredKinfolkTripTemporaryStayLink>(
        `SELECT ${linkColumns} FROM kinfolk_trip_temporary_stays
          WHERE user_id = $1 AND trip_id = $2 ORDER BY created_at ASC, id ASC`, [ownerId, tripId],
      );
      return result.rows;
    },
    async link(row) {
      const result = await pool.query<StoredKinfolkTripTemporaryStayLink>(
        `INSERT INTO kinfolk_trip_temporary_stays (
          id, trip_id, temporary_stay_id, user_id, member_confirmed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (trip_id, temporary_stay_id) DO UPDATE
          SET member_confirmed_at = EXCLUDED.member_confirmed_at, updated_at = NOW()
        WHERE kinfolk_trip_temporary_stays.user_id = EXCLUDED.user_id
        RETURNING ${linkColumns}`,
        [row.id, row.tripId, row.temporaryStayId, row.userId, row.memberConfirmedAt, row.createdAt, row.updatedAt],
      );
      return result.rows[0] ?? null;
    },
    async unlink(ownerId, tripId, stayId) {
      const result = await pool.query(
        `DELETE FROM kinfolk_trip_temporary_stays
          WHERE user_id = $1 AND trip_id = $2 AND temporary_stay_id = $3 RETURNING id`,
        [ownerId, tripId, stayId],
      );
      return Boolean(result.rows[0]);
    },
  };
}

export type KinfolkTripTemporaryStaysRouteDependencies = Readonly<{
  repository?: KinfolkTripTemporaryStaysRepository;
  makeId?: () => string;
  now?: () => Date;
}>;

type SafeTripTemporaryStay = Readonly<{
  id: string;
  label: string;
  isActive: true;
  arrivalDate: string;
  departureDate: string;
  expiresAt: Date;
  linked: boolean;
}>;

function owner(req: Request, res: Response): string | null {
  res.setHeader("Cache-Control", "no-store");
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
}

function tripNotFound(res: Response): void { res.status(404).json({ error: "Trip not found" }); }
/** Stay IDs are indistinguishable when malformed, missing, cross-owner, inactive, or expired. */
function unavailableStay(res: Response): void { res.status(404).json({ error: "Temporary Stay not available" }); }

function secureAccessError(res: Response, error: unknown): void {
  const tripUnavailable = error instanceof PrivateMemoryEncryptionUnavailableError;
  const tripIntegrity = error instanceof PrivateMemoryEncryptionIntegrityError;
  const temporaryStayIntegrity = error instanceof Error && error.message === "PRIVATE_PLACES_DECRYPTION_INVALID";
  res.status(tripUnavailable ? 503 : tripIntegrity || temporaryStayIntegrity ? 409 : 503).json({
    error: "Trip Temporary Stay could not be securely accessed. Please retry. The record was not changed.",
    code: "TRIP_TEMPORARY_STAY_SECURE_ACCESS_REQUIRED",
    recoverable: true,
  });
}

function exactObject(body: unknown, allowed: readonly string[]): body is Record<string, unknown> {
  return Boolean(body) && typeof body === "object" && !Array.isArray(body) &&
    Object.keys(body as Record<string, unknown>).every((key) => allowed.includes(key));
}

function parseLinkInput(body: unknown): string | null {
  if (!exactObject(body, ["temporaryStayId", "memberConfirmed"]) || body.memberConfirmed !== true) return null;
  return isTripId(body.temporaryStayId) ? body.temporaryStayId : null;
}

function parseUnlinkConfirmation(body: unknown): boolean {
  return exactObject(body, ["memberConfirmed"]) && body.memberConfirmed === true;
}

/** Decrypt only to check retained dates, then return the existing safe lifecycle projection. */
function safeAvailableStay(
  row: StoredTemporaryStay,
  linked: boolean,
  now: Date,
): SafeTripTemporaryStay | null {
  if (!row.isActive) return null;
  const payload = openTemporaryStay(row.encryptedPayload, row.encryptionKeyVersion);
  if (isTemporaryStayExpired(payload, now)) return null;
  return {
    id: row.id,
    label: row.label,
    isActive: true,
    arrivalDate: payload.arrivalDate,
    departureDate: payload.departureDate,
    expiresAt: temporaryStayExpiresAt(payload),
    linked,
  };
}

async function authenticatedTrip(
  repository: KinfolkTripTemporaryStaysRepository,
  ownerId: string,
  tripId: string,
): Promise<StoredKinfolkTrip | null> {
  const trip = await repository.findTrip(ownerId, tripId);
  if (!trip) return null;
  // A tampered parent never authorizes a stay link read or mutation.
  openTrip(trip, ownerId);
  return trip;
}

/**
 * Linking is a private, deliberate storage reference only. It has no public route
 * and imports no Temporary Stay creator, Google/provider, nearby search, calendar,
 * booking, chat-memory, profile, discovery, Map, Directory, Community, Safety,
 * analytics, reminder, notification, or sharing behavior. It never changes a
 * Temporary Stay; unlink removes only the reference.
 */
export function createKinfolkTripTemporaryStaysRouter(
  dependencies: KinfolkTripTemporaryStaysRouteDependencies = {},
): IRouter {
  const router: IRouter = Router();
  const repository = dependencies.repository ?? postgresTripTemporaryStaysRepository();
  const makeId = dependencies.makeId ?? randomUUID;
  const now = dependencies.now ?? (() => new Date());

  router.get("/kinfolk/trips/:tripId/temporary-stays", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const [rows, links] = await Promise.all([
        repository.listAvailableStays(ownerId),
        repository.listLinks(ownerId, trip.id),
      ]);
      const linkedStayIds = new Set(links.map((link) => link.temporaryStayId));
      // Open every visible active stay before responding: unreadable ciphertext fails closed.
      const requestNow = now();
      const stays = rows
        .map((row) => safeAvailableStay(row, linkedStayIds.has(row.id), requestNow))
        .filter((stay): stay is SafeTripTemporaryStay => stay !== null);
      // The list carries only the safe Temporary Stay projection, never policy
      // text or any field from the encrypted location record.
      res.json({ stays });
    } catch (error) {
      req.log?.error("Kinfolk Trip Temporary Stay list secure access failed");
      secureAccessError(res, error);
    }
  });

  router.post("/kinfolk/trips/:tripId/temporary-stays", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    const stayId = parseLinkInput(req.body);
    if (!stayId) {
      res.status(400).json({ error: "A valid Temporary Stay and explicit confirmation are required to link it." });
      return;
    }
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const stay = await repository.findAvailableStay(ownerId, stayId);
      if (!stay) return void unavailableStay(res);
      const view = safeAvailableStay(stay, true, now());
      if (!view) return void unavailableStay(res);
      const confirmedAt = now();
      const linked = await repository.link({
        id: makeId(), tripId: trip.id, temporaryStayId: stay.id, userId: ownerId,
        memberConfirmedAt: confirmedAt, createdAt: confirmedAt, updatedAt: confirmedAt,
      });
      if (!linked) return void unavailableStay(res);
      res.status(201).json({ stay: view });
    } catch (error) {
      req.log?.error("Kinfolk Trip Temporary Stay link secure access failed");
      secureAccessError(res, error);
    }
  });

  router.delete("/kinfolk/trips/:tripId/temporary-stays/:stayId", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isTripId(req.params.stayId)) return void unavailableStay(res);
    if (!parseUnlinkConfirmation(req.body)) {
      res.status(400).json({ error: "Explicit confirmation is required to unlink a Temporary Stay." });
      return;
    }
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      // A later pause or expiry must never make a stay usable as Trip context,
      // but it must not trap the private link: the same owner may still remove
      // only that opaque reference after authenticated decryption.
      const stay = await repository.findOwnedStay(ownerId, req.params.stayId);
      if (!stay) return void unavailableStay(res);
      openTemporaryStay(stay.encryptedPayload, stay.encryptionKeyVersion);
      // This is the sole mutation: no Temporary Stay or parent Trip lifecycle is changed.
      if (!await repository.unlink(ownerId, trip.id, stay.id)) return void unavailableStay(res);
      res.json({ removed: true });
    } catch (error) {
      req.log?.error("Kinfolk Trip Temporary Stay unlink secure access failed");
      secureAccessError(res, error);
    }
  });

  return router;
}

/** This relation never triggers cross-surface behavior without a separate future approval. */
export const KINFOLK_TRIP_TEMPORARY_STAY_DEFAULT_NON_USE = Object.freeze([
  "Linking does not send the Temporary Stay address to Kinfolk chat or memory.",
  "Linking does not trigger nearby search, calendar, booking, provider, reminders, sharing, Map, Directory, Community, Safety, or analytics.",
  "Temporary Stay creation, exact address entry, retention, and Google disclosure remain only in Settings.",
]);

const router = createKinfolkTripTemporaryStaysRouter();
export default router;
