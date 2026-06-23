import { Router, type IRouter, type Request, type Response } from "express";
import { db, safetyTipsTable, safetyTipConfirmationsTable, pushTokensTable } from "@workspace/db";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { sendPushToAllMembers } from "../lib/pushNotifications";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CONFIRMATION_THRESHOLD = 3;
const MAX_RADIUS_MILES = 10;

const CATEGORIES = ["violence", "harassment", "discrimination", "theft", "hate_crime", "other"] as const;
type TipCategory = typeof CATEGORIES[number];

const CATEGORY_LABELS: Record<TipCategory, string> = {
  violence: "Act of Violence",
  harassment: "Harassment",
  discrimination: "Discrimination",
  theft: "Theft / Robbery",
  hate_crime: "Hate Crime",
  other: "Safety Concern",
};

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

router.post("/safety-tips", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const { businessName, address, city, state, lat, lng, description, category } =
      req.body as {
        businessName?: string;
        address?: string;
        city: string;
        state?: string;
        lat: number;
        lng: number;
        description: string;
        category?: string;
      };

    if (!city || typeof lat !== "number" || typeof lng !== "number" || !description?.trim()) {
      res.status(400).json({ error: "city, lat, lng, and description are required" });
      return;
    }

    const cat = (CATEGORIES.includes(category as TipCategory) ? category : "violence") as TipCategory;

    const [tip] = await db
      .insert(safetyTipsTable)
      .values({
        submittedById: req.user.id,
        businessName: businessName?.trim() || null,
        address: address?.trim() || null,
        city: city.trim(),
        state: state?.trim() || null,
        lat,
        lng,
        description: description.trim(),
        category: cat,
      })
      .returning();

    const label = CATEGORY_LABELS[cat];
    const locationLabel = businessName
      ? `${businessName}, ${city}`
      : address
        ? `${address}, ${city}`
        : city;

    sendPushToAllMembers({
      title: `⚠️ Safety Tip — ${label}`,
      body: `A community member reported a ${label.toLowerCase()} near ${locationLabel}. Are you in the area? Tap to confirm.`,
      data: { screen: "safety-tip-detail", tipId: tip.id, lat, lng, city },
    }).catch((err: unknown) => logger.warn({ err }, "[safety-tips] push failed"));

    await db.update(safetyTipsTable).set({ alertsSent: true }).where(eq(safetyTipsTable.id, tip.id));

    logger.info({ tipId: tip.id, city, category: cat }, "[safety-tips] submitted + alerts sent");
    res.status(201).json({ tip });
  } catch (err) {
    req.log.error({ err }, "POST /safety-tips error");
    res.status(500).json({ error: "Failed to submit safety tip" });
  }
});

router.get("/safety-tips/nearby", async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query["lat"] as string);
    const lng = parseFloat(req.query["lng"] as string);
    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: "lat and lng are required" });
      return;
    }
    const all = await db
      .select()
      .from(safetyTipsTable)
      .where(ne(safetyTipsTable.status, "dismissed"))
      .orderBy(desc(safetyTipsTable.createdAt))
      .limit(100);

    const nearby = all
      .map((t) => ({
        ...t,
        distanceMiles: Math.round(haversineMiles(lat, lng, t.lat, t.lng) * 10) / 10,
      }))
      .filter((t) => t.distanceMiles <= MAX_RADIUS_MILES)
      .sort((a, b) => a.distanceMiles - b.distanceMiles);

    const userId = req.user?.id;
    if (userId) {
      const confirmed = await db
        .select({ tipId: safetyTipConfirmationsTable.tipId })
        .from(safetyTipConfirmationsTable)
        .where(eq(safetyTipConfirmationsTable.userId, userId));
      const confirmedSet = new Set(confirmed.map((c) => c.tipId));
      res.json({ tips: nearby.map((t) => ({ ...t, confirmedByMe: confirmedSet.has(t.id) })) });
      return;
    }

    res.json({ tips: nearby });
  } catch (err) {
    req.log.error({ err }, "GET /safety-tips/nearby error");
    res.status(500).json({ error: "Failed to fetch nearby tips" });
  }
});

router.get("/safety-tips", async (req: Request, res: Response) => {
  try {
    const tips = await db
      .select()
      .from(safetyTipsTable)
      .where(ne(safetyTipsTable.status, "dismissed"))
      .orderBy(desc(safetyTipsTable.createdAt))
      .limit(50);
    res.json({ tips });
  } catch (err) {
    req.log.error({ err }, "GET /safety-tips error");
    res.status(500).json({ error: "Failed to fetch tips" });
  }
});

router.post("/safety-tips/:id/confirm", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const id = parseInt(req.params["id"] as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid tip ID" });
      return;
    }
    const { userLat, userLng } = req.body as { userLat?: number; userLng?: number };

    const [tip] = await db
      .select()
      .from(safetyTipsTable)
      .where(eq(safetyTipsTable.id, id))
      .limit(1);

    if (!tip) {
      res.status(404).json({ error: "Tip not found" });
      return;
    }

    if (typeof userLat === "number" && typeof userLng === "number") {
      const dist = haversineMiles(userLat, userLng, tip.lat, tip.lng);
      if (dist > MAX_RADIUS_MILES) {
        res.status(422).json({ error: `You must be within ${MAX_RADIUS_MILES} miles to confirm this tip.` });
        return;
      }
    }

    const [existing] = await db
      .select({ id: safetyTipConfirmationsTable.id })
      .from(safetyTipConfirmationsTable)
      .where(
        and(
          eq(safetyTipConfirmationsTable.tipId, id),
          eq(safetyTipConfirmationsTable.userId, req.user.id),
        ),
      )
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "You have already confirmed this tip." });
      return;
    }

    await db.insert(safetyTipConfirmationsTable).values({
      tipId: id,
      userId: req.user.id,
      userLat: typeof userLat === "number" ? userLat : null,
      userLng: typeof userLng === "number" ? userLng : null,
    });

    const [updated] = await db
      .update(safetyTipsTable)
      .set({
        confirmationCount: sql`${safetyTipsTable.confirmationCount} + 1`,
        status:
          (tip.confirmationCount + 1) >= CONFIRMATION_THRESHOLD ? "confirmed" : tip.status,
      })
      .where(eq(safetyTipsTable.id, id))
      .returning();

    if (updated && updated.confirmationCount >= CONFIRMATION_THRESHOLD && tip.status !== "confirmed") {
      logger.info({ tipId: id, count: updated.confirmationCount }, "[safety-tips] threshold reached — tip confirmed");
    }

    res.json({ tip: updated, confirmed: true });
  } catch (err) {
    req.log.error({ err }, "POST /safety-tips/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm tip" });
  }
});

export default router;
