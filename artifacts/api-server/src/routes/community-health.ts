import { Router, type IRouter, type Request, type Response } from "express";
import { db, physicianProfilesTable, healthPostsTable, healthPostLikesTable, userHealthTopicFollowsTable, HEALTH_TOPICS } from "@workspace/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import type { HealthTopicId } from "@workspace/db";

const router: IRouter = Router();

const VALID_TOPIC_IDS = new Set(HEALTH_TOPICS.map(t => t.id));

// ─── GET /api/health-hub/topics ──────────────────────────────────────────────
router.get("/health-hub/topics", (_req: Request, res: Response) => {
  res.json({ topics: HEALTH_TOPICS });
});

// ─── GET /api/health-hub/topics/mine ─────────────────────────────────────────
router.get("/health-hub/topics/mine", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [row] = await db
    .select()
    .from(userHealthTopicFollowsTable)
    .where(eq(userHealthTopicFollowsTable.userId, req.user.id))
    .limit(1);

  res.json({ topicIds: row?.topicIds ?? [], pinnedTopicIds: row?.pinnedTopicIds ?? [] });
});

// ─── PATCH /api/health-hub/topics/mine/pin ───────────────────────────────────
router.patch("/health-hub/topics/mine/pin", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { topicId, pinned } = req.body as { topicId?: string; pinned?: boolean };
  if (!topicId || typeof pinned !== "boolean") {
    res.status(400).json({ error: "topicId and pinned (boolean) required" }); return;
  }
  if (!VALID_TOPIC_IDS.has(topicId as HealthTopicId)) {
    res.status(400).json({ error: "Invalid topicId" }); return;
  }

  const [existing] = await db
    .select()
    .from(userHealthTopicFollowsTable)
    .where(eq(userHealthTopicFollowsTable.userId, req.user.id))
    .limit(1);

  const currentPinned: HealthTopicId[] = (existing?.pinnedTopicIds ?? []) as HealthTopicId[];
  const currentFollowed: HealthTopicId[] = (existing?.topicIds ?? []) as HealthTopicId[];

  if (pinned && !currentFollowed.includes(topicId as HealthTopicId)) {
    res.status(400).json({ error: "You must follow this topic before pinning it" }); return;
  }

  const nextPinned: HealthTopicId[] = pinned
    ? [...new Set([...currentPinned, topicId as HealthTopicId])]
    : currentPinned.filter((id) => id !== topicId);

  let row;
  if (existing) {
    [row] = await db
      .update(userHealthTopicFollowsTable)
      .set({ pinnedTopicIds: nextPinned })
      .where(eq(userHealthTopicFollowsTable.userId, req.user.id))
      .returning();
  } else {
    [row] = await db
      .insert(userHealthTopicFollowsTable)
      .values({ userId: req.user.id, topicIds: [], pinnedTopicIds: nextPinned })
      .returning();
  }

  res.json({ pinnedTopicIds: row?.pinnedTopicIds ?? [] });
});

// ─── PATCH /api/health-hub/topics/mine ───────────────────────────────────────
router.patch("/health-hub/topics/mine", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { topicIds } = req.body as { topicIds?: string[] };
  if (!Array.isArray(topicIds)) { res.status(400).json({ error: "topicIds array required" }); return; }

  const valid = topicIds.filter(t => VALID_TOPIC_IDS.has(t as HealthTopicId)) as HealthTopicId[];

  const [existing] = await db
    .select({ id: userHealthTopicFollowsTable.id })
    .from(userHealthTopicFollowsTable)
    .where(eq(userHealthTopicFollowsTable.userId, req.user.id))
    .limit(1);

  let row;
  if (existing) {
    [row] = await db
      .update(userHealthTopicFollowsTable)
      .set({ topicIds: valid })
      .where(eq(userHealthTopicFollowsTable.userId, req.user.id))
      .returning();
  } else {
    [row] = await db
      .insert(userHealthTopicFollowsTable)
      .values({ userId: req.user.id, topicIds: valid })
      .returning();
  }

  res.json({ topicIds: row?.topicIds ?? [] });
});

// ─── GET /api/health-hub/posts ────────────────────────────────────────────────
router.get("/health-hub/posts", async (req: Request, res: Response) => {
  const { topic } = req.query as { topic?: string };

  const posts = await db
    .select({
      post: healthPostsTable,
      physician: {
        id: physicianProfilesTable.id,
        displayName: physicianProfilesTable.displayName,
        credentials: physicianProfilesTable.credentials,
        specialty: physicianProfilesTable.specialty,
        institution: physicianProfilesTable.institution,
        bio: physicianProfilesTable.bio,
      },
    })
    .from(healthPostsTable)
    .innerJoin(physicianProfilesTable, eq(physicianProfilesTable.id, healthPostsTable.physicianId))
    .where(eq(healthPostsTable.status, "active"))
    .orderBy(desc(healthPostsTable.createdAt))
    .limit(50);

  // Filter by topic client-side (JSONB array contains)
  const filtered = topic && VALID_TOPIC_IDS.has(topic as HealthTopicId)
    ? posts.filter(p => (p.post.topicIds as string[]).includes(topic))
    : posts;

  // Attach liked status for authenticated users
  let likedPostIds = new Set<string>();
  if (req.user?.id) {
    const likes = await db
      .select({ postId: healthPostLikesTable.postId })
      .from(healthPostLikesTable)
      .where(eq(healthPostLikesTable.userId, req.user.id));
    likedPostIds = new Set(likes.map(l => l.postId));
  }

  res.json({
    posts: filtered.map(({ post, physician }) => ({
      ...post,
      physician,
      liked: likedPostIds.has(post.id),
    })),
  });
});

// ─── POST /api/health-hub/posts ───────────────────────────────────────────────
router.post("/health-hub/posts", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  // Must be an approved physician
  const [physician] = await db
    .select()
    .from(physicianProfilesTable)
    .where(and(
      eq(physicianProfilesTable.userId, req.user.id),
      eq(physicianProfilesTable.status, "approved"),
    ))
    .limit(1);

  if (!physician) {
    res.status(403).json({ error: "Only verified physicians can post health content.", code: "not_physician" });
    return;
  }

  const { title, summary, url, source, topicIds } = req.body as {
    title?: string; summary?: string; url?: string; source?: string; topicIds?: string[];
  };

  if (!title?.trim()) { res.status(400).json({ error: "title required" }); return; }
  if (!summary?.trim()) { res.status(400).json({ error: "summary required" }); return; }
  if (!url?.trim()) { res.status(400).json({ error: "url required" }); return; }
  if (!source?.trim()) { res.status(400).json({ error: "source required" }); return; }
  if (title.length > 300) { res.status(400).json({ error: "title max 300 chars" }); return; }
  if (summary.length > 1000) { res.status(400).json({ error: "summary max 1000 chars" }); return; }

  // Basic URL validation
  try { new URL(url.startsWith("http") ? url : `https://${url}`); } catch {
    res.status(400).json({ error: "Invalid URL" }); return;
  }

  const validTopics = (Array.isArray(topicIds) ? topicIds : [])
    .filter(t => VALID_TOPIC_IDS.has(t as HealthTopicId)) as HealthTopicId[];
  if (!validTopics.length) { res.status(400).json({ error: "At least one valid topic required" }); return; }

  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  const [post] = await db
    .insert(healthPostsTable)
    .values({
      physicianId: physician.id,
      authorUserId: req.user.id,
      title: title.trim(),
      summary: summary.trim(),
      url: normalizedUrl,
      source: source.trim(),
      topicIds: validTopics,
    })
    .returning();

  req.log.info({ physicianId: physician.id, postId: post.id }, "Health post created");
  res.json({ post: { ...post, physician, liked: false } });
});

// ─── DELETE /api/health-hub/posts/:id ────────────────────────────────────────
router.delete("/health-hub/posts/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const postId = String(req.params.id);
  const [post] = await db
    .select({ authorUserId: healthPostsTable.authorUserId })
    .from(healthPostsTable)
    .where(eq(healthPostsTable.id, postId))
    .limit(1);

  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  if (post.authorUserId !== req.user.id && (req as any).user?.role !== "admin") {
    res.status(403).json({ error: "Not authorized" }); return;
  }

  await db.update(healthPostsTable).set({ status: "removed" }).where(eq(healthPostsTable.id, postId));
  res.json({ success: true });
});

// ─── POST /api/health-hub/posts/:id/like ─────────────────────────────────────
router.post("/health-hub/posts/:id/like", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const postId = String(req.params.id);

  const [existing] = await db
    .select({ id: healthPostLikesTable.id })
    .from(healthPostLikesTable)
    .where(and(eq(healthPostLikesTable.postId, postId), eq(healthPostLikesTable.userId, req.user.id)))
    .limit(1);

  if (existing) {
    await db.delete(healthPostLikesTable).where(eq(healthPostLikesTable.id, existing.id));
    await db.update(healthPostsTable).set({ likeCount: sql`like_count - 1` }).where(eq(healthPostsTable.id, postId));
    res.json({ liked: false });
  } else {
    await db.insert(healthPostLikesTable).values({ postId, userId: req.user.id });
    await db.update(healthPostsTable).set({ likeCount: sql`like_count + 1` }).where(eq(healthPostsTable.id, postId));
    res.json({ liked: true });
  }
});

// ─── GET /api/health-hub/physician ───────────────────────────────────────────
router.get("/health-hub/physician", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [physician] = await db
    .select()
    .from(physicianProfilesTable)
    .where(eq(physicianProfilesTable.userId, req.user.id))
    .limit(1);

  res.json({ physician: physician ?? null });
});

// ─── POST /api/health-hub/physician/apply ────────────────────────────────────
router.post("/health-hub/physician/apply", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const [existing] = await db
    .select({ id: physicianProfilesTable.id, status: physicianProfilesTable.status })
    .from(physicianProfilesTable)
    .where(eq(physicianProfilesTable.userId, req.user.id))
    .limit(1);

  if (existing && existing.status === "approved") {
    res.status(409).json({ error: "Already verified" }); return;
  }
  if (existing && existing.status === "pending") {
    res.status(409).json({ error: "Application already submitted and under review" }); return;
  }

  const { displayName, credentials, specialty, institution, licenseState, licenseNumber, bio } = req.body as {
    displayName?: string; credentials?: string; specialty?: string;
    institution?: string; licenseState?: string; licenseNumber?: string; bio?: string;
  };

  if (!displayName?.trim()) { res.status(400).json({ error: "displayName required" }); return; }
  if (!credentials?.trim()) { res.status(400).json({ error: "credentials required (e.g. MD, DO, NP)" }); return; }
  if (!specialty?.trim()) { res.status(400).json({ error: "specialty required" }); return; }

  let physician;
  if (existing) {
    [physician] = await db
      .update(physicianProfilesTable)
      .set({ displayName: displayName.trim(), credentials: credentials.trim(), specialty: specialty.trim(), institution: institution?.trim(), licenseState: licenseState?.trim(), licenseNumber: licenseNumber?.trim(), bio: bio?.trim(), status: "pending", rejectionReason: null })
      .where(eq(physicianProfilesTable.userId, req.user.id))
      .returning();
  } else {
    [physician] = await db
      .insert(physicianProfilesTable)
      .values({ userId: req.user.id, displayName: displayName.trim(), credentials: credentials.trim(), specialty: specialty.trim(), institution: institution?.trim(), licenseState: licenseState?.trim(), licenseNumber: licenseNumber?.trim(), bio: bio?.trim() })
      .returning();
  }

  req.log.info({ userId: req.user.id, specialty }, "Physician verification application submitted");
  res.json({ physician });
});

// ─── Admin: GET /api/health-hub/admin/physicians ─────────────────────────────
router.get("/health-hub/admin/physicians", async (req: Request, res: Response) => {
  if ((req as any).user?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const physicians = await db
    .select()
    .from(physicianProfilesTable)
    .where(eq(physicianProfilesTable.status, "pending"))
    .orderBy(physicianProfilesTable.createdAt);

  res.json({ physicians });
});

// ─── Admin: PATCH /api/health-hub/admin/physicians/:id ───────────────────────
router.patch("/health-hub/admin/physicians/:id", async (req: Request, res: Response) => {
  if ((req as any).user?.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }

  const { status, rejectionReason } = req.body as { status?: string; rejectionReason?: string };
  if (!["approved", "rejected"].includes(status ?? "")) {
    res.status(400).json({ error: "status must be approved or rejected" }); return;
  }

  const [physician] = await db
    .update(physicianProfilesTable)
    .set({
      status: status as "approved" | "rejected",
      verifiedAt: status === "approved" ? new Date() : null,
      rejectionReason: status === "rejected" ? (rejectionReason ?? "Does not meet verification criteria") : null,
    })
    .where(eq(physicianProfilesTable.id, String(req.params.id)))
    .returning();

  res.json({ physician });
});

export default router;
