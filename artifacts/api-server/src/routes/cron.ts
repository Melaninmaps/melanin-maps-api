import { Router, type IRouter } from "express";
import {
  db,
  pool,
  usersTable,
  businessesTable,
  safetyCheckinsTable,
  meetupVerificationsTable,
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
  communityPostsTable,
  memberAgreementsTable,
  waitlistTable,
} from "@workspace/db";
import bcrypt from "bcryptjs";
import { and, isNotNull, lte, gt, eq, isNull, gte, inArray, or, count, sql } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  sendTrialEndingSoon,
  sendTrialEnding1Day,
  sendTrialExpired,
  sendMissionWinBack,
  sendWeeklyDigest,
  sendCheckinOverdueEmail,
  sendMeetupCheckinMissedEmail,
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
  if (!CRON_SECRET) {
    res.status(401).json({ error: "Cron secret not configured on this server." });
    return false;
  }
  const auth = req.headers["x-cron-secret"];
  if (auth !== CRON_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

/**
 * POST /cron/set-user-tier
 * CRON_SECRET authenticated. Sets memberType on a user by email.
 * Used for review account and internal tier management without requiring
 * an admin browser session.
 * Body: { email: string, memberType: string }
 */
router.post("/cron/set-user-tier", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  const { email, memberType } = req.body as { email?: string; memberType?: string };
  const VALID = ["individual", "navigator", "trailblazer", "founding", "beta", "business", "business_referral"];
  if (!email || !memberType || !VALID.includes(memberType)) {
    res.status(400).json({ error: "email and valid memberType required" });
    return;
  }
  try {
    const [updated] = await db
      .update(usersTable)
      .set({ memberType } as any)
      .where(eq(usersTable.email, email))
      .returning({ id: usersTable.id, email: usersTable.email, memberType: usersTable.memberType });
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    res.json({ ok: true, user: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update tier" });
  }
});

router.post("/cron/trial-reminders", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  const now = new Date();
  // Windows for each email type
  const in25Hours  = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const in1Day     = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const in3Days    = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    // ── 3-day reminder (2–3 days out, not yet sent) ────────────────────────
    const expiring3Day = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          gt(usersTable.trialEndsAt, in1Day),
          lte(usersTable.trialEndsAt, in3Days),
          isNotNull(usersTable.email),
          isNull(usersTable.trialReminder3DaySentAt),
        ),
      );

    // ── 1-day reminder (≤25 hours out, not yet sent) ───────────────────────
    const expiring1Day = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          gt(usersTable.trialEndsAt, now),
          lte(usersTable.trialEndsAt, in25Hours),
          isNotNull(usersTable.email),
          isNull(usersTable.trialReminder1DaySentAt),
        ),
      );

    // ── Expiry (trial ended, no subscription, not yet emailed) ────────────
    const expired = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          lte(usersTable.trialEndsAt, now),
          isNotNull(usersTable.email),
          isNull(usersTable.stripeSubscriptionId),
          isNull(usersTable.trialExpiredEmailSentAt),
        ),
      );

    // ── Win-back (expired 2–7 days ago, no subscription, not yet emailed) ─
    const winBackCandidates = await db
      .select()
      .from(usersTable)
      .where(
        and(
          isNotNull(usersTable.trialEndsAt),
          lte(usersTable.trialEndsAt, twoDaysAgo),
          gte(usersTable.trialEndsAt, sevenDaysAgo),
          isNotNull(usersTable.email),
          isNull(usersTable.stripeSubscriptionId),
          isNull(usersTable.winBackEmailSentAt),
        ),
      );

    let reminder3Sent = 0;
    let reminder1Sent = 0;
    let expiryEmailsSent = 0;
    let winBackSent = 0;

    for (const user of expiring3Day) {
      if (!user.email || !user.trialEndsAt) continue;
      const daysLeft = Math.max(2, Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      try {
        await sendTrialEndingSoon(user.email, user.firstName, user.memberType ?? "individual", user.trialEndsAt, daysLeft);
        await db.update(usersTable).set({ trialReminder3DaySentAt: now }).where(eq(usersTable.id, user.id));
        reminder3Sent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send 3-day trial reminder");
      }
    }

    for (const user of expiring1Day) {
      if (!user.email || !user.trialEndsAt) continue;
      try {
        await sendTrialEnding1Day(user.email, user.firstName, user.memberType ?? "individual", user.trialEndsAt);
        await db.update(usersTable).set({ trialReminder1DaySentAt: now }).where(eq(usersTable.id, user.id));
        reminder1Sent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send 1-day trial reminder");
      }
    }

    for (const user of expired) {
      if (!user.email) continue;
      try {
        await sendTrialExpired(user.email, user.firstName, user.memberType ?? "individual");
        await db.update(usersTable).set({ trialExpiredEmailSentAt: now }).where(eq(usersTable.id, user.id));
        expiryEmailsSent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send trial expired email");
      }
    }

    for (const user of winBackCandidates) {
      if (!user.email) continue;
      try {
        await sendMissionWinBack(user.email, user.firstName, user.memberType ?? "individual");
        await db.update(usersTable).set({ winBackEmailSentAt: now }).where(eq(usersTable.id, user.id));
        winBackSent++;
      } catch (err) {
        logger.error({ err, userId: user.id }, "Failed to send win-back email");
      }
    }

    logger.info({ reminder3Sent, reminder1Sent, expiryEmailsSent, winBackSent }, "Trial cron completed");
    res.json({ ok: true, reminder3Sent, reminder1Sent, expiryEmailsSent, winBackSent });
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
        await sendWeeklyDigest(
          user.email,
          user.firstName,
          newBusinesses.map((business) => ({ ...business, state: business.state ?? "" })),
          weekLabel,
        );
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
        model: "gpt-5-mini",
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
            const prompt = `You are a marketing advisor for "${owner.business_name}", a minority-owned ${owner.business_category} business${owner.business_city ? ` in ${owner.business_city}` : ""}.

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
              model: "gpt-5-mini",
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
            model: "gpt-5-mini",
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

// ─── POST /cron/meetup-checkins ──────────────────────────────────────────────
// Alerts safety friends when a meetup arrival or home check-in is missed.
// Privacy: alerts go ONLY to the designated safety friend — never to the meetup partner.
router.post("/cron/meetup-checkins", async (req, res): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  const now = new Date();
  // 15-minute grace period before sending alert
  const gracePeriodMs = 15 * 60 * 1000;
  const alertThreshold = new Date(now.getTime() - gracePeriodMs);

  try {
    // Find overdue arrival check-ins (not yet confirmed, past grace period, no alert sent yet)
    const overdueArrival = await db
      .select({
        id: meetupVerificationsTable.id,
        initiatorId: meetupVerificationsTable.initiatorId,
        arrivalCheckAt: meetupVerificationsTable.arrivalCheckAt,
        location: meetupVerificationsTable.location,
        safetyFriendEmail: meetupVerificationsTable.safetyFriendEmail,
        safetyFriendName: meetupVerificationsTable.safetyFriendName,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(meetupVerificationsTable)
      .leftJoin(usersTable, eq(usersTable.id, meetupVerificationsTable.initiatorId))
      .where(and(
        eq(meetupVerificationsTable.arrivalCheckStatus, "pending"),
        lte(meetupVerificationsTable.arrivalCheckAt, alertThreshold),
        isNull(meetupVerificationsTable.arrivalAlertSentAt),
        isNull(meetupVerificationsTable.clearedAt),
        isNotNull(meetupVerificationsTable.safetyFriendEmail),
      ));

    // Find overdue home check-ins
    const overdueHome = await db
      .select({
        id: meetupVerificationsTable.id,
        initiatorId: meetupVerificationsTable.initiatorId,
        homeCheckAt: meetupVerificationsTable.homeCheckAt,
        location: meetupVerificationsTable.location,
        safetyFriendEmail: meetupVerificationsTable.safetyFriendEmail,
        safetyFriendName: meetupVerificationsTable.safetyFriendName,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
      })
      .from(meetupVerificationsTable)
      .leftJoin(usersTable, eq(usersTable.id, meetupVerificationsTable.initiatorId))
      .where(and(
        eq(meetupVerificationsTable.homeCheckStatus, "pending"),
        lte(meetupVerificationsTable.homeCheckAt, alertThreshold),
        isNull(meetupVerificationsTable.homeAlertSentAt),
        isNull(meetupVerificationsTable.clearedAt),
        isNotNull(meetupVerificationsTable.safetyFriendEmail),
      ));

    let arrivalAlerted = 0;
    let homeAlerted = 0;

    for (const row of overdueArrival) {
      if (!row.safetyFriendEmail || !row.arrivalCheckAt) continue;
      try {
        const memberName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Your friend";
        await sendMeetupCheckinMissedEmail(
          row.safetyFriendEmail,
          row.safetyFriendName,
          memberName,
          "arrival",
          row.arrivalCheckAt,
          row.location,
          row.id,
        );
        await db.update(meetupVerificationsTable)
          .set({ arrivalCheckStatus: "overdue", arrivalAlertSentAt: now })
          .where(eq(meetupVerificationsTable.id, row.id));
        arrivalAlerted++;
        if (row.initiatorId) {
          void sendPushToUser(row.initiatorId, {
            title: "⚠️ Arrival Check-In Overdue",
            body: "Your arrival check-in for your meetup is overdue. Your safety friend has been notified.",
            data: { screen: "member-connections" },
          });
        }
      } catch (err) {
        logger.error({ err, id: row.id }, "Failed to send meetup arrival alert");
      }
    }

    for (const row of overdueHome) {
      if (!row.safetyFriendEmail || !row.homeCheckAt) continue;
      try {
        const memberName = [row.firstName, row.lastName].filter(Boolean).join(" ") || "Your friend";
        await sendMeetupCheckinMissedEmail(
          row.safetyFriendEmail,
          row.safetyFriendName,
          memberName,
          "home",
          row.homeCheckAt,
          row.location,
          row.id,
        );
        await db.update(meetupVerificationsTable)
          .set({ homeCheckStatus: "overdue", homeAlertSentAt: now })
          .where(eq(meetupVerificationsTable.id, row.id));
        homeAlerted++;
        if (row.initiatorId) {
          void sendPushToUser(row.initiatorId, {
            title: "⚠️ Home Check-In Overdue",
            body: "Your home check-in for your meetup is overdue. Your safety friend has been notified.",
            data: { screen: "member-connections" },
          });
        }
      } catch (err) {
        logger.error({ err, id: row.id }, "Failed to send meetup home alert");
      }
    }

    logger.info({ arrivalAlerted, homeAlerted }, "Meetup checkin cron completed");
    res.json({ ok: true, arrivalAlerted, homeAlerted });
  } catch (err: unknown) {
    logger.error({ err }, "Meetup checkin cron failed");
    res.status(500).json({ error: "Cron failed" });
  }
});

// ─── POST /cron/seed-reviewer ─────────────────────────────────────────────────
// One-time endpoint: creates and populates the Apple reviewer demo account.
// Protected by CRON_SECRET. Safe to run multiple times (upsert pattern).
//
// Reviewer account:  reviewer@melaninmaps.com / MapReview2026!
// Tier: navigator  |  Profile: complete  |  Demo data: seeded
router.post("/cron/seed-reviewer", async (req: any, res: any): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;

  const REVIEWER_EMAIL = "reviewer@melaninmaps.com";
  const REVIEWER_PASS  = "MapReview2026!";

  try {
    const passwordHash = await bcrypt.hash(REVIEWER_PASS, 8);

    // 1. Upsert waitlist entry (approved) ──────────────────────────────────────
    await db.insert(waitlistTable).values({
      email: REVIEWER_EMAIL,
      firstName: "Apple",
      lastName:  "Reviewer",
      city:      "Philadelphia",
      status:    "approved",
      approvedAt: new Date(),
    }).onConflictDoUpdate({
      target: waitlistTable.email,
      set: { status: "approved", approvedAt: new Date() },
    });

    // 2. Create or update the reviewer user ────────────────────────────────────
    const [existing] = await db.select({ id: usersTable.id })
      .from(usersTable).where(eq(usersTable.email, REVIEWER_EMAIL)).limit(1);

    let reviewerId: string;

    if (existing) {
      reviewerId = existing.id;
      await db.update(usersTable).set({
        approved: true,
        memberType: "navigator",
        profileSetupComplete: true,
        agreeToTerms: true,
        emailVerified: true,
        passwordHash,
        firstName: "Jordan",
        lastName:  "Williams",
        username:  "jordanwilliams_mwm",
        homeCity:  "Philadelphia, PA",
        bio:       "Community explorer and local guide. Connecting people to the places that matter.",
        trustLevel: 3,
        reputationScore: 45,
      }).where(eq(usersTable.email, REVIEWER_EMAIL));
    } else {
      const [newUser] = await db.insert(usersTable).values({
        email:               REVIEWER_EMAIL,
        firstName:           "Jordan",
        lastName:            "Williams",
        username:            "jordanwilliams_mwm",
        passwordHash,
        approved:            true,
        emailVerified:       true,
        agreeToTerms:        true,
        memberType:          "navigator",
        profileSetupComplete: true,
        homeCity:            "Philadelphia, PA",
        bio:                 "Community explorer and local guide. Connecting people to the places that matter.",
        trustLevel:          3,
        reputationScore:     45,
        role:                "user",
      }).returning({ id: usersTable.id });
      reviewerId = newUser.id;
    }

    const stepErrors: Record<string, string> = {};

    // 3. Member agreements (best-effort — schema may differ in prod) ───────────
    try {
      const agreementId = `agr-${reviewerId.replace(/-/g, "").slice(0, 28)}`;
      await pool.query(
        `INSERT INTO member_agreements (id, user_id, agreement_version, platform, active)
         VALUES ($1, $2, 'v1', 'ios', true)
         ON CONFLICT (id) DO NOTHING`,
        [agreementId, reviewerId],
      );
    } catch (e: any) {
      stepErrors.agreements = e?.message ?? "failed";
    }

    // 4. Save several businesses for the reviewer ──────────────────────────────
    let savedBizCount = 0;
    try {
      const bizList = await db.select({ id: businessesTable.id })
        .from(businessesTable).limit(10);
      for (const biz of bizList) {
        try {
          await pool.query(
            `INSERT INTO saved_places (user_id, business_id, is_public)
             VALUES ($1, $2, false)
             ON CONFLICT (user_id, business_id) DO NOTHING`,
            [reviewerId, biz.id],
          );
          savedBizCount++;
        } catch { /* skip duplicates */ }
      }
    } catch (e: any) {
      stepErrors.savedPlaces = e?.message ?? "failed";
    }

    // 5. Create realistic community posts (skip if already seeded) ─────────────
    let postsCreated = 0;
    const postDefs = [
      {
        content: "Just discovered this incredible soul food spot in West Philly — the cornbread alone is worth the trip. This community keeps finding the gems I never would have found on my own.",
        category: "food", city: "Philadelphia",
      },
      {
        content: "Attended a community business fair in North Philly today. So many amazing minority-owned businesses doing incredible work. Saved all of them to my list. Proud of this city.",
        category: "community", city: "Philadelphia",
      },
      {
        content: "KinfolkAI just helped me plan the perfect weekend in Harlem — historic brownstones, jazz venues, and a farmers market I never would have known about. This platform is something special.",
        category: "travel", city: "New York",
      },
      {
        content: "Reminder that the art exhibit at the African American Museum in Philadelphia runs through next month. Powerful work — the community should see this. Free on Sundays!",
        category: "events", city: "Philadelphia",
      },
    ];
    try {
      // Only seed if the reviewer has no posts yet
      const { rows: existing } = await pool.query(
        `SELECT COUNT(*) AS n FROM community_posts WHERE author_id = $1`,
        [reviewerId],
      );
      if (parseInt(existing[0].n, 10) === 0) {
        for (const p of postDefs) {
          await pool.query(
            `INSERT INTO community_posts
               (author_id, author_name, author_initials, author_color,
                content, category, post_type, location_city, location_country,
                visibility, audience_rating)
             VALUES ($1,'Jordan W.','JW','#6B4F3A',$2,$3,'community',$4,'US','public','everyone')`,
            [reviewerId, p.content, p.category, p.city],
          );
          postsCreated++;
        }
      } else {
        postsCreated = parseInt(existing[0].n, 10);
      }
    } catch (e: any) {
      stepErrors.posts = e?.message ?? "failed";
    }

    res.json({
      ok:         Object.keys(stepErrors).length === 0,
      reviewerId,
      email:      REVIEWER_EMAIL,
      tier:       "navigator",
      savedBiz:   savedBizCount,
      posts:      postsCreated,
      stepErrors: Object.keys(stepErrors).length > 0 ? stepErrors : undefined,
      message:    "Reviewer account ready. Login: reviewer@melaninmaps.com / MapReview2026!",
    });
  } catch (err: any) {
    logger.error({ err }, "seed-reviewer failed");
    res.status(500).json({ error: err?.message ?? "Seed failed" });
  }
});

// ── POST /cron/grant-admin-tester-roles ───────────────────────────────────────
// One-shot CRON_SECRET-protected endpoint.
// Creates pending_tester_emails table if missing, grants admin to founder
// accounts, grants tester to all known testers. Safe to call multiple times.
router.post("/cron/grant-admin-tester-roles", async (req: any, res: any): Promise<void> => {
  if (!verifyCronSecret(req, res)) return;
  const results: string[] = [];
  try {
    // 1. Create pending_tester_emails table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_tester_emails (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar NOT NULL UNIQUE,
        tester_access_source varchar NOT NULL DEFAULT 'admin_invite',
        granted_by varchar,
        granted_at timestamptz NOT NULL DEFAULT NOW(),
        entitlement_ends_at timestamptz,
        applied_at timestamptz,
        applied_to_user_id varchar
      )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_pending_tester_emails_email" ON pending_tester_emails(email)`);
    results.push("table: pending_tester_emails ensured");

    // 2. Grant admin to all founder accounts
    const adminEmails = [
      "tlindsay428@yahoo.com",
      "tlindsay428@gmail.com",
      "tlindsay428@aol.com",
    ];
    const adminResult = await pool.query(
      `UPDATE users SET role='admin', updated_at=NOW()
       WHERE LOWER(TRIM(email))=ANY($1) AND role!='admin'
       RETURNING email`,
      [adminEmails]
    );
    results.push(`admin granted: [${adminResult.rows.map((r: any) => r.email).join(", ") || "already set"}]`);

    // 3. Grant tester to all known testers (never demotes admins)
    const testerEmails = [
      "cardwellkayla219@gmail.com","kcardwell17@yahoo.com","kaylacardwell3@gmail.com",
      "taleisham.saunders@gmail.com","trinalindsayhairston@gmail.com","trinalindsayhairston@gmail..com",
      "bigdot6017@gmail.com","zykiral.morton@yahoo.com","kyleisha.m.morton@gmail.com",
      "kyleisha.m.fisher@gmail.com","taleisha.fisher@gmail.com","lilanarich@gmail.com",
      "jordanwtester@gmail.com","joshuabierd99@gmail.com",
    ];
    const testerResult = await pool.query(
      `UPDATE users SET role='tester', updated_at=NOW()
       WHERE LOWER(TRIM(email))=ANY($1) AND role='user'
       RETURNING email`,
      [testerEmails]
    );
    results.push(`tester granted: [${testerResult.rows.map((r: any) => r.email).join(", ") || "already set"}]`);

    // 4. Seed pre-approved tester emails
    const preApproved = [
      // Founder test personas — no admin approval required
      "tlindsay428@gmail.com","tlindsay428@aol.com",
      // Approved testers
      "zykiral.morton@yahoo.com","kyleisha.m.morton@gmail.com","kyleisha.m.fisher@gmail.com",
      "taleisha.fisher@gmail.com","lilanarich@gmail.com","jordanwtester@gmail.com",
      "joshuabierd99@gmail.com","kaylacardwelltester@gmail.com","kevinctester@gmail.com",
      "kevkaytester@gmail.com","teiannaltester@gmail.com","trinalindsaytester@gmail.com",
      "jross215@gmail.com","kaylathomas20011@gmail.com","kansesdwilliams@gmail.com",
      "fatimccoy@icloud.com","jordanwyatt117@icloud.com","nydiahholly12@gmail.com",
      "meaparks@gmail.com","melody.brown1988@gmail.com","owcforyouth@gmail.com",
    ];
    let seeded = 0;
    for (const email of preApproved) {
      const r = await pool.query(
        `INSERT INTO pending_tester_emails (id, email, tester_access_source)
         VALUES (gen_random_uuid(),$1,'website_test') ON CONFLICT(email) DO NOTHING RETURNING id`,
        [email.toLowerCase().trim()]
      );
      if (r.rowCount && r.rowCount > 0) seeded++;
    }
    results.push(`pending_tester_emails seeded: ${seeded} new`);

    res.json({ ok: true, results });
  } catch (err: any) {
    logger.error({ err }, "grant-admin-tester-roles failed");
    res.status(500).json({ error: err?.message ?? "Failed", results });
  }
});

// ── POST /cron/create-monitor-account ────────────────────────────────────────
// One-time idempotent endpoint: creates the dedicated health-check monitoring
// account, bypassing the invite-only gate. Protected by CRON_SECRET header.
// Safe to call repeatedly — returns ok:true whether the account was created
// or already existed. Accepts email + password in the request body.
router.post("/cron/create-monitor-account", async (req: any, res: any) => {
  if (!verifyCronSecret(req, res)) return;
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email?.trim() || !password?.trim()) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    // Check for existing account
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM users WHERE lower(email) = $1 LIMIT 1`,
      [normalizedEmail],
    );
    if (existing.rows.length > 0) {
      res.json({ ok: true, created: false, reason: "already_exists" });
      return;
    }
    const { randomUUID } = await import("crypto");
    const userId = randomUUID();
    const passwordHash = await bcrypt.hash(password.trim(), 8);
    await pool.query(
      `INSERT INTO users
         (id, email, first_name, last_name, username,
          password_hash, email_verified, approved, member_type,
          tester_status, tester_access_source,
          created_at, updated_at)
       VALUES ($1,$2,'MWM','Monitor','mwm_health_monitor',
               $3,true,true,'tester',
               'active','admin_invite',
               NOW(),NOW())
       ON CONFLICT (email) DO NOTHING`,
      [userId, normalizedEmail, passwordHash],
    );
    // Grant tester entitlement so Kinfolk quota is bypassed
    await pool.query(
      `INSERT INTO tester_entitlements (user_id, entitlement_type, granted_at, is_active)
       VALUES ($1,'beta_tester',NOW(),true) ON CONFLICT DO NOTHING`,
      [userId],
    ).catch(() => {});
    logger.info({ event: "MONITOR_ACCOUNT_CREATED", email: normalizedEmail }, "monitoring account created");
    res.json({ ok: true, created: true });
  } catch (err: any) {
    logger.error({ err }, "create-monitor-account failed");
    res.status(500).json({ error: err?.message ?? "Failed" });
  }
});

export default router;

