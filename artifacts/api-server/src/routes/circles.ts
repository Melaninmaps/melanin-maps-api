import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  kinfolkCircles,
  circleMembers,
  circleSuggestions,
  circlePlans,
  circleVotes,
  circleAdventures,
  type CircleItinerary,
} from "@workspace/db/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";

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
  try {
    const circles = await db.select().from(kinfolkCircles)
      .where(and(eq(kinfolkCircles.type, "community"), eq(kinfolkCircles.privacy, "public")))
      .orderBy(desc(kinfolkCircles.createdAt)).limit(30);
    res.json({ circles });
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
    const [circle] = await db.insert(kinfolkCircles).values({
      name: String(name).trim(),
      type: String(type ?? "private"),
      privacy: String(privacy ?? "invite_only"),
      hostUserId: uid(req),
      description: description ? String(description).trim() : null,
      emoji: emoji ? String(emoji) : "✨",
      maxMembers: typeof maxMembers === "number" ? maxMembers : (type === "community" ? 50 : 8),
      city: city ? String(city) : null,
      state: state ? String(state) : null,
      planningMode: String(planningMode ?? "open"),
    }).returning();
    await db.insert(circleMembers).values({ circleId: circle.id, userId: uid(req), role: "host" });
    res.status(201).json({ circle });
  } catch (err) {
    (req as any).log.error({ err }, "POST /circles error");
    res.status(500).json({ error: "Failed to create circle" });
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
    if (!membership && circle.privacy !== "public") {
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
    if (typeof maxMembers === "number") updates.maxMembers = maxMembers;
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
    const [existing] = await db.select().from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, uid(req)))).limit(1);
    if (existing) { res.status(409).json({ error: "Already a member" }); return; }
    const memberCount = await db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(circleMembers).where(eq(circleMembers.circleId, circleId));
    if ((memberCount[0]?.count ?? 0) >= circle.maxMembers) { res.status(409).json({ error: "Circle is full" }); return; }
    await db.insert(circleMembers).values({ circleId, userId: uid(req), role: "member" });
    res.json({ ok: true });
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
    if (!result.membership) { res.status(403).json({ error: "Not a member" }); return; }
    const [existing] = await db.select().from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, inviteeId))).limit(1);
    if (existing) { res.status(409).json({ error: "User is already a member" }); return; }
    await db.insert(circleMembers).values({ circleId, userId: inviteeId, role: "member" });
    res.json({ ok: true });
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

async function generateItinerary(
  circleName: string,
  vibe: string,
  budget: string,
  availability: string[],
  suggestions: { placeName: string; placeType: string; note?: string | null }[],
  city?: string | null,
): Promise<CircleItinerary> {
  const suggestionList = suggestions.map((s) => `- ${s.placeName} (${s.placeType})${s.note ? ": " + s.note : ""}`).join("\n");
  const budgetNote = budget === "unlimited" ? "No budget constraints" : `Budget ~$${budget} per person`;
  const availNote = availability.length ? availability.join(", ") : "flexible timing";
  const cityNote = city ? `in or near ${city}` : "";

  const prompt = `You are Kinfolk, a culturally-intelligent AI planning assistant for Black communities.
Build a perfect day itinerary for a circle called "${circleName}" ${cityNote}.

Vibe: ${vibe}
${budgetNote}
Availability: ${availNote}

Member suggestions to incorporate:
${suggestionList || "No specific suggestions — surprise them!"}

PRIVACY REMINDER: Only shared locations and suggestions are included. Never reference personal data.

Return ONLY valid JSON in this exact shape:
{
  "vibe": "${vibe}",
  "summary": "2-sentence warm summary of the day",
  "stops": [
    { "time": "10:00 AM", "title": "Place Name", "type": "coffee", "address": "optional address", "note": "why this fits the vibe" }
  ],
  "kinfolkNote": "One warm, culturally-resonant closing line from Kinfolk"
}

Include 5–8 stops that flow naturally. Keep times realistic. Incorporate member suggestions when they fit.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 1200,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as CircleItinerary;
}

router.post("/circles/:id/plans", async (req: Request, res: Response) => {
  if (!authed(req, res)) return;
  const circleId = parseInt(req.params.id as string);
  if (isNaN(circleId)) { res.status(400).json({ error: "Invalid circle id" }); return; }
  const { title, planDate, vibe, budget, availabilityWindows, surpriseMe } = req.body as Record<string, unknown>;
  try {
    const result = await getCircleWithAuth(circleId, uid(req), res);
    if (!result) return;
    if (!result.membership) { res.status(403).json({ error: "Not a member of this circle" }); return; }
    const { circle } = result;

    const suggestions = await db.select().from(circleSuggestions)
      .where(eq(circleSuggestions.circleId, circleId)).orderBy(desc(circleSuggestions.upvotes)).limit(20);

    const resolvedVibe = surpriseMe
      ? ["Foodie", "Arts & Culture", "Outdoors", "Date Night", "Adventure", "Relax", "Live Music"][Math.floor(Math.random() * 7)]
      : String(vibe ?? "Foodie");

    const resolvedTitle = surpriseMe
      ? `${circle.emoji} Surprise Day — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : String(title ?? "Circle Plan");

    let itinerary: CircleItinerary;
    try {
      itinerary = await generateItinerary(
        circle.name,
        resolvedVibe,
        String(budget ?? "50"),
        Array.isArray(availabilityWindows) ? (availabilityWindows as string[]) : [],
        suggestions,
        circle.city,
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

export default router;
