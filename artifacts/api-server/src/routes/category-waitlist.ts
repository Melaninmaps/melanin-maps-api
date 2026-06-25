import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { categoryWaitlist } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router = Router();

router.post("/category-waitlist", async (req: Request, res: Response) => {
  const { parentCategory, subcategory, businessName, email, phone, city, state } = req.body as {
    parentCategory?: string;
    subcategory?: string;
    businessName?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
  };

  if (!parentCategory?.trim()) {
    res.status(400).json({ error: "Category is required" });
    return;
  }
  if (!email?.trim() || !email.includes("@")) {
    res.status(400).json({ error: "Valid email is required" });
    return;
  }

  try {
    const [entry] = await db.insert(categoryWaitlist).values({
      parentCategory: parentCategory.trim(),
      subcategory: subcategory?.trim() || null,
      businessName: businessName?.trim() || null,
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
    }).returning();
    res.status(201).json({ entry });
  } catch (err) {
    (req as any).log?.error({ err }, "Failed to save category waitlist entry");
    res.status(500).json({ error: "Failed to save your request" });
  }
});

router.get("/admin/category-waitlist", async (req: any, res: Response) => {
  const isAdmin = req.user?.role === "admin" || req.user?.isAdmin;
  if (!isAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  try {
    const entries = await db
      .select()
      .from(categoryWaitlist)
      .orderBy(desc(categoryWaitlist.createdAt));

    const byCategory: Record<string, number> = {};
    for (const e of entries) {
      byCategory[e.parentCategory] = (byCategory[e.parentCategory] ?? 0) + 1;
    }

    res.json({ entries, byCategory, total: entries.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch category waitlist");
    res.status(500).json({ error: "Failed to fetch category waitlist" });
  }
});

export default router;
