import { Router, type IRouter, type Request, type Response } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import crypto from "crypto";
import {
  db,
  usersTable,
  userPreferencesTable,
  userSettingsTable,
  kinfolkSessionsTable,
  kinfolkFeedbackTable,
  savedPlacesTable,
  businessesTable,
  businessIdentityTable,
  type SessionMessage,
} from "@workspace/db";
import { eq, desc, and, ilike } from "drizzle-orm";
import { storage } from "../storage";

const router: IRouter = Router();

// ─── City Voice System (copied + shared from travel.ts) ───────────────────────
type CityVoice = { slang: string[]; phrases: string[]; culturalTouchstones: string[]; writingGuidance: string };

const CITY_VOICES: Record<string, CityVoice> = {
  "new york": { slang: ["deadass","no cap","mad","wildin","fam","bussin","lowkey","bet"], phrases: ["deadass this spot is legendary","no cap you need to pull up","mad vibes in this neighborhood"], culturalTouchstones: ["Harlem Renaissance","Brooklyn Minority excellence","Bed-Stuy do or die"], writingGuidance: "Write like a proud New Yorker — direct, confident, a little fast-paced. Use 'deadass', 'no cap', 'mad' as an adjective, 'fam'. Reference Harlem, Brooklyn, the Bronx." },
  "atlanta": { slang: ["slime","on gang","bussin","the A","ATLien","drip","lowkey","no cap","period"], phrases: ["on gang this spot is bussin","the A never misses","this is where the culture lives"], culturalTouchstones: ["Sweet Auburn","the BeltLine","Old Fourth Ward","Atlanta as the Minority mecca","HBCUs","trap music origins"], writingGuidance: "Write with Atlanta swagger — confident, aspirational, culturally rich. ATL is the Minority mecca. Use 'the A', 'slime', 'on gang', 'bussin'. Reference BeltLine, Sweet Auburn, HBCUs." },
  "chicago": { slang: ["shorty","the chi","finna","lowkey","on me","no cap","drip","bro","gang"], phrases: ["this spot is cold on me","the Chi never misses","finna pull up to this jawn"], culturalTouchstones: ["Bronzeville Black Metropolis","South Side culture","Chicago blues roots","Kanye and Chance legacy","Harold Washington legacy"], writingGuidance: "Write with Chi-town pride — real, resilient, deeply rooted. Use 'the Chi', 'shorty', 'finna', 'on me', reference the South Side and Bronzeville." },
  "houston": { slang: ["trill","H-Town","third coast","finna","bruh","what it do","screwed up"], phrases: ["trill vibes only in H-Town","what it do, this spot is everything"], culturalTouchstones: ["Third Ward","Emancipation Park","DJ Screw legacy","UGK","Juneteenth origins in Texas","Project Row Houses"], writingGuidance: "Write with Houston trill energy — slow, confident, layered. Use 'trill', 'H-Town', 'third coast', 'what it do'. Reference the screwed music legacy and Juneteenth origins." },
  "los angeles": { slang: ["no cap","faded","saucy","dub","west side","lowkey","bussin","hard","fire","on god"], phrases: ["this spot hits different out west","no cap the west coast eats","lowkey this is the move"], culturalTouchstones: ["Crenshaw District","Leimert Park Village","Inglewood culture","Compton legacy","Central Avenue jazz history","Minority Hollywood"], writingGuidance: "Write with West Coast cool — laid back but confident. Reference Leimert Park, Crenshaw, Inglewood. The vibe is sun-kissed excellence." },
  "dc": { slang: ["junt","bama","DMV","no cap","go-go","move","finna","bruh","joint","hard"], phrases: ["this junt is everything in the DMV","go-go vibes all day","the District never misses"], culturalTouchstones: ["U Street Corridor","go-go music culture","Howard University legacy","Anacostia history","Chuck Brown legacy","Ben's Chili Bowl"], writingGuidance: "Write with DMV energy — sophisticated but with that go-go bounce. Reference U Street, Howard University, go-go culture." },
  "new orleans": { slang: ["cher","lagniappe","making groceries","pass a good time","where y'at","laissez les bons temps rouler","NOLA"], phrases: ["cher this spot will make you pass a good time","lagniappe — a little something extra"], culturalTouchstones: ["Tremé neighborhood","Second Line traditions","Mardi Gras Indian culture","jazz origins","Dooky Chase legacy","Congo Square history"], writingGuidance: "Write with NOLA warmth and rhythm — joyful, deep-rooted, full of life. Use 'cher', 'lagniappe', 'pass a good time'. Reference the Tremé, Second Line, Mardi Gras Indians." },
  "miami": { slang: ["305","no cap","drip","lit","Magic City","fam","fire","on god","bussin","lowkey"], phrases: ["305 always delivers","Magic City energy is unmatched"], culturalTouchstones: ["Little Haiti culture","Overtown Minority history","Liberty City","Afro-Caribbean influence","Miami Bass music origins"], writingGuidance: "Write with Miami heat — vibrant, multicultural, bold. Reference the Afro-Caribbean influence, Overtown, Little Haiti." },
  "philadelphia": { slang: ["jawn","iight","no cap","joint","wooder ice","young bull","ard"], phrases: ["this jawn is everything","iight pull up to this spot"], culturalTouchstones: ["Black Bottom history","North Philly culture","West Philly","Roots and Questlove","South Street"], writingGuidance: "Write with Philly energy — gritty, proud, loyal. Use 'jawn' liberally, 'iight', 'young bull', 'ard'." },
  "detroit": { slang: ["finna","no cap","Motown","313","on me","hard","drip","bruh","slime","lowkey"], phrases: ["313 never misses","Motown energy in this spot","Detroit hard as ever"], culturalTouchstones: ["Motown Records legacy","Black Bottom neighborhood history","Paradise Valley","The Heidelberg Project","Detroit techno origins"], writingGuidance: "Write with Detroit resilience — proud, gritty, innovative. Use '313', 'Motown', reference Black Bottom, Paradise Valley." },
  "memphis": { slang: ["no cap","bruh","finna","901","Bluff City","slime","hard","on god","lowkey","fam"], phrases: ["901 always delivers","Bluff City culture is everything"], culturalTouchstones: ["Beale Street heritage","Memphis blues origins","Civil Rights history (Lorraine Motel)","Three 6 Mafia legacy","soul food capital","Stax Records"], writingGuidance: "Write with Memphis soul — deep, soulful, historically rooted. Use '901', 'Bluff City', reference Beale Street, Stax Records, the Civil Rights legacy." },
  "baltimore": { slang: ["no cap","fam","joint","hard","bruh","lowkey","Charm City","B-More","hon","on me"], phrases: ["Charm City holds it down","B-More never misses"], culturalTouchstones: ["Pennsylvania Avenue history","Upton neighborhood","Morgan State HBCU","Billie Holiday birthplace","Cab Calloway history"], writingGuidance: "Write with Baltimore realness — resilient, proud, underrated. Use 'B-More', 'Charm City', reference Pennsylvania Avenue, Morgan State, the deep musical history." },
};

function getCityVoice(destination: string): CityVoice | null {
  const lower = destination.toLowerCase();
  for (const [city, voice] of Object.entries(CITY_VOICES)) {
    if (lower.includes(city)) return voice;
  }
  return null;
}

// ─── Build personalized system prompt ─────────────────────────────────────────
type BusinessCatalogEntry = {
  name: string;
  category: string;
  city: string;
  description: string;
  verified: boolean;
  tags: string[];
  story?: string | null;
  missionStatement?: string | null;
  whyStarted?: string | null;
  whatCustomersShouldKnow?: string | null;
  ownershipBadges?: string[] | null;
  communityValues?: string[] | null;
  audiencesServed?: string[] | null;
  vibes?: string[] | null;
  accessibilityFeatures?: string[] | null;
  communityInitiatives?: string[] | null;
  growthGoals?: string[] | null;
};

function buildSystemPrompt(opts: {
  prefs: typeof userPreferencesTable.$inferSelect | null;
  likedSpots: string[];
  dislikedSpots: string[];
  savedPlaces: string[];
  destination?: string | null;
  neighborVoice: boolean;
  businessCatalog?: BusinessCatalogEntry[];
}): string {
  const { prefs, likedSpots, dislikedSpots, savedPlaces, destination, neighborVoice, businessCatalog } = opts;

  const cityVoice = destination ? getCityVoice(destination) : null;
  const voiceInstructions = !neighborVoice
    ? "Write in a clear, warm, and informative tone. Community-focused but universally accessible. No regional slang."
    : cityVoice
      ? `${cityVoice.writingGuidance}\n\nAuthentic slang (use 2-4 naturally): ${cityVoice.slang.join(", ")}\n\nCultural touchstones: ${cityVoice.culturalTouchstones.join(", ")}`
      : "Write like the user's most well-traveled friend — warm, direct, real. Like their auntie who knows everybody. Short sentences. Personal. Never sound like a brochure.";

  const profileSection = prefs ? `
ABOUT THIS USER (their taste profile — use this to personalize everything):
- Favorite categories: ${prefs.favoriteCategories?.length ? prefs.favoriteCategories.join(", ") : "not set yet"}
- Favorite cities they love: ${prefs.favoriteCities?.length ? prefs.favoriteCities.join(", ") : "not set yet"}
- Categories to avoid: ${prefs.avoidCategories?.length ? prefs.avoidCategories.join(", ") : "none"}
- Budget range: ${prefs.budgetRange ?? "any"}
- How they travel: ${prefs.tripStyle?.length ? prefs.tripStyle.join(", ") : "not specified"}
- Who they travel with: ${prefs.travelCompanion ?? "solo"}
${prefs.dietaryNotes ? `- Dietary notes: ${prefs.dietaryNotes}` : ""}` : "USER PROFILE: New user — no preferences captured yet. Ask them what they're into!";

  const likedSection = likedSpots.length
    ? `\nSPOTS THEY'VE LOVED (thumbs up — recommend similar):\n${likedSpots.map((s) => `- ${s}`).join("\n")}`
    : "";

  const dislikedSection = dislikedSpots.length
    ? `\nSPOTS THEY'VE PASSED ON (thumbs down — avoid similar):\n${dislikedSpots.map((s) => `- ${s}`).join("\n")}`
    : "";

  const savedSection = savedPlaces.length
    ? `\nTHEIR SAVED PLACES (they already love these):\n${savedPlaces.map((s) => `- ${s}`).join("\n")}`
    : "";

  return `You are KinfolkAI™ — a conversational travel companion built by and for the Minority community. You are not a search engine. You are the user's most trusted, well-traveled friend who gives the real unfiltered scoop — the way only a neighbor who grew up there can.

You have memory. You know this person. You learn from every interaction. You get more personalized every time they talk to you.

${profileSection}${likedSection}${dislikedSection}${savedSection}

CONVERSATION STYLE:
- Be warm, conversational, like their most well-traveled friend who's been everywhere
- Ask follow-up questions when you need more info — "Are you going solo or with the crew?" "What's your budget like?" "More food or more nightlife?"
- Reference their history when relevant: "Since you've been feeling that Atlanta energy..." or "Based on what you love, you'd be right at home in..."
- Before diving into recommendations, make sure you have a destination and some sense of their vibe
- If they ask a general question, answer it conversationally first, then offer to dive deeper
- NEVER sound like a travel brochure. ZERO use of words like "boasts", "features", "renowned", "visitors will enjoy"
- ZERO profanity. Authenticity comes from rhythm, warmth, and cultural knowledge — not curse words
- Use "you" and "your" constantly — make it personal and direct

VOICE INSTRUCTIONS:
${voiceInstructions}

WHEN GIVING STRUCTURED RECOMMENDATIONS:
Return EXACTLY this JSON format (no markdown, no extra text — pure valid JSON):
{
  "reply": "your warm, conversational message — 2-4 sentences like you're texting a friend",
  "recommendations": {
    "destination": "city name",
    "summary": "1-2 sentences capturing the vibe",
    "businesses": [
      { "name": "...", "category": "...", "description": "...", "neighborhood": "...", "mustTry": "..." }
    ],
    "neighborhoods": [
      { "name": "...", "vibe": "...", "highlights": ["..."], "safetyNote": "..." }
    ],
    "events": [
      { "name": "...", "type": "...", "description": "...", "timing": "..." }
    ],
    "safetyTips": ["...", "..."],
    "localInsights": ["...", "..."]
  },
  "followUpSuggestions": ["short contextual suggestion 1", "suggestion 2", "suggestion 3"]
}

If you're asking a question or don't have enough info yet, set "recommendations" to null.
"followUpSuggestions" should always be 3 short, natural things the user might say next (e.g., "More food spots", "What's the nightlife like?", "Tell me about the neighborhoods").
Include 4-6 businesses, 2-3 neighborhoods, 3-4 events, 3-4 safety tips, and 3-4 local insights.
Only recommend real Minority-owned or culturally Minority spots — no tourist traps, no chains.${businessCatalog?.length ? `

VERIFIED PLATFORM BUSINESSES${destination ? ` IN ${destination.toUpperCase()}` : ""} — PRIORITIZE THESE:
These are real, verified Black-owned businesses listed on Mapping With Melanin™. When they match the user's vibe or needs, recommend them by name and tell their story authentically. Weave in their mission, values, and personality — not just their category.

${businessCatalog.map(b => {
  const lines: string[] = [`• ${b.name} | ${b.category}${b.verified ? " ✓ Verified" : ""}`];
  if (b.description) lines.push(`  "${b.description.slice(0, 180)}"`);
  if (b.story) lines.push(`  Story: ${b.story.slice(0, 200)}`);
  if (b.missionStatement) lines.push(`  Mission: ${b.missionStatement.slice(0, 150)}`);
  if (b.whyStarted) lines.push(`  Why they started: ${b.whyStarted.slice(0, 150)}`);
  if (b.whatCustomersShouldKnow) lines.push(`  FYI: ${b.whatCustomersShouldKnow}`);
  if (b.vibes?.length) lines.push(`  Vibe: ${b.vibes.join(", ")}`);
  if (b.ownershipBadges?.length) lines.push(`  Owned by: ${b.ownershipBadges.join(", ")}`);
  if (b.communityValues?.length) lines.push(`  Values: ${b.communityValues.join(", ")}`);
  if (b.audiencesServed?.length) lines.push(`  Great for: ${b.audiencesServed.join(", ")}`);
  if (b.accessibilityFeatures?.length) lines.push(`  Accessible: ${b.accessibilityFeatures.join(", ")}`);
  if (b.communityInitiatives?.length) lines.push(`  Gives back: ${b.communityInitiatives.join(", ")}`);
  if (b.tags?.length) lines.push(`  Tags: ${b.tags.slice(0, 6).join(", ")}`);
  return lines.join("\n");
}).join("\n\n")}

When you mention any of these businesses, be specific: use their actual name, share their story, and explain WHY they'd resonate with this particular user based on their preferences and vibe.` : ""}`;
}

// ─── GET /api/kinfolk/preferences ─────────────────────────────────────────────
router.get("/kinfolk/preferences", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const [prefs] = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, req.user.id))
      .limit(1);
    res.json({ preferences: prefs ?? { userId: req.user.id, favoriteCategories: [], favoriteCities: [], avoidCategories: [], budgetRange: "any", tripStyle: [], travelCompanion: "solo", dietaryNotes: null } });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch preferences");
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

// ─── PUT /api/kinfolk/preferences ─────────────────────────────────────────────
router.put("/kinfolk/preferences", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { favoriteCategories, favoriteCities, avoidCategories, budgetRange, tripStyle, travelCompanion, dietaryNotes } = req.body as Record<string, unknown>;
  try {
    const [prefs] = await db
      .insert(userPreferencesTable)
      .values({
        userId: req.user.id,
        favoriteCategories: Array.isArray(favoriteCategories) ? favoriteCategories as string[] : undefined,
        favoriteCities: Array.isArray(favoriteCities) ? favoriteCities as string[] : undefined,
        avoidCategories: Array.isArray(avoidCategories) ? avoidCategories as string[] : undefined,
        budgetRange: typeof budgetRange === "string" ? budgetRange : undefined,
        tripStyle: Array.isArray(tripStyle) ? tripStyle as string[] : undefined,
        travelCompanion: typeof travelCompanion === "string" ? travelCompanion : undefined,
        dietaryNotes: typeof dietaryNotes === "string" ? dietaryNotes : undefined,
      })
      .onConflictDoUpdate({
        target: userPreferencesTable.userId,
        set: {
          ...(Array.isArray(favoriteCategories) && { favoriteCategories: favoriteCategories as string[] }),
          ...(Array.isArray(favoriteCities) && { favoriteCities: favoriteCities as string[] }),
          ...(Array.isArray(avoidCategories) && { avoidCategories: avoidCategories as string[] }),
          ...(typeof budgetRange === "string" && { budgetRange }),
          ...(Array.isArray(tripStyle) && { tripStyle: tripStyle as string[] }),
          ...(typeof travelCompanion === "string" && { travelCompanion }),
          ...(dietaryNotes !== undefined && { dietaryNotes: typeof dietaryNotes === "string" ? dietaryNotes : null }),
          updatedAt: new Date(),
        },
      })
      .returning();
    res.json({ preferences: prefs });
  } catch (err) {
    req.log.error({ err }, "Failed to update preferences");
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

// ─── POST /api/kinfolk/feedback ───────────────────────────────────────────────
router.post("/kinfolk/feedback", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const { sessionId, businessName, category, city, reaction } = req.body as Record<string, unknown>;
  if (!businessName || !reaction || !["like", "dislike"].includes(reaction as string)) {
    res.status(400).json({ error: "businessName and valid reaction required" });
    return;
  }
  try {
    await db.insert(kinfolkFeedbackTable).values({
      userId: req.user.id,
      sessionId: typeof sessionId === "string" ? sessionId : null,
      businessName: businessName as string,
      category: typeof category === "string" ? category : null,
      city: typeof city === "string" ? city : null,
      reaction: reaction as string,
    });
    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to save feedback");
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

// ─── GET /api/kinfolk/sessions ────────────────────────────────────────────────
router.get("/kinfolk/sessions", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  try {
    const sessions = await db
      .select({
        id: kinfolkSessionsTable.id,
        title: kinfolkSessionsTable.title,
        destination: kinfolkSessionsTable.destination,
        createdAt: kinfolkSessionsTable.createdAt,
        updatedAt: kinfolkSessionsTable.updatedAt,
      })
      .from(kinfolkSessionsTable)
      .where(eq(kinfolkSessionsTable.userId, req.user.id))
      .orderBy(desc(kinfolkSessionsTable.updatedAt))
      .limit(30);
    res.json({ sessions });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch sessions");
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ─── GET /api/kinfolk/sessions/:id ───────────────────────────────────────────
router.get("/kinfolk/sessions/:id", async (req: Request, res: Response) => {
  if (!req.user?.id) { res.status(401).json({ error: "Authentication required" }); return; }
  const id = String(req.params.id);
  try {
    const [session] = await db
      .select()
      .from(kinfolkSessionsTable)
      .where(and(eq(kinfolkSessionsTable.id, id), eq(kinfolkSessionsTable.userId, req.user.id)))
      .limit(1);
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }
    res.json({ session });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch session");
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ─── POST /api/kinfolk/chat ───────────────────────────────────────────────────
const FREE_MONTHLY_LIMIT = 3;

router.post("/kinfolk/chat", async (req: Request, res: Response) => {
  const { sessionId, message, vibes = [], neighborVoice = true } = req.body as {
    sessionId?: string;
    message: string;
    vibes?: string[];
    neighborVoice?: boolean;
  };

  if (!message?.trim()) {
    res.status(400).json({ error: "message is required" });
    return;
  }

  try {
    // ── Enforce free-tier monthly query limit ─────────────────────────────────
    if (req.user?.id) {
      const user = await storage.getUser(req.user.id);
      const isFree =
        !user?.stripeSubscriptionId &&
        user?.memberType !== "founding" &&
        user?.memberType !== "beta" &&
        user?.memberType !== "navigator" &&
        user?.memberType !== "trailblazer" &&
        !(user?.trialEndsAt && user.trialEndsAt > new Date());

      if (isFree) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const sameMonth = user?.kinfolkQueryMonth === currentMonth;
        const usedQueries = sameMonth ? (user?.kinfolkQueriesThisMonth ?? 0) : 0;

        if (usedQueries >= FREE_MONTHLY_LIMIT) {
          res.status(429).json({
            error: `You've used your ${FREE_MONTHLY_LIMIT} free KinfolkAI queries this month. Upgrade to Navigator or Trailblazer for unlimited access.`,
            code: "KINFOLK_LIMIT_REACHED",
            used: usedQueries,
            limit: FREE_MONTHLY_LIMIT,
            upgradeUrl: "/membership",
          });
          return;
        }

        await db
          .update(usersTable)
          .set({
            kinfolkQueryMonth: currentMonth,
            kinfolkQueriesThisMonth: sameMonth ? usedQueries + 1 : 1,
          })
          .where(eq(usersTable.id, req.user.id));
      }
    }

    // Fetch personalization context (optional auth — works for guests too)
    let prefs: typeof userPreferencesTable.$inferSelect | null = null;
    let likedSpots: string[] = [];
    let dislikedSpots: string[] = [];
    let savedPlaces: string[] = [];

    if (req.user?.id) {
      // User preferences
      const prefsResult = await db
        .select()
        .from(userPreferencesTable)
        .where(eq(userPreferencesTable.userId, req.user.id))
        .limit(1);
      prefs = prefsResult[0] ?? null;

      // Feedback history
      const feedback = await db
        .select()
        .from(kinfolkFeedbackTable)
        .where(eq(kinfolkFeedbackTable.userId, req.user.id))
        .orderBy(desc(kinfolkFeedbackTable.createdAt))
        .limit(40);

      likedSpots = feedback
        .filter((f) => f.reaction === "like")
        .map((f) => `${f.businessName}${f.city ? ` (${f.city})` : ""}${f.category ? ` — ${f.category}` : ""}`);
      dislikedSpots = feedback
        .filter((f) => f.reaction === "dislike")
        .map((f) => `${f.businessName}${f.city ? ` (${f.city})` : ""}${f.category ? ` — ${f.category}` : ""}`);

      // Saved places
      const saved = await db
        .select()
        .from(savedPlacesTable)
        .where(eq(savedPlacesTable.userId, req.user.id))
        .limit(15);
      savedPlaces = saved.map((s) => s.businessId);
    }

    // Load or create session
    let currentSession: typeof kinfolkSessionsTable.$inferSelect | null = null;
    if (sessionId && req.user?.id) {
      const [s] = await db
        .select()
        .from(kinfolkSessionsTable)
        .where(and(eq(kinfolkSessionsTable.id, sessionId), eq(kinfolkSessionsTable.userId, req.user.id)))
        .limit(1);
      currentSession = s ?? null;
    }

    const existingMessages: SessionMessage[] = currentSession?.messages ?? [];

    // Detect destination from message or session
    const destination = currentSession?.destination ?? null;

    // Fetch platform business catalog for this destination (with identity enrichment)
    let businessCatalog: BusinessCatalogEntry[] = [];
    if (destination) {
      try {
        const bizRows = await db
          .select({
            name: businessesTable.name,
            category: businessesTable.category,
            city: businessesTable.city,
            description: businessesTable.description,
            verified: businessesTable.verified,
            tags: businessesTable.tags,
            story: businessIdentityTable.businessStory,
            missionStatement: businessIdentityTable.missionStatement,
            whyStarted: businessIdentityTable.whyStarted,
            whatCustomersShouldKnow: businessIdentityTable.whatCustomersShouldKnow,
            ownershipBadges: businessIdentityTable.ownershipBadges,
            communityValues: businessIdentityTable.communityValues,
            audiencesServed: businessIdentityTable.audiencesServed,
            vibes: businessIdentityTable.vibes,
            accessibilityFeatures: businessIdentityTable.accessibilityFeatures,
            communityInitiatives: businessIdentityTable.communityInitiatives,
            growthGoals: businessIdentityTable.growthGoals,
          })
          .from(businessesTable)
          .leftJoin(businessIdentityTable, eq(businessIdentityTable.businessId, businessesTable.id))
          .where(and(
            ilike(businessesTable.city, `%${destination}%`),
            eq(businessesTable.status, "active"),
          ))
          .limit(25);
        businessCatalog = bizRows;
      } catch { /* non-critical — proceed without catalog */ }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt({ prefs, likedSpots, dislikedSpots, savedPlaces, destination, neighborVoice, businessCatalog });

    // Build OpenAI messages (history + new message)
    const historyMessages = existingMessages
      .slice(-12) // keep last 12 messages for context
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.role === "assistant"
          ? m.content // just text for history
          : m.content,
      }));

    const aiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...historyMessages,
      { role: "user" as const, content: `${message}${vibes.length ? `\n\n[My vibes for this trip: ${vibes.join(", ")}]` : ""}` },
    ];

    // Call AI
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 8192,
      messages: aiMessages,
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";

    let reply = "Let me think on that for a second — something went sideways on my end.";
    let recommendations: Record<string, unknown> | null = null;
    let followUpSuggestions: string[] = [];
    let detectedDestination: string | null = null;

    try {
      const parsed = JSON.parse(rawContent) as {
        reply?: string;
        recommendations?: Record<string, unknown> | null;
        followUpSuggestions?: string[];
      };
      reply = parsed.reply ?? rawContent;
      recommendations = parsed.recommendations ?? null;
      followUpSuggestions = parsed.followUpSuggestions ?? [];
      if (recommendations && typeof recommendations.destination === "string") {
        detectedDestination = recommendations.destination;
      }
    } catch {
      // If not JSON, just use raw content as reply
      reply = rawContent;
    }

    // Save/update session — skip if user has opted out of memory
    const timestamp = new Date().toISOString();
    const newUserMsg: SessionMessage = { role: "user", content: message, timestamp };
    const newAiMsg: SessionMessage = {
      role: "assistant",
      content: reply,
      recommendations: recommendations ?? undefined,
      followUpSuggestions,
      timestamp: new Date().toISOString(),
    };
    const updatedMessages = [...existingMessages, newUserMsg, newAiMsg];

    let memoryEnabled = true;
    if (req.user?.id) {
      const [userSettings] = await db
        .select({ kinfolkMemoryEnabled: userSettingsTable.kinfolkMemoryEnabled })
        .from(userSettingsTable)
        .where(eq(userSettingsTable.userId, req.user.id))
        .limit(1)
        .catch(() => []);
      if (userSettings?.kinfolkMemoryEnabled === false) memoryEnabled = false;
    }

    let finalSessionId = sessionId;
    if (req.user?.id && memoryEnabled) {
      if (currentSession) {
        await db
          .update(kinfolkSessionsTable)
          .set({
            messages: updatedMessages,
            destination: detectedDestination ?? currentSession.destination,
            updatedAt: new Date(),
          })
          .where(eq(kinfolkSessionsTable.id, currentSession.id));
      } else {
        const title = detectedDestination
          ? `${detectedDestination} Trip`
          : message.length > 40 ? message.slice(0, 40) + "…" : message;
        const [newSession] = await db
          .insert(kinfolkSessionsTable)
          .values({
            userId: req.user.id,
            title,
            destination: detectedDestination,
            vibes: vibes as string[],
            messages: updatedMessages,
          })
          .returning();
        finalSessionId = newSession?.id;
      }
    }

    res.json({ sessionId: finalSessionId, reply, recommendations, followUpSuggestions });
  } catch (err) {
    req.log.error({ err }, "KinfolkAI chat failed");
    res.status(500).json({ error: "Failed to generate response" });
  }
});

// ─── POST /api/kinfolk/business-action-plan ────────────────────────────────────
router.post("/kinfolk/business-action-plan", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  if (!openai) return void res.status(503).json({ error: "AI service unavailable" });

  const { businessName, businessCategory, businessCity, reviews } = req.body as {
    businessName?: string;
    businessCategory?: string;
    businessCity?: string;
    reviews?: Array<{ rating: number; content: string | null }>;
  };

  // Fetch the owner's business identity for personalized advice
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

  const reviewsText = reviews?.length
    ? reviews.map((r) => `- Rating: ${r.rating}/5 | Feedback: ${r.content ?? "(no written feedback)"}`).join("\n")
    : "No community reviews yet.";

  const prompt = `You are an expert Black business advisor helping "${businessName ?? "a business"}" (category: ${businessCategory ?? "General"}, city: ${businessCity ?? "Unknown"}) build an improvement action plan.${identityContext}

COMMUNITY FEEDBACK FROM REVIEWS:
${reviewsText}

Analyze the feedback and generate a practical, budget-conscious action plan that honors the business's mission, values, and growth goals. If no reviews mention specific issues, generate proactive improvements relevant to the business category, community expectations, and the owner's stated goals.

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

Include 3–6 action items. Prioritize accessibility (ADA compliance, wheelchair access, signage) and safety first. Be specific with dollar estimates — research realistic costs for small businesses. Keep language warm, community-centered, and practical.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw) as { summary: string; actionItems: unknown[] };
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Business action plan failed");
    res.status(500).json({ error: "Failed to generate action plan" });
  }
});

// ─── POST /api/kinfolk/expansion-analysis ─────────────────────────────────────
router.post("/kinfolk/expansion-analysis", async (req: Request, res: Response) => {
  if (!req.user?.id) return void res.status(401).json({ error: "Unauthorized" });
  if (!openai) return void res.status(503).json({ error: "AI service unavailable" });

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
    const { neighborhoodSurveysTable } = await import("@workspace/db");
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
    if (citySummary) surveyContext = `Platform community safety data by city: ${citySummary}`;
  } catch { /* non-critical */ }

  const prompt = `You are a business expansion strategist advising a Black-owned ${businessCategory ?? "business"} called "${businessName ?? "this business"}" currently based in ${businessCity ?? "their city"}.${expansionIdentityContext}

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
router.get("/kinfolk/shared/:shareId", async (req: Request, res: Response) => {
  const { shareId } = req.params as { shareId: string };

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
});

export default router;
