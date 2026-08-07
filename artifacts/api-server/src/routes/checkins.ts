import { Router, type IRouter, type Request, type Response } from "express";
import { pool } from "@workspace/db";
import { db, checkInsTable, pointsLedgerTable, POINTS_VALUES, businessesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

// ─── Haversine distance in kilometres ────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAX_DISTANCE_KM = 0.5; // 500 m — must be within this radius to earn GPS-verified check-in

// ─── POST /checkins ───────────────────────────────────────────────────────────
router.post("/checkins", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { businessId, lat, lng } = req.body as {
    businessId?: string;
    lat?: number;
    lng?: number;
  };

  if (!businessId) {
    res.status(400).json({ error: "businessId required" });
    return;
  }

  try {
    // ── GPS proximity check ──────────────────────────────────────────────────
    let verifiedLocation = false;
    let userLat: number | undefined;
    let userLng: number | undefined;

    if (lat != null && lng != null && isFinite(lat) && isFinite(lng)) {
      userLat = lat;
      userLng = lng;

      // Fetch the business's coordinates
      const [biz] = await db
        .select({ latitude: businessesTable.latitude, longitude: businessesTable.longitude })
        .from(businessesTable)
        .where(eq(businessesTable.id, businessId))
        .limit(1);

      if (biz?.latitude != null && biz?.longitude != null) {
        const bizLat = parseFloat(String(biz.latitude));
        const bizLng = parseFloat(String(biz.longitude));

        if (isFinite(bizLat) && isFinite(bizLng)) {
          const distKm = haversineKm(lat, lng, bizLat, bizLng);
          if (distKm <= MAX_DISTANCE_KM) {
            verifiedLocation = true;
          } else {
            // User is too far away — reject the check-in
            res.status(422).json({
              error: "too_far",
              message: `You need to be within 500 m of this business to check in. You appear to be ${Math.round(distKm * 1000)} m away.`,
              distanceMeters: Math.round(distKm * 1000),
            });
            return;
          }
        }
      }
    }

    // ── Insert check-in ──────────────────────────────────────────────────────
    const [checkIn] = await db
      .insert(checkInsTable)
      .values({
        userId: req.user.id,
        businessId,
        ...(userLat != null ? { userLat: String(userLat), userLng: String(userLng) } : {}),
        verifiedLocation,
      })
      .returning();

    // Award extra points for GPS-verified check-ins
    const points = verifiedLocation
      ? (POINTS_VALUES.checkin ?? 10) + 5   // bonus 5 pts for verified
      : (POINTS_VALUES.checkin ?? 10);

    await db.insert(pointsLedgerTable).values({
      userId: req.user.id,
      action: "checkin",
      points,
      entityId: businessId,
    });

    res.status(201).json({ checkIn, pointsEarned: points, verifiedLocation });
  } catch (err) {
    req.log.error({ err }, "Failed to check in");
    res.status(500).json({ error: "Failed to check in" });
  }
});

// ─── GET /checkins/user ───────────────────────────────────────────────────────
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
    res.json({ checkIns });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch check-ins");
    res.status(500).json({ error: "Failed to fetch check-ins" });
  }
});

// ─── PATCH /checkins/:id ─────────────────────────────────────────────────────
// Add a note or badge to an existing check-in (B5 optional expansion).
router.patch("/checkins/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { note, reviewBadge } = req.body as { note?: string; reviewBadge?: string };
  try {
    await pool.query(
      `UPDATE check_ins SET
         note         = COALESCE($1, note),
         review_badge = COALESCE($2, review_badge)
       WHERE id = $3 AND user_id = $4`,
      [note?.trim() ?? null, reviewBadge ?? null, id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /checkins/:id error");
    res.status(500).json({ error: "Failed to update check-in" });
  }
});

export default router;
