import { Router, type IRouter, type Request, type Response } from "express";
import {
  db,
  knowledgeTopicsTable,
  userTopicFollowsTable,
  usersTable,
  businessesTable,
  communityPostsTable,
} from "@workspace/db";
import { and, count, eq, ilike, or, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getSourcesForTopic } from "../lib/trusted-sources";

const router: IRouter = Router();

// ─── POST /api/knowledge/hubs/resolve ─────────────────────────────────────────
// AI-powered disambiguation: "GM" → "General Motors", fuzzy-match existing hubs
router.post("/knowledge/hubs/resolve", async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };
  if (!query?.trim()) { res.status(400).json({ error: "query required" }); return; }

  let resolvedName = query.trim();
  let entityType = "topic";
  let ownershipType = "n/a";
  let isMinorityOwned: boolean | null = null;
  let confidence = 0.5;
  let aliases: string[] = [];

  try {
    // Step 1: AI resolution (abbreviations, common names, entity classification)
    if (openai) {
      const aiResult = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [{
          role: "system",
          content: `You are a topic resolver for a community hub app focused on Black travel, culture, business, health, and opportunity. Users search for topics like companies, countries, cities, health conditions, employers, sports teams, car brands, and organizations — NOT casual phrases or slang. Resolve abbreviations and short names to their most likely formal entity.`,
        }, {
          role: "user",
          content: `The user typed "${query.trim()}" in a topic hub search. This is likely a named entity — a company, place, health condition, sports team, employer, or organization. Resolve it to the canonical full name and classify it. Return ONLY valid JSON:
{
  "canonicalName": "full resolved name e.g. General Motors or Brazil or Type 2 Diabetes or Dallas Cowboys",
  "entityType": "one of: company, place, health_condition, sports_team, person, organization, topic, event",
  "ownershipType": "one of: minority_owned, non_minority_owned, government, nonprofit, community, individual, n/a",
  "isMinorityOwned": true or false or null,
  "confidence": number 0.0 to 1.0,
  "aliases": ["array", "of", "common", "alternate", "names"]
}`,
        }],
        temperature: 0.1,
        max_tokens: 250,
        response_format: { type: "json_object" },
      });

      try {
        const parsed = JSON.parse(aiResult.choices[0]?.message?.content ?? "{}") as {
          canonicalName?: string;
          entityType?: string;
          ownershipType?: string;
          isMinorityOwned?: boolean | null;
          confidence?: number;
          aliases?: string[];
        };
        resolvedName = parsed.canonicalName?.trim() || query.trim();
        entityType = parsed.entityType || "topic";
        ownershipType = parsed.ownershipType || "n/a";
        isMinorityOwned = parsed.isMinorityOwned ?? null;
        confidence = parsed.confidence ?? 0.5;
        aliases = parsed.aliases ?? [];
      } catch { /* keep defaults */ }
    }

    // Step 2: Fuzzy-match existing topics so user joins rather than duplicates
    const searchTerms = [...new Set([resolvedName, query.trim(), ...aliases.slice(0, 3)])];
    const orClauses = searchTerms.flatMap((t) => [
      ilike(knowledgeTopicsTable.topicName, `%${t}%`),
      ilike(knowledgeTopicsTable.canonicalName, `%${t}%`),
      sql`${t.toLowerCase()} = ANY(${knowledgeTopicsTable.synonyms})`,
    ]);

    const existingTopics = await db
      .select({
        id: knowledgeTopicsTable.id,
        topicName: knowledgeTopicsTable.topicName,
        canonicalName: knowledgeTopicsTable.canonicalName,
        category: knowledgeTopicsTable.category,
        topicType: knowledgeTopicsTable.topicType,
        entityType: knowledgeTopicsTable.entityType,
        ownershipType: knowledgeTopicsTable.ownershipType,
        description: knowledgeTopicsTable.description,
      })
      .from(knowledgeTopicsTable)
      .where(and(eq(knowledgeTopicsTable.enabled, true), or(...orClauses)))
      .limit(5);

    // Member counts for existing topics
    const existingWithCounts = await Promise.all(
      existingTopics.map(async (t) => {
        const [row] = await db
          .select({ cnt: count() })
          .from(userTopicFollowsTable)
          .where(eq(userTopicFollowsTable.topicId, t.id));
        return { ...t, membersCount: Number(row?.cnt ?? 0) };
      }),
    );

    res.json({
      query: query.trim(),
      resolvedName,
      entityType,
      ownershipType,
      isMinorityOwned,
      confidence,
      aliases,
      existingHubs: existingWithCounts,
      shouldJoin: existingWithCounts.length > 0,
    });
  } catch (err) {
    req.log?.error({ err }, "POST /knowledge/hubs/resolve error");
    res.status(500).json({ error: "Resolution failed" });
  }
});

// ─── GET /api/knowledge/hubs/:topicId ─────────────────────────────────────────
// Full hub page data: topic, members, user intent, creators, businesses, posts,
// community discussions, trusted sources
router.get("/knowledge/hubs/:topicId", async (req: Request, res: Response) => {
  const topicId = String(req.params.topicId);
  const userId = req.user?.id;

  try {
    const [topic] = await db
      .select()
      .from(knowledgeTopicsTable)
      .where(eq(knowledgeTopicsTable.id, topicId));

    if (!topic) { res.status(404).json({ error: "Hub not found" }); return; }

    // Member count — privacy-safe aggregate only
    const [memberRow] = await db
      .select({ cnt: count() })
      .from(userTopicFollowsTable)
      .where(eq(userTopicFollowsTable.topicId, topicId));
    const membersCount = Number(memberRow?.cnt ?? 0);

    // User's follow state + hub intent (private — never leaked to others)
    let isFollowing = false;
    let userIntent: string | null = null;
    if (userId) {
      const [follow] = await db
        .select({ id: userTopicFollowsTable.id, hubIntent: userTopicFollowsTable.hubIntent })
        .from(userTopicFollowsTable)
        .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)));
      isFollowing = !!follow;
      userIntent = (follow as any)?.hubIntent ?? null;
    }

    // Content creators: location topics → match homeCity; all → hub members who are creators
    type Creator = {
      id: string;
      firstName: string | null;
      lastName: string | null;
      username: string | null;
      profileImageUrl: string | null;
      homeCity: string | null;
    };

    let creators: Creator[] = [];

    if (topic.topicType === "location") {
      const locationTerms = [topic.topicName, ...(topic.synonyms ?? [])];
      const locOrClauses = locationTerms.map((t) => ilike(usersTable.homeCity, `%${t}%`));
      creators = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          username: usersTable.username,
          profileImageUrl: usersTable.profileImageUrl,
          homeCity: usersTable.homeCity,
        })
        .from(usersTable)
        .where(and(eq(usersTable.isContentCreator, true), or(...locOrClauses)))
        .limit(5);
    }

    // Fill remaining slots with hub-following creators
    if (creators.length < 5) {
      const existingIds = new Set(creators.map((c) => c.id));
      const extra = await db
        .select({
          id: usersTable.id,
          firstName: usersTable.firstName,
          lastName: usersTable.lastName,
          username: usersTable.username,
          profileImageUrl: usersTable.profileImageUrl,
          homeCity: usersTable.homeCity,
        })
        .from(usersTable)
        .innerJoin(
          userTopicFollowsTable,
          and(eq(userTopicFollowsTable.userId, usersTable.id), eq(userTopicFollowsTable.topicId, topicId)),
        )
        .where(eq(usersTable.isContentCreator, true))
        .limit(5);
      creators = [...creators, ...extra.filter((c) => !existingIds.has(c.id))].slice(0, 5);
    }

    // Related minority-owned businesses
    const topicTerms = [topic.topicName, ...(topic.synonyms ?? [])].slice(0, 3);
    let businesses: { id: string; name: string; category: string; city: string; state: string; blackOwned: boolean; verified: boolean }[] = [];

    const bizSelect = {
      id: businessesTable.id,
      name: businessesTable.name,
      category: businessesTable.category,
      city: businessesTable.city,
      state: businessesTable.state,
      blackOwned: businessesTable.blackOwned,
      verified: businessesTable.verified,
    };

    if (topic.topicType === "location") {
      const locOrClauses = topicTerms.flatMap((t) => [
        ilike(businessesTable.city, `%${t}%`),
        ilike(businessesTable.state, `%${t}%`),
      ]);
      businesses = await db.select(bizSelect).from(businessesTable).where(or(...locOrClauses)).limit(8);
    } else {
      const catOrClauses = topicTerms.map((t) => ilike(businessesTable.category, `%${t}%`));
      businesses = await db.select(bizSelect).from(businessesTable).where(or(...catOrClauses)).limit(8);
    }

    // Community discussions (public only, tagged or mentioning this topic)
    const postTerms = topicTerms.slice(0, 2);
    const postOrClauses = postTerms.flatMap((t) => [
      ilike(communityPostsTable.topicTag, `%${t}%`),
      ilike(communityPostsTable.content, `%${t}%`),
    ]);
    const posts = await db
      .select({
        id: communityPostsTable.id,
        content: communityPostsTable.content,
        createdAt: communityPostsTable.createdAt,
        topicTag: communityPostsTable.topicTag,
        upvotes: communityPostsTable.upvotes,
        commentsCount: communityPostsTable.commentsCount,
      })
      .from(communityPostsTable)
      .where(and(eq(communityPostsTable.visibility, "public"), or(...postOrClauses)))
      .orderBy(sql`${communityPostsTable.createdAt} DESC`)
      .limit(5);

    // Trusted sources — structured registry, no scraping, no raw user data
    const trustedSources = getSourcesForTopic(topic.category, topic.topicType, topic.topicName);

    res.json({
      topic,
      membersCount,
      isFollowing,
      userIntent,
      creators,
      businesses,
      posts,
      trustedSources,
    });
  } catch (err) {
    req.log?.error({ err }, "GET /knowledge/hubs/:topicId error");
    res.status(500).json({ error: "Could not load hub" });
  }
});

// ─── GET /api/knowledge/hubs/:topicId/recommendations ────────────────────────
router.get("/knowledge/hubs/:topicId/recommendations", async (req: Request, res: Response) => {
  const topicId = String(req.params.topicId);
  try {
    const [topic] = await db
      .select({ name: knowledgeTopicsTable.canonicalName, category: knowledgeTopicsTable.category })
      .from(knowledgeTopicsTable)
      .where(eq(knowledgeTopicsTable.id, topicId))
      .limit(1);

    if (!topic || !openai) { res.json({ recommendations: [] }); return; }

    const aiResult = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{
        role: "system",
        content: "You suggest related community hubs for a Black community discovery app. Return ONLY a JSON array of topic names — no explanation.",
      }, {
        role: "user",
        content: `The user is viewing the "${topic.name}" hub (category: ${topic.category ?? "general"}). Suggest 6 closely related topics they would also care about. Think about adjacent concerns, related demographics, connected issues, and complementary interests. Return JSON: {"suggestions": ["Topic 1", "Topic 2", ...]}`,
      }],
      temperature: 0.4,
      max_tokens: 200,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(aiResult.choices[0]?.message?.content ?? "{}") as { suggestions?: string[] };
    const suggestions = parsed.suggestions ?? [];

    const matched = await Promise.all(
      suggestions.slice(0, 6).map(async (name) => {
        const found = await db
          .select({
            id: knowledgeTopicsTable.id,
            name: knowledgeTopicsTable.topicName,
            canonicalName: knowledgeTopicsTable.canonicalName,
            category: knowledgeTopicsTable.category,
            memberCount: count(userTopicFollowsTable.userId),
          })
          .from(knowledgeTopicsTable)
          .leftJoin(userTopicFollowsTable, eq(userTopicFollowsTable.topicId, knowledgeTopicsTable.id))
          .where(or(ilike(knowledgeTopicsTable.topicName, `%${name}%`), ilike(knowledgeTopicsTable.canonicalName ?? knowledgeTopicsTable.topicName, `%${name}%`)))
          .groupBy(knowledgeTopicsTable.id)
          .limit(1);

        if (found[0]) return { ...found[0], suggestedName: name, exists: true };
        return { id: null, name: name, canonicalName: name, category: null, memberCount: 0, suggestedName: name, exists: false };
      })
    );

    res.json({ recommendations: matched });
  } catch (err) {
    req.log?.error({ err }, "GET /knowledge/hubs/:topicId/recommendations error");
    res.json({ recommendations: [] });
  }
});

// ─── PUT /api/knowledge/hubs/:topicId/intent ──────────────────────────────────
// Set or update the user's personal intent/context for this hub (private)
router.put("/knowledge/hubs/:topicId/intent", async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) { res.status(401).json({ error: "Authentication required" }); return; }

  const topicId = String(req.params.topicId);
  const { intent } = req.body as { intent?: string };
  const validIntents = ["visiting", "local", "heritage", "business", "professional", "general"];

  if (!intent || !validIntents.includes(intent)) {
    res.status(400).json({ error: "Invalid intent", valid: validIntents });
    return;
  }

  try {
    await db
      .update(userTopicFollowsTable)
      .set({ hubIntent: intent } as any)
      .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)));

    res.json({ intent });
  } catch (err) {
    req.log?.error({ err }, "PUT /knowledge/hubs/:topicId/intent error");
    res.status(500).json({ error: "Could not update intent" });
  }
});

export default router;
