import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, and, ne } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { stripeCustomerId, stripeSubscriptionId, pushToken, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get("/users/search", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const q = String(req.query.q ?? "").trim();
    if (!q || q.length < 2) {
      res.json({ users: [] });
      return;
    }

    const pattern = `%${q}%`;
    const results = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
      })
      .from(usersTable)
      .where(
        and(
          ne(usersTable.id, req.user.id),
          or(
            ilike(usersTable.firstName, pattern),
            ilike(usersTable.lastName, pattern)
          )
        )
      )
      .limit(15);

    res.json({ users: results });
  } catch (err) {
    req.log.error({ err }, "GET /api/users/search error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const { firstName, lastName, profileImageUrl, industry, jobTitle } = req.body as Record<string, unknown>;

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (typeof firstName === "string") updates.firstName = firstName.trim() || null;
    if (typeof lastName === "string") updates.lastName = lastName.trim() || null;
    if (typeof profileImageUrl === "string") updates.profileImageUrl = profileImageUrl.trim() || null;
    if (typeof industry === "string") updates.industry = industry.trim() || null;
    if (typeof jobTitle === "string") updates.jobTitle = jobTitle.trim() || null;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No valid fields to update" });
      return;
    }

    const [user] = await db
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id))
      .returning();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { stripeCustomerId, stripeSubscriptionId, pushToken, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    req.log.error({ err }, "Failed to update user profile");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
