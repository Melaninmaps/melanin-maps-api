import { Router, type IRouter } from "express";
import {
  db,
  usersTable,
  businessesTable,
  safetyCheckinsTable,
  knowledgeTopicsTable,
  knowledgeArticlesTable,
  knowledgeBookmarksTable,
  expertFollowsTable,
  expertProfilesTable,
  pushTokensTable,
  notificationsTable,
} from "@workspace/db";
import { and, isNotNull, lte, gt, eq, isNull, gte, inArray, or } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { sendTrialEndingSoon, sendTrialExpired, sendWeeklyDigest, sendCheckinOverdueEmail } from "../lib/email";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const CRON_SECRET = process.env.CRON_SECRET;

function verifyCronSecret(req: any, res: any): boolean {
  if (!CRON_SECRET) return true;
  const auth = req.headers["x-cron-secret"];
  if (auth !== CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

router.post("/cron/trial-reminders", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  const now = new Date();
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    const expiringSoon = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          gt(usersTable.trialEndsAt, now),
          lte(usersTable.trialEndsAt, in3Days),
          isNotNull(usersTable.email),
        ),
      );

    const expired = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          lte(usersTable.trialEndsAt, now),
          isNotNull(usersTable.email),
          isNull(usersTable.stripeSubscriptionId),
        ),
      );

    let remindersSent = 0;
    let expiryEmailsSent = 0;

    for (const user of expiringSoon) {
      if (!user.email || !user.trialEndsAt) continue;
      const daysLeft = Math.max(1, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      try {
        await sendTrialEndingSoon(user.email, user.firstName, user.memberType ?? "individual", user.trialEndsAt, daysLeft);
        remindersSent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send trial ending soon email");
      }
    }

    for (const user of expired) {
      if (!user.email) continue;
      try {
        await sendTrialExpired(user.email, user.firstName, user.memberType ?? "individual");
        expiryEmailsSent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send trial expired email");
      }
    }

    logger.info({ remindersSent, expiryEmailsSent }, "Trial cron completed");
    res.json({ ok: true, remindersSent, expiryEmailsSent });
  } catch (err: any) {
    logger.error({ err }, "Trial cron failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

router.post("/cron/safety-checkins", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  const now = new Date();
  try {
    const overdue = await db
      .select({
        id: safetyCheckinsTable.id,
        userId: safetyCheckinsTable.userId,
        trustedContactEmail: safetyCheckinsTable.trustedContactEmail,
        trustedContactName: safetyCheckinsTable.trustedContactName,
        scheduledAt: safetyCheckinsTable.scheduledAt,
        location: safetyCheckinsTable.location,
        city: safetyCheckinsTable.city,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(safetyCheckinsTable)
      .leftJoin(usersTable, eq(usersTable.id, safetyCheckinsTable.userId))
      .where(and(
        eq(safetyCheckinsTable.status, "pending"),
        lte(safetyCheckinsTable.scheduledAt, now),
        isNull(safetyCheckinsTable.notifiedAt),
      ));

    let notified = 0;
    for (const row of overdue) {
      try {
        const memberName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Your contact";
        await sendCheckinOverdueEmail(
          row.trustedContactEmail, row.trustedContactName, memberName,
          row.scheduledAt, row.location, row.city,
        );
        await db.update(safetyCheckinsTable)
          .set({ status: "overdue", notifiedAt: now })
          .where(eq(safetyCheckinsTable.id, row.id));
        notified++;
      } catch (err) {
        logger.error({ err, id: row.id }, "Failed to send overdue checkin email");
      }
    }
    logger.info({ notified }, "Safety checkin cron completed");
    res.json({ ok: true, notified });
  } catch (err: unknown) {
    logger.error({ err }, "Safety checkin cron failed");
    res.status(500).json({ error: "Cron failed" });
  }
});

router.post("/cron/referral-stats", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  res.json({ ok: true, message: "No-op — referral counts are updated in real time" });
});

router.post("/cron/weekly-digest", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekLabel = sevenDaysAgo.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
    " – " + now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  try {
    const newBusinesses = await db
      .select({ id: businessesTable.id, name: businessesTable.name, category: businessesTable.category, city: businessesTable.city, state: businessesTable.state })
      .from(businessesTable)
      .where(gte(businessesTable.createdAt, sevenDaysAgo))
      .limit(6);

    const recipients = await db
      .select({ email: usersTable.email, firstName: usersTable.firstName })
      .from(usersTable)
      .where(and(isNotNull(usersTable.email), eq(usersTable.approved, true)));

    let sent = 0;
    let failed = 0;

    for (const user of recipients) {
      if (!user.email) continue;
      try {
        await sendWeeklyDigest(user.email, user.firstName, newBusinesses, weekLabel);
        sent++;
        await new Promise(r => setTimeout(r, 600));
      } catch (err) {
        logger.error({ err, email: user.email }, "Failed to send weekly digest");
        failed++;
      }
    }

    logger.info({ sent, failed, newBusinesses: newBusinesses.length }, "Weekly digest cron completed");
    res.json({ ok: true, sent, failed, newBusinesses: newBusinesses.length, weekLabel });
  } catch (err: any) {
    logger.error({ err }, "Weekly digest cron failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

// ─── Default topics seeded on first run ──────────────────────────────────────
const DEFAULT_TOPICS = [
  { topicName: "Pediatric care for Black children", category: "health", tier: "free", description: "Healthcare navigation, finding Black pediatricians, common health disparities in Black children" },
  { topicName: "Mental health resources for the Black community", category: "health", tier: "free", description: "Therapy access, culturally competent providers, dismantling stigma" },
  { topicName: "Traveling while Black — safety and destination tips", category: "travel", tier: "free", description: "Safe destinations, sundown towns history, international travel tips for Black Americans" },
  { topicName: "Relocating to Black-friendly cities in the US", category: "relocation", tier: "free", description: "Cities with thriving Black communities, HBCUs nearby, neighborhood guides" },
  { topicName: "Building generational wealth as a Black family", category: "money", tier: "free", description: "Investing, real estate, estate planning, breaking cycles of financial exclusion" },
  { topicName: "Black history milestones Americans should know", category: "history", tier: "free", description: "Lesser-known stories, Reconstruction, Black Wall Street, civil rights beyond MLK" },
  { topicName: "HBCUs — finding the right fit for your student", category: "education", tier: "free", description: "HBCU profiles, financial aid, career outcomes, campus culture" },
  { topicName: "Black-owned restaurants and food traditions", category: "food", tier: "free", description: "Soul food, African diaspora cuisine, finding and supporting Black chefs" },
  { topicName: "Navigating the job market as a Black professional", category: "careers", tier: "free", description: "Workplace microaggressions, negotiation, Black-friendly employers, networking" },
  { topicName: "Wellness practices rooted in African traditions", category: "wellness", tier: "free", description: "Holistic health, ancestral wellness, stress and burnout in the Black community" },
] as const;

// ─── POST /cron/knowledge-refresh ────────────────────────────────────────────
router.post("/cron/knowledge-refresh", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  try {
    const now = new Date();

    // Seed topics on first run
    const existingTopics = await db.select({ id: knowledgeTopicsTable.id }).from(knowledgeTopicsTable).limit(1);
    if (existingTopics.length === 0) {
      await db.insert(knowledgeTopicsTable).values(DEFAULT_TOPICS.map(t => ({ ...t })));
      logger.info("Seeded default knowledge topics");
    }

    // Find topics due for refresh (never searched or searched 7+ days ago)
    const allTopics = await db.select().from(knowledgeTopicsTable).where(eq(knowledgeTopicsTable.enabled, true));
    const dueTopic = allTopics.find(t => {
      if (!t.lastSearchedAt) return true;
      const daysSince = (now.getTime() - t.lastSearchedAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSince >= (t.searchFrequencyDays ?? 7);
    });

    if (!dueTopic) {
      logger.info("No knowledge topics due for refresh");
      res.json({ ok: true, message: "No topics due for refresh", articlesCreated: 0 });
      return;
    }

    logger.info({ topic: dueTopic.topicName, category: dueTopic.category }, "Generating knowledge article");

    // Generate article via OpenAI
    const prompt = `You are an editorial writer for Mapping With Melanin, a community platform celebrating Black culture and empowering the Black community.

Write a well-researched, engaging article on this topic: "${dueTopic.topicName}"

Context: ${dueTopic.description ?? ""}

Return ONLY a JSON object with this exact shape:
{
  "title": "Article title (compelling, specific, under 80 characters)",
  "summary": "2-3 sentence summary (under 200 characters)",
  "content": "Full article body — 400-700 words. Use markdown: ## for section headers, ** for bold. Write in warm, empowering, community-first tone. Cite real organizations or resources where appropriate.",
  "subcategory": "Specific subtopic (e.g. 'Pediatricians' or 'Estate Planning')",
  "tags": ["tag1", "tag2", "tag3"],
  "readTimeMinutes": 4,
  "disclaimer": "Include only if health/legal/financial topic — one sentence: e.g. 'This article is for educational purposes only and does not constitute medical advice.'"
}`;

    let articleData: {
      title: string;
      summary: string;
      content: string;
      subcategory?: string;
      tags?: string[];
      readTimeMinutes?: number;
      disclaimer?: string;
    } | null = null;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1200,
        temperature: 0.7,
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
      articleData = JSON.parse(raw);
    } catch (aiErr) {
      logger.error({ aiErr, topic: dueTopic.topicName }, "AI generation failed for topic");
      res.status(500).json({ error: "AI generation failed" });
      return;
    }

    if (!articleData?.title || !articleData?.content) {
      logger.warn({ dueTopic }, "AI returned incomplete article data");
      res.status(500).json({ error: "Incomplete article from AI" });
      return;
    }

    const slug = articleData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200) + "-" + Date.now();

    const [inserted] = await db.insert(knowledgeArticlesTable).values({
      title: articleData.title,
      slug,
      summary: articleData.summary,
      content: articleData.content,
      category: dueTopic.category,
      subcategory: articleData.subcategory ?? null,
      tier: dueTopic.tier ?? "free",
      authorName: "Mapping With Melanin Editorial",
      authorBadge: "AI-Assisted",
      tags: articleData.tags ?? [],
      readTimeMinutes: articleData.readTimeMinutes ?? 4,
      disclaimer: articleData.disclaimer ?? null,
      status: "published",
    }).returning({ id: knowledgeArticlesTable.id, title: knowledgeArticlesTable.title });

    // Stamp lastSearchedAt on the topic
    await db
      .update(knowledgeTopicsTable)
      .set({ lastSearchedAt: now })
      .where(eq(knowledgeTopicsTable.id, dueTopic.id));

    logger.info({ articleId: inserted.id, title: inserted.title }, "Knowledge article created");

    // ── Notify interested users ─────────────────────────────────────────────
    // Users who bookmarked articles in same category
    const bookmarkUsers = await db
      .select({ userId: knowledgeBookmarksTable.userId })
      .from(knowledgeBookmarksTable)
      .leftJoin(knowledgeArticlesTable, eq(knowledgeBookmarksTable.articleId, knowledgeArticlesTable.id))
      .where(eq(knowledgeArticlesTable.category, dueTopic.category));

    // Users who follow experts in same category (matched by specialty keyword)
    const expertUsers = await db
      .select({ userId: expertFollowsTable.followerId })
      .from(expertFollowsTable)
      .leftJoin(expertProfilesTable, eq(expertFollowsTable.expertId, expertProfilesTable.id))
      .where(eq(expertProfilesTable.specialty, dueTopic.category));

    const interestedUserIds = [
      ...new Set([
        ...bookmarkUsers.map(r => r.userId),
        ...expertUsers.map(r => r.userId),
      ].filter(Boolean)),
    ] as string[];

    let notified = 0;

    if (interestedUserIds.length > 0) {
      const tokens = await db
        .select({ token: pushTokensTable.token, userId: pushTokensTable.userId })
        .from(pushTokensTable)
        .where(inArray(pushTokensTable.userId, interestedUserIds));

      for (const row of tokens) {
        if (!row.token) continue;
        try {
          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              to: row.token,
              title: "New Article Published 📚",
              body: articleData.title,
              data: { screen: "library-article", id: inserted.id },
              sound: "default",
              priority: "normal",
            }),
          });
          notified++;
        } catch (pushErr) {
          logger.warn({ pushErr, userId: row.userId }, "Push send failed");
        }
      }

      // Insert in-app notifications
      if (interestedUserIds.length > 0) {
        await db.insert(notificationsTable).values(
          interestedUserIds.map(userId => ({
            userId,
            type: "community" as const,
            title: "New Article Published 📚",
            body: articleData!.title,
            read: false,
          })),
        ).catch(err => logger.warn({ err }, "In-app notification insert failed"));
      }
    }

    logger.info({ articleId: inserted.id, notified, interestedUsers: interestedUserIds.length }, "Knowledge refresh complete");
    res.json({
      ok: true,
      topic: dueTopic.topicName,
      articleId: inserted.id,
      title: inserted.title,
      articlesCreated: 1,
      notified,
    });
  } catch (err: unknown) {
    logger.error({ err }, "Knowledge refresh cron failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

export default router;
