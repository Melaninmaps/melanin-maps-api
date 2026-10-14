import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "@workspace/db";
import {
  isTripId,
  openTrip,
  type StoredKinfolkTrip,
} from "../kinfolk/trip-policy";
import {
  KINFOLK_TRIP_ITINERARY_DEFAULT_NON_USE,
  openTripItineraryEntry,
  parseTripItineraryDeleteConfirmation,
  parseTripItineraryInput,
  parseTripItineraryOrderInput,
  sealTripItineraryEntry,
  type StoredKinfolkTripItineraryEntry,
  type TripItineraryInput,
} from "../kinfolk/trip-itinerary-policy";
import {
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../kinfolk/private-memory-encryption";

export const TRIP_ITINERARY_TEMPORARY_ORDER_OFFSET = 1_000_000;
/** New rows use a separate temporary range while all existing rows are shifted. */
export function tripItineraryNewEntryTemporaryOrder(dayOrder: number): number {
  return dayOrder + (TRIP_ITINERARY_TEMPORARY_ORDER_OFFSET * 2);
}

const tripColumns = `id, user_id AS "userId", title, encrypted_title AS "encryptedTitle",
  title_encryption_key_id AS "titleEncryptionKeyId", destination,
  encrypted_destination AS "encryptedDestination",
  destination_encryption_key_id AS "destinationEncryptionKeyId", note,
  encrypted_note AS "encryptedNote", note_encryption_key_id AS "noteEncryptionKeyId",
  member_confirmed_at AS "memberConfirmedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

const entryColumns = `id, trip_id AS "tripId", user_id AS "userId", day_label AS "dayLabel",
  encrypted_day_label AS "encryptedDayLabel", day_label_encryption_key_id AS "dayLabelEncryptionKeyId",
  day_order AS "dayOrder", start_time_label AS "startTimeLabel",
  encrypted_start_time_label AS "encryptedStartTimeLabel",
  start_time_label_encryption_key_id AS "startTimeLabelEncryptionKeyId",
  end_time_label AS "endTimeLabel", encrypted_end_time_label AS "encryptedEndTimeLabel",
  end_time_label_encryption_key_id AS "endTimeLabelEncryptionKeyId", title,
  encrypted_title AS "encryptedTitle", title_encryption_key_id AS "titleEncryptionKeyId", note,
  encrypted_note AS "encryptedNote", note_encryption_key_id AS "noteEncryptionKeyId",
  member_confirmed_at AS "memberConfirmedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;

export type KinfolkTripItineraryRepository = {
  findTrip(ownerId: string, tripId: string): Promise<StoredKinfolkTrip | null>;
  list(ownerId: string, tripId: string): Promise<StoredKinfolkTripItineraryEntry[]>;
  find(ownerId: string, tripId: string, entryId: string): Promise<StoredKinfolkTripItineraryEntry | null>;
  create(row: StoredKinfolkTripItineraryEntry): Promise<StoredKinfolkTripItineraryEntry | null>;
  update(
    ownerId: string,
    tripId: string,
    entryId: string,
    encrypted: ReturnType<typeof sealTripItineraryEntry>,
    dayOrder: number,
    memberConfirmedAt: Date,
  ): Promise<StoredKinfolkTripItineraryEntry | null>;
  remove(ownerId: string, tripId: string, entryId: string): Promise<boolean>;
  reorder(ownerId: string, tripId: string, entryIds: string[]): Promise<StoredKinfolkTripItineraryEntry[] | null>;
};

type OrderedClient = PoolClient;

async function withLockedTrip<T>(
  ownerId: string,
  tripId: string,
  operation: (client: OrderedClient) => Promise<T>,
): Promise<T | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // The parent lock plus this transaction-scoped key serializes all order writes
    // for a Trip without trusting browser/device ordering state.
    const parent = await client.query(
      "SELECT id FROM kinfolk_trips WHERE id = $1 AND user_id = $2 FOR UPDATE", [tripId, ownerId],
    );
    if (!parent.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`kinfolk-trip-itinerary:${tripId}`]);
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function orderedEntryIds(client: OrderedClient, ownerId: string, tripId: string): Promise<string[]> {
  const result = await client.query<{ id: string }>(
    `SELECT id FROM kinfolk_trip_itinerary_entries
      WHERE user_id = $1 AND trip_id = $2 ORDER BY day_order ASC, created_at ASC, id ASC FOR UPDATE`,
    [ownerId, tripId],
  );
  return result.rows.map((row) => row.id);
}

/** Sets a disjoint temporary range before writing final positions, keeping swaps collision-safe. */
async function setEntryOrder(client: OrderedClient, ownerId: string, tripId: string, entryIds: readonly string[]): Promise<void> {
  await client.query(
    `UPDATE kinfolk_trip_itinerary_entries SET day_order = day_order + ${TRIP_ITINERARY_TEMPORARY_ORDER_OFFSET}
      WHERE user_id = $1 AND trip_id = $2`, [ownerId, tripId],
  );
  for (const [index, entryId] of entryIds.entries()) {
    await client.query(
      `UPDATE kinfolk_trip_itinerary_entries SET day_order = $4
        WHERE user_id = $1 AND trip_id = $2 AND id = $3`,
      [ownerId, tripId, entryId, index + 1],
    );
  }
}

function postgresTripItineraryRepository(): KinfolkTripItineraryRepository {
  return {
    async findTrip(ownerId, tripId) {
      const result = await pool.query<StoredKinfolkTrip>(
        `SELECT ${tripColumns} FROM kinfolk_trips WHERE id = $1 AND user_id = $2 LIMIT 1`, [tripId, ownerId],
      );
      return result.rows[0] ?? null;
    },
    async list(ownerId, tripId) {
      const result = await pool.query<StoredKinfolkTripItineraryEntry>(
        `SELECT ${entryColumns} FROM kinfolk_trip_itinerary_entries
          WHERE user_id = $1 AND trip_id = $2 ORDER BY day_order ASC, created_at ASC, id ASC`, [ownerId, tripId],
      );
      return result.rows;
    },
    async find(ownerId, tripId, entryId) {
      const result = await pool.query<StoredKinfolkTripItineraryEntry>(
        `SELECT ${entryColumns} FROM kinfolk_trip_itinerary_entries
          WHERE id = $1 AND trip_id = $2 AND user_id = $3 LIMIT 1`, [entryId, tripId, ownerId],
      );
      return result.rows[0] ?? null;
    },
    async create(row) {
      return withLockedTrip(row.userId, row.tripId, async (client) => {
        const existingIds = await orderedEntryIds(client, row.userId, row.tripId);
        if (row.dayOrder > existingIds.length + 1) return null;
        const finalIds = [...existingIds];
        finalIds.splice(row.dayOrder - 1, 0, row.id);
        await client.query(
          `UPDATE kinfolk_trip_itinerary_entries SET day_order = day_order + ${TRIP_ITINERARY_TEMPORARY_ORDER_OFFSET}
            WHERE user_id = $1 AND trip_id = $2`, [row.userId, row.tripId],
        );
        const created = await client.query<StoredKinfolkTripItineraryEntry>(
          `INSERT INTO kinfolk_trip_itinerary_entries (
            id, trip_id, user_id, day_label, encrypted_day_label, day_label_encryption_key_id, day_order,
            start_time_label, encrypted_start_time_label, start_time_label_encryption_key_id,
            end_time_label, encrypted_end_time_label, end_time_label_encryption_key_id,
            title, encrypted_title, title_encryption_key_id, note, encrypted_note, note_encryption_key_id,
            member_confirmed_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          RETURNING ${entryColumns}`,
          [
            row.id, row.tripId, row.userId, row.dayLabel, row.encryptedDayLabel, row.dayLabelEncryptionKeyId,
            tripItineraryNewEntryTemporaryOrder(row.dayOrder), row.startTimeLabel, row.encryptedStartTimeLabel, row.startTimeLabelEncryptionKeyId,
            row.endTimeLabel, row.encryptedEndTimeLabel, row.endTimeLabelEncryptionKeyId, row.title,
            row.encryptedTitle, row.titleEncryptionKeyId, row.note, row.encryptedNote, row.noteEncryptionKeyId,
            row.memberConfirmedAt, row.createdAt, row.updatedAt,
          ],
        );
        for (const [index, entryId] of finalIds.entries()) {
          await client.query(
            `UPDATE kinfolk_trip_itinerary_entries SET day_order = $4
              WHERE user_id = $1 AND trip_id = $2 AND id = $3`,
            [row.userId, row.tripId, entryId, index + 1],
          );
        }
        return { ...created.rows[0]!, dayOrder: row.dayOrder };
      });
    },
    async update(ownerId, tripId, entryId, encrypted, dayOrder, memberConfirmedAt) {
      return withLockedTrip(ownerId, tripId, async (client) => {
        const existingIds = await orderedEntryIds(client, ownerId, tripId);
        const currentIndex = existingIds.indexOf(entryId);
        if (currentIndex < 0 || dayOrder > existingIds.length) return null;
        const finalIds = [...existingIds];
        finalIds.splice(currentIndex, 1);
        finalIds.splice(dayOrder - 1, 0, entryId);
        await setEntryOrder(client, ownerId, tripId, finalIds);
        const saved = await client.query<StoredKinfolkTripItineraryEntry>(
          `UPDATE kinfolk_trip_itinerary_entries
            SET day_label = $4, encrypted_day_label = $5, day_label_encryption_key_id = $6,
                start_time_label = $7, encrypted_start_time_label = $8, start_time_label_encryption_key_id = $9,
                end_time_label = $10, encrypted_end_time_label = $11, end_time_label_encryption_key_id = $12,
                title = $13, encrypted_title = $14, title_encryption_key_id = $15,
                note = $16, encrypted_note = $17, note_encryption_key_id = $18,
                member_confirmed_at = $19, updated_at = NOW()
            WHERE user_id = $1 AND trip_id = $2 AND id = $3
            RETURNING ${entryColumns}`,
          [
            ownerId, tripId, entryId, encrypted.dayLabel, encrypted.encryptedDayLabel, encrypted.dayLabelEncryptionKeyId,
            encrypted.startTimeLabel, encrypted.encryptedStartTimeLabel, encrypted.startTimeLabelEncryptionKeyId,
            encrypted.endTimeLabel, encrypted.encryptedEndTimeLabel, encrypted.endTimeLabelEncryptionKeyId,
            encrypted.title, encrypted.encryptedTitle, encrypted.titleEncryptionKeyId,
            encrypted.note, encrypted.encryptedNote, encrypted.noteEncryptionKeyId, memberConfirmedAt,
          ],
        );
        return saved.rows[0] ?? null;
      });
    },
    async remove(ownerId, tripId, entryId) {
      return (await withLockedTrip(ownerId, tripId, async (client) => {
        const existingIds = await orderedEntryIds(client, ownerId, tripId);
        if (!existingIds.includes(entryId)) return false;
        await client.query(
          `UPDATE kinfolk_trip_itinerary_entries SET day_order = day_order + ${TRIP_ITINERARY_TEMPORARY_ORDER_OFFSET}
            WHERE user_id = $1 AND trip_id = $2`, [ownerId, tripId],
        );
        const deleted = await client.query(
          `DELETE FROM kinfolk_trip_itinerary_entries WHERE user_id = $1 AND trip_id = $2 AND id = $3 RETURNING id`,
          [ownerId, tripId, entryId],
        );
        if (!deleted.rows[0]) return false;
        await setEntryOrder(client, ownerId, tripId, existingIds.filter((id) => id !== entryId));
        return true;
      })) ?? false;
    },
    async reorder(ownerId, tripId, entryIds) {
      return withLockedTrip(ownerId, tripId, async (client) => {
        const existingIds = await orderedEntryIds(client, ownerId, tripId);
        if (existingIds.length !== entryIds.length || existingIds.some((id) => !entryIds.includes(id))) return null;
        await setEntryOrder(client, ownerId, tripId, entryIds);
        const reordered = await client.query<StoredKinfolkTripItineraryEntry>(
          `SELECT ${entryColumns} FROM kinfolk_trip_itinerary_entries
            WHERE user_id = $1 AND trip_id = $2 ORDER BY day_order ASC, created_at ASC, id ASC`, [ownerId, tripId],
        );
        return reordered.rows;
      });
    },
  };
}

export type KinfolkTripItineraryRouteDependencies = Readonly<{
  repository?: KinfolkTripItineraryRepository;
  makeId?: () => string;
  now?: () => Date;
}>;

type OwnerEntryView = Readonly<{
  id: string;
  dayLabel: string;
  dayOrder: number;
  startTimeLabel: string;
  endTimeLabel: string;
  title: string;
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

function tripNotFound(res: Response): void { res.status(404).json({ error: "Trip not found" }); }
function entryNotFound(res: Response): void { res.status(404).json({ error: "Trip itinerary item not found" }); }

function secureAccessError(res: Response, error: unknown): void {
  const unavailable = error instanceof PrivateMemoryEncryptionUnavailableError;
  const integrity = error instanceof PrivateMemoryEncryptionIntegrityError;
  res.status(unavailable ? 503 : integrity ? 409 : 503).json({
    error: "Trip itinerary could not be securely accessed. Please retry. The record was not changed.",
    code: "TRIP_ITINERARY_SECURE_ACCESS_REQUIRED",
    recoverable: true,
  });
}

/** Owner projection excludes the owner key, placeholders, ciphertext, encryption key IDs, and fingerprints. */
function entryView(row: StoredKinfolkTripItineraryEntry, ownerId: string): OwnerEntryView {
  const opened = openTripItineraryEntry(row, ownerId);
  return {
    id: row.id,
    ...opened,
    memberConfirmedAt: row.memberConfirmedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function newEntry(
  input: TripItineraryInput,
  ownerId: string,
  tripId: string,
  id: string,
  now: Date,
): StoredKinfolkTripItineraryEntry {
  const base = { id, tripId, userId: ownerId };
  const encrypted = sealTripItineraryEntry(input, base);
  const row: StoredKinfolkTripItineraryEntry = {
    ...base,
    ...encrypted,
    dayOrder: input.dayOrder,
    memberConfirmedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  openTripItineraryEntry(row, ownerId);
  return row;
}

async function authenticatedTrip(
  repository: KinfolkTripItineraryRepository,
  ownerId: string,
  tripId: string,
): Promise<StoredKinfolkTrip | null> {
  const trip = await repository.findTrip(ownerId, tripId);
  if (!trip) return null;
  // A tampered parent never authorizes a child mutation or reveal.
  openTrip(trip, ownerId);
  return trip;
}

/**
 * Private owner-only nested Trip lifecycle. It has no public/read-share route and
 * imports no chat, memory, profile, discovery, provider, calendar, booking,
 * flight, hotel, event, document, task, reminder, notification, analytics, or sharing hook.
 */
export function createKinfolkTripItineraryRouter(dependencies: KinfolkTripItineraryRouteDependencies = {}): IRouter {
  const router: IRouter = Router();
  const repository = dependencies.repository ?? postgresTripItineraryRepository();
  const makeId = dependencies.makeId ?? randomUUID;
  const now = dependencies.now ?? (() => new Date());

  router.get("/kinfolk/trips/:tripId/itinerary", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const rows = await repository.list(ownerId, trip.id);
      // Opening every row before a response keeps the entire private organizer fail-closed.
      res.json({ entries: rows.map((row) => entryView(row, ownerId)), boundaries: KINFOLK_TRIP_ITINERARY_DEFAULT_NON_USE });
    } catch (error) {
      req.log?.error("Kinfolk Trip itinerary list secure access failed");
      secureAccessError(res, error);
    }
  });

  router.post("/kinfolk/trips/:tripId/itinerary", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    const input = parseTripItineraryInput(req.body);
    if (!input) {
      res.status(400).json({ error: "Provide a valid private day label, order, title, optional time labels/note, and explicit confirmation." });
      return;
    }
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const row = newEntry(input, ownerId, trip.id, makeId(), now());
      const saved = await repository.create(row);
      if (!saved) {
        res.status(400).json({ error: "Choose an available private itinerary order." });
        return;
      }
      res.status(201).json({ entry: entryView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trip itinerary create secure access failed");
      secureAccessError(res, error);
    }
  });

  router.put("/kinfolk/trips/:tripId/itinerary/order", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    const entryIds = parseTripItineraryOrderInput(req.body);
    if (!entryIds) {
      res.status(400).json({ error: "Provide the complete private itinerary order and explicit confirmation." });
      return;
    }
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const current = await repository.list(ownerId, trip.id);
      // Authenticate every current envelope before the order mutation can occur.
      current.forEach((entry) => openTripItineraryEntry(entry, ownerId));
      if (current.length !== entryIds.length || current.some((entry) => !entryIds.includes(entry.id))) {
        res.status(400).json({ error: "Provide the complete current private itinerary order." });
        return;
      }
      const reordered = await repository.reorder(ownerId, trip.id, entryIds);
      if (!reordered) return void entryNotFound(res);
      res.json({ entries: reordered.map((entry) => entryView(entry, ownerId)) });
    } catch (error) {
      req.log?.error("Kinfolk Trip itinerary order secure access failed");
      secureAccessError(res, error);
    }
  });

  router.get("/kinfolk/trips/:tripId/itinerary/:entryId", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isTripId(req.params.entryId)) return void entryNotFound(res);
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const entry = await repository.find(ownerId, trip.id, req.params.entryId);
      if (!entry) return void entryNotFound(res);
      res.json({ entry: entryView(entry, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trip itinerary read secure access failed");
      secureAccessError(res, error);
    }
  });

  router.put("/kinfolk/trips/:tripId/itinerary/:entryId", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isTripId(req.params.entryId)) return void entryNotFound(res);
    const input = parseTripItineraryInput(req.body);
    if (!input) {
      res.status(400).json({ error: "Provide a valid private day label, order, title, optional time labels/note, and explicit confirmation." });
      return;
    }
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const existing = await repository.find(ownerId, trip.id, req.params.entryId);
      if (!existing) return void entryNotFound(res);
      // Open the old envelope before replacement so tamper or a key outage never overwrites it.
      openTripItineraryEntry(existing, ownerId);
      const encrypted = sealTripItineraryEntry(input, existing);
      const candidate = { ...existing, ...encrypted, dayOrder: input.dayOrder, memberConfirmedAt: now(), updatedAt: now() };
      openTripItineraryEntry(candidate, ownerId);
      const saved = await repository.update(ownerId, trip.id, existing.id, encrypted, input.dayOrder, candidate.memberConfirmedAt);
      if (!saved) return void entryNotFound(res);
      res.json({ entry: entryView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Kinfolk Trip itinerary update secure access failed");
      secureAccessError(res, error);
    }
  });

  router.delete("/kinfolk/trips/:tripId/itinerary/:entryId", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isTripId(req.params.tripId)) return void tripNotFound(res);
    if (!isTripId(req.params.entryId)) return void entryNotFound(res);
    if (!parseTripItineraryDeleteConfirmation(req.body)) {
      res.status(400).json({ error: "Explicit confirmation is required to delete a private itinerary item." });
      return;
    }
    try {
      const trip = await authenticatedTrip(repository, ownerId, req.params.tripId);
      if (!trip) return void tripNotFound(res);
      const existing = await repository.find(ownerId, trip.id, req.params.entryId);
      if (!existing) return void entryNotFound(res);
      // A complete authenticated envelope is required before deletion.
      openTripItineraryEntry(existing, ownerId);
      if (!await repository.remove(ownerId, trip.id, existing.id)) return void entryNotFound(res);
      res.json({ removed: true });
    } catch (error) {
      req.log?.error("Kinfolk Trip itinerary delete secure access failed");
      secureAccessError(res, error);
    }
  });

  return router;
}

const router = createKinfolkTripItineraryRouter();
export default router;
