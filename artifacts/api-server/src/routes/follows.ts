import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable, userFollowsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

const router: IRouter = Router();

/* ------------------------------------------------------------------ */
/* GET /users/:id/profile — public profile (respects private flag)     */
/* ------------------------------------------------------------------ */
router.get("/users/:id/profile", async (req: Request, res: Response) => {
  const targetId = String(req.params.id);
  const viewerId = req.user?.id;

  try {
    const [target] = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        username: usersTable.username,
        industry: usersTable.industry,
        jobTitle: usersTable.jobTitle,
        bio: usersTable.bio,
        isPrivate: usersTable.isPrivate,
        followersCount: usersTable.followersCount,
        followingCount: usersTable.followingCount,
        trustLevel: usersTable.trustLevel,
        identityVerified: usersTable.identityVerified,
        memberType: usersTable.memberType,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, targetId))
      .limit(1);

    if (!target) { res.status(404).json({ error: "User not found" }); return; }

    let isFollowing = false;
    let followStatus: string | null = null;
    let isFollowedBy = false;

    if (viewerId && viewerId !== targetId) {
      const [fwd] = await db
        .select({ status: userFollowsTable.status })
        .from(userFollowsTable)
        .where(and(eq(userFollowsTable.followerId, viewerId), eq(userFollowsTable.followingId, targetId)))
        .limit(1);
      isFollowing = !!fwd && fwd.status === "accepted";
      followStatus = fwd?.status ?? null;

      const [rev] = await db
        .select({ id: userFollowsTable.id })
        .from(userFollowsTable)
        .where(and(eq(userFollowsTable.followerId, targetId), eq(userFollowsTable.followingId, viewerId), eq(userFollowsTable.status, "accepted")))
        .limit(1);
      isFollowedBy = !!rev;
    }

    const canSeeContent = !target.isPrivate || (viewerId === targetId) || isFollowing;

    res.json({ profile: target, isFollowing, followStatus, isFollowedBy, canSeeContent });
  } catch (err) {
    req.log.error({ err }, "GET /users/:id/profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* POST /users/:id/follow — follow a user                              */
/* ------------------------------------------------------------------ */
router.post("/users/:id/follow", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const followerId = req.user.id;
  const followingId = String(req.params.id);

  if (followerId === followingId) { res.status(400).json({ error: "You cannot follow yourself" }); return; }

  try {
    const [existing] = await db
      .select({ id: userFollowsTable.id, status: userFollowsTable.status })
      .from(userFollowsTable)
      .where(and(eq(userFollowsTable.followerId, followerId), eq(userFollowsTable.followingId, followingId)))
      .limit(1);

    if (existing) {
      res.json({ status: existing.status, message: existing.status === "pending" ? "Follow request already pending" : "Already following" });
      return;
    }

    const [target] = await db
      .select({ isPrivate: usersTable.isPrivate })
      .from(usersTable)
      .where(eq(usersTable.id, followingId))
      .limit(1);

    if (!target) { res.status(404).json({ error: "User not found" }); return; }

    const status = target.isPrivate ? "pending" : "accepted";

    await db.insert(userFollowsTable).values({ followerId, followingId, status });

    if (status === "accepted") {
      await db.update(usersTable).set({ followersCount: sql`${usersTable.followersCount} + 1` }).where(eq(usersTable.id, followingId));
      await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` }).where(eq(usersTable.id, followerId));
    }

    res.json({ status, message: status === "pending" ? "Follow request sent" : "Now following" });
  } catch (err) {
    req.log.error({ err }, "POST /users/:id/follow error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* DELETE /users/:id/follow — unfollow                                 */
/* ------------------------------------------------------------------ */
router.delete("/users/:id/follow", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const followerId = req.user.id;
  const followingId = String(req.params.id);

  try {
    const [existing] = await db
      .select({ id: userFollowsTable.id, status: userFollowsTable.status })
      .from(userFollowsTable)
      .where(and(eq(userFollowsTable.followerId, followerId), eq(userFollowsTable.followingId, followingId)))
      .limit(1);

    if (!existing) { res.json({ message: "Not following" }); return; }

    await db.delete(userFollowsTable).where(eq(userFollowsTable.id, existing.id));

    if (existing.status === "accepted") {
      await db.update(usersTable).set({ followersCount: sql`GREATEST(${usersTable.followersCount} - 1, 0)` }).where(eq(usersTable.id, followingId));
      await db.update(usersTable).set({ followingCount: sql`GREATEST(${usersTable.followingCount} - 1, 0)` }).where(eq(usersTable.id, followerId));
    }

    res.json({ message: "Unfollowed" });
  } catch (err) {
    req.log.error({ err }, "DELETE /users/:id/follow error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /users/:id/followers — list followers                           */
/* ------------------------------------------------------------------ */
router.get("/users/:id/followers", async (req: Request, res: Response) => {
  const targetId = String(req.params.id);
  const viewerId = req.user?.id;

  try {
    const [target] = await db.select({ isPrivate: usersTable.isPrivate }).from(usersTable).where(eq(usersTable.id, targetId)).limit(1);
    if (!target) { res.status(404).json({ error: "User not found" }); return; }

    if (target.isPrivate && viewerId !== targetId) {
      let allowed = false;
      if (viewerId) {
        const [f] = await db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(and(eq(userFollowsTable.followerId, viewerId), eq(userFollowsTable.followingId, targetId), eq(userFollowsTable.status, "accepted"))).limit(1);
        allowed = !!f;
      }
      if (!allowed) { res.status(403).json({ error: "This account is private" }); return; }
    }

    const rows = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        username: usersTable.username,
        isPrivate: usersTable.isPrivate,
        followersCount: usersTable.followersCount,
      })
      .from(userFollowsTable)
      .innerJoin(usersTable, eq(userFollowsTable.followerId, usersTable.id))
      .where(and(eq(userFollowsTable.followingId, targetId), eq(userFollowsTable.status, "accepted")))
      .limit(100);

    res.json({ followers: rows });
  } catch (err) {
    req.log.error({ err }, "GET /users/:id/followers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /users/:id/following — list who they follow                     */
/* ------------------------------------------------------------------ */
router.get("/users/:id/following", async (req: Request, res: Response) => {
  const targetId = String(req.params.id);
  const viewerId = req.user?.id;

  try {
    const [target] = await db.select({ isPrivate: usersTable.isPrivate }).from(usersTable).where(eq(usersTable.id, targetId)).limit(1);
    if (!target) { res.status(404).json({ error: "User not found" }); return; }

    if (target.isPrivate && viewerId !== targetId) {
      let allowed = false;
      if (viewerId) {
        const [f] = await db.select({ id: userFollowsTable.id }).from(userFollowsTable).where(and(eq(userFollowsTable.followerId, viewerId), eq(userFollowsTable.followingId, targetId), eq(userFollowsTable.status, "accepted"))).limit(1);
        allowed = !!f;
      }
      if (!allowed) { res.status(403).json({ error: "This account is private" }); return; }
    }

    const rows = await db
      .select({
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        username: usersTable.username,
        isPrivate: usersTable.isPrivate,
        followersCount: usersTable.followersCount,
      })
      .from(userFollowsTable)
      .innerJoin(usersTable, eq(userFollowsTable.followingId, usersTable.id))
      .where(and(eq(userFollowsTable.followerId, targetId), eq(userFollowsTable.status, "accepted")))
      .limit(100);

    res.json({ following: rows });
  } catch (err) {
    req.log.error({ err }, "GET /users/:id/following error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* GET /users/me/follow-requests — pending requests for private accts  */
/* ------------------------------------------------------------------ */
router.get("/users/me/follow-requests", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  try {
    const rows = await db
      .select({
        requestId: userFollowsTable.id,
        createdAt: userFollowsTable.createdAt,
        id: usersTable.id,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        profileImageUrl: usersTable.profileImageUrl,
        username: usersTable.username,
      })
      .from(userFollowsTable)
      .innerJoin(usersTable, eq(userFollowsTable.followerId, usersTable.id))
      .where(and(eq(userFollowsTable.followingId, req.user.id), eq(userFollowsTable.status, "pending")))
      .limit(50);

    res.json({ requests: rows });
  } catch (err) {
    req.log.error({ err }, "GET /users/me/follow-requests error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* POST /users/follow-requests/:id/accept                              */
/* ------------------------------------------------------------------ */
router.post("/users/follow-requests/:id/accept", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const requestId = Number(req.params.id);

  try {
    const [row] = await db
      .select()
      .from(userFollowsTable)
      .where(and(eq(userFollowsTable.id, requestId), eq(userFollowsTable.followingId, req.user.id), eq(userFollowsTable.status, "pending")))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Request not found" }); return; }

    await db.update(userFollowsTable).set({ status: "accepted", acceptedAt: new Date() }).where(eq(userFollowsTable.id, requestId));
    await db.update(usersTable).set({ followersCount: sql`${usersTable.followersCount} + 1` }).where(eq(usersTable.id, req.user.id));
    await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` }).where(eq(usersTable.id, row.followerId));

    res.json({ message: "Follow request accepted" });
  } catch (err) {
    req.log.error({ err }, "POST /users/follow-requests/:id/accept error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* DELETE /users/follow-requests/:id — decline/dismiss                 */
/* ------------------------------------------------------------------ */
router.delete("/users/follow-requests/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const requestId = Number(req.params.id);

  try {
    await db
      .delete(userFollowsTable)
      .where(and(eq(userFollowsTable.id, requestId), eq(userFollowsTable.followingId, req.user.id)));
    res.json({ message: "Request declined" });
  } catch (err) {
    req.log.error({ err }, "DELETE /users/follow-requests/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ------------------------------------------------------------------ */
/* PATCH /users/me/privacy — toggle private account                    */
/* ------------------------------------------------------------------ */
router.patch("/users/me/privacy", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { isPrivate, bio } = req.body as Record<string, unknown>;

  try {
    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (typeof isPrivate === "boolean") updates.isPrivate = isPrivate;
    if (typeof bio === "string") updates.bio = bio.trim().slice(0, 300) || null;

    if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }

    const [user] = await db
      .update(usersTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(usersTable.id, req.user.id))
      .returning({
        isPrivate: usersTable.isPrivate,
        bio: usersTable.bio,
      });

    // When switching to public: auto-accept all pending requests
    if (isPrivate === false) {
      const pending = await db
        .select({ id: userFollowsTable.id, followerId: userFollowsTable.followerId })
        .from(userFollowsTable)
        .where(and(eq(userFollowsTable.followingId, req.user.id), eq(userFollowsTable.status, "pending")));

      if (pending.length > 0) {
        await db.update(userFollowsTable).set({ status: "accepted", acceptedAt: new Date() }).where(and(eq(userFollowsTable.followingId, req.user.id), eq(userFollowsTable.status, "pending")));
        await db.update(usersTable).set({ followersCount: sql`${usersTable.followersCount} + ${pending.length}` }).where(eq(usersTable.id, req.user.id));
        for (const p of pending) {
          await db.update(usersTable).set({ followingCount: sql`${usersTable.followingCount} + 1` }).where(eq(usersTable.id, p.followerId));
        }
      }
    }

    res.json({ user });
  } catch (err) {
    req.log.error({ err }, "PATCH /users/me/privacy error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
