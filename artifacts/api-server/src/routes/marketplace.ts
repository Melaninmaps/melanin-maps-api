import { Router, type IRouter, type Request, type Response } from "express";
import { db, communityListingsTable, marketplaceSavedTable, usersTable } from "@workspace/db";
import { eq, and, or, ilike, desc, sql, inArray } from "drizzle-orm";
import { computeTrustLevel } from "@workspace/db/trust";
import { sendMarketplaceInquiry } from "../lib/email";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();
router.use(requireAuth);

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

    // Enrich with seller trust levels
    const userIds = [...new Set(listings.map((l) => l.userId).filter(Boolean))];
    const trustData = userIds.length > 0
      ? await db.select({
          id: usersTable.id,
          trustLevel: usersTable.trustLevel,
          identityVerified: usersTable.identityVerified,
          identityVerifiedAt: usersTable.identityVerifiedAt,
          policyViolationsCount: usersTable.policyViolationsCount,
          helpfulReviewsCount: usersTable.helpfulReviewsCount,
          createdAt: usersTable.createdAt,
          reputationScore: usersTable.reputationScore,
        }).from(usersTable).where(inArray(usersTable.id, userIds))
      : [];
    const trustMap = new Map(trustData.map((u) => [u.id, computeTrustLevel(u)]));

    // Check which are saved by the current user
    const currentUserId = req.user?.id ?? null;
    let savedSet = new Set<string>();
    if (currentUserId && listings.length > 0) {
      const saved = await db.select({ listingId: marketplaceSavedTable.listingId })
        .from(marketplaceSavedTable)
        .where(eq(marketplaceSavedTable.userId, currentUserId));
      savedSet = new Set(saved.map((s) => s.listingId));
    }

    const enriched = listings.map((l) => ({
      ...l,
      sellerTrustLevel: trustMap.get(l.userId) ?? 1,
      isSaved: savedSet.has(l.id),
    }));

    res.json({ listings: enriched, total: Number(countRow[0]?.count ?? 0), categories: CATEGORIES });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch marketplace listings");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// ── GET /marketplace/categories ───────────────────────────────────────────────
router.get("/marketplace/categories", (_req, res) => res.json({ categories: CATEGORIES }));

// ── GET /marketplace/saved ────────────────────────────────────────────────────
router.get("/marketplace/saved", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const saved = await db
      .select({ listingId: marketplaceSavedTable.listingId })
      .from(marketplaceSavedTable)
      .where(eq(marketplaceSavedTable.userId, req.user.id));
    const ids = saved.map((s) => s.listingId);
    if (ids.length === 0) { res.json({ listings: [] }); return; }
    const listings = await db.select().from(communityListingsTable)
      .where(and(inArray(communityListingsTable.id, ids), eq(communityListingsTable.status, "active")));
    res.json({ listings: listings.map((l) => ({ ...l, isSaved: true })) });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch saved listings");
    res.status(500).json({ error: "Failed to fetch saved listings" });
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

// ── GET /marketplace/:id ──────────────────────────────────────────────────────
router.get("/marketplace/:id", async (req: Request, res: Response) => {
  try {
    const [listing] = await db.select().from(communityListingsTable)
      .where(eq(communityListingsTable.id, String(req.params.id))).limit(1);
    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }
    await db.update(communityListingsTable)
      .set({ viewCount: sql`${communityListingsTable.viewCount} + 1` })
      .where(eq(communityListingsTable.id, listing.id));

    const currentUserId = req.user?.id ?? null;
    let isSaved = false;
    if (currentUserId) {
      const [s] = await db.select().from(marketplaceSavedTable)
        .where(and(eq(marketplaceSavedTable.userId, currentUserId), eq(marketplaceSavedTable.listingId, listing.id)))
        .limit(1);
      isSaved = !!s;
    }
    res.json({ listing: { ...listing, isSaved } });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch listing");
    res.status(500).json({ error: "Failed to fetch listing" });
  }
});

// ── POST /marketplace ─────────────────────────────────────────────────────────
router.post("/marketplace", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const {
    type, title, description, price, priceType, category, condition,
    tags, city, state, zipCode, isRemote, contactPreference, contactInfo,
    externalUrl, photos, sellerDisplayName,
  } = req.body as Record<string, any>;

  if (!type || !title?.trim()) { res.status(400).json({ error: "type and title are required" }); return; }

  const validTypes = ["product", "service", "skill_trade", "digital", "free"];
  if (!validTypes.includes(type)) { res.status(400).json({ error: "Invalid type" }); return; }

  const cleanUrl = typeof externalUrl === "string" && externalUrl.trim()
    ? externalUrl.trim().startsWith("http") ? externalUrl.trim() : `https://${externalUrl.trim()}`
    : null;

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
      externalUrl: cleanUrl,
      photos: Array.isArray(photos) ? photos.filter((p): p is string => typeof p === "string").slice(0, 6) : null,
      sellerDisplayName: sellerDisplayName ? String(sellerDisplayName).trim().slice(0, 200) : null,
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

// ── POST /marketplace/:id/inquiry ─────────────────────────────────────────────
router.post("/marketplace/:id/inquiry", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { message, buyerContact } = req.body as { message?: string; buyerContact?: string };
  if (!message?.trim()) { res.status(400).json({ error: "Message is required" }); return; }

  try {
    const [listing] = await db.select().from(communityListingsTable)
      .where(eq(communityListingsTable.id, String(req.params.id))).limit(1);
    if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

    // Get seller email
    const [seller] = await db.select({ email: usersTable.email, firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, listing.userId)).limit(1);

    if (seller?.email) {
      const buyerUser = req.user as { firstName?: string; lastName?: string };
      const buyerName = [buyerUser.firstName, buyerUser.lastName].filter(Boolean).join(" ") || "A community member";
      await sendMarketplaceInquiry({
        to: seller.email,
        sellerName: listing.sellerDisplayName ?? ([seller.firstName, seller.lastName].filter(Boolean).join(" ") || null),
        buyerName,
        listingTitle: listing.title,
        listingType: listing.type,
        message: message.trim(),
        buyerContact: buyerContact?.trim() ?? null,
      });
    }

    res.json({ sent: true });
  } catch (err) {
    req.log.error({ err }, "Failed to send inquiry");
    res.status(500).json({ error: "Failed to send inquiry" });
  }
});

// ── POST /marketplace/:id/save ────────────────────────────────────────────────
router.post("/marketplace/:id/save", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const listingId = String(req.params.id);
  try {
    await db.insert(marketplaceSavedTable)
      .values({ userId: req.user.id, listingId })
      .onConflictDoNothing();
    await db.update(communityListingsTable)
      .set({ savedCount: sql`${communityListingsTable.savedCount} + 1` })
      .where(eq(communityListingsTable.id, listingId));
    res.json({ saved: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save listing");
    res.status(500).json({ error: "Failed to save listing" });
  }
});

// ── DELETE /marketplace/:id/save ──────────────────────────────────────────────
router.delete("/marketplace/:id/save", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const listingId = String(req.params.id);
  try {
    await db.delete(marketplaceSavedTable)
      .where(and(eq(marketplaceSavedTable.userId, req.user.id), eq(marketplaceSavedTable.listingId, listingId)));
    await db.update(communityListingsTable)
      .set({ savedCount: sql`GREATEST(${communityListingsTable.savedCount} - 1, 0)` })
      .where(eq(communityListingsTable.id, listingId));
    res.json({ saved: false });
  } catch (err) {
    req.log.error({ err }, "Failed to unsave listing");
    res.status(500).json({ error: "Failed to unsave listing" });
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
