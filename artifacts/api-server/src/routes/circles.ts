import { Router, type Request, type Response } from "express";
import { db, pool } from "@workspace/db";
import {
  kinfolkCircles,
  circleMembers,
  circleSuggestions,
  circlePlans,
  circleVotes,
  circleAdventures,
  circleNudges,
  circleImportantDates,
  userPreferencesTable,
  savedPlacesTable,
  businessesTable,
  type CircleItinerary,
} from "@workspace/db/schema";
import { eq, and, inArray, desc, sql, not } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { storage } from "../storage";
import { sendPushToUser } from "../lib/pushNotifications";

// Tier limits for circle creation
const CIRCLE_LIMITS: Record<string, { maxCircles: number; maxPrivateMembers: number; maxCommunityMembers: number }> = {
  free:        { maxCircles: 1,        maxPrivateMembers: 8, maxCommunityMembers: 0 },
  navigator:   { maxCircles: 3,        maxPrivateMembers: 8, maxCommunityMembers: 8 },
  trailblazer: { maxCircles: Infinity, maxPrivateMembers: 8, maxCommunityMembers: 8 },
  founding:    { maxCircles: Infinity, maxPrivateMembers: 8, maxCommunityMembers: 8 },
  beta:        { maxCircles: Infinity, maxPrivateMembers: 8, maxCommunityMembers: 8 },
};
function getTierKey(memberType: string | null | undefined): keyof typeof CIRCLE_LIMITS {
  if (!memberType) return "free";
  if (memberType in CIRCLE_LIMITS) return memberType as keyof typeof CIRCLE_LIMITS;
  return "free";
}

const router = Router();

function uid(req: Request): string {
  return (req as any).user?.id as string;
}
function authed(req: Request, res: Response): boolean {
  if (!(req as any).user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

async function getCircleWithAuth(circleId: number, userId: string, res: Response) {
  const [circle] = await db.select().from(kinfolkCircles).where(eq(kinfolkCircles.id, circleId)).limit(1);
  if (!circle) { res.status(404).json({ error: "Circle not found" }); return null; }
  const [membership] = await db.select().from(circleMembers)
    .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId))).limit(1);
  return { circle, membership: membership ?? null };
}

type CircleMemberRow = { id: number; circleId: number; userId: string; role: string; joinedAt: Date };
type CapacityJoinResult = {
  status: "joined" | "already_member" | "full" | "missing";
  member?: CircleMemberRow;
};

async function addCircleMemberWithinCap(circleId: number, userId: string): Promise<CapacityJoinResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const circleResult = await client.query<{ max_members: number }>(
      `SELECT max_members FROM kinfolk_circles WHERE id = $1 FOR UPDATE`,
      [circleId],
    );
    if (!circleResult.rows[0]) {
      await client.query("ROLLBACK");
      return { status: "missing" };
    }

    const existingResult = await client.query<CircleMemberRow>(
      `SELECT id, circle_id AS "circleId", user_id AS "userId", role, joined_at AS "joinedAt"
       FROM circle_members WHERE circle_id = $1 AND user_id = $2 LIMIT 1`,
      [circleId, userId],
    );
    if (existingResult.rows[0]) {
      await client.query("ROLLBACK");
      return { status: "already_member", member: existingResult.rows[0] };
    }

    const countResult = await client.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM circle_members WHERE circle_id = $1`,
      [circleId],
    );
    const effectiveMax = Math.min(Number(circleResult.rows[0].max_members) || 8, 8);
    if ((countResult.rows[0]?.count ?? 0) >= effectiveMax) {
      await client.query("ROLLBACK");
      return { status: "full" };
    }

    const insertedResult = await client.query<CircleMemberRow>(
      `INSERT INTO circle_members (circle_id, user_id, role)
       VALUES ($1, $2, 'member')
       RETURNING id, circle_id AS "circleId", user_id AS "userId", role, joined_at AS "joinedAt"`,
      [circleId, userId],
    );
    await client.query("COMMIT");
    return { status: "joined", member: insertedResult.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

router.get("/circles", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  try {
    const myIds = await db.select({ circleId: circleMembers.circleId })
      .from(circleMembers).where(eq(circleMembers.userId, uid(req)));
    const ids = myIds.map((r) => r.circleId);
    const circles = ids.length
      ? await db.select().from(kinfolkCircles).where(inArray(kinfolkCircles.id, ids)).orderBy(desc(kinfolkCircles.updatedAt))
      : [];
    const counts = await db.select({ circleId: circleMembers.circleId, count: sql<number>`count(*)`.mapWith(Number) })
      .from(circleMembers).where(inArray(circleMembers.circleId, ids.length ? ids : [-1])).groupBy(circleMembers.circleId);
    const countMap = Object.fromEntries(counts.map((c) => [c.circleId, c.count]));
    res.json({ circles: circles.map((c) => ({ ...c, memberCount: countMap[c.id] ?? 1 })) });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles error");
    res.status(500).json({ error: "Failed to load circles" });
  }
});

router.get("/circles/community", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  try {
    const circles = await db.select().from(kinfolkCircles)
      .where(and(eq(kinfolkCircles.type, "community"), eq(kinfolkCircles.privacy, "public")))
      .orderBy(desc(kinfolkCircles.createdAt)).limit(30);
    res.json({ circles: circles.map((circle) => ({
      id: circle.id,
      name: circle.name,
      description: circle.description,
      emoji: circle.emoji,
      city: circle.city,
      state: circle.state,
      maxMembers: Math.min(circle.maxMembers, 8),
    })) });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/community error");
    res.status(500).json({ error: "Failed to load community circles" });
  }
});

router.post("/circles", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const { name, type, privacy, description, emoji, maxMembers, city, state, planningMode } =
    req.body as Record<string, unknown>;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "Circle name is required (min 2 chars)" }); return;
  }
  try {
    // Enforce tier-based circle creation limits
    const user = await storage.getUser(uid(req)).catch(() => null);
    const tierKey = getTierKey(user?.memberType);
    const limits = CIRCLE_LIMITS[tierKey];
    const circleType = String(type ?? "private");

    // Free users cannot create any type of circle
    if (tierKey === "free") {
      res.status(403).json({
        error: "Creating Kinfolk Circles requires an Explorer+ or higher membership.",
        code: "TIER_LIMIT_REACHED",
        upgradeRequired: true,
        tier: tierKey,
      });
      return;
    }

    if (circleType === "community" && limits.maxCommunityMembers === 0) {
      res.status(403).json({
        error: "Community circles require a Navigator or Trailblazer membership.",
        code: "TIER_LIMIT_REACHED",
        upgradeRequired: true,
        tier: tierKey,
      });
      return;
    }

    if (isFinite(limits.maxCircles)) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(kinfolkCircles).where(eq(kinfolkCircles.hostUserId, uid(req)));
      if (count >= limits.maxCircles) {
        res.status(403).json({
          error: `Explorer+ members can host up to ${limits.maxCircles} circle${limits.maxCircles === 1 ? "" : "s"}. Upgrade to Navigator for unlimited circles.`,
          code: "TIER_LIMIT_REACHED",
          upgradeRequired: true,
          tier: tierKey,
          limit: limits.maxCircles,
          current: count,
        });
        return;
      }
    }

    const defaultMax = circleType === "community" ? limits.maxCommunityMembers : limits.maxPrivateMembers;

    const [circle] = await db.insert(kinfolkCircles).values({
      name: String(name).trim(),
      type: circleType,
      privacy: String(privacy ?? "invite_only"),
      hostUserId: uid(req),
      description: description ? String(description).trim() : null,
      emoji: emoji ? String(emoji) : "✨",
      maxMembers: typeof maxMembers === "number" ? Math.max(1, Math.min(Math.floor(maxMembers), defaultMax, 8)) : Math.min(defaultMax, 8),
      city: city ? String(city) : null,
      state: state ? String(state) : null,
      planningMode: String(planningMode ?? "open"),
    }).returning();
    await db.insert(circleMembers).values({ circleId: circle.id, userId: uid(req), role: "host" });
    res.status(201).json({ circle, tier: tierKey, limits });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles error");
    res.status(500).json({ error: "Failed to create circle" });
  }
});

// Return the requesting user's saved businesses — used by members for quick-suggest
router.get("/circles/:id/saved-places", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const saved = await db
      .select({
        businessId: savedPlacesTable.businessId,
        businessName: businessesTable.name,
        category: businessesTable.category,
        savedAt: savedPlacesTable.createdAt,
      })
      .from(savedPlacesTable)
      .leftJoin(businessesTable, eq(savedPlacesTable.businessId, businessesTable.id))
      .where(eq(savedPlacesTable.userId, uid(req)))
      .orderBy(desc(savedPlacesTable.createdAt))
      .limit(50);
    res.json({ savedPlaces: saved });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/saved-places error");
    res.status(500).json({ error: "Failed to load saved places" });
  }
});

router.get("/circles/:id", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result) return;
    const { circle, membership } = result;
    if (!membership) {
      res.status(403).json({ error: "Not a member of this circle" }); return;
    }
    const members = await db.select({ id: circleMembers.id, userId: circleMembers.userId, role: circleMembers.role, joinedAt: circleMembers.joinedAt })
      .from(circleMembers).where(eq(circleMembers.circleId, circleId));
    const suggestions = await db.select().from(circleSuggestions)
      .where(eq(circleSuggestions.circleId, circleId)).orderBy(desc(circleSuggestions.upvotes), desc(circleSuggestions.createdAt)).limit(30);
    const plans = await db.select().from(circlePlans)
      .where(eq(circlePlans.circleId, circleId)).orderBy(desc(circlePlans.createdAt)).limit(10);
    res.json({ circle, membership, members, suggestions, plans });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id error");
    res.status(500).json({ error: "Failed to load circle" });
  }
});

router.patch("/circles/:id", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const [circle] = await db.select().from(kinfolkCircles).where(eq(kinfolkCircles.id, circleId)).limit(1);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.hostUserId !== uid(req)) { res.status(403).json({ error: "Only the Circle Host can edit settings" }); return; }
    const { name, description, emoji, privacy, planningMode, maxMembers, city, state } = req.body as Record<string, unknown>;
    const updates: Partial<typeof kinfolkCircles.$inferInsert> = { updatedAt: new Date() };
    if (typeof name === "string") updates.name = name.trim();
    if (typeof description === "string") updates.description = description.trim() || null;
    if (typeof emoji === "string") updates.emoji = emoji;
    if (typeof privacy === "string") updates.privacy = privacy;
    if (typeof planningMode === "string") updates.planningMode = planningMode;
    if (typeof maxMembers === "number") updates.maxMembers = Math.max(1, Math.min(Math.floor(maxMembers), 8));
    if (typeof city === "string") updates.city = city || null;
    if (typeof state === "string") updates.state = state || null;
    const [updated] = await db.update(kinfolkCircles).set(updates).where(eq(kinfolkCircles.id, circleId)).returning();
    res.json({ circle: updated });
  } catch (err) {
    (req as any).log.error({ err }, "PATCH /circles/:id error");
    res.status(500).json({ error: "Failed to update circle" });
  }
});

router.delete("/circles/:id", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const [circle] = await db.select().from(kinfolkCircles).where(eq(kinfolkCircles.id, circleId)).limit(1);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.hostUserId !== uid(req)) { res.status(403).json({ error: "Only the Circle Host can delete this circle" }); return; }
    await db.delete(kinfolkCircles).where(eq(kinfolkCircles.id, circleId));
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "DELETE /circles/:id error");
    res.status(500).json({ error: "Failed to delete circle" });
  }
});

router.post("/circles/:id/join", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const [circle] = await db.select().from(kinfolkCircles).where(eq(kinfolkCircles.id, circleId)).limit(1);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.privacy === "invite_only") { res.status(403).json({ error: "This circle is invite-only" }); return; }
    const joinResult = await addCircleMemberWithinCap(circleId, uid(req));
    if (joinResult.status === "missing") { res.status(404).json({ error: "Circle not found" }); return; }
    if (joinResult.status === "already_member") { res.status(409).json({ error: "Already a member" }); return; }
    if (joinResult.status === "full") { res.status(409).json({ error: "Circle is full" }); return; }
    res.json({ ok: true, member: joinResult.member });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/join error");
    res.status(500).json({ error: "Failed to join circle" });
  }
});

router.post("/circles/:id/leave", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const [circle] = await db.select().from(kinfolkCircles).where(eq(kinfolkCircles.id, circleId)).limit(1);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.hostUserId === uid(req)) { res.status(400).json({ error: "Transfer ownership before leaving" }); return; }
    await db.delete(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, uid(req))));
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/leave error");
    res.status(500).json({ error: "Failed to leave circle" });
  }
});

router.post("/circles/:id/invite", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { userId: inviteeId } = req.body as { userId?: string };
  if (!inviteeId) { res.status(400).json({ error: "userId is required" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result) return;
    if (result.circle.hostUserId !== uid(req)) { res.status(403).json({ error: "Only the Circle Host can invite members" }); return; }
    const joinResult = await addCircleMemberWithinCap(circleId, inviteeId);
    if (joinResult.status === "missing") { res.status(404).json({ error: "Circle not found" }); return; }
    if (joinResult.status === "already_member") { res.status(409).json({ error: "User is already a member" }); return; }
    if (joinResult.status === "full") { res.status(409).json({ error: "Circle is full (maximum 8 members)" }); return; }
    res.json({ ok: true, member: joinResult.member });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/invite error");
    res.status(500).json({ error: "Failed to invite member" });
  }
});

router.delete("/circles/:id/members/:userId", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const targetId = String(req.params.userId);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const [circle] = await db.select().from(kinfolkCircles).where(eq(kinfolkCircles.id, circleId)).limit(1);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.hostUserId !== uid(req) && targetId !== uid(req)) {
      res.status(403).json({ error: "Only the Circle Host can remove members" }); return;
    }
    await db.delete(circleMembers).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, targetId)));
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "DELETE /circles/:id/members/:userId error");
    res.status(500).json({ error: "Failed to remove member" });
  }
});

router.post("/circles/:id/transfer", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const { userId: newHostId } = req.body as { userId?: string };
  if (isNaN(circleId) || !newHostId) { res.status(400).json({ error: "circleId and userId required" }); return; }
  try {
    const [circle] = await db.select().from(kinfolkCircles).where(eq(kinfolkCircles.id, circleId)).limit(1);
    if (!circle) { res.status(404).json({ error: "Circle not found" }); return; }
    if (circle.hostUserId !== uid(req)) { res.status(403).json({ error: "Only the Circle Host can transfer ownership" }); return; }
    const [newHostMembership] = await db.select().from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, newHostId))).limit(1);
    if (!newHostMembership) { res.status(400).json({ error: "The new host must already be a Circle member" }); return; }
    await db.update(kinfolkCircles).set({ hostUserId: newHostId, updatedAt: new Date() }).where(eq(kinfolkCircles.id, circleId));
    await db.update(circleMembers).set({ role: "host" }).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, newHostId)));
    await db.update(circleMembers).set({ role: "member" }).where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, uid(req))));
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/transfer error");
    res.status(500).json({ error: "Failed to transfer ownership" });
  }
});

router.get("/circles/:id/suggestions", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result) return;
    if (!result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const suggestions = await db.select().from(circleSuggestions)
      .where(eq(circleSuggestions.circleId, circleId))
      .orderBy(desc(circleSuggestions.upvotes), desc(circleSuggestions.createdAt));
    res.json({ suggestions });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/suggestions error");
    res.status(500).json({ error: "Failed to load suggestions" });
  }
});

router.post("/circles/:id/suggestions", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { placeName, placeType, businessId, note } = req.body as Record<string, unknown>;
  if (!placeName || typeof placeName !== "string") { res.status(400).json({ error: "placeName is required" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result) return;
    if (!result.membership) { res.status(403).json({ error: "Not a member of this circle" }); return; }
    const [sug] = await db.insert(circleSuggestions).values({
      circleId,
      userId: uid(req),
      placeName: String(placeName).trim(),
      placeType: String(placeType ?? "activity"),
      businessId: businessId ? String(businessId) : null,
      note: note ? String(note).trim() : null,
    }).returning();
    res.status(201).json({ suggestion: sug });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/suggestions error");
    res.status(500).json({ error: "Failed to add suggestion" });
  }
});

router.post("/circles/:id/suggestions/:sugId/upvote", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const sugId = parseInt(req.params.sugId as string);
  if (isNaN(circleId) || isNaN(sugId)) { res.status(400).json({ error: "Invalid ids" }); return; }
  try {
    await db.update(circleSuggestions)
      .set({ upvotes: sql`${circleSuggestions.upvotes} + 1` })
      .where(and(eq(circleSuggestions.id, sugId), eq(circleSuggestions.circleId, circleId)));
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/suggestions/:sugId/upvote error");
    res.status(500).json({ error: "Failed to upvote" });
  }
});

router.delete("/circles/:id/suggestions/:sugId", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const sugId = parseInt(req.params.sugId as string);
  if (isNaN(circleId) || isNaN(sugId)) { res.status(400).json({ error: "Invalid ids" }); return; }
  try {
    const [sug] = await db.select().from(circleSuggestions).where(eq(circleSuggestions.id, sugId)).limit(1);
    if (!sug || sug.circleId !== circleId) { res.status(404).json({ error: "Suggestion not found" }); return; }
    if (sug.userId !== uid(req)) { res.status(403).json({ error: "Only the suggester can remove it" }); return; }
    await db.delete(circleSuggestions).where(eq(circleSuggestions.id, sugId));
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "DELETE /circles/:id/suggestions/:sugId error");
    res.status(500).json({ error: "Failed to delete suggestion" });
  }
});

type MemberPrefsContext = {
  favoriteCategories?: string[];
  budgetRange?: string;
  tripStyle?: string[];
  dietaryNotes?: string | null;
  lifestyleServices?: string[];
  travelCompanion?: string;
};

async function generateItinerary(
  circleName: string,
  vibe: string,
  budget: string,
  availability: string[],
  suggestions: { placeName: string; placeType: string; note?: string | null }[],
  city?: string | null,
  curatorMode?: string,
  memberPrefs?: MemberPrefsContext | null,
): Promise<CircleItinerary> {
  const suggestionList = suggestions.map((s) => `- ${s.placeName} (${s.placeType})${s.note ? ": " + s.note : ""}`).join("\n");
  const cityNote = city ? `in or near ${city}` : "";
  const budgetNote = budget === "unlimited" ? "No budget constraints" : `Budget ~$${budget} per person`;
  const availNote = availability.length ? availability.join(", ") : "flexible timing";

  // Build member prefs section when planning by a member's taste
  const memberPrefsSection = memberPrefs && curatorMode === "by_member"
    ? `\nPLANNING BY A MEMBER'S PERSONAL TASTE — let their preferences guide every stop:
- Favorite categories: ${memberPrefs.favoriteCategories?.join(", ") || "anything"}
- Budget vibe: ${memberPrefs.budgetRange || "flexible"}
- Trip style: ${memberPrefs.tripStyle?.join(", ") || "open"}
- Dietary notes: ${memberPrefs.dietaryNotes || "none"}
- Lifestyle services they love: ${memberPrefs.lifestyleServices?.join(", ") || "none specified"}
Make this feel like it was planned specifically for this person. Every stop should reflect their taste.`
    : "";

  const modeInstruction = curatorMode === "random"
    ? "SURPRISE MODE: Ignore member suggestions. Be creative and spontaneous — pick something the group would never plan themselves but will love. Make it memorable."
    : curatorMode === "by_member"
    ? "BY-MEMBER MODE: Use the member's personal preferences (above) as your primary guide. Only incorporate circle suggestions if they fit the member's taste."
    : "VOTES MODE: Incorporate the top-voted member suggestions as the backbone of the plan. Build the day around what the circle actually wants.";

  const prompt = `You are Kinfolk, a culturally-intelligent AI planning assistant built for Black communities.
Build a perfect day itinerary for a circle called "${circleName}" ${cityNote}.

Vibe: ${vibe}
${budgetNote}
Availability: ${availNote}
${memberPrefsSection}

${modeInstruction}

Member circle suggestions:
${suggestionList || "No specific suggestions."}

PRIVACY REMINDER: Only shared data is referenced. Never expose personal info beyond what's provided above.

Return ONLY valid JSON in this exact shape:
{
  "vibe": "${vibe}",
  "summary": "2-sentence warm summary of the day",
  "stops": [
    { "time": "10:00 AM", "title": "Place Name", "type": "coffee", "address": "optional address", "note": "why this fits the vibe" }
  ],
  "kinfolkNote": "One warm, culturally-resonant closing line from Kinfolk"
}

Include 5–8 stops that flow naturally. Keep times realistic. Prioritize minority-owned businesses and spaces that celebrate melanated culture when possible.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: curatorMode === "random" ? 1.0 : 0.8,
    max_tokens: 1400,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as CircleItinerary;
}

router.post("/circles/:id/plans", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { title, planDate, vibe, budget, availabilityWindows, surpriseMe, curatorMode, curatorMemberId } = req.body as Record<string, unknown>;
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result) return;
    if (!result.membership) { res.status(403).json({ error: "Not a member of this circle" }); return; }
    const { circle } = result;

    // Resolve the effective curator mode (surpriseMe is legacy alias for "random")
    const resolvedCuratorMode: string = surpriseMe ? "random" : (typeof curatorMode === "string" ? curatorMode : "votes");

    const suggestions = await db.select().from(circleSuggestions)
      .where(eq(circleSuggestions.circleId, circleId)).orderBy(desc(circleSuggestions.upvotes)).limit(20);

    // Fetch member prefs when planning by a specific member's taste
    let memberPrefs: MemberPrefsContext | null = null;
    if (resolvedCuratorMode === "by_member" && typeof curatorMemberId === "string" && curatorMemberId) {
      const [prefs] = await db.select().from(userPreferencesTable)
        .where(eq(userPreferencesTable.userId, curatorMemberId)).limit(1);
      if (prefs) {
        memberPrefs = {
          favoriteCategories: prefs.favoriteCategories as string[] | undefined,
          budgetRange: prefs.budgetRange ?? undefined,
          tripStyle: prefs.tripStyle as string[] | undefined,
          dietaryNotes: prefs.dietaryNotes,
          lifestyleServices: (prefs.lifestyleServices as string[] | undefined),
          travelCompanion: prefs.travelCompanion ?? undefined,
        };
      }
    }

    const RANDOM_VIBES = ["Foodie", "Arts & Culture", "Outdoors", "Date Night", "Adventure", "Relax", "Live Music", "Culture & History", "Nightlife", "Family"];
    const resolvedVibe = resolvedCuratorMode === "random"
      ? RANDOM_VIBES[Math.floor(Math.random() * RANDOM_VIBES.length)]
      : (memberPrefs ? (memberPrefs.favoriteCategories?.[0] ?? String(vibe ?? "Foodie")) : String(vibe ?? "Foodie"));

    const modeLabel: Record<string, string> = {
      random: "🎲 Surprise",
      by_member: "👤 Member's Taste",
      votes: "🗳 Circle Votes",
    };
    const resolvedTitle = resolvedCuratorMode === "random"
      ? `${circle.emoji} Surprise Day — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : typeof title === "string" && title ? title : `${resolvedVibe} Day`;

    let itinerary: CircleItinerary;
    try {
      itinerary = await generateItinerary(
        circle.name,
        resolvedVibe,
        String(budget ?? "50"),
        Array.isArray(availabilityWindows) ? (availabilityWindows as string[]) : [],
        suggestions,
        circle.city,
        resolvedCuratorMode,
        memberPrefs,
      );
    } catch {
      itinerary = {
        vibe: resolvedVibe,
        summary: `A curated ${resolvedVibe.toLowerCase()} day for ${circle.name}. Your suggestions have been woven into the perfect plan.`,
        stops: suggestions.slice(0, 5).map((s, i) => ({
          time: `${10 + i * 2}:00 ${10 + i * 2 < 12 ? "AM" : "PM"}`,
          title: s.placeName,
          type: s.placeType,
          note: s.note ?? `A great pick from your circle`,
        })),
        kinfolkNote: "Your circle knows how to pick 'em. Enjoy every moment together. ✊🏾",
      };
    }

    const [plan] = await db.insert(circlePlans).values({
      circleId,
      createdBy: uid(req),
      title: resolvedTitle,
      planDate: planDate ? String(planDate) : null,
      vibe: resolvedVibe,
      budget: String(budget ?? "50"),
      availabilityWindows: Array.isArray(availabilityWindows) ? availabilityWindows : [],
      itinerary,
      status: "draft",
      curatorMode: resolvedCuratorMode,
      curatorMemberId: typeof curatorMemberId === "string" && curatorMemberId ? curatorMemberId : null,
    }).returning();

    await db.update(kinfolkCircles).set({ updatedAt: new Date() }).where(eq(kinfolkCircles.id, circleId));
    res.status(201).json({ plan });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/plans error");
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

router.get("/circles/:id/plans", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result) return;
    if (!result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const plans = await db.select().from(circlePlans)
      .where(eq(circlePlans.circleId, circleId)).orderBy(desc(circlePlans.createdAt));
    res.json({ plans });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/plans error");
    res.status(500).json({ error: "Failed to load plans" });
  }
});

router.post("/circles/:id/plans/:planId/vote", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const planId = parseInt(req.params.planId as string);
  const { vote } = req.body as { vote?: string };
  if (isNaN(circleId) || isNaN(planId)) { res.status(400).json({ error: "Invalid ids" }); return; }
  if (!vote || !["in", "maybe", "out"].includes(vote)) {
    res.status(400).json({ error: "vote must be 'in', 'maybe', or 'out'" }); return;
  }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }

    const [existing] = await db.select().from(circleVotes)
      .where(and(eq(circleVotes.planId, planId), eq(circleVotes.userId, uid(req)))).limit(1);

    if (existing) {
      const old = existing.vote;
      await db.update(circleVotes).set({ vote }).where(eq(circleVotes.id, existing.id));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dec = (col: any) => sql`GREATEST(0, ${col} - 1)`;
      const updates: Partial<typeof circlePlans.$inferInsert> = {};
      if (old === "in") updates.inCount = dec(circlePlans.inCount) as any;
      if (old === "maybe") updates.maybeCount = dec(circlePlans.maybeCount) as any;
      if (old === "out") updates.outCount = dec(circlePlans.outCount) as any;
      if (vote === "in") updates.inCount = sql`${circlePlans.inCount} + 1` as any;
      if (vote === "maybe") updates.maybeCount = sql`${circlePlans.maybeCount} + 1` as any;
      if (vote === "out") updates.outCount = sql`${circlePlans.outCount} + 1` as any;
      await db.update(circlePlans).set(updates).where(eq(circlePlans.id, planId));
    } else {
      await db.insert(circleVotes).values({ planId, userId: uid(req), vote });
      const inc: Partial<typeof circlePlans.$inferInsert> = {};
      if (vote === "in") inc.inCount = sql`${circlePlans.inCount} + 1` as any;
      if (vote === "maybe") inc.maybeCount = sql`${circlePlans.maybeCount} + 1` as any;
      if (vote === "out") inc.outCount = sql`${circlePlans.outCount} + 1` as any;
      await db.update(circlePlans).set(inc).where(eq(circlePlans.id, planId));
    }

    const [updated] = await db.select().from(circlePlans).where(eq(circlePlans.id, planId)).limit(1);
    res.json({ plan: updated, myVote: vote });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/plans/:planId/vote error");
    res.status(500).json({ error: "Failed to vote" });
  }
});

router.get("/circles/:id/adventures", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const adventures = await db.select().from(circleAdventures)
      .where(eq(circleAdventures.circleId, circleId)).orderBy(desc(circleAdventures.adventureDate));
    res.json({ adventures });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/adventures error");
    res.status(500).json({ error: "Failed to load adventures" });
  }
});

router.post("/circles/:id/adventures", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const { title, adventureDate, places, note } = req.body as Record<string, unknown>;
  if (isNaN(circleId) || !title || !adventureDate) {
    res.status(400).json({ error: "title and adventureDate are required" }); return;
  }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const [adventure] = await db.insert(circleAdventures).values({
      circleId,
      title: String(title).trim(),
      adventureDate: String(adventureDate),
      places: Array.isArray(places) ? places : [],
      note: note ? String(note).trim() : null,
    }).returning();
    res.status(201).json({ adventure });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/adventures error");
    res.status(500).json({ error: "Failed to log adventure" });
  }
});

// ── NUDGES ──────────────────────────────────────────────────────────────────

router.get("/circles/:id/nudges", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const nudges = await db.select().from(circleNudges)
      .where(eq(circleNudges.circleId, circleId))
      .orderBy(desc(circleNudges.createdAt))
      .limit(30);
    res.json({ nudges });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/nudges error");
    res.status(500).json({ error: "Failed to load nudges" });
  }
});

router.post("/circles/:id/nudges", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { nudgeType, targetMemberId, businessId, businessName, suggestionId, message, senderName } = req.body as Record<string, unknown>;
  if (!nudgeType) { res.status(400).json({ error: "nudgeType is required" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const [nudge] = await db.insert(circleNudges).values({
      circleId,
      senderId: uid(req),
      senderName: senderName ? String(senderName) : null,
      targetMemberId: targetMemberId ? String(targetMemberId) : null,
      nudgeType: String(nudgeType),
      businessId: businessId ? String(businessId) : null,
      businessName: businessName ? String(businessName) : null,
      suggestionId: suggestionId ? Number(suggestionId) : null,
      message: message ? String(message).trim() : null,
      readByUserIds: [uid(req)],
    }).returning();

    // Push to targeted or all members (excluding sender)
    const allMembers = await db.select({ userId: circleMembers.userId }).from(circleMembers)
      .where(eq(circleMembers.circleId, circleId));
    const targets = targetMemberId
      ? allMembers.filter((m) => m.userId === String(targetMemberId) && m.userId !== uid(req))
      : allMembers.filter((m) => m.userId !== uid(req));

    const nudgeLabels: Record<string, string> = {
      check_this_out: "Check This Out!",
      dinner_vote: "Decide on Dinner",
      lets_go: "Let's Go Now!",
      plan_it: "Plan This",
      just_a_thought: "Just a Thought",
    };
    const titleLabel = nudgeLabels[String(nudgeType)] ?? "New Nudge";
    const pushBody = businessName
      ? `${senderName ?? "A circle member"} nudged: ${String(businessName)}${message ? ` — ${String(message)}` : ""}`
      : message ? String(message) : `${senderName ?? "A circle member"} sent a nudge to the circle`;

    for (const member of targets) {
      sendPushToUser(member.userId, { title: titleLabel, body: pushBody });
    }

    res.status(201).json({ nudge });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/nudges error");
    res.status(500).json({ error: "Failed to send nudge" });
  }
});

router.patch("/circles/:id/nudges/:nudgeId/read", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const nudgeId = parseInt(req.params.nudgeId as string);
  if (isNaN(circleId) || isNaN(nudgeId)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const [existing] = await db.select().from(circleNudges)
      .where(and(eq(circleNudges.id, nudgeId), eq(circleNudges.circleId, circleId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Nudge not found" }); return; }
    const alreadyRead = existing.readByUserIds?.includes(uid(req));
    if (!alreadyRead) {
      const updated = [...(existing.readByUserIds ?? []), uid(req)];
      await db.update(circleNudges).set({ readByUserIds: updated }).where(eq(circleNudges.id, nudgeId));
    }
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "PATCH /circles/:id/nudges/:nudgeId/read error");
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// ── IMPORTANT DATES ───────────────────────────────────────────────────────────

router.get("/circles/:id/dates", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const dates = await db.select().from(circleImportantDates)
      .where(eq(circleImportantDates.circleId, circleId))
      .orderBy(circleImportantDates.targetDate);

    // Generate contextual AI nudge messages for upcoming dates (template-based, no LLM cost)
    const today = new Date();
    const upcomingNudges = dates.flatMap((d) => {
      const target = new Date(d.targetDate);
      const msPerDay = 86400000;
      let daysDiff = Math.round((target.getTime() - today.getTime()) / msPerDay);
      if (d.isRecurring) {
        // For recurring dates, find the next occurrence (same month/day this year or next)
        const thisYear = new Date(today.getFullYear(), target.getMonth(), target.getDate());
        const nextYear = new Date(today.getFullYear() + 1, target.getMonth(), target.getDate());
        daysDiff = thisYear > today
          ? Math.round((thisYear.getTime() - today.getTime()) / msPerDay)
          : Math.round((nextYear.getTime() - today.getTime()) / msPerDay);
      }
      if (daysDiff < 0 || daysDiff > 60) return [];
      const who = d.targetUserName ?? d.title;
      let nudgeText = "";
      if (d.dateType === "birthday") {
        if (daysDiff === 0) nudgeText = `Today is ${who}! Has your circle celebrated yet?`;
        else if (daysDiff <= 3) nudgeText = `${who} is in ${daysDiff} day${daysDiff === 1 ? "" : "s"} — time to finalize plans!`;
        else if (daysDiff <= 14) nudgeText = `${who} is coming up in ${daysDiff} days — what's the plan?`;
        else nudgeText = `${who} is next month — have you started planning?`;
      } else if (d.dateType === "anniversary") {
        if (daysDiff === 0) nudgeText = `Today is your anniversary! What are you doing to celebrate?`;
        else if (daysDiff <= 7) nudgeText = `Your anniversary is ${daysDiff === 1 ? "tomorrow" : `in ${daysDiff} days`} — what's the budget?`;
        else nudgeText = `Your anniversary is coming up in ${daysDiff} days — time to start planning something special.`;
      } else if (d.dateType === "trip") {
        if (daysDiff <= 3) nudgeText = `${d.title} is in ${daysDiff} day${daysDiff === 1 ? "" : "s"} — is everyone ready?`;
        else if (daysDiff <= 14) nudgeText = `${d.title} is ${daysDiff} days away — any last-minute plans?`;
        else nudgeText = `${d.title} is coming up — has your circle sorted the details?`;
      } else {
        if (daysDiff <= 7) nudgeText = `${d.title} is ${daysDiff === 0 ? "today" : daysDiff === 1 ? "tomorrow" : `in ${daysDiff} days`}!`;
        else nudgeText = `${d.title} is coming up in ${daysDiff} days — has your circle made plans?`;
      }
      return [{ dateId: d.id, title: d.title, dateType: d.dateType, daysDiff, nudgeText }];
    });

    res.json({ dates, upcomingNudges });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/dates error");
    res.status(500).json({ error: "Failed to load dates" });
  }
});

router.post("/circles/:id/dates", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { title, dateType, targetDate, targetUserId, targetUserName, notes, isRecurring } = req.body as Record<string, unknown>;
  if (!title || !targetDate) { res.status(400).json({ error: "title and targetDate are required" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const [date] = await db.insert(circleImportantDates).values({
      circleId,
      addedByUserId: uid(req),
      title: String(title).trim(),
      dateType: dateType ? String(dateType) : "event",
      targetDate: String(targetDate),
      targetUserId: targetUserId ? String(targetUserId) : null,
      targetUserName: targetUserName ? String(targetUserName) : null,
      notes: notes ? String(notes).trim() : null,
      isRecurring: Boolean(isRecurring),
    }).returning();
    res.status(201).json({ date });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/dates error");
    res.status(500).json({ error: "Failed to add date" });
  }
});

router.delete("/circles/:id/dates/:dateId", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const dateId = parseInt(req.params.dateId as string);
  if (isNaN(circleId) || isNaN(dateId)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const [existing] = await db.select().from(circleImportantDates)
      .where(and(eq(circleImportantDates.id, dateId), eq(circleImportantDates.circleId, circleId))).limit(1);
    if (!existing) { res.status(404).json({ error: "Date not found" }); return; }
    if (existing.addedByUserId !== uid(req) && result.circle.hostUserId !== uid(req)) {
      res.status(403).json({ error: "Only the person who added this date or the host can remove it" }); return;
    }
    await db.delete(circleImportantDates).where(eq(circleImportantDates.id, dateId));
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "DELETE /circles/:id/dates/:dateId error");
    res.status(500).json({ error: "Failed to delete date" });
  }
});

// ── Circle Saves — shared wishlist for the Circle ────────────────────────────

router.get("/circles/:id/saves", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const { rows } = await pool.query(
      `SELECT cs.*, u.first_name, u.last_name
       FROM circle_saves cs
       JOIN users u ON u.id = cs.saved_by
       WHERE cs.circle_id = $1
       ORDER BY cs.saved_at DESC`,
      [circleId],
    );
    res.json({ saves: rows });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/saves error");
    res.status(500).json({ error: "Failed to load circle saves" });
  }
});

router.post("/circles/:id/saves", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { saveType, referenceId, referenceName, notes } = req.body as Record<string, unknown>;
  if (!referenceName) { res.status(400).json({ error: "referenceName is required" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const { rows } = await pool.query(
      `INSERT INTO circle_saves (circle_id, saved_by, save_type, reference_id, reference_name, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [circleId, uid(req), saveType ?? "destination", referenceId ?? null,
       String(referenceName).trim(), notes ? String(notes).trim() : null],
    );
    res.status(201).json({ save: rows[0] });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/saves error");
    res.status(500).json({ error: "Failed to add save" });
  }
});

router.delete("/circles/:id/saves/:saveId", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  const saveId = parseInt(req.params.saveId as string);
  if (isNaN(circleId) || isNaN(saveId)) { res.status(400).json({ error: "Invalid id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const existing = await pool.query(`SELECT saved_by FROM circle_saves WHERE id = $1 AND circle_id = $2`, [saveId, circleId]);
    if (existing.rows.length === 0) { res.status(404).json({ error: "Save not found" }); return; }
    if ((existing.rows[0] as { saved_by: string }).saved_by !== uid(req) && result.circle.hostUserId !== uid(req)) {
      res.status(403).json({ error: "Only the person who saved this or the host can remove it" }); return;
    }
    await pool.query(`DELETE FROM circle_saves WHERE id = $1`, [saveId]);
    res.json({ ok: true });
  } catch (err) {
    (req as any).log.error({ err }, "DELETE /circles/:id/saves/:saveId error");
    res.status(500).json({ error: "Failed to remove save" });
  }
});

// ── Circle Itineraries — KinfolkAI-generated spine + branch travel plans ─────

router.get("/circles/:id/itineraries", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const { rows } = await pool.query(
      `SELECT * FROM circle_itineraries WHERE circle_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [circleId],
    );
    res.json({ itineraries: rows });
  } catch (err) {
    (req as any).log.error({ err }, "GET /circles/:id/itineraries error");
    res.status(500).json({ error: "Failed to load itineraries" });
  }
});

router.post("/circles/:id/itineraries", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { destination, startDate, endDate, title } = req.body as Record<string, unknown>;
  if (!destination) { res.status(400).json({ error: "destination is required" }); return; }
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result || !result.membership) { res.status(403).json({ error: "Not a member" }); return; }

    // Gather member profiles, shared saves, and upcoming dates in parallel
    const [membersRes, savesRes, datesRes] = await Promise.all([
      pool.query(
        `SELECT u.id, u.first_name, u.last_name, up.favorite_categories, up.dietary_notes, up.lifestyle_services
         FROM circle_members cm
         JOIN users u ON u.id = cm.user_id
         LEFT JOIN user_preferences up ON up.user_id = cm.user_id
         WHERE cm.circle_id = $1`,
        [circleId],
      ),
      pool.query(`SELECT reference_name, save_type, notes FROM circle_saves WHERE circle_id = $1 ORDER BY saved_at DESC`, [circleId]),
      pool.query(`SELECT title, target_date FROM circle_important_dates WHERE circle_id = $1 ORDER BY target_date ASC`, [circleId]),
    ]);

    const memberProfiles = (membersRes.rows as any[]).map((m) => ({
      name: `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "Member",
      categories: m.favorite_categories ?? [],
      dietary: m.dietary_notes ?? null,
    }));

    const systemPrompt = `You are KinfolkAI™ — the world's best travel planner for the Black community. You are planning a Circle trip itinerary.

THE CIRCLE — "${result.circle.name}":
${memberProfiles.map((m, i) => `${i + 1}. ${m.name}${m.categories?.length ? ` — interests: ${(m.categories as string[]).join(", ")}` : ""}${m.dietary ? ` — dietary: ${m.dietary}` : ""}`).join("\n")}

SHARED SAVES (what the Circle wants to experience):
${savesRes.rows.length ? (savesRes.rows as any[]).map((s) => `- ${s.reference_name}${s.notes ? ` (note: ${s.notes})` : ""}`).join("\n") : "No shared saves yet"}

IMPORTANT DATES:
${datesRes.rows.length ? (datesRes.rows as any[]).map((d) => `- ${d.title}: ${d.target_date}`).join("\n") : "None"}

ITINERARY ENGINE RULES:
1. SPINE: Shared moments everyone experiences together (arrivals, group meals, key experiences)
2. BRANCHES: Individual tracks off the spine — each person's solo interests during the hours between shared moments
3. Reconnect every branch at the next spine moment
4. LEGOLAND RULE: Never return zero results. If something doesn't exist locally, find the closest equivalent and explain why it works.
5. Prioritize Black-owned and minority-owned businesses for every recommendation.
6. Name each person individually in their branch. Make the itinerary feel personal.

DESTINATION: ${String(destination).trim()}${startDate ? ` | FROM: ${startDate}` : ""}${endDate ? ` | TO: ${endDate}` : ""}

Return ONLY valid JSON with this structure:
{"title":"itinerary title","spine":[{"time":"Day 1 Morning","activity":"...","description":"...","businessName":"...","notes":"..."}],"branches":{"[Member Name]":[{"time":"Day 1 Afternoon","activity":"...","description":"...","businessName":"..."}]},"groupMeals":[{"time":"...","restaurant":"...","description":"..."}],"kinfolkNotes":"1-2 sentence personal insight from Kinfolk about why this itinerary works for this specific Circle"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Plan a complete itinerary for our Circle trip to ${String(destination).trim()}.${startDate ? ` We travel from ${startDate}${endDate ? ` to ${endDate}` : ""}.` : ""}` },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    let plan: Record<string, unknown> = {};
    try { plan = JSON.parse(completion.choices[0]?.message?.content ?? "{}"); } catch { /* use empty */ }

    const itineraryTitle = title ? String(title).trim() : ((plan.title as string) ?? `${String(destination).trim()} Trip`);
    const { rows } = await pool.query(
      `INSERT INTO circle_itineraries
         (circle_id, created_by, title, destination, start_date, end_date, shared_plan, individual_plans)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb)
       RETURNING *`,
      [circleId, uid(req), itineraryTitle, String(destination).trim(),
       startDate ?? null, endDate ?? null,
       JSON.stringify({ spine: plan.spine ?? [], groupMeals: plan.groupMeals ?? [], kinfolkNotes: plan.kinfolkNotes ?? "" }),
       JSON.stringify(plan.branches ?? {})],
    );

    res.status(201).json({ itinerary: rows[0], plan });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles/:id/itineraries error");
    res.status(500).json({ error: "Failed to generate itinerary" });
  }
});

export default router;
