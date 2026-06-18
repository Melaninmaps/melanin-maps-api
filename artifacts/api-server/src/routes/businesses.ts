import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/businesses", async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;

    let query = db.select().from(businessesTable);

    const businesses = await query;

    let filtered = businesses;

    if (category && category !== "All") {
      filtered = filtered.filter((b) => b.category === category);
    }

    if (search && typeof search === "string") {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(term) ||
          b.city.toLowerCase().includes(term) ||
          b.category.toLowerCase().includes(term) ||
          b.description.toLowerCase().includes(term),
      );
    }

    res.json({ businesses: filtered });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch businesses");
    res.status(500).json({ error: "Failed to fetch businesses" });
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

    res.json({ business });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch business");
    res.status(500).json({ error: "Failed to fetch business" });
  }
});

router.post("/businesses", async (req: Request, res: Response) => {
  try {
    const { name, category, description, address, city, state, zip, phone, website, priceRange, hours, customHours, tags, isBlackOwned } = req.body as Record<string, unknown>;

    if (!name || !category || !address || !city || !state) {
      res.status(400).json({ error: "name, category, address, city, and state are required" });
      return;
    }

    const finalHours = hours === "Custom" ? (customHours as string | undefined) ?? null : (hours as string | undefined) ?? null;
    const tagArray = tags && typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
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

export default router;
