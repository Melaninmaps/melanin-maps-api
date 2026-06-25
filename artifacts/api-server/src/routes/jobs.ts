import { Router } from "express";
import { db, jobListingsTable, insertJobListingSchema, usersTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router = Router();

router.get("/jobs", async (req, res) => {
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

router.post("/jobs", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = req.body as Record<string, unknown>;
  const isReferral = body.isPersonalReferral === true;

  let posterName: string | null = null;
  if (isReferral) {
    const [poster] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
    if (poster) {
      posterName = [poster.firstName, poster.lastName].filter(Boolean).join(" ") || null;
    }
  }

  const parsed = insertJobListingSchema.safeParse({
    ...body,
    postedById: req.user.id,
    isPersonalReferral: isReferral,
    postedByName: posterName,
  });
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const [job] = await db.insert(jobListingsTable).values(parsed.data).returning();
    res.status(201).json(job);
  } catch (err) {
    req.log.error({ err }, "Failed to create job listing");
    res.status(500).json({ error: "Failed to create job listing" });
  }
});

router.delete("/jobs/:id", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
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
