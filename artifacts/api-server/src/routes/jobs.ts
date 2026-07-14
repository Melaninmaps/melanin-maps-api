import { Router } from "express";
import { db, jobListingsTable, savedJobsTable, insertJobListingSchema, usersTable } from "@workspace/db";
import { eq, desc, and, sql, isNotNull } from "drizzle-orm";

const router = Router();

const JOB_TYPES = ["full_time", "part_time", "contract", "gig", "internship", "volunteer", "collaboration"] as const;

function haversineDistanceSql(lat: number, lng: number) {
  return sql<number>`(
    6371 * acos(
      LEAST(1.0, cos(radians(${lat})) * cos(radians(CAST(${jobListingsTable.latitude} AS float)))
      * cos(radians(CAST(${jobListingsTable.longitude} AS float)) - radians(${lng}))
      + sin(radians(${lat})) * sin(radians(CAST(${jobListingsTable.latitude} AS float))))
    )
  )`;
}

// GET /jobs — list with filters + near-me support
router.get("/jobs", async (req, res) => {
  try {
    const {
      city, state, type, status = "active",
      lat, lng, radius,
      isRemote, industry,
      limit: limitStr = "30", offset: offsetStr = "0",
    } = req.query as Record<string, string>;

    const limit = Math.min(parseInt(limitStr, 10) || 30, 60);
    const offset = parseInt(offsetStr, 10) || 0;

    const conditions: ReturnType<typeof sql>[] = [];
    conditions.push(sql`${jobListingsTable.status} = ${status}`);

    if (city) conditions.push(sql`LOWER(${jobListingsTable.city}) LIKE ${"%" + city.toLowerCase() + "%"}`);
    if (state) conditions.push(sql`LOWER(${jobListingsTable.state}) LIKE ${"%" + state.toLowerCase() + "%"}`);
    if (type && JOB_TYPES.includes(type as (typeof JOB_TYPES)[number])) {
      conditions.push(sql`${jobListingsTable.type} = ${type}`);
    }
    if (isRemote === "true") conditions.push(sql`${jobListingsTable.isRemote} = true`);
    if (industry) conditions.push(sql`LOWER(${jobListingsTable.industry}) LIKE ${"%" + industry.toLowerCase() + "%"}`);

    const useNearMe = !!(lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)));
    const radiusKm = parseFloat(radius ?? "50");
    const latF = parseFloat(lat ?? "0");
    const lngF = parseFloat(lng ?? "0");

    if (useNearMe) {
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((latF * Math.PI) / 180));
      conditions.push(
        sql`${jobListingsTable.latitude} IS NOT NULL`,
        sql`CAST(${jobListingsTable.latitude} AS float) BETWEEN ${latF - latDelta} AND ${latF + latDelta}`,
        sql`CAST(${jobListingsTable.longitude} AS float) BETWEEN ${lngF - lngDelta} AND ${lngF + lngDelta}`,
      );
    }

    const distanceCol = useNearMe ? haversineDistanceSql(latF, lngF) : sql`0`;

    const rows = await db
      .select({
        id: jobListingsTable.id,
        title: jobListingsTable.title,
        businessName: jobListingsTable.businessName,
        businessId: jobListingsTable.businessId,
        type: jobListingsTable.type,
        city: jobListingsTable.city,
        state: jobListingsTable.state,
        isRemote: jobListingsTable.isRemote,
        isHybrid: jobListingsTable.isHybrid,
        latitude: jobListingsTable.latitude,
        longitude: jobListingsTable.longitude,
        salary: jobListingsTable.salary,
        payMin: jobListingsTable.payMin,
        payMax: jobListingsTable.payMax,
        payType: jobListingsTable.payType,
        tags: jobListingsTable.tags,
        industry: jobListingsTable.industry,
        isPersonalReferral: jobListingsTable.isPersonalReferral,
        postedByName: jobListingsTable.postedByName,
        applicationUrl: jobListingsTable.applicationUrl,
        contactEmail: jobListingsTable.contactEmail,
        description: jobListingsTable.description,
        requirements: jobListingsTable.requirements,
        status: jobListingsTable.status,
        createdAt: jobListingsTable.createdAt,
        expiresAt: jobListingsTable.expiresAt,
        distanceKm: distanceCol,
      })
      .from(jobListingsTable)
      .where(and(...(conditions as any[])))
      .orderBy(useNearMe ? distanceCol : desc(jobListingsTable.createdAt))
      .limit(limit)
      .offset(offset);

    let savedIds = new Set<string>();
    if (req.user?.id) {
      const saved = await db
        .select({ jobId: savedJobsTable.jobId })
        .from(savedJobsTable)
        .where(eq(savedJobsTable.userId, req.user.id));
      savedIds = new Set(saved.map((s) => s.jobId));
    }

    res.json({
      jobs: rows.map((j) => ({ ...j, isSaved: savedIds.has(j.id) })),
      total: rows.length,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to list jobs");
    res.status(500).json({ error: "Failed to fetch job listings" });
  }
});

// GET /jobs/my-posts
router.get("/jobs/my-posts", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const jobs = await db
      .select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.postedById, req.user.id))
      .orderBy(desc(jobListingsTable.createdAt));
    res.json({ jobs });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user's job posts");
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// GET /jobs/saved
router.get("/jobs/saved", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    const rows = await db
      .select({
        id: jobListingsTable.id,
        title: jobListingsTable.title,
        businessName: jobListingsTable.businessName,
        type: jobListingsTable.type,
        city: jobListingsTable.city,
        state: jobListingsTable.state,
        isRemote: jobListingsTable.isRemote,
        payMin: jobListingsTable.payMin,
        payMax: jobListingsTable.payMax,
        payType: jobListingsTable.payType,
        status: jobListingsTable.status,
        createdAt: jobListingsTable.createdAt,
        savedAt: savedJobsTable.createdAt,
      })
      .from(savedJobsTable)
      .innerJoin(jobListingsTable, eq(savedJobsTable.jobId, jobListingsTable.id))
      .where(eq(savedJobsTable.userId, req.user.id))
      .orderBy(desc(savedJobsTable.createdAt));
    res.json({ jobs: rows });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch saved jobs");
    res.status(500).json({ error: "Failed to fetch saved jobs" });
  }
});

// GET /jobs/:id
router.get("/jobs/:id", async (req, res) => {
  try {
    const jobId = String(req.params.id);
    const [job] = await db
      .select()
      .from(jobListingsTable)
      .where(eq(jobListingsTable.id, jobId))
      .limit(1);
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }

    let isSaved = false;
    if (req.user?.id) {
      const [s] = await db
        .select({ id: savedJobsTable.id })
        .from(savedJobsTable)
        .where(and(eq(savedJobsTable.userId, req.user.id), eq(savedJobsTable.jobId, jobId)))
        .limit(1);
      isSaved = !!s;
    }
    res.json({ ...job, isSaved });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch job");
    res.status(500).json({ error: "Failed to fetch job listing" });
  }
});

// POST /jobs
router.post("/jobs", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  const body = req.body as Record<string, unknown>;

  const [poster] = await db
    .select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
    .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
  const posterName = poster ? [poster.firstName, poster.lastName].filter(Boolean).join(" ") || null : null;

  const expiresAt = new Date(Date.now() + 30 * 86_400_000);

  const parsed = insertJobListingSchema.safeParse({
    businessName: body.businessName ?? posterName ?? "Community Member",
    ...body,
    postedById: req.user.id,
    postedByName: body.isPersonalReferral === true ? posterName : (body.businessName ?? posterName),
    expiresAt,
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

// PATCH /jobs/:id
router.patch("/jobs/:id", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  const jobId = String(req.params.id);
  try {
    const [existing] = await db
      .select({ postedById: jobListingsTable.postedById })
      .from(jobListingsTable).where(eq(jobListingsTable.id, jobId)).limit(1);
    if (!existing) { res.status(404).json({ error: "Not found" }); return; }
    if (existing.postedById !== req.user.id) { res.status(403).json({ error: "Forbidden" }); return; }

    const body = req.body as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    if (body.title)                    updates.title = String(body.title);
    if (body.description)              updates.description = String(body.description);
    if (body.requirements !== undefined) updates.requirements = body.requirements ? String(body.requirements) : null;
    if (body.status)                   updates.status = String(body.status);
    if (body.salary !== undefined)     updates.salary = body.salary ? String(body.salary) : null;
    if (body.payMin !== undefined)     updates.payMin = body.payMin;
    if (body.payMax !== undefined)     updates.payMax = body.payMax;
    if (body.payType)                  updates.payType = String(body.payType);
    if (body.applicationUrl !== undefined) updates.applicationUrl = body.applicationUrl ? String(body.applicationUrl) : null;
    if (body.contactEmail !== undefined)   updates.contactEmail = body.contactEmail ? String(body.contactEmail) : null;

    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "No fields to update" }); return; }

    await db.update(jobListingsTable).set(updates as any).where(eq(jobListingsTable.id, jobId));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update job");
    res.status(500).json({ error: "Failed to update listing" });
  }
});

// DELETE /jobs/:id
router.delete("/jobs/:id", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    await db.delete(jobListingsTable).where(
      and(eq(jobListingsTable.id, String(req.params.id)), eq(jobListingsTable.postedById, req.user.id))
    );
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete job");
    res.status(500).json({ error: "Failed to delete job listing" });
  }
});

// POST /jobs/:id/save
router.post("/jobs/:id/save", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    await db.insert(savedJobsTable)
      .values({ userId: req.user.id, jobId: String(req.params.id) })
      .onConflictDoNothing();
    res.json({ saved: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save job");
    res.status(500).json({ error: "Failed to save job" });
  }
});

// DELETE /jobs/:id/save
router.delete("/jobs/:id/save", async (req, res) => {
  if (!req.user?.id) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    await db.delete(savedJobsTable).where(
      and(eq(savedJobsTable.userId, req.user.id), eq(savedJobsTable.jobId, String(req.params.id)))
    );
    res.json({ saved: false });
  } catch (err) {
    req.log.error({ err }, "Failed to unsave job");
    res.status(500).json({ error: "Failed to unsave job" });
  }
});

export default router;
