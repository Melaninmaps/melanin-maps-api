import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, locationSharesTable } from "@workspace/db";
import { and, eq, gt } from "drizzle-orm";
import crypto from "node:crypto";
import { requireFamilySafety } from "../middleware/requireFamilySafety";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return null; }
  return req.user.id;
}

export function publicLocationShare(share: {
  label: string;
  currentLat: number | null;
  currentLng: number | null;
  lastUpdatedAt: Date | null;
  expiresAt: Date;
}) {
  return {
    label: share.label,
    currentLat: share.currentLat,
    currentLng: share.currentLng,
    lastUpdatedAt: share.lastUpdatedAt,
    expiresAt: share.expiresAt,
  };
}

router.get("/safety/location-shares", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const shares = await db.select().from(locationSharesTable)
      .where(eq(locationSharesTable.sharerId, userId));
    res.json({ shares });
  } catch (err) {
    req.log.error({ err }, "GET /safety/location-shares error");
    res.status(500).json({ error: "Failed to load location shares" });
  }
});

router.post("/safety/location-shares", requireFamilySafety, async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { recipientEmail, label, durationMinutes = 60 } =
      req.body as { recipientEmail?: string; label?: string; durationMinutes?: number };
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + (durationMinutes) * 60 * 1000);
    const [share] = await db.insert(locationSharesTable).values({
      sharerId: userId,
      shareToken: token,
      recipientEmail: recipientEmail?.toLowerCase().trim() ?? null,
      label: label?.trim() ?? "Live Location",
      expiresAt,
      isActive: true,
    }).returning();
    res.status(201).json({ share });
  } catch (err) {
    req.log.error({ err }, "POST /safety/location-shares error");
    res.status(500).json({ error: "Failed to create location share" });
  }
});

router.patch("/safety/location-shares/:token/update", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const { lat, lng } = req.body as { lat?: number; lng?: number };
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      res.status(400).json({ error: "Valid lat and lng are required" }); return;
    }
    const [share] = await db.update(locationSharesTable)
      .set({ currentLat: lat, currentLng: lng, lastUpdatedAt: new Date() })
      .where(and(
        eq(locationSharesTable.shareToken, req.params["token"] as string),
        eq(locationSharesTable.sharerId, userId),
        eq(locationSharesTable.isActive, true),
        gt(locationSharesTable.expiresAt, new Date()),
      ))
      .returning();
    if (!share) { res.status(404).json({ error: "Share not found or expired" }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "PATCH /safety/location-shares/:token/update error");
    res.status(500).json({ error: "Failed to update location" });
  }
});

router.get("/safety/location-shares/:token/view", async (req: Request, res: Response) => {
  // A location URL is deliberately bearer-style. Do not allow browsers,
  // intermediary caches, or shared devices to retain a coordinate response.
  res.set("Cache-Control", "no-store, private, max-age=0");
  res.set("Pragma", "no-cache");
  try {
    const [share] = await db.select({
      label: locationSharesTable.label,
      currentLat: locationSharesTable.currentLat,
      currentLng: locationSharesTable.currentLng,
      lastUpdatedAt: locationSharesTable.lastUpdatedAt,
      expiresAt: locationSharesTable.expiresAt,
      isActive: locationSharesTable.isActive,
    }).from(locationSharesTable)
      .where(eq(locationSharesTable.shareToken, req.params["token"] as string))
      .limit(1);
    if (!share) { res.status(404).json({ error: "Share link not found" }); return; }
    if (!share.isActive || new Date() > share.expiresAt) {
      res.status(410).json({ error: "This location share has expired" }); return;
    }
    // Do not expose the sharer's identity, recipient, token, or internal ID
    // to a person holding a location link.
    res.json({ share: publicLocationShare(share) });
  } catch (err) {
    req.log.error({ err }, "GET /safety/location-shares/:token/view error");
    res.status(500).json({ error: "Failed to load share" });
  }
});

router.delete("/safety/location-shares/:id", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res); if (!userId) return;
  try {
    const id = parseInt(req.params["id"] as string, 10);
    await db.update(locationSharesTable)
      .set({ isActive: false })
      .where(and(eq(locationSharesTable.id, id), eq(locationSharesTable.sharerId, userId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /safety/location-shares/:id error");
    res.status(500).json({ error: "Failed to stop share" });
  }
});

export default router;
