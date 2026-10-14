import { Router, type IRouter, type Request, type Response } from "express";
import { db, checkInsTable, pointsLedgerTable, POINTS_VALUES } from "@workspace/db";
import { desc, eq } from "drizzle-orm";

const router: IRouter = Router();

function hasCoordinatePayload(body: Record<string, unknown>): boolean {
  return ["lat", "lng", "latitude", "longitude", "userLat", "userLng", "coordinates"]
    .some((key) => body[key] !== undefined && body[key] !== null);
}

function privateCheckInResponse(checkIn: { id: string; businessId: string; createdAt: Date; verifiedLocation?: boolean }) {
  return {
    id: checkIn.id,
    businessId: checkIn.businessId,
    createdAt: checkIn.createdAt,
    // A retained compatibility flag; no new Check-In can be location verified.
    verifiedLocation: false,
  };
}

// ─── POST /checkins ───────────────────────────────────────────────────────────
// A business Check-In is private to the member. It never requests, accepts,
// calculates against, or stores member coordinates.
router.post("/checkins", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  if (!businessId) {
    res.status(400).json({ error: "businessId required" });
    return;
  }
  if (hasCoordinatePayload(body)) {
    res.status(400).json({ error: "Private Check-Ins do not accept or retain location coordinates." });
    return;
  }

  try {
    const [checkIn] = await db
      .insert(checkInsTable)
      .values({
        userId: req.user.id,
        businessId,
        verifiedLocation: false,
      })
      .returning();

    const points = POINTS_VALUES.checkin ?? 10;
    await db.insert(pointsLedgerTable).values({
      userId: req.user.id,
      action: "checkin",
      points,
      entityId: businessId,
    });

    res.status(201).json({ checkIn: privateCheckInResponse(checkIn), pointsEarned: points, verifiedLocation: false });
  } catch (err) {
    req.log.error({ err }, "Failed to save private check-in");
    res.status(500).json({ error: "Failed to save private check-in" });
  }
});

// ─── GET /checkins/user ───────────────────────────────────────────────────────
// The member may review their own private history. No coordinate fields are
// selected or returned, including for legacy rows.
router.get("/checkins/user", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const checkIns = await db
      .select()
      .from(checkInsTable)
      .where(eq(checkInsTable.userId, req.user.id))
      .orderBy(desc(checkInsTable.createdAt))
      .limit(50);
    res.json({ checkIns: checkIns.map(privateCheckInResponse) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch private check-ins");
    res.status(500).json({ error: "Failed to fetch private check-ins" });
  }
});

// ─── PATCH /checkins/:id ─────────────────────────────────────────────────────
// A member can privately add reflection text that may later support an optional
// review. It is not a presence or location signal.
router.patch("/checkins/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  if (!id) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { pool } = await import("@workspace/db");
  const { note, reviewBadge } = req.body as { note?: string; reviewBadge?: string };
  try {
    await pool.query(
      `UPDATE check_ins SET
         note = COALESCE($1, note),
         review_badge = COALESCE($2, review_badge)
       WHERE id::text = $3 AND user_id = $4`,
      [note?.trim() ?? null, reviewBadge ?? null, id, req.user.id],
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /checkins/:id error");
    res.status(500).json({ error: "Failed to update" });
  }
});

export default router;
