import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { groups, groupMembers, groupInvites, groupItineraries } from "@workspace/db/schema";
import { userPreferencesTable } from "@workspace/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import type { GroupItineraryContent } from "@workspace/db/schema";

const router = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

router.get("/groups", async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(groups)
      .orderBy(desc(groups.memberCount), desc(groups.createdAt));

    let memberGroupIds = new Set<number>();
    if (req.isAuthenticated()) {
      const memberships = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.userId, req.user.id));
      memberGroupIds = new Set(memberships.map((m) => m.groupId));
    }

    const result = rows.map((g) => ({
      ...g,
      isMember: memberGroupIds.has(g.id),
    }));

    res.json({ groups: result });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groups/my-invites", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const invites = await db
      .select({
        id: groupInvites.id,
        groupId: groupInvites.groupId,
        invitedBy: groupInvites.invitedBy,
        status: groupInvites.status,
        message: groupInvites.message,
        createdAt: groupInvites.createdAt,
        groupName: groups.name,
        groupCategory: groups.category,
        groupCity: groups.city,
        groupState: groups.state,
        groupMemberCount: groups.memberCount,
      })
      .from(groupInvites)
      .innerJoin(groups, eq(groups.id, groupInvites.groupId))
      .where(and(eq(groupInvites.invitedUserId, userId), eq(groupInvites.status, "pending")))
      .orderBy(desc(groupInvites.createdAt));

    res.json({ invites });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups/my-invites error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groups/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [group] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const members = await db
      .select({ userId: groupMembers.userId, role: groupMembers.role, joinedAt: groupMembers.joinedAt })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id))
      .limit(20);

    const isMember = req.isAuthenticated()
      ? members.some((m) => m.userId === req.user.id)
      : false;

    const isAdmin = req.isAuthenticated()
      ? members.some((m) => m.userId === req.user.id && m.role === "admin")
      : false;

    let pendingInvites: { id: number; invitedUserId: string; createdAt: Date }[] = [];
    if (isAdmin) {
      pendingInvites = await db
        .select({ id: groupInvites.id, invitedUserId: groupInvites.invitedUserId, createdAt: groupInvites.createdAt })
        .from(groupInvites)
        .where(and(eq(groupInvites.groupId, id), eq(groupInvites.status, "pending")));
    }

    res.json({ group: { ...group, isMember, isAdmin }, members, pendingInvites });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups/:id error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { name, description, category, city, state, isPrivate, maxMembers } = req.body as {
      name?: string;
      description?: string;
      category?: string;
      city?: string;
      state?: string;
      isPrivate?: boolean;
      maxMembers?: number;
    };

    if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }

    const userId = req.user!.id;
    const cap = Math.min(Math.max(Number(maxMembers) || 8, 2), 8);

    const [group] = await db
      .insert(groups)
      .values({
        name: name.trim(),
        description: description?.trim() ?? null,
        category: category ?? "general",
        city: city?.trim() ?? null,
        state: state?.trim() ?? null,
        isPrivate: isPrivate ?? false,
        createdBy: userId,
        memberCount: 1,
        maxMembers: cap,
      })
      .returning();

    await db.insert(groupMembers).values({ groupId: group.id, userId, role: "admin" });

    res.status(201).json({ group });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/:id/invite", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const [admin] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId), eq(groupMembers.role, "admin")))
      .limit(1);
    if (!admin) { res.status(403).json({ error: "Only group admins can invite members" }); return; }

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const { invitedUserId, message } = req.body as { invitedUserId?: string; message?: string };
    if (!invitedUserId?.trim()) { res.status(400).json({ error: "invitedUserId is required" }); return; }

    if (invitedUserId === userId) { res.status(400).json({ error: "Cannot invite yourself" }); return; }

    if (group.memberCount >= group.maxMembers) {
      res.status(400).json({ error: `Group is full (max ${group.maxMembers} members)` });
      return;
    }

    const [alreadyMember] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, invitedUserId)))
      .limit(1);
    if (alreadyMember) { res.status(409).json({ error: "User is already a member" }); return; }

    const [existingInvite] = await db
      .select()
      .from(groupInvites)
      .where(
        and(
          eq(groupInvites.groupId, groupId),
          eq(groupInvites.invitedUserId, invitedUserId),
          eq(groupInvites.status, "pending")
        )
      )
      .limit(1);
    if (existingInvite) { res.status(409).json({ error: "Invite already pending for this user" }); return; }

    const [invite] = await db
      .insert(groupInvites)
      .values({ groupId, invitedBy: userId, invitedUserId, message: message?.trim() ?? null })
      .returning();

    res.status(201).json({ invite });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/:id/invite error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/invites/:inviteId/respond", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const inviteId = parseInt(String(req.params.inviteId), 10);
    if (isNaN(inviteId)) { res.status(400).json({ error: "Invalid invite id" }); return; }
    const userId = req.user!.id;

    const { action } = req.body as { action?: string };
    if (action !== "accept" && action !== "decline") {
      res.status(400).json({ error: "action must be 'accept' or 'decline'" });
      return;
    }

    const [invite] = await db.select().from(groupInvites).where(eq(groupInvites.id, inviteId)).limit(1);
    if (!invite) { res.status(404).json({ error: "Invite not found" }); return; }
    if (invite.invitedUserId !== userId) { res.status(403).json({ error: "Not your invite" }); return; }
    if (invite.status !== "pending") { res.status(409).json({ error: "Invite already responded to" }); return; }

    await db
      .update(groupInvites)
      .set({ status: action === "accept" ? "accepted" : "declined", respondedAt: new Date() })
      .where(eq(groupInvites.id, inviteId));

    if (action === "accept") {
      const [group] = await db.select().from(groups).where(eq(groups.id, invite.groupId)).limit(1);
      if (!group || group.memberCount >= group.maxMembers) {
        await db.update(groupInvites).set({ status: "declined" }).where(eq(groupInvites.id, inviteId));
        res.status(409).json({ error: "Group is full" });
        return;
      }

      const [alreadyMember] = await db
        .select()
        .from(groupMembers)
        .where(and(eq(groupMembers.groupId, invite.groupId), eq(groupMembers.userId, userId)))
        .limit(1);

      if (!alreadyMember) {
        await db.insert(groupMembers).values({ groupId: invite.groupId, userId, role: "member" });
        await db
          .update(groups)
          .set({ memberCount: sql`${groups.memberCount} + 1`, updatedAt: new Date() })
          .where(eq(groups.id, invite.groupId));
      }
    }

    res.json({ responded: true, action });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/invites/:inviteId/respond error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groups/:id/itineraries", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    if (!member) { res.status(403).json({ error: "Must be a group member" }); return; }

    const items = await db
      .select()
      .from(groupItineraries)
      .where(eq(groupItineraries.groupId, groupId))
      .orderBy(desc(groupItineraries.createdAt));

    res.json({ itineraries: items });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups/:id/itineraries error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/:id/plan-trip", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const [member] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    if (!member) { res.status(403).json({ error: "Must be a group member to plan a trip" }); return; }

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const members = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));

    const memberIds = members.map((m) => m.userId);
    const prefs = memberIds.length
      ? await db.select().from(userPreferencesTable).where(inArray(userPreferencesTable.userId, memberIds))
      : [];

    const { destination, tripLength } = req.body as { destination?: string; tripLength?: string };

    const allCategories = prefs.flatMap((p) => p.favoriteCategories ?? []);
    const allCities = prefs.flatMap((p) => p.favoriteCities ?? []);
    const allStyles = prefs.flatMap((p) => p.tripStyle ?? []);
    const budgets = prefs.map((p) => p.budgetRange).filter(Boolean);
    const dietaryNotes = prefs.map((p) => p.dietaryNotes).filter(Boolean);

    const freq = (arr: string[]) => {
      const c: Record<string, number> = {};
      arr.forEach((x) => { c[x] = (c[x] ?? 0) + 1; });
      return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
    };

    const topCategories = freq(allCategories);
    const topCities = freq(allCities);
    const topStyles = freq(allStyles);

    const destHint = destination?.trim() ? `The group prefers: "${destination.trim()}".` : "";
    const lengthHint = tripLength ? `Trip length preference: ${tripLength}.` : "Weekend trip preferred.";

    const prompt = `You are an expert Black travel planner for Mapping With Melanin — a platform celebrating Black culture, safety, and community discovery.

A group of ${memberIds.length} friends is planning a trip together.

Their collective preferences:
- Favorite business categories: ${topCategories.length ? topCategories.join(", ") : "varied"}
- Cities they love: ${topCities.length ? topCities.join(", ") : "open to suggestions"}
- Trip styles: ${topStyles.length ? topStyles.join(", ") : "flexible"}
- Budget ranges: ${budgets.length ? [...new Set(budgets)].join(", ") : "moderate"}
- Dietary notes: ${dietaryNotes.length ? dietaryNotes.join("; ") : "none"}
${destHint}
${lengthHint}

Generate 3 distinct trip itinerary options. Emphasize Black-owned businesses, culturally rich neighborhoods, HBCUs, jazz & soul food hotspots, cultural landmarks, and community safety. Each option should feel unique (different vibe, not just different city).

Return ONLY valid JSON matching this exact TypeScript type — no markdown, no prose, just the JSON:
{
  "summary": "string — 1–2 sentence overview of why these options work for this group",
  "memberCount": ${memberIds.length},
  "sharedInterests": ["array of top 3–5 shared themes"],
  "options": [
    {
      "id": 1,
      "title": "string — catchy trip title",
      "destination": "City, State",
      "dates": "string — suggested weekend or dates e.g. 'July 19–21' or 'Any weekend in August'",
      "theme": "string — 3–5 word vibe e.g. 'Culture, Jazz & Soul Food'",
      "budget": "$X–$Y/person",
      "whyItWorks": "string — 1–2 sentences on why this option fits the group's combined preferences",
      "safetyNote": "string — 1 sentence on community safety or Black-friendly reputation of destination",
      "days": [
        {
          "day": "Day 1",
          "theme": "string",
          "activities": [
            { "time": "10:00am", "title": "string", "description": "string", "location": "string" }
          ],
          "meals": [
            { "meal": "Lunch", "restaurant": "string", "cuisine": "string", "note": "string or null" }
          ]
        }
      ]
    }
  ],
  "generatedAt": "${new Date().toISOString()}"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    let content: GroupItineraryContent;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      content = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent) as GroupItineraryContent;
    } catch {
      req.log.error({ rawContent }, "Failed to parse AI itinerary response");
      res.status(500).json({ error: "AI returned invalid response. Please try again." });
      return;
    }

    const title = content.options?.[0]?.title
      ? `${group.name} — ${content.options[0].destination}`
      : `${group.name} Trip Plan`;

    const [itinerary] = await db
      .insert(groupItineraries)
      .values({
        groupId,
        title,
        destination: content.options?.[0]?.destination ?? destination ?? null,
        content,
        createdBy: userId,
      })
      .returning();

    res.status(201).json({ itinerary });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/:id/plan-trip error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/:id/join", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    if (group.isPrivate) {
      res.status(403).json({ error: "This group requires an invitation to join" });
      return;
    }

    if (group.memberCount >= group.maxMembers) {
      res.status(400).json({ error: `Group is full (max ${group.maxMembers} members)` });
      return;
    }

    const [existing] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .limit(1);
    if (existing) { res.status(409).json({ error: "Already a member" }); return; }

    await db.insert(groupMembers).values({ groupId, userId, role: "member" });
    await db
      .update(groups)
      .set({ memberCount: sql`${groups.memberCount} + 1`, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    res.json({ joined: true, groupId });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/:id/join error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/groups/:id/leave", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const deleted = await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
      .returning();

    if (deleted.length === 0) { res.status(404).json({ error: "Not a member" }); return; }

    await db
      .update(groups)
      .set({ memberCount: sql`greatest(${groups.memberCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    res.json({ left: true, groupId });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/groups/:id/leave error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
