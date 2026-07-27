import { and, desc, eq, inArray } from "drizzle-orm";
import { type Request, type Response, Router } from "express";
import { db } from "@workspace/db";
import { businessesTable } from "@workspace/db";
import { eventsTable } from "@workspace/db";
import { neighborhoodSurveysTable } from "@workspace/db";
import { neighborhoodPinsTable, INTENTS, type IntentId } from "@workspace/db";
import { requireMembership } from "../middleware/requireMembership";

const router = Router();

// ─── Haversine distance (miles) ───────────────────────────────────────────────
function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Build pathway sections for a given pin ───────────────────────────────────
async function buildPathway(pin: typeof neighborhoodPinsTable.$inferSelect) {
  const intent = INTENTS.find(i => i.id === pin.intentId) ?? INTENTS[0];
  const lat = pin.latitude ?? 33.7;
  const lng = pin.longitude ?? -84.38;

  // Fetch businesses
  const allBusinesses = await db.select().from(businessesTable).limit(2000);
  const nearby = allBusinesses.filter(b => {
    if (!b.latitude || !b.longitude) return false;
    return haversineMiles(lat, lng, Number(b.latitude), Number(b.longitude)) <= 50;
  });

  // Filter by intent-relevant categories (empty = all)
  const relevant = intent.businessCategories.length
    ? nearby.filter(b => intent.businessCategories.some(cat =>
        b.category?.toLowerCase().includes(cat.toLowerCase()) ||
        cat.toLowerCase().includes(b.category?.toLowerCase() ?? "")
      ))
    : nearby;

  // Rank: verified first, then by rating + engagement
  const ranked = [...relevant].sort((a, b) => {
    const aScore = (a.verified ? 10 : 0) + (Number(a.rating) ?? 0) * 2 + (a.reviewCount ?? 0) * 0.1;
    const bScore = (b.verified ? 10 : 0) + (Number(b.rating) ?? 0) * 2 + (b.reviewCount ?? 0) * 0.1;
    return bScore - aScore;
  });

  // Safety data from surveys (use city match + safetyScore field)
  let safetyScore: number | null = null;
  let surveyCount = 0;
  let wouldReturnScore: number | null = null;
  try {
    const surveys = await db
      .select()
      .from(neighborhoodSurveysTable)
      .limit(500);
    // Filter by city proximity or city name match
    const areaSurveys = surveys.filter(s => {
      if (!pin.city) return false;
      return s.city?.toLowerCase().includes(pin.city.toLowerCase()) ||
             pin.city.toLowerCase().includes((s.city ?? "").toLowerCase());
    });
    surveyCount = areaSurveys.length;
    if (surveyCount > 0) {
      const safetySum = areaSurveys.reduce((acc, s) => acc + ((s.daytimeSafety + s.nighttimeSafety) / 2), 0);
      safetyScore = Math.round((safetySum / surveyCount) * 10) / 10;
      wouldReturnScore = null; // surveys table doesn't have wouldReturnAlone
    }
  } catch { /* surveys optional */ }

  // Nearby events
  let events: any[] = [];
  try {
    const allEvents = await db
      .select()
      .from(eventsTable)
      .where(eq(eventsTable.status, "active"))
      .orderBy(desc(eventsTable.date))
      .limit(200);
    events = allEvents.filter(e => {
      if (!e.latitude || !e.longitude) return false;
      return haversineMiles(lat, lng, Number(e.latitude), Number(e.longitude)) <= 30;
    }).slice(0, 5);
  } catch { /* events optional */ }

  // Grouped businesses by category (top 3 per category, max 6 categories)
  const byCategory = new Map<string, typeof ranked>();
  for (const b of ranked.slice(0, 150)) {
    const cat = b.category ?? "Other";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    const arr = byCategory.get(cat)!;
    if (arr.length < 3) arr.push(b);
  }
  const topCategories = [...byCategory.entries()]
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 6)
    .map(([category, businesses]) => ({ category, businesses }));

  return {
    pin,
    intent,
    sections: {
      nextActions: intent.nextActions,
      businessesNearby: ranked.slice(0, 20),
      businessesByCategory: topCategories,
      safety: {
        score: safetyScore,
        surveyCount,
        wouldReturnPercent: wouldReturnScore,
        hasData: surveyCount > 0,
      },
      events,
      kinfolkPrompts: intent.kinfolkPrompts,
    },
    stats: {
      totalNearby: nearby.length,
      verifiedNearby: nearby.filter(b => b.verified).length,
      categories: [...new Set(nearby.map(b => b.category).filter(Boolean))].slice(0, 10),
    },
  };
}

// ─── GET /api/smart-pathways/meta ────────────────────────────────────────────
router.get("/smart-pathways/meta", (_req: Request, res: Response) => {
  res.json({ intents: INTENTS });
});

// ─── GET /api/smart-pathways/pins ────────────────────────────────────────────
router.get("/smart-pathways/pins", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const pins = await db
    .select()
    .from(neighborhoodPinsTable)
    .where(eq(neighborhoodPinsTable.userId, req.user.id))
    .orderBy(desc(neighborhoodPinsTable.createdAt));
  res.json({ pins });
});

// ─── POST /api/smart-pathways/pins ───────────────────────────────────────────
router.post("/smart-pathways/pins", requireMembership("navigator"), async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { label, city, state, latitude, longitude, intentId, notes } = req.body as {
    label: string; city?: string; state?: string;
    latitude?: number; longitude?: number;
    intentId?: string; notes?: string;
  };

  if (!label?.trim()) { res.status(400).json({ error: "label required" }); return; }

  const [pin] = await db
    .insert(neighborhoodPinsTable)
    .values({
      userId: req.user.id,
      label: label.trim(),
      city: city?.trim(),
      state: state?.trim(),
      latitude,
      longitude,
      intentId: intentId ?? null,
      notes: notes?.trim(),
    })
    .returning();

  req.log.info({ pinId: pin.id, intentId }, "Neighborhood pin created");
  res.status(201).json({ pin });
});

// ─── PATCH /api/smart-pathways/pins/:id ──────────────────────────────────────
router.patch("/smart-pathways/pins/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const pinId = String(req.params.id);
  const { intentId, notes, label } = req.body as { intentId?: string; notes?: string; label?: string };

  const [pin] = await db
    .update(neighborhoodPinsTable)
    .set({
      ...(intentId !== undefined ? { intentId } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(label !== undefined ? { label } : {}),
      updatedAt: new Date(),
    })
    .where(and(
      eq(neighborhoodPinsTable.id, pinId),
      eq(neighborhoodPinsTable.userId, req.user.id),
    ))
    .returning();

  if (!pin) { res.status(404).json({ error: "Pin not found" }); return; }
  res.json({ pin });
});

// ─── DELETE /api/smart-pathways/pins/:id ─────────────────────────────────────
router.delete("/smart-pathways/pins/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [deleted] = await db
    .delete(neighborhoodPinsTable)
    .where(and(
      eq(neighborhoodPinsTable.id, String(req.params.id)),
      eq(neighborhoodPinsTable.userId, req.user.id),
    ))
    .returning({ id: neighborhoodPinsTable.id });

  if (!deleted) { res.status(404).json({ error: "Pin not found" }); return; }
  res.json({ success: true });
});

// ─── GET /api/smart-pathways/pins/:id/pathway ────────────────────────────────
router.get("/smart-pathways/pins/:id/pathway", requireMembership("navigator"), async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [pin] = await db
    .select()
    .from(neighborhoodPinsTable)
    .where(and(
      eq(neighborhoodPinsTable.id, String(req.params.id)),
      eq(neighborhoodPinsTable.userId, req.user.id),
    ))
    .limit(1);

  if (!pin) { res.status(404).json({ error: "Pin not found" }); return; }

  const pathway = await buildPathway(pin);
  res.json(pathway);
});

// ─── GET /api/smart-pathways/compare?pin1=:id&pin2=:id ───────────────────────
router.get("/smart-pathways/compare", requireMembership("navigator"), async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { pin1: pin1Id, pin2: pin2Id } = req.query as { pin1?: string; pin2?: string };
  if (!pin1Id || !pin2Id) { res.status(400).json({ error: "pin1 and pin2 required" }); return; }

  const pins = await db
    .select()
    .from(neighborhoodPinsTable)
    .where(and(
      inArray(neighborhoodPinsTable.id, [pin1Id, pin2Id]),
      eq(neighborhoodPinsTable.userId, req.user.id),
    ));

  const pin1 = pins.find(p => p.id === pin1Id);
  const pin2 = pins.find(p => p.id === pin2Id);
  if (!pin1 || !pin2) { res.status(404).json({ error: "One or both pins not found" }); return; }

  const [pathway1, pathway2] = await Promise.all([buildPathway(pin1), buildPathway(pin2)]);

  res.json({
    pin1: { ...pin1, intent: pathway1.intent, stats: pathway1.stats, safety: pathway1.sections.safety },
    pin2: { ...pin2, intent: pathway2.intent, stats: pathway2.stats, safety: pathway2.sections.safety },
    comparison: {
      businessCount: {
        pin1: pathway1.stats.totalNearby,
        pin2: pathway2.stats.totalNearby,
      },
      verifiedCount: {
        pin1: pathway1.stats.verifiedNearby,
        pin2: pathway2.stats.verifiedNearby,
      },
      safetyScore: {
        pin1: pathway1.sections.safety.score,
        pin2: pathway2.sections.safety.score,
      },
      wouldReturn: {
        pin1: pathway1.sections.safety.wouldReturnPercent,
        pin2: pathway2.sections.safety.wouldReturnPercent,
      },
      surveyCount: {
        pin1: pathway1.sections.safety.surveyCount,
        pin2: pathway2.sections.safety.surveyCount,
      },
      eventCount: {
        pin1: pathway1.sections.events.length,
        pin2: pathway2.sections.events.length,
      },
      topCategories: {
        pin1: pathway1.stats.categories,
        pin2: pathway2.stats.categories,
      },
    },
    kinfolkPrompts: INTENTS.find(i => i.id === "comparing")?.kinfolkPrompts ?? [],
  });
});

export default router;
