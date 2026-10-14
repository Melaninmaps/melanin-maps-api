import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { db, pool, lifeJourneysTable, businessesTable, type JourneyPhase } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";

const router: IRouter = Router();

const JOURNEY_TEMPLATES: Record<string, { phases: Array<{ id: string; title: string; icon: string; description: string; categories: string[] }> }> = {
  moving: {
    phases: [
      { id: "neighborhoods", title: "Neighborhood Research", icon: "🏘️", description: "Find the right community for your lifestyle", categories: ["Real Estate", "Community"] },
      { id: "realtors", title: "Find a Realtor", icon: "🏠", description: "Connect with minority-owned real estate agents", categories: ["Real Estate"] },
      { id: "mortgage", title: "Mortgage & Financing", icon: "💰", description: "Get pre-approved with community lenders", categories: ["Finance", "Banking"] },
      { id: "movers", title: "Moving Companies", icon: "🚚", description: "Book trustworthy movers", categories: ["Moving", "Transportation"] },
      { id: "utilities", title: "Set Up Utilities", icon: "⚡", description: "Electricity, internet, and home services", categories: ["Home Services"] },
      { id: "healthcare", title: "Find a Doctor", icon: "🏥", description: "Primary care, specialists, and dentists", categories: ["Healthcare", "Medical"] },
      { id: "schools", title: "Schools & Education", icon: "🎓", description: "Research schools and childcare options", categories: ["Education", "Childcare"] },
      { id: "salons", title: "Beauty & Grooming", icon: "✂️", description: "Your go-to salon, barber, and spa", categories: ["Beauty", "Salon", "Barbershop"] },
      { id: "restaurants", title: "Restaurants & Food", icon: "🍽️", description: "Build your regular spots", categories: ["Restaurant", "Food", "Café"] },
      { id: "community", title: "Community & Events", icon: "🤝🏾", description: "Find your people and local events", categories: ["Community", "Events", "Groups"] },
      { id: "employment", title: "Career & Employment", icon: "💼", description: "Job boards, networking, and local employers", categories: ["Employment", "Networking"] },
      { id: "safety", title: "Safety & Security", icon: "🛡️", description: "Understand your neighborhood safety profile", categories: ["Safety"] },
    ],
  },
  "new-baby": {
    phases: [
      { id: "healthcare", title: "OB-GYN & Midwife", icon: "👶🏾", description: "Find your birth team", categories: ["Healthcare", "OBGYN"] },
      { id: "pediatricians", title: "Pediatricians", icon: "🏥", description: "Choose your baby's doctor", categories: ["Healthcare", "Pediatrics"] },
      { id: "childcare", title: "Childcare & Daycare", icon: "🏫", description: "Find trusted childcare providers", categories: ["Childcare", "Daycare"] },
      { id: "baby-stores", title: "Baby Essentials", icon: "🧸", description: "minority-owned baby boutiques and shops", categories: ["Baby", "Retail"] },
      { id: "community", title: "New Parent Groups", icon: "🤝🏾", description: "Connect with other parents", categories: ["Community", "Events"] },
      { id: "wellness", title: "Postpartum Wellness", icon: "💆🏾", description: "Mental health and body wellness support", categories: ["Healthcare", "Wellness", "Spa"] },
    ],
  },
  "career-change": {
    phases: [
      { id: "assessment", title: "Skills & Direction", icon: "🎯", description: "Identify your strengths and target role", categories: ["Education", "Coaching"] },
      { id: "education", title: "Training & Education", icon: "🎓", description: "Courses, certifications, and upskilling", categories: ["Education", "Training"] },
      { id: "networking", title: "Networking & Mentorship", icon: "🤝🏾", description: "Build your professional circle", categories: ["Networking", "Mentorship"] },
      { id: "workspace", title: "Coworking & Office", icon: "💼", description: "Find a workspace to focus and grow", categories: ["Coworking", "Office"] },
      { id: "employment", title: "Job Search & Placement", icon: "🔍", description: "Recruiters, job boards, and agencies", categories: ["Employment", "Recruiting"] },
    ],
  },
  "new-to-city": {
    phases: [
      { id: "neighborhoods", title: "Find Your Neighborhood", icon: "🏘️", description: "Learn which area fits your vibe", categories: ["Real Estate", "Community"] },
      { id: "essentials", title: "Day-One Essentials", icon: "📦", description: "Grocery, pharmacy, gas, and hardware", categories: ["Grocery", "Pharmacy", "Retail"] },
      { id: "restaurants", title: "Food & Coffee", icon: "☕", description: "Your first go-to spots", categories: ["Restaurant", "Café", "Food"] },
      { id: "beauty", title: "Salon & Barber", icon: "✂️", description: "Find your people for hair and grooming", categories: ["Salon", "Barbershop"] },
      { id: "fitness", title: "Gym & Wellness", icon: "💪🏾", description: "Stay active in your new city", categories: ["Fitness", "Gym", "Yoga"] },
      { id: "community", title: "Events & Groups", icon: "🎉", description: "Meet people and explore culture", categories: ["Events", "Community"] },
      { id: "healthcare", title: "Doctors & Pharmacy", icon: "🏥", description: "Set up your healthcare providers", categories: ["Healthcare", "Medical"] },
    ],
  },
  "starting-business": {
    phases: [
      { id: "planning", title: "Business Planning", icon: "📋", description: "Refine your concept and business plan", categories: ["Business Services", "Coaching"] },
      { id: "legal", title: "Legal & Registration", icon: "⚖️", description: "LLC, permits, and legal setup", categories: ["Legal", "Law"] },
      { id: "banking", title: "Business Banking", icon: "🏦", description: "Open a business account and get financing", categories: ["Finance", "Banking"] },
      { id: "location", title: "Location & Workspace", icon: "📍", description: "Find your storefront or workspace", categories: ["Real Estate", "Coworking"] },
      { id: "marketing", title: "Branding & Marketing", icon: "🎨", description: "Build your brand identity and presence", categories: ["Marketing", "Design", "Photography"] },
      { id: "vendors", title: "Suppliers & Vendors", icon: "📦", description: "Source products and services locally", categories: ["Suppliers", "Wholesale"] },
    ],
  },
  retirement: {
    phases: [
      { id: "financial", title: "Financial Planning", icon: "💰", description: "Meet with a retirement advisor", categories: ["Finance", "Financial Advisor"] },
      { id: "healthcare", title: "Healthcare Coverage", icon: "🏥", description: "Medicare, supplements, and specialists", categories: ["Healthcare", "Insurance"] },
      { id: "housing", title: "Housing & Downsizing", icon: "🏠", description: "Find the right home for this chapter", categories: ["Real Estate"] },
      { id: "community", title: "Community & Social", icon: "🤝🏾", description: "Senior groups, clubs, and events", categories: ["Community", "Events"] },
      { id: "wellness", title: "Wellness & Fitness", icon: "💆🏾", description: "Stay active and healthy", categories: ["Fitness", "Wellness", "Spa"] },
    ],
  },
  "getting-married": {
    phases: [
      { id: "venue", title: "Venue & Catering", icon: "💒", description: "Find your perfect celebration space", categories: ["Events", "Catering", "Restaurant"] },
      { id: "beauty", title: "Hair & Beauty", icon: "💄", description: "Bridal salon, makeup, and grooming", categories: ["Salon", "Barbershop", "Beauty"] },
      { id: "photography", title: "Photography & Video", icon: "📸", description: "Capture your day", categories: ["Photography", "Videography"] },
      { id: "planning", title: "Wedding Planner", icon: "📋", description: "Coordinate your vision", categories: ["Event Planning"] },
      { id: "honeymoon", title: "Honeymoon & Travel", icon: "✈️", description: "Plan your first trip as a couple", categories: ["Travel", "Hotel"] },
      { id: "housing", title: "First Home Together", icon: "🏠", description: "Find your first home", categories: ["Real Estate"] },
    ],
  },
  college: {
    phases: [
      { id: "housing", title: "Housing & Dorms", icon: "🏠", description: "Find your home away from home", categories: ["Real Estate", "Rental"] },
      { id: "food", title: "Food & Groceries", icon: "🍽️", description: "Affordable meals and grocery runs", categories: ["Restaurant", "Grocery", "Food"] },
      { id: "supplies", title: "Books & Supplies", icon: "📚", description: "Get equipped for classes", categories: ["Books", "Retail"] },
      { id: "part-time", title: "Part-Time Work", icon: "💼", description: "Find flexible jobs near campus", categories: ["Employment"] },
      { id: "community", title: "Campus & Community", icon: "🎓", description: "Organizations, events, and study groups", categories: ["Community", "Events"] },
      { id: "wellness", title: "Health & Wellness", icon: "💆🏾", description: "Mental health, gym, and healthcare", categories: ["Healthcare", "Fitness"] },
    ],
  },
  "business-growth": {
    phases: [
      { id: "brand-identity", title: "Brand Identity & Story", icon: "🎨", description: "Sharpen your brand, mission, and community narrative", categories: ["Marketing", "Design", "Photography"] },
      { id: "digital-presence", title: "Digital Presence", icon: "📱", description: "Website, social media, and online visibility", categories: ["Marketing", "Technology", "Design"] },
      { id: "customer-experience", title: "Customer Experience", icon: "⭐", description: "Turn first-timers into loyal regulars", categories: ["Business Services", "Coaching"] },
      { id: "community-outreach", title: "Community Outreach", icon: "🤝🏾", description: "Partnerships, events, and local collaborations", categories: ["Community", "Events", "Marketing"] },
      { id: "operations", title: "Operations & Systems", icon: "⚙️", description: "Streamline your day-to-day to free up your time", categories: ["Business Services", "Technology"] },
      { id: "revenue-streams", title: "Revenue & Pricing", icon: "💰", description: "Diversify income and optimize pricing strategy", categories: ["Finance", "Business Services"] },
      { id: "staff-culture", title: "Team & Culture", icon: "👥", description: "Hire well, build culture, and reduce turnover", categories: ["Employment", "Coaching"] },
      { id: "expansion", title: "Growth & Scale", icon: "🚀", description: "Expand your footprint — second location, wholesale, or franchising", categories: ["Real Estate", "Business Services", "Finance"] },
    ],
  },
  "business-repair": {
    phases: [
      { id: "assessment", title: "Honest Assessment", icon: "🔍", description: "Identify what's working and what needs to change", categories: ["Business Services", "Coaching"] },
      { id: "customer-feedback", title: "Feedback & Reviews", icon: "💬", description: "Understand what customers are really saying", categories: ["Business Services"] },
      { id: "operational-fixes", title: "Fix Operations", icon: "🔧", description: "Patch the cracks — staffing, hours, systems, inventory", categories: ["Business Services", "Technology"] },
      { id: "facilities", title: "Facilities & Accessibility", icon: "🏗️", description: "Repairs, upgrades, ADA compliance, and curb appeal", categories: ["Contractors", "Home Services"] },
      { id: "financial-health", title: "Financial Health", icon: "💊", description: "Cash flow, debt, renegotiating costs, and finding relief programs", categories: ["Finance", "Banking"] },
      { id: "rebuild-trust", title: "Rebuild Community Trust", icon: "❤️🏾", description: "Re-engage your community and earn back loyalty", categories: ["Marketing", "Community"] },
    ],
  },
};

router.post("/journeys", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }

  const { journeyType, city, state, description, selectedNeeds } = req.body as Record<string, string>;
  if (!journeyType || !JOURNEY_TEMPLATES[journeyType]) {
    res.status(400).json({ error: "Valid journeyType required", validTypes: Object.keys(JOURNEY_TEMPLATES) });
    return;
  }

  const template = JOURNEY_TEMPLATES[journeyType]!;
  const location = [city, state].filter(Boolean).join(", ");
  const title = generateTitle(journeyType, city);

  let aiContext = description ?? "";
  let phases: JourneyPhase[];

  try {
    const cityBizCatalog = city
      ? await db
          .select({
            name: businessesTable.name,
            category: businessesTable.category,
            verified: businessesTable.verified,
            phone: businessesTable.phone,
            website: businessesTable.website,
          })
          .from(businessesTable)
          .where(and(
            eq(businessesTable.status, "active"),
            eq(businessesTable.blackOwned, true),
          ))
          .limit(25)
      : [];

    const needsContext = [
      description ? `Their context: "${description}"` : "",
      selectedNeeds ? `Specific needs they flagged: ${selectedNeeds}` : "",
    ].filter(Boolean).join("\n");

    const prompt = `You are KinfolkAI™, helping a community member plan their "${journeyType}" journey${location ? ` in ${location}` : ""}. 
${needsContext}

Generate a member-owned guide with personalized invitations and insights for each phase. Prioritize phases and suggestions that directly address their stated needs. Do not create scores, levels, streaks, achievements, locked phases, completion percentages, or pressure to finish. Return EXACTLY this JSON:
{
  "aiContext": "1-2 sentence summary of this person's journey and what matters most",
  "phases": [
    {
      "id": "phase_id",
      "title": "Phase Title",
      "icon": "emoji",
      "description": "1-sentence description",
      "categories": ["category1"],
      "steps": [
        { "id": "step1", "label": "Specific invitation or next step", "explored": false },
        { "id": "step2", "label": "Specific invitation or next step", "explored": false }
      ],
      "aiInsight": "1 sentence of warm, specific advice for this phase",
      "categories": ["relevant business categories"]
    }
  ]
}

Use these phase IDs and titles. Every phase must remain available whenever the member chooses to return:
${template.phases.map((p) => `- id: "${p.id}", title: "${p.title}", icon: "${p.icon}"`).join("\n")}

${cityBizCatalog.length ? `MINORITY-OWNED BUSINESSES ON THE PLATFORM${location ? ` IN ${location.toUpperCase()}` : ""} — PRIORITIZE THESE IN YOUR SUGGESTIONS:
Every time you recommend an action that requires hiring someone or finding a service provider, name a specific business from this list if one fits. Weave them into steps naturally — e.g. "Contact [Business Name] for..." or "Book [Business Name] to handle your...". These are real, verified minority-owned and minority-owned businesses that match this community. ${cityBizCatalog.map((b) => `${b.name} (${b.category}${b.verified ? " ✓ Verified" : ""}${b.phone ? ` · ${b.phone}` : ""})`).join(" | ")}` : "When recommending any service or hire, encourage them to search Mapping With Melanin™ for a minority-owned or minority-owned provider first."}

Each phase should have 3-5 specific, actionable steps. When steps involve hiring, contracting, or finding a service — always name a minority-owned or minority-owned business to start with. The aiInsight should be warm, culturally aware, and feel like a trusted friend giving real advice.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_completion_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { aiContext?: string; phases?: JourneyPhase[] };
    phases = memberOwnedJourneyPhases(parsed.phases ?? buildDefaultPhases(template.phases));
    aiContext = parsed.aiContext ?? aiContext;
  } catch {
    phases = buildDefaultPhases(template.phases);
  }

  const [journey] = await db
    .insert(lifeJourneysTable)
    .values({
      userId: req.user.id,
      journeyType: journeyType as any,
      title,
      city: city ?? null,
      state: state ?? null,
      phases,
      aiContext,
      status: "active",
    })
    .returning();

  res.status(201).json({ journey });
});

router.get("/journeys", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const journeys = await db
      .select()
      .from(lifeJourneysTable)
      .where(eq(lifeJourneysTable.userId, req.user.id))
      .orderBy(desc(lifeJourneysTable.updatedAt))
      .limit(20);
    res.json({ journeys });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch journeys");
    res.status(500).json({ error: "Failed to fetch journeys" });
  }
});

router.get("/journeys/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [journey] = await db
      .select()
      .from(lifeJourneysTable)
      .where(and(eq(lifeJourneysTable.id, id), eq(lifeJourneysTable.userId, req.user.id)))
      .limit(1);
    if (!journey) { res.status(404).json({ error: "Journey not found" }); return; }
    res.json({ journey });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch journey");
    res.status(500).json({ error: "Failed to fetch journey" });
  }
});

router.patch("/journeys/:id/step", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  const { phaseId, stepId, explored, completed } = req.body as {
    phaseId: string;
    stepId: string;
    explored?: boolean;
    /** Legacy clients can still send completed; it is mapped to a private reflection. */
    completed?: boolean;
  };
  const memberExplored = typeof explored === "boolean" ? explored : completed === true;

  try {
    const [journey] = await db
      .select()
      .from(lifeJourneysTable)
      .where(and(eq(lifeJourneysTable.id, id), eq(lifeJourneysTable.userId, req.user.id)))
      .limit(1);
    if (!journey) { res.status(404).json({ error: "Journey not found" }); return; }

    const phases = (journey.phases as JourneyPhase[]).map((phase) => {
      if (phase.id !== phaseId) return phase;
      const updatedSteps = phase.steps.map((step) => {
        if (step.id !== stepId) return step;
        const { completed: _legacyCompleted, completedAt: _legacyCompletedAt, ...memberOwnedStep } = step;
        return {
          ...memberOwnedStep,
          explored: memberExplored,
          exploredAt: memberExplored ? new Date().toISOString() : undefined,
        };
      });
      return { ...phase, steps: updatedSteps, status: "available" as const };
    });

    const [updated] = await db
      .update(lifeJourneysTable)
      .set({ phases, status: journey.status === "paused" ? "paused" : "active" })
      .where(eq(lifeJourneysTable.id, id))
      .returning();

    res.json({ journey: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to update journey reflection");
    res.status(500).json({ error: "Kinfolk could not save that reflection. Your guide is unchanged." });
  }
});

router.delete("/journeys/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [deleted] = await db
      .delete(lifeJourneysTable)
      .where(and(eq(lifeJourneysTable.id, id), eq(lifeJourneysTable.userId, req.user.id)))
      .returning({ id: lifeJourneysTable.id });
    if (!deleted) { res.status(404).json({ error: "Journey not found" }); return; }
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete journey");
    res.status(500).json({ error: "Failed to delete journey" });
  }
});

router.get("/journeys/:id/smart-matches", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);

  try {
    const [journey] = await db
      .select()
      .from(lifeJourneysTable)
      .where(and(eq(lifeJourneysTable.id, id), eq(lifeJourneysTable.userId, req.user.id)))
      .limit(1);
    if (!journey) { res.status(404).json({ error: "Journey not found" }); return; }
    if (!journey.city) { res.json({ matches: [], message: null }); return; }

    const feedback = await pool.query<{ business_name: string; category: string; city: string; count: string }>(
      `SELECT business_name, category, city, COUNT(*) as count
       FROM kinfolk_feedback
       WHERE user_id = $1
         AND reaction = 'like'
         AND category IS NOT NULL
         AND city IS NOT NULL
         AND city NOT ILIKE $2
       GROUP BY business_name, category, city
       ORDER BY count DESC
       LIMIT 30`,
      [req.user.id, `%${journey.city}%`],
    );

    if (feedback.rows.length === 0) {
      res.json({ matches: [], message: null });
      return;
    }

    const categoryMap = new Map<string, { category: string; fromCity: string; savedCount: number }>();
    for (const row of feedback.rows) {
      const key = row.category.toLowerCase();
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { category: row.category, fromCity: row.city, savedCount: 0 });
      }
      categoryMap.get(key)!.savedCount++;
    }

    const topCategories = [...categoryMap.values()].slice(0, 6);
    const bridges = await Promise.all(
      topCategories.map(async ({ category, fromCity, savedCount }) => {
        const matches = await pool.query<{ id: string; name: string; category: string; city: string; verified: boolean; black_owned: boolean }>(
          `SELECT id, name, category, city, verified, black_owned
           FROM businesses
           WHERE status = 'active'
             AND black_owned = true
             AND city ILIKE $1
             AND category ILIKE $2
           ORDER BY verified DESC, name ASC
           LIMIT 4`,
          [`%${journey.city}%`, `%${category}%`],
        );
        return { category, fromCity, savedCount, matches: matches.rows };
      }),
    );

    const withMatches = bridges.filter((b) => b.matches.length > 0);
    const message = withMatches.length > 0
      ? `We found ${withMatches.reduce((sum, b) => sum + b.matches.length, 0)} businesses in ${journey.city} across ${withMatches.length} categories you already love.`
      : `We're still growing in ${journey.city} — check back soon or ask KinfolkAI™ for recommendations.`;

    res.json({ matches: withMatches, message, destinationCity: journey.city });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch smart matches");
    res.status(500).json({ error: "Failed to fetch smart matches" });
  }
});

router.get("/journeys/types/list", (_req, res) => {
  res.json({
    types: [
      { id: "moving", label: "Moving to a New City", icon: "🚚", description: "Find your neighborhood, home, and community" },
      { id: "new-to-city", label: "New to This City", icon: "🗺️", description: "Discover your go-to spots and people" },
      { id: "starting-business", label: "Starting a Business", icon: "🚀", description: "Launch your dream with community support" },
      { id: "business-growth", label: "Grow My Business", icon: "📈", description: "Scale revenue, brand, and community impact — step by step", businessOnly: true },
      { id: "business-repair", label: "Repair & Rebuild", icon: "🔧", description: "Fix what's broken and earn community trust back", businessOnly: true },
      { id: "new-baby", label: "Growing Your Family", icon: "👶🏾", description: "Prepare for parenthood with the right support" },
      { id: "getting-married", label: "Getting Married", icon: "💍", description: "Plan your celebration and first chapter together" },
      { id: "career-change", label: "Career Change", icon: "🎯", description: "Level up with a new direction" },
      { id: "college", label: "Starting College", icon: "🎓", description: "Navigate campus life and your new city" },
      { id: "retirement", label: "Retirement Planning", icon: "🌅", description: "Step into your next chapter with confidence" },
    ],
  });
});

function generateTitle(journeyType: string, city?: string): string {
  const cityStr = city ? ` in ${city}` : "";
  const labels: Record<string, string> = {
    moving: `Moving${cityStr}`,
    "new-baby": "Growing Our Family",
    "career-change": "Career Change Journey",
    "new-to-city": `Getting Settled${cityStr}`,
    "starting-business": "Building My Business",
    retirement: "My Retirement Journey",
    "getting-married": "Wedding Journey",
    college: "College Life",
    "business-growth": "My Growth Journey",
    "business-repair": "Repair & Rebuild Plan",
  };
  return labels[journeyType] ?? "My Journey";
}

function buildDefaultPhases(template: typeof JOURNEY_TEMPLATES[string]["phases"]): JourneyPhase[] {
  return template.map((p) => ({
    ...p,
    status: "available" as const,
    steps: [
      { id: "step1", label: `Explore ${p.title.toLowerCase()} options`, explored: false },
      { id: "step2", label: `See whether a minority-owned ${p.categories[0] ?? "business"} nearby fits`, explored: false },
      { id: "step3", label: `Return to Kinfolk when you want to consider a next step`, explored: false },
    ],
  }));
}

/**
 * Provider output and legacy plans are normalized before new storage so a
 * Journey remains a member-paced guide rather than a scorecard or unlock path.
 */
function memberOwnedJourneyPhases(phases: JourneyPhase[]): JourneyPhase[] {
  return phases.map((phase) => ({
    ...phase,
    status: "available",
    steps: phase.steps.map((step) => {
      const { completed, completedAt, ...memberOwnedStep } = step;
      return {
        ...memberOwnedStep,
        explored: step.explored ?? completed ?? false,
        exploredAt: step.exploredAt ?? completedAt,
      };
    }),
  }));
}
export default router;
