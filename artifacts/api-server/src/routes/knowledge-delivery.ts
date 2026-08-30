import { Router, type IRouter, type Request, type Response } from "express";
import { db, pool, userDeliveryPreferencesTable, topicIssuesTable, userIssueFollowsTable, userTopicFollowsTable, knowledgeTopicsTable, happeningNowStoriesTable, storyConfirmationsTable, happeningTopicInterestEventsTable, usersTable, userPreferencesTable, communityPostsTable, contentReportsTable } from "@workspace/db";
import { and, eq, inArray, desc, or, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { checkContent } from "../lib/contentFilter";
import { scanForFamily } from "../lib/familyFilter";
import { validatePublicUrl } from "../lib/url-safety-validator";
import { HAPPENING_CATEGORIES as HAPPENING_CATEGORY_LIST, isLocalStory, normalizeCity, normalizeHappeningCategory, normalizeHomeState } from "../lib/happening-personalization";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);
function isAdmin(req: Request): boolean {
  const user = (req as any).user;
  if (!user?.email) return false;
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(user.email)) return true;
  return user.role === "admin";
}

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.user?.id) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  return true;
}

const HAPPENING_CATEGORIES = new Set<string>(HAPPENING_CATEGORY_LIST);
const HAPPENING_SCOPES = new Set(["local", "state", "national", "global"]);

function normalizeHttpUrl(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$)/i.test(key)) parsed.searchParams.delete(key);
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function normalizeTopicTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9&+ -]/g, ""))
    .filter(Boolean))].slice(0, 8);
}

function sourcePublisherFromUrl(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null;
  try { return new URL(sourceUrl).hostname.replace(/^www\./, ""); }
  catch { return null; }
}

function defaultStoryExpiry(category: string, from = new Date()): Date {
  const days = category === "safety" ? 3
    : category === "politics" || category === "transportation" ? 14
    : category === "health" || category === "housing" ? 30
    : 60;
  return new Date(from.getTime() + days * 86_400_000);
}

router.get("/knowledge/delivery-preferences", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const [prefs] = await db
      .select()
      .from(userDeliveryPreferencesTable)
      .where(eq(userDeliveryPreferencesTable.userId, userId))
      .limit(1);
    res.json({
      preferences: prefs ?? {
        digestMode: "weekly",
        scope: "all",
        includeSavedCities: false,
        includeSavedBusinesses: false,
      },
    });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/delivery-preferences error");
    res.status(500).json({ error: "Failed to fetch delivery preferences." });
  }
});

router.put("/knowledge/delivery-preferences", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const { digestMode, scope, includeSavedCities, includeSavedBusinesses } = req.body as {
      digestMode?: string;
      scope?: string;
      includeSavedCities?: boolean;
      includeSavedBusinesses?: boolean;
    };

    const validModes = ["daily", "weekly", "breaking", "immediate"];
    const validScopes = ["local", "national", "global", "all"];

    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (digestMode && validModes.includes(digestMode)) values.digestMode = digestMode;
    if (scope && validScopes.includes(scope)) values.scope = scope;
    if (includeSavedCities !== undefined) values.includeSavedCities = includeSavedCities;
    if (includeSavedBusinesses !== undefined) values.includeSavedBusinesses = includeSavedBusinesses;

    const [existing] = await db
      .select({ userId: userDeliveryPreferencesTable.userId })
      .from(userDeliveryPreferencesTable)
      .where(eq(userDeliveryPreferencesTable.userId, userId))
      .limit(1);

    let prefs;
    if (existing) {
      const [updated] = await db
        .update(userDeliveryPreferencesTable)
        .set(values)
        .where(eq(userDeliveryPreferencesTable.userId, userId))
        .returning();
      prefs = updated;
    } else {
      const [inserted] = await db
        .insert(userDeliveryPreferencesTable)
        .values({ userId, ...values } as any)
        .returning();
      prefs = inserted;
    }
    res.json({ preferences: prefs });
  } catch (err) {
    req.log.error({ err }, "PUT /knowledge/delivery-preferences error");
    res.status(500).json({ error: "Failed to save delivery preferences." });
  }
});

router.get("/knowledge/issues", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const issues = await db
      .select()
      .from(topicIssuesTable)
      .where(eq(topicIssuesTable.isActive, true))
      .orderBy(topicIssuesTable.name);

    let followingIds = new Set<string>();
    if (userId) {
      const follows = await db
        .select({ issueId: userIssueFollowsTable.issueId })
        .from(userIssueFollowsTable)
        .where(eq(userIssueFollowsTable.userId, userId));
      followingIds = new Set(follows.map((f) => f.issueId));
    }

    res.json({
      issues: issues.map((i) => ({ ...i, isFollowing: followingIds.has(i.id) })),
    });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/issues error");
    res.status(500).json({ error: "Failed to fetch issues." });
  }
});

router.post("/knowledge/issues/:id/follow", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const issueId = String(req.params.id);
    await db
      .insert(userIssueFollowsTable)
      .values({ userId, issueId })
      .onConflictDoNothing();
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/issues/:id/follow error");
    res.status(500).json({ error: "Failed to follow issue." });
  }
});

router.delete("/knowledge/issues/:id/follow", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const issueId = String(req.params.id);
    await db
      .delete(userIssueFollowsTable)
      .where(and(eq(userIssueFollowsTable.userId, userId), eq(userIssueFollowsTable.issueId, issueId)));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "DELETE /knowledge/issues/:id/follow error");
    res.status(500).json({ error: "Failed to unfollow issue." });
  }
});

router.patch("/knowledge/topics/:id/follow/pin", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const topicId = String(req.params.id);
    const { pinned } = req.body as { pinned?: boolean };
    if (typeof pinned !== "boolean") { res.status(400).json({ error: "pinned (boolean) required" }); return; }

    const [existing] = await db
      .select({ id: userTopicFollowsTable.id })
      .from(userTopicFollowsTable)
      .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)))
      .limit(1);

    if (!existing) { res.status(404).json({ error: "You are not following this topic" }); return; }

    await db
      .update(userTopicFollowsTable)
      .set({ isPinnedToProfile: pinned })
      .where(and(eq(userTopicFollowsTable.userId, userId), eq(userTopicFollowsTable.topicId, topicId)));

    res.json({ ok: true, topicId, isPinnedToProfile: pinned });
  } catch (err) {
    req.log.error({ err }, "PATCH /knowledge/topics/:id/follow/pin error");
    res.status(500).json({ error: "Failed to update pin." });
  }
});

router.patch("/knowledge/issues/:id/follow/pin", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const issueId = String(req.params.id);
    const { pinned } = req.body as { pinned?: boolean };
    if (typeof pinned !== "boolean") { res.status(400).json({ error: "pinned (boolean) required" }); return; }

    const [existing] = await db
      .select({ id: userIssueFollowsTable.id })
      .from(userIssueFollowsTable)
      .where(and(eq(userIssueFollowsTable.userId, userId), eq(userIssueFollowsTable.issueId, issueId)))
      .limit(1);

    if (!existing) { res.status(404).json({ error: "You are not following this issue" }); return; }

    await db
      .update(userIssueFollowsTable)
      .set({ isPinnedToProfile: pinned })
      .where(and(eq(userIssueFollowsTable.userId, userId), eq(userIssueFollowsTable.issueId, issueId)));

    res.json({ ok: true, issueId, isPinnedToProfile: pinned });
  } catch (err) {
    req.log.error({ err }, "PATCH /knowledge/issues/:id/follow/pin error");
    res.status(500).json({ error: "Failed to update pin." });
  }
});

// ── POST /knowledge/topics/request — member requests a new topic ─────────────
// Creates a knowledge_topics record with category "requested" so admins can review.
// Returns { ok: true, alreadyExists: false } or { ok: true, alreadyExists: true }.
router.post("/knowledge/topics/request", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { topicName } = req.body as { topicName?: string };
    if (!topicName?.trim()) {
      res.status(400).json({ error: "topicName is required" });
      return;
    }
    const name = topicName.trim();
    // Check if topic already exists (case-insensitive)
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM knowledge_topics WHERE LOWER(topic_name) = LOWER($1) LIMIT 1`,
      [name],
    ).catch(() => null);
    const rows = existing?.rows ?? [];
    if (rows.length > 0) {
      res.json({ ok: true, alreadyExists: true, message: "This topic is already in the library or pending review." });
      return;
    }
    // Insert as user-requested — admin will review and re-categorize
    await pool.query(
      `INSERT INTO knowledge_topics (id, topic_name, category, description, notification_priority, keywords, trusted_sources, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, 'requested', $2, 'digest', '{}', '[]', NOW(), NOW())`,
      [name, `Community-requested topic submitted by member ${req.user!.id}. Pending admin review.`],
    ).catch(() => null);
    res.json({ ok: true, alreadyExists: false, message: `"${name}" has been submitted for review.` });
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/topics/request error");
    res.status(500).json({ error: "Failed to submit topic request." });
  }
});

/* ─── Happening Now ─── */

// Consent is intentionally explicit and this endpoint only accepts governed
// identifiers. It must not be wired to search, chat, or submission-note events.
router.get("/knowledge/happening-now/topic-interests", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const interests = await db.select({
      id: happeningTopicInterestEventsTable.id,
      category: happeningTopicInterestEventsTable.category,
      topicId: happeningTopicInterestEventsTable.topicId,
      consentedAt: happeningTopicInterestEventsTable.consentedAt,
    }).from(happeningTopicInterestEventsTable)
      .where(and(eq(happeningTopicInterestEventsTable.userId, req.user!.id), sql`${happeningTopicInterestEventsTable.revokedAt} IS NULL`))
      .orderBy(desc(happeningTopicInterestEventsTable.createdAt));
    res.json({ interests });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/happening-now/topic-interests error");
    res.status(500).json({ error: "Failed to fetch topic interests." });
  }
});

router.put("/knowledge/happening-now/topic-interests", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { consent, category: requestedCategory, topicId } = req.body as { consent?: unknown; category?: unknown; topicId?: unknown };
    if (consent !== true) { res.status(400).json({ error: "Explicit consent: true is required." }); return; }
    const category = requestedCategory === undefined ? null : normalizeHappeningCategory(requestedCategory);
    const canonicalTopicId = typeof topicId === "string" && topicId.trim() ? topicId.trim() : null;
    if ((requestedCategory !== undefined && !category) || (!category && !canonicalTopicId)) {
      res.status(400).json({ error: "Provide an approved category or canonical topicId." }); return;
    }
    if (canonicalTopicId) {
      const [topic] = await db.select({ id: knowledgeTopicsTable.id }).from(knowledgeTopicsTable)
        .where(and(eq(knowledgeTopicsTable.id, canonicalTopicId), eq(knowledgeTopicsTable.enabled, true))).limit(1);
      if (!topic) { res.status(400).json({ error: "topicId must identify an enabled canonical topic." }); return; }
    }
    const [interest] = await db.insert(happeningTopicInterestEventsTable)
      .values({ userId: req.user!.id, category, topicId: canonicalTopicId }).returning();
    res.status(201).json({ interest });
  } catch (err) {
    req.log.error({ err }, "PUT /knowledge/happening-now/topic-interests error");
    res.status(500).json({ error: "Failed to save topic interest." });
  }
});

router.delete("/knowledge/happening-now/topic-interests", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const { category: requestedCategory, topicId, reset } = req.body as { category?: unknown; topicId?: unknown; reset?: unknown };
    const category = requestedCategory === undefined ? null : normalizeHappeningCategory(requestedCategory);
    const canonicalTopicId = typeof topicId === "string" && topicId.trim() ? topicId.trim() : null;
    if (requestedCategory !== undefined && !category) { res.status(400).json({ error: "category must be approved." }); return; }
    if (reset !== true && !category && !canonicalTopicId) {
      res.status(400).json({ error: "Provide an interest identifier or reset: true." }); return;
    }
    const clauses = [eq(happeningTopicInterestEventsTable.userId, req.user!.id), sql`${happeningTopicInterestEventsTable.revokedAt} IS NULL`];
    if (category) clauses.push(eq(happeningTopicInterestEventsTable.category, category));
    if (canonicalTopicId) clauses.push(eq(happeningTopicInterestEventsTable.topicId, canonicalTopicId));
    await db.update(happeningTopicInterestEventsTable).set({ revokedAt: new Date() }).where(and(...clauses));
    res.json({ ok: true, reset: reset === true });
  } catch (err) {
    req.log.error({ err }, "DELETE /knowledge/happening-now/topic-interests error");
    res.status(500).json({ error: "Failed to revoke topic interest." });
  }
});

router.get("/knowledge/happening-now", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const admin = isAdmin(req);
    const feedMode = req.query.feed === "latest" ? "latest" : "foryou";
    const scopeFilter = typeof req.query.scope === "string" && HAPPENING_SCOPES.has(req.query.scope)
      ? req.query.scope
      : null;
    // State is the sole supported expansion today. It is opt-in and surfaced
    // to clients rather than silently mixing unrelated local cities.
    const expandLocalToState = scopeFilter === "local" && req.query.localExpansion === "state";

    const visibility = admin
      ? or(eq(happeningNowStoriesTable.status, "approved"), eq(happeningNowStoriesTable.status, "pending"))
      : userId
        ? or(eq(happeningNowStoriesTable.status, "approved"), and(eq(happeningNowStoriesTable.status, "pending"), eq(happeningNowStoriesTable.submittedBy, userId)))
        : eq(happeningNowStoriesTable.status, "approved");

    const rows = await db
      .select({
        id: happeningNowStoriesTable.id,
        title: happeningNowStoriesTable.title,
        summary: happeningNowStoriesTable.summary,
        category: happeningNowStoriesTable.category,
        topicTags: happeningNowStoriesTable.topicTags,
        scope: happeningNowStoriesTable.scope,
        city: happeningNowStoriesTable.city,
        state: happeningNowStoriesTable.state,
        country: happeningNowStoriesTable.country,
        sourceUrl: happeningNowStoriesTable.sourceUrl,
        sourcePublisher: happeningNowStoriesTable.sourcePublisher,
        sourceStatus: happeningNowStoriesTable.sourceStatus,
        publishedAt: happeningNowStoriesTable.publishedAt,
        expiresAt: happeningNowStoriesTable.expiresAt,
        communityPostId: happeningNowStoriesTable.communityPostId,
        submittedBy: happeningNowStoriesTable.submittedBy,
        submitterName: happeningNowStoriesTable.submitterName,
        status: happeningNowStoriesTable.status,
        confirmCount: happeningNowStoriesTable.confirmCount,
        isAdminPost: happeningNowStoriesTable.isAdminPost,
        createdAt: happeningNowStoriesTable.createdAt,
      })
      .from(happeningNowStoriesTable)
      .where(visibility)
      .orderBy(desc(happeningNowStoriesTable.createdAt))
      .limit(100);

    let confirmedIds = new Set<string>();
    let interests = new Set<string>();
    let avoidCategories = new Set<string>();
    let favoriteCities = new Set<string>();
    let homeCity = "";
    let homeState: string | null = null;
    if (userId) {
      const [confs, prefRows, userRows, interestEvents] = await Promise.all([
        db.select({ storyId: storyConfirmationsTable.storyId }).from(storyConfirmationsTable).where(eq(storyConfirmationsTable.userId, userId)),
        db.select().from(userPreferencesTable).where(eq(userPreferencesTable.userId, userId)).limit(1),
        db.select({ homeCity: usersTable.homeCity, homeState: usersTable.homeState }).from(usersTable).where(eq(usersTable.id, userId)).limit(1),
        db.select({ category: happeningTopicInterestEventsTable.category, topicId: happeningTopicInterestEventsTable.topicId })
          .from(happeningTopicInterestEventsTable)
          .where(and(eq(happeningTopicInterestEventsTable.userId, userId), sql`${happeningTopicInterestEventsTable.revokedAt} IS NULL`)),
      ]);
      confirmedIds = new Set(confs.map((c) => c.storyId));
      const prefs = prefRows[0];
      interests = new Set([
        ...(prefs?.favoriteCategories ?? []),
        ...(prefs?.culturalInterests ?? []),
        ...(prefs?.lifestyleServices ?? []),
        ...interestEvents.flatMap((event) => [event.category, event.topicId].filter((value): value is string => !!value)),
      ].map((value) => normalizeHappeningCategory(value) ?? value.toLowerCase()));
      // Avoid choices apply explicitly to For You, even where a matching
      // interest event exists. Latest remains an unpersonalized chronological view.
      const normalizedAvoids: string[] = [];
      for (const value of prefs?.avoidCategories ?? []) {
        const normalized = normalizeHappeningCategory(value);
        if (normalized) normalizedAvoids.push(normalized);
      }
      avoidCategories = new Set(normalizedAvoids);
      favoriteCities = new Set((prefs?.favoriteCities ?? []).map(normalizeCity).filter(Boolean));
      homeCity = normalizeCity(userRows[0]?.homeCity);
      homeState = normalizeHomeState(userRows[0]?.homeState)
        ?? normalizeHomeState((userRows[0]?.homeCity ?? "").split(",").pop());
    }
    const localCities = new Set([...favoriteCities, homeCity].filter(Boolean));

    const now = Date.now();
    const visibleRows = rows.filter((story) => {
      if (scopeFilter && story.scope !== scopeFilter) return false;
      if (scopeFilter === "local" && !isLocalStory(story, localCities, homeState, expandLocalToState)) return false;
      if (feedMode === "foryou" && avoidCategories.has(normalizeHappeningCategory(story.category) ?? story.category.toLowerCase())) return false;
      if (story.status !== "approved") return true;
      return !story.expiresAt || new Date(story.expiresAt).getTime() > now;
    });

    const ranked = visibleRows.map((story) => {
      const reasons: string[] = [];
      let score = 0;
      const category = normalizeHappeningCategory(story.category) ?? story.category.toLowerCase();
      const tags = (story.topicTags ?? []).map((tag) => tag.toLowerCase());
      const city = (story.city ?? "").toLowerCase();
      const state = normalizeHomeState(story.state);
      const ageHours = Math.max(0, (now - new Date(story.publishedAt ?? story.createdAt).getTime()) / 3_600_000);

      if (story.status === "pending" && story.submittedBy === userId) { score += 1000; reasons.push("Your pending submission"); }
      if (interests.has(category) || tags.some((tag) => interests.has(tag))) { score += 14; reasons.push(`Matches your ${story.category} interests`); }
      if (city && localCities.has(normalizeCity(city))) { score += 12; reasons.push(`Near ${story.city}`); }
      else if (state && homeState === state) { score += 7; reasons.push(`In your state`); }
      else if (story.scope === "national") score += 3;
      else if (story.scope === "global") score += 1;
      if (story.sourceStatus === "verified") { score += 5; reasons.push("Verified source"); }
      score += Math.max(0, 10 - ageHours / 24);
      score += Math.log1p(story.confirmCount) * 2;

      return {
        ...story,
        hasConfirmed: confirmedIds.has(story.id),
        isOwnStory: userId ? story.submittedBy === userId : false,
        rankingScore: feedMode === "latest" ? -new Date(story.createdAt).getTime() : score,
        rankingReason: reasons.slice(0, 2).join(" · ") || (story.scope === "local" ? "Local community update" : "Current community update"),
      };
    });

    ranked.sort((a, b) => feedMode === "latest"
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : b.rankingScore - a.rankingScore || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const diverse: typeof ranked = [];
    const deferred: typeof ranked = [];
    for (const story of ranked) {
      const lastTwo = diverse.slice(-2);
      if (lastTwo.length === 2 && lastTwo.every((item) => item.category === story.category)) deferred.push(story);
      else diverse.push(story);
    }
    diverse.push(...deferred);

    res.json({
      stories: diverse.slice(0, 50), feedMode, personalized: !!userId && feedMode === "foryou",
      localExpansion: scopeFilter === "local"
        ? { active: expandLocalToState ? "state" : null, available: homeState ? ["state"] : [] }
        : undefined,
    });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/happening-now error");
    res.status(500).json({ error: "Failed to fetch stories." });
  }
});

router.post("/knowledge/happening-now", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const body = req.body as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    const category = String(body.category ?? "other").toLowerCase();
    const scope = String(body.scope ?? "national").toLowerCase();
    const city = String(body.city ?? "").trim() || null;
    const state = String(body.state ?? "").trim() || null;
    const country = String(body.country ?? "United States").trim() || "United States";
    const topicTags = normalizeTopicTags(body.topicTags);
    const rawSourceUrl = String(body.sourceUrl ?? "").trim();
    let sourceUrl = normalizeHttpUrl(rawSourceUrl);

    if (!title || !summary) { res.status(400).json({ error: "Title and summary are required." }); return; }
    if (title.length > 300) { res.status(400).json({ error: "Title must be 300 characters or fewer." }); return; }
    if (summary.length > 3000) { res.status(400).json({ error: "Summary must be 3,000 characters or fewer." }); return; }
    if (!HAPPENING_CATEGORIES.has(category)) { res.status(400).json({ error: "Choose a valid community-impact category." }); return; }
    if (!HAPPENING_SCOPES.has(scope)) { res.status(400).json({ error: "Choose local, state, national, or global scope." }); return; }
    if (scope === "local" && !city) { res.status(400).json({ error: "A city is required for local updates." }); return; }
    if (scope === "state" && !state) { res.status(400).json({ error: "A state is required for state updates." }); return; }
    if (rawSourceUrl && !sourceUrl) { res.status(400).json({ error: "Enter a valid HTTPS source URL." }); return; }
    if (sourceUrl) {
      const sourceValidation = await validatePublicUrl(sourceUrl, { timeoutMs: 8_000, maxRedirects: 3, maxBytes: 262_144 });
      if (!sourceValidation.safe) {
        res.status(400).json({ error: sourceValidation.reason, code: "UNSAFE_SOURCE_URL" });
        return;
      }
      sourceUrl = sourceValidation.canonicalUrl;
    }

    const filter = checkContent(`${title}\n${summary}`);
    if (!filter.ok) { res.status(422).json({ error: filter.reason, code: "CONTENT_POLICY_VIOLATION" }); return; }
    const familyScan = await scanForFamily(`${title}\n${summary}`, userId, "happening_now");
    if (familyScan.blocked) {
      res.status(422).json({ error: "This submission contains content that is not permitted.", code: "MINOR_CONTENT_BLOCKED" });
      return;
    }

    if (sourceUrl) {
      const duplicate = await db
        .select({ id: happeningNowStoriesTable.id, status: happeningNowStoriesTable.status })
        .from(happeningNowStoriesTable)
        .where(eq(happeningNowStoriesTable.sourceUrl, sourceUrl))
        .limit(1);
      if (duplicate[0]) {
        res.status(409).json({ error: "This source has already been shared.", storyId: duplicate[0].id, status: duplicate[0].status });
        return;
      }
    }

    const parsedPublishedAt = body.publishedAt ? new Date(String(body.publishedAt)) : new Date();
    const publishedAt = Number.isNaN(parsedPublishedAt.getTime()) ? new Date() : parsedPublishedAt;
    if (publishedAt.getTime() > Date.now() + 86_400_000) {
      res.status(400).json({ error: "Publication time cannot be in the future." });
      return;
    }

    const [user] = await db
      .select({ firstName: usersTable.firstName, lastName: usersTable.lastName, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const submitterName = user
      ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email?.split("@")[0] || "Community Member"
      : "Community Member";

    const [story] = await db
      .insert(happeningNowStoriesTable)
      .values({
        title,
        summary,
        category,
        topicTags,
        scope,
        city,
        state,
        country,
        sourceUrl,
        sourcePublisher: String(body.sourcePublisher ?? "").trim().slice(0, 180) || sourcePublisherFromUrl(sourceUrl),
        sourceStatus: sourceUrl ? "unverified" : "community_report",
        publishedAt,
        expiresAt: defaultStoryExpiry(category, publishedAt),
        submittedBy: userId,
        submitterName,
        status: "pending",
      })
      .returning();

    res.status(201).json({ story, message: "Thanks for looking out for the community. Your update is pending review." });
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/happening-now error");
    res.status(500).json({ error: "Failed to submit story." });
  }
});

router.post("/knowledge/happening-now/:id/confirm", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;
    const storyId = String(req.params.id);

    const [story] = await db
      .select({ id: happeningNowStoriesTable.id, submittedBy: happeningNowStoriesTable.submittedBy, confirmCount: happeningNowStoriesTable.confirmCount, status: happeningNowStoriesTable.status })
      .from(happeningNowStoriesTable)
      .where(eq(happeningNowStoriesTable.id, storyId))
      .limit(1);

    if (!story || (story.status !== "approved" && story.submittedBy !== userId && !isAdmin(req))) {
      res.status(404).json({ error: "Story not found." }); return;
    }
    if (story.status !== "approved") { res.status(409).json({ error: "This update is still pending review." }); return; }
    if (story.submittedBy === userId) { res.status(400).json({ error: "Cannot confirm your own story." }); return; }

    const [existing] = await db
      .select({ id: storyConfirmationsTable.id })
      .from(storyConfirmationsTable)
      .where(and(eq(storyConfirmationsTable.storyId, storyId), eq(storyConfirmationsTable.userId, userId)))
      .limit(1);

    if (existing) {
      await db.delete(storyConfirmationsTable)
        .where(and(eq(storyConfirmationsTable.storyId, storyId), eq(storyConfirmationsTable.userId, userId)));
      await db.update(happeningNowStoriesTable)
        .set({ confirmCount: Math.max(0, story.confirmCount - 1) })
        .where(eq(happeningNowStoriesTable.id, storyId));
      res.json({ confirmed: false, confirmCount: Math.max(0, story.confirmCount - 1) });
    } else {
      await db.insert(storyConfirmationsTable).values({ storyId, userId }).onConflictDoNothing();
      await db.update(happeningNowStoriesTable)
        .set({ confirmCount: story.confirmCount + 1 })
        .where(eq(happeningNowStoriesTable.id, storyId));
      res.json({ confirmed: true, confirmCount: story.confirmCount + 1 });
    }
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/happening-now/:id/confirm error");
    res.status(500).json({ error: "Failed to confirm story." });
  }
});

router.patch("/knowledge/happening-now/:id/status", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const storyId = String(req.params.id);
    const { status, adminNote, sourceStatus } = req.body as { status?: string; adminNote?: string; sourceStatus?: string };
    const validStatuses = ["approved", "rejected", "pending"];
    const validSourceStatuses = ["unverified", "verified", "community_report", "disputed"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: "status must be approved, rejected, or pending." });
      return;
    }
    if (sourceStatus && !validSourceStatuses.includes(sourceStatus)) {
      res.status(400).json({ error: "Choose a valid source verification status." });
      return;
    }

    const [story] = await db.select().from(happeningNowStoriesTable).where(eq(happeningNowStoriesTable.id, storyId)).limit(1);
    if (!story) { res.status(404).json({ error: "Story not found." }); return; }

    const result = await db.transaction(async (tx) => {
      let communityPostId = story.communityPostId;
      if (status === "approved" && !communityPostId) {
        const authorName = story.submitterName || "MWM Community Desk";
        const initials = authorName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "MW";
        const [post] = await tx.insert(communityPostsTable).values({
          authorId: story.submittedBy,
          authorName,
          authorInitials: initials,
          authorColor: "#CA922B",
          content: story.summary,
          category: story.category,
          postType: "happening",
          visibility: "public",
          commentPolicy: "everyone",
          topicTag: story.topicTags?.[0] ?? story.category,
          locationTag: story.city ?? story.state ?? (story.scope === "global" ? "Global" : "United States"),
          locationCity: story.city,
          locationCountry: story.country,
          locationType: story.scope,
          linkUrl: story.sourceUrl,
          linkTitle: story.title,
          linkDescription: story.summary.slice(0, 500),
          linkDomain: story.sourcePublisher,
          requiresModeration: false,
          isTrustedAuthor: story.isAdminPost,
        }).returning({ id: communityPostsTable.id });
        communityPostId = post?.id ?? null;
      }

      if (status !== "approved" && communityPostId) {
        await tx.update(communityPostsTable)
          .set({ requiresModeration: true, visibility: "followers_only" })
          .where(eq(communityPostsTable.id, communityPostId));
      }

      const [updated] = await tx.update(happeningNowStoriesTable)
        .set({
          status,
          adminNote: adminNote?.trim().slice(0, 2000) || null,
          sourceStatus: sourceStatus && validSourceStatuses.includes(sourceStatus) ? sourceStatus : story.sourceStatus,
          communityPostId,
          updatedAt: new Date(),
        })
        .where(eq(happeningNowStoriesTable.id, storyId))
        .returning();
      return updated;
    });

    res.json({ ok: true, story: result });
  } catch (err) {
    req.log.error({ err }, "PATCH /knowledge/happening-now/:id/status error");
    res.status(500).json({ error: "Failed to update story status." });
  }
});

router.post("/knowledge/happening-now/:id/report", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const storyId = String(req.params.id);
    const [story] = await db
      .select({ id: happeningNowStoriesTable.id, status: happeningNowStoriesTable.status, submittedBy: happeningNowStoriesTable.submittedBy })
      .from(happeningNowStoriesTable)
      .where(eq(happeningNowStoriesTable.id, storyId))
      .limit(1);
    if (!story || (story.status !== "approved" && story.submittedBy !== req.user!.id && !isAdmin(req))) {
      res.status(404).json({ error: "Story not found." }); return;
    }

    const allowedReasons = ["spam", "fake", "inappropriate", "harassment", "incorrect_info", "suspicious", "other"] as const;
    const requestedReason = String((req.body as { reason?: unknown }).reason ?? "incorrect_info");
    const reason = allowedReasons.includes(requestedReason as typeof allowedReasons[number])
      ? requestedReason as typeof allowedReasons[number]
      : "other";
    const description = String((req.body as { description?: unknown }).description ?? "").trim().slice(0, 1000) || null;
    const duplicate = await pool.query<{ id: string }>(
      `SELECT id FROM content_reports WHERE reporter_id = $1 AND target_type = 'happening_story' AND target_id = $2 AND status = 'pending' LIMIT 1`,
      [req.user!.id, storyId],
    );
    if (duplicate.rows.length === 0) {
      await db.insert(contentReportsTable).values({ reporterId: req.user!.id, targetType: "happening_story", targetId: storyId, reason, description });
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "POST /knowledge/happening-now/:id/report error");
    res.status(500).json({ error: "Failed to report story." });
  }
});

router.get("/knowledge/happening-now/pending", async (req: Request, res: Response) => {
  if (!isAdmin(req)) { res.status(403).json({ error: "Forbidden" }); return; }
  try {
    const rows = await db
      .select()
      .from(happeningNowStoriesTable)
      .where(eq(happeningNowStoriesTable.status, "pending"))
      .orderBy(desc(happeningNowStoriesTable.createdAt));
    res.json({ stories: rows });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/happening-now/pending error");
    res.status(500).json({ error: "Failed to fetch pending stories." });
  }
});

router.get("/knowledge/digest", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  try {
    const userId = req.user!.id;

    const [follows, prefs] = await Promise.all([
      db
        .select({ topicId: userTopicFollowsTable.topicId })
        .from(userTopicFollowsTable)
        .where(eq(userTopicFollowsTable.userId, userId)),
      db
        .select()
        .from(userDeliveryPreferencesTable)
        .where(eq(userDeliveryPreferencesTable.userId, userId))
        .limit(1),
    ]);

    if (follows.length === 0) {
      res.json({ digest: null, message: "Follow some topics to get your personalized digest." });
      return;
    }

    const topicIds = follows.map((f) => f.topicId);
    const topics = await db
      .select({ topicName: knowledgeTopicsTable.topicName, category: knowledgeTopicsTable.category })
      .from(knowledgeTopicsTable)
      .where(inArray(knowledgeTopicsTable.id, topicIds));

    const deliveryMode = prefs[0]?.digestMode ?? "weekly";
    const topicList = topics.map((t) => t.topicName).join(", ");

    const completion = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are KinfolkAI, a trusted community intelligence assistant for Mapping With Melanin™ — a platform celebrating Black culture, travel, and community. You speak directly to community members in a warm, affirming, informed voice. You do NOT make up news headlines or fabricate specific articles. Instead, you give a brief, intelligent briefing on why each topic area matters right now, written in one flowing summary paragraph. Always reference only general knowledge and current context.`,
        },
        {
          role: "user",
          content: `A member follows these topics: ${topicList}. Their delivery preference is "${deliveryMode}". Write a brief, warm KinfolkAI briefing (2-3 sentences) that acknowledges their interests and teases what kinds of updates they should watch for across these topics. End with an encouraging call to action. Do NOT fabricate specific article titles or news events.`,
        },
      ],
    });

    const digestText = completion.choices[0]?.message?.content ?? "";
    res.json({ digest: digestText, topicCount: follows.length, deliveryMode });
  } catch (err) {
    req.log.error({ err }, "GET /knowledge/digest error");
    res.status(500).json({ error: "Failed to generate digest." });
  }
});

export default router;
