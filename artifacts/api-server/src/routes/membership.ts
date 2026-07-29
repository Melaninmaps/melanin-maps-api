/**
 * /api/membership — membership lifecycle routes.
 *
 * POST /api/membership/agreement
 *   Record or renew the authenticated user's Community Agreement acceptance.
 *   This is the server-authoritative record; AsyncStorage on mobile is only a
 *   local cache.
 *
 * GET /api/membership/agreement
 *   Return the user's current agreement status (active version, accepted date).
 */

import { Router, type Request, type Response } from "express";
import { nanoid } from "nanoid";
import { db, memberAgreementsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

// ── POST /api/membership/agreement ─────────────────────────────────────────
// Called by the mobile app after the user accepts the Community Agreement.
// Safe to call multiple times: if a matching active record already exists
// it is returned without creating a duplicate.
router.post("/agreement", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const userId = req.user.id;
    const platform = (req.body?.platform as string) ?? "web";
    const agreementVersion = (req.body?.agreementVersion as string) ?? "v1";

    // Check for an existing active record for this version
    const [existing] = await db
      .select({ id: memberAgreementsTable.id, acceptedAt: memberAgreementsTable.acceptedAt })
      .from(memberAgreementsTable)
      .where(
        and(
          eq(memberAgreementsTable.userId, userId),
          eq(memberAgreementsTable.agreementVersion, agreementVersion),
          eq(memberAgreementsTable.active, true),
        ),
      )
      .limit(1);

    if (existing) {
      res.json({ recorded: false, reason: "already_active", id: existing.id, acceptedAt: existing.acceptedAt });
      return;
    }

    const id = nanoid();
    await db.insert(memberAgreementsTable).values({
      id,
      userId,
      agreementVersion,
      platform,
      active: true,
    });

    res.json({ recorded: true, id, agreementVersion, platform });
  } catch (err) {
    req.log.error({ err }, "POST /membership/agreement error");
    res.status(500).json({ error: "Could not record agreement" });
  }
});

// ── GET /api/membership/agreement ─────────────────────────────────────────
router.get("/agreement", async (req: Request, res: Response) => {
  if (!req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const [record] = await db
      .select({
        id: memberAgreementsTable.id,
        agreementVersion: memberAgreementsTable.agreementVersion,
        acceptedAt: memberAgreementsTable.acceptedAt,
        platform: memberAgreementsTable.platform,
        active: memberAgreementsTable.active,
      })
      .from(memberAgreementsTable)
      .where(
        and(
          eq(memberAgreementsTable.userId, req.user.id),
          eq(memberAgreementsTable.active, true),
        ),
      )
      .orderBy(memberAgreementsTable.acceptedAt)
      .limit(1);

    if (!record) {
      res.json({ hasAgreement: false });
      return;
    }

    res.json({ hasAgreement: true, ...record });
  } catch (err) {
    req.log.error({ err }, "GET /membership/agreement error");
    res.status(500).json({ error: "Could not fetch agreement status" });
  }
});

export default router;
