import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { groups, groupMembers, groupInvites, groupItineraries, groupSuggestions, groupReports } from "@workspace/db/schema";
import { userPreferencesTable, usersTable } from "@workspace/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { getUserTier } from "../middleware/requireMembership";
import { openai } from "@workspace/integrations-openai-ai-server";
import type { GroupItineraryContent } from "@workspace/db/schema";

const router = Router();

// Tier-based maxMembers caps for groups
const GROUP_MAX_MEMBERS: Record<string, number> = {
  free: 8,
  navigator: 25,
  trailblazer: 100,
  founding: 100,
  beta: 100,
};

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
    let userAudiencePrefs: string[] = [];
    if (req.isAuthenticated()) {
      const memberships = await db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.userId, req.user.id));
      memberGroupIds = new Set(memberships.map((m) => m.groupId));

      const [prefs] = await db
        .select({ preferredOwnershipTypes: userPreferencesTable.preferredOwnershipTypes })
        .from(userPreferencesTable)
        .where(eq(userPreferencesTable.userId, req.user.id))
        .limit(1);
      userAudiencePrefs = (prefs?.preferredOwnershipTypes as string[] | null) ?? [];
    }

    const result = rows
      .filter((g) => {
        const aud = (g.audiencePreferences as string[] | null) ?? [];
        if (aud.length === 0) return true;
        if (userAudiencePrefs.length === 0) return true;
        return aud.some((a) => userAudiencePrefs.includes(a));
      })
      .map((g) => ({
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
      .limit(100);

    const isMember = req.isAuthenticated()
      ? members.some((m) => m.userId === req.user.id)
      : false;

    const isAdmin = req.isAuthenticated()
      ? members.some((m) => m.userId === req.user.id && m.role === "admin")
      : false;

    let pendingInvites: { id: number; invitedUserId: string; invitedUserFirstName: string | null; invitedUserLastName: string | null; createdAt: Date }[] = [];
    if (isAdmin) {
      pendingInvites = await db
        .select({
          id: groupInvites.id,
          invitedUserId: groupInvites.invitedUserId,
          invitedUserFirstName: usersTable.firstName,
          invitedUserLastName: usersTable.lastName,
          createdAt: groupInvites.createdAt,
        })
        .from(groupInvites)
        .leftJoin(usersTable, eq(usersTable.id, groupInvites.invitedUserId))
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
    const userId = req.user!.id;

    // Tier gate: free users cannot create groups; navigator limited to 2
    const tier = await getUserTier(userId);
    if (tier === "free") {
      res.status(403).json({
        error: "Creating groups requires an Explorer+ or higher membership.",
        code: "TIER_LIMIT_REACHED",
        upgradeUrl: "/membership",
      });
      return;
    }
    if (tier === "navigator") {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(groups)
        .where(eq(groups.createdBy, userId));
      if (count >= 2) {
        res.status(403).json({
          error: "Explorer+ members can create up to 2 groups. Upgrade to Navigator for unlimited groups.",
          code: "TIER_LIMIT_REACHED",
          upgradeUrl: "/membership",
        });
        return;
      }
    }

    const { name, description, category, city, state, isPrivate, isAgeRestricted, maxMembers, audiencePreferences, rules, profanityLevel } = req.body as {
      name?: string;
      description?: string;
      category?: string;
      city?: string;
      state?: string;
      isPrivate?: boolean;
      isAgeRestricted?: boolean;
      maxMembers?: number;
      audiencePreferences?: string[];
      rules?: string[];
      profanityLevel?: string;
    };

    if (!name?.trim()) { res.status(400).json({ error: "name is required" }); return; }

    const tierCap = GROUP_MAX_MEMBERS[tier] ?? 8;
    const cap = Math.min(Math.max(Number(maxMembers) || 8, 2), tierCap);
    const audience = Array.isArray(audiencePreferences) ? audiencePreferences.filter(Boolean).slice(0, 6) : [];
    const groupRules = Array.isArray(rules) ? rules.filter((r) => typeof r === "string" && r.trim()).slice(0, 10) : [];
    const validProfanity = ["strict", "moderate", "open"];
    const profLevel = validProfanity.includes(String(profanityLevel ?? "")) ? String(profanityLevel) : "moderate";

    const [group] = await db
      .insert(groups)
      .values({
        name: name.trim(),
        description: description?.trim() ?? null,
        category: category ?? "general",
        city: city?.trim() ?? null,
        state: state?.trim() ?? null,
        isPrivate: isPrivate ?? false,
        isAgeRestricted: isAgeRestricted ?? false,
        createdBy: userId,
        memberCount: 1,
        maxMembers: cap,
        audiencePreferences: audience,
        rules: groupRules,
        profanityLevel: profLevel,
      })
      .returning();

    await db.insert(groupMembers).values({ groupId: group.id, userId, role: "admin" });

    res.status(201).json({ group, tier, tierCap });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/groups/:id/settings", async (req: Request, res: Response) => {
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
    if (!admin) { res.status(403).json({ error: "Only group admins can update settings" }); return; }

    const { isAgeRestricted, isPrivate, name, description, maxMembers, audiencePreferences, rules, profanityLevel } = req.body as {
      isAgeRestricted?: boolean;
      isPrivate?: boolean;
      name?: string;
      description?: string;
      maxMembers?: number;
      audiencePreferences?: string[];
      rules?: string[];
      profanityLevel?: string;
    };

    // Get tier for cap enforcement
    const tier = await getUserTier(userId);
    const tierCap = GROUP_MAX_MEMBERS[tier] ?? 8;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (isAgeRestricted !== undefined) updates.isAgeRestricted = isAgeRestricted;
    if (isPrivate !== undefined) updates.isPrivate = isPrivate;
    if (name?.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim() || null;
    if (maxMembers !== undefined) updates.maxMembers = Math.min(Math.max(Number(maxMembers) || 8, 2), tierCap);
    if (Array.isArray(audiencePreferences)) updates.audiencePreferences = audiencePreferences.filter(Boolean).slice(0, 6);
    if (Array.isArray(rules)) updates.rules = rules.filter((r) => typeof r === "string" && r.trim()).slice(0, 10);
    if (profanityLevel !== undefined) {
      const valid = ["strict", "moderate", "open"];
      updates.profanityLevel = valid.includes(String(profanityLevel)) ? String(profanityLevel) : "moderate";
    }

    const [updated] = await db.update(groups).set(updates).where(eq(groups.id, groupId)).returning();
    res.json({ group: updated });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/groups/:id/settings error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/:id/report", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const [group] = await db.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId)).limit(1);
    if (!group) { res.status(404).json({ error: "Group not found" }); return; }

    const { targetType, targetId, reason, details } = req.body as {
      targetType?: string;
      targetId?: string;
      reason?: string;
      details?: string;
    };

    const validTargetTypes = ["group", "member", "content"];
    const tType = validTargetTypes.includes(String(targetType ?? "")) ? String(targetType) : "group";
    const validReasons = ["spam", "harassment", "hate_speech", "inappropriate_content", "underage_content", "misinformation", "other"];
    if (!reason || !validReasons.includes(reason)) {
      res.status(400).json({ error: "A valid reason is required", validReasons });
      return;
    }

    const [report] = await db.insert(groupReports).values({
      groupId,
      reportedBy: userId,
      targetType: tType,
      targetId: targetId ? String(targetId) : null,
      reason,
      details: details?.trim() ?? null,
    }).returning();

    res.status(201).json({ report, message: "Report submitted. Our team will review it shortly." });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/:id/report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/groups/:id/reports", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    // Only admins can view reports
    const [admin] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId), eq(groupMembers.role, "admin")))
      .limit(1);
    if (!admin) { res.status(403).json({ error: "Only group admins can view reports" }); return; }

    const reports = await db
      .select()
      .from(groupReports)
      .where(eq(groupReports.groupId, groupId))
      .orderBy(desc(groupReports.createdAt))
      .limit(50);

    res.json({ reports });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups/:id/reports error");
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
      .where(and(eq(groupInvites.groupId, groupId), eq(groupInvites.invitedUserId, invitedUserId), eq(groupInvites.status, "pending")))
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

Generate 3 distinct trip itinerary options. Emphasize minority-owned businesses, culturally rich neighborhoods, HBCUs, jazz & soul food hotspots, cultural landmarks, and community safety. Each option should feel unique (different vibe, not just different city).

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

    // Tier gate for joining
    const joinTier = await getUserTier(userId);
    const joinLimit: Record<string, number> = { free: 5, navigator: 25 };
    if (joinTier in joinLimit) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(groupMembers)
        .where(eq(groupMembers.userId, userId));
      const limit = joinLimit[joinTier];
      if (count >= limit) {
        const nextTier = joinTier === "free" ? "Explorer+" : "Navigator";
        res.status(403).json({
          error: `You've reached the ${limit}-group limit for your plan. Upgrade to ${nextTier} to join more groups.`,
          code: "TIER_LIMIT_REACHED",
          upgradeUrl: "/membership",
        });
        return;
      }
    }

    if (group.isAgeRestricted) {
      const [userData] = await db.select({ dateOfBirth: usersTable.dateOfBirth }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
      if (!userData?.dateOfBirth) {
        res.status(403).json({ error: "This group is 18+ only. Please add your date of birth in your profile settings." });
        return;
      }
      const ageMs = Date.now() - new Date(userData.dateOfBirth).getTime();
      const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
      if (ageYears < 18) {
        res.status(403).json({ error: "You must be 18 or older to join this group." });
        return;
      }
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

router.get("/groups/:id/suggestions", async (req: Request, res: Response) => {
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }

    const items = await db
      .select()
      .from(groupSuggestions)
      .where(eq(groupSuggestions.groupId, groupId))
      .orderBy(desc(groupSuggestions.upvotes), desc(groupSuggestions.createdAt));

    res.json({ suggestions: items });
  } catch (err) {
    req.log.error({ err }, "GET /api/groups/:id/suggestions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/:id/suggestions", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const userId = req.user!.id;

    const { type, value, notes } = req.body as {
      type?: string;
      value?: string;
      notes?: string;
    };

    if (!value || !String(value).trim()) {
      res.status(400).json({ error: "value is required" });
      return;
    }

    const validTypes = ["location", "event_type", "restaurant", "activity", "destination"];
    const suggType = validTypes.includes(String(type)) ? String(type) : "location";

    const [suggestion] = await db
      .insert(groupSuggestions)
      .values({ groupId, userId, type: suggType, value: String(value).trim(), notes: notes ?? null })
      .returning();

    res.status(201).json({ suggestion });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/:id/suggestions error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/groups/:id/suggestions/:suggId/upvote", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    const suggId = parseInt(String(req.params.suggId), 10);
    if (isNaN(groupId) || isNaN(suggId)) { res.status(400).json({ error: "Invalid id" }); return; }

    const [updated] = await db
      .update(groupSuggestions)
      .set({ upvotes: sql`${groupSuggestions.upvotes} + 1` })
      .where(and(eq(groupSuggestions.id, suggId), eq(groupSuggestions.groupId, groupId)))
      .returning();

    if (!updated) { res.status(404).json({ error: "Suggestion not found" }); return; }
    res.json({ suggestion: updated });
  } catch (err) {
    req.log.error({ err }, "POST /api/groups/:id/suggestions/:suggId/upvote error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/groups/:id/members/:userId/role", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    const targetUserId = String(req.params.userId);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const requesterId = req.user!.id;

    const [admin] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requesterId), eq(groupMembers.role, "admin")))
      .limit(1);
    if (!admin) { res.status(403).json({ error: "Only admins can change member roles" }); return; }

    const { role } = req.body as { role?: string };
    if (role !== "admin" && role !== "member") {
      res.status(400).json({ error: "role must be 'admin' or 'member'" });
      return;
    }

    await db
      .update(groupMembers)
      .set({ role })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

    res.json({ ok: true, role });
  } catch (err) {
    req.log.error({ err }, "PATCH /api/groups/:id/members/:userId/role error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/groups/:id/members/:userId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const groupId = parseInt(String(req.params.id), 10);
    const targetUserId = String(req.params.userId);
    if (isNaN(groupId)) { res.status(400).json({ error: "Invalid id" }); return; }
    const requesterId = req.user!.id;

    const [admin] = await db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, requesterId), eq(groupMembers.role, "admin")))
      .limit(1);
    if (!admin) { res.status(403).json({ error: "Only admins can remove members" }); return; }

    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetUserId)));

    await db
      .update(groups)
      .set({ memberCount: sql`greatest(${groups.memberCount} - 1, 0)`, updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /api/groups/:id/members/:userId error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
