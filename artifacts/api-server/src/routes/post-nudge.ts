import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, businessProfileViewsTable, businessIdentityTable, reviewsTable } from "@workspace/db";
import { and, eq, gt, sql, count, desc } from "drizzle-orm";
import { sendPushToUser } from "../lib/pushNotifications";
import { logger } from "../lib/logger";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): string | null {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required", code: "AUTH_REQUIRED" }); return null; }
  return req.user.id;
}

const HOUR_LABELS: Record<number, string> = {
  0: "midnight", 1: "1am", 2: "2am", 3: "3am", 4: "4am", 5: "5am",
  6: "6am", 7: "7am", 8: "8am", 9: "9am", 10: "10am", 11: "11am",
  12: "noon", 13: "1pm", 14: "2pm", 15: "3pm", 16: "4pm", 17: "5pm",
  18: "6pm", 19: "7pm", 20: "8pm", 21: "9pm", 22: "10pm", 23: "11pm",
};

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatPeakHours(hours: number[]): string {
  if (hours.length === 0) return "midday";
  if (hours.length === 1) return HOUR_LABELS[hours[0]] ?? "midday";
  return hours.map((h) => HOUR_LABELS[h] ?? `${h}:00`).join(" and ");
}

function buildNudgeMessage(isNearPeak: boolean, bestTimeLabel: string, businessName: string): string {
  if (isNearPeak) {
    return `Your customers are most active right now, ${businessName}. This is your window — post something and watch the engagement roll in.`;
  }
  return `Your peak engagement window is usually around ${bestTimeLabel}. Drop a post before then and let your community know what's happening.`;
}

function buildSuggestedCaption(category: string, businessName: string): string {
  const categoryMap: Record<string, string[]> = {
    "Restaurant": [
      `Fresh, made with love — come through today! 🍽️ #BlackOwned #${businessName.replace(/\s+/g, "")}`,
      `Today's specials are fire. Come eat good and support the culture. 🔥`,
    ],
    "Beauty": [
      `Slots are open this week — book now and glow up with us. ✨ #BlackOwned`,
      `Your glow is calling. Come through and let us take care of you. 💅🏾`,
    ],
    "Retail": [
      `New arrivals just dropped — come see what's fresh in the store. 🛍️ #ShopBlack`,
      `Shopping Black is a lifestyle. Come through and find something you love. ✊🏾`,
    ],
    "Health": [
      `Your wellness journey starts here. Book a session and invest in yourself. 🌿`,
      `Healing and health for our community — come through and let's talk. 💚`,
    ],
    "Fitness": [
      `Community sweat sessions — all levels welcome. Come get it in with us. 💪🏾`,
      `Consistency is culture. Let's build together — drop in this week. 🏋🏾`,
    ],
    "Professional Services": [
      `Let's build something together. Your vision, our expertise. 🤝🏾 #BlackBusiness`,
      `We're booking consultations this week — let's talk about your goals. 📊`,
    ],
    "Entertainment": [
      `Something special is happening here — you don't want to miss it. 🎶`,
      `Good vibes, great people, unforgettable experience. Come through. ✨`,
    ],
  };

  const options = categoryMap[category] ?? [
    `Come support the culture — we're open and ready to serve our community. ✊🏾 #BlackOwned`,
    `When you support a minority-owned business, you support a whole community. Thank you for rolling with us. 💚`,
  ];

  return options[Math.floor(Math.random() * options.length)];
}

// ─── GET /api/businesses/mine/post-nudge ──────────────────────────────────────
router.get("/businesses/mine/post-nudge", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate views by hour of day (0-23) over the last 30 days
    const hourRows = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${businessProfileViewsTable.viewedAt})`,
        count: count(),
      })
      .from(businessProfileViewsTable)
      .where(
        and(
          eq(businessProfileViewsTable.businessId, business.id),
          gt(businessProfileViewsTable.viewedAt, thirtyDaysAgo),
        ),
      )
      .groupBy(sql`EXTRACT(HOUR FROM ${businessProfileViewsTable.viewedAt})`);

    // Aggregate views by day of week (0=Sun, 6=Sat)
    const dayRows = await db
      .select({
        dow: sql<number>`EXTRACT(DOW FROM ${businessProfileViewsTable.viewedAt})`,
        count: count(),
      })
      .from(businessProfileViewsTable)
      .where(
        and(
          eq(businessProfileViewsTable.businessId, business.id),
          gt(businessProfileViewsTable.viewedAt, thirtyDaysAgo),
        ),
      )
      .groupBy(sql`EXTRACT(DOW FROM ${businessProfileViewsTable.viewedAt})`);

    const totalViews = hourRows.reduce((s, r) => s + r.count, 0);

    // Find top 3 peak hours
    const sortedHours = [...hourRows].sort((a, b) => b.count - a.count);
    const peakHours = sortedHours.slice(0, 3).map((r) => Number(r.hour)).sort((a, b) => a - b);

    // Find top 2 peak days
    const sortedDays = [...dayRows].sort((a, b) => b.count - a.count);
    const peakDays = sortedDays.slice(0, 2).map((r) => DAY_LABELS[Number(r.dow)] ?? "").filter(Boolean);

    // Check if current server hour is near a peak (±1)
    const currentHour = new Date().getUTCHours();
    const isNearPeak = peakHours.some((h) => Math.abs(h - currentHour) <= 1);

    const bestTimeLabel = peakHours.length > 0
      ? formatPeakHours(peakHours)
      : "midday";

    const topDayLabel = peakDays.length > 0
      ? peakDays.join(" and ")
      : "weekends";

    const nudgeMessage = buildNudgeMessage(isNearPeak, bestTimeLabel, business.name);
    const suggestedCaption = buildSuggestedCaption(business.category, business.name);

    const hourDistribution: Record<string, number> = {};
    for (const row of hourRows) {
      hourDistribution[HOUR_LABELS[Number(row.hour)] ?? `${row.hour}h`] = row.count;
    }

    logger.info({ businessId: business.id, isNearPeak, peakHours }, "[post-nudge] served");

    res.json({
      businessId: business.id,
      businessName: business.name,
      peakHours,
      peakDays,
      isNearPeak,
      currentHour,
      viewsThisMonth: totalViews,
      bestTimeLabel,
      topDayLabel,
      nudgeMessage,
      suggestedCaption,
      hourDistribution,
      hasSufficientData: totalViews >= 5,
    });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/post-nudge error");
    res.status(500).json({ error: "Failed to load engagement nudge." });
  }
});

// ─── POST /api/businesses/mine/post-nudge/notify ──────────────────────────────
// Sends a push notification to the business owner at peak time
router.post("/businesses/mine/post-nudge/notify", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const [business] = await db
      .select({ id: businessesTable.id, name: businessesTable.name, category: businessesTable.category })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    const caption = buildSuggestedCaption(business.category, business.name);

    await sendPushToUser(userId, {
      title: `KinfolkAI™ · Time to post, ${business.name}`,
      body: "Your customers are most active right now — tap to post and catch them while they're here.",
      data: {
        type: "post_nudge",
        screen: "community",
        compose: true,
        suggestedCaption: caption,
        businessId: business.id,
      },
    });

    logger.info({ businessId: business.id, userId }, "[post-nudge] push notification sent");
    res.json({ sent: true });
  } catch (err) {
    req.log.error({ err }, "POST /businesses/mine/post-nudge/notify error");
    res.status(500).json({ error: "Failed to send nudge notification." });
  }
});

// ─── GET /api/businesses/mine/post-nudge/captions ─────────────────────────────
// Returns 3 AI-generated creative post captions personalised to the business
router.get("/businesses/mine/post-nudge/captions", async (req: Request, res: Response) => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  try {
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, userId))
      .limit(1);

    if (!business) {
      res.status(404).json({ error: "No business found for your account." });
      return;
    }

    // Pull recent review snippets for context (non-blocking if unavailable)
    let reviewSnippets = "";
    try {
      const recentReviews = await db
        .select({ rating: reviewsTable.rating, text: reviewsTable.text })
        .from(reviewsTable)
        .where(eq(reviewsTable.businessId, business.id))
        .orderBy(desc(reviewsTable.createdAt))
        .limit(5);
      if (recentReviews.length > 0) {
        reviewSnippets = recentReviews
          .filter((r) => r.text)
          .map((r) => `"${(r.text ?? "").slice(0, 120)}" (${r.rating}★)`)
          .join("\n");
      }
    } catch { /* non-critical */ }

    // Pull business identity for personalisation
    let identityCtx = "";
    try {
      const [identity] = await db
        .select()
        .from(businessIdentityTable)
        .where(eq(businessIdentityTable.businessId, business.id))
        .limit(1);
      if (identity) {
        const parts: string[] = [];
        if (identity.missionStatement) parts.push(`Mission: ${identity.missionStatement.slice(0, 150)}`);
        if (identity.vibes?.length) parts.push(`Vibes: ${identity.vibes.join(", ")}`);
        if (identity.communityValues?.length) parts.push(`Values: ${identity.communityValues.join(", ")}`);
        if (identity.audiencesServed?.length) parts.push(`Serves: ${identity.audiencesServed.join(", ")}`);
        if (parts.length) identityCtx = `\nBUSINESS IDENTITY:\n${parts.join("\n")}`;
      }
    } catch { /* non-critical */ }

    if (!openai) {
      // Fallback to static captions when AI is unavailable
      const captions = [
        buildSuggestedCaption(business.category, business.name),
        buildSuggestedCaption(business.category, business.name),
        buildSuggestedCaption(business.category, business.name),
      ];
      res.json({ captions, aiGenerated: false });
      return;
    }

    const currentHour = new Date().getHours();
    const timeOfDay = currentHour < 12 ? "morning" : currentHour < 17 ? "afternoon" : "evening";

    const prompt = `You are a creative social media manager for "${business.name}", a Black-owned ${business.category} business in ${business.city ?? "our city"}.${identityCtx}

${reviewSnippets ? `RECENT CUSTOMER FEEDBACK:\n${reviewSnippets}\n` : ""}
Write 3 SHORT, engaging social media captions for a community post right now (${timeOfDay}). Each caption should:
- Feel authentic, warm, and community-centered
- Reference Black culture, excellence, and/or community love naturally (not forced)
- Include 1–2 relevant emojis
- End with 1–2 hashtags (#BlackOwned is encouraged, add a business-specific tag)
- Be under 160 characters each
- Vary in tone: one energetic/hype, one warm/inviting, one storytelling/reflective

Return ONLY a JSON array of 3 strings, no markdown, no keys, just the array:
["caption 1", "caption 2", "caption 3"]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.85,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "[]";
    let captions: string[] = [];
    try {
      captions = JSON.parse(raw) as string[];
      if (!Array.isArray(captions) || captions.length === 0) throw new Error("bad parse");
    } catch {
      // Fallback
      captions = [buildSuggestedCaption(business.category, business.name)];
    }

    logger.info({ businessId: business.id, count: captions.length }, "[post-nudge] AI captions generated");
    res.json({ captions, aiGenerated: true });
  } catch (err) {
    req.log.error({ err }, "GET /businesses/mine/post-nudge/captions error");
    res.status(500).json({ error: "Failed to generate captions." });
  }
});

export default router;
