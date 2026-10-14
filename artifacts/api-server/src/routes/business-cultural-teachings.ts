import { pool } from "@workspace/db";
import { Router, type IRouter, type Request, type Response } from "express";
import { sanitizeBusinessCulturalTeaching } from "../kinfolk/business-cultural-teaching-policy";

export type BusinessCulturalTeachingDatabase = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: readonly unknown[],
  ) => Promise<{ rows: T[] }>;
};

type OwnedBusiness = { id: string };
type ActiveCreator = { creatorOwnerUserId: string };
type OwnerTeachingRow = { title: string; text: string; active: boolean };
type MemberTeachingRow = { title: string; text: string };

const defaultDatabase = pool as unknown as BusinessCulturalTeachingDatabase;

function safeBusinessId(req: Request): string | null {
  const value = req.params.businessId;
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 255 ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(value)
  ) {
    return null;
  }
  return value;
}

async function requireApprovedBusinessOwner(
  req: Request,
  res: Response,
  database: BusinessCulturalTeachingDatabase,
): Promise<OwnedBusiness | null> {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  const businessId = safeBusinessId(req);
  if (!businessId) {
    res.status(400).json({ error: "Business unavailable." });
    return null;
  }

  try {
    const result = await database.query<OwnedBusiness>(
      `SELECT b.id
         FROM businesses b
        WHERE b.id = $1
          AND EXISTS (
            SELECT 1
              FROM business_owner_links bol
             WHERE bol.business_id = b.id
               AND bol.user_id = $2
               AND bol.role = 'owner'
               AND bol.status = 'approved'
               AND bol.revoked_at IS NULL
          )
        LIMIT 1`,
      [businessId, req.user.id],
    );
    const business = result.rows[0] ?? null;
    if (!business) {
      res.status(403).json({ error: "An approved business owner link is required" });
      return null;
    }
    return business;
  } catch {
    res.status(503).json({ error: "Teaching is unavailable right now." });
    return null;
  }
}

/**
 * This owner-authored surface is intentionally isolated from Kinfolk, member
 * memory, targeting, recommendations, reviews, directory results, providers,
 * notifications, and cross-business aggregation.
 */
export function createBusinessCulturalTeachingsRouter(
  { database = defaultDatabase }: { database?: BusinessCulturalTeachingDatabase } = {},
): IRouter {
  const router: IRouter = Router();
  router.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  router.get("/businesses/:businessId/cultural-teaching/owner", async (req, res) => {
    const business = await requireApprovedBusinessOwner(req, res, database);
    if (!business || !req.user?.id) return;
    try {
      const result = await database.query<OwnerTeachingRow>(
        `SELECT title, teaching_body AS "text",
                (owner_confirmed_at IS NOT NULL AND withdrawn_at IS NULL) AS "active"
           FROM business_cultural_teachings
          WHERE business_id = $1
            AND creator_owner_user_id = $2
          LIMIT 1`,
        [business.id, req.user.id],
      );
      const row = result.rows[0];
      res.json({
        teaching: row
          ? { title: row.title, text: row.text, active: row.active === true }
          : null,
      });
    } catch {
      res.status(503).json({ error: "Teaching is unavailable right now." });
    }
  });

  router.put("/businesses/:businessId/cultural-teaching/owner", async (req, res) => {
    const business = await requireApprovedBusinessOwner(req, res, database);
    if (!business || !req.user?.id) return;
    const sanitized = sanitizeBusinessCulturalTeaching(req.body);
    if (!sanitized.ok) {
      res.status(400).json({ error: sanitized.error });
      return;
    }

    try {
      const active = await database.query<ActiveCreator>(
        `SELECT creator_owner_user_id AS "creatorOwnerUserId"
           FROM business_cultural_teachings
          WHERE business_id = $1
            AND withdrawn_at IS NULL
          LIMIT 1`,
        [business.id],
      );
      const current = active.rows[0];
      if (current && current.creatorOwnerUserId !== req.user.id) {
        res.status(409).json({ error: "An active teaching is unavailable for editing." });
        return;
      }

      const result = await database.query<OwnerTeachingRow>(
        `INSERT INTO business_cultural_teachings (
           business_id, creator_owner_user_id, title, teaching_body, owner_confirmed_at, withdrawn_at
         ) VALUES ($1, $2, $3, $4, NOW(), NULL)
         ON CONFLICT (business_id, creator_owner_user_id) DO UPDATE SET
           title = EXCLUDED.title,
           teaching_body = EXCLUDED.teaching_body,
           owner_confirmed_at = NOW(),
           withdrawn_at = NULL,
           updated_at = NOW()
         RETURNING title, teaching_body AS "text", TRUE AS "active"`,
        [business.id, req.user.id, sanitized.teaching.title, sanitized.teaching.teaching],
      );
      const row = result.rows[0];
      if (!row) {
        res.status(503).json({ error: "Teaching is unavailable right now." });
        return;
      }
      res.json({ teaching: { title: row.title, text: row.text, active: true } });
    } catch {
      // A concurrent active-owner insert is intentionally indistinguishable from
      // any other unavailable edit; no owner or submitted content is disclosed.
      res.status(409).json({ error: "An active teaching is unavailable for editing." });
    }
  });

  router.delete("/businesses/:businessId/cultural-teaching/owner", async (req, res) => {
    const business = await requireApprovedBusinessOwner(req, res, database);
    if (!business || !req.user?.id) return;
    try {
      await database.query(
        `UPDATE business_cultural_teachings
            SET withdrawn_at = NOW(), updated_at = NOW()
          WHERE business_id = $1
            AND creator_owner_user_id = $2
            AND withdrawn_at IS NULL`,
        [business.id, req.user.id],
      );
      res.status(204).end();
    } catch {
      res.status(503).json({ error: "Teaching is unavailable right now." });
    }
  });

  router.get("/businesses/:businessId/cultural-teaching", async (req, res) => {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const businessId = safeBusinessId(req);
    if (!businessId) {
      res.status(404).json({ error: "Teaching unavailable." });
      return;
    }
    try {
      const result = await database.query<MemberTeachingRow>(
        `SELECT teaching.title, teaching.teaching_body AS "text"
           FROM business_cultural_teachings teaching
           JOIN businesses b ON b.id = teaching.business_id
          WHERE teaching.business_id = $1
            AND b.status = 'active'
            AND teaching.owner_confirmed_at IS NOT NULL
            AND teaching.withdrawn_at IS NULL
            AND EXISTS (
              SELECT 1
                FROM business_owner_links bol
               WHERE bol.business_id = teaching.business_id
                 AND bol.user_id = teaching.creator_owner_user_id
                 AND bol.role = 'owner'
                 AND bol.status = 'approved'
                 AND bol.revoked_at IS NULL
            )
          LIMIT 1`,
        [businessId],
      );
      const row = result.rows[0];
      if (!row) {
        res.status(404).json({ error: "Teaching unavailable." });
        return;
      }
      res.json({
        teaching: {
          title: row.title,
          text: row.text,
          sourceLabel: "Shared by this business",
        },
      });
    } catch {
      res.status(404).json({ error: "Teaching unavailable." });
    }
  });

  return router;
}

export default createBusinessCulturalTeachingsRouter();
