import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

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

export default router;
