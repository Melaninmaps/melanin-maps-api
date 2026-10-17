import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { ensureKinfolkRegionalDialectIntelligenceSchemaOnly } from "../lib/startup-migrations";

const router: IRouter = Router();
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CORRECTIONS = 50;

type CorrectionRow = {
  id: string;
  reference_id: string | null;
  written_form: string;
  pronunciation_guidance: string;
  scope: "member_only";
  status: "active" | "paused";
  consented_at: Date;
  created_at: Date;
  updated_at: Date;
};

function ownerId(req: Request, res: Response): string | null {
  if (!req.user?.id) {
    res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
    return null;
  }
  return req.user.id;
}

function cleanText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > 0 && cleaned.length <= maximum ? cleaned : null;
}

function safeCorrection(row: CorrectionRow) {
  return {
    id: row.id,
    referenceId: row.reference_id,
    writtenForm: row.written_form,
    pronunciationGuidance: row.pronunciation_guidance,
    scope: row.scope,
    status: row.status,
    consentedAt: row.consented_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function schemaReady(res: Response): Promise<boolean> {
  try {
    await ensureKinfolkRegionalDialectIntelligenceSchemaOnly();
    return true;
  } catch {
    res.status(503).json({ error: "LANGUAGE_SETTINGS_UNAVAILABLE" });
    return false;
  }
}

router.get(
  "/kinfolk/language/corrections",
  async (req: Request, res: Response) => {
    const userId = ownerId(req, res);
    if (!userId || !(await schemaReady(res))) return;
    try {
      const result = await pool.query<CorrectionRow>(
        `SELECT id, reference_id, written_form, pronunciation_guidance, scope, status, consented_at, created_at, updated_at
         FROM kinfolk_member_pronunciation_corrections
        WHERE user_id = $1 AND status IN ('active', 'paused')
        ORDER BY updated_at DESC
        LIMIT $2`,
        [userId, MAX_CORRECTIONS],
      );
      res.json({
        corrections: result.rows.map(safeCorrection),
        privateByDefault: true,
      });
    } catch {
      req.log.error("Kinfolk pronunciation correction list failed");
      res.status(500).json({ error: "LANGUAGE_CORRECTIONS_UNAVAILABLE" });
    }
  },
);

router.post(
  "/kinfolk/language/corrections",
  async (req: Request, res: Response) => {
    const userId = ownerId(req, res);
    if (!userId || !(await schemaReady(res))) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const writtenForm = cleanText(body.writtenForm, 200);
    const pronunciationGuidance = cleanText(body.pronunciationGuidance, 500);
    const referenceId =
      typeof body.referenceId === "string" &&
      UUID_PATTERN.test(body.referenceId)
        ? body.referenceId
        : null;
    if (!writtenForm || !pronunciationGuidance || body.consent !== true) {
      return void res.status(400).json({
        error: "INVALID_LANGUAGE_CORRECTION",
        message:
          "Provide a short written form, pronunciation guidance, and explicit consent. Corrections remain private to your Kinfolk experience.",
      });
    }
    try {
      if (referenceId) {
        const reference = await pool.query(
          `SELECT id FROM kinfolk_place_language_references WHERE id = $1 AND review_status = 'approved' LIMIT 1`,
          [referenceId],
        );
        if (!reference.rows[0]) {
          return void res.status(400).json({ error: "REFERENCE_NOT_REVIEWED" });
        }
      }
      const existing = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM kinfolk_member_pronunciation_corrections WHERE user_id = $1 AND status IN ('active', 'paused')`,
        [userId],
      );
      if (Number(existing.rows[0]?.count ?? 0) >= MAX_CORRECTIONS) {
        return void res
          .status(409)
          .json({ error: "LANGUAGE_CORRECTION_LIMIT_REACHED" });
      }
      const inserted = await pool.query<CorrectionRow>(
        `INSERT INTO kinfolk_member_pronunciation_corrections
        (user_id, reference_id, written_form, pronunciation_guidance, scope, consented_at, status)
       VALUES ($1, $2, $3, $4, 'member_only', NOW(), 'active')
       RETURNING id, reference_id, written_form, pronunciation_guidance, scope, status, consented_at, created_at, updated_at`,
        [userId, referenceId, writtenForm, pronunciationGuidance],
      );
      res.status(201).json({ correction: safeCorrection(inserted.rows[0]!) });
    } catch {
      req.log.error("Kinfolk pronunciation correction create failed");
      res.status(500).json({ error: "LANGUAGE_CORRECTION_NOT_SAVED" });
    }
  },
);

router.patch(
  "/kinfolk/language/corrections/:id",
  async (req: Request, res: Response) => {
    const userId = ownerId(req, res);
    if (!userId || !(await schemaReady(res))) return;
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id =
      typeof rawId === "string" && UUID_PATTERN.test(rawId) ? rawId : null;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const writtenForm =
      body.writtenForm === undefined
        ? undefined
        : cleanText(body.writtenForm, 200);
    const pronunciationGuidance =
      body.pronunciationGuidance === undefined
        ? undefined
        : cleanText(body.pronunciationGuidance, 500);
    const status =
      body.status === "active" || body.status === "paused"
        ? body.status
        : undefined;
    if (
      !id ||
      (body.writtenForm !== undefined && !writtenForm) ||
      (body.pronunciationGuidance !== undefined && !pronunciationGuidance) ||
      (body.status !== undefined && !status)
    ) {
      return void res
        .status(400)
        .json({ error: "INVALID_LANGUAGE_CORRECTION" });
    }
    if (
      writtenForm === undefined &&
      pronunciationGuidance === undefined &&
      status === undefined
    ) {
      return void res
        .status(400)
        .json({ error: "LANGUAGE_CORRECTION_PATCH_REQUIRED" });
    }
    try {
      const updated = await pool.query<CorrectionRow>(
        `UPDATE kinfolk_member_pronunciation_corrections
          SET written_form = COALESCE($3, written_form),
              pronunciation_guidance = COALESCE($4, pronunciation_guidance),
              status = COALESCE($5, status),
              updated_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status <> 'deleted'
        RETURNING id, reference_id, written_form, pronunciation_guidance, scope, status, consented_at, created_at, updated_at`,
        [
          id,
          userId,
          writtenForm ?? null,
          pronunciationGuidance ?? null,
          status ?? null,
        ],
      );
      if (!updated.rows[0])
        return void res
          .status(404)
          .json({ error: "LANGUAGE_CORRECTION_NOT_FOUND" });
      res.json({ correction: safeCorrection(updated.rows[0]) });
    } catch {
      req.log.error("Kinfolk pronunciation correction update failed");
      res.status(500).json({ error: "LANGUAGE_CORRECTION_NOT_UPDATED" });
    }
  },
);

router.delete(
  "/kinfolk/language/corrections/:id",
  async (req: Request, res: Response) => {
    const userId = ownerId(req, res);
    if (!userId || !(await schemaReady(res))) return;
    const rawId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const id =
      typeof rawId === "string" && UUID_PATTERN.test(rawId) ? rawId : null;
    if (!id)
      return void res
        .status(400)
        .json({ error: "INVALID_LANGUAGE_CORRECTION" });
    try {
      const deleted = await pool.query(
        `DELETE FROM kinfolk_member_pronunciation_corrections WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId],
      );
      if (!deleted.rows[0])
        return void res
          .status(404)
          .json({ error: "LANGUAGE_CORRECTION_NOT_FOUND" });
      res.json({ deleted: true, id });
    } catch {
      req.log.error("Kinfolk pronunciation correction delete failed");
      res.status(500).json({ error: "LANGUAGE_CORRECTION_NOT_DELETED" });
    }
  },
);

export default router;
