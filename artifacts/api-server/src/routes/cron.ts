import { Router, type IRouter } from "express";
import {
  db,
  pool,
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
  savedPlacesTable,
  businessProfileViewsTable,
  marketplaceFeeConfigTable,
  reviewsTable,
} from "@workspace/db";
import { and, isNotNull, lte, gt, eq, isNull, gte, inArray, or, count, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  sendTrialEndingSoon,
  sendTrialExpired,
  sendWeeklyDigest,
  sendCheckinOverdueEmail,
  sendFoundingAnniversaryEmail,
  sendWeeklyBusinessReport,
  type FoundingAnniversaryMetrics,
  type WeeklyBusinessReportData,
} from "../lib/email";
import { logger } from "../lib/logger";
import { sendPushToUser } from "../lib/pushNotifications";

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
        // Also push in-app alert to the user who set up the check-in
        if (row.userId) {
          void sendPushToUser(row.userId, {
            title: "⚠️ Safety Check-In Overdue",
            body: `Your scheduled check-in${row.location ? ` at ${row.location}` : ""} is overdue. Your trusted contact has been notified.`,
            data: { screen: "safety-hub" },
          });
        }
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
  { topicName: "minority-owned restaurants and food traditions", category: "food", tier: "free", description: "Soul food, African diaspora cuisine, finding and supporting Black chefs" },
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
      topicId: dueTopic.id,
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

// ─── POST /cron/weekly-business-report ────────────────────────────────────────
// Runs weekly. Finds Navigator/Trailblazer business owners and sends each a
// personalised marketing report: traffic, engagement, AI marketing tip.
router.post("/cron/weekly-business-report", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  const now = new Date();
  const sevenDaysAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const weekLabel =
    sevenDaysAgo.toLocaleDateString("en-US", { month: "long", day: "numeric" }) +
    " – " +
    now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const HOUR_LABELS: Record<number, string> = { 0:"midnight",1:"1am",2:"2am",3:"3am",4:"4am",5:"5am",6:"6am",7:"7am",8:"8am",9:"9am",10:"10am",11:"11am",12:"noon",13:"1pm",14:"2pm",15:"3pm",16:"4pm",17:"5pm",18:"6pm",19:"7pm",20:"8pm",21:"9pm",22:"10pm",23:"11pm" };

  let sent = 0;
  let failed = 0;

  try {
    // ── 1. Find premium business owners with email ───────────────────────────
    const { rows: bizOwners } = await pool.query<{
      business_id: string;
      business_name: string;
      business_category: string;
      business_city: string | null;
      user_id: string;
      email: string;
      first_name: string | null;
      member_type: string | null;
    }>(`
      SELECT b.id AS business_id, b.name AS business_name, b.category AS business_category,
             b.city AS business_city, u.id AS user_id, u.email, u.first_name, u.member_type
      FROM businesses b
      JOIN users u ON u.id = b.submitted_by_id
      WHERE u.member_type IN ('navigator','trailblazer')
        AND u.email IS NOT NULL
        AND b.status = 'active'
        AND b.black_owned = true
    `);

    if (bizOwners.length === 0) {
      res.json({ ok: true, sent: 0, failed: 0, message: "No eligible business owners found" });
      return;
    }

    for (const owner of bizOwners) {
      try {
        const tier = (owner.member_type === "trailblazer" ? "trailblazer" : "navigator") as "navigator" | "trailblazer";

        // ── 2. Pull this-week vs last-week metrics in parallel ───────────────
        const [[thisViews], [lastViews], [thisSaves], [lastSaves], [thisReviews], [lastReviews]] = await Promise.all([
          db.select({ c: count() }).from(businessProfileViewsTable)
            .where(and(eq(businessProfileViewsTable.businessId, owner.business_id), gte(businessProfileViewsTable.viewedAt, sevenDaysAgo))),
          db.select({ c: count() }).from(businessProfileViewsTable)
            .where(and(eq(businessProfileViewsTable.businessId, owner.business_id), gte(businessProfileViewsTable.viewedAt, fourteenDaysAgo), lte(businessProfileViewsTable.viewedAt, sevenDaysAgo))),
          db.select({ c: count() }).from(savedPlacesTable)
            .where(and(eq(savedPlacesTable.businessId, owner.business_id), gte(savedPlacesTable.createdAt, sevenDaysAgo))),
          db.select({ c: count() }).from(savedPlacesTable)
            .where(and(eq(savedPlacesTable.businessId, owner.business_id), gte(savedPlacesTable.createdAt, fourteenDaysAgo), lte(savedPlacesTable.createdAt, sevenDaysAgo))),
          db.select({ c: count() }).from(reviewsTable)
            .where(and(eq(reviewsTable.businessId, owner.business_id), gte(reviewsTable.createdAt, sevenDaysAgo))),
          db.select({ c: count() }).from(reviewsTable)
            .where(and(eq(reviewsTable.businessId, owner.business_id), gte(reviewsTable.createdAt, fourteenDaysAgo), lte(reviewsTable.createdAt, sevenDaysAgo))),
        ]);

        const views = Number(thisViews?.c ?? 0);
        const saves = Number(thisSaves?.c ?? 0);
        const reviews = Number(thisReviews?.c ?? 0);
        const prevViews = Number(lastViews?.c ?? 0);
        const prevSaves = Number(lastSaves?.c ?? 0);
        const prevReviews = Number(lastReviews?.c ?? 0);

        const pctChange = (cur: number, prev: number) =>
          prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

        // ── 3. Peak day/hour from last 30 days ─────────────────────────────
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const [peakDayRow, peakHourRow] = await Promise.all([
          db.select({
            dow: sql<number>`EXTRACT(DOW FROM ${businessProfileViewsTable.viewedAt})`,
            c: count(),
          }).from(businessProfileViewsTable)
            .where(and(eq(businessProfileViewsTable.businessId, owner.business_id), gte(businessProfileViewsTable.viewedAt, thirtyDaysAgo)))
            .groupBy(sql`EXTRACT(DOW FROM ${businessProfileViewsTable.viewedAt})`)
            .orderBy(sql`count(*) DESC`)
            .limit(1),
          db.select({
            hour: sql<number>`EXTRACT(HOUR FROM ${businessProfileViewsTable.viewedAt})`,
            c: count(),
          }).from(businessProfileViewsTable)
            .where(and(eq(businessProfileViewsTable.businessId, owner.business_id), gte(businessProfileViewsTable.viewedAt, thirtyDaysAgo)))
            .groupBy(sql`EXTRACT(HOUR FROM ${businessProfileViewsTable.viewedAt})`)
            .orderBy(sql`count(*) DESC`)
            .limit(1),
        ]);

        const peakDay = DAY_LABELS[Number(peakDayRow[0]?.dow ?? 5)] ?? "Friday";
        const peakHour = HOUR_LABELS[Number(peakHourRow[0]?.hour ?? 12)] ?? "noon";

        // ── 4. Avg rating ──────────────────────────────────────────────────
        const [ratingRow] = await db.select({
          avg: sql<number>`ROUND(AVG(${reviewsTable.rating})::numeric, 1)`,
        }).from(reviewsTable).where(eq(reviewsTable.businessId, owner.business_id));
        const avgRating = ratingRow?.avg ? Number(ratingRow.avg) : null;

        // ── 5. Generate AI marketing tip ───────────────────────────────────
        let aiMarketingTip = `Post consistently around ${peakDay} ${peakHour} when your audience is most active — even one piece of content per week during your peak window can meaningfully lift visibility.`;
        let topActionItem: string | undefined;

        if (openai) {
          try {
            const prompt = `You are a marketing advisor for "${owner.business_name}", a Black-owned ${owner.business_category} business${owner.business_city ? ` in ${owner.business_city}` : ""}.

This week's performance:
- Profile views: ${views} (${pctChange(views, prevViews) >= 0 ? "+" : ""}${pctChange(views, prevViews)}% vs last week)
- Community saves: ${saves} (${pctChange(saves, prevSaves) >= 0 ? "+" : ""}${pctChange(saves, prevSaves)}% vs last week)
- New reviews: ${reviews}${avgRating ? `, avg rating ${avgRating.toFixed(1)}★` : ""}
- Peak engagement: ${peakDay}s around ${peakHour}

Return ONLY this JSON (no markdown):
{
  "tip": "2-3 sentence actionable marketing tip for this week, specific to their metrics and business type. Warm, community-centered, Black business empowerment tone.",
  "action": "One specific thing they should do THIS WEEK — under 25 words."
}`;

            const completion = await openai.chat.completions.create({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.7,
              max_tokens: 200,
            });
            const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
            const parsed = JSON.parse(raw) as { tip?: string; action?: string };
            if (parsed.tip) aiMarketingTip = parsed.tip;
            if (parsed.action) topActionItem = parsed.action;
          } catch { /* use fallback tip */ }
        }

        // ── 6. Send email ──────────────────────────────────────────────────
        const reportData: WeeklyBusinessReportData = {
          businessName: owner.business_name,
          tier,
          weekLabel,
          views,
          viewsChange: pctChange(views, prevViews),
          saves,
          savesChange: pctChange(saves, prevSaves),
          reviews,
          reviewsChange: pctChange(reviews, prevReviews),
          avgRating,
          peakDay,
          peakHour,
          aiMarketingTip,
          topActionItem,
        };

        await sendWeeklyBusinessReport(owner.email, owner.first_name, reportData);
        sent++;

        // Throttle to avoid Resend rate limits
        await new Promise((r) => setTimeout(r, 500));
      } catch (bizErr) {
        logger.error({ bizErr, bizId: owner.business_id }, "Weekly business report failed for owner");
        failed++;
      }
    }

    logger.info({ sent, failed, total: bizOwners.length }, "Weekly business report cron completed");
    res.json({ ok: true, sent, failed, total: bizOwners.length, weekLabel });
  } catch (err: unknown) {
    logger.error({ err }, "Weekly business report cron failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

// ─── POST /cron/founding-anniversary ─────────────────────────────────────────
// Runs daily. Finds founding businesses whose anniversary (month+day) matches
// today, pulls their metrics, generates an AI fee-savings message, and sends
// the annual anniversary email. Safe to run every day — only matching businesses
// receive mail.
router.post("/cron/founding-anniversary", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  let sent = 0;
  let failed = 0;
  try {
    // ── 1. Find founding businesses whose anniversary is today (not first year)
    const { rows: foundingBizzes } = await pool.query<{
      id: string;
      name: string;
      founding_number: number;
      founding_granted_at: Date;
      review_count: number;
      rating: string | null;
      submitted_by_id: string | null;
      locked_fee: string | null;
      business_status: string;
      email: string | null;
      first_name: string | null;
      last_name: string | null;
    }>(
      `SELECT b.id, b.name, b.founding_number, b.founding_granted_at,
              b.review_count, b.rating::text, b.submitted_by_id,
              b.locked_fee::text, b.business_status,
              u.email, u.first_name, u.last_name
       FROM businesses b
       LEFT JOIN users u ON u.id = b.submitted_by_id
       WHERE b.founding_business = true
         AND b.black_owned = true
         AND b.founding_granted_at IS NOT NULL
         AND EXTRACT(MONTH FROM b.founding_granted_at) = EXTRACT(MONTH FROM CURRENT_DATE)
         AND EXTRACT(DAY   FROM b.founding_granted_at) = EXTRACT(DAY   FROM CURRENT_DATE)
         AND EXTRACT(YEAR  FROM b.founding_granted_at) < EXTRACT(YEAR  FROM CURRENT_DATE)`,
    );

    if (foundingBizzes.length === 0) {
      res.json({ sent: 0, failed: 0, message: "No anniversaries today" });
      return;
    }

    // ── 2. Load fee configs once (used for all businesses)
    const feeConfigs = await db.select().from(marketplaceFeeConfigTable);

    for (const biz of foundingBizzes) {
      try {
        if (!biz.email) continue;

        const yearsActive = new Date().getFullYear() - new Date(biz.founding_granted_at).getFullYear();

        // ── 3. Pull per-business metrics in parallel
        const [viewsResult, savesResult] = await Promise.all([
          db
            .select({ total: count() })
            .from(businessProfileViewsTable)
            .where(eq(businessProfileViewsTable.businessId, biz.id)),
          db
            .select({ total: count() })
            .from(savedPlacesTable)
            .where(eq(savedPlacesTable.businessId, biz.id)),
        ]);

        const profileViews = viewsResult[0]?.total ?? 0;
        const saves = savesResult[0]?.total ?? 0;
        const reviews = biz.review_count ?? 0;
        const rating = biz.rating ? parseFloat(biz.rating) : 0;

        // ── 4. Compute fee rates
        const tier = biz.business_status || "community";
        const cfg = feeConfigs.find((c) => c.tier === tier);
        const standardFeePercent = cfg ? Math.round(Number(cfg.standardFee) * 100) : 10;
        const foundingFeePercent = biz.locked_fee
          ? Math.round(Number(biz.locked_fee) * 100)
          : cfg
          ? Math.round(Number(cfg.foundingFee) * 100)
          : 5;

        // Estimate annual savings: fee diff × conservative $1,000 of marketplace activity per review
        const estimatedVolume = Math.max(reviews * 1000, 5000); // at least $5k baseline
        const feeDiff = (standardFeePercent - foundingFeePercent) / 100;
        const feeSavedEst = parseFloat((estimatedVolume * feeDiff).toFixed(2));

        // ── 5. Generate AI fee-savings message
        let aiMessage = `Your ${foundingFeePercent}% founding rate — compared to the standard ${standardFeePercent}% — means every dollar you earn on the platform goes further. That's real money reinvested directly back into ${biz.name}.`;
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            max_tokens: 120,
            messages: [
              {
                role: "system",
                content:
                  "You write warm, celebratory 2-3 sentence messages for minority-owned business owners on their Founding Business anniversary. Tone: genuine pride, community love, business empowerment. Never use the word 'vibrant'. Be specific with numbers. End with a line that makes them feel seen.",
              },
              {
                role: "user",
                content: `Write an anniversary fee-savings message for ${biz.name} (${yearsActive}-year anniversary).
Facts:
- Profile views: ${profileViews.toLocaleString()}
- Community saves: ${saves.toLocaleString()}
- Reviews: ${reviews}, Avg rating: ${rating > 0 ? rating.toFixed(1) : "not yet rated"}
- Founding fee: ${foundingFeePercent}% (vs standard ${standardFeePercent}%)
- Estimated fee savings this year: $${feeSavedEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Frame it as: "You had activity totaling [engagement], and your founding rate helped you reinvest approximately $${feeSavedEst.toFixed(0)} back into your business this year."
Keep it under 75 words. Use their business name naturally.`,
              },
            ],
          });
          aiMessage = completion.choices[0]?.message?.content?.trim() ?? aiMessage;
        } catch (aiErr) {
          logger.warn({ aiErr, bizId: biz.id }, "AI message generation failed — using fallback");
        }

        // ── 6. Send the anniversary email
        const metrics: FoundingAnniversaryMetrics = {
          profileViews: Number(profileViews),
          saves: Number(saves),
          reviews,
          rating,
          foundingFeePercent,
          standardFeePercent,
          feeSavedEst,
        };

        await sendFoundingAnniversaryEmail(
          biz.email,
          biz.first_name,
          biz.name,
          biz.founding_number,
          yearsActive,
          metrics,
          aiMessage,
        );
        sent++;
      } catch (bizErr) {
        logger.error({ bizErr, bizId: biz.id }, "Founding anniversary email failed for business");
        failed++;
      }
    }

    logger.info({ sent, failed, total: foundingBizzes.length }, "Founding anniversary cron completed");
    res.json({ sent, failed, total: foundingBizzes.length });
  } catch (err) {
    logger.error({ err }, "Founding anniversary cron failed");
    res.status(500).json({ error: "Cron job failed" });
  }
});

export default router;

