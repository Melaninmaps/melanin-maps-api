import { Router } from "express";
import { db, jobListingsTable, insertJobListingSchema } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

router.get("/api/jobs", async (req, res) => {
  try {
    const { city, type, status = "active" } = req.query as Record<string, string>;
    const conditions = [eq(jobListingsTable.status, status)];
    if (city) conditions.push(eq(jobListingsTable.city, city));
    if (type) conditions.push(eq(jobListingsTable.type, type));
    const jobs = await db
      .select()
      .from(jobListingsTable)
      .where(and(...conditions))
      .orderBy(desc(jobListingsTable.createdAt));
    res.json({ jobs, total: jobs.length });
  } catch (err) {
    req.log.error({ err }, "Failed to list jobs");
    res.status(500).json({ error: "Failed to fetch job listings" });
  }
});

router.post("/api/jobs", async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  const parsed = insertJobListingSchema.safeParse({ ...req.body, postedById: req.user.id });
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const [job] = await db.insert(jobListingsTable).values(parsed.data).returning();
    res.status(201).json(job);
  } catch (err) {
    req.log.error({ err }, "Failed to create job listing");
    res.status(500).json({ error: "Failed to create job listing" });
  }
});

router.delete("/api/jobs/:id", async (req, res) => {
  if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });
  try {
    await db.delete(jobListingsTable).where(
      and(eq(jobListingsTable.id, req.params.id), eq(jobListingsTable.postedById, req.user.id))
    );
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete job");
    res.status(500).json({ error: "Failed to delete job listing" });
  }
});

export default router;
