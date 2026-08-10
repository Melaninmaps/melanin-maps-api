import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityPlacesTable } from "@workspace/db";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

// GET /places/search?q=hyatt&country=Brazil — autocomplete for location tagging
router.get("/places/search", async (req: Request, res: Response) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const country = typeof req.query.country === "string" ? req.query.country.trim() : undefined;
  if (!q || q.length < 2) { res.json({ results: [] }); return; }
  try {
    let query = db
      .select()
      .from(communityPlacesTable)
      .where(
        or(
          ilike(communityPlacesTable.name, `%${q}%`),
          ilike(communityPlacesTable.venueName, `%${q}%`),
          ilike(communityPlacesTable.city, `%${q}%`)
        )
      )
      .orderBy(desc(communityPlacesTable.postCount))
      .limit(10);
    const rows = await query;
    res.json({ results: country ? rows.filter((r) => r.country?.toLowerCase().includes(country.toLowerCase())) : rows });
  } catch (err) {
    req.log.error({ err }, "Failed to search places");
    res.status(500).json({ error: "Failed to search places" });
  }
});

// GET /places — browse safe spaces
router.get("/places", async (req: Request, res: Response) => {
  const country = typeof req.query.country === "string" ? req.query.country : undefined;
  const city = typeof req.query.city === "string" ? req.query.city : undefined;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const offset = Number(req.query.offset) || 0;
  try {
    const rows = await db
      .select()
      .from(communityPlacesTable)
      .where(
        country
          ? ilike(communityPlacesTable.country, `%${country}%`)
          : city
          ? ilike(communityPlacesTable.city, `%${city}%`)
          : undefined
      )
      .orderBy(desc(communityPlacesTable.postCount))
      .limit(limit)
      .offset(offset);
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(communityPlacesTable);
    res.json({ places: rows, total });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch places");
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

// GET /places/:id
router.get("/places/:id", async (req: Request, res: Response) => {
  try {
    const [place] = await db
      .select()
      .from(communityPlacesTable)
      .where(eq(communityPlacesTable.id, String(req.params.id)));
    if (!place) { res.status(404).json({ error: "Place not found" }); return; }
    res.json({ place });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch place");
    res.status(500).json({ error: "Failed to fetch place" });
  }
});

// POST /places — create a new community place
router.post("/places", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { name, venueName, category, city, state, country, lat, lng } = req.body as {
    name?: string; venueName?: string; category?: string;
    city?: string; state?: string; country?: string;
    lat?: number; lng?: number;
  };
  if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }
  try {
    const [place] = await db
      .insert(communityPlacesTable)
      .values({
        name: name.trim(),
        venueName: venueName?.trim() || null,
        category: category ?? "general",
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || "United States",
        lat: lat ? String(lat) : null,
        lng: lng ? String(lng) : null,
        addedByUserId: req.user.id,
        postCount: 1,
      })
      .returning();
    res.status(201).json({ place });
  } catch (err) {
    req.log.error({ err }, "Failed to create place");
    res.status(500).json({ error: "Failed to create place" });
  }
});

export default router;
