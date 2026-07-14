import { Router, type IRouter, type Request, type Response } from "express";
import { db, mentorshipProfilesTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";

const router: IRouter = Router();

export const MENTORSHIP_SPECIALTIES = [
  "Entrepreneurship", "Finance & Investing", "Technology", "Legal",
  "Creative & Arts", "Beauty & Wellness", "Real Estate", "Marketing",
  "Media & Content", "Health & Medicine", "Education", "Music Industry",
  "Nonprofit & Advocacy", "Government & Policy", "Travel & Hospitality",
] as const;

// GET /mentorship
router.get("/mentorship", async (req: Request, res: Response) => {
  const {
    role, industry, specialty, city, state,
    lat, lng, radius,
    limit: limitStr = "30", offset: offsetStr = "0",
  } = req.query as Record<string, string>;

  const limit = Math.min(parseInt(limitStr, 10) || 30, 60);
  const offset = parseInt(offsetStr, 10) || 0;

  try {
    const conditions: ReturnType<typeof sql>[] = [
      sql`${mentorshipProfilesTable.available} = true`,
    ];

    if (role && ["mentor", "mentee", "both"].includes(role)) {
      conditions.push(sql`${mentorshipProfilesTable.role} = ${role}`);
    }
    if (industry) {
      conditions.push(sql`LOWER(${mentorshipProfilesTable.industry}) LIKE ${"%" + industry.toLowerCase() + "%"}`);
    }
    if (specialty) {
      conditions.push(sql`${mentorshipProfilesTable.specialties}::text ILIKE ${"%" + specialty + "%"}`);
    }
    if (city) {
      conditions.push(sql`LOWER(${mentorshipProfilesTable.city}) LIKE ${"%" + city.toLowerCase() + "%"}`);
    }
    if (state) {
      conditions.push(sql`LOWER(${mentorshipProfilesTable.state}) LIKE ${"%" + state.toLowerCase() + "%"}`);
    }

    const useNearMe = !!(lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng)));
    const radiusKm = parseFloat(radius ?? "80");
    const latF = parseFloat(lat ?? "0");
    const lngF = parseFloat(lng ?? "0");

    if (useNearMe) {
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos((latF * Math.PI) / 180));
      conditions.push(
        sql`${mentorshipProfilesTable.latitude} IS NOT NULL`,
        sql`CAST(${mentorshipProfilesTable.latitude} AS float) BETWEEN ${latF - latDelta} AND ${latF + latDelta}`,
        sql`CAST(${mentorshipProfilesTable.longitude} AS float) BETWEEN ${lngF - lngDelta} AND ${lngF + lngDelta}`,
      );
    }

    const distanceCol = useNearMe
      ? sql<number>`(6371 * acos(LEAST(1.0, cos(radians(${latF})) * cos(radians(CAST(${mentorshipProfilesTable.latitude} AS float))) * cos(radians(CAST(${mentorshipProfilesTable.longitude} AS float)) - radians(${lngF})) + sin(radians(${latF})) * sin(radians(CAST(${mentorshipProfilesTable.latitude} AS float))))))`
      : sql`0`;

    const profiles = await db
      .select({
        id: mentorshipProfilesTable.id,
        userId: mentorshipProfilesTable.userId,
        fullName: mentorshipProfilesTable.fullName,
        bio: mentorshipProfilesTable.bio,
        industry: mentorshipProfilesTable.industry,
        role: mentorshipProfilesTable.role,
        expertise: mentorshipProfilesTable.expertise,
        specialties: mentorshipProfilesTable.specialties,
        city: mentorshipProfilesTable.city,
        state: mentorshipProfilesTable.state,
        isRemote: mentorshipProfilesTable.isRemote,
        available: mentorshipProfilesTable.available,
        sessionType: mentorshipProfilesTable.sessionType,
        sessionRate: mentorshipProfilesTable.sessionRate,
        linkedinUrl: mentorshipProfilesTable.linkedinUrl,
        calendlyUrl: mentorshipProfilesTable.calendlyUrl,
        websiteUrl: mentorshipProfilesTable.websiteUrl,
        createdAt: mentorshipProfilesTable.createdAt,
        distanceKm: distanceCol,
      })
      .from(mentorshipProfilesTable)
      .where(and(...(conditions as any[])))
      .orderBy(useNearMe ? distanceCol : desc(mentorshipProfilesTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({ profiles, mentors: profiles, total: profiles.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch mentorship profiles");
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// GET /mentorship/me
router.get("/mentorship/me", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const [profile] = await db
      .select()
      .from(mentorshipProfilesTable)
      .where(eq(mentorshipProfilesTable.userId, req.user.id))
      .limit(1);
    res.json({ profile: profile ?? null });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch mentorship profile");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// GET /mentorship/specialties
router.get("/mentorship/specialties", (_req: Request, res: Response) => {
  res.json({ specialties: MENTORSHIP_SPECIALTIES });
});

// POST /mentorship — register or upsert mentor profile
router.post("/mentorship", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const {
    fullName, bio, industry, role, expertise,
    specialties, city, state, isRemote,
    latitude, longitude,
    linkedinUrl, calendlyUrl, websiteUrl,
    sessionType, sessionRate,
  } = req.body as Record<string, unknown>;

  let resolvedName = (fullName as string)?.trim();
  if (!resolvedName) {
    const [u] = await db.select({ firstName: usersTable.firstName, lastName: usersTable.lastName })
      .from(usersTable).where(eq(usersTable.id, req.user.id)).limit(1);
    if (u) resolvedName = [u.firstName, u.lastName].filter(Boolean).join(" ");
  }
  if (!resolvedName) { res.status(400).json({ error: "fullName required" }); return; }

  const validRoles = ["mentor", "mentee", "both"];
  const safeRole = validRoles.includes(role as string) ? (role as string) : "mentor";

  const data = {
    userId: req.user.id,
    fullName: resolvedName,
    bio: (bio as string) ?? null,
    industry: (industry as string) ?? null,
    role: safeRole,
    expertise: (expertise as string) ?? null,
    specialties: Array.isArray(specialties) ? specialties : [],
    city: (city as string) ?? null,
    state: (state as string) ?? null,
    isRemote: isRemote !== false,
    latitude: latitude ? String(latitude) : null,
    longitude: longitude ? String(longitude) : null,
    linkedinUrl: (linkedinUrl as string) ?? null,
    calendlyUrl: (calendlyUrl as string) ?? null,
    websiteUrl: (websiteUrl as string) ?? null,
    sessionType: (sessionType as string) ?? "free",
    sessionRate: (sessionRate as string) ?? null,
    available: true,
    updatedAt: new Date(),
  };

  try {
    const [existing] = await db.select({ id: mentorshipProfilesTable.id })
      .from(mentorshipProfilesTable)
      .where(eq(mentorshipProfilesTable.userId, req.user.id))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(mentorshipProfilesTable)
        .set(data)
        .where(eq(mentorshipProfilesTable.userId, req.user.id))
        .returning();
      res.json({ profile: updated });
    } else {
      const [profile] = await db.insert(mentorshipProfilesTable).values(data).returning();
      res.status(201).json({ profile });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to save mentorship profile");
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// PATCH /mentorship/me — quick update
router.patch("/mentorship/me", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const body = req.body as Record<string, unknown>;
  try {
    await db.update(mentorshipProfilesTable).set({
      ...(body.available !== undefined && { available: body.available as boolean }),
      ...(body.bio !== undefined && { bio: body.bio as string }),
      ...(body.specialties !== undefined && { specialties: body.specialties as string[] }),
      ...(body.sessionType !== undefined && { sessionType: body.sessionType as string }),
      ...(body.sessionRate !== undefined && { sessionRate: body.sessionRate as string }),
      updatedAt: new Date(),
    }).where(eq(mentorshipProfilesTable.userId, req.user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to update mentor profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
