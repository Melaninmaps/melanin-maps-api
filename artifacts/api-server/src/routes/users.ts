import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, and, ne } from "drizzle-orm";

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

const router: IRouter = Router();

router.get("/users/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    let [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id));

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Auto-start 90-day community premium trial if not yet set
    if (!user.trialEndsAt) {
      const trialEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      await db.update(usersTable).set({ trialEndsAt }).where(eq(usersTable.id, req.user.id));
      user = { ...user, trialEndsAt };
    }

    const { stripeCustomerId, stripeSubscriptionId, pushToken, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch user profile");
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get("/users/check-username/:username", async (req: Request, res: Response) => {
  const raw = String(req.params.username ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!USERNAME_RE.test(raw)) {
    res.json({ available: false, reason: "Username must be 3–30 characters: letters, numbers, underscores only." });
    return;
  }
  try {
    const [existing] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.username, raw))
      .limit(1);
    if (existing && req.user?.id && existing.id === req.user.id) {
      res.json({ available: true });
    } else {
      res.json({ available: !existing });
    }
  } catch (err) {
    req.log.error({ err }, "Failed to check username");
    res.status(500).json({ error: "Internal server error" });
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
    const { firstName, lastName, profileImageUrl, industry, jobTitle, username } = req.body as Record<string, unknown>;

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (typeof firstName === "string") updates.firstName = firstName.trim() || null;
    if (typeof lastName === "string") updates.lastName = lastName.trim() || null;
    if (typeof profileImageUrl === "string") updates.profileImageUrl = profileImageUrl.trim() || null;
    if (typeof industry === "string") updates.industry = industry.trim() || null;
    if (typeof jobTitle === "string") updates.jobTitle = jobTitle.trim() || null;
    if (typeof username === "string") {
      const clean = username.trim().toLowerCase().replace(/^@/, "");
      if (clean === "") {
        updates.username = null;
      } else if (!USERNAME_RE.test(clean)) {
        res.status(400).json({ error: "Username must be 3–30 characters: letters, numbers, underscores only." });
        return;
      } else {
        const [existing] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(and(eq(usersTable.username, clean), ne(usersTable.id, req.user.id)))
          .limit(1);
        if (existing) {
          res.status(409).json({ error: "That username is already taken." });
          return;
        }
        updates.username = clean;
      }
    }

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
