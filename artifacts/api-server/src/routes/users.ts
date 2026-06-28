import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, profileTagsTable, reviewsTable, memberConnections } from "@workspace/db";
import { eq, ilike, or, and, ne, desc, inArray } from "drizzle-orm";

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
    const { firstName, lastName, profileImageUrl, industry, jobTitle, username, bio } = req.body as Record<string, unknown>;

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (typeof firstName === "string") updates.firstName = firstName.trim() || null;
    if (typeof lastName === "string") updates.lastName = lastName.trim() || null;
    if (typeof profileImageUrl === "string") updates.profileImageUrl = profileImageUrl.trim() || null;
    if (typeof industry === "string") updates.industry = industry.trim() || null;
    if (typeof jobTitle === "string") updates.jobTitle = jobTitle.trim() || null;
    if (typeof bio === "string") updates.bio = bio.trim().slice(0, 300) || null;
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

/* ── Public user profile ─────────────────────────────────────────────── */
router.patch("/users/me/privacy", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const { isPrivate } = req.body as { isPrivate?: unknown };
    if (typeof isPrivate !== "boolean") {
      res.status(400).json({ error: "isPrivate must be a boolean" });
      return;
    }
    const [user] = await db
      .update(usersTable)
      .set({ isPrivate, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id))
      .returning();
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const { stripeCustomerId, stripeSubscriptionId, pushToken, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/users/me/privacy error");
    res.status(500).json({ error: "Failed to update privacy setting" });
  }
});

router.get("/users/:userId/profile", async (req: Request, res: Response) => {
  try {
    const targetId = String(req.params.userId);
    const callerId = req.user?.id ?? null;

    const [user] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        profileImageUrl: usersTable.profileImageUrl,
        bio: usersTable.bio,
        industry: usersTable.industry,
        jobTitle: usersTable.jobTitle,
        createdAt: usersTable.createdAt,
        memberType: usersTable.memberType,
      })
      .from(usersTable)
      .where(eq(usersTable.id, targetId))
      .limit(1);

    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    // Recent reviews with social post links
    const reviews = await db
      .select({
        id: reviewsTable.id,
        businessId: reviewsTable.businessId,
        rating: reviewsTable.rating,
        text: reviewsTable.text,
        socialPostUrl: reviewsTable.videoUrl,
        socialHandle: reviewsTable.socialHandle,
        socialPlatform: reviewsTable.socialPlatform,
        createdAt: reviewsTable.createdAt,
      })
      .from(reviewsTable)
      .where(and(eq(reviewsTable.userId, targetId), eq(reviewsTable.isAnonymous, false)))
      .orderBy(desc(reviewsTable.createdAt))
      .limit(20);

    // Profile tags on this user's page
    const tags = await db
      .select({
        id: profileTagsTable.id,
        taggerId: profileTagsTable.taggerId,
        content: profileTagsTable.content,
        createdAt: profileTagsTable.createdAt,
        taggerFirstName: usersTable.firstName,
        taggerLastName: usersTable.lastName,
        taggerUsername: usersTable.username,
        taggerProfileImageUrl: usersTable.profileImageUrl,
      })
      .from(profileTagsTable)
      .leftJoin(usersTable, eq(profileTagsTable.taggerId, usersTable.id))
      .where(eq(profileTagsTable.taggedUserId, targetId))
      .orderBy(desc(profileTagsTable.createdAt))
      .limit(30);

    // Connection status (if caller is authenticated)
    let connectionStatus: string | null = null;
    let connectionId: number | null = null;
    if (callerId && callerId !== targetId) {
      const [conn] = await db
        .select({ id: memberConnections.id, status: memberConnections.status, requesterId: memberConnections.requesterId })
        .from(memberConnections)
        .where(
          or(
            and(eq(memberConnections.requesterId, callerId), eq(memberConnections.recipientId, targetId)),
            and(eq(memberConnections.requesterId, targetId), eq(memberConnections.recipientId, callerId)),
          ),
        )
        .limit(1);
      if (conn) {
        connectionStatus = conn.status === "accepted" ? "connected" : conn.requesterId === callerId ? "pending_sent" : "pending_received";
        connectionId = conn.id;
      }
    }

    res.json({ user, reviews, tags, connectionStatus, connectionId });
  } catch (err) {
    req.log.error({ err }, "GET /api/users/:userId/profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ── Profile tags ────────────────────────────────────────────────────── */
router.post("/users/:userId/tags", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const taggedUserId = String(req.params.userId);
    const taggerId = req.user.id;
    if (taggerId === taggedUserId) { res.status(400).json({ error: "Cannot tag yourself" }); return; }

    const { content } = req.body as { content?: string };
    if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }
    if (content.trim().length > 280) { res.status(400).json({ error: "Tag must be 280 chars or fewer" }); return; }

    const [tag] = await db
      .insert(profileTagsTable)
      .values({ taggerId, taggedUserId, content: content.trim() })
      .onConflictDoUpdate({ target: [profileTagsTable.taggerId, profileTagsTable.taggedUserId], set: { content: content.trim(), createdAt: new Date() } })
      .returning();

    res.status(201).json({ tag });
  } catch (err) {
    req.log.error({ err }, "POST /api/users/:userId/tags error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:userId/tags", async (req: Request, res: Response) => {
  try {
    const taggedUserId = String(req.params.userId);
    const tags = await db
      .select({
        id: profileTagsTable.id,
        taggerId: profileTagsTable.taggerId,
        content: profileTagsTable.content,
        createdAt: profileTagsTable.createdAt,
        taggerFirstName: usersTable.firstName,
        taggerLastName: usersTable.lastName,
        taggerUsername: usersTable.username,
        taggerProfileImageUrl: usersTable.profileImageUrl,
      })
      .from(profileTagsTable)
      .leftJoin(usersTable, eq(profileTagsTable.taggerId, usersTable.id))
      .where(eq(profileTagsTable.taggedUserId, taggedUserId))
      .orderBy(desc(profileTagsTable.createdAt))
      .limit(50);
    res.json({ tags });
  } catch (err) {
    req.log.error({ err }, "GET /api/users/:userId/tags error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/profile-tags/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const tagId = parseInt(String(req.params.id), 10);
    if (isNaN(tagId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user.id;

    const [tag] = await db.select().from(profileTagsTable).where(eq(profileTagsTable.id, tagId)).limit(1);
    if (!tag) { res.status(404).json({ error: "Tag not found" }); return; }
    if (tag.taggerId !== userId && tag.taggedUserId !== userId) {
      res.status(403).json({ error: "Not authorized to delete this tag" }); return;
    }

    await db.delete(profileTagsTable).where(eq(profileTagsTable.id, tagId));
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/profile-tags/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/users/me", async (req: Request, res: Response) => {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const [deleted] = await db
      .delete(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .returning({ id: usersTable.id });
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    req.log.info({ deletedUserId: deleted.id }, "User self-deleted account");
    res.json({ deleted: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/users/me error");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

/* POST /users/match-contacts — find registered members by email list */
router.post("/users/match-contacts", async (req: Request, res: Response): Promise<void> => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { emails } = req.body as { emails?: unknown };
  if (!Array.isArray(emails) || emails.length === 0) { res.json({ matches: [] }); return; }
  const normalized = [...new Set(
    (emails as unknown[]).filter((e): e is string => typeof e === "string")
      .map((e) => e.toLowerCase().trim())
      .filter((e) => e.includes("@"))
  )].slice(0, 500);
  if (normalized.length === 0) { res.json({ matches: [] }); return; }
  try {
    const matches = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        username: usersTable.username,
        profileImageUrl: usersTable.profileImageUrl,
        memberType: usersTable.memberType,
        bio: usersTable.bio,
      })
      .from(usersTable)
      .where(and(inArray(usersTable.email, normalized), ne(usersTable.id, req.user.id)));
    res.json({ matches });
  } catch (err) {
    req.log.error({ err }, "POST /users/match-contacts error");
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
