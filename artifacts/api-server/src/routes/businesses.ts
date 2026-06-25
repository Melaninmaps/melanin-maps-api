import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessProfileViewsTable, userSettingsTable } from "@workspace/db";
import { eq, and, or, ilike } from "drizzle-orm";

const router: IRouter = Router();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email);
}

router.get("/businesses", async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    const conditions = [];

    if (category && typeof category === "string" && category !== "All") {
      conditions.push(eq(businessesTable.category, category));
    }

    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(businessesTable.name, `%${search}%`),
          ilike(businessesTable.city, `%${search}%`),
          ilike(businessesTable.category, `%${search}%`),
          ilike(businessesTable.description, `%${search}%`),
        ),
      );
    }

    const businesses = await db
      .select()
      .from(businessesTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(200);

    res.json({ businesses, total: businesses.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch businesses");
    res.status(500).json({ error: "Failed to fetch businesses" });
  }
});

router.get("/businesses/mine", async (req: any, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.json({ business: null });
      return;
    }
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);
    res.json({ business: business ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.get("/businesses/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id));

    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const userId = (req as any).user?.id as string | undefined;
    // Fire-and-forget: skip tracking if user has opted out
    void (async () => {
      if (userId) {
        const [settings] = await db
          .select({ profileViewTrackingEnabled: userSettingsTable.profileViewTrackingEnabled })
          .from(userSettingsTable)
          .where(eq(userSettingsTable.userId, userId))
          .limit(1)
          .catch(() => []);
        if (settings?.profileViewTrackingEnabled === false) return;
      }
      db.insert(businessProfileViewsTable)
        .values({ businessId: id, userId: userId ?? null })
        .execute()
        .catch(() => {});
    })();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.post("/businesses", async (req: Request, res: Response) => {
  try {
    const {
      name, category, description, address, city, state,
      phone, website, priceRange, hours, customHours, tags, isBlackOwned,
    } = req.body as Record<string, unknown>;

    if (!name || !category || !address || !city || !state) {
      res.status(400).json({ error: "name, category, address, city, and state are required" });
      return;
    }

    const finalHours =
      hours === "Custom"
        ? (customHours as string | undefined) ?? null
        : (hours as string | undefined) ?? null;
    const tagArray =
      Array.isArray(tags)
        ? (tags as string[])
        : typeof tags === "string"
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [];
    const id = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const [business] = await db
      .insert(businessesTable)
      .values({
        id,
        name: name as string,
        category: category as string,
        subcategory: category as string,
        description: (description as string | undefined) ?? "",
        address: address as string,
        city: city as string,
        state: state as string,
        latitude: "0",
        longitude: "0",
        tags: tagArray,
        phone: (phone as string | undefined) ?? null,
        website: (website as string | undefined) ?? null,
        hours: finalHours,
        priceRange: (priceRange as string | undefined) ?? null,
        blackOwned: isBlackOwned === true || isBlackOwned === "true",
        status: "pending",
        submittedById: req.user?.id ?? null,
      })
      .returning();

    res.status(201).json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to submit business listing");
    res.status(500).json({ error: "Failed to submit listing" });
  }
});

router.patch("/businesses/:id/status", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    if (!isAdmin(req)) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    const id = String(req.params.id);
    const { status } = req.body as { status?: string };

    const allowed = ["active", "rejected", "pending", "suspended"];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${allowed.join(", ")}` });
      return;
    }

    const [existing] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const [business] = await db
      .update(businessesTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update business status");
    res.status(500).json({ error: "Failed to update status" });
  }
});

router.patch("/businesses/:id/badges", async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
    if (!isAdmin(req)) { res.status(403).json({ error: "Admin access required" }); return; }

    const id = String(req.params.id);
    const { currentLocationSince, businessFoundedDate, trustBadges } = req.body as {
      currentLocationSince?: string | null;
      businessFoundedDate?: string | null;
      trustBadges?: string[];
    };

    const [existing] = await db.select().from(businessesTable).where(eq(businessesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Business not found" }); return; }

    const [business] = await db
      .update(businessesTable)
      .set({
        currentLocationSince: currentLocationSince ?? null,
        businessFoundedDate: businessFoundedDate ?? null,
        trustBadges: Array.isArray(trustBadges) ? trustBadges : existing.trustBadges,
        updatedAt: new Date(),
      })
      .where(eq(businessesTable.id, id))
      .returning();

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to update business badges");
    res.status(500).json({ error: "Failed to update badges" });
  }
});

export default router;
