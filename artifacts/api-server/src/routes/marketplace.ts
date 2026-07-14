import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityListingsTable } from "@workspace/db";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

const CATEGORIES = [
  "Clothing & Accessories", "Electronics & Tech", "Furniture & Home",
  "Books & Education", "Baby & Kids", "Sports & Fitness",
  "Beauty & Personal Care", "Food & Beverages", "Art & Crafts",
  "Hair & Beauty Services", "Tutoring & Education", "Home Repair",
  "Childcare & Family", "Photography & Media", "Music & Entertainment",
  "Business Services", "Digital Products", "Other",
];

// ── GET /marketplace ──────────────────────────────────────────────────────────
router.get("/marketplace", async (req: Request, res: Response) => {
  const { type, category, city, state, priceType, q, limit: lStr, offset: oStr } = req.query as Record<string, string>;
  const limit = Math.min(parseInt(lStr ?? "20", 10), 50);
  const offset = parseInt(oStr ?? "0", 10);

  try {
    const conds = [eq(communityListingsTable.status, "active")];
    if (type) conds.push(eq(communityListingsTable.type, type as any));
    if (category) conds.push(ilike(communityListingsTable.category, `%${category}%`));
    if (priceType) conds.push(eq(communityListingsTable.priceType, priceType));
    if (city) conds.push(ilike(communityListingsTable.city, `%${city}%`));
    if (state) conds.push(ilike(communityListingsTable.state, `%${state}%`));
    if (q) {
      const t = `%${q}%`;
      conds.push(or(ilike(communityListingsTable.title, t), ilike(communityListingsTable.description, t))!);
    }

    const [listings, countRow] = await Promise.all([
      db.select().from(communityListingsTable).where(and(...conds))
        .orderBy(desc(communityListingsTable.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(communityListingsTable).where(and(...conds)),
    ]);

    res.json({ listings, total: Number(countRow[0]?.count ?? 0), categories: CATEGORIES });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch marketplace listings");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// ── GET /marketplace/categories ───────────────────────────────────────────────
router.get("/marketplace/categories", (_req, res) => res.json({ categories: CATEGORIES }));

// ── GET /marketplace/:id ──────────────────────────────────────────────────────
router.get("/marketplace/:id", async (req: Request, res: Response) => {
  try {
    const [listing] = await db.select().from(communityListingsTable)
      .where(eq(communityListingsTable.id, String(req.params.id))).limit(1);
    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
    // increment view count
    await db.update(communityListingsTable)
      .set({ viewCount: sql`${communityListingsTable.viewCount} + 1` })
      .where(eq(communityListingsTable.id, listing.id));
    res.json({ listing });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch listing");
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});

// ── POST /marketplace ─────────────────────────────────────────────────────────
router.post("/marketplace", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { type, title, description, price, priceType, category, condition,
    tags, city, state, zipCode, isRemote, contactPreference, contactInfo } = req.body as Record<string, any>;

  if (!type || !title?.trim()) { res.status(400).json({ error: "type and title are required" }); return; }

  const validTypes = ["product", "service", "skill_trade", "digital", "free"];
  if (!validTypes.includes(type)) { res.status(400).json({ error: "Invalid type" }); return; }

  const expiresAt = new Date(Date.now() + 30 * 86_400_000);

  try {
    const [listing] = await db.insert(communityListingsTable).values({
      userId: req.user.id,
      type,
      title: String(title).trim(),
      description: description ? String(description).trim() : null,
      price: price ? String(price).trim() : null,
      priceType: priceType ?? "fixed",
      category: category ? String(category).trim() : null,
      condition: condition ?? null,
      tags: Array.isArray(tags) ? tags.map(String) : null,
      city: city ? String(city).trim() : null,
      state: state ? String(state).trim() : null,
      zipCode: zipCode ? String(zipCode).trim() : null,
      isRemote: Boolean(isRemote),
      contactPreference: contactPreference ?? "app_message",
      contactInfo: contactInfo ? String(contactInfo).trim() : null,
      expiresAt,
    }).returning();
    res.json({ listing });
  } catch (err) {
    req.log.error({ err }, "Failed to create listing");
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// ── PATCH /marketplace/:id ────────────────────────────────────────────────────
router.patch("/marketplace/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [existing] = await db.select({ userId: communityListingsTable.userId })
      .from(communityListingsTable).where(eq(communityListingsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.userId !== req.user.id) { res.status(403).json({ error: "Not authorized" }); return; }

    const { status, price, description } = req.body as Record<string, any>;
    await db.update(communityListingsTable)
      .set({
        ...(status ? { status } : {}),
        ...(price !== undefined ? { price: String(price).trim() } : {}),
        ...(description !== undefined ? { description: String(description).trim() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(communityListingsTable.id, id));
    res.json({ updated: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update listing");
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// ── DELETE /marketplace/:id ───────────────────────────────────────────────────
router.delete("/marketplace/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [existing] = await db.select({ userId: communityListingsTable.userId })
      .from(communityListingsTable).where(eq(communityListingsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.userId !== req.user.id) { res.status(403).json({ error: "Not authorized" }); return; }
    await db.update(communityListingsTable)
      .set({ status: "removed", updatedAt: new Date() })
      .where(eq(communityListingsTable.id, id));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove listing");
    res.status(500).json({ error: "Failed to remove listing" });
  }
});

// ── GET /marketplace/my/listings ─────────────────────────────────────────────
router.get("/marketplace/my/listings", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const listings = await db.select().from(communityListingsTable)
      .where(eq(communityListingsTable.userId, req.user.id))
      .orderBy(desc(communityListingsTable.createdAt)).limit(50);
    res.json({ listings });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch my listings");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// ── POST /marketplace/:id/report ──────────────────────────────────────────────
router.post("/marketplace/:id/report", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    await db.update(communityListingsTable)
      .set({ reportCount: sql`${communityListingsTable.reportCount} + 1` })
      .where(eq(communityListingsTable.id, String(req.params.id)));
    res.json({ reported: true });
  } catch (err) {
    req.log.error({ err }, "Failed to report listing");
    res.status(500).json({ error: "Failed to report listing" });
  }
});

export default router;
