import { Router, type IRouter, type Request, type Response } from "express";
import { db, mentorshipProfilesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/mentorship", async (req: Request, res: Response) => {
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  const industry = typeof req.query.industry === "string" ? req.query.industry : undefined;
  try {
    let profiles = await db
      .select()
      .from(mentorshipProfilesTable)
      .where(eq(mentorshipProfilesTable.available, true))
      .orderBy(desc(mentorshipProfilesTable.createdAt))
      .limit(50);
    if (role && ["mentor", "mentee", "both"].includes(role)) {
      profiles = profiles.filter((p) => p.role === role || p.role === "both");
    }
    if (industry) {
      profiles = profiles.filter((p) => p.industry?.toLowerCase().includes(industry.toLowerCase()));
    }
    res.json({ profiles });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch mentorship profiles");
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

router.get("/mentorship/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
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

router.post("/mentorship", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const { fullName, bio, industry, role, expertise, city, linkedinUrl } = req.body as {
    fullName?: string;
    bio?: string;
    industry?: string;
    role?: string;
    expertise?: string;
    city?: string;
    linkedinUrl?: string;
  };
  if (!fullName?.trim()) {
    res.status(400).json({ error: "fullName required" });
    return;
  }
  const validRoles = ["mentor", "mentee", "both"];
  const safeRole = validRoles.includes(role ?? "") ? role! : "mentor";
  try {
    const [existing] = await db
      .select()
      .from(mentorshipProfilesTable)
      .where(eq(mentorshipProfilesTable.userId, req.user.id))
      .limit(1);
    if (existing) {
      const [updated] = await db
        .update(mentorshipProfilesTable)
        .set({ fullName: fullName.trim(), bio: bio ?? null, industry: industry ?? null, role: safeRole, expertise: expertise ?? null, city: city ?? null, linkedinUrl: linkedinUrl ?? null, updatedAt: new Date() })
        .where(eq(mentorshipProfilesTable.userId, req.user.id))
        .returning();
      res.json({ profile: updated });
      return;
    }
    const [profile] = await db
      .insert(mentorshipProfilesTable)
      .values({ userId: req.user.id, fullName: fullName.trim(), bio: bio ?? null, industry: industry ?? null, role: safeRole, expertise: expertise ?? null, city: city ?? null, linkedinUrl: linkedinUrl ?? null })
      .returning();
    res.status(201).json({ profile });
  } catch (err) {
    req.log.error({ err }, "Failed to save mentorship profile");
    res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;
