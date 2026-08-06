import { Router, type IRouter, type Request, type Response } from "express";
import { db, businessesTable, lifeJourneysTable, userPreferencesTable, type JourneyPhase } from "@workspace/db";
import { eq, and, desc, ilike } from "drizzle-orm";
import { pool } from "@workspace/db";

const router: IRouter = Router();

type ActionType = "journey" | "smart_match" | "business" | "channel" | "discovery" | "kinfolk" | "trending";

interface NextBestAction {
  type: ActionType;
  title: string;
  reason: string;
  cta: string;
  icon: string;
  priority: number;
  data?: Record<string, unknown>;
}

const JOURNEY_ADJACENT_NEEDS: Record<string, Array<{ question: string; category: string; icon: string }>> = {
  moving: [
    { question: "Have you found a healthcare provider in your new city?", category: "Healthcare", icon: "🏥" },
    { question: "Do you have a moving company booked?", category: "Moving", icon: "🚚" },
    { question: "Have you set up a local bank account?", category: "Finance", icon: "🏦" },
    { question: "Found a salon or barber you can trust?", category: "Beauty", icon: "✂️" },
    { question: "Connected with community groups or a place of worship?", category: "Community", icon: "🤝🏾" },
  ],
  "new-baby": [
    { question: "Do you have a pediatrician lined up?", category: "Healthcare", icon: "👶🏾" },
    { question: "Have you looked into postpartum mental health support?", category: "Wellness", icon: "💆🏾" },
    { question: "Found a childcare or daycare provider?", category: "Childcare", icon: "🏫" },
    { question: "Connected with a new parent group in your area?", category: "Community", icon: "🤝🏾" },
  ],
  "starting-business": [
    { question: "Do you have a business attorney or legal advisor?", category: "Legal", icon: "⚖️" },
    { question: "Have you set up a business banking account?", category: "Finance", icon: "🏦" },
    { question: "Do you have a mental health support system in place?", category: "Wellness", icon: "💆🏾" },
    { question: "Found a coworking space or office?", category: "Coworking", icon: "💻" },
  ],
  "new-to-city": [
    { question: "Have you set up a primary care doctor?", category: "Healthcare", icon: "🏥" },
    { question: "Found a gym or wellness spot?", category: "Fitness", icon: "💪🏾" },
    { question: "Connected with local professional networks?", category: "Networking", icon: "💼" },
    { question: "Found a place of worship or community group?", category: "Community", icon: "⛪" },
  ],
  "career-change": [
    { question: "Do you have a financial safety plan for the transition?", category: "Finance", icon: "💰" },
    { question: "Have you considered a career coach or mentor?", category: "Coaching", icon: "🎯" },
    { question: "Do you have mental health support during this change?", category: "Wellness", icon: "💆🏾" },
  ],
  "getting-married": [
    { question: "Have you looked into estate planning or legal name change?", category: "Legal", icon: "⚖️" },
    { question: "Do you have financial planning support as a new household?", category: "Finance", icon: "💰" },
  ],
  retirement: [
    { question: "Do you have a healthcare coverage plan for retirement?", category: "Healthcare", icon: "🏥" },
    { question: "Have you connected with senior community groups?", category: "Community", icon: "🤝🏾" },
  ],
};

router.get("/recommend", async (req: Request, res: Response) => {
  const context = String(req.query.context ?? "home");
  const city = req.query.city ? String(req.query.city) : null;
  const limit = Math.min(parseInt(String(req.query.limit ?? "5"), 10), 10);

  const actions: NextBestAction[] = [];

  try {
    if (req.user?.id) {
      const activeJourneyRows = await db
        .select()
        .from(lifeJourneysTable)
        .where(and(eq(lifeJourneysTable.userId, req.user.id), eq(lifeJourneysTable.status, "active")))
        .orderBy(desc(lifeJourneysTable.updatedAt))
        .limit(1);

      const journey = activeJourneyRows[0] ?? null;

      if (journey) {
        const phases = journey.phases as JourneyPhase[];
        const activePhase = phases.find((p) => p.status === "active");
        const doneSteps = activePhase ? activePhase.steps.filter((s) => s.completed).length : 0;
        const totalSteps = activePhase ? activePhase.steps.length : 0;
        const remaining = totalSteps - doneSteps;

        actions.push({
          type: "journey",
          title: activePhase
            ? `Continue "${activePhase.title}" — ${remaining} step${remaining !== 1 ? "s" : ""} remaining`
            : `Your "${journey.title}" journey is ready`,
          reason: `You're actively working on your ${journey.journeyType} journey${journey.city ? ` in ${journey.city}` : ""}`,
          cta: "Continue Journey",
          icon: "🗺️",
          priority: 95,
          data: { journeyId: journey.id, journeyType: journey.journeyType, city: journey.city },
        });

        const adjacentNeeds = JOURNEY_ADJACENT_NEEDS[journey.journeyType] ?? [];
        if (adjacentNeeds.length > 0) {
          const likedCategories = await pool.query<{ category: string }>(
            `SELECT DISTINCT category FROM kinfolk_feedback WHERE user_id = $1 AND reaction = 'like' AND category IS NOT NULL`,
            [req.user.id],
          );
          const likedCats = new Set(likedCategories.rows.map((r) => r.category.toLowerCase()));

          const unanswered = adjacentNeeds.filter(
            (n) => !likedCats.has(n.category.toLowerCase()),
          );

          if (unanswered.length > 0) {
            const pick = unanswered[Math.floor(Math.random() * Math.min(unanswered.length, 3))]!;
            actions.push({
              type: "discovery",
              title: pick.question,
              reason: `People on a ${journey.journeyType} journey often need help with ${pick.category} — you haven't explored that yet`,
              cta: `Find ${pick.category} Providers`,
              icon: pick.icon,
              priority: 80,
              data: { category: pick.category, city: journey.city },
            });
          }
        }

        if (journey.city) {
          const crossCityRows = await pool.query<{ category: string; city: string; cnt: string }>(
            `SELECT category, city, COUNT(*) as cnt
             FROM kinfolk_feedback
             WHERE user_id = $1 AND reaction = 'like' AND category IS NOT NULL
               AND city IS NOT NULL AND city NOT ILIKE $2
             GROUP BY category, city ORDER BY cnt DESC LIMIT 3`,
            [req.user.id, `%${journey.city}%`],
          );

          if (crossCityRows.rows.length > 0) {
            const topCat = crossCityRows.rows[0]!;
            const newCityMatches = await pool.query<{ name: string }>(
              `SELECT name FROM businesses WHERE status = 'active' AND city ILIKE $1 AND category ILIKE $2 LIMIT 2`,
              [`%${journey.city}%`, `%${topCat.category}%`],
            );

            if (newCityMatches.rows.length > 0) {
              actions.push({
                type: "smart_match",
                title: `${topCat.category} spots found in ${journey.city} matching your ${topCat.city} saves`,
                reason: `Smart Match™ found ${newCityMatches.rows.length} verified ${topCat.category} businesses in ${journey.city} based on what you loved in ${topCat.city}`,
                cta: "See Smart Matches",
                icon: "🔗",
                priority: 85,
                data: { category: topCat.category, fromCity: topCat.city, destinationCity: journey.city, matches: newCityMatches.rows },
              });
            }
          }
        }
      }

      const prefs = await db
        .select()
        .from(userPreferencesTable)
        .where(eq(userPreferencesTable.userId, req.user.id))
        .limit(1);

      const userCity = city ?? journey?.city ?? (prefs[0]?.favoriteCities?.[0] ?? null);

      if (userCity) {
        const trending = await pool.query<{ id: string; name: string; category: string; city: string; verified: boolean }>(
          `SELECT b.id, b.name, b.category, b.city, b.verified
           FROM community_signals cs JOIN businesses b ON cs.entity_id = b.id
           WHERE cs.entity_type = 'business' AND cs.city ILIKE $1
             AND cs.created_at > NOW() - INTERVAL '30 days'
             AND b.status = 'active'
           GROUP BY b.id, b.name, b.category, b.city, b.verified
           ORDER BY COUNT(*) DESC LIMIT 3`,
          [`%${userCity}%`],
        );

        if (trending.rows.length > 0) {
          actions.push({
            type: "trending",
            title: `Trending in ${userCity} right now`,
            reason: `Community members in ${userCity} are saving these businesses most this month`,
            cta: "Explore Trending",
            icon: "🔥",
            priority: 60,
            data: { businesses: trending.rows, city: userCity },
          });
        } else {
          const fallback = await db
            .select({ id: businessesTable.id, name: businessesTable.name, category: businessesTable.category, city: businessesTable.city, verified: businessesTable.verified })
            .from(businessesTable)
            .where(and(ilike(businessesTable.city, `%${userCity}%`), eq(businessesTable.status, "active")))
            .limit(3);

          if (fallback.length > 0) {
            actions.push({
              type: "business",
              title: `Discover minority-owned businesses in ${userCity}`,
              reason: "Community-verified businesses in your area",
              cta: "Browse Businesses",
              icon: "🏪",
              priority: 55,
              data: { businesses: fallback, city: userCity },
            });
          }
        }
      }

      if (!journey) {
        actions.push({
          type: "journey",
          title: "Start a Life Journey™",
          reason: "Tell us what you're working toward and KinfolkAI™ will build you a personalized, step-by-step guide",
          cta: "Start a Journey",
          icon: "✨",
          priority: 70,
          data: {},
        });
      }
    } else {
      actions.push(
        {
          type: "kinfolk",
          title: "Ask KinfolkAI™ anything",
          reason: "Your AI travel companion — ask about businesses, neighborhoods, safety, or what to do next",
          cta: "Chat with KinfolkAI",
          icon: "✨",
          priority: 90,
          data: {},
        },
        {
          type: "journey",
          title: "Start a Life Journey™",
          reason: "Get a personalized roadmap for your next big chapter — moving, business, new baby, and more",
          cta: "Get Started",
          icon: "🗺️",
          priority: 75,
          data: {},
        },
      );

      if (city) {
        const localBiz = await db
          .select({ id: businessesTable.id, name: businessesTable.name, category: businessesTable.category, city: businessesTable.city })
          .from(businessesTable)
          .where(and(ilike(businessesTable.city, `%${city}%`), eq(businessesTable.status, "active")))
          .limit(3);

        if (localBiz.length > 0) {
          actions.push({
            type: "business",
            title: `minority-owned businesses in ${city}`,
            reason: "Community-verified and trusted by locals",
            cta: "Browse Businesses",
            icon: "🏪",
            priority: 60,
            data: { businesses: localBiz, city },
          });
        }
      }
    }

    actions.sort((a, b) => b.priority - a.priority);

    res.json({
      context,
      nextBestActions: actions.slice(0, limit),
      meta: {
        authenticated: !!req.user?.id,
        city,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    req.log.error({ err }, "Recommendation engine error");
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

export { router as recommendRouter };
