;
        const pct = Math.round((rolling / TOKEN_BUCKET_TARGET) * 100);
        if (pct < 80) return undefined;
        return {
          level: pct >= 95 ? "critical" : "warning",
          message: pct >= 95
            ? "KinfolkAI is at capacity — your next question may be queued briefly."
            : "KinfolkAI is getting busy — responses may be slightly slower.",
          utilization: pct,
        };
      })(),
      // ── Current-turn permitted research fields ───────────────────────────────
      // lensDisclosure remains empty unless a future purpose-consent flow
      // supplies a truthful, user-controlled disclosure.
      // resourceCards: clinician-reviewed external resources (eczema gallery, CDC).
      // entityCandidates: disambiguation options ranked community-lens-first.
      // urgentSafetyMessage: immediate care instruction for pregnancy/danger language.
      ...(kinfolkLensDisclosure && { lensDisclosure: kinfolkLensDisclosure }),
      ...(webResourceCards.length > 0 && { resourceCards: webResourceCards }),
      ...(webEntityCandidates?.length && { entityCandidates: webEntityCandidates }),
      ...(kinfolkUrgentMessage && { urgentSafetyMessage: kinfolkUrgentMessage }),
      ...completionExperienceMarker,
    });
  } catch (err) {
    const errCode        = (err as any)?.code as string | undefined;
    const providerStatus = (err as any)?.status ?? (err as any)?.statusCode as number | undefined;
    const isTimeout      = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    const isQueueFull         = errCode === "KINFOLK_QUEUE_FULL";
    const isKinfolkBusy       = errCode === "KINFOLK_BUSY";
    const isOverload          = isQueueFull || isKinfolkBusy;
    // Provider rate-limit (OpenAI 429 / TPM exhaustion) that survived all retries.
    // Must return 503, not 500 — this is a temporary, self-resolving upstream condition.
    const isProviderRateLimit = !isOverload && providerStatus === 429;
    const errMsg         = err instanceof Error ? err.message : String(err);
    const is401          = errMsg.includes("401") || errMsg.toLowerCase().includes("unauthorized");
    const isConnRefused  = errMsg.includes("ECONNREFUSED") || errMsg.includes("ENOTFOUND");

    // Plain console.error so Railway log viewer surfaces the sanitized record
    // (pino JSON payload is hidden in Railway UI). Never log prompts, user data,
    // session content, or API credentials.
    const errName = err instanceof Error ? err.name : "Unknown";
    const errStack = err instanceof Error ? (err.stack ?? "").slice(0, 600) : "";
    console.error(
      "[kinfolk-chat-error]",
      `chatStage=${chatStage}`,
      `code=${errCode ?? "none"}`,
      `providerStatus=${providerStatus ?? "none"}`,
      `errName=${errName}`,
      `isOverload=${isOverload}`,
      `isProviderRateLimit=${isProviderRateLimit}`,
      `isTimeout=${isTimeout}`,
      `is401=${is401}`,
      `isConnRefused=${isConnRefused}`,
      `active=${kinfolkActiveGenerations}`,
      `queued=${kinfolkQueuedGenerations}`,
      `msg=${errMsg.slice(0, 300)}`,
      `stack=${errStack}`,
    );
    req.log.error(
      { errCode, providerStatus, isOverload, isTimeout, is401, isConnRefused,
        kinfolkActiveGenerations, kinfolkQueuedGenerations },
      "KinfolkAI chat failed",
    );

    // Bust the health cache so next /kinfolk/health probe reflects real state
    _kinfolkHealthCache = null;

    // ── Response classification ────────────────────────────────────────────
    // 503 + Retry-After: temporary, self-resolving upstream conditions.
    //   - KINFOLK_OVERLOADED:    internal queue full or wait-timeout
    //   - KINFOLK_RATE_LIMITED:  provider TPM/RPM 429 survived all retries
    //   Never return 500 for either of these — they are bounded and self-resolving.
    // 504: confirmed provider stall (AbortError / TimeoutError from AbortSignal).
    // 500: genuine unexpected server defect that is not overload, rate-limit, or timeout.
    if (isOverload) {
      res.status(503).set("Retry-After", "20").json({
        error: "Kinfolk is helping a few people right now. Your question is saved — try again in about 20 seconds.",
        code:  "KINFOLK_BUSY",
        retryAfterSeconds: 20,
      });
      return;
    }

    if (isProviderRateLimit) {
      res.status(503).set("Retry-After", "4").json({
        error: "Kinfolk is a little busy right now. Please try again in a moment.",
        code:  "KINFOLK_RATE_LIMITED",
        retryAfterSeconds: 4,
      });
      return;
    }

    res.status(isTimeout ? 504 : 500).json({
      error: isTimeout
        ? "Kinfolk took too long to respond. Please try again in a moment."
        : is401
          ? "KinfolkAI is temporarily unavailable — authentication error. Our team has been notified."
          : isConnRefused
            ? "KinfolkAI is temporarily unavailable — connection error. Our team has been notified."
            : "Kinfolk is having trouble answering that right now. Please try again in a moment.",
      code: isTimeout       ? "KINFOLK_TIMEOUT"
          : is401           ? "KINFOLK_AUTH_ERROR"
          : isConnRefused   ? "KINFOLK_CONN_ERROR"
          :                   "KINFOLK_ERROR",
    });
  }
});

// ─── GET /api/kinfolk/business-action-plan/:businessId — fetch cached plan ──────
router.get("/kinfolk/business-action-plan/:businessId", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  try {
    const [cached] = await db
      .select()
      .from(businessAiPlanCacheTable)
      .where(eq(businessAiPlanCacheTable.businessId, String(req.params["businessId"])))
      .orderBy(desc(businessAiPlanCacheTable.createdAt))
      .limit(1);
    if (!cached) return void res.json({ plan: null });
    res.json({ plan: { ...(cached.planData as object), _cached: true, _cachedAt: cached.createdAt.toISOString(), tier: cached.tier } });
  } catch (err) {
    req.log.error({ err }, "GET /kinfolk/business-action-plan error");
    res.status(500).json({ error: "Failed to load plan" });
  }
});

// ─── POST /api/kinfolk/business-action-plan ────────────────────────────────────
router.post("/kinfolk/business-action-plan", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  if (!process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]) return void res.status(503).json({ error: "AI service unavailable" });

  // ── Tier gate ───────────────────────────────────────────────────────────────
  const tier = await getUserTier(req.user.id);
  if (tier === "free") {
    return void res.status(403).json({
      error: "AI Business Insights require a Navigator or Trailblazer membership.",
      code: "TIER_LIMIT_REACHED",
      upgradeUrl: "/membership",
    });
  }
  const isTrailblazer = tier === "trailblazer";
  const CACHE_DAYS = isTrailblazer ? 3 : 7;
  const MAX_ITEMS = isTrailblazer ? 6 : 3;

  const { businessId, businessName, businessCategory, businessCity } = req.body as {
    businessId?: string;
    businessName?: string;
    businessCategory?: string;
    businessCity?: string;
  };

  // ── Check cache ─────────────────────────────────────────────────────────────
  if (businessId) {
    try {
      const [cached] = await db
        .select()
        .from(businessAiPlanCacheTable)
        .where(eq(businessAiPlanCacheTable.businessId, businessId))
        .orderBy(desc(businessAiPlanCacheTable.createdAt))
        .limit(1);
      if (cached) {
        const ageDays = (Date.now() - cached.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageDays < CACHE_DAYS) {
          return void res.json({
            ...(cached.planData as object),
            _cached: true,
            _cachedAt: cached.createdAt.toISOString(),
            tier,
          });
        }
      }
    } catch { /* non-critical */ }
  }

  // ── Fetch reviews from DB server-side ───────────────────────────────────────
  let dbReviews: Array<{ rating: number; content: string | null; weight: string | null }> = [];
  if (businessId) {
    try {
      dbReviews = await db
        .select({ rating: reviewsTable.rating, content: reviewsTable.text, weight: reviewsTable.weight })
        .from(reviewsTable)
        .where(eq(reviewsTable.businessId, businessId))
        .orderBy(desc(reviewsTable.createdAt))
        .limit(isTrailblazer ? 30 : 10);
    } catch { /* non-critical */ }
  }

  const verifiedReviews = dbReviews.filter((r) => parseFloat(r.weight ?? "1") >= 1.5);
  const communityReviews = dbReviews.filter((r) => parseFloat(r.weight ?? "1") < 1.5);

  const reviewsText = dbReviews.length === 0
    ? "No community reviews yet."
    : [
        verifiedReviews.length > 0
          ? `VERIFIED COMMUNITY MEMBERS (identity-confirmed, higher trust — ${verifiedReviews.length} review${verifiedReviews.length === 1 ? "" : "s"}):\n${verifiedReviews.map((r) => `- Rating: ${r.rating}/5 | Feedback: ${r.content ?? "(no written feedback)"}`).join("\n")}`
          : null,
        communityReviews.length > 0
          ? `GENERAL COMMUNITY MEMBERS (${communityReviews.length} review${communityReviews.length === 1 ? "" : "s"}):\n${communityReviews.map((r) => `- Rating: ${r.rating}/5 | Feedback: ${r.content ?? "(no written feedback)"}`).join("\n")}`
          : null,
      ].filter(Boolean).join("\n\n");

  // ── Skip feedback (Trailblazer only) ────────────────────────────────────────
  let skipInsightsText = "";
  if (businessId && isTrailblazer) {
    try {
      const skipRows = await db
        .select({ message: businessSkipFeedbackTable.message })
        .from(businessSkipFeedbackTable)
        .where(eq(businessSkipFeedbackTable.businessId, businessId))
        .limit(20);
      if (skipRows.length > 0) {
        skipInsightsText = `\nCOMMUNITY SKIP FEEDBACK (private — why people passed on visiting):\n${skipRows.map((r) => `- "${r.message}"`).join("\n")}`;
      }
    } catch { /* non-critical */ }
  }

  // ── Business identity ───────────────────────────────────────────────────────
  let identityContext = "";
  try {
    const [ownerBiz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, req.user.id))
      .limit(1);
    if (ownerBiz) {
      const [identity] = await db
        .select()
        .from(businessIdentityTable)
        .where(eq(businessIdentityTable.businessId, ownerBiz.id))
        .limit(1);
      if (identity) {
        const parts: string[] = [];
        if (identity.missionStatement) parts.push(`Mission: ${identity.missionStatement}`);
        if (identity.businessStory) parts.push(`Story: ${identity.businessStory.slice(0, 300)}`);
        if (identity.communityValues?.length) parts.push(`Core values: ${identity.communityValues.join(", ")}`);
        if (identity.audiencesServed?.length) parts.push(`Serves: ${identity.audiencesServed.join(", ")}`);
        if (identity.vibes?.length) parts.push(`Business vibe: ${identity.vibes.join(", ")}`);
        if (identity.growthGoals?.length) parts.push(`Growth goals: ${identity.growthGoals.join(", ")}`);
        if (identity.accessibilityFeatures?.length) parts.push(`Current accessibility: ${identity.accessibilityFeatures.join(", ")}`);
        if (identity.communityInitiatives?.length) parts.push(`Community commitments: ${identity.communityInitiatives.join(", ")}`);
        if (identity.isHiring) parts.push("Currently hiring");
        if (parts.length) identityContext = `\nBUSINESS IDENTITY (owner-defined):\n${parts.join("\n")}`;
      }
    }
  } catch { /* non-critical */ }

  const prompt = `You are an expert Black business advisor helping "${businessName ?? "a business"}" (category: ${businessCategory ?? "General"}, city: ${businessCity ?? "Unknown"}) build a feedback-based improvement action plan.${identityContext}

COMMUNITY FEEDBACK FROM REVIEWS (${dbReviews.length} total):
${reviewsText}${skipInsightsText}

${isTrailblazer ? "This is a Trailblazer analysis — provide deep, comprehensive insights using all available data sources." : "This is a Navigator analysis — provide concise, high-impact improvements."}

Analyze all feedback and generate a practical, budget-conscious action plan that honors the business's mission, values, and community focus. If reviews are sparse, generate proactive improvements relevant to the category.

Return EXACTLY this JSON (no markdown, pure valid JSON):
{
  "summary": "2-3 sentence overview of what the feedback signals and what the plan focuses on",
  "actionItems": [
    {
      "issue": "Short description of the issue or opportunity",
      "priority": "critical|high|medium|low",
      "category": "Accessibility|Safety|Cleanliness|Service|Experience|Marketing|Infrastructure|Community",
      "actions": ["specific action step 1", "action step 2", "action step 3"],
      "estimatedCost": "e.g. $500–$1,500 or Free",
      "estimatedTimeline": "e.g. 1–2 weeks or Same day",
      "resources": ["Optional: local vendor/org/program that can help"]
    }
  ]
}

Include exactly ${MAX_ITEMS} action items. Prioritize accessibility (ADA compliance, wheelchair access, signage) and safety first. Be specific with dollar estimates. Keep language warm, community-centered, and practical.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: isTrailblazer ? 2000 : 1000,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as { summary: string; actionItems: unknown[] };

    const result = {
      ...parsed,
      tier,
      _cached: false,
      _generatedAt: new Date().toISOString(),
      _dataPoints: {
        reviewsAnalyzed: dbReviews.length,
        skipFeedbackIncluded: isTrailblazer,
      },
    };

    // Store in cache
    if (businessId) {
      db.insert(businessAiPlanCacheTable)
        .values({ businessId, tier, planData: result })
        .catch(() => {});
    }

    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Business action plan failed");
    res.status(500).json({ error: "Failed to generate action plan" });
  }
});

// ─── POST /api/kinfolk/expansion-analysis ─────────────────────────────────────
router.post("/kinfolk/expansion-analysis", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const expansionTier = await getUserTier(String(req.user!.id));
  if (expansionTier === "free" || expansionTier === "navigator") {
    return void res.status(403).json({ error: "Trailblazer membership required" });
  }
  if (!process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]) return void res.status(503).json({ error: "AI service unavailable" });

  const { businessName, businessCategory, businessCity, avgRating, reviewCount, savesCount } = req.body as {
    businessName?: string;
    businessCategory?: string;
    businessCity?: string;
    avgRating?: number;
    reviewCount?: number;
    savesCount?: number;
  };

  // Fetch the owner's business identity for personalized expansion advice
  let expansionIdentityContext = "";
  try {
    const [ownerBiz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, req.user.id))
      .limit(1);
    if (ownerBiz) {
      const [identity] = await db
        .select()
        .from(businessIdentityTable)
        .where(eq(businessIdentityTable.businessId, ownerBiz.id))
        .limit(1);
      if (identity) {
        const parts: string[] = [];
        if (identity.missionStatement) parts.push(`Mission: ${identity.missionStatement}`);
        if (identity.communityValues?.length) parts.push(`Core values: ${identity.communityValues.join(", ")}`);
        if (identity.audiencesServed?.length) parts.push(`Serves: ${identity.audiencesServed.join(", ")}`);
        if (identity.vibes?.length) parts.push(`Business vibe: ${identity.vibes.join(", ")}`);
        if (identity.growthGoals?.length) parts.push(`Owner-stated growth goals: ${identity.growthGoals.join(", ")}`);
        if (identity.ownershipBadges?.length) parts.push(`Identity: ${identity.ownershipBadges.join(", ")}`);
        if (identity.communityInitiatives?.length) parts.push(`Community commitments: ${identity.communityInitiatives.join(", ")}`);
        if (parts.length) expansionIdentityContext = `\nBUSINESS IDENTITY (owner-defined):\n${parts.join("\n")}`;
      }
    }
  } catch { /* non-critical */ }

  // Fetch platform survey data for context
  let surveyContext = "";
  try {
    const surveys = await db
      .select({
        city: neighborhoodSurveysTable.city,
        daytimeSafety: neighborhoodSurveysTable.daytimeSafety,
        nighttimeSafety: neighborhoodSurveysTable.nighttimeSafety,
        walkability: neighborhoodSurveysTable.walkability,
        atmosphere: neighborhoodSurveysTable.atmosphere,
      })
      .from(neighborhoodSurveysTable)
      .limit(50);

    const cityMap: Record<string, { safetySum: number; count: number }> = {};
    for (const s of surveys) {
      const c = s.city;
      if (!cityMap[c]) cityMap[c] = { safetySum: 0, count: 0 };
      const avg = ((s.daytimeSafety ?? 0) + (s.nighttimeSafety ?? 0)) / 2;
      cityMap[c].safetySum += avg;
      cityMap[c].count += 1;
    }
    const citySummary = Object.entries(cityMap)
      .map(([city, { safetySum, count }]) => `${city}: avg safety ${(safetySum / count).toFixed(1)}/5 (${count} community reports)`)
      .join(", ");
    if (citySummary) surveyContext = `Platform Community Intelligence data by city (member-sourced context, not crime statistics): ${citySummary}`;
  } catch { /* non-critical */ }

  const prompt = `You are a business expansion strategist advising a minority-owned ${businessCategory ?? "business"} called "${businessName ?? "this business"}" currently based in ${businessCity ?? "their city"}.${expansionIdentityContext}

CURRENT PERFORMANCE:
- Average rating: ${avgRating?.toFixed(1) ?? "N/A"}/5
- Community reviews: ${reviewCount ?? 0}
- Saves by community members: ${savesCount ?? 0}
${surveyContext ? `\n${surveyContext}` : ""}

Based on community demand patterns, urban demographics, and the growth of Black consumer spending power ($1.8 trillion annually), generate an expansion vision and action plan.

Return EXACTLY this JSON (no markdown, pure valid JSON):
{
  "summary": "2-3 sentence big-picture expansion vision tailored to this business",
  "opportunities": [
    {
      "city": "City name",
      "state": "State abbreviation",
      "opportunity": "Specific opportunity description",
      "marketSignal": "Why this market is ready — data, demographics, community need",
      "estimatedDemand": "e.g. High — 2.4M Black residents, no comparable business within 10 miles",
      "actionSteps": ["step 1", "step 2", "step 3"]
    }
  ],
  "insights": [
    "Platform-level insight about community demand or untapped market",
    "Trend insight relevant to this category",
    "Strategic partnership or funding opportunity"
  ]
}

Include 2–4 city opportunities and 3–4 strategic insights. Focus on cities with strong Black communities: Atlanta, Houston, Chicago, DC, New York, New Orleans, LA, Miami, Dallas, Philadelphia, Detroit, Baltimore, Memphis, Charlotte. Prioritize cities near ${businessCity ?? "their base"}.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as { summary: string; opportunities: unknown[]; insights: string[] };
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Expansion analysis failed");
    res.status(500).json({ error: "Failed to generate expansion analysis" });
  }
});

// ─── POST /kinfolk/relocation ─────────────────────────────────────────────────
// AI-powered relocation concierge — walks through phases, proactively recommends
// minority-owned businesses at every step of a move
router.post("/kinfolk/relocation", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const {
    messages = [],
    fromCity,
    toCity,
    toState,
    familySize = "solo",
    budget = "mid",
    homeType = "renting",
    hasKids = false,
    hasPets = false,
    currentPhase = "neighborhoods",
    needs = [],
    interests = [],
  } = req.body as {
    messages?: Array<{ role: string; content: string }>;
    fromCity?: string;
    toCity?: string;
    toState?: string;
    familySize?: string;
    budget?: string;
    homeType?: string;
    hasKids?: boolean;
    hasPets?: boolean;
    currentPhase?: string;
    needs?: string[];
    interests?: string[];
  };

  const RELOCATION_PHASES: Record<string, { title: string; icon: string; description: string; categories: string[] }> = {
    neighborhoods: { title: "Neighborhood Research", icon: "🏘️", description: "Find the right community for your lifestyle", categories: ["Real Estate", "Community"] },
    realtors:      { title: "Find a Realtor",        icon: "🏠", description: "Connect with minority-owned real estate agents",  categories: ["Real Estate"] },
    mortgage:      { title: "Mortgage & Financing",   icon: "💰", description: "Get pre-approved with community lenders",      categories: ["Finance", "Banking"] },
    movers:        { title: "Moving Companies",       icon: "🚚", description: "Book trustworthy movers",                     categories: ["Moving", "Transportation"] },
    utilities:     { title: "Set Up Utilities",       icon: "⚡", description: "Electricity, internet, and home services",    categories: ["Home Services"] },
    healthcare:    { title: "Find a Doctor",          icon: "🏥", description: "Primary care, specialists, and dentists",     categories: ["Healthcare", "Medical", "Health"] },
    schools:       { title: "Schools & Education",    icon: "🎓", description: "Research schools and childcare options",      categories: ["Education", "Childcare"] },
    salons:        { title: "Beauty & Grooming",      icon: "✂️", description: "Your go-to salon, barber, and spa",          categories: ["Beauty", "Salon", "Barbershop"] },
    restaurants:   { title: "Restaurants & Food",     icon: "🍽️", description: "Build your regular spots",                   categories: ["Restaurant", "Food", "Café"] },
    community:     { title: "Community & Events",     icon: "🤝🏾", description: "Find your people and local events",        categories: ["Community", "Events"] },
    employment:    { title: "Career & Employment",    icon: "💼", description: "Job boards, networking, and local employers", categories: ["Employment", "Networking"] },
    safety:        { title: "Safety & Security",      icon: "🛡️", description: "Understand your neighborhood safety profile", categories: ["Safety"] },
  };

  const phase = RELOCATION_PHASES[currentPhase] ?? RELOCATION_PHASES["neighborhoods"]!;

  // Load user lifestyle/interests from DB for interest-based area suggestions
  let userLifestyleServices: string[] = [];
  let userCulturalInterests: string[] = [];
  let userFavoriteCategories: string[] = [];
  if (req.user?.id) {
    try {
      const [prefs] = await db
        .select({
          lifestyleServices: userPreferencesTable.lifestyleServices,
          culturalInterests: userPreferencesTable.culturalInterests,
          favoriteCategories: userPreferencesTable.favoriteCategories,
        })
        .from(userPreferencesTable)
        .where(eq(userPreferencesTable.userId, req.user.id))
        .limit(1);
      userLifestyleServices = (prefs?.lifestyleServices as string[] | null) ?? [];
      userCulturalInterests = (prefs?.culturalInterests as string[] | null) ?? [];
      userFavoriteCategories = (prefs?.favoriteCategories as string[] | null) ?? [];
    } catch { /* non-critical */ }
  }
  const allInterests = [...new Set([
    ...(interests as string[]),
    ...userLifestyleServices,
    ...userCulturalInterests,
    ...userFavoriteCategories,
  ])];

  // Pull minority-owned businesses across ALL relocation-relevant categories at once.
  // The AI picks which ones to surface per phase — we don't gate by currentPhase.
  let verifiedBusinesses: Array<{
    id: number | string; name: string; category: string; description: string;
    city: string; verified: boolean; phone: string | null; website: string | null;
  }> = [];

  if (toCity) {
    try {
      const allReloCategories = [
        "Real Estate", "Realtor", "Moving", "Transportation", "Contractor", "Handyman",
        "Restaurant", "Food", "Café", "Cafe", "Salon", "Barber", "Beauty",
        "Healthcare", "Medical", "Health", "Fitness", "Gym", "Yoga", "Martial Arts",
        "Finance", "Banking", "Community", "Childcare", "Education",
        "Grocery", "Auto", "Home Services",
        ...allInterests,
      ];
      const catConditions = allReloCategories.map(cat => ilike(businessesTable.category, `%${cat}%`));
      verifiedBusinesses = await db
        .select({
          id: businessesTable.id,
          name: businessesTable.name,
          category: businessesTable.category,
          description: businessesTable.description,
          city: businessesTable.city,
          verified: businessesTable.verified,
          phone: businessesTable.phone,
          website: businessesTable.website,
        })
        .from(businessesTable)
        .where(and(
          ilike(businessesTable.city, `%${toCity}%`),
          eq(businessesTable.blackOwned, true),
          eq(businessesTable.status, "active"),
          or(...catConditions),
        ))
        .limit(20);
    } catch { /* non-critical */ }
  }

  const isOutOfState = !!(fromCity && toState && fromCity.toLowerCase() !== (toCity ?? "").toLowerCase());

  const proactiveFlags = [
    hasKids  ? "They have children — proactively mention schools, childcare, and family-friendly neighborhoods." : "",
    hasPets  ? "They have pets — mention pet-friendly buildings, local vets, and dog parks when relevant." : "",
    isOutOfState ? "They're moving from out of state — proactively bring up transferring medical records, finding a new primary care doctor, and updating insurance networks." : "",
    homeType === "buy" ? "They're buying — mention home inspectors, real estate attorneys, and the minority-owned realtor advantage." : "",
    (needs as string[]).includes("Home Repair") ? "They flagged home repair — proactively mention minority-owned contractors and handymen." : "",
    (needs as string[]).includes("Mental Health") ? "They flagged mental health — mention Black therapists and culturally affirming wellness providers." : "",
  ].filter(Boolean).join("\n");

  const interestsSection = allInterests.length > 0
    ? `\nTHEIR INTERESTS & LIFESTYLE SERVICES — use these for location AND business suggestions:
${allInterests.map(i => `- ${i.replace(/_/g, " ")}`).join("\n")}
Prioritize neighborhoods near good ${allInterests.slice(0, 4).join(", ")} options.`
    : "";

  const businessCatalog = verifiedBusinesses.length > 0
    ? `\n\nMINORITY-OWNED PLATFORM BUSINESSES IN ${toCity?.toUpperCase()} — pick the best fit per need (realtor, mover, contractor, food, salon, fitness, etc.):
${verifiedBusinesses.map(b =>
    `• ${b.name} | ${b.category}${b.verified ? " ✓ Verified" : ""}\n  "${(b.description ?? "").slice(0, 140)}"\n  ${b.phone ? `📞 ${b.phone}` : ""}${b.website ? ` | 🌐 ${b.website}` : ""}`
  ).join("\n\n")}`
    : `\n\nNo platform businesses yet for ${toCity ?? "this city"} — use your general knowledge and tell them to search Mapping With Melanin™ as new spots are added.`;

  const systemPrompt = `You are KinfolkAI's Relocation Concierge — the most well-connected friend anyone could have when moving. You know minority-owned businesses, culturally affirming neighborhoods, and all the hidden knowledge that makes a new city feel like home fast.

MOVE CONTEXT:
- Relocating: ${fromCity ?? "current city"} → ${toCity ?? "new city"}${toState ? `, ${toState}` : ""}
- Family: ${familySize} | Budget: ${budget} | Home plan: ${homeType}
- Has kids: ${hasKids ? "Yes" : "No"} | Has pets: ${hasPets ? "Yes" : "No"}
- Current phase: ${phase.icon} ${phase.title} — ${phase.description}
- Stated needs: ${(needs as string[]).length > 0 ? (needs as string[]).join(", ") : "general relocation"}
${interestsSection}

PROACTIVE CONTEXT:
${proactiveFlags || "Standard relocation — guide warmly through all phases."}

LOCATION SUGGESTION RULE — applies when on neighborhoods phase or user asks WHERE to live:
Suggest 3-4 specific areas at different distances from ${toCity ?? "the destination city"} based on their interests and lifestyle. Use real neighborhood or suburb names. Format each as:
- A named area 5-10 miles out → strong on [their interests], good for their budget
- A named area 15-20 miles out → more space, still connected
- A named area 25-35 miles out → if they want quiet or lower cost
- Optionally a 4th area if there's a particularly strong interest match
Base proximity suggestions on: ${allInterests.length > 0 ? allInterests.slice(0, 4).join(", ") : "good food, community, and safety"}.
Return these as "locationSuggestions" in your JSON — each with a minority-owned business example in that area.

PROACTIVE CHAINING RULE — this is what makes you feel like a real friend, not a search engine:
After each topic naturally lead to the next thing they need, naming a minority-owned business each time:
1. Neighborhoods → "Now you need a realtor — [minority-owned realtor name from the platform or your knowledge] works that area"
2. Realtor found → "Do you need movers? I'd book [minority-owned moving company] now — good ones fill up fast"
3. Movers sorted → "Once you arrive you'll need a handyman — [minority-owned contractor/handyman name] handles exactly this kind of move-in work"
4. Home setup → "Time to build your regular spots — here are restaurants you'll love: [minority-owned restaurants in ${toCity}]"
5. Food → Pivot to interest-based: "Since you're into [their interest], here's the best [karate gym / yoga studio / barbershop / loctician / etc.] there: [minority-owned name]"

MINORITY-OWNED BUSINESS RULE:
Every single business you name must be minority-owned or minority-owned. Pull from the PLATFORM BUSINESSES list first. If none match a need, use your general knowledge — name the business and add "Search Mapping With Melanin™ to find more like this."

YOUR VOICE:
- Warm and direct, like texting your most well-traveled, well-connected friend
- Never travel-brochure language: no "boasts", "renowned", "visitors will enjoy"
- Use "you" constantly — personal and direct
- Always tell them what comes NEXT before they ask

RETURN EXACTLY THIS JSON (no markdown fencing, no extra text):
{
  "reply": "2-4 sentences warm and direct, like a text from a trusted local friend",
  "locationSuggestions": [
    {
      "area": "Neighborhood or suburb name, State",
      "distanceMiles": 8,
      "vibe": "1 sentence on the feel",
      "why": "Why this matches their interests and lifestyle",
      "minorityBiz": "Name of 1 minority-owned business in this area"
    }
  ],
  "businesses": [
    {
      "name": "Business Name",
      "category": "Category",
      "description": "Why this fits their specific move situation",
      "neighborhood": "Area of city",
      "whyForYou": "Very specific reason it matches their family, budget, home type",
      "phone": "phone number or null",
      "website": "website or null",
      "verified": true
    }
  ],
  "proactiveSuggestions": ["Find me a minority-owned realtor", "Need movers?", "What about home repair?", "Show me restaurants near me"],
  "insight": "1 thing they haven't thought of yet that will make a real difference — surface it before they ask",
  "checklistItems": ["3-5 concrete action items for this phase"],
  "nextPhaseHint": "1 sentence teaser for what they'll need next"
}

Only include "locationSuggestions" when on the neighborhoods phase or user asks about where to live — otherwise omit it or set to null.
Include 3-5 businesses from the PLATFORM LIST below. If none match, use general knowledge.
${businessCatalog}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages as Array<{ role: string; content: string }>).map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.75,
      max_tokens: 2400,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      // Strip markdown fences first
      let clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      // If AI wrapped JSON in prose, extract the first top-level JSON object
      const braceStart = clean.indexOf("{");
      const braceEnd = clean.lastIndexOf("}");
      if (braceStart > 0 && braceEnd > braceStart) {
        clean = clean.slice(braceStart, braceEnd + 1);
      }
      parsed = JSON.parse(clean) as Record<string, unknown>;
    } catch {
      parsed = { reply: raw, businesses: [], locationSuggestions: null, proactiveSuggestions: [], insight: "", checklistItems: [], nextPhaseHint: "" };
    }

    const mentionedNames = new Set<string>(
      ((parsed.businesses as Array<{ name: string }>) ?? []).map(b => b.name.toLowerCase())
    );
    const extraVerified = verifiedBusinesses
      .filter(b => !mentionedNames.has(b.name.toLowerCase()))
      .slice(0, 2)
      .map(b => ({
        id: b.id, name: b.name, category: b.category, description: b.description,
        neighborhood: b.city, whyForYou: `Verified on Mapping With Melanin™ in ${b.city}`,
        phone: b.phone, website: b.website, verified: b.verified, platformVerified: true,
      }));

    res.json({ ...parsed, phase: { id: currentPhase, ...phase }, extraVerified });
  } catch (err) {
    req.log.error({ err }, "Relocation concierge failed");
    res.status(500).json({ error: "Failed to generate relocation guidance" });
  }
});

// ─── Share a trip ──────────────────────────────────────────────────────────────
router.post("/kinfolk/sessions/:id/share", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const { id } = req.params as { id: string };

  const [session] = await db
    .select()
    .from(kinfolkSessionsTable)
    .where(eq(kinfolkSessionsTable.id, id))
    .limit(1);

  if (!session || session.userId !== req.user.id) {
    return void res.status(404).json({ error: "Trip not found" });
  }

  let { shareId } = session;
  if (!shareId) {
    shareId = crypto.randomBytes(8).toString("hex");
    await db
      .update(kinfolkSessionsTable)
      .set({ shareId })
      .where(eq(kinfolkSessionsTable.id, id));
  }

  return void res.json({ shareId, shareUrl: `/shared/trip/${shareId}` });
});

// ─── View a shared trip (public) ───────────────────────────────────────────────
// ─── GET /kinfolk/skip-feedback — owner views why community skipped their business ──
router.get("/kinfolk/skip-feedback", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  const skipTier = await getUserTier(String(req.user!.id));
  if (skipTier === "free" || skipTier === "navigator") {
    return void res.status(403).json({ error: "Trailblazer membership required" });
  }
  try {
    const [ownerBiz] = await db
      .select({ id: businessesTable.id })
      .from(businessesTable)
      .where(eq(businessesTable.submittedById, String(req.user.id)))
      .limit(1);
    if (!ownerBiz) return void res.json({ messages: [], total: 0 });
    const rows = await db
      .select({ message: businessSkipFeedbackTable.message })
      .from(businessSkipFeedbackTable)
      .where(eq(businessSkipFeedbackTable.businessId, ownerBiz.id))
      .orderBy(desc(businessSkipFeedbackTable.createdAt))
      .limit(25);
    const messages = rows.map((r) => r.message).filter((m): m is string => typeof m === "string" && m.trim().length > 0);
    res.json({ messages, total: messages.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch skip feedback");
    res.status(500).json({ error: "Failed to fetch skip feedback" });
  }
});

// ─── GET /api/kinfolk/memory-summary ───────────────────────────────────────────
router.get("/kinfolk/memory-summary", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  try {
    const [prefs] = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, req.user.id))
      .limit(1);
    if (!prefs) return void res.json({ summary: {} });
    res.json({
      summary: {
        favoriteCities: prefs.favoriteCities ?? [],
        favoriteCategories: prefs.favoriteCategories ?? [],
        budgetRange: prefs.budgetRange ?? null,
        travelCompanion: prefs.travelCompanion ?? null,
        tripStyle: prefs.tripStyle ?? [],
        dietaryNotes: prefs.dietaryNotes ?? null,
        communicationStyle: prefs.communicationStyle ?? null,
        personalityMode: prefs.personalityMode ?? null,
        emojiLevel: prefs.emojiLevel ?? null,
        humorLevel: prefs.humorLevel ?? null,
        culturalInterests: prefs.culturalInterests ?? [],
        diasporaCountries: prefs.diasporaCountries ?? [],
        lifestyleServices: prefs.lifestyleServices ?? [],
      },
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch memory summary");
    res.status(500).json({ error: "Failed to fetch memory summary" });
  }
});

// ─── POST /api/kinfolk/roots — save or remove a cultural community root ────────
// Writes to the existing diasporaCountries JSONB array on user_preferences.
// CRITICAL: this endpoint ONLY runs on explicit member consent — never call it
// automatically. The cultureAction in the chat response triggers a consent prompt;
// this endpoint only fires when the member clicks "Yes, use when relevant".
router.post("/kinfolk/roots", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { community, action } = req.body as { community?: string; action?: string };
  if (!community || !["add", "remove"].includes(action ?? "")) {
    res.status(400).json({ error: "community and action (add|remove) required" });
    return;
  }
  try {
    const [existing] = await db
      .select({ diasporaCountries: userPreferencesTable.diasporaCountries })
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, req.user.id))
      .limit(1);
    const current = (existing?.diasporaCountries as string[] | null) ?? [];
    const updated = action === "add"
      ? [...new Set([...current, community])]
      : current.filter((c: string) => c !== community);
    await db
      .insert(userPreferencesTable)
      .values({ userId: req.user.id, diasporaCountries: updated })
      .onConflictDoUpdate({
        target: userPreferencesTable.userId,
        set: { diasporaCountries: updated, updatedAt: new Date() },
      });
    res.json({ ok: true, diasporaCountries: updated });
  } catch (err) {
    req.log.error({ err }, "Failed to save culture roots");
    res.status(500).json({ error: "Failed to save roots" });
  }
});

// ─── GET /api/kinfolk/proactive ─────────────────────────────────────────────
router.get("/kinfolk/proactive", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  try {
    const [prefs] = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, req.user.id))
      .limit(1);

    const cities = (prefs?.favoriteCities as string[] | null) ?? [];
    const categories = (prefs?.favoriteCategories as string[] | null) ?? [];
    const tripStyle = (prefs?.tripStyle as string[] | null) ?? [];
    const lifestyleServices = (prefs?.lifestyleServices as string[] | null) ?? [];

    const dow = new Date().getDay();
    const isWeekend = dow === 0 || dow === 6;

    let suggestion: { type: string; title: string; body: string; cta: string; ctaRoute: string; icon: string };

    if (isWeekend && cities.length > 0) {
      const city = cities[0];
      suggestion = {
        type: "weekend",
        title: `Weekend in ${city}`,
        icon: "sun",
        body: `It's the weekend and KinfolkAI™ knows ${city} well. Want a curated day plan — food, culture, and community?`,
        cta: "Plan My Day",
        ctaRoute: "/(tabs)/index",
      };
    } else if (categories.length > 0) {
      const cat = categories[0];
      suggestion = {
        type: "category",
        title: `New ${cat} Spots Nearby`,
        icon: "tag",
        body: `The community has been finding amazing new ${cat.toLowerCase()} businesses. Ask KinfolkAI™ what's hot right now.`,
        cta: "Ask KinfolkAI™",
        ctaRoute: "/(tabs)/index",
      };
    } else if (tripStyle.includes("cultural") || lifestyleServices.includes("cultural_events")) {
      suggestion = {
        type: "cultural",
        title: "Explore Cultural History",
        icon: "book-open",
        body: "Discover historic sites and cultural landmarks connected to your community — tap the map's cultural layer.",
        cta: "Open Map",
        ctaRoute: "/(tabs)/map",
      };
    } else {
      suggestion = {
        type: "safety",
        title: "Help Keep the Community Safe",
        icon: "shield",
        body: "Share your neighborhood safety experience and help others travel with confidence. It only takes 2 minutes.",
        cta: "Submit a Survey",
        ctaRoute: "/neighborhood-survey",
      };
    }

    res.json({ suggestion });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch proactive suggestion");
    res.status(500).json({ error: "Failed to fetch proactive suggestion" });
  }
});

// ─── POST /api/kinfolk/transcribe — hardened per Voice Audit spec ─────────────
// Member-keyed rate limiter: 10 requests / 15 minutes per authenticated user.
// IP fallback only for unauthenticated edge rejection (separate bucket).
const transcribeUserBuckets = new Map<string, { count: number; resetAt: number }>();
const transcribeIpBuckets  = new Map<string, { count: number; resetAt: number }>();
const TRANSCRIBE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const TRANSCRIBE_USER_LIMIT = 10;
const TRANSCRIBE_IP_LIMIT   = 5;  // tighter for unauthenticated edge rejection

function checkTranscribeLimit(key: string, map: Map<string, { count: number; resetAt: number }>, limit: number): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = map.get(key);
  if (!bucket || now > bucket.resetAt) {
    map.set(key, { count: 1, resetAt: now + TRANSCRIBE_WINDOW_MS });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= limit) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count++;
  return { allowed: true, retryAfterMs: 0 };
}

const ALLOWED_AUDIO_FORMATS = new Set(["webm", "m4a", "wav", "mp3"]);
const MAX_DECODED_BYTES = 10 * 1024 * 1024; // 10 MB
// base64 expands ~33%, so max base64 chars = ceil(10MB / 3 * 4) ≈ 13,981,013
const MAX_BASE64_CHARS = Math.ceil(MAX_DECODED_BYTES / 3) * 4 + 4;
const MAX_VOICE_DURATION_MS = 60_000;
const MAX_VOICE_PAYLOAD_BYTES = 4 * 1024 * 1024; // 4 MB binary cap for multipart path

// Multer — memory storage, accept only audio fields, 4 MB binary limit.
// Used for the new multipart/form-data upload path. The legacy JSON path
// (base64-in-JSON) is preserved for backwards compatibility.
import multer from "multer";
const transcribeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VOICE_PAYLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ok = file.fieldname === "audio" && /^audio\//i.test(file.mimetype);
    if (!ok) {
      cb(new Error("UNSUPPORTED_FIELD"));
      return;
    }
    cb(null, true);
  },
}).single("audio");

function runMulter(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    transcribeUpload(req, res, (err) => {
      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        reject(Object.assign(new Error("AUDIO_PAYLOAD_TOO_LARGE"), { isPayloadTooLarge: true }));
      } else if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

router.post("/kinfolk/transcribe", async (req: Request, res: Response) => {
  if (!process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]) {
    return void res.status(503).json({ error: "TRANSCRIPTION_UNAVAILABLE", message: "Transcription is temporarily unavailable." });
  }

  // 1. Authentication required
  if (!req.user?.id) {
    return void res.status(401).json({ error: "AUTHENTICATION_REQUIRED", message: "Sign in to use voice input.", audioRetained: false });
  }

  // 2. Per-member rate limit (primary)
  const memberCheck = checkTranscribeLimit(req.user.id, transcribeUserBuckets, TRANSCRIBE_USER_LIMIT);
  if (!memberCheck.allowed) {
    const retrySec = Math.ceil(memberCheck.retryAfterMs / 1000);
    res.set("Retry-After", String(retrySec));
    return void res.status(429).json({ error: "VOICE_INPUT_RATE_LIMITED", message: `Voice input limit reached. Try again in ${retrySec} seconds.`, audioRetained: false });
  }

  // ── Detect upload path: multipart/form-data (new) vs JSON (legacy) ───────
  const isMultipart = req.is("multipart/form-data");
  let buffer: Buffer;
  let safeFormat: string;

  if (isMultipart) {
    // New path: binary FormData upload — no base64 expansion, separate
    // duration and payload size checks so a 2-second clip is never
    // falsely labelled "over 60 seconds" due to a proxy byte limit.
    try {
      await runMulter(req, res);
    } catch (multerErr: unknown) {
      if ((multerErr as { isPayloadTooLarge?: boolean }).isPayloadTooLarge) {
        return void res.status(413).json({
          error: "AUDIO_PAYLOAD_TOO_LARGE",
          message: "This voice clip is too large to upload. Please try a shorter or lower-quality recording.",
          audioRetained: false,
        });
      }
      return void res.status(400).json({ error: "AUDIO_UNREADABLE", message: "Kinfolk could not read that audio. Please try again or type your question.", audioRetained: false });
    }

    if (!req.file?.buffer?.length) {
      return void res.status(400).json({ error: "AUDIO_REQUIRED", message: "No audio data provided.", audioRetained: false });
    }

    // Duration check — uses wall-clock ms reported by client (never inferred from bytes)
    const rawDurationMs = Number((req.body as Record<string, string>).durationMs ?? -1);
    if (Number.isFinite(rawDurationMs) && rawDurationMs >= 0 && rawDurationMs > MAX_VOICE_DURATION_MS) {
      return void res.status(400).json({
        error: "AUDIO_DURATION_EXCEEDED",
        message: "That recording is over 60 seconds. Please send a shorter clip.",
        audioRetained: false,
      });
    }

    // Payload size gate (4 MB binary)
    if (req.file.buffer.length > MAX_VOICE_PAYLOAD_BYTES) {
      return void res.status(413).json({
        error: "AUDIO_PAYLOAD_TOO_LARGE",
        message: "This voice clip is too large to upload. Please try a shorter or lower-quality recording.",
        audioRetained: false,
      });
    }

    buffer = req.file.buffer;
    const rawMime = ((req.body as Record<string, string>).mimeType ?? req.file.mimetype ?? "audio/webm")
      .split(";")[0].replace("audio/", "").toLowerCase();
    safeFormat = (rawMime === "mp4" || rawMime === "x-m4a" ? "m4a" : (rawMime || "webm")).replace(/[^a-z0-9]/g, "");

  } else {
    // Legacy JSON path (base64 audio) — kept for backwards compatibility
    const { audio, format, durationSeconds } = req.body as {
      audio?: string;
      format?: string;
      durationSeconds?: number | null;
    };

    // Duration validation — only reject when client explicitly reports > 60 s
    if (durationSeconds !== undefined && durationSeconds !== null) {
      const dv = validateVoiceRecording({ durationSeconds, base64Audio: audio ?? "" });
      if (!dv.ok && dv.code === "VOICE_CLIP_TOO_LONG") {
        return void res.status(400).json({ error: "AUDIO_DURATION_EXCEEDED", message: dv.message, audioRetained: false });
      }
    }

    if (!audio || typeof audio !== "string" || !audio.trim()) {
      return void res.status(400).json({ error: "AUDIO_REQUIRED", message: "No audio data provided.", audioRetained: false });
    }

    safeFormat = (format ?? "webm").toLowerCase().replace(/[^a-z0-9]/g, "");

    // Base64 size cap (checked before Buffer.from to avoid OOM)
    if (audio.length > MAX_BASE64_CHARS) {
      return void res.status(413).json({ error: "AUDIO_PAYLOAD_TOO_LARGE", message: "Audio exceeds the 10 MB maximum. Use a shorter clip.", audioRetained: false });
    }

    try {
      buffer = Buffer.from(audio, "base64");
    } catch {
      return void res.status(400).json({ error: "AUDIO_REQUIRED", message: "Audio data could not be decoded.", audioRetained: false });
    }
    if (buffer.length > MAX_DECODED_BYTES) {
      return void res.status(413).json({ error: "AUDIO_PAYLOAD_TOO_LARGE", message: "Audio exceeds the 10 MB maximum after decoding.", audioRetained: false });
    }
  } // end legacy JSON path

  // Format allowlist — applied after both upload paths resolve safeFormat
  if (!ALLOWED_AUDIO_FORMATS.has(safeFormat)) {
    return void res.status(400).json({ error: "UNSUPPORTED_AUDIO_FORMAT", message: `Format '${safeFormat}' is not accepted. Use webm, m4a, wav, or mp3.`, audioRetained: false });
  }

  if (buffer.length < 100) {
    return void res.status(400).json({ error: "AUDIO_REQUIRED", message: "Audio clip is too short.", audioRetained: false });
  }

  // 7. Transcribe with 15-second timeout — never persist audio blob
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  const startMs = Date.now();

  try {
    const audioBytes = new Uint8Array(buffer);
    const blob = new Blob([audioBytes], { type: `audio/${safeFormat}` });
    const file = new File([blob], `voice.${safeFormat}`, { type: `audio/${safeFormat}` });

    const transcription = await openai.audio.transcriptions.create(
      { file, model: "whisper-1" },
      { signal: controller.signal },
    );

    // Log outcome + latency only — never log audio content, transcript text, or user context
    req.log.info({ userId: req.user.id, latencyMs: Date.now() - startMs, format: safeFormat }, "kinfolk-transcribe: success");

    // Empty transcript — provider returned no text (silence, background noise, etc.)
    const transcriptText = normalizeTranscript(transcription.text);
    if (!transcriptText) {
      return void res.status(422).json({
        error: "EMPTY_TRANSCRIPT",
        message: "I couldn't hear any words. Please try again or type your question.",
        audioRetained: false,
      });
    }

    return void res.json({ text: transcriptText, audioRetained: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    const isAbort = msg.includes("abort") || msg.includes("timeout");
    req.log.error({ latencyMs: Date.now() - startMs, format: safeFormat, aborted: isAbort }, "kinfolk-transcribe: failed");

    if (isAbort) {
      return void res.status(503).json({ error: "TRANSCRIPTION_UNAVAILABLE", message: "Transcription timed out. Please try again or type your question.", audioRetained: false });
    }
    return void res.status(503).json({ error: "TRANSCRIPTION_UNAVAILABLE", message: "Transcription failed. Please try again.", audioRetained: false });
  } finally {
    clearTimeout(timeout);
  }
});

// ─── POST /api/kinfolk/speak — TTS, gated by monthly char allowance ───────────
router.post("/kinfolk/speak", async (req: Request, res: Response) => {
  if (!process.env["AI_INTEGRATIONS_OPENAI_API_KEY"]) {
    return void res.status(503).json({ error: "AI service unavailable" });
  }
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });

  const { text, voice: requestedVoice } = req.body as { text?: string; voice?: string };
  if (!text || typeof text !== "string") return void res.status(400).json({ error: "text is required" });
  if (requestedVoice !== undefined && !isKinfolkVoice(requestedVoice)) {
    return void res.status(400).json({ error: "INVALID_VOICE" });
  }
  const savedPrefs = await getCachedPrefs(req.user.id);
  const voice = normalizeKinfolkVoice(savedPrefs?.kinfolkVoice ?? requestedVoice);

  const chars = Math.min(text.length, 600);
  const speakText = chars < text.length ? text.slice(0, 597) + "…" : text;

  try {
    const [userRow] = await db
      .select({ memberType: usersTable.memberType })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    const tier = getTierFromMemberType(userRow?.memberType);
    const usage = await checkVoiceUsage(req.user.id, tier);

    if (!usage.allowed) {
      return void res.status(429).json({
        error: "Voice allowance reached for this month",
        limitReached: true,
        used: usage.used,
        limit: usage.limit,
        tierName: TIER_LIMITS[tier].voiceTierName,
      });
    }

    const audioBuffer = await textToSpeech(speakText, voice, "wav");
    await incrementVoiceChars(req.user.id, chars);

    const newUsed = usage.used + chars;
    const percentRemaining = usage.limit === -1
      ? 100
      : Math.max(0, Math.round(((usage.limit - newUsed) / usage.limit) * 100));

    res.json({
      audio: audioBuffer.toString("base64"),
      format: "wav",
      voice,          // returned so the UI can confirm which voice was used
      charsUsed: newUsed,
      charsLimit: usage.limit,
      percentRemaining,
      tierName: TIER_LIMITS[tier].voiceTierName,
    });
  } catch (err) {
    req.log.error({ err }, "TTS failed");
    res.status(500).json({ error: "TTS failed" });
  }
});

// ─── GET /api/kinfolk/voice-usage — current monthly voice allowance ────────────
router.get("/kinfolk/voice-usage", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  try {
    const [userRow] = await db
      .select({ memberType: usersTable.memberType })
      .from(usersTable)
      .where(eq(usersTable.id, req.user.id))
      .limit(1);
    const tier = getTierFromMemberType(userRow?.memberType);
    const usage = await getVoiceUsage(req.user.id, tier);
    const percentRemaining = usage.limit === -1
      ? 100
      : Math.max(0, Math.round(((usage.limit - usage.used) / usage.limit) * 100));
    res.json({
      charsUsed: usage.used,
      charsLimit: usage.limit,
      tierName: TIER_LIMITS[tier].voiceTierName,
      percentRemaining,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch voice usage");
    res.status(500).json({ error: "Failed to fetch voice usage" });
  }
});

// ─── PATCH /api/kinfolk/aave-level — save user's AAVE cultural voice level ────
router.patch("/kinfolk/aave-level", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });

  const { level } = req.body as { level?: number };
  if (level === undefined || !Number.isInteger(level) || level < 0 || level > 3) {
    return void res.status(400).json({ error: "level must be an integer 0–3" });
  }

  try {
    await db
      .insert(userPreferencesTable)
      .values({ userId: req.user.id, aaveLevel: level })
      .onConflictDoUpdate({
        target: userPreferencesTable.userId,
        set: { aaveLevel: level, updatedAt: new Date() },
      });
    invalidatePrefsCache(req.user.id);
    res.json({ aaveLevel: level });
  } catch (err) {
    req.log.error({ err }, "Failed to save AAVE level");
    res.status(500).json({ error: "Failed to save AAVE level" });
  }
});

// ─── Adaptive Depth — answer plan depth change ───────────────────────────────
// Records a show_more / show_less event so we can learn the member's preferred
// depth over time. The client updates the message state optimistically; this
// endpoint just persists the signal. Never adapts sensitive domains silently.
router.patch("/kinfolk/answer-plans/:answerPlanId/depth", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Authentication required" });
  const { answerPlanId } = req.params as { answerPlanId: string };
  const { action } = req.body as { action?: string };
  if (action !== "show_more" && action !== "show_less") {
    return void res.status(400).json({ error: "action must be show_more or show_less" });
  }
  try {
    // The owner predicate is part of the UPDATE, not a separate authorization
    // check. This keeps the operation atomic and prevents cross-user changes.
    const plan = await updateOwnedAnswerPlanDepth({
      query: pool,
      answerPlanId,
      userId: req.user.id,
      action,
    });
    if (!plan) return void res.status(404).json({ error: "Answer plan not found" });
    const eligible = !plan.isSensitive && !["under_13"].includes(plan.audienceBand);
    let recorded = true;
    try {
      await pool.query(
      `INSERT INTO kinfolk_depth_feedback_events
         (user_id, domain_class, action, eligible_for_default_learning, age_band_at_action)
       VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, plan.domainClass, action, eligible, plan.audienceBand],
      );
    } catch (err) {
      // The scoped answer update succeeded; feedback is optional learning data.
      recorded = false;
      req.log?.warn({ err }, "Kinfolk depth feedback persistence unavailable");
    }
    res.json({ ok: true, recorded, eligibleForLearning: eligible });
  } catch (err) {
    req.log?.warn({ err }, "Kinfolk answer-plan depth persistence unavailable");
    res.status(503).json({ error: "Answer-plan persistence is temporarily unavailable" });
  }
});

router.get("/kinfolk/shared/:shareId", async (req: Request, res: Response) => {
  const { shareId } = req.params as { shareId: string };
  try {
    const [session] = await db
      .select()
      .from(kinfolkSessionsTable)
      .where(eq(kinfolkSessionsTable.shareId, shareId))
      .limit(1);

    if (!session) return void res.status(404).json({ error: "Trip not found" });

    const msgs = session.messages ?? [];
    const lastRec = [...msgs].reverse().find(m => m.role === "assistant" && m.recommendations);

    return void res.json({
      title: session.title,
      destination: session.destination,
      lastRecommendations: lastRec?.recommendations ?? null,
      followUpSuggestions: lastRec?.followUpSuggestions ?? [],
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch shared trip");
    res.status(500).json({ error: "Failed to fetch shared trip" });
  }
});

export default router;
