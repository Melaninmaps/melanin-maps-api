import { randomUUID } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import {
  isPrivateAvailabilityBlockId,
  KINFOLK_PRIVATE_AVAILABILITY_DEFAULT_NON_USE,
  openPrivateAvailabilityBlock,
  parsePrivateAvailabilityBlockDeleteConfirmation,
  parsePrivateAvailabilityBlockInput,
  parsePrivateAvailabilityPreviewInput,
  privateAvailabilityConflicts,
  sealPrivateAvailabilityBlock,
  type PrivateAvailabilityBlockInput,
  type StoredPrivateAvailabilityBlock,
} from "../kinfolk/private-availability-blocks-policy";
import {
  PrivateMemoryEncryptionIntegrityError,
  PrivateMemoryEncryptionUnavailableError,
} from "../kinfolk/private-memory-encryption";

export type PrivateAvailabilityBlockRepository = {
  list(ownerId: string): Promise<StoredPrivateAvailabilityBlock[]>;
  find(ownerId: string, id: string): Promise<StoredPrivateAvailabilityBlock | null>;
  create(row: StoredPrivateAvailabilityBlock): Promise<StoredPrivateAvailabilityBlock>;
  update(ownerId: string, id: string, encrypted: ReturnType<typeof sealPrivateAvailabilityBlock>, memberConfirmedAt: Date): Promise<StoredPrivateAvailabilityBlock | null>;
  remove(ownerId: string, id: string): Promise<boolean>;
};

const availabilityColumns = `id, user_id AS "userId", label, encrypted_label AS "encryptedLabel",
  label_encryption_key_id AS "labelEncryptionKeyId", start_at AS "startAt",
  encrypted_start_at AS "encryptedStartAt", start_at_encryption_key_id AS "startAtEncryptionKeyId",
  end_at AS "endAt", encrypted_end_at AS "encryptedEndAt",
  end_at_encryption_key_id AS "endAtEncryptionKeyId", time_zone AS "timeZone",
  encrypted_time_zone AS "encryptedTimeZone", time_zone_encryption_key_id AS "timeZoneEncryptionKeyId",
  planning_opt_in AS "planningOptIn", member_confirmed_at AS "memberConfirmedAt",
  created_at AS "createdAt", updated_at AS "updatedAt"`;

/** Every direct-ID SQL operation stays owner-scoped; time details are never queryable in cleartext. */
function postgresPrivateAvailabilityBlockRepository(): PrivateAvailabilityBlockRepository {
  return {
    async list(ownerId) {
      const result = await pool.query<StoredPrivateAvailabilityBlock>(
        `SELECT ${availabilityColumns} FROM kinfolk_private_availability_blocks
          WHERE user_id = $1 ORDER BY updated_at DESC`, [ownerId],
      );
      return result.rows;
    },
    async find(ownerId, id) {
      const result = await pool.query<StoredPrivateAvailabilityBlock>(
        `SELECT ${availabilityColumns} FROM kinfolk_private_availability_blocks
          WHERE id = $1 AND user_id = $2 LIMIT 1`, [id, ownerId],
      );
      return result.rows[0] ?? null;
    },
    async create(row) {
      const result = await pool.query<StoredPrivateAvailabilityBlock>(
        `INSERT INTO kinfolk_private_availability_blocks (
          id, user_id, label, encrypted_label, label_encryption_key_id, start_at,
          encrypted_start_at, start_at_encryption_key_id, end_at, encrypted_end_at,
          end_at_encryption_key_id, time_zone, encrypted_time_zone, time_zone_encryption_key_id,
          planning_opt_in, member_confirmed_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING ${availabilityColumns}`,
        [
          row.id, row.userId, row.label, row.encryptedLabel, row.labelEncryptionKeyId,
          row.startAt, row.encryptedStartAt, row.startAtEncryptionKeyId, row.endAt,
          row.encryptedEndAt, row.endAtEncryptionKeyId, row.timeZone, row.encryptedTimeZone,
          row.timeZoneEncryptionKeyId, row.planningOptIn, row.memberConfirmedAt, row.createdAt, row.updatedAt,
        ],
      );
      return result.rows[0]!;
    },
    async update(ownerId, id, encrypted, memberConfirmedAt) {
      const result = await pool.query<StoredPrivateAvailabilityBlock>(
        `UPDATE kinfolk_private_availability_blocks
            SET label = $3, encrypted_label = $4, label_encryption_key_id = $5,
                start_at = $6, encrypted_start_at = $7, start_at_encryption_key_id = $8,
                end_at = $9, encrypted_end_at = $10, end_at_encryption_key_id = $11,
                time_zone = $12, encrypted_time_zone = $13, time_zone_encryption_key_id = $14,
                planning_opt_in = $15, member_confirmed_at = $16, updated_at = NOW()
          WHERE id = $1 AND user_id = $2
          RETURNING ${availabilityColumns}`,
        [
          id, ownerId, encrypted.label, encrypted.encryptedLabel, encrypted.labelEncryptionKeyId,
          encrypted.startAt, encrypted.encryptedStartAt, encrypted.startAtEncryptionKeyId,
          encrypted.endAt, encrypted.encryptedEndAt, encrypted.endAtEncryptionKeyId,
          encrypted.timeZone, encrypted.encryptedTimeZone, encrypted.timeZoneEncryptionKeyId,
          encrypted.planningOptIn, memberConfirmedAt,
        ],
      );
      return result.rows[0] ?? null;
    },
    async remove(ownerId, id) {
      const result = await pool.query(
        "DELETE FROM kinfolk_private_availability_blocks WHERE id = $1 AND user_id = $2 RETURNING id", [id, ownerId],
      );
      return Boolean(result.rows[0]);
    },
  };
}

export type PrivateAvailabilityBlocksRouteDependencies = Readonly<{
  repository?: PrivateAvailabilityBlockRepository;
  makeId?: () => string;
  now?: () => Date;
}>;

type OwnerAvailabilityBlockView = Readonly<{
  id: string;
  label: string;
  startAt: string;
  endAt: string;
  timeZone: string;
  planningOptIn: boolean;
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

/** Malformed, absent, and cross-owner IDs deliberately have one generic outcome. */
function notFound(res: Response): void {
  res.status(404).json({ error: "Availability block not found" });
}

function secureAccessError(res: Response, error: unknown): void {
  const unavailable = error instanceof PrivateMemoryEncryptionUnavailableError;
  const integrity = error instanceof PrivateMemoryEncryptionIntegrityError;
  res.status(unavailable ? 503 : integrity ? 409 : 503).json({
    error: "Availability block could not be securely accessed. Please retry. The record was not changed.",
    code: "PRIVATE_AVAILABILITY_SECURE_ACCESS_REQUIRED",
    recoverable: true,
  });
}

/** Owner response projection omits owner ID, placeholders, ciphertext, key IDs, and crypto internals. */
function blockView(row: StoredPrivateAvailabilityBlock, ownerId: string): OwnerAvailabilityBlockView {
  const opened = openPrivateAvailabilityBlock(row, ownerId);
  return {
    id: row.id,
    ...opened,
    memberConfirmedAt: row.memberConfirmedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function newBlock(input: PrivateAvailabilityBlockInput, ownerId: string, id: string, now: Date): StoredPrivateAvailabilityBlock {
  const base = { id, userId: ownerId };
  const encrypted = sealPrivateAvailabilityBlock(input, base);
  const row: StoredPrivateAvailabilityBlock = {
    ...base,
    ...encrypted,
    memberConfirmedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  // Crypto viability and all interval validation must round-trip before an insert.
  openPrivateAvailabilityBlock(row, ownerId);
  return row;
}

/**
 * Private manual availability lifecycle and one explicit preview only. This router
 * has no public/shared route and never reads, connects, syncs, or blocks any
 * external calendar. It imports no chat/memory, Map, Directory, Community, Safety,
 * provider, reminder, notification, sharing, analytics, or external service.
 */
export function createPrivateAvailabilityBlocksRouter(
  dependencies: PrivateAvailabilityBlocksRouteDependencies = {},
): IRouter {
  const router: IRouter = Router();
  const repository = dependencies.repository ?? postgresPrivateAvailabilityBlockRepository();
  const makeId = dependencies.makeId ?? randomUUID;
  const now = dependencies.now ?? (() => new Date());

  router.get("/kinfolk/availability-blocks", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    try {
      const rows = await repository.list(ownerId);
      // A tampered owner vault must not yield a partial availability list.
      res.json({ availabilityBlocks: rows.map((row) => blockView(row, ownerId)), boundaries: KINFOLK_PRIVATE_AVAILABILITY_DEFAULT_NON_USE });
    } catch (error) {
      req.log?.error("Private availability list secure access failed");
      secureAccessError(res, error);
    }
  });

  router.post("/kinfolk/availability-blocks", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    const input = parsePrivateAvailabilityBlockInput(req.body);
    if (!input) {
      res.status(400).json({ error: "A valid local start/end interval, canonical IANA time zone, planning choice, and explicit confirmation are required." });
      return;
    }
    try {
      const row = newBlock(input, ownerId, makeId(), now());
      const saved = await repository.create(row);
      res.status(201).json({ availabilityBlock: blockView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Private availability create secure access failed");
      secureAccessError(res, error);
    }
  });

  /** An explicit member request may receive only a safe boolean/count summary. */
  router.post("/kinfolk/availability-blocks/preview", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    const prospective = parsePrivateAvailabilityPreviewInput(req.body);
    if (!prospective) {
      res.status(400).json({ error: "A valid local prospective interval, canonical IANA time zone, and explicit confirmation are required." });
      return;
    }
    try {
      const rows = await repository.list(ownerId);
      // Open every owner row before calculating: key loss or tamper fails closed.
      const conflictCount = privateAvailabilityConflicts(prospective, rows.map((row) => openPrivateAvailabilityBlock(row, ownerId)));
      res.json({ hasConflict: conflictCount > 0, conflictCount });
    } catch (error) {
      req.log?.error("Private availability preview secure access failed");
      secureAccessError(res, error);
    }
  });

  router.get("/kinfolk/availability-blocks/:id", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isPrivateAvailabilityBlockId(req.params.id)) return void notFound(res);
    try {
      const row = await repository.find(ownerId, req.params.id);
      if (!row) return void notFound(res);
      res.json({ availabilityBlock: blockView(row, ownerId) });
    } catch (error) {
      req.log?.error("Private availability read secure access failed");
      secureAccessError(res, error);
    }
  });

  router.put("/kinfolk/availability-blocks/:id", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isPrivateAvailabilityBlockId(req.params.id)) return void notFound(res);
    const input = parsePrivateAvailabilityBlockInput(req.body);
    if (!input) {
      res.status(400).json({ error: "A valid local start/end interval, canonical IANA time zone, planning choice, and explicit confirmation are required." });
      return;
    }
    try {
      const existing = await repository.find(ownerId, req.params.id);
      if (!existing) return void notFound(res);
      // A tampered or unreadable record is never overwritten.
      openPrivateAvailabilityBlock(existing, ownerId);
      const encrypted = sealPrivateAvailabilityBlock(input, existing);
      const confirmedAt = now();
      const candidate = { ...existing, ...encrypted, memberConfirmedAt: confirmedAt, updatedAt: confirmedAt };
      openPrivateAvailabilityBlock(candidate, ownerId);
      const saved = await repository.update(ownerId, existing.id, encrypted, confirmedAt);
      if (!saved) return void notFound(res);
      res.json({ availabilityBlock: blockView(saved, ownerId) });
    } catch (error) {
      req.log?.error("Private availability update secure access failed");
      secureAccessError(res, error);
    }
  });

  router.delete("/kinfolk/availability-blocks/:id", async (req: Request, res: Response) => {
    const ownerId = owner(req, res); if (!ownerId) return;
    if (!isPrivateAvailabilityBlockId(req.params.id)) return void notFound(res);
    if (!parsePrivateAvailabilityBlockDeleteConfirmation(req.body)) {
      res.status(400).json({ error: "Explicit confirmation is required to delete a private availability block." });
      return;
    }
    try {
      const existing = await repository.find(ownerId, req.params.id);
      if (!existing) return void notFound(res);
      // Follow the encrypted-record convention: authenticate before deleting evidence.
      openPrivateAvailabilityBlock(existing, ownerId);
      if (!await repository.remove(ownerId, existing.id)) return void notFound(res);
      res.json({ removed: true });
    } catch (error) {
      req.log?.error("Private availability delete secure access failed");
      secureAccessError(res, error);
    }
  });

  return router;
}

const router = createPrivateAvailabilityBlocksRouter();
export default router;
